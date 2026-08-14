export function urlWebcal(agendaIcsUrl) {
  return agendaIcsUrl.replace(/^https?:\/\//, "webcal://");
}

export function urlAdicionarGoogleCalendar(agendaIcsUrl) {
  return `https://calendar.google.com/calendar/render?cid=${encodeURIComponent(
    urlWebcal(agendaIcsUrl),
  )}`;
}
