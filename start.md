# Spark Gym ERP Start Guide

This file explains the daily commands to start and validate the project during development.

---

## Package Manager

This project uses `pnpm`.

Do not use `npm install` or `npm run` for normal development work.

---

## Project Structure

* Frontend: `apps/web`
* Backend: `apps/api`
* Workspace root: project root

---

## First-Time Setup

From the project root:

```bash
pnpm install
```

This installs dependencies for the whole workspace.

---

## Daily Start

Open a terminal in the project root and run the frontend:

```bash
PORT=3001 pnpm dev:web
```

Open a second terminal in the project root and run the backend:

```bash
PORT=3002 pnpm dev:api
```

---

## Default Local URLs

Frontend:

```text
http://localhost:3001
```

Backend:

```text
http://localhost:3002
```

Note:

* Port `3000` is already used on this machine.
* The frontend was automatically started on `3001`.
* The backend should be started on `3002` to avoid port conflicts.

---

## Useful Commands

Run workspace build:

```bash
pnpm build
```

Run frontend lint:

```bash
pnpm --filter web lint
```

Run backend build:

```bash
pnpm --filter api build
```

Run backend tests:

```bash
pnpm test:api
```

---

## Daily Workflow

1. Open the project root.
2. Run `pnpm dev:web` in one terminal.
3. Run `PORT=3002 pnpm dev:api` in another terminal.
4. Open the frontend in the browser.
5. Keep both terminals running while developing.

---

## If Dependencies Change

If a package is added or updated, run:

```bash
pnpm install
```

If pnpm warns about ignored build scripts and a package later fails because of it, run:

```bash
pnpm approve-builds
```

---

## Stopping The Project

To stop the frontend or backend, press:

```bash
Ctrl+C
```

in the terminal where that process is running.

---

## Recommended Next Step

After starting the project, begin Sprint 0 setup work before building feature routes.