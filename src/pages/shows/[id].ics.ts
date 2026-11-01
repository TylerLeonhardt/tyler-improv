import type { APIRoute, GetStaticPaths } from "astro";
import { loadShows } from "../../lib/data";
import { buildCalendar } from "../../lib/ics";
import type { Show } from "../../lib/shows";

/** One "Add to calendar" file per show: /shows/<id>.ics */
export const getStaticPaths = (() => loadShows().map((show) => ({ params: { id: show.id }, props: { show } }))) satisfies GetStaticPaths;

export const GET: APIRoute<{ show: Show }> = ({ props, site }) => {
	return new Response(buildCalendar([props.show], String(site)), {
		headers: { "Content-Type": "text/calendar; charset=utf-8" },
	});
};
