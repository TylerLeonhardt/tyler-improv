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
| `ticketUrl`       | no       | Full `http(s)://...` URL; preserve exactly what the owner supplied.           |
| `notes`           | no       | One short sentence, e.g. `"Pay what you can"` or `"Doors at 7"`.              |
| `durationMinutes` | no       | Whole number from `15` to `480`, default `90`. Calendar end and past-show cutoff. |

If the venue is unconfirmed and no existing record identifies it, omit `venue`; never guess.
Report it as unconfirmed: the site currently displays Seattle Comedy Theater when `venue` is omitted.
Omit `ticketUrl` when no ticket link is supplied.

Seattle Comedy Theater is at **3509 Fremont Ave N, Seattle, WA 98103**. Its website and
map links are maintained centrally in `src/lib/shows.ts` (`KNOWN_VENUES` and `KNOWN_VENUE_MAPS`)
and shown by `src/components/ShowCard.astro`. The stable Google Maps URL is
https://www.google.com/maps?cid=2517434607297078199. Omit `venue` for this default, or use its exact name;
both get the map link. Other venues do not inherit it. Do not add a map/address field to show JSON.

No other fields are allowed; typos like `ticketURL` fail validation on purpose.

Follow `../design-system/SKILL.md`: no emoji or emoji-capable symbols in show titles, venues, or any copy; `tests/no-emoji.test.ts` enforces this.

Resolve a relative date only when the request/context uniquely determines the
Seattle date, year, and AM/PM, and **confirm the full date and time back**.
Do not assume "7:30" means evening or roll an already-past date into next year.
If required facts are missing or an edit/cancellation matches multiple shows,
leave that item unchanged and report an explicit question for the owner through
George. In unattended dispatches, do not wait for an answer or guess; complete
independent unambiguous items and clearly list the blocked ones.

On additions, omit unsupplied optional fields and report any relevant omission.
On corrections, preserve existing optional fields unless the owner asks to
change/remove them. Use supplied ticket URLs verbatim in JSON, including query
strings. Flag a slug/date/time mismatch rather than "fixing" the link or changing
the show to match it (PR #3 deliberately preserved the Rec League show's
different ticket slug). Parsing may normalize a URL for rendered output; do not
manually rewrite the stored owner-supplied value.

Compare additions against the current Seattle date/time. If a requested date
has already passed, say so and ask whether an archive entry or a different date
was intended; leave it out unless the request explicitly calls for the archive.
An intentional historical addition belongs in Past shows, never Upcoming.
Never add made-up or sample shows to `shows.json`.

## 2. Edit `src/data/shows.json`

It is a JSON array. Order doesn't matter (the site sorts by date), but appending is simplest.
Leave past shows in place; the site puts them under a collapsed "Past shows"
section after their end time (including `durationMinutes`). The browser also
refreshes this split without a rebuild. The feed and per-show calendars include
past shows too; archiving is not cancellation.

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
Match by date and title/type, using time to disambiguate multiple shows on a date.
Never delete all shows on a date unless explicitly requested.

## 3. (Optional) Add a show-type image

One image per show **type**; every show with that type uses it. Types without an image omit
the thumbnail, so an image is never required.

1. File name = the type's slug + extension: lowercase, non-alphanumerics become `-`, `&` becomes `and`, apostrophes dropped.
   - `"Friday Night Ensemble"` → `public/images/shows/friday-night-ensemble.jpg`
   - `"Tyler's Jam & Friends"` → `public/images/shows/tylers-jam-and-friends.jpg`
2. Allowed extensions: `.jpg`, `.jpeg`, `.png`, `.webp` (lowercase). Only one image per type.
3. Landscape works best (displayed at 3:2, center-cropped). Keep it **under 1 MB**; resize first, e.g. on macOS:
   `sips -Z 1200 input.jpg --out public/images/shows/<slug>.jpg`
4. George drops CEO-provided images into `.incoming-photos/` for agents to process, including
   future show-type images. This folder is ignored staging: never commit it. Inspect the provided
   assignments, then crop/resize and optimize the needed images into the final asset location.
   Show-type images go in `public/images/shows/` using the naming above; bio and hero-carousel
   photos go in `src/assets/photos/` and use Astro's responsive image pipeline with descriptive
   alt text. Delete only the assigned, processed staged originals, then remove
   `.incoming-photos/` if empty; never delete unrelated pending assignments. Commit only
   the final assets. If an image arrives through chat, stage the attachment in `.incoming-photos/`
   and follow the same process.

`npm test` prints which types have no show image.

## 4. Validate

```bash
npm test        # validates shows.json + images, runs unit tests
npx astro check # type checking (also required by CI)
npm run build   # also fails on invalid data
```

Use `npm ci` if validation fails because dependencies are missing, not on every dispatch.
Errors name the exact show and field, e.g.
`show #3 (2026-11-14 7:30pm Friday Night Ensemble) → time: time must be 24-hour HH:MM ...`. Fix and re-run.

Optional local preview: `npm run dev`, then open the printed URL.

## 5. Ship

Never push to `main`. Use a branch + PR; merging to `main` triggers a production
build through Cloudflare Pages' native GitHub integration (`tyler-improv` project).

```bash
git checkout main && git pull --ff-only
git checkout -b george/feature-add-show-2026-11-14
git add src/data/shows.json public/images/shows/
git commit -m "Add show: Friday Night Ensemble 2026-11-14"
git push origin HEAD
gh pr create --repo TylerLeonhardt/tyler-improv --title "Add show: Friday Night Ensemble (Nov 14)" --body "Adds ..."
```

Use `george/feature-<summary>` for additions or `george/fix-<summary>` for corrections/removals.
Check ownership and `git status` before switching branches; the example assumes an
exclusively owned clean checkout. Stage only intended paths (omit the image
directory when there are no image changes) and inspect the diff before committing.

Wait for CI to be green (`gh pr checks <n> --repo TylerLeonhardt/tyler-improv --watch`),
including `validate-and-build`, and self-review. When authorized to ship (including
normal end-to-end `show-manager` dispatches), squash-merge with `gh pr merge <n> --squash`.
Honor explicit PR-only or dry-run limits: a dry run makes no commits, PRs, merges,
or production changes and uses separate temporary input, never real test shows.

### Verify and report after merge

Follow `../deploy/SKILL.md` to wait for the **production** deployment whose commit
hash matches the squash merge. A green PR preview alone does not prove production
is live. Use https://tylerleonhardt.live, not only the built-in hostname.

1. In a real browser, verify each affected row's full date, Seattle time,
   title/type, venue and Map behavior, and exact Tickets href or absence.
   For cancellations verify the row is gone from both upcoming and past lists.
2. Fetch `/shows.ics` and each affected `/shows/<id>.ics` on the live host.
   Use `parseShows` / `zonedTimeToDate` in `src/lib/shows.ts` and `icsDate` in
   `src/lib/ics.ts` for expected IDs, UTC `DTSTART` and `DTEND`; do not hardcode
   UTC-8 because Seattle switches to UTC-7 in daylight time. Unfold ICS
   continuation lines before comparing summary, location, ticket URL and UID.
   Date/time/title changes (or type changes when there is no title override)
   can change IDs. Verify old events are absent from the feed and removed
   per-show endpoints no longer serve the old VEVENT; a missing endpoint may
   be a 404, not a calendar. Do not expect past events to disappear.
3. Check ticket destinations without purchasing anything. Crowdwork returns
   403/bot checks to automated requests (recorded in PR #12); this is expected,
   not proof of a broken link. Report "not verifiable automatically" and still
   verify the site's href exactly matches the supplied destination. Do not
   bypass bot checks or substitute guessed URLs.
4. Capture and inspect a real 390x844 phone PNG of the live page outside the
   repository using available browser/screenshot tools or session-local
   tooling. Include affected rows (additional captures if offscreen) and check
   readable date/title/venue, Tickets, and the first complete ticket button
   above the fold. Report the screenshot's absolute path so George can forward
   it. Do not add a browser dependency to this project just for screenshots.

Report additions/corrections/removals in plain words with full date/year, Seattle
time, title/type, venue and tickets yes/no, then the PR number/link, production
commit/status, live page/calendar verification results and screenshot path.
Clearly distinguish verified results from unavailable tools, auth or checks.
Prominently list missing or uncertain facts as **Questions for the owner**,
especially omitted/unconfirmed venues that render as the default. Do not claim
completion of blocked items.

The primary URL is `https://tylerleonhardt.live`; a Cloudflare zone redirect
301s `www` to the HTTPS apex with path/query preserved, except ACME validation
paths. DNS is in Cloudflare (registrar Namecheap; nameservers
`ariadne.ns.cloudflare.com` / `watson.ns.cloudflare.com`). Both proxied CNAMEs
point to `tyler-improv.pages.dev`, the built-in hostname that still serves the
site and feed without redirecting. Verify normal-resolution TLS, both hosts'
page/feed HTTP 200, HTTP-to-HTTPS, and the `www` redirect. If broken, check the
zone status, both Pages custom-domain statuses, the two CNAMEs, and the zone
redirect rule using the deploy skill.

Nameserver-change lesson: the registry switched in about 15 minutes and the
zone activated right after, but public resolvers retained the old delegation
much longer while Pages domains stayed pending. Compare several resolvers and
test the edge with `curl --resolve` before concluding the setup is broken.

### Updating without a local checkout

If another agent owns the checkout, do not switch branches or edit its files. Read the base
with `git show origin/main:src/data/shows.json` and confirm `origin/main` matches remote `main`.
Prepare the updated JSON outside the repo (or in memory if temporary writes are blocked) and
validate it with the base revision's `src/lib/shows.ts` schema and parsing logic. Create a remote
feature ref and commit via the GitHub Contents or Git Data API, preserving existing shows and
using the base file SHA for Contents API updates. Open the PR with `gh pr create --head <branch>`,
wait for CI tests and build to pass, and verify any available preview's show count, dates, and
Seattle times before merging. Do not retry denied worktree or clone operations.
