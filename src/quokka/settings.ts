const userProperties = () => PropertiesService.getUserProperties();

interface ValueTransformer<T> {
  toT: (str: string) => T;
  fromT: (t: T) => string;
}

const stringTransformer: ValueTransformer<string> = {
  toT: (str) => str,
  fromT: (t) => t,
};

const jsonTransformer: ValueTransformer<any> = {
  toT: (str) => JSON.parse(str),
  fromT: (t) => JSON.stringify(t),
};

function SettingAccessor<T>(key: string, { toT, fromT }: ValueTransformer<T>) {
  const get = () => {
    const value = userProperties().getProperty(key);
    return value === null ? null : toT(value);
  };
  const set = (value: T | null) =>
    value === null
      ? userProperties().deleteProperty(key)
      : userProperties().setProperty(key, fromT(value));
  return { get, set };
}

export const githubAccessToken = SettingAccessor("githubAccessToken", stringTransformer);

export const currentBatchSyncToken = SettingAccessor("currentBatchSyncToken", stringTransformer);

const batchItemTrigger = (eventId: string) =>
  SettingAccessor(`batchItem_triggerFor_${eventId}`, stringTransformer);

interface BatchItemEventEntry {
  endTimeIso: string;
  eventId: string;
}

const batchItemEvent = (triggerId: string) =>
  SettingAccessor<BatchItemEventEntry>(`batchItem_endTime_${triggerId}`, jsonTransformer);

/**
 * Batch items are stored as two entries - one mapping the `triggerId` to the `event`,
 * and one mapping the `eventId` to the `triggerId`. This way we can efficiently fetch both.
 * This makes them much more complicated to manage.
 */
export class BatchItem {
  public static set(eventId: string, triggerId: string, eventEndTime: Date) {
    batchItemTrigger(eventId).set(triggerId)
    batchItemEvent(triggerId).set({eventId, endTimeIso: eventEndTime.toISOString()})
  }

  /**
   * Delete the entries for this item. Both IDs should be provided, but in the situation
   * where the storage is missing one of the entries, you can still delete the other by
   * setting the unknown fields to `null`.
   * This is faster than `deleteByTriggerId` since no extra lookups are required.
   */
  public static delete(eventId: string | null, triggerId: string | null) {
    if (eventId) batchItemTrigger(eventId).set(null)
    if (triggerId) batchItemEvent(triggerId).set(null)
  }

  public static deleteByTriggerId(triggerId: string) {
    const eventId = BatchItem.getEvent(triggerId)?.eventId ?? null
    BatchItem.delete(eventId, triggerId)
  }
  
  public static getTriggerId(eventId: string) {
    return batchItemTrigger(eventId).get()
  }

  public static getEvent(triggerId: string) {
    return batchItemEvent(triggerId).get()
  }
}
