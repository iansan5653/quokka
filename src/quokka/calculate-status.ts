import { Event } from "../calendar/event";
import { Status } from "../github/status";

export function calculateStatus(events: Event[]): Status | null {
  return events.length > 0
    ? { message: "In a meeting", emoji: "calendar", busy: false }
    : null;
}
