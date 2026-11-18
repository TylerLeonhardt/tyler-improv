---
name: deploy
description: Verify or manually redeploy Tyler Leonhardt's Astro site on Cloudflare Pages, or troubleshoot its native GitHub automatic deployments.
---

# Deploy and verify

- Live URL: https://tyler-improv.pages.dev
- Cloudflare Pages project: `tyler-improv`
- Account ID: `7e6145ca7d0176dd098df673de88c333`
- Source: `TylerLeonhardt/tyler-improv`, production branch `main`
- Native GitHub integration builds each push to `main`; other branches get previews.
- Build: `npm run build`; output: `dist`; Node: `22.22.1` from `.nvmrc`.
- GitHub CI independently runs tests, type checking, and a build. Merge only green PRs.
- No GitHub deploy workflow, API token, or Actions secrets are required.

## Safety

Touch only this Pages project. Do not modify other projects, zones, DNS, Workers,
or domains. Do not create a replacement project or add a custom domain. Preserve
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
curl --fail https://tyler-improv.pages.dev/
curl --fail https://tyler-improv.pages.dev/shows.ics
```

Expect HTTP 200, Tyler's real page, the correct upcoming shows in Seattle time,
working Tickets links, and calendar entries. Past shows remain collapsed.
Check canonical and OG URLs and calendar subscription links use the real public
hostname. For visual changes, inspect served CSS/assets and capture live phone
and desktop PNGs outside the repo.

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
