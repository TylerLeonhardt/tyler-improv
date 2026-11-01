import { describe, expect, it } from "vitest";
import { buildCalendar, foldLine, googleCalendarUrl, icsEscape } from "../src/lib/ics";
import { parseShows } from "../src/lib/shows";

const site = "https://tyler-improv.pages.dev/";
const [show] = parseShows([
	{
		date: "2030-01-11",
		time: "19:30",
		type: "Friday Night Ensemble",
		ticketUrl: "https://example.com/tix",
		notes: "Doors at 7; bring friends, obviously",
	},
]);

describe("ics", () => {
	it("escapes text", () => {
		expect(icsEscape("a,b;c\\d\ne")).toBe("a\\,b\\;c\\\\d\\ne");
	});

	it("folds long lines at 75 octets", () => {
		const folded = foldLine(`DESCRIPTION:${"x".repeat(200)}`);
		for (const line of folded.split("\r\n")) expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75);
		expect(folded.replace(/\r\n /g, "")).toBe(`DESCRIPTION:${"x".repeat(200)}`);
	});

	it("builds a valid calendar", () => {
		const ics = buildCalendar([show], site, { name: "Feed", stamp: new Date("2029-01-01T00:00:00Z") });
		expect(ics.startsWith("BEGIN:VCALENDAR\r\nVERSION:2.0\r\n")).toBe(true);
		expect(ics.endsWith("END:VCALENDAR\r\n")).toBe(true);
		expect(ics).not.toMatch(/[^\r]\n/);
		expect(ics).toContain("DTSTART:20300112T033000Z");
		expect(ics).toContain("DTEND:20300112T050000Z");
		expect(ics).toContain("SUMMARY:Tyler @ Friday Night Ensemble");
		expect(ics).toContain("LOCATION:Seattle Comedy Theater");
		expect(ics).toContain("UID:2030-01-11-1930-friday-night-ensemble@tyler-improv");
		expect(ics).toContain("X-WR-CALNAME:Feed");
		expect(ics.replace(/\r\n /g, "")).toContain("Doors at 7\\; bring friends\\, obviously");
	});

	it("is never empty (includes VTIMEZONE) even with zero shows", () => {
		const ics = buildCalendar([], site, { name: "Feed" });
		expect(ics).toContain("BEGIN:VTIMEZONE");
		expect(ics).not.toContain("BEGIN:VEVENT");
	});

	it("builds a Google Calendar link", () => {
		const url = new URL(googleCalendarUrl(show, site));
		expect(url.searchParams.get("dates")).toBe("20300112T033000Z/20300112T050000Z");
		expect(url.searchParams.get("location")).toBe("Seattle Comedy Theater");
	});
});
