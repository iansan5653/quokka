import { getBatchEvents } from "../calendar/get-events";
import { Status } from "../github/status";
import { setOrClearStatus } from "../github/status-client";
import { DEFAULT_STATUS, EVENT_BATCH_DURATION_MS } from "../properties";

const PROPERTY_PREFIX = "statusEndTime_";

function clearLoadedTriggers() {
  console.log(`Clearing previously created onEventStart or onRefresh triggers`);
  const userProps = PropertiesService.getUserProperties();

  let count = 0;
  for (const trigger of ScriptApp.getProjectTriggers()) {
    const handler = trigger.getHandlerFunction();
    if (handler === "onEventStart" || handler === "onRefresh") {
      ScriptApp.deleteTrigger(trigger);
      count++;
    }

    if (trigger.getHandlerFunction() === "onEventStart")
      userProps.deleteProperty(PROPERTY_PREFIX + trigger.getUniqueId());
  }

  console.log(`Finished clearing ${count} triggers`);
}

export function loadNextBatch() {
  clearLoadedTriggers();

  const userProps = PropertiesService.getUserProperties();
  const events = getBatchEvents();
  console.log(`Creating triggers for batch of ${events.length} events`);

  for (const event of getBatchEvents()) {
    const trigger = ScriptApp.newTrigger("onEventStart").timeBased().at(event.start).create();
    const id = trigger.getUniqueId();
    userProps.setProperty(PROPERTY_PREFIX + id, event.end.toISOString());
    console.log(
      `Created trigger (ID: ${id}) starting at ${event.start} and saved end time ${event.end}`
    );
  }

  const nextBatchTrigger = ScriptApp.newTrigger("onRefresh")
    .timeBased()
    .after(EVENT_BATCH_DURATION_MS)
    .create();
  console.log(
    `Scheduled next batch to load in ${EVENT_BATCH_DURATION_MS} ms (trigger ID ${nextBatchTrigger.getUniqueId()})`
  );
  console.log("Finished creating triggers");
}

export function onRefresh() {
  loadNextBatch();
}

export function onEventStart(e: GoogleAppsScript.Events.AppsScriptEvent) {
  const endTime = PropertiesService.getUserProperties().getProperty(PROPERTY_PREFIX + e.triggerUid);
  console.log(
    `Setting status for event with trigger ID ${e.triggerUid}. Event has end time ${endTime}.`
  );
  if (endTime === null) {
    console.warn(`No end time found for trigger with ID ${e.triggerUid}. Ignoring this event.`);
    return;
  }
  const status: Status = { ...DEFAULT_STATUS, expiresAt: new Date(endTime) };
  setOrClearStatus(status);
}
