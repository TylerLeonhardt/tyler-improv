# tyler-improv

Tyler Leonhardt's improv site: a short bio and a list of upcoming shows, so friends know when he's on stage.

Built with [Astro](https://astro.build) as a fully static site and hosted on Cloudflare Pages.

## Adding a show

Edit `src/data/shows.json` and add an object like this:

```json
{
  "date": "2026-11-14",
  "time": "19:30",
  "type": "Friday Night Ensemble",
  "ticketUrl": "https://seattlecomedytheater.com/..."
}
```

Optional fields: `title`, `venue` (defaults to Seattle Comedy Theater), `ticketUrl`, `notes`, `durationMinutes` (default 90).
Times are 24-hour Seattle time. Past shows collapse into a "Past shows" section automatically.

**Images:** put one image per show type at `public/images/shows/<type-slug>.jpg`
(`"Friday Night Ensemble"` → `friday-night-ensemble.jpg`). Types without an image omit the thumbnail.

Full instructions (for humans and agents): [`.github/skills/add-show/SKILL.md`](.github/skills/add-show/SKILL.md).

### Dispatching the show-manager agent

George can dispatch **`show-manager`** (`agent_name: show-manager`) for one or many
new shows, corrections, cancellations, or supplied show-type images. The project
profile [`.github/agents/show-manager.agent.md`](.github/agents/show-manager.agent.md)
reads the existing skills, validates changes, ships through a green PR and squash
merge, and verifies the live page/calendars with a phone screenshot.

Run from the repository directory, with appropriate tool permissions and
browser/screenshot tooling available:

```bash
copilot --agent show-manager --prompt "Dry run only: check what is missing to add a Dec 5 show; do not change files or ship."
```

Use a real owner request for a normal dispatch. Explicit dry-run or PR-only
instructions stop before shipping. The add-show skill defines the PM default
and safe year inference; applied assumptions are reported separately from
questions. Unconfirmed default venues get one batched confirmation question
without holding the show. Other ambiguous required facts are held, not guessed.
The profile leaves all available tools enabled.

## Calendar

- Each show has **Add to calendar** (`/shows/<id>.ics`) and **Google Cal** links.
- `/shows.ics` is a subscribable feed of all shows (the **Subscribe** link uses `webcal://`).

## Development

```bash
npm ci
npm run dev        # local server
npm test           # validates shows.json + images, unit tests
npm run build      # outputs dist/
SHOWS_FILE=src/data/shows.sample.json npm run dev   # preview with fake sample shows
SHOWS_FILE=/absolute/path/to/proposed.json npm run check:shows # validate and print Seattle/UTC starts
```

## Deploy (Cloudflare Pages)

Live site: **https://tylerleonhardt.live**

`www.tylerleonhardt.live` 301s to the HTTPS apex through a Cloudflare zone
redirect rule, preserving path and query (ACME certificate-validation paths
are exempt). DNS is hosted in Cloudflare; the registrar is Namecheap, with
nameservers `ariadne.ns.cloudflare.com` and `watson.ns.cloudflare.com`.
Both the apex and `www` are proxied CNAMEs to `tyler-improv.pages.dev`, the
Pages project's built-in hostname. That hostname still serves the site and
`/shows.ics` directly: intentionally do not redirect it.

Cloudflare Pages project `tyler-improv` uses the native GitHub integration with
`TylerLeonhardt/tyler-improv`. Every push to `main` triggers a production build;
other branches get preview deployments. No GitHub Actions deploy workflow or
Cloudflare token stored in GitHub is needed. GitHub CI separately validates,
type-checks, and builds PRs; wait for green checks before merging.

| Setting                | Value           |
| ---------------------- | --------------- |
| Framework preset       | Astro           |
| Build command          | `npm run build` |
| Build output directory | `dist`          |
| Node version           | `22.22.1` (from `.nvmrc`; Astro needs >= 22.22) |

`SITE_URL` in `astro.config.mjs` is the source for canonical/OG URLs and absolute
calendar links; its default is the primary URL above.

### Verify a deploy

After merging, run `gh pr checks <number> --watch` and check the **Cloudflare Pages**
check on the merge commit (PR checks can refer to a preview instead). In the
Cloudflare dashboard, open **Workers & Pages > tyler-improv > Deployments** and
confirm the production deployment succeeded for the expected `main` commit.
Then check the actual public site, not just the deployment status:

```bash
curl --fail https://tylerleonhardt.live/
curl --fail https://tylerleonhardt.live/shows.ics
curl -sI http://tylerleonhardt.live/
curl -sI 'https://www.tylerleonhardt.live/some/path?x=1'
curl --fail https://tyler-improv.pages.dev/
curl --fail https://tyler-improv.pages.dev/shows.ics
```

Confirm the upcoming dates and Tickets links in a browser. Past dates belong in
the collapsed Past shows section. Check canonical/OG URLs, calendar links, and
any changed fonts or images on the live site.

HTTPS must validate without `-k`; HTTP must redirect to HTTPS, and `www` must
301 to `https://tylerleonhardt.live/some/path?x=1`. If the domain breaks, check
the Cloudflare zone is active, both Pages custom domains are active, both
proxied CNAMEs target the built-in hostname, and the zone redirect rule is
enabled with its ACME exception. See the [deploy skill](.github/skills/deploy/SKILL.md)
for IDs, read-back commands, and resolver comparisons.

Nameserver-change lesson: the registry switched in about 15 minutes and the
zone activated immediately afterward, but public resolvers retained the old
delegation much longer while Pages domains stayed pending. Compare several
resolvers and test the Cloudflare edge with `curl --resolve` before concluding
the configuration is broken. A redirect over the HTTP ACME challenge path can
also block Pages validation; keep that path exempt.

### Redeploy manually

In the Cloudflare dashboard, retry the relevant production deployment. To build
the latest `main` through the authenticated Cloudflare CLI instead:

```bash
export CLOUDFLARE_ACCOUNT_ID=7e6145ca7d0176dd098df673de88c333
~/.local/bin/cf auth whoami
~/.local/bin/cf pages projects deployments create tyler-improv --branch main --dry-run
~/.local/bin/cf pages projects deployments create tyler-improv --branch main
~/.local/bin/cf pages projects get tyler-improv
```

Wait for `canonical_deployment.latest_stage.status` to be `success` and verify
its commit hash and the live URLs above. OAuth login requires owner approval in
a browser if expired; never put credentials in the repository. See the
[deploy skill](.github/skills/deploy/SKILL.md) for the agent workflow.
