# OrgNest

A production-grade multi-tenant task management SaaS built to demonstrate senior-level full-stack engineering. Features module-based RBAC, real-time updates, analytics, and a polished, accessible UI.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16.2 (App Router, React 19) |
| Language | TypeScript 5 (strict, zero `any`) |
| Database | PostgreSQL (Neon serverless) via Prisma 7 |
| Styling | Tailwind CSS v4 + shadcn/ui (Base UI) |
| Auth | JWT (HttpOnly cookies, access + refresh tokens) |
| State | Zustand 5 (auth/UI) + TanStack Query v5 (server state) |
| Validation | Zod v4 (API + client) |
| Logging | Pino (structured JSON in prod, pretty-print in dev) |
| Charts | Recharts v3 |
| Animation | Framer Motion |
| API Docs | Swagger UI (swagger-jsdoc + swagger-ui-react) |

---

## Architecture

```
src/
├── app/
│   ├── api/              # Next.js App Router route handlers
│   │   ├── auth/         # login, logout, signup, refresh, me
│   │   ├── tasks/        # CRUD + SSE stream + export
│   │   ├── users/        # list, CRUD, per-user permissions
│   │   ├── audit/        # paginated audit log
│   │   ├── analytics/    # aggregated stats
│   │   ├── notifications/# recent activity feed
│   │   ├── permissions/  # resolved permission map for current user
│   │   ├── health/       # health check (DB latency)
│   │   └── docs/         # Swagger spec JSON
│   ├── dashboard/        # protected pages (tasks, team, analytics, audit)
│   ├── login/ signup/    # auth pages
│   └── api-docs/         # Swagger UI page
├── components/
│   ├── layout/           # Sidebar, Header, MobileSidebar, NotificationBell
│   ├── tasks/            # TaskCard, TaskList, TaskFilters, CreateTaskDialog, TaskSkeleton
│   ├── users/            # UserPermissionsDialog
│   ├── analytics/        # StatCard
│   └── common/           # EmptyState, ErrorBoundary
├── hooks/                # useTasks, useUsers, useAuditLogs, useAnalytics,
│                         # usePagination, useFilters, useTaskStream, useDebounce
├── lib/
│   ├── env.ts            # Zod-validated env vars (fails fast on startup)
│   ├── logger.ts         # Pino logger (pretty dev / JSON prod)
│   ├── withLogging.ts    # Route handler wrapper (req logging + error catch-all)
│   ├── api.ts            # Typed fetch client (ApiClientError)
│   ├── auth.ts           # JWT generation
│   ├── verify.ts         # JWT verification
│   ├── permissions.ts    # ROLE_DEFAULTS + canAccess + resolveUserPermissions
│   ├── prisma.ts         # Prisma singleton
│   └── export.ts         # CSV (PapaParse) + PDF (jsPDF) export helpers
├── store/                # authStore (Zustand) — session + canAccess()
└── types/                # api.ts, models.ts, store.ts, index.ts
```

### RBAC Design

Permissions are resolved in two steps:

1. **Role defaults** — defined in `src/lib/permissions.ts` (`ROLE_DEFAULTS`). Every role has a fixed set of allowed module × action combinations.
2. **Per-user overrides** — stored in the `UserPermission` table. An ADMIN can grant or revoke any module × action for any user, independently of their role.

Resolution order: user override wins → role default.

| Role | TASKS | USERS | AUDIT | ANALYTICS | SETTINGS |
|------|-------|-------|-------|-----------|----------|
| ADMIN | MANAGE | MANAGE | READ | READ | MANAGE |
| MANAGER | READ, WRITE | READ | — | READ | — |
| EMPLOYEE | READ | — | — | — | — |

### API Response Envelope

Every endpoint returns the same shape:

```json
// Success
{ "success": true, "data": <T> }

// Paginated
{ "success": true, "data": [...], "meta": { "page", "limit", "total", "totalPages", "hasNext", "hasPrev" } }

// Error
{ "success": false, "error": "message", "code": "ERROR_CODE" }
```

---

## Local Setup

```bash
# 1. Clone
git clone https://github.com/yourhandle/orgnest.git
cd orgnest

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Fill in DATABASE_URL and JWT_SECRET (min 32 chars)

# 4. Apply database migrations
npx prisma migrate deploy

# 5. Generate Prisma client
npx prisma generate

# 6. Start dev server
npm run dev
```

App runs at [http://localhost:3000](http://localhost:3000).  
API docs at [http://localhost:3000/api-docs](http://localhost:3000/api-docs).

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string (supports Neon `?sslmode=require`) |
| `JWT_SECRET` | ✅ | Secret key for JWT signing — minimum 32 characters |
| `NODE_ENV` | — | `development` / `production` (default: `development`) |
| `NEXT_PUBLIC_APP_URL` | — | Public base URL (default: `http://localhost:3000`) |

The app validates all variables at startup via Zod and exits with a clear error message if any are missing or invalid.

---

## API Documentation

Interactive Swagger UI is available at `/api-docs`. All endpoints are annotated with JSDoc `@swagger` comments covering:
- Request bodies and query parameters (with types and constraints)
- All response shapes and status codes
- Security requirements (cookieAuth)

---

## Deployment

### Vercel + Neon

1. Create a [Neon](https://neon.tech) PostgreSQL database.
2. Import the repo into [Vercel](https://vercel.com).
3. Set the four environment variables in Vercel's project settings.
4. Run migrations against the production DB:
   ```bash
   DATABASE_URL="<prod-url>" npx prisma migrate deploy
   ```
5. Deploy — Vercel handles the rest.

---

## Available Scripts

```bash
npm run dev          # Start dev server (Turbopack)
npm run build        # Production build
npm run start        # Start production server
npm run lint         # ESLint (zero-tolerance — no warnings allowed)
npm run lint:fix     # ESLint with auto-fix
npm run type-check   # tsc --noEmit
npm run format       # Prettier format
```
