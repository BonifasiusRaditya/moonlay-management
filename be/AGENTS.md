# AI Development Instructions — Base Golang

## Mission

Build and maintain `base-golang` as a complete Golang backend application with consistent API behavior and modular architecture.

Primary objective:
- Keep the implemented feature set stable, correct, and maintainable.

Secondary objective:
- Keep architecture modular and split-ready for future multi-service extraction.

## Current Scope

Active service modules:
- `core-service`
- `audit-service`
- `notification-service`

Target domain modules to implement in Go:
- `auth`
- `clients`
- `branches`
- `users`
- `employees`
- `rbac`
- `api-keys`
- `audit-logs`
- `dashboard`
- `reports`

## Tech Stack

- Go 1.22.x
- Echo (HTTP)
- Cobra (CLI entrypoint)
- Viper (config)
- GORM + Postgres

## Repository Structure

```
services/
  cmd/<service>/
  app/<service>/
    app.go
    routes/
    controllers/
    usecases/
    repositories/
    models/
  pkg/
    config/
    database/
    sharedauth/
    customerrors/
    httputil/
  migrations/
deploy/charts/
```

## Architectural Rules

- Keep strict layering: routes -> controllers -> usecases -> repositories.
- Keep controllers thin; business logic belongs in usecases.
- Repositories only handle data access.
- Depend on interfaces across layers.
- Do not mix unrelated domains in one package.
- Design for future extraction into multiple services.

## API Parity Rules

- Node routes in `base-nodejs/src/app.ts` are a reference for compatibility checks.
- Maintain `/api/v1/*` route shape for migrated endpoints.
- Health endpoint policy for this repo: keep both `GET /health` and `GET /healthz`.
- Keep request validation and error mapping behavior consistent across modules.
- Maintain tenant and RBAC enforcement behavior consistently.

## API Documentation Rules

- Every HTTP endpoint must include Swagger annotations (`@Summary`, `@Tags`, `@Produce`, `@Router`, plus auth/body/path/query fields as needed).
- Swagger docs are required as part of endpoint implementation, not a follow-up task.
- Regenerate Swagger artifacts after endpoint or contract changes:
  - `go run github.com/swaggo/swag/cmd/swag@v1.16.2 init -g ./cmd/core-service/main.go -o ./docs/core-service`

## Database and Migration Rules

- Use `golang-migrate` as the migration runner.
- Use SQL migrations in `services/migrations/` as source of schema truth.
- New migration files must follow golang-migrate naming: `<version>_<name>.up.sql` (and `.down.sql` when rollback SQL is available).
- Keep migrations deterministic and reversible when possible.
- Prefer explicit rollback (`.down.sql`) for destructive changes.

Operational commands (from `services/`):
- `go run ./cmd/core-service/main.go migrate up --database-url <postgres-url>`
- `go run ./cmd/core-service/main.go migrate version --database-url <postgres-url>`
- `go run ./cmd/core-service/main.go migrate down --steps 1 --database-url <postgres-url>`

## Authentication and Authorization

- Implement auth lifecycle parity: login, register, me, refresh-token, forgot-password, reset-password.
- Implement JWT claim extraction and context helpers in shared middleware.
- Implement role + permission checks and tenant scoping consistently across all protected routes.

## Implementation Workflow

- Complete one module vertically (migration, repository, usecase, controller, route, tests) before moving to next module where practical.
- Update README and deployment manifests whenever module behavior or topology changes.

## Testing Expectations

- Add unit tests for usecases and middleware.
- Add integration tests for auth, RBAC, tenant scoping, and core CRUD flows.
- Validate route coverage against the expected application route list before release.

## Out of Scope

- Introducing dead code or placeholder modules that are not part of active application behavior.
