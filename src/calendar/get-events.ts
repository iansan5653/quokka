import { EVENT_ADJACENCY_TOLERANCE_MINUTES, EVENT_BATCH_DURATION_HOURS } from "../properties";
import { compareAscending, isBefore, plusHours, plusMinutes } from "../util/dates";

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
}

type TypedEvent = GoogleAppsScript.Calendar.Schema.Event & {
  // This field is missing in the type definitions
  eventType: "default" | "outOfOffice" | "focusTime";
};

/**
 * We can only set one event per hour. If more events than that are returned,
 * combine them. Also, eliminate overlapping and close-together events; we assume it's not
 * worth clearing status for less than that time).
 */
function reduceEvents(events: Event[]) {
  const reduced: Event[] = [];
  events.forEach((event) => {
    const lastEvent = reduced[reduced.length - 1];
    if (
      lastEvent &&
      (isBefore(event.start, plusMinutes(lastEvent.end, EVENT_ADJACENCY_TOLERANCE_MINUTES)) ||
        isBefore(event.start, plusHours(lastEvent.start, 1)))
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

function processResponseItems(responseEvents: GoogleAppsScript.Calendar.Schema.Event[]): Event[] {
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
      .sort((a, b) => compareAscending(a.start, b.start))
  );
}

function queryAllPages(params: Record<string, boolean | string>): EventsBatch {
  const calendarId = getCalId();

  const pages = [Calendar.Events!.list(calendarId, params)];
  let pageToken = pages[0].nextPageToken;
  while (pageToken) {
    const page = Calendar.Events!.list(calendarId, { pageToken, singleEvents: true });
    pageToken = page.nextPageToken;
    pages.push(page);
  }

  console.log(JSON.stringify(pages));

  const events = processResponseItems(pages.flatMap((page) => page.items ?? []));
  return { events, calendarId };
}

/**
 * Get a full batch of all events in the next batch duration.
 */
export function getAllEvents(): EventsBatch {
  const start = new Date();
  const end = plusHours(start, EVENT_BATCH_DURATION_HOURS);

  const params = {
    timeMin: start.toISOString(),
    timeMax: end.toISOString(),
    singleEvents: true,
    showDeleted: false,
  };

  return queryAllPages(params);
}
