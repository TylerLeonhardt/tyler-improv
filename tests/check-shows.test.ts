import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function checkShows(shows: unknown) {
	const directory = mkdtempSync(join(tmpdir(), "check-shows-"));
	const file = join(directory, "proposed.json");
	try {
		writeFileSync(file, JSON.stringify(shows));
		const result = spawnSync("npm", ["run", "check:shows"], {
			env: { ...process.env, SHOWS_FILE: file, NO_COLOR: "1" },
			encoding: "utf8",
			timeout: 30_000,
		});
		if (result.error) throw result.error;
		return { status: result.status, output: result.stdout + result.stderr };
	} finally {
		rmSync(directory, { recursive: true });
	}
}

const winter = { date: "2026-12-12", time: "19:30", type: "Proposed winter fixture" };

describe("check:shows external input", () => {
	it("reports Seattle and UTC times and retains the selected file after sample validation", () => {
		const result = checkShows([winter, { ...winter, date: "2027-07-12", type: "Proposed summer fixture" }]);
		expect(result.status, result.output).toBe(0);
		expect(result.output).toContain("Saturday, December 12, 2026, 7:30 PM Seattle | 2026-12-13T03:30:00.000Z");
		expect(result.output).toContain("Monday, July 12, 2027, 7:30 PM Seattle | 2027-07-13T02:30:00.000Z");
		expect(result.output).toContain('"Proposed winter fixture" -> public/images/shows/');
	}, 40_000);

	it("rejects schema errors in the external file", () => {
		const result = checkShows([{ ...winter, time: "7:30" }]);
		expect(result.status).not.toBe(0);
		expect(result.output).toContain("time must be 24-hour HH:MM");
	}, 40_000);

	it.each(["\u{1f600}", "\\u{1F600}"])("rejects literal and escaped emoji in external input: %s", (title) => {
		const result = checkShows([{ ...winter, title }]);
		expect(result.status).not.toBe(0);
		expect(result.output).toContain("U+1F600");
		expect(result.output).toContain("proposed.json");
	}, 40_000);
});
