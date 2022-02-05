import { Status } from "./github/status";

export const EVENT_BATCH_DURATION_HOURS = 24;
export const DEFAULT_STATUS: Status = { message: "Out of office", emoji: "beach", busy: true };
export const EVENT_ADJACENCY_TOLERANCE_MINUTES = 5;
// Users are limited to twenty scheduled triggers, and we need room for rebatch, sync, and debounce triggers
export const MAX_BATCH_SIZE = 15
