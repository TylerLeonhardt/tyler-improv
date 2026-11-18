import { readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join } from "node:path";
import { describe, expect, it } from "vitest";
import config from "../astro.config.mjs";
import { buildCalendar } from "../src/lib/ics";
import { parseShows } from "../src/lib/shows";

const rule = ".github/skills/design-system/SKILL.md: no emoji or Unicode icons; use inline SVG or CSS shapes";
const suspect = /[\p{Extended_Pictographic}\u{1f000}-\u{1faff}\u2190-\u21ff\u2300-\u23ff\u25a0-\u27bf\u2b00-\u2bff\u20e3\ufe0f]/gu;
const textExtensions = new Set([".astro", ".css", ".js", ".ts", ".json", ".webmanifest", ".html", ".svg", ".txt", ".xml", ".ics"]);

function textFiles(path: string): string[] {
	if (statSync(path).isDirectory()) {
		return readdirSync(path).sort().flatMap((name) => textFiles(join(path, name)));
	}
	return textExtensions.has(extname(path)) ? [path] : [];
}

function decodeEscapes(text: string): string {
	return text
		.replace(/&#(x[\da-f]+|\d+);?/gi, (_, value: string) =>
			String.fromCodePoint(value[0].toLowerCase() === "x" ? parseInt(value.slice(1), 16) : Number(value)))
		.replace(/\\u\{([\da-f]+)\}|\\u([\da-f]{4})|\\x([\da-f]{2})|\\([\da-f]{1,6})[ \t\r\n\f]?/gi,
			(_, braced: string, unicode: string, hex: string, css: string) =>
				String.fromCodePoint(parseInt(braced ?? unicode ?? hex ?? css, 16)));
}

function violations(file: string, text: string): string[] {
	return [...decodeEscapes(text).matchAll(suspect)].map(([character]) =>
		`${file}: ${character} (U+${character.codePointAt(0)!.toString(16).toUpperCase().padStart(4, "0")}); ${rule}`);
}

describe("no emoji in visitor-facing content", () => {
	it("guards templates, styles, scripts, data, and public text assets", () => {
		// shows.ts contains developer-only validation arrows; its visitor-facing
		// defaults are exercised through generated calendar output below.
		const files = ["src/components", "src/pages", "src/styles", "src/data", "public", "src/lib/ics.ts"]
			.flatMap(textFiles);
		if (process.env.SHOWS_FILE) files.push(process.env.SHOWS_FILE);
		expect(files.flatMap((file) => violations(file, readFileSync(file, "utf8"))), rule).toEqual([]);
	});

	it("guards generated feed and individual calendar text for real, sample, and selected shows", () => {
		const files = new Set(["src/data/shows.json", "src/data/shows.sample.json"]);
		if (process.env.SHOWS_FILE) files.add(process.env.SHOWS_FILE);
		for (const file of files) {
			const shows = parseShows(JSON.parse(readFileSync(file, "utf8")));
			for (const events of [shows, ...shows.map((show) => [show])]) {
				const calendar = buildCalendar(events, new URL(String(config.site)).href, { name: "Tyler Leonhardt · Improv shows" });
				expect(violations(`${file} calendar output`, calendar), rule).toEqual([]);
			}
		}
	});

	it.each(["\u2197", "\u25b6", "\u23f8", "\u{1f600}", "\u{1f3fb}", "\ufe0f", "\\2197", "\\25B6 ", "\\u2197", "\\u{1F600}", "&#8599;", "&#x2197;"])(
		"rejects literal and escaped icons: %s", (text) => {
			expect(violations("fixture", text).length).toBeGreaterThan(0);
		},
	);

	it("allows ordinary typography and SVG paths", () => {
		expect(violations("fixture", 'Tyler · Improv – shows — “Seattle” <path d="M6 18 18 6M6 6h12v12" />')).toEqual([]);
	});
});
