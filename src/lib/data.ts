/**
 * Build-time data loading (filesystem access). Used by pages and .ics endpoints.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { parseShows, type Show } from "./shows";

export const SHOWS_FILE = "src/data/shows.json";
export const SHOW_IMAGES_DIR = "public/images/shows";
export const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"] as const;

/**
 * Load and validate shows. Set SHOWS_FILE=path/to/other.json to preview with
 * different data (e.g. the sample file) without touching the real list.
 */
export function loadShows(root = process.cwd()): Show[] {
	const file = resolve(root, process.env.SHOWS_FILE ?? SHOWS_FILE);
	let raw: unknown;
	try {
		raw = JSON.parse(readFileSync(file, "utf8"));
	} catch (err) {
		throw new Error(`Could not read ${file} as JSON: ${(err as Error).message}`);
	}
	return parseShows(raw);
}

/** Map of type slug -> public URL of its image, e.g. "/images/shows/friday-night-ensemble.jpg". */
export function loadShowImages(root = process.cwd()): Map<string, string> {
	const dir = join(root, SHOW_IMAGES_DIR);
	const map = new Map<string, string>();
	if (!existsSync(dir)) return map;
	for (const file of readdirSync(dir).sort()) {
		const dot = file.lastIndexOf(".");
		if (dot <= 0) continue;
		const ext = file.slice(dot).toLowerCase();
		if (!(IMAGE_EXTENSIONS as readonly string[]).includes(ext)) continue;
		const slug = file.slice(0, dot);
		if (!map.has(slug)) map.set(slug, `/images/shows/${file}`);
	}
	return map;
}

/** Optional headshot at public/images/tyler.(jpg|jpeg|png|webp). */
export function findHeadshot(root = process.cwd()): string | undefined {
	for (const ext of IMAGE_EXTENSIONS) {
		if (existsSync(join(root, "public/images", `tyler${ext}`))) return `/images/tyler${ext}`;
	}
	return undefined;
}
