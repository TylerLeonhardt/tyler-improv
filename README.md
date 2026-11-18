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
```

## Deploy (Cloudflare Pages)

Live site: **https://tyler-improv.pages.dev**

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

When a custom domain is added, update `SITE_URL` in `astro.config.mjs`.

### Verify a deploy

After merging, run `gh pr checks <number> --watch` and check the **Cloudflare Pages**
check on the merge commit (PR checks can refer to a preview instead). In the
Cloudflare dashboard, open **Workers & Pages > tyler-improv > Deployments** and
confirm the production deployment succeeded for the expected `main` commit.
Then check the actual public site, not just the deployment status:

```bash
curl --fail https://tyler-improv.pages.dev/
curl --fail https://tyler-improv.pages.dev/shows.ics
```

Confirm the upcoming dates and Tickets links in a browser. Past dates belong in
the collapsed Past shows section. Check canonical/OG URLs, calendar links, and
any changed fonts or images on the live site.

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
