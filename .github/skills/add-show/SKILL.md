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
4. If the image was sent through chat, save the attachment to that path.

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
