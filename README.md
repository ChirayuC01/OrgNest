# OrgNest

**OrgNest** is a production-grade, multi-tenant task management SaaS. It was built as a flagship portfolio project demonstrating senior-level full-stack engineering — covering secure JWT auth, module-based RBAC with per-user permission overrides, real-time task updates via SSE, an analytics dashboard, export to CSV/PDF, structured logging, and a fully interactive Swagger API reference.

---

## Features

- **Authentication** — JWT-based login/signup with HttpOnly cookies (access token 15 min, refresh token 7 days), logout that clears both tokens
- **Multi-tenancy** — every resource (tasks, users, labels, audit logs) is scoped to a tenant; data never leaks across organizations
- **Role-based access control** — three roles (Admin, Manager, Employee) each with a fixed default permission set; Admins can grant or revoke any module × action for any individual user
- **Task management** — create, edit, and delete tasks with title, description, status, priority, due date, assignee, and labels; status changes enforce role-specific transition rules
- **Subtasks** — add, check off, and delete checklist items per task with a live progress bar
- **Comments** — threaded per-task comments with a chat-style UI
- **Task history** — every field change is recorded and displayed in a grouped timeline
- **Labels** — color-coded labels that can be applied to tasks and filtered on the board
- **Real-time updates** — task board refreshes via Server-Sent Events so changes made in another tab appear automatically
- **Analytics** — bar, line, and pie charts for tasks by status, tasks by member, daily creation trend, and overall completion rate
- **Notifications** — in-app bell with unread count; generated on task assignment and status changes
- **Audit log** — immutable record of every create/update/delete action across the tenant, filterable by action, user, and date range
- **Export** — download task or audit data as CSV (client-side) or PDF (jsPDF + autoTable)
- **Team management** — Admins can view, role-edit, ban/unban members, and configure per-user module permissions through a toggle matrix
- **API documentation** — full Swagger UI at `/api-docs` with every endpoint annotated (request schemas, response shapes, auth requirements)
- **Dark mode** — system-aware with a manual toggle persisted across sessions
- **Responsive layout** — collapsible sidebar on desktop, Sheet drawer on mobile

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript 5 |
| Database | PostgreSQL via Prisma 5 (Neon serverless) |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Auth | JWT — `jose` (Edge-compatible), HttpOnly cookies |
| Server state | TanStack Query v5 |
| Client state | Zustand v5 |
| Validation | Zod v4 (API + client forms) |
| Logging | Pino (pretty in dev, structured JSON in prod) |
| Charts | Recharts v3 |
| Animations | Framer Motion |
| Toasts | Sonner |
| Export | PapaParse (CSV) + jsPDF + jspdf-autotable (PDF) |
| API docs | swagger-jsdoc + swagger-ui-react |
| Fonts | Geist Sans / Geist Mono |

---

## Architecture

```
src/
├── app/
│   ├── api/
│   │   ├── auth/            # login, logout, signup, refresh, me
│   │   ├── tasks/           # CRUD, SSE stream, CSV export
│   │   ├── users/           # list, CRUD, ban, per-user permissions
│   │   ├── labels/          # tenant label management
│   │   ├── audit/           # paginated audit log
│   │   ├── analytics/       # aggregated statistics
│   │   ├── notifications/   # activity feed + mark-read
│   │   ├── permissions/     # resolved permission map for caller
│   │   ├── health/          # DB health check
│   │   └── docs/            # Swagger spec (JSON)
│   ├── dashboard/           # protected pages — tasks, team, analytics, audit
│   ├── login/ signup/       # auth pages
│   └── api-docs/            # Swagger UI page
├── components/
│   ├── layout/              # Sidebar, Header, MobileSidebar, NotificationBell
│   ├── tasks/               # TaskCard, TaskList, TaskFilters, dialogs, skeletons
│   ├── users/               # UserPermissionsDialog
│   ├── analytics/           # StatCard
│   └── common/              # EmptyState, ErrorBoundary
├── hooks/                   # useTasks, useUsers, useAuditLogs, useAnalytics,
│                            # usePagination, useFilters, useTaskStream, useDebounce
├── lib/
│   ├── env.ts               # Zod env validation (fails fast at startup)
│   ├── logger.ts            # Pino logger
│   ├── withLogging.ts       # Route wrapper — logs req/res + catches unhandled errors
│   ├── api.ts               # Typed fetch client with ApiClientError
│   ├── auth.ts              # JWT generation
│   ├── verify.ts            # JWT verification
│   ├── permissions.ts       # ROLE_DEFAULTS + canAccess + resolveUserPermissions
│   ├── prisma.ts            # Prisma singleton
│   └── export.ts            # CSV + PDF export helpers
├── store/                   # authStore (session + canAccess)
└── types/                   # api.ts, models.ts, store.ts, index.ts
```

### RBAC

Permissions are resolved in two steps: role defaults first, per-user overrides win.

| Role | TASKS | USERS | AUDIT | ANALYTICS | SETTINGS |
|---|---|---|---|---|---|
| Admin | MANAGE | MANAGE | READ | READ | MANAGE |
| Manager | READ, WRITE | READ | — | READ | — |
| Employee | READ | — | — | — | — |

An Admin can grant an Employee `USERS.READ`, or revoke a Manager's `TASKS.WRITE`, independently of their role — changes take effect immediately on the next request.

### API response envelope

```json
// Success
{ "success": true, "data": <T> }

// Paginated
{ "success": true, "data": [...], "meta": { "page", "limit", "total", "totalPages", "hasNext", "hasPrev" } }

// Error
{ "success": false, "error": "Human-readable message", "code": "ERROR_CODE" }
```

---

## Local Setup

**Prerequisites:** Node.js 18+, a PostgreSQL database (local or [Neon](https://neon.tech) free tier)

```bash
# 1. Clone the repository
git clone https://github.com/yourhandle/orgnest.git
cd orgnest

# 2. Install dependencies
npm install

# 3. Create your environment file
cp .env.example .env.local
# Edit .env.local — fill in DATABASE_URL and JWT_SECRET (see table below)

# 4. Run database migrations
npx prisma migrate deploy

# 5. Seed the database with demo data and users
npm run seed

# 6. Start the development server
npm run dev
```

App → [http://localhost:3000](http://localhost:3000)  
API docs → [http://localhost:3000/api-docs](http://localhost:3000/api-docs)

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string — supports Neon `?sslmode=require` |
| `JWT_SECRET` | Yes | Secret used to sign JWTs — minimum 32 characters |
| `NODE_ENV` | No | `development` \| `production` (defaults to `development`) |
| `NEXT_PUBLIC_APP_URL` | No | Public base URL (defaults to `http://localhost:3000`) |

All variables are validated at startup by Zod. A missing or malformed value exits the process with a clear error message before any request is served.

---

## Test Credentials

These accounts are created by the seed script (`npm run seed`). Use them to explore different permission levels.

| Role | Email | Password |
|---|---|---|
| Admin | `sarah.chen@orgnest.dev` | `Admin@1234` |
| Manager | `james.rivera@orgnest.dev` | `Manager@1234` |
| Manager | `priya.patel@orgnest.dev` | `Manager@1234` |
| Employee | `alex.kim@orgnest.dev` | `Employee@1234` |
| Employee | `maria.garcia@orgnest.dev` | `Employee@1234` |
| Employee | `david.chen@orgnest.dev` | `Employee@1234` |
| Employee | `emma.johnson@orgnest.dev` | `Employee@1234` |
| Employee | `liam.nguyen@orgnest.dev` | `Employee@1234` |
| Employee | `sofia.martinez@orgnest.dev` | `Employee@1234` |

> **Live demo:** if you want to check the deployed version without running locally, use the Admin or Manager credentials above against the production URL.

---

## Available Scripts

```bash
npm run dev          # Development server (Next.js)
npm run build        # Production build
npm run start        # Start production server
npm run type-check   # TypeScript type check (tsc --noEmit)
npm run format       # Format source files with Prettier
npm run seed         # Seed the database with demo data
```
