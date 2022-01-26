import { EVENT_BATCH_DURATION_MS } from "../properties";

export interface Event {
  start: Date;
  end: Date;
}

function getCalId(): string {
  const calendar = CalendarApp.getDefaultCalendar();
  return calendar.getId();
}

/**
 * Get the events that are currently happening (within a 1-second window of now).
 */
export function getBatchEvents(): Event[] {
  const start = new Date();
  const end = new Date(start.getTime() + EVENT_BATCH_DURATION_MS);

  const allCurrentEvents =
    Calendar.Events?.list(getCalId(), {
      timeMin: start.toISOString(),
      timeMax: end.toISOString(),
      singleEvents: true,
      orderBy: "startTime",
      showDeleted: false,
    }).items ?? [];

  // Always ignore events where the user set "Show me as available"
  return allCurrentEvents
    .filter((e) => e.transparency !== "transparent" && e.start?.dateTime && e.end?.dateTime)
    .map((e) => ({ start: new Date(e.start!.dateTime!), end: new Date(e.end!.dateTime!) }));
}
