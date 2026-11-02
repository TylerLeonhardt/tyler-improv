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

Connected to GitHub; every push to `main` deploys.

| Setting                | Value           |
| ---------------------- | --------------- |
| Framework preset       | Astro           |
| Build command          | `npm run build` |
| Build output directory | `dist`          |
| Node version           | `22.22.1` (from `.nvmrc`; Astro needs >= 22.22) |

When a custom domain is added, update `SITE_URL` in `astro.config.mjs`.
