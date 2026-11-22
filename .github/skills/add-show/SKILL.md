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

When no venue is supplied for an addition, omit `venue`; never guess. On edits,
preserve the existing venue. Every dispatch with an omitted, unconfirmed venue
must ask for venue confirmation, even for an existing show; do not hold the show.
The site displays Seattle Comedy Theater and its Map link when `venue` is omitted.
Batch these confirmations into one short line under **Questions for the owner**,
listing the affected shows: "Confirm Seattle Comedy Theater for Dec 12 ComedySportz
and Nov 27 Rec League?" A previously confirmed venue needs no new question.
Omit `ticketUrl` when no ticket link is supplied.

Seattle Comedy Theater is at **3509 Fremont Ave N, Seattle, WA 98103**. Its website and
map links are maintained centrally in `src/lib/shows.ts` (`KNOWN_VENUES` and `KNOWN_VENUE_MAPS`)
and shown by `src/components/ShowCard.astro`. The stable Google Maps URL is
https://www.google.com/maps?cid=2517434607297078199. Omit `venue` for this default, or use its exact name;
both get the map link. Other venues do not inherit it. Do not add a map/address field to show JSON.

No other fields are allowed; typos like `ticketURL` fail validation on purpose.

Follow `../design-system/SKILL.md`: no emoji or emoji-capable symbols in show titles, venues, or any copy; `tests/no-emoji.test.ts` enforces this.

### Time of day

Explicit AM/PM and explicit 24-hour times are always respected as given.
Without a daypart or an explicit 24-hour designation, a bare hour from 1 to 11,
with or without minutes, means PM: "7:30" becomes "19:30" and "8" becomes "20:00".
Do not hold these items; report "I assumed 7:30 PM" or "I assumed 8 PM" under
**What I assumed**. A leading zero denotes 24-hour input ("07:30" stays "07:30");
hours 13 through 23 and 00 are also unambiguously 24-hour input.
Bare "12" or "12:30" without a daypart or explicit 24-hour designation is held
for noon-versus-midnight clarification; explicit "12:00" in 24-hour input is noon.
Explicit "morning", "AM", "matinee", "afternoon", "evening", "noon", or "midnight"
overrides the PM default: morning 7 means 07:00, matinee 2 means 14:00,
noon means 12:00, and midnight means 00:00 on the stated date.
Hold contradictory daypart/time instructions (such as "morning 19:30") or a
daypart that does not resolve a bare 12, rather than inventing a time.

### Dates, years, and matching existing shows

Use today's date in America/Los_Angeles, not the machine's UTC date.
For a new show with an explicit month and day but no year, use the nearest
occurrence on or after today in Seattle, only when no supplied year, weekday,
historical wording, ticket-link evidence, or other context contradicts it.
State the inferred full date/year under **What I assumed**.
For example, on November 18, 2026, "Dec 12" means December 12, 2026 and
"Jan 9" means January 9, 2027; on December 30, 2026, "Jan 9" means January 9,
2027. On January 10, 2027, an otherwise context-free new "Jan 9" means January 9,
2028. This explicit month/day inference is allowed; do not guess a year when
context conflicts or a month is missing. Do not silently roll an explicitly
dated or clearly historical past show forward. Invalid dates are held.

Check any stated weekday against the resolved date. If they disagree, hold and
ask which is correct; never change the date or search later years for a match.
On Wednesday, November 18, 2026, "Friday the 19th" is held: November 19 is
Thursday, and neither a different day nor a different month is authorized.
Even though February 19, 2027 is Friday, do not jump to that month.
Relative phrases such as "tomorrow" are allowed only when they uniquely resolve
from the Seattle reference date; always report the full date/year and time.

For edits/cancellations, match partial dates against existing data first, not
the new-show future-year rule. Filter by every supplied part (day, month, year,
name/type, time); proceed only if exactly one show matches, and report its full
date, time, and name. "Cancel the one on the 14th" matches the existing November
14, 2026 Full Disclosure only if no other record matches the 14th. Zero or
multiple matches require a question; never choose merely the nearest show.
Check a supplied weekday too, even when the data match is otherwise unique.

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
An explicit owner correction takes precedence over an existing ticket link:
apply it, preserve the link, and flag exactly which date/time parameter is
stale and why the owner's correction was used. For example, changing Nov 27
to "8" means 20:00 even if its existing link still says 19:30.
For additions, if a supplied link contradicts an inferred year or PM time,
hold and ask unless the owner explicitly identifies which evidence to use.
Never silently choose between truly conflicting instructions.

Compare additions against the current Seattle date/time. If a requested date
has already passed, say so and ask whether an archive entry or a different date
was intended; leave it out unless the request explicitly calls for the archive.
An intentional historical addition is accepted, but the site classifies by
end time, not the calendar date alone: `splitShows` moves it to Past shows
when start plus `durationMinutes` (default 90) is at or before now.
An earlier start today may still be Upcoming until it ends; flag an elapsed
start without claiming it is already archived. The parser accepts past dates;
it does not infer dates/years or check the owner's facts.
Never add made-up or sample shows to `shows.json`.

### Validation is not fact-checking

A passing schema does not prove an entry is right. Independently check the
Seattle reference date, inferred year, stated weekday, past start/end, unique
existing-show match, exact type/title spelling, supplied emoji, venue status,
and ticket URL slug/date/time parameters against the owner's message.
Flag supplied emoji and ask for an approved plain-text name; never silently
rewrite it. Do not invent a title or ticket link. The emoji guard is a separate
check, not part of `parseShows`.

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

For a proposed file or dry run, keep fake input outside the repository and run:

```bash
SHOWS_FILE=/absolute/path/to/proposed.json npm run check:shows
```

This runs the real `loadShows` / `parseShows` validation, image checks, and
the emoji guard on both source JSON (including escapes) and generated calendars.
It retains real/sample emoji coverage and prints every selected show's Seattle
date/time and UTC start using `formatParts` and the parsed `start`.
It makes no commits and does not change real data. No custom test config is needed.
`SHOWS_FILE=/absolute/path/to/proposed.json npm test` also runs the full suite.
For a preview use that same environment variable with `npm run dev`.

On the exclusive-checkout sequence below, all three local checks are required:

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

Never put local filesystem paths or account identifiers in PR text on this public repo.

Never push to `main`. Use a branch + PR; merging to `main` triggers a production
build through Cloudflare Pages' native GitHub integration (`tyler-improv` project).

### Exclusive clean checkout: local branch and local checks

Choose this sequence only after confirming exclusive ownership and a clean
`git status`. Create the branch before editing, perform the edit, run all three
local checks in section 4, inspect the diff, then commit and open the PR:

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
List only unresolved owner decisions as **Questions for the owner**, following
the short-report guidance below, including one batched confirmation of
unconfirmed default venues. Do not claim completion of blocked items.

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

### Shared or dirty checkout: API commit and CI gate

Choose this sequence if the checkout is shared, another agent owns it, ownership
is uncertain, or it has pre-existing changes. Do not stash, switch branches, edit
its files, or run local checks against someone else's work as proof of the PR.
Read the base
with `git show origin/main:src/data/shows.json` and confirm `origin/main` matches remote `main`.
Prepare the updated JSON outside the repo (or in memory if temporary writes are blocked) and
validate it with the base revision's `check:shows` command in an already available
isolated environment if permitted. If unavailable, explicitly defer validation
to CI; do not claim local validation. Create a remote
feature ref and commit via the GitHub Contents or Git Data API, preserving existing shows and
using the base file SHA for Contents API updates. Open the PR with `gh pr create --head <branch>`,
wait for CI tests and build to pass, and verify any available preview's show count, dates, and
Seattle times before merging. Do not retry denied worktree or clone operations.
Required CI (`validate-and-build` and other checks) is the validation gate for
this sequence and must pass on the proposed commit before self-review and merge.
Both sequences use the same post-merge production verification above.

### Keep the owner report short

Separate applied **What I assumed** (PM, inferred years, exact matched records)
from **Questions for the owner**. Assumptions already applied are not questions.
Order questions by publishing blockers first, merge related questions per show,
and ask only for decisions the owner must make. Put all unconfirmed-default
venue confirmations in one final line, not one question per show. Flag a stale
existing ticket parameter as a discrepancy with the applied correction and
reason; do not turn it into a blocking question unless the owner must choose
between genuinely conflicting instructions. Mark held items clearly and do
not claim they were published.
