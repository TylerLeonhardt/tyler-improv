/** Minimal RFC 5545 calendar generation for shows. */
import type { Show } from "./shows";

const PRODID = "-//Tyler Leonhardt//Improv Shows//EN";

export function icsEscape(text: string): string {
	return text.replace(/\\/g, "\\\\").replace(/\r?\n/g, "\\n").replace(/([,;])/g, "\\$1");
}

const encoder = new TextEncoder();

/** Fold lines longer than 75 octets (RFC 5545 §3.1). */
export function foldLine(line: string): string {
	if (encoder.encode(line).length <= 75) return line;
	const out: string[] = [];
	let current = "";
	let currentLen = 0;
	let limit = 75;
	for (const ch of line) {
		const len = encoder.encode(ch).length;
		if (currentLen + len > limit) {
			out.push(current);
			current = "";
			currentLen = 0;
			limit = 74; // continuation lines start with a space
		}
		current += ch;
		currentLen += len;
	}
	out.push(current);
	return out.join("\r\n ");
}

export function icsDate(date: Date): string {
	return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

export function eventSummary(show: Show): string {
	return `Tyler @ ${show.displayName}`;
}

export function eventDescription(show: Show, siteUrl: string): string {
	const lines: string[] = [];
	if (show.title && show.title !== show.type) lines.push(show.type);
	if (show.notes) lines.push(show.notes);
	if (show.ticketUrl) lines.push(`Tickets: ${show.ticketUrl}`);
	lines.push(`More shows: ${siteUrl}`);
	return lines.join("\n");
}

function vevent(show: Show, siteUrl: string, stamp: Date): string[] {
	return [
		"BEGIN:VEVENT",
		`UID:${show.id}@tyler-improv`,
		`DTSTAMP:${icsDate(stamp)}`,
		`DTSTART:${icsDate(show.start)}`,
		`DTEND:${icsDate(show.end)}`,
		`SUMMARY:${icsEscape(eventSummary(show))}`,
		`LOCATION:${icsEscape(show.venue)}`,
		`DESCRIPTION:${icsEscape(eventDescription(show, siteUrl))}`,
		`URL:${show.ticketUrl ?? siteUrl}`,
		"END:VEVENT",
	];
}

/**
 * Seattle time zone definition. Event times are emitted in UTC, but we always
 * include this so the calendar has at least one component even with zero
 * shows (RFC 5545 requires one; some clients reject empty feeds).
 */
const VTIMEZONE = [
	"BEGIN:VTIMEZONE",
	"TZID:America/Los_Angeles",
	"BEGIN:DAYLIGHT",
	"TZOFFSETFROM:-0800",
	"TZOFFSETTO:-0700",
	"TZNAME:PDT",
	"DTSTART:19700308T020000",
	"RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU",
	"END:DAYLIGHT",
	"BEGIN:STANDARD",
	"TZOFFSETFROM:-0700",
	"TZOFFSETTO:-0800",
	"TZNAME:PST",
	"DTSTART:19701101T020000",
	"RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU",
	"END:STANDARD",
	"END:VTIMEZONE",
];

export function buildCalendar(shows: Show[], siteUrl: string, opts: { name?: string; stamp?: Date } = {}): string {
	const stamp = opts.stamp ?? new Date();
	const lines = [
		"BEGIN:VCALENDAR",
		"VERSION:2.0",
		`PRODID:${PRODID}`,
		"CALSCALE:GREGORIAN",
		"METHOD:PUBLISH",
		...(opts.name
			? [`X-WR-CALNAME:${icsEscape(opts.name)}`, "REFRESH-INTERVAL;VALUE=DURATION:PT12H", "X-PUBLISHED-TTL:PT12H"]
			: []),
		"X-WR-TIMEZONE:America/Los_Angeles",
		...VTIMEZONE,
		...shows.flatMap((s) => vevent(s, siteUrl, stamp)),
		"END:VCALENDAR",
	];
	return `${lines.map(foldLine).join("\r\n")}\r\n`;
}

export function googleCalendarUrl(show: Show, siteUrl: string): string {
	const params = new URLSearchParams({
		action: "TEMPLATE",
		text: eventSummary(show),
		dates: `${icsDate(show.start)}/${icsDate(show.end)}`,
		details: eventDescription(show, siteUrl),
		location: show.venue,
	});
	return `https://calendar.google.com/calendar/render?${params}`;
}
