---
name: add-show
description: Add, edit, or remove a show on Tyler Leonhardt's improv site, or add a show-type image. Use when Tyler (often relayed by George) shares a new performance date, a ticket link, a change to an existing show, or a picture for a type of show. Covers the shows.json format, image naming, validation, and shipping via PR.
---

# Add a show

Everything about shows lives in **one file**: `src/data/shows.json`. Images live in
`public/images/shows/`. You never need to touch any `.astro`, `.ts`, or `.css` file to add a show.

## 1. Gather the facts (ask if anything required is missing; never guess)

| Field             | Required | Format / rule                                                                 |
| ----------------- | -------- | ----------------------------------------------------------------------------- |
| `date`            | yes      | `"YYYY-MM-DD"`, e.g. `"2026-11-14"`                                           |
| `time`            | yes      | 24-hour `"HH:MM"` **Seattle local time**. 7:30 PM → `"19:30"`, 10 PM → `"22:00"` |
| `type`            | yes      | Show type, e.g. `"Friday Night Ensemble"`. Drives the image. Reuse the **exact** spelling of existing types. |
| `title`           | no       | Only if this show has its own name (e.g. `"Holiday Spectacular"`). Shown as the headline; `type` becomes a small label. |
| `venue`           | no       | Omit for Seattle Comedy Theater (the default). Otherwise the venue name.      |
| `ticketUrl`       | no       | Full `https://...` URL.                                                       |
| `notes`           | no       | One short sentence, e.g. `"Pay what you can"` or `"Doors at 7"`.              |
| `durationMinutes` | no       | Whole number, default `90`. Only used for calendar end times.                 |

If the venue is unconfirmed and no existing record identifies it, omit `venue`; never guess.
Report it as unconfirmed: the site currently displays Seattle Comedy Theater when `venue` is omitted.
Omit `ticketUrl` when no ticket link is supplied.

Seattle Comedy Theater is at **3509 Fremont Ave N, Seattle, WA 98103**. Its website and
map links are maintained centrally in `src/lib/shows.ts` (`KNOWN_VENUES` and `KNOWN_VENUE_MAPS`)
and shown by `src/components/ShowCard.astro`. The stable Google Maps URL is
https://www.google.com/maps?cid=2517434607297078199. Omit `venue` for this default, or use its exact name;
both get the map link. Other venues do not inherit it. Do not add a map/address field to show JSON.

No other fields are allowed; typos like `ticketURL` fail validation on purpose.

If Tyler only says "Friday at 7:30", resolve it to a concrete date and **confirm it back** in your reply.
Never add made-up or sample shows to `shows.json`.

## 2. Edit `src/data/shows.json`

It is a JSON array. Order doesn't matter (the site sorts by date), but appending is simplest.
Leave past shows in place; the site hides them under a collapsed "Past shows" section automatically.

```json
[
  {
    "date": "2026-11-14",
    "time": "19:30",
    "type": "Friday Night Ensemble",
    "ticketUrl": "https://seattlecomedytheater.com/..."
  },
  {
    "date": "2026-11-21",
    "time": "21:00",
    "type": "Dollbrick Improv",
    "title": "Dollbrick: Late Night",
    "venue": "Some Bar",
    "notes": "21+"
  }
]
```

Check existing types first so the spelling matches:

```bash
node -e 'console.log([...new Set(require("./src/data/shows.json").map(s => s.type))])'
```

To **edit** a show, change its fields in place. To **cancel** one, delete its object.

## 3. (Optional) Add a show-type image

One image per show **type**; every show with that type uses it. Types without an image get an
auto-generated colored placeholder, so an image is never required.

1. File name = the type's slug + extension: lowercase, non-alphanumerics become `-`, `&` becomes `and`, apostrophes dropped.
   - `"Friday Night Ensemble"` → `public/images/shows/friday-night-ensemble.jpg`
   - `"Tyler's Jam & Friends"` → `public/images/shows/tylers-jam-and-friends.jpg`
2. Allowed extensions: `.jpg`, `.jpeg`, `.png`, `.webp` (lowercase). Only one image per type.
3. Landscape works best (displayed at 3:2, center-cropped). Keep it **under 1 MB**; resize first, e.g. on macOS:
   `sips -Z 1200 input.jpg --out public/images/shows/<slug>.jpg`
4. George drops CEO-provided images into `.incoming-photos/` for agents to process, including
   future show-type images. This folder is ignored staging: never commit it. Inspect the provided
   assignments, then crop/resize and optimize the needed images into the final asset location.
   Show-type images go in `public/images/shows/` using the naming above; bio, hero, and gallery
   photos go in `src/assets/photos/` and use Astro's responsive image pipeline with descriptive
   alt text. Delete the staged originals and `.incoming-photos/` after processing. Commit only
   the final assets. If an image arrives through chat, stage the attachment in `.incoming-photos/`
   and follow the same process.

`npm test` prints which types are still using the placeholder.

## 4. Validate

```bash
npm ci          # first time only
npm test        # validates shows.json + images, runs unit tests
npm run build   # also fails on invalid data
```

Errors name the exact show and field, e.g.
`show #3 (2026-11-14 7:30pm Friday Night Ensemble) → time: time must be 24-hour HH:MM ...`. Fix and re-run.

Optional local preview: `npm run dev`, then open the printed URL.

## 5. Ship

Never push to `main`. Use a branch + PR; merging to `main` auto-deploys via Cloudflare Pages.

```bash
git checkout main && git pull
git checkout -b george/add-show-2026-11-14
git add src/data/shows.json public/images/shows/
git commit -m "Add show: Friday Night Ensemble 2026-11-14"
git push origin HEAD
gh pr create --repo TylerLeonhardt/tyler-improv --title "Add show: Friday Night Ensemble (Nov 14)" --body "Adds ..."
```

Wait for CI to be green (`gh pr checks <n> --repo TylerLeonhardt/tyler-improv --watch`).
Report back the PR link and a one-line summary of the show(s) as they'll appear (date, time, type, venue).

### Updating without a local checkout

If another agent owns the checkout, do not switch branches or edit its files. Read the base
with `git show origin/main:src/data/shows.json` and confirm `origin/main` matches remote `main`.
Prepare the updated JSON outside the repo (or in memory if temporary writes are blocked) and
validate it with the base revision's `src/lib/shows.ts` schema and parsing logic. Create a remote
feature ref and commit via the GitHub Contents or Git Data API, preserving existing shows and
using the base file SHA for Contents API updates. Open the PR with `gh pr create --head <branch>`,
wait for CI tests and build to pass, and verify any available preview's show count, dates, and
Seattle times before merging. Do not retry denied worktree or clone operations.
