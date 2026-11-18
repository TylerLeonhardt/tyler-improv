// @ts-check
import { defineConfig } from "astro/config";

// Public URL for canonical metadata and absolute calendar links.
const SITE_URL = process.env.SITE_URL ?? "https://tylerleonhardt.live";

export default defineConfig({
	site: SITE_URL,
	output: "static",
	trailingSlash: "ignore",
});
