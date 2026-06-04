# <span style="color: lightblue">**Finicore**</span>


## Table of Contents

- [Getting Started](#getting-started)
- [Prerequisites](#prerequisites)
- [Run the Backend (Local)](#run-the-backend-local)
- [Run the Frontend (Local)](#run-the-frontend-local)
- [Run with Docker (Optional)](#run-with-docker-optional)
- [Project Links](#project-links)
- [Notes](#notes)

## Getting Started

This repository contains a Go backend in `be/` and a Vite + React frontend in `fe/`. Below are concise, step-by-step instructions to run the project locally.

## Prerequisites

- Go 1.18 or newer
- Node.js (LTS, e.g. 18+) and `npm` or `pnpm`
- PostgreSQL (recommended) or another compatible database; migrations live in `be/migrations/`

## Run the Backend (Local)

1. Open a terminal and change into the backend folder:

```bash
cd be/services
```

2. Set environment variables (example):

<!-- change these values as needed -->
```bash
DB_POSTGRES_USER="" 
DB_POSTGRES_PASSWORD=""
DB_POSTGRES_HOST=""
DB_POSTGRES_PORT=5432
DB_POSTGRES_NAME=""
```

3. Run the core service:

```bash
go run ./cmd/core-service
```

4. Run additional services as needed (e.g. audit, notification):

```bash
go run ./cmd/audit-service
go run ./cmd/notification-service
```

## Run the Frontend (Local)

1. Open a new terminal and change into the frontend folder:

```bash
cd fe
```

2. Install dependencies:

```bash
npm install
```

3. Start the dev server:

```bash
npm run dev
```

## Project Documentation
- Backend README: [be/README.md](be/README.md)
- Frontend README: [fe/README.md](fe/README.md)

