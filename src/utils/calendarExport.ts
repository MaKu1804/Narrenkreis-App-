import { Excursion } from './clubLogic';

/**
 * Creates Google Calendar web link for an event.
 */
export function getGoogleCalendarUrl(exc: Excursion): string {
  const [year, month, day] = exc.date.split('-');
  const [startH, startM] = (exc.time || '10:00').split(':');

  const startStr = `${year}${month}${day}T${startH.padStart(2, '0')}${startM.padStart(2, '0')}00`;

  let endStr = '';
  if (exc.endTime) {
    const [endH, endM] = exc.endTime.split(':');
    endStr = `${year}${month}${day}T${endH.padStart(2, '0')}${endM.padStart(2, '0')}00`;
  } else {
    // Default 3 hours duration for carnival events
    const endH = (parseInt(startH, 10) + 3) % 24;
    endStr = `${year}${month}${day}T${String(endH).padStart(2, '0')}${startM.padStart(2, '0')}00`;
  }

  const details = [
    `Veranstaltung: ${exc.title}`,
    `Kategorie: ${exc.category}`,
    `Veranstalter: ${exc.organizerName}`,
    exc.meetingPointDetails ? `Treffpunkt-Details: ${exc.meetingPointDetails}` : '',
    exc.comment ? `Hinweise: ${exc.comment}` : '',
    'Narrenkreis Bruchsal — Offizieller Narrenkalender'
  ].filter(Boolean).join('\n\n');

  const location = [exc.locationName, exc.meetingPointDetails].filter(Boolean).join(', ');

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: exc.title,
    dates: `${startStr}/${endStr}`,
    details,
    location
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Generates an .ics file string for one or multiple events.
 */
function buildIcsContent(events: Excursion[]): string {
  const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  const vEvents = events.map((exc) => {
    const [year, month, day] = exc.date.split('-');
    const [startH, startM] = (exc.time || '10:00').split(':');
    const startStr = `${year}${month}${day}T${startH.padStart(2, '0')}${startM.padStart(2, '0')}00`;

    let endStr = '';
    if (exc.endTime) {
      const [endH, endM] = exc.endTime.split(':');
      endStr = `${year}${month}${day}T${endH.padStart(2, '0')}${endM.padStart(2, '0')}00`;
    } else {
      const endH = (parseInt(startH, 10) + 3) % 24;
      endStr = `${year}${month}${day}T${String(endH).padStart(2, '0')}${startM.padStart(2, '0')}00`;
    }

    const description = [
      `Veranstaltung: ${exc.title}`,
      `Kategorie: ${exc.category}`,
      `Veranstalter: ${exc.organizerName}`,
      exc.meetingPointDetails ? `Treffpunkt: ${exc.meetingPointDetails}` : '',
      exc.comment ? `Hinweise: ${exc.comment}` : '',
      'Narrenkreis Bruchsal — Offizieller Narrenkalender'
    ].filter(Boolean).join('\\n');

    const location = [exc.locationName, exc.meetingPointDetails].filter(Boolean).join(', ');
    const uid = `${exc.id}-${exc.date}@narrenkreis-bruchsal.de`;

    return [
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${now}`,
      `DTSTART:${startStr}`,
      `DTEND:${endStr}`,
      `SUMMARY:${exc.title.replace(/,/g, '\\,')}`,
      `DESCRIPTION:${description.replace(/,/g, '\\,')}`,
      `LOCATION:${location.replace(/,/g, '\\,')}`,
      'STATUS:CONFIRMED',
      'END:VEVENT'
    ].join('\r\n');
  }).join('\r\n');

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Narrenkreis Bruchsal//Terminkalender//DE',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Narrenkreis Bruchsal Termine',
    'X-WR-TIMEZONE:Europe/Berlin',
    vEvents,
    'END:VCALENDAR'
  ].join('\r\n');
}

/**
 * Triggers client-side download of an .ics file for iOS/Apple Calendar, Outlook, Android.
 */
export function downloadIcsForEvent(exc: Excursion): void {
  const ics = buildIcsContent([exc]);
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const filename = `${exc.title.replace(/[^a-zA-Z0-9äöüÄÖÜß_-]/g, '_')}.ics`;
  triggerDownload(blob, filename);
}

/**
 * Downloads all events in a single .ics calendar feed file.
 */
export function downloadAllEventsAsIcs(events: Excursion[]): void {
  if (events.length === 0) return;
  const ics = buildIcsContent(events);
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  triggerDownload(blob, 'Narrenkreis_Bruchsal_Termine.ics');
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
