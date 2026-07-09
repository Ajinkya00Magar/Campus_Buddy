/**
 * Calendar export helpers — no API keys required.
 *  - downloadIcs(): a universal .ics file (Apple/Outlook/Google all import it).
 *  - googleCalendarUrl(): an "Add to Google Calendar" template link (no OAuth).
 * Full two-way Google/Outlook sync would need OAuth; these cover the common case.
 */

export interface CalendarEvent {
  title: string
  description?: string | null
  location?: string | null
  startISO: string
  /** Defaults to start + 2h if omitted. */
  endISO?: string
}

function toCalDate(iso: string): string {
  // YYYYMMDDTHHMMSSZ (UTC)
  return new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

function defaultEnd(startISO: string): string {
  return new Date(new Date(startISO).getTime() + 2 * 60 * 60 * 1000).toISOString()
}

function escapeIcs(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
}

export function buildIcs(e: CalendarEvent): string {
  const end = e.endISO ?? defaultEnd(e.startISO)
  const uid = `${toCalDate(e.startISO)}-${Math.abs(hash(e.title))}@campusbuddy`
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Campus Buddy//MITAOE//EN',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${toCalDate(new Date().toISOString())}`,
    `DTSTART:${toCalDate(e.startISO)}`,
    `DTEND:${toCalDate(end)}`,
    `SUMMARY:${escapeIcs(e.title)}`,
    e.description ? `DESCRIPTION:${escapeIcs(e.description)}` : '',
    e.location ? `LOCATION:${escapeIcs(e.location)}` : '',
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean).join('\r\n')
}

export function downloadIcs(e: CalendarEvent): void {
  const blob = new Blob([buildIcs(e)], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${e.title.replace(/[^a-z0-9]+/gi, '-').slice(0, 40) || 'event'}.ics`
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function googleCalendarUrl(e: CalendarEvent): string {
  const end = e.endISO ?? defaultEnd(e.startISO)
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: e.title,
    dates: `${toCalDate(e.startISO)}/${toCalDate(end)}`,
    details: e.description ?? '',
    location: e.location ?? '',
  })
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

function hash(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i) | 0
  return h
}
