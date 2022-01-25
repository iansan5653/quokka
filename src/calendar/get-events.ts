import { Event } from "./event";

function getCalId(): string {
  const calendar = CalendarApp.getDefaultCalendar();
  return calendar.getId();
}

/**
 * Get the events that are currently happening (within a 1-second window of now).
 */
export function getCurrentEvents(): Event[] {
  const start = new Date(new Date().getTime() - 1000);
  const end = new Date(new Date().getTime() + 1000);

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
    .filter((e) => e.transparency !== "transparent")
    .map(() => ({}));
}
