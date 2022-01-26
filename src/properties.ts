import { Status } from "./github/status";

export const EVENT_BATCH_DURATION_MS = 6 * 60 * 60 * 1000;
export const DEFAULT_STATUS: Status = { message: "In a meeting", emoji: "calendar", busy: false };
