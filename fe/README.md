# Xerba - Seamly Frontend (React + Vite)

Corporate automation application for orchestrating enterprise workflows, approvals, and operational monitoring.

## Prerequisites

- Node.js 18+
- npm
- Backend running (see `../be-nodejs/README.md`)

## 1) Install dependencies

```bash
npm install
```

## 2) Configure environment

Create `.env` in this folder:

```env
VITE_API_URL=http://localhost:4005/api/v1

# Optional: local HTTPS for dev server
VITE_HOST=0.0.0.0
VITE_HTTPS_ENABLED=false
# VITE_HTTPS_KEY_PATH=./certs/local-ip-key.pem
# VITE_HTTPS_CERT_PATH=./certs/local-ip.pem
```

## 3) Run development server

```bash
npm run dev
```

App URL (default):
- `http://localhost:5173`

## Run frontend with local HTTPS (LAN/IP)

1. Generate cert files (same files can be reused for backend and frontend):

```bash
mkcert -install
mkcert -key-file ./certs/local-ip-key.pem -cert-file ./certs/local-ip.pem localhost 127.0.0.1 ::1 <YOUR_LOCAL_IP>
```

2. Update `.env`:

```env
VITE_HOST=0.0.0.0
VITE_HTTPS_ENABLED=true
VITE_HTTPS_KEY_PATH=./certs/local-ip-key.pem
VITE_HTTPS_CERT_PATH=./certs/local-ip.pem
VITE_API_URL=https://<YOUR_LOCAL_IP>:4005/api/v1
```

3. Start frontend:

```bash
npm run dev
```

4. Open from LAN device:

- `https://<YOUR_LOCAL_IP>:5173`

## 4) Production build

```bash
npm run build
```

Alternative runtime-only bundle check:

```bash
npx vite build
```

## Troubleshooting

- If API calls fail with 404, verify `VITE_API_URL` ends with `/api/v1`.
- If redirected to login unexpectedly, check token in localStorage and backend JWT config.
- If `npm run build` fails due existing unrelated type errors, use `npx vite build` to verify runtime bundle output.
