# Base Golang Backend

This repository is a Go backend application for multi-tenant administration and operations.

It provides:
- Authentication and account lifecycle
- Tenant management (clients and branches)
- User, employee, role, and permission management
- API key management
- Audit logs
- Dashboard and reporting endpoints

The codebase is designed as a modular backend that can stay as a single service or be split into multiple services later.

## Repository Layout

- `services/`
  - `cmd/<service>/` - Cobra entrypoints
  - `app/<service>/` - service modules (routes/controllers/usecases/repositories/models)
  - `pkg/` - shared packages (`config`, `database`, `sharedauth`, `customerrors`, `httputil`, etc.)
  - `migrations/` - SQL migration files
- `deploy/charts/` - Helm charts for currently active Go services

## Prerequisites

- Go 1.22+
- Postgres 14+
- Docker (optional)

## Setup

1. Install dependencies

```bash
cd services
go mod download
```

2. Configure environment

Create `.env` for local development. Configure database, JWT secrets, SMTP settings for auth and notification flows, and `N8N_IMPORT_DOCUMENT_URL` for finance document uploads.

3. Run migrations (golang-migrate via Cobra)

The project now uses `golang-migrate` through the `core-service` command.

From `services/`:

```bash
# apply all up migrations
go run ./cmd/core-service/main.go migrate up --database-url "postgres://postgres:postgres@localhost:5432/base_golang?sslmode=disable"

# show current migration version
go run ./cmd/core-service/main.go migrate version --database-url "postgres://postgres:postgres@localhost:5432/base_golang?sslmode=disable"

# rollback one migration
go run ./cmd/core-service/main.go migrate down --steps 1 --database-url "postgres://postgres:postgres@localhost:5432/base_golang?sslmode=disable"
```

You can omit `--database-url` if values are available from either environment variables or `.env` files (`services/.env` then `../.env`):
- `MIGRATE_DATABASE_URL`
- `DATABASE_URL`
- `DB_POSTGRES_HOST`, `DB_POSTGRES_PORT`, `DB_POSTGRES_USER`, `DB_POSTGRES_PASSWORD`, `DB_POSTGRES_NAME`
- `DEFAULT_SUPERADMIN_EMAIL`, `DEFAULT_SUPERADMIN_PASSWORD`
- `DEFAULT_SUPERADMIN_RESET_PASSWORD` (optional, default `false`)

To force-reset the default superadmin password on migration, set:
- `DEFAULT_SUPERADMIN_RESET_PASSWORD=true`

Then run:

```bash
go run ./cmd/core-service/main.go migrate up
```

Migration SQL files for golang-migrate live in `services/migrations` with `.up.sql` naming, e.g.:
- `0001_init.up.sql`
- `0002_admin_and_profile.up.sql`

Legacy `.sql` files are kept for compatibility, but golang-migrate reads the `.up.sql` files.

These migrations are intended for a fresh, empty database.

These migrations provide the baseline schema plus RBAC and bootstrap seed data.

## Run Services

```bash
cd services
go run ./cmd/core-service
go run ./cmd/audit-service
go run ./cmd/notification-service
```

Recommended for parity work: run `core-service`.

## Implemented Features

- Authentication endpoints in `core-service`:
  - `POST /api/v1/auth/login`
  - `POST /api/v1/auth/register` (admin/superadmin token required)
  - `GET /api/v1/auth/me`
  - `POST /api/v1/auth/refresh-token`
  - `POST /api/v1/auth/forgot-password`
  - `POST /api/v1/auth/reset-password`
- Domain endpoints for clients, branches, users, RBAC, employees, API keys, audit logs, dashboard, and reports.

Bootstrap user after migration:
- email: value from `DEFAULT_SUPERADMIN_EMAIL`
- password: value from `DEFAULT_SUPERADMIN_PASSWORD`

## API Conventions

- Base API path: `/api/v1/*`
- Health endpoints: `GET /health` (Node compatibility) and `GET /healthz`
- Error and auth behavior follows service conventions with clear HTTP status mapping.

## Scope Rules

- Keep the current feature set complete and production-oriented.
- Keep modules split-ready so they can be separated into multiple services later.
