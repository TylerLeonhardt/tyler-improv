import { describe, expect, it } from "vitest";
import { parseShows, ShowsValidationError, slugify, splitShows, zonedTimeToDate } from "../src/lib/shows";

const base = { date: "2030-01-11", time: "19:30", type: "Friday Night Ensemble" };

function problemsFor(raw: unknown): string[] {
	try {
		parseShows(raw);
	} catch (err) {
		if (err instanceof ShowsValidationError) return err.problems;
		throw err;
	}
	return [];
}

describe("slugify", () => {
	it.each([
		["Friday Night Ensemble", "friday-night-ensemble"],
		["Dollbrick Improv", "dollbrick-improv"],
		["Harold Night!", "harold-night"],
		["Tyler's Jam & Friends", "tylers-jam-and-friends"],
		["Café Show", "cafe-show"],
		["  Spaces  ", "spaces"],
	])("%s -> %s", (input, expected) => expect(slugify(input)).toBe(expected));
});

describe("zonedTimeToDate (Seattle time)", () => {
	it("handles standard time (PST, UTC-8)", () => {
		expect(zonedTimeToDate("2030-01-11", "19:30").toISOString()).toBe("2030-01-12T03:30:00.000Z");
	});
	it("handles daylight time (PDT, UTC-7)", () => {
		expect(zonedTimeToDate("2030-07-12", "19:30").toISOString()).toBe("2030-07-13T02:30:00.000Z");
	});
});

describe("parseShows", () => {
	it("accepts an empty list", () => {
		expect(parseShows([])).toEqual([]);
	});

	it("fills defaults", () => {
		const [show] = parseShows([base]);
		expect(show.venue).toBe("Seattle Comedy Theater");
		expect(show.venueUrl).toBe("https://seattlecomedytheater.com");
		expect(show.displayName).toBe("Friday Night Ensemble");
		expect(show.typeSlug).toBe("friday-night-ensemble");
		expect(show.id).toBe("2030-01-11-1930-friday-night-ensemble");
		expect(show.end.getTime() - show.start.getTime()).toBe(90 * 60_000);
	});

	it("uses title as the display name and in the id", () => {
		const [show] = parseShows([{ ...base, title: "Holiday Special", durationMinutes: 60 }]);
		expect(show.displayName).toBe("Holiday Special");
		expect(show.typeSlug).toBe("friday-night-ensemble");
		expect(show.id).toBe("2030-01-11-1930-holiday-special");
		expect(show.end.getTime() - show.start.getTime()).toBe(60 * 60_000);
	});

	it("sorts by start time", () => {
		const shows = parseShows([{ ...base, date: "2030-02-01" }, base, { ...base, time: "18:00" }]);
		expect(shows.map((s) => `${s.date} ${s.time}`)).toEqual(["2030-01-11 18:00", "2030-01-11 19:30", "2030-02-01 19:30"]);
	});

	it.each([
		[{ ...base, date: "1/11/2030" }, "date must be YYYY-MM-DD"],
		[{ ...base, date: "2030-02-30" }, "not a real calendar date"],
		[{ ...base, time: "7:30 PM" }, "time must be 24-hour HH:MM"],
		[{ ...base, time: "24:00" }, "time must be 24-hour HH:MM"],
		[{ ...base, type: "" }, "type must not be empty"],
		[{ ...base, type: "!!!" }, "at least one letter or number"],
		[{ date: base.date, time: base.time }, "type"],
		[{ ...base, ticketUrl: "seattlecomedytheater.com" }, "full http(s) URL"],
		[{ ...base, ticketUrl: "javascript:alert(1)" }, "full http(s) URL"],
		[{ ...base, ticketUrl: "https://x.com/a\nBEGIN:VEVENT" }, "must not contain spaces or line breaks"],
		[{ ...base, ticketUrl: " https://x.com" }, "must not contain spaces or line breaks"],
		[{ ...base, ticketURL: "https://x.com" }, 'unknown field(s) "ticketURL"'],
		[{ ...base, durationMinutes: "90" }, "durationMinutes must be a number"],
	])("rejects %j", (show, message) => {
		const problems = problemsFor([show]);
		expect(problems.length).toBeGreaterThan(0);
		expect(problems.join("\n")).toContain(message);
		expect(problems[0]).toMatch(/^show #1/);
	});

	it("rejects a non-array", () => {
		expect(problemsFor({ shows: [] }).join()).toContain("JSON array");
	});

	it("rejects duplicates", () => {
		expect(problemsFor([base, base]).join()).toContain("duplicate of show #1");
	});
});

describe("splitShows", () => {
	it("keeps shows before November 2, 2026 out of upcoming across Seattle's DST change", () => {
		const shows = parseShows([
			{ ...base, date: "2026-10-31" },
			{ ...base, date: "2026-11-01" },
			{ ...base, date: "2026-11-02" },
			{ ...base, date: "2026-11-03" },
		]);
		const { upcoming, past } = splitShows(shows, new Date("2026-11-02T07:23:34-08:00"));
		expect(upcoming.map((show) => show.date)).toEqual(["2026-11-02", "2026-11-03"]);
		expect(past.map((show) => show.date)).toEqual(["2026-11-01", "2026-10-31"]);
	});

	it("moves a show to past once it has ended", () => {
		const shows = parseShows([base, { ...base, date: "2030-01-04" }]);
		const [early, later] = shows;
		const during = new Date(later.start.getTime() + 10 * 60_000);
		expect(splitShows(shows, during).upcoming).toEqual([later]);
		expect(splitShows(shows, later.end).past).toEqual([later, early]);
		expect(splitShows(shows, new Date("2020-01-01")).past).toEqual([]);
		expect(early.id).not.toBe(later.id);
	});
});
