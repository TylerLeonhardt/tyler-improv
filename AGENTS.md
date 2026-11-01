# AGENTS.md

Tyler Leonhardt's improv site: a short bio plus a list of upcoming shows. Astro static site, deployed to
Cloudflare Pages from `main`.

## Most common task: adding a show

Follow `.github/skills/add-show/SKILL.md`. In short: edit **only** `src/data/shows.json`
(and optionally drop an image in `public/images/shows/<type-slug>.jpg`), run `npm test`, open a PR.

## Show data format (`src/data/shows.json`)

A JSON array of objects. All times are Seattle local time.

```json
{
  "date": "2026-11-14",          // required, YYYY-MM-DD
  "time": "19:30",               // required, 24-hour HH:MM
  "type": "Friday Night Ensemble", // required; picks the image
  "title": "Holiday Special",    // optional headline override
  "venue": "Seattle Comedy Theater", // optional; this is the default
  "ticketUrl": "https://...",    // optional
  "notes": "Pay what you can",   // optional
  "durationMinutes": 90          // optional; default 90 (calendar end time)
}
```

(Comments above are illustrative only; JSON doesn't allow them.) Unknown fields are rejected.

## Layout

- `src/data/shows.json`: the real show list (starts empty). `shows.sample.json` is fake data for previews/tests only.
- `src/lib/shows.ts`: schema (zod), parsing, Seattle time zone handling.
- `src/lib/ics.ts`: calendar file generation. `src/lib/data.ts`: file loading and image lookup.
- `src/pages/index.astro`, `src/components/ShowCard.astro`, `src/styles/global.css`: the page.
- `src/pages/shows.ics.ts` → `/shows.ics` subscribable feed; `src/pages/shows/[id].ics.ts` → per-show "Add to calendar".
- `public/images/shows/`: one image per show type.
- `src/assets/photos/`: optimized bio, hero, and gallery photos; Astro generates responsive image sizes.

## Incoming photos

George drops CEO-provided images into `.incoming-photos/` for agents to process, including future
show-type images. This ignored folder is temporary staging, never a committed asset directory.
Inspect the assignments, crop/resize and optimize the needed images into `src/assets/photos/`
(site photos) or `public/images/shows/<type-slug>.<ext>` (show-type images). Keep each image under
1 MB, provide descriptive alt text, and use responsive sizes for site photos. Delete the staged
originals and `.incoming-photos/` after processing; commit only the final assets.

## Commands

- `npm test`: validate data + images, unit tests (also `npm run validate` for data only)
- `npm run build`: build to `dist/` (fails on invalid data)
- `npm run dev`: local dev server
- `SHOWS_FILE=src/data/shows.sample.json npm run dev`: preview with sample data

## Rules

- Branch + PR for every change; never push to `main`. CI must be green.
- Never invent shows. Never put sample data in `shows.json` (a test enforces this).
- The site URL lives in `astro.config.mjs` (`SITE_URL`); update it when the custom domain is added.
