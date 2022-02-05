export function secondsToMillis(seconds: number) {
  return seconds * 1000
}

export function minutesToMillis(minutes: number) {
  return secondsToMillis(minutes * 60);
}

export function hoursToMillis(hours: number) {
  return minutesToMillis(hours * 60);
}

export function plusMinutes(date: Date, minutes: number) {
  const millis = minutes * 60 * 1000;
  return new Date(date.getTime() + millis);
}

export function plusHours(date: Date, hours: number) {
  return plusMinutes(date, hours * 60);
}

/** True if a is after b. */
export function isAfter(a: Date, b: Date) {
  return a.getTime() > b.getTime();
}

export function isEqual(a: Date, b: Date) {
  return a.getTime() === b.getTime();
}

/** True if a before b. */
export function isBefore(a: Date, b: Date) {
  return !isEqual(a, b) && !isAfter(a, b);
}

/** Compare to sort such that the earlier date is first. */
export function compareAscending(a: Date, b: Date): 1 | 0 | -1 {
  return isBefore(a, b) ? -1 : isAfter(a, b) ? 1 : 0
}

/** Compare to sort such that the later date is first. */
export function compareDescending(a: Date, b: Date): 1 | 0 | -1 {
  return compareAscending(a, b) * -1 as 1 | 0 | -1
}
