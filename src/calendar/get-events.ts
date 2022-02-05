import {
  EVENT_ADJACENCY_TOLERANCE_MINUTES,
  EVENT_BATCH_DURATION_HOURS,
  MAX_BATCH_SIZE,
} from "../properties";
import { compareAscending, isBefore, plusHours, plusMinutes, plusSeconds } from "../util/dates";

export interface Event {
  start: Date;
  end: Date;
  id: string;
}

function getCalId(): string {
  const calendar = CalendarApp.getDefaultCalendar();
  return calendar.getId();
}

interface EventsBatch {
  events: Event[];
  calendarId: string;
  rebatchAt: Date;
}

type TypedEvent = GoogleAppsScript.Calendar.Schema.Event & {
  // This field is missing in the type definitions
  eventType: "default" | "outOfOffice" | "focusTime";
};

/**
 * Eliminate overlapping and close-together events; we assume it's not worth clearing
 * status for less than that time).
 */
function reduceEvents(events: Event[]) {
  const reduced: Event[] = [];
  events.forEach((event) => {
    const lastEvent = reduced[reduced.length - 1];
    if (
      lastEvent &&
      isBefore(event.start, plusMinutes(lastEvent.end, EVENT_ADJACENCY_TOLERANCE_MINUTES))
    ) {
      lastEvent.end = event.end;
    } else {
      reduced.push(event);
    }
  });
  console.log(
    `Reduced ${events.length} different events down to ${reduced.length} combined events`
  );
  return reduced;
}

function processResponseItems(
  responseEvents: GoogleAppsScript.Calendar.Schema.Event[],
  minStartTime: Date
): Event[] {
  return reduceEvents(
    responseEvents
      // Always ignore events where the user set "Show me as available" or are deleted
      .filter(
        (e) =>
          e.transparency !== "transparent" &&
          e.start?.dateTime &&
          e.end?.dateTime &&
          e.id &&
          e.status !== "cancelled" &&
          ((e as TypedEvent).eventType === "outOfOffice" || e.summary?.includes("OOO"))
      )
      .map((e) => ({
        start: new Date(e.start!.dateTime!),
        end: new Date(e.end!.dateTime!),
        id: e.id!,
      }))
      // The API field timeMin is an *end-time* filter, so we adjust the start time for
      // events that may have started before our window began
      .map((e) => ({ ...e, start: isBefore(e.start, minStartTime) ? minStartTime : e.start }))
      .sort((a, b) => compareAscending(a.start, b.start))
  );
}

/**
 * Get a full batch of all events in the next batch duration.
 * @param after1Hour If this get is part of a time-based trigger handler, we cannot schedule
 * a status update within one hour of now, so set this to `true` to prevent returning events
 * within one hour of now.
 */
export function getAllEvents(after1Hour: boolean = true): EventsBatch {
  // If not adding an hour, add 30 seconds to avoid scheduling trigger too fast for currently-running events
  const start = after1Hour ? plusHours(new Date(), 1) : plusSeconds(new Date(), 30);
  // We always add an hour to the end date. This means that if after1Hour is false, our total
  // batch duration will actually be one hour larger than specified. But this allows us to
  // have some overlap so that we have loaded extra events for the next time-based trigger call.
  const end = plusHours(new Date(), EVENT_BATCH_DURATION_HOURS + 1);

  const params = {
    timeMin: start.toISOString(),
    timeMax: end.toISOString(),
    singleEvents: true,
    showDeleted: false,
  };

  const calendarId = getCalId();

  // Even though we have a max batch size, we query to get ALL events in the window because
  // we will filter out / combine most of them so we only end up with a fraction of the real
  // number of calendar events.
  const pages = [Calendar.Events!.list(calendarId, params)];
  let pageToken = pages[0].nextPageToken;
  while (pageToken) {
    const page = Calendar.Events!.list(calendarId, { pageToken, singleEvents: true });
    pageToken = page.nextPageToken;
    pages.push(page);
  }

  const events = processResponseItems(
    pages.flatMap((page) => page.items ?? []),
    start
  );

  if (events.length > MAX_BATCH_SIZE) {
    console.log(
      `Too many events returned. Will enqueue ${MAX_BATCH_SIZE} for now and rebatch early`
    );
    return {
      calendarId,
      events: events.slice(0, MAX_BATCH_SIZE),
      rebatchAt: events[events.length - 1].end,
    };
  } else {
    return { events, calendarId, rebatchAt: plusHours(new Date(), EVENT_BATCH_DURATION_HOURS) };
  }
}
