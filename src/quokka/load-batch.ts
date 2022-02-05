import { Event, getAllEvents } from "../calendar/get-events";
import { Status } from "../github/status";
import { setOrClearStatus } from "../github/status-client";
import { DEFAULT_STATUS, EVENT_BATCH_DURATION_HOURS } from "../properties";
import { hoursToMillis } from "../util/dates";
import { BatchItem } from "./settings";

function clearLoadedTriggers() {
  console.log(`Clearing previously created onEventStart or onRefresh triggers`);

  let count = 0;
  for (const trigger of ScriptApp.getProjectTriggers()) {
    const handler = trigger.getHandlerFunction();
    const id = trigger.getUniqueId();

    if (handler === "onEventStart" || handler === "onRefresh" || handler === "onSync") {
      ScriptApp.deleteTrigger(trigger);
      count++;
    }

    if (handler === "onEventStart") {
      // Cleanup item storage to avoid running out of space
      BatchItem.deleteByTriggerId(id);
    }
  }

  console.log(`Finished clearing ${count} triggers`);
}

function createTriggerAndStoreEvent(event: Event) {
  const trigger = ScriptApp.newTrigger("onEventStart").timeBased().at(event.start).create();
  const triggerId = trigger.getUniqueId();
  BatchItem.set(event.id, triggerId, event.end);
  console.log(
    `Created trigger (ID ${triggerId}) for event ${event.id} starting at ${event.start}. Stored event end time ${event.end}`
  );
}

/**
 * Delete all the currently batched triggers and enqueue the next batch of triggers.
 */
export function loadNextBatch() {
  // Loading the next batch resets the app state, so there's no point in running it in
  // parallel and it can cause errors because triggers are being created and deleted at
  // the same time. We can just fail if a batch is already being loaded.
  // This is likely to happen if the user makes a lot of changes at once.
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(0)) {
    console.info("Quitting because a batch load is already in progress.");
    return;
  }

  clearLoadedTriggers();

  const { events, calendarId } = getAllEvents();
  console.log(`Creating triggers for batch of ${events.length} events`);

  events.forEach(createTriggerAndStoreEvent);

  const nextBatchTrigger = ScriptApp.newTrigger("onRefresh")
    .timeBased()
    .after(hoursToMillis(EVENT_BATCH_DURATION_HOURS))
    .create();
  console.log(
    `Scheduled next batch to load in ${EVENT_BATCH_DURATION_HOURS} hours (trigger ID ${nextBatchTrigger.getUniqueId()})`
  );

  const syncTrigger = ScriptApp.newTrigger("onSync")
    .forUserCalendar(calendarId)
    .onEventUpdated()
    .create();
  console.log(
    `Scheduled re-batch to run on event updates (trigger ID ${syncTrigger.getUniqueId()})`
  );

  lock.releaseLock();
}

export function onRefresh() {
  loadNextBatch();
}

export function onSync() {
  // We could save the sync token when we get events so that only the changed events have
  // to be updated, but it's complicated because we combine adjacent events together - if
  // only one of those gets updated, we don't have a way to break them apart and combine
  // back together.
  loadNextBatch();
}

export function onEventStart(e: GoogleAppsScript.Events.AppsScriptEvent) {
  const endTime = BatchItem.getEvent(e.triggerUid)?.endTimeIso;

  // Have to clean up the storage since it won't get deleted by clearLoadedTriggers later
  // if the trigger has already been called.
  BatchItem.deleteByTriggerId(e.triggerUid);

  console.log(
    `Setting status for event with trigger ID ${e.triggerUid}. Event has end time ${endTime}.`
  );

  if (!endTime) {
    console.warn(`No end time found for trigger with ID ${e.triggerUid}. Ignoring this event.`);
    return;
  }

  const status: Status = { ...DEFAULT_STATUS, expiresAt: new Date(endTime) };
  setOrClearStatus(status);
}
