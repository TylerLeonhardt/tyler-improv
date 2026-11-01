import type { APIRoute } from "astro";
import { loadShows } from "../lib/data";
import { buildCalendar } from "../lib/ics";

/** Subscribable feed of every show: /shows.ics */
export const GET: APIRoute = ({ site }) => {
	const body = buildCalendar(loadShows(), String(site), { name: "Tyler Leonhardt · Improv shows" });
	return new Response(body, { headers: { "Content-Type": "text/calendar; charset=utf-8" } });
};
