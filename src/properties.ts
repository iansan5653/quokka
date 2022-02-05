import { Status } from "./github/status";

export const EVENT_BATCH_DURATION_HOURS = 24;
export const DEFAULT_STATUS: Status = { message: "In a meeting", emoji: "calendar", busy: false };
export const EVENT_ADJACENCY_TOLERANCE_MINUTES = 5;
