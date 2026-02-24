# realm

## CI/CD

Cloudflare-first CI/CD is configured in GitHub Actions.

- CI workflow: `.github/workflows/ci.yml`
- Deploy workflow: `.github/workflows/cloudflare-deploy.yml`

Provisioning + deployment scripts are under `tooling/cloudflare`.
The API Worker is deployed as `realm-api-<environment>` and exposes Swagger at `/docs`.

See [docs/cloudflare-cicd.md](docs/cloudflare-cicd.md) for required secrets, scaling model, and end-to-end usage.