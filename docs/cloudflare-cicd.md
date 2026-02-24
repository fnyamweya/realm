# Cloudflare CI/CD

This repository ships a fully programmatic Cloudflare delivery pipeline using GitHub Actions and idempotent provisioning scripts.

## What gets automated

- Cloudflare Pages project provisioning for every app
- Domain binding and DNS CNAME records
- D1 database provisioning
- Queue provisioning
- R2 bucket provisioning
- KV namespace provisioning
- Per-app deployment to Cloudflare Pages
- API deployment to Cloudflare Workers
- Post-deploy verification polling to ensure release success

## Workflows

- `.github/workflows/ci.yml`
  - Runs on PRs and non-main pushes
  - Executes `pnpm lint`, `pnpm test`, `pnpm typecheck`

- `.github/workflows/cloudflare-deploy.yml`
  - Runs on push to `main` and manual dispatch
  - Validates monorepo type safety
  - Provisions Cloudflare infrastructure in an idempotent manner
  - Deploys all web apps in parallel matrix jobs
  - Deploys API Worker (`realm-api-<environment>`) with health/doc checks
  - Verifies each deployment reaches a healthy state

## Required GitHub secrets

- `CLOUDFLARE_API_TOKEN` (least-privilege token for Pages, DNS, D1, Queues, R2, KV)
- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_ZONE_ID`

## Optional GitHub repository variables

- `CLOUDFLARE_ROOT_DOMAIN` (e.g. `example.com`)
- `CLOUDFLARE_R2_LOCATION` (default: `WNAM`)
- `CLOUDFLARE_WORKERS_SUBDOMAIN` (required when no custom API domain is configured)
- `CLOUDFLARE_API_SUBDOMAIN` (default: `api`)
- `CF_D1_DATABASES` (CSV list)
- `CF_QUEUES` (CSV list)
- `CF_R2_BUCKETS` (CSV list)
- `CF_KV_NAMESPACES` (CSV list)

If optional variables are omitted, defaults are derived from the deployment environment.

## Naming strategy

Pages projects are created using this pattern:

- `realm-<app>-<environment>`

Examples:

- `realm-web-listings-production`
- `realm-web-console-staging`

API Worker names are created with this pattern:

- `realm-api-<environment>`

This enables horizontal scaling across environments and app boundaries with consistent naming.

## Scripts

- `tooling/cloudflare/provision-infra.mjs`
  - Provisions all required Cloudflare dependencies idempotently

- `tooling/cloudflare/deploy-pages-app.mjs`
  - Builds one Next.js app
  - Converts output with `@cloudflare/next-on-pages`
  - Deploys to Pages via Wrangler
  - Calls verification script

- `tooling/cloudflare/verify-pages-deployment.mjs`
  - Polls deployment API until success/failure/timeout

- `tooling/cloudflare/deploy-api-worker.mjs`
  - Builds API contracts
  - Deploys API Worker to Cloudflare Workers
  - Verifies `/health` and `/docs`

- `tooling/cloudflare/verify-http-endpoint.mjs`
  - Polls HTTP endpoint readiness for health checks

## API docs

- OpenAPI JSON: `/openapi.json`
- Swagger UI: `/docs`

On custom domain this resolves to:

- `https://<api-subdomain>.<root-domain>/docs`

## Local usage

Provision infrastructure:

```bash
CLOUDFLARE_API_TOKEN=... \
CLOUDFLARE_ACCOUNT_ID=... \
CLOUDFLARE_ZONE_ID=... \
CLOUDFLARE_ROOT_DOMAIN=example.com \
node tooling/cloudflare/provision-infra.mjs --environment production
```

Deploy one app:

```bash
CLOUDFLARE_API_TOKEN=... \
CLOUDFLARE_ACCOUNT_ID=... \
node tooling/cloudflare/deploy-pages-app.mjs --app web-listings --environment production --branch main
```

## Scalability notes

- Matrix deployment allows multiple apps to release in parallel.
- Provisioning is idempotent and safe for repeated runs.
- Resource names are environment-scoped to avoid collisions.
- Cloudflare edge runtime + Pages delivery supports global low-latency distribution.
