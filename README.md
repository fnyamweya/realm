# RealtyOS — Enterprise Multi-Client PropTech SaaS

## Architecture

Monorepo powered by **pnpm workspaces** + **Turbo**. The backend runs on **Cloudflare Workers** (D1, R2, KV, Queues) and exposes a versioned `/v1` API.

```
apps/
  api-worker/      # Cloudflare Worker – HTTP API gateway
  jobs-worker/     # Cloudflare Worker – background jobs & queue consumers
  web-console/     # Next.js – admin console
  web-resident/    # Next.js – resident portal
  web-command/     # Next.js – internal command center
  web-landing/     # Next.js – public landing page

packages/
  contracts/       # Zod API, event, and config schemas
  platform/        # Cross-cutting: HTTP, policy, events, auth, security, …
  domains/         # Bounded contexts: identity-access, finance
  adapters/        # D1, R2, KV, Queues adapter implementations
  frontend/        # UI components, SDK, forms

migrations/d1/     # Consolidated D1 (SQLite) migrations
tooling/           # ESLint, Prettier, TypeScript configs, scripts
```

## Prerequisites

- Node.js 22 (pinned in CI)
- pnpm 9.15.4 (`corepack enable && corepack prepare pnpm@9.15.4 --activate`)
- Wrangler CLI (`pnpm add -g wrangler` or use `npx wrangler`)

## Local Development

```bash
# Install dependencies
pnpm install

# Typecheck entire monorepo
pnpm typecheck

# Run all tests
pnpm test

# Lint
pnpm lint

# Build all packages
pnpm build
```

### API Worker (local)

```bash
cd apps/api-worker
pnpm dev          # starts wrangler dev server
```

### Jobs Worker (local)

```bash
cd apps/jobs-worker
pnpm dev
```

## D1 Migrations

Migrations live in `migrations/d1/` and are applied in order:

| File | Content |
|------|---------|
| `0001_core_identity.sql` | Users, identities, memberships, sessions, MFA, API keys, audit |
| `0002_core_domains.sql` | Clients, properties, units, leases, maintenance, files |
| `0003_outbox.sql` | Outbox events, processed markers, idempotency keys |
| `0004_finance.sql` | Ledger, payments, allocations, charges, policies, runs |

Apply to a D1 database:

```bash
wrangler d1 execute <DB_NAME> --file=migrations/d1/0001_core_identity.sql
wrangler d1 execute <DB_NAME> --file=migrations/d1/0002_core_domains.sql
wrangler d1 execute <DB_NAME> --file=migrations/d1/0003_outbox.sql
wrangler d1 execute <DB_NAME> --file=migrations/d1/0004_finance.sql
```

## Contract & Migration Validation

```bash
npx tsx tooling/scripts/validate-contracts.ts
npx tsx tooling/scripts/validate-migrations.ts
```

## CI

The `.github/workflows/ci.yml` pipeline runs:

1. `pnpm install --frozen-lockfile`
2. Lint → Typecheck → Test → Build
3. Contracts check → Migrations check
4. Dependency audit + secret scan

## Environments

| Environment | Purpose |
|-------------|---------|
| **UAT** | Testing; sandbox mode is a client-level config within UAT |
| **Production** | Live |

Sandbox is **not** an environment — it is a `mode` flag on a client record.