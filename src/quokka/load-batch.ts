import { Event, getAllEvents, getChangedEvents } from "../calendar/get-events";
import { Status } from "../github/status";
import { setOrClearStatus } from "../github/status-client";
import { DEFAULT_STATUS, EVENT_BATCH_DURATION_HOURS } from "../properties";
import { hoursToMillis } from "../util/dates";
import { BatchItem, currentBatchSyncToken } from "./settings";

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
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(0)) {
    console.info("Quitting because a batch load is already in progress.");
    return;
  }

  clearLoadedTriggers();

  const { events, syncToken, calendarId } = getAllEvents();
  console.log(`Creating triggers for batch of ${events.length} events`);

  currentBatchSyncToken.set(syncToken);
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
    `Scheduled sync to run on event updates (trigger ID ${syncTrigger.getUniqueId()}, sync token ${syncToken})`
  );

  lock.releaseLock();
}

/**
 * If a valid sync token is stored, query it and update the current batch with the latest
 * changes. Otherwise, loads the next batch.
 */
export function syncCurrentBatch() {
  const syncToken = currentBatchSyncToken.get();
  console.log(`Updating the current batch using sync token ${syncToken}`);

  if (!syncToken) {
    console.warn("No sync token found. Loading the next batch instead");
    loadNextBatch();
    return;
  }

  const syncResponse = getChangedEvents(syncToken);
  if (!syncResponse) {
    console.warn("Calendar app rejected sync token. Loading the next batch instead");
    loadNextBatch();
    return;
  }

  currentBatchSyncToken.set(syncResponse.syncToken);

  const projectTriggersById = new Map(
    ScriptApp.getProjectTriggers().map((t) => [t.getUniqueId(), t])
  );

  console.log(`${syncResponse.events.length} events changed sync last sync`);

  for (const event of syncResponse.events) {
    const triggerId = BatchItem.getTriggerId(event.id);

    // cleanup
    if (triggerId) {
      const trigger = projectTriggersById.get(triggerId);
      if (trigger) ScriptApp.deleteTrigger(trigger);
    }
    BatchItem.delete(event.id, triggerId);

    // requeue with new data
    createTriggerAndStoreEvent(event);
  }
}

export function onRefresh() {
  loadNextBatch();
}

export function onSync() {
  syncCurrentBatch();
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
