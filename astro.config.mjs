// @ts-check
import { defineConfig } from "astro/config";

// Public URL of the site. Update this when the custom domain is added
// (it is used for absolute links inside the .ics calendar files).
const SITE_URL = process.env.SITE_URL ?? "https://tyler-improv.pages.dev";

export default defineConfig({
	site: SITE_URL,
	output: "static",
	trailingSlash: "ignore",
});
