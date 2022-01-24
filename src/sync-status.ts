function getCurrentEvents() {
  const calendar = CalendarApp.getDefaultCalendar();
  const start = new Date();
  const end = new Date(start.getTime() + 100);
  return calendar.getEvents(start, end);
}

export function syncStatus() {
  console.log(getCurrentEvents());
}
