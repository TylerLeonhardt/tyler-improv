/**
 * Show data model, validation, and date helpers.
 *
 * Pure module (no filesystem access) so it can be unit-tested and reused by
 * pages, .ics endpoints, and the data validation test.
 */
import { z } from "zod";

/** All show times in shows.json are local Seattle time. */
export const TIME_ZONE = "America/Los_Angeles";
export const DEFAULT_VENUE = "Seattle Comedy Theater";
export const DEFAULT_DURATION_MINUTES = 90;

/** Venues we know a website for. Anything else is shown as plain text. */
export const KNOWN_VENUES: Record<string, string> = {
	"Seattle Comedy Theater": "https://seattlecomedytheater.com",
};

export const KNOWN_VENUE_MAPS: Record<string, string> = {
	"Seattle Comedy Theater": "https://www.google.com/maps?cid=2517434607297078199",
};

function isRealDate(value: string): boolean {
	const [y, m, d] = value.split("-").map(Number);
	const dt = new Date(Date.UTC(y, m - 1, d));
	return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

function isHttpUrl(value: string): boolean {
	try {
		const url = new URL(value);
		return url.protocol === "https:" || url.protocol === "http:";
	} catch {
		return false;
	}
}

const nonEmpty = (field: string) =>
	z.string({ error: `${field} must be a string` }).trim().min(1, `${field} must not be empty`);

export const ShowSchema = z
	.object({
		date: z
			.string({ error: 'date is required, e.g. "2026-11-14"' })
			.regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD, e.g. "2026-11-14"')
			.refine(isRealDate, "date is not a real calendar date"),
		time: z
			.string({ error: 'time is required, e.g. "19:30"' })
			.regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'time must be 24-hour HH:MM Seattle time, e.g. "19:30" for 7:30 PM'),
		type: nonEmpty("type"),
		title: nonEmpty("title").optional(),
		venue: nonEmpty("venue").optional(),
		ticketUrl: z
			.string({ error: "ticketUrl must be a string" })
			.regex(/^\S+$/, "ticketUrl must not contain spaces or line breaks")
			.refine(isHttpUrl, "ticketUrl must be a full http(s) URL, e.g. https://...")
			.transform((v) => new URL(v).href)
			.optional(),
		notes: nonEmpty("notes").optional(),
		durationMinutes: z
			.number({ error: "durationMinutes must be a number" })
			.int("durationMinutes must be a whole number")
			.min(15, "durationMinutes must be at least 15")
			.max(480, "durationMinutes must be at most 480")
			.optional(),
	})
	.strict();

export const ShowsFileSchema = z.array(ShowSchema, { error: "shows.json must be a JSON array of shows" });

export type RawShow = z.infer<typeof ShowSchema>;

export interface Show extends RawShow {
	/** Stable unique id, e.g. "2026-11-14-1930-friday-night-ensemble". */
	id: string;
	/** Slug of the show type, used for the image filename. */
	typeSlug: string;
	/** What to display as the headline (title if set, otherwise type). */
	displayName: string;
	venue: string;
	venueUrl?: string;
	venueMapUrl?: string;
	start: Date;
	end: Date;
}

/** "Friday Night Ensemble" -> "friday-night-ensemble" */
export function slugify(value: string): string {
	return value
		.normalize("NFKD")
		.replace(/[\u0300-\u036f]/g, "")
		.toLowerCase()
		.replace(/&/g, " and ")
		.replace(/['’]/g, "")
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
}

/** Offset (ms) of `timeZone` from UTC at the given instant. */
function tzOffsetMs(instant: Date, timeZone: string): number {
	const parts = new Intl.DateTimeFormat("en-US", {
		timeZone,
		hourCycle: "h23",
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
	}).formatToParts(instant);
	const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
	const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
	return asUtc - instant.getTime();
}

/** Convert a wall-clock date + time in `timeZone` to an absolute Date. */
export function zonedTimeToDate(date: string, time: string, timeZone = TIME_ZONE): Date {
	const [y, m, d] = date.split("-").map(Number);
	const [hh, mm] = time.split(":").map(Number);
	const wallAsUtc = Date.UTC(y, m - 1, d, hh, mm);
	let guess = wallAsUtc - tzOffsetMs(new Date(wallAsUtc), timeZone);
	// Second pass handles instants near DST transitions.
	guess = wallAsUtc - tzOffsetMs(new Date(guess), timeZone);
	return new Date(guess);
}

function describe(raw: unknown, index: number): string {
	if (raw && typeof raw === "object") {
		const r = raw as Record<string, unknown>;
		const bits = [r.date, r.time, r.type].filter((v) => typeof v === "string");
		if (bits.length) return `show #${index + 1} (${bits.join(" ")})`;
	}
	return `show #${index + 1}`;
}

export class ShowsValidationError extends Error {
	constructor(public readonly problems: string[]) {
		super(`shows.json has ${problems.length} problem(s):\n  - ${problems.join("\n  - ")}`);
		this.name = "ShowsValidationError";
	}
}

/**
 * Validate raw JSON and turn it into enriched, sorted Show objects.
 * Throws ShowsValidationError with human-friendly messages on bad data.
 */
export function parseShows(raw: unknown): Show[] {
	const result = ShowsFileSchema.safeParse(raw);
	if (!result.success) {
		const problems = result.error.issues.map((issue) => {
			const [index, field] = issue.path;
			if (typeof index !== "number") return issue.message;
			const where = describe((raw as unknown[])[index], index);
			if (issue.code === "unrecognized_keys") {
				return `${where}: unknown field(s) ${issue.keys.map((k) => `"${k}"`).join(", ")}. Allowed: date, time, type, title, venue, ticketUrl, notes, durationMinutes`;
			}
			return field === undefined ? `${where}: ${issue.message}` : `${where} → ${String(field)}: ${issue.message}`;
		});
		throw new ShowsValidationError(problems);
	}

	const seen = new Map<string, number>();
	const problems: string[] = [];
	const shows = result.data.map((s, i): Show => {
		const typeSlug = slugify(s.type);
		if (!typeSlug) problems.push(`${describe(s, i)} → type: must contain at least one letter or number`);
		const id = `${s.date}-${s.time.replace(":", "")}-${slugify(s.title ?? s.type)}`;
		if (seen.has(id)) {
			problems.push(`${describe(s, i)}: duplicate of show #${(seen.get(id) ?? 0) + 1} (same date, time, and name)`);
		}
		seen.set(id, i);
		const venue = s.venue ?? DEFAULT_VENUE;
		const start = zonedTimeToDate(s.date, s.time);
		const end = new Date(start.getTime() + (s.durationMinutes ?? DEFAULT_DURATION_MINUTES) * 60_000);
		return {
			...s,
			id,
			typeSlug,
			displayName: s.title ?? s.type,
			venue,
			venueUrl: KNOWN_VENUES[venue],
			venueMapUrl: KNOWN_VENUE_MAPS[venue],
			start,
			end,
		};
	});
	if (problems.length) throw new ShowsValidationError(problems);

	return shows.sort((a, b) => a.start.getTime() - b.start.getTime());
}

/** A show is "past" once it has ended. Past shows are returned most-recent first. */
export function splitShows(shows: Show[], now = new Date()): { upcoming: Show[]; past: Show[] } {
	const upcoming = shows.filter((s) => s.end.getTime() > now.getTime());
	const past = shows.filter((s) => s.end.getTime() <= now.getTime()).reverse();
	return { upcoming, past };
}

const fmt = (opts: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("en-US", { timeZone: TIME_ZONE, ...opts });
const weekdayFmt = fmt({ weekday: "short" });
const monthFmt = fmt({ month: "short" });
const dayFmt = fmt({ day: "numeric" });
const timeFmt = fmt({ hour: "numeric", minute: "2-digit" });
const longFmt = fmt({ weekday: "long", month: "long", day: "numeric", year: "numeric" });

export function formatParts(show: Show) {
	return {
		weekday: weekdayFmt.format(show.start),
		month: monthFmt.format(show.start),
		day: dayFmt.format(show.start),
		time: timeFmt.format(show.start),
		long: longFmt.format(show.start),
	};
}

/** Deterministic hue (0-359) for placeholder art, so each type gets its own color. */
export function hueFor(slug: string): number {
	let h = 0;
	for (const ch of slug) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
	return h % 360;
}
