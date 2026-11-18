---
name: deploy
description: Verify or manually redeploy Tyler Leonhardt's Astro site on Cloudflare Pages, or troubleshoot its native GitHub automatic deployments.
---

# Deploy and verify

- Primary URL: https://tylerleonhardt.live
- Built-in hostname: `tyler-improv.pages.dev` (serves the site and feed; do not redirect it)
- Cloudflare Pages project: `tyler-improv`
- Account ID: `7e6145ca7d0176dd098df673de88c333`
- Source: `TylerLeonhardt/tyler-improv`, production branch `main`
- Native GitHub integration builds each push to `main`; other branches get previews.
- Build: `npm run build`; output: `dist`; Node: `22.22.1` from `.nvmrc`.
- GitHub CI independently runs tests, type checking, and a build. Merge only green PRs.
- No GitHub deploy workflow, API token, or Actions secrets are required.

## Safety

Touch only this Pages project and, with explicit owner direction, its
`tylerleonhardt.live` zone. Do not modify other projects, zones, Workers, account
settings, or domains. Do not create a replacement project or add a custom domain. Preserve
`SITE_URL` in `astro.config.mjs` unless the public hostname intentionally changes.
Never print, commit, or put credentials in reports. An expired OAuth session may
need the owner to approve a new browser login; unattended agents cannot approve it.
If another agent owns the checkout, do not switch branches or edit its files;
use the GitHub API on a feature branch.

## Verify automatic deployment

1. Run `gh pr checks <number> --watch`; ensure CI is green before merging.
2. Read the merged SHA with `gh pr view <number> --json mergeCommit`.
3. Use `cf` (installed at `~/.local/bin/cf`) to inspect the production deployment:

```bash
export CLOUDFLARE_ACCOUNT_ID=7e6145ca7d0176dd098df673de88c333
~/.local/bin/cf auth whoami
~/.local/bin/cf pages projects get tyler-improv
```

Confirm `canonical_deployment.environment` is `production`,
`canonical_deployment.latest_stage.status` is `success`, and
`canonical_deployment.deployment_trigger.metadata.commit_hash` matches the merge
SHA. A push-triggered deployment has trigger type `github:push`. The merge
commit's Cloudflare Pages check links to its deployment; a PR check may only
prove that a preview is healthy.

4. Verify the public outputs:

```bash
curl --fail https://tylerleonhardt.live/
curl --fail https://tylerleonhardt.live/shows.ics
curl --fail https://tyler-improv.pages.dev/
curl --fail https://tyler-improv.pages.dev/shows.ics
```

Expect HTTP 200, Tyler's real page, the correct upcoming shows in Seattle time,
working Tickets links, and calendar entries. Past shows remain collapsed.
Check canonical and OG URLs and calendar subscription links use the real public
hostname. For visual changes, inspect served CSS/assets and capture live phone
and desktop PNGs outside the repo.

## Custom domain and DNS

- Registrar: Namecheap; DNS hosted in Cloudflare, Free plan.
- Zone: `tylerleonhardt.live`, ID `f4edab93d38c4231ee46f619d680727a`.
- Nameservers: `ariadne.ns.cloudflare.com` / `watson.ns.cloudflare.com`.
- Two proxied CNAMEs: apex and `www` both target `tyler-improv.pages.dev`.
- Both Pages custom domains (`tylerleonhardt.live`, `www.tylerleonhardt.live`)
  must report `active`.
- Zone redirect ruleset: `43087d7372b644988c6a4eec207a08b1`,
  phase `http_request_dynamic_redirect`, rule `366f4af3d4554a18842da42a0ab25d54`
  (`www_to_apex`). It 301s `www` to `https://tylerleonhardt.live` plus the path,
  preserving query strings. Exclude `/.well-known/acme-challenge/` so Pages
  HTTP certificate validation and renewal are not intercepted.
- `SITE_URL` in `astro.config.mjs` supplies canonical/OG URLs and absolute
  calendar links. Keep deriving URLs from it, not duplicated constants.
- Keep the built-in hostname available without redirection, including
  `/shows.ics`, for existing calendar subscribers.

Verify with normal resolution, valid TLS (never `-k`), and actual content:

```bash
curl -sI https://tylerleonhardt.live/
curl -sI http://tylerleonhardt.live/
curl -sI 'https://www.tylerleonhardt.live/some/path?x=1'
curl -sIL 'http://www.tylerleonhardt.live/some/path?x=1'
curl -sI https://tylerleonhardt.live/shows.ics
```

Expect apex page HTTP 200, calendar HTTP 200 `text/calendar`, HTTP apex 301 to
HTTPS, and `www` 301 to the HTTPS apex with the same path/query. Check canonical
and `og:url` equal `https://tylerleonhardt.live/`, subscribe uses that host,
and calendar descriptions' "More shows" URLs use it. Event `URL` properties
still point to ticket URLs when supplied; preserve those destinations.

If broken, read back the active zone, both Pages bindings, the two CNAMEs,
and the redirect rule before considering changes:

```bash
export CLOUDFLARE_ACCOUNT_ID=7e6145ca7d0176dd098df673de88c333
~/.local/bin/cf zones get --zone f4edab93d38c4231ee46f619d680727a
~/.local/bin/cf pages projects domains get tylerleonhardt.live --project-name tyler-improv
~/.local/bin/cf pages projects domains get www.tylerleonhardt.live --project-name tyler-improv
~/.local/bin/cf dns records list --zone f4edab93d38c4231ee46f619d680727a --type CNAME
~/.local/bin/cf rulesets account-rulesets get 43087d7372b644988c6a4eec207a08b1 --zone f4edab93d38c4231ee46f619d680727a
dig @1.1.1.1 tylerleonhardt.live A +noall +answer
dig @8.8.8.8 tylerleonhardt.live A +noall +answer
dig tylerleonhardt.live A +noall +answer
dig @1.1.1.1 tylerleonhardt.live NS +noall +answer
dig @ariadne.ns.cloudflare.com tylerleonhardt.live A +short
```

Repeat resolver checks for `www`. To isolate the edge from resolver caches,
use an IP returned by the authoritative nameserver:
`curl --resolve tylerleonhardt.live:443:<cloudflare-ip> -sI https://tylerleonhardt.live/`.
Compare this with normal resolution; an edge success does not prove DNS has
converged publicly. Wrap CLI calls in a bounded subprocess timeout if they hang.
If authentication is unavailable, do not attempt unattended login: use DNS/HTTP
checks and clearly report unverified API statuses.

### Nameserver migration lesson (November 17, 2026)

The registry switched nameservers in about 15 minutes and the zone activated
right afterward, but public resolvers retained the old Vercel delegation much
longer and Pages domains stayed `pending` meanwhile. Answers varied between
cache nodes of the same public resolver. Compare several resolvers and test the
edge with `curl --resolve` before concluding the setup is broken.

DNS converged by about 19:17 PST, but `www` remained pending. Cloudflare's
[Pages debugging guide](https://developers.cloudflare.com/pages/configuration/debugging-pages/#blocked-http-validation)
identifies redirects over HTTP validation as a blocker. The `www` rule
intercepted `/.well-known/acme-challenge/`; adding the narrow exception above
and retrying validation let both bindings become active by 19:50 PST.
Keep that exception for renewal. No binding deletion/recreation was needed.

For a stuck binding, inspect `verification_data` and `validation_data`, CAA
records, and the HTTP challenge path. A retry of this project's binding, when
authorized, can be previewed and read back:

```bash
~/.local/bin/cf pages projects domains edit www.tylerleonhardt.live --project-name tyler-improv --dry-run
~/.local/bin/cf pages projects domains edit www.tylerleonhardt.live --project-name tyler-improv
~/.local/bin/cf pages projects domains get www.tylerleonhardt.live --project-name tyler-improv
```

Always inspect `--help` and `--dry-run` before Cloudflare writes, and read back
afterward. Never change Namecheap, Vercel, or unrelated account resources.

## Manual redeployment

Prefer the automatic push trigger. To rebuild the latest `main` without changing
files, inspect the command and preview it before creating a production deployment:

```bash
~/.local/bin/cf pages projects deployments create --help
~/.local/bin/cf pages projects deployments create tyler-improv --branch main --dry-run
~/.local/bin/cf pages projects deployments create tyler-improv --branch main
```

The CLI starts a remote build; it does not upload local `dist`. Wait for success
and repeat the live verification above. The dashboard alternative is
**Workers & Pages > tyler-improv > Deployments**, then retry the intended
production deployment. If a deployment says success but serves a 404, inspect
the project's build command and output directory before assuming the site works.
