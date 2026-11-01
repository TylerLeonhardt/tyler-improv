/**
 * Validates the real data: src/data/shows.json and public/images/shows/.
 * Run on its own with `npm run validate`. Runs in `npm test` and CI.
 */
import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { IMAGE_EXTENSIONS, loadShowImages, loadShows, SHOW_IMAGES_DIR } from "../src/lib/data";
import { slugify } from "../src/lib/shows";

const MAX_IMAGE_BYTES = 1_000_000;

describe("src/data/shows.json", () => {
	it("is valid (see error list for exactly what to fix)", () => {
		expect(() => loadShows()).not.toThrow();
	});

	it("does not contain sample data", () => {
		const leaked = loadShows().filter((s) => /sample data/i.test(s.notes ?? ""));
		expect(leaked.map((s) => s.id)).toEqual([]);
	});
});

describe("src/data/shows.sample.json", () => {
	it("is valid", () => {
		process.env.SHOWS_FILE = "src/data/shows.sample.json";
		try {
			expect(loadShows().length).toBeGreaterThan(0);
		} finally {
			delete process.env.SHOWS_FILE;
		}
	});
});

describe(`${SHOW_IMAGES_DIR}/`, () => {
	const files = readdirSync(SHOW_IMAGES_DIR).filter((f) => !f.startsWith("."));

	it.each(files.length ? files : ["(no images yet)"])("%s is named <type-slug>.<jpg|jpeg|png|webp>", (file) => {
		if (file === "(no images yet)") return;
		const dot = file.lastIndexOf(".");
		const slug = file.slice(0, dot);
		const ext = file.slice(dot);
		expect(IMAGE_EXTENSIONS, `bad extension on ${file}; use lowercase .jpg, .jpeg, .png, or .webp`).toContain(ext);
		expect(slug, `${file} should be named ${slugify(slug)}${ext}`).toBe(slugify(slug));
	});

	it.each(files.length ? files : ["(no images yet)"])("%s is under 1 MB (resize it if not)", (file) => {
		if (file === "(no images yet)") return;
		expect(statSync(join(SHOW_IMAGES_DIR, file)).size).toBeLessThanOrEqual(MAX_IMAGE_BYTES);
	});

	it("has at most one image per show type", () => {
		const slugs = files.map((f) => f.slice(0, f.lastIndexOf(".")));
		const dupes = slugs.filter((s, i) => slugs.indexOf(s) !== i);
		expect(dupes, "two images for the same type; delete one").toEqual([]);
	});

	it("reports show types that still use the placeholder (info only)", () => {
		const images = loadShowImages();
		const missing = [...new Set(loadShows().map((s) => s.type))].filter((t) => !images.has(slugify(t)));
		if (missing.length) {
			console.info(
				`Show types using the placeholder image: ${missing.map((t) => `"${t}" -> ${SHOW_IMAGES_DIR}/${slugify(t)}.jpg`).join(", ")}`,
			);
		}
	});
});
