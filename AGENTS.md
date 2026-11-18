# AGENTS.md

Tyler Leonhardt's improv site: a short bio plus a list of upcoming shows. Astro static site, deployed to
Cloudflare Pages from `main`.

Live URL: **https://tylerleonhardt.live**. Pages project `tyler-improv` is
connected through Cloudflare's native GitHub integration: pushes to `main`
trigger production builds (`npm run build`, output `dist`, Node `22.22.1` from
`.nvmrc`); other branches get previews. GitHub CI is a separate check, not the
deployment mechanism. Wait for green PR checks before merging.

For deploy verification or manual redeployment, follow
`.github/skills/deploy/SKILL.md`. Verify the production commit and the live page
and `/shows.ics`; a green preview check alone does not prove production is live.
No GitHub deploy secrets are required. Touch only this Pages project, never
other account resources or custom domains without explicit owner direction.

DNS is hosted in Cloudflare, with Namecheap as registrar and nameservers
`ariadne.ns.cloudflare.com` / `watson.ns.cloudflare.com`. Apex and `www` are
proxied CNAMEs to the built-in hostname `tyler-improv.pages.dev`, which still
serves the site and calendar feed without a redirect. A Cloudflare zone rule
301s `www.tylerleonhardt.live` to the HTTPS apex with path/query intact,
except `/.well-known/acme-challenge/` for certificate validation and renewal.
Verify normal-resolution TLS, page and `/shows.ics` HTTP 200, HTTP-to-HTTPS,
and the `www` redirect. If broken, check zone status, both Pages domain
statuses, both CNAMEs, and the redirect rule; IDs and commands are in the deploy skill.

After the nameserver change the registry switched in about 15 minutes and the
zone activated right after, but public resolvers retained the old delegation
much longer and Pages domains stayed pending. Compare multiple resolvers and
use `curl --resolve` to test the edge before assuming the setup is broken.

## Most common task: adding a show

Follow `.github/skills/add-show/SKILL.md`. In short: edit **only** `src/data/shows.json`
(and optionally drop an image in `public/images/shows/<type-slug>.jpg`), run `npm test`, open a PR.

## Show-manager custom agent

Dispatch `show-manager` for additions, corrections, cancellations, or supplied
show-type artwork. Its profile is `.github/agents/show-manager.agent.md`; it reads
the existing skills and handles validation, PR, squash merge, and live verification.
From this directory, for example:

```bash
copilot --agent show-manager --prompt "Dry run only: check what is missing to add a Dec 5 show; do not change files or ship."
```

George can use `agent_name: show-manager` when launching the CLI. Configure normal
tool permissions and browser/screenshot tooling in the dispatch environment;
the profile does not restrict available tools. Explicit dry-run/PR-only limits
override its normal end-to-end shipping workflow.
The add-show skill defines evening and year inference; applied assumptions are
reported separately from questions. Unconfirmed default venues always get one
batched confirmation question without holding the show.

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

- `src/data/shows.json`: the real show list. `shows.sample.json` is fake data for previews/tests only.
- `src/lib/shows.ts`: schema (zod), parsing, Seattle time zone handling.
- `src/lib/ics.ts`: calendar file generation. `src/lib/data.ts`: file loading and image lookup.
- `src/pages/index.astro`, `src/components/ShowCard.astro`, `src/styles/global.css`: the page.
- `src/pages/shows.ics.ts` → `/shows.ics` subscribable feed; `src/pages/shows/[id].ics.ts` → per-show "Add to calendar".
- `public/images/shows/`: one image per show type.
- `src/assets/photos/`: optimized bio and hero-carousel photos; Astro generates responsive image sizes.

## Incoming photos

George drops CEO-provided images into `.incoming-photos/` for agents to process, including future
show-type images. This ignored folder is temporary staging, never a committed asset directory.
Inspect the assignments, crop/resize and optimize the needed images into `src/assets/photos/`
(site photos) or `public/images/shows/<type-slug>.<ext>` (show-type images). Keep each image under
1 MB, provide descriptive alt text, and use responsive sizes for site photos. Delete the staged
originals and `.incoming-photos/` after processing; commit only the final assets.

## Commands

- `npm test`: validate data + images, unit tests (also `npm run validate` for data only)
- `SHOWS_FILE=/absolute/path/to/proposed.json npm run check:shows`: validate a proposal,
  guard emoji, and print Seattle/UTC starts without changing real data
- `npm run build`: build to `dist/` (fails on invalid data)
- `npm run dev`: local dev server
- `SHOWS_FILE=src/data/shows.sample.json npm run dev`: preview with sample data

## Rules

- Branch + PR for every change; never push to `main`. CI must be green.
- Never invent shows. Never put sample data in `shows.json` (a test enforces this).
- The primary site URL lives in `astro.config.mjs` (`SITE_URL`); derive canonical metadata and absolute calendar links from it.
