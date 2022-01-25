import { getCurrentEvents } from "../calendar/get-events";
import { setOrClearStatus } from "../github/status-client";
import { calculateStatus } from "./calculate-status";

export function syncStatus() {
  return setOrClearStatus(calculateStatus(getCurrentEvents()));
}
