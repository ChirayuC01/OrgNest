/**
 * OrgNest — Database Seed
 * Run: npx prisma db seed
 *
 * ┌─────────────────────────────────────────────────────┐
 * │  CREDENTIALS                                        │
 * │                                                     │
 * │  ADMIN                                              │
 * │    sarah.chen@orgnest.dev     Admin@1234            │
 * │                                                     │
 * │  MANAGERS                                           │
 * │    james.rivera@orgnest.dev   Manager@1234          │
 * │    priya.patel@orgnest.dev    Manager@1234          │
 * │                                                     │
 * │  EMPLOYEES                                          │
 * │    alex.morgan@orgnest.dev    Employee@1234         │
 * │    tom.nakamura@orgnest.dev   Employee@1234         │
 * │    lisa.okafor@orgnest.dev    Employee@1234         │
 * │    dan.kowalski@orgnest.dev   Employee@1234         │
 * │    nina.volkov@orgnest.dev    Employee@1234         │
 * │    omar.hassan@orgnest.dev    Employee@1234         │
 * └─────────────────────────────────────────────────────┘
 */

import { PrismaClient, TaskStatus, NotificationType } from "@prisma/client";
import bcrypt from "bcryptjs";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config(); // fallback to .env

const prisma = new PrismaClient();

// ─── Helpers ─────────────────────────────────────────────────────────────────

function hash(pw: string) {
  return bcrypt.hash(pw, 10);
}

function daysFromNow(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + n);
  d.setHours(0, 0, 0, 0);
  return d;
}

function daysAgo(n: number): Date {
  return daysFromNow(-n);
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickMany<T>(arr: T[], n: number): T[] {
  const copy = [...arr];
  const result: T[] = [];
  for (let i = 0; i < Math.min(n, copy.length); i++) {
    const idx = Math.floor(Math.random() * copy.length);
    result.push(copy.splice(idx, 1)[0]);
  }
  return result;
}

// ─── Seed data definitions ────────────────────────────────────────────────────

const LABELS = [
  { name: "Bug", color: "#ef4444" },
  { name: "Feature", color: "#6366f1" },
  { name: "Enhancement", color: "#3b82f6" },
  { name: "Documentation", color: "#64748b" },
  { name: "Performance", color: "#f97316" },
  { name: "Security", color: "#8b5cf6" },
  { name: "Design", color: "#ec4899" },
  { name: "Testing", color: "#10b981" },
  { name: "DevOps", color: "#14b8a6" },
  { name: "Tech Debt", color: "#f59e0b" },
];

const TASKS: Array<{
  title: string;
  description: string;
  priority: 1 | 2 | 3;
  status: TaskStatus;
  dueDelta: number | null; // days from now (negative = past due)
  labelNames: string[];
  subtasks: string[];
  comments: string[];
}> = [
  // ── Sprint 1: Auth & Onboarding ──
  {
    title: "Implement OAuth2 social login (Google, GitHub)",
    description:
      "Add OAuth2 authentication flow using NextAuth.js. Support Google and GitHub providers. Store provider tokens securely and handle account linking for existing email users.",
    priority: 3,
    status: "IN_PROGRESS",
    dueDelta: 3,
    labelNames: ["Feature", "Security"],
    subtasks: [
      "Configure Google OAuth credentials in GCP Console",
      "Configure GitHub OAuth app",
      "Install and configure NextAuth adapter",
      "Add provider buttons to login page",
      "Handle account linking edge cases",
      "Write integration tests",
    ],
    comments: [
      "I've set up the GCP Console credentials. Waiting on the GitHub app to be approved.",
      "NextAuth adapter is installed. Starting on the UI changes.",
      "Heads up: account linking needs careful thought — users who signed up with email might try to use OAuth with the same address.",
    ],
  },
  {
    title: "Add email verification on signup",
    description:
      "New users should verify their email before accessing the dashboard. Send a one-time token via email (Resend), expire it after 24 hours, and show a clear prompt on the dashboard if not verified.",
    priority: 3,
    status: "TODO",
    dueDelta: 7,
    labelNames: ["Feature", "Security"],
    subtasks: [
      "Integrate Resend email API",
      "Create VerificationToken model in Prisma",
      "Build /api/auth/verify-email endpoint",
      "Add verification banner to dashboard",
      "Handle resend link flow",
    ],
    comments: [
      "Let's use Resend — they have a great Next.js integration and generous free tier.",
    ],
  },
  {
    title: "Forgot password / reset flow",
    description:
      "Allow users to reset their password via email link. Token expires in 1 hour. Invalidate all existing sessions after a successful reset.",
    priority: 2,
    status: "TODO",
    dueDelta: 10,
    labelNames: ["Feature"],
    subtasks: [
      "Add PasswordResetToken model",
      "Build forgot-password API route",
      "Build reset-password API route",
      "Design reset email template",
      "Add forgot password link to login page",
    ],
    comments: [],
  },
  {
    title: "Onboarding wizard for new tenants",
    description:
      "First-time admins should see a multi-step wizard: name the org, invite team members, create their first project. Skip option available at each step.",
    priority: 2,
    status: "TODO",
    dueDelta: 14,
    labelNames: ["Feature", "Design"],
    subtasks: [
      "Design wizard stepper component",
      "Step 1: Org profile (name, logo upload)",
      "Step 2: Invite teammates by email",
      "Step 3: Create first task",
      "Track completion in User model (onboardingDone field)",
    ],
    comments: [
      "Should we use a modal or a dedicated /onboarding route? I think a dedicated route is cleaner.",
    ],
  },

  // ── Sprint 2: Task Management ──
  {
    title: "Recurring tasks support",
    description:
      "Allow tasks to be marked as recurring (daily, weekly, monthly). When a recurring task is completed, automatically create the next instance with a bumped due date.",
    priority: 2,
    status: "TODO",
    dueDelta: 21,
    labelNames: ["Feature"],
    subtasks: [
      "Add RecurrenceRule model (frequency, interval, endDate)",
      "Build cron job to generate next instance on completion",
      "Add recurrence UI to CreateTaskDialog",
      "Show recurrence badge on TaskCard",
    ],
    comments: [],
  },
  {
    title: "Task dependencies (blocked by / blocks)",
    description:
      "Let tasks declare that they block or are blocked by other tasks. Blocked tasks should be visually distinct in the Kanban view and prevent status progression until blockers are resolved.",
    priority: 2,
    status: "TODO",
    dueDelta: 28,
    labelNames: ["Feature", "Enhancement"],
    subtasks: [
      "Add TaskDependency join model",
      "API: link/unlink dependencies",
      "Kanban: show blocked indicator",
      "Enforce: blocked tasks cannot move to IN_PROGRESS",
    ],
    comments: [],
  },
  {
    title: "Bulk task actions (select & move / delete)",
    description:
      "Users should be able to select multiple tasks with checkboxes and apply batch operations: change status, reassign, delete, or export the selection.",
    priority: 2,
    status: "IN_PROGRESS",
    dueDelta: 5,
    labelNames: ["Enhancement"],
    subtasks: [
      "Add checkbox to TaskCard",
      "Build selection state in task store",
      "Build BulkActionsBar component (shows when >0 selected)",
      "Implement bulk PATCH /api/tasks endpoint",
      "Implement bulk DELETE with confirmation dialog",
    ],
    comments: [
      "The checkbox on TaskCard is done. Working on the selection state now.",
      "Should bulk reassign only be available to managers and admins? +1 from me.",
    ],
  },
  {
    title: "Task templates library",
    description:
      "Admins can define reusable task templates (title, description, labels, subtasks). Members can instantiate a template with one click when creating a task.",
    priority: 1,
    status: "TODO",
    dueDelta: 35,
    labelNames: ["Feature"],
    subtasks: [
      "Add Template model (tenantId, name, config JSON)",
      "API: CRUD for templates (MANAGE permission)",
      "UI: Template library page in Settings",
      "UI: 'Use template' button in CreateTaskDialog",
    ],
    comments: [],
  },
  {
    title: "Fix: task search ignores description field",
    description:
      "The ?search= query param on GET /api/tasks only matches against `title`. It should also search `description`. A user reported that searching for a known keyword only visible in the description returns 0 results.",
    priority: 3,
    status: "DONE",
    dueDelta: null,
    labelNames: ["Bug"],
    subtasks: [],
    comments: [
      "Confirmed — the Prisma `where` only has `title: { contains: search }`. Need to add description to the OR clause.",
      "Fixed in PR #47. Deployed to staging. Closing.",
    ],
  },
  {
    title: "Fix: due date shows wrong timezone on TaskCard",
    description:
      "Due dates are stored as UTC midnight but displayed using `toLocaleDateString()` which shifts the date by the browser timezone offset. A task due on 2026-05-01 shows as 2026-04-30 in UTC-5.",
    priority: 3,
    status: "DONE",
    dueDelta: null,
    labelNames: ["Bug"],
    subtasks: [],
    comments: [
      "Root cause: `new Date(dueDate)` in UTC then `.toLocaleDateString()` shifts it. Use `{ timeZone: 'UTC' }` in the options.",
      "PR up. Added a util `formatDueDate(dateStr)` that all components should use going forward.",
    ],
  },

  // ── Sprint 3: UI/UX ──
  {
    title: "Dark mode refinements — chart and badge colors",
    description:
      "Several components look broken in dark mode: Recharts tooltips have a white background, priority badges use hardcoded colors, and the Kanban column headers are unreadable.",
    priority: 2,
    status: "IN_PROGRESS",
    dueDelta: 2,
    labelNames: ["Bug", "Design"],
    subtasks: [
      "Fix Recharts tooltip background (use CSS var)",
      "Update priority badge to use semantic color tokens",
      "Fix Kanban column header contrast",
      "Audit all hardcoded color values with grep",
    ],
    comments: [
      "The Recharts fix is tricky — their tooltip doesn't use CSS vars. We may need a custom tooltip component.",
    ],
  },
  {
    title: "Responsive table for Audit log page",
    description:
      "The audit log table overflows horizontally on screens smaller than 1024px. Implement a responsive design: stack rows on mobile, show abbreviated columns on tablet.",
    priority: 1,
    status: "IN_REVIEW",
    dueDelta: 1,
    labelNames: ["Design", "Enhancement"],
    subtasks: [
      "Add horizontal scroll container as fallback",
      "Hide low-priority columns on <768px",
      "Card view for mobile (<640px)",
    ],
    comments: [
      "Card view looks great on iPhone. Ready for review.",
      "One nit: the metadata column content is very long and wraps weirdly. Truncate to 80 chars with tooltip.",
    ],
  },
  {
    title: "Keyboard navigation for Kanban board",
    description:
      "Power users should be able to navigate the Kanban board without a mouse. Arrow keys to move between cards, Enter to open detail, Escape to close, and modifier+arrow to move a card between columns.",
    priority: 1,
    status: "TODO",
    dueDelta: 30,
    labelNames: ["Enhancement", "Design"],
    subtasks: [
      "Add tabIndex and aria attributes to KanbanCard",
      "Implement arrow key navigation within a column",
      "Implement column change with Ctrl+ArrowLeft/Right",
      "Add focus ring styling",
    ],
    comments: [],
  },
  {
    title: "Command palette (Cmd+K)",
    description:
      "Add a global command palette triggered by Cmd+K (or Ctrl+K). Commands: navigate to any dashboard section, create task, search tasks, change theme, log out.",
    priority: 2,
    status: "TODO",
    dueDelta: 20,
    labelNames: ["Feature", "Enhancement"],
    subtasks: [
      "Wire up cmdk package (already installed)",
      "Define command list with icons",
      "Add keyboard listener in layout",
      "Show recent tasks in search results",
    ],
    comments: [
      "cmdk is already a dependency — great, no new package needed.",
    ],
  },

  // ── Sprint 4: Notifications & Integrations ──
  {
    title: "Slack integration for task notifications",
    description:
      "Admins can connect a Slack workspace via OAuth. Configure which events trigger Slack messages: task assigned, status change, overdue. Messages include a link back to the task.",
    priority: 2,
    status: "TODO",
    dueDelta: 45,
    labelNames: ["Feature", "DevOps"],
    subtasks: [
      "Register Slack app and obtain client ID/secret",
      "Build /api/integrations/slack/connect OAuth callback",
      "Add SlackWebhookUrl field to Tenant model",
      "POST to webhook on relevant events",
      "Settings UI to connect/disconnect Slack",
    ],
    comments: [],
  },
  {
    title: "Email digest — daily task summary",
    description:
      "Each morning, send each user a digest email: tasks due today, overdue tasks, and tasks assigned yesterday. Users can opt out per-account in profile settings.",
    priority: 1,
    status: "TODO",
    dueDelta: 40,
    labelNames: ["Feature"],
    subtasks: [
      "Add emailDigest Boolean to User model",
      "Build cron job (Vercel Cron or pg_cron) to send at 08:00 per-tenant timezone",
      "Design digest email template",
      "Add opt-out toggle in Profile settings",
    ],
    comments: [],
  },
  {
    title: "Push notifications (PWA)",
    description:
      "Register a service worker and use the Web Push API to deliver browser push notifications for task assignments and @mentions in comments, even when the app isn't open.",
    priority: 1,
    status: "TODO",
    dueDelta: 60,
    labelNames: ["Feature"],
    subtasks: [
      "Add next-pwa and configure manifest",
      "Implement service worker with push event handler",
      "Store push subscription in DB",
      "Send VAPID push from API on assignment/comment",
    ],
    comments: [],
  },

  // ── Sprint 5: Performance & DevOps ──
  {
    title: "Add Redis cache layer for hot queries",
    description:
      "Analytics and dashboard widget queries run on every page load. Cache results in Redis (Upstash) with a 60-second TTL. Invalidate on task write operations.",
    priority: 3,
    status: "IN_PROGRESS",
    dueDelta: 4,
    labelNames: ["Performance", "DevOps"],
    subtasks: [
      "Provision Upstash Redis instance",
      "Install @upstash/redis and set env vars",
      "Wrap analytics query with cache.get/set",
      "Wrap dashboard widget queries",
      "Add cache-busting on task PATCH/POST/DELETE",
    ],
    comments: [
      "Upstash is provisioned. Starting on the wrapper utility.",
      "The cache invalidation strategy is the tricky part — we need to be careful not to serve stale data to the wrong tenant.",
    ],
  },
  {
    title: "Database connection pooling (PgBouncer)",
    description:
      "Neon serverless functions open a new DB connection per invocation, exhausting the connection limit under load. Set up PgBouncer via Neon's pooling URL and switch the Prisma datasource URL.",
    priority: 3,
    status: "DONE",
    dueDelta: null,
    labelNames: ["Performance", "DevOps"],
    subtasks: [],
    comments: [
      "Switched to Neon's pooler URL. P99 latency dropped from 420ms to 95ms. Closing.",
    ],
  },
  {
    title: "Set up Sentry error monitoring",
    description:
      "Integrate Sentry for both client-side and server-side error tracking. Capture unhandled promise rejections, React error boundaries, and API 5xx responses.",
    priority: 2,
    status: "IN_REVIEW",
    dueDelta: 2,
    labelNames: ["DevOps"],
    subtasks: [
      "Install @sentry/nextjs",
      "Configure sentry.client.config.ts and sentry.server.config.ts",
      "Wrap API error handler to capture events",
      "Add Sentry to Error Boundaries",
      "Set up Slack alert channel in Sentry",
    ],
    comments: [
      "All set up. Can you review the sourcemap config? Want to make sure stack traces resolve to real file names.",
      "Sourcemaps look good in Sentry. Merged.",
    ],
  },
  {
    title: "Lighthouse audit — improve Core Web Vitals",
    description:
      "Current Lighthouse scores: Performance 61, Accessibility 78, Best Practices 92. Target: all above 90. Main issues: LCP from unoptimised images, CLS from skeleton-to-content shift.",
    priority: 2,
    status: "TODO",
    dueDelta: 25,
    labelNames: ["Performance"],
    subtasks: [
      "Replace <img> with next/image across all components",
      "Add explicit width/height or aspect-ratio to skeleton placeholders",
      "Lazy-load Recharts (dynamic import)",
      "Audit and fix aria-label gaps (Accessibility score)",
    ],
    comments: [],
  },
  {
    title: "Write load tests with k6",
    description:
      "Create k6 scripts that simulate 100 concurrent users performing realistic flows: login → view tasks → create task → update status. Run weekly in CI and alert if P95 > 500ms.",
    priority: 1,
    status: "TODO",
    dueDelta: 50,
    labelNames: ["Testing", "DevOps"],
    subtasks: [
      "Install k6 and create test script",
      "Implement login + task creation flow",
      "Add to GitHub Actions weekly schedule",
      "Set P95 threshold and configure alert",
    ],
    comments: [],
  },

  // ── Sprint 6: Security ──
  {
    title: "CSRF protection on all state-changing endpoints",
    description:
      "While HttpOnly cookies prevent JS access, CSRF attacks can still submit requests from other origins. Implement Double Submit Cookie pattern or use the SameSite=Strict cookie attribute consistently.",
    priority: 3,
    status: "DONE",
    dueDelta: null,
    labelNames: ["Security"],
    subtasks: [],
    comments: [
      "Verified all cookies already have SameSite=Strict. Modern browsers + SameSite=Strict = no CSRF without user interaction. Closing as addressed.",
    ],
  },
  {
    title: "Content Security Policy headers audit",
    description:
      "The current CSP allows 'unsafe-inline' styles (required for shadcn/Tailwind). Investigate nonce-based approach to tighten the policy without breaking the UI.",
    priority: 2,
    status: "IN_PROGRESS",
    dueDelta: 6,
    labelNames: ["Security"],
    subtasks: [
      "List all inline style/script usages",
      "Implement nonce generation in middleware",
      "Pass nonce to all Script/Style tags",
      "Test in report-only mode before enforcing",
    ],
    comments: [
      "The nonce approach requires patching next.config.ts to inject headers. Starting on that.",
    ],
  },
  {
    title: "Secrets rotation procedure",
    description:
      "Document and automate rotation of JWT_SECRET, database password, and OAuth client secrets. Rotating JWT_SECRET invalidates all active sessions — implement graceful handling.",
    priority: 2,
    status: "TODO",
    dueDelta: 30,
    labelNames: ["Security", "Documentation"],
    subtasks: [
      "Document rotation runbook in /docs/runbooks/secrets.md",
      "Support JWT_SECRET_PREVIOUS in verifyToken fallback",
      "Automate Neon password rotation via GitHub Action",
    ],
    comments: [],
  },

  // ── Sprint 7: Documentation & Testing ──
  {
    title: "API integration test suite (Vitest + Supertest)",
    description:
      "Write integration tests for all API routes. Use a real test database (separate Neon branch). Cover happy paths, auth errors, permission denials, and validation failures.",
    priority: 2,
    status: "TODO",
    dueDelta: 35,
    labelNames: ["Testing"],
    subtasks: [
      "Configure Vitest with ts-node",
      "Set up test DB and reset between test files",
      "Tests: /api/auth/* (login, logout, refresh)",
      "Tests: /api/tasks CRUD + filters",
      "Tests: /api/users CRUD + permissions",
      "CI: run tests on every PR",
    ],
    comments: [],
  },
  {
    title: "Component storybook",
    description:
      "Add Storybook for all shared UI components (Button, Badge, TaskCard, KanbanBoard, etc.). Include stories for all variants and states (loading, empty, error).",
    priority: 1,
    status: "TODO",
    dueDelta: 45,
    labelNames: ["Documentation", "Testing"],
    subtasks: [
      "Install and configure Storybook for Next.js",
      "Write stories for design system primitives",
      "Write stories for TaskCard, KanbanBoard, DashboardWidgets",
      "Deploy Storybook to Chromatic for visual regression",
    ],
    comments: [],
  },
  {
    title: "Update README with deployment guide",
    description:
      "The README mentions Vercel + Neon but doesn't have step-by-step deployment instructions. Add: fork → env vars → Neon project setup → Vercel project link → first deploy → run migrations.",
    priority: 1,
    status: "IN_REVIEW",
    dueDelta: 1,
    labelNames: ["Documentation"],
    subtasks: [],
    comments: [
      "Draft is up. Can someone who hasn't set this up before do a dry run and check if any steps are missing?",
      "I followed the guide on a fresh machine. Step 4 is missing the `npx prisma migrate deploy` command. Otherwise it's solid.",
    ],
  },
  {
    title: "Add JSDoc to all exported utility functions",
    description:
      "Several helpers in /src/lib (rateLimit, permissions, export, audit) have no documentation. Add JSDoc comments with param/return descriptions and usage examples.",
    priority: 1,
    status: "TODO",
    dueDelta: 20,
    labelNames: ["Documentation", "Tech Debt"],
    subtasks: [
      "Document src/lib/rateLimit.ts",
      "Document src/lib/permissions.ts",
      "Document src/lib/export.ts",
      "Document src/lib/audit.ts",
      "Document src/helper/apiResponse.ts",
    ],
    comments: [],
  },

  // ── Sprint 8: Analytics & Reporting ──
  {
    title: "Per-project burn-down chart",
    description:
      "Show a burn-down chart on the analytics page: total tasks vs completed tasks per day over the sprint window. Requires daily task completion snapshots or derived from TaskHistory.",
    priority: 2,
    status: "TODO",
    dueDelta: 30,
    labelNames: ["Feature", "Performance"],
    subtasks: [
      "Create daily snapshot cron job (or derive from TaskHistory)",
      "API: GET /api/analytics/burndown?days=14",
      "Recharts AreaChart component",
      "Add to Analytics page below existing charts",
    ],
    comments: [],
  },
  {
    title: "Export analytics report as PDF",
    description:
      "Add an 'Export Report' button to the Analytics page that generates a PDF containing all 4 charts and the stat cards. Use jsPDF (already installed) with html2canvas for chart capture.",
    priority: 1,
    status: "TODO",
    dueDelta: 25,
    labelNames: ["Feature"],
    subtasks: [
      "Install html2canvas",
      "Build captureCharts() utility",
      "Generate PDF with jsPDF",
      "Add Export button to Analytics page header",
    ],
    comments: [],
  },

  // ── Sprint 9: Admin & Settings ──
  {
    title: "Tenant settings page",
    description:
      "Create a /dashboard/settings page (ADMIN only) with: org name, logo upload, default task priority, allowed email domains for signup, danger zone (delete org).",
    priority: 2,
    status: "TODO",
    dueDelta: 40,
    labelNames: ["Feature"],
    subtasks: [
      "Extend Tenant model (logo, defaultPriority, allowedDomains)",
      "API: PATCH /api/settings (SETTINGS.MANAGE permission)",
      "Settings page layout with section tabs",
      "Logo upload to S3/R2",
      "Danger zone: delete org with confirmation",
    ],
    comments: [],
  },
  {
    title: "Activity feed on user profile",
    description:
      "The user profile page should show a personal activity feed: tasks created, status changes made, comments posted, last 30 days. Derived from AuditLog and TaskHistory.",
    priority: 1,
    status: "TODO",
    dueDelta: 35,
    labelNames: ["Feature"],
    subtasks: [
      "API: GET /api/users/me/activity",
      "Build ActivityFeed component (timeline style)",
      "Add to Profile page",
    ],
    comments: [],
  },
  {
    title: "Overdue task auto-escalation",
    description:
      "When a task is more than 2 days overdue and still in TODO/IN_PROGRESS, automatically send a notification to the assignee and their manager. Log the escalation in AuditLog.",
    priority: 2,
    status: "TODO",
    dueDelta: 28,
    labelNames: ["Feature"],
    subtasks: [
      "Build /api/cron/escalate route (Vercel Cron)",
      "Query tasks: overdue > 2 days, not DONE",
      "Send notifications to assignee + manager",
      "Create AuditLog entry for each escalation",
      "Add escalatedAt field to Task to avoid double-escalation",
    ],
    comments: [],
  },

  // ── Overdue / Past Due ──
  {
    title: "Fix memory leak in SSE stream endpoint",
    description:
      "The /api/tasks/stream route creates a new DB polling interval per connection but doesn't clear it when the client disconnects. Under load this causes the Node.js process to accumulate timers and slow down.",
    priority: 3,
    status: "IN_PROGRESS",
    dueDelta: -2,
    labelNames: ["Bug", "Performance"],
    subtasks: [
      "Add cleanup logic in stream close handler",
      "Verify with Node.js --expose-gc and heap snapshot",
    ],
    comments: [
      "Reproduced locally with 20 concurrent connections. Memory grows ~2MB per connection and never drops.",
      "The fix is a clearInterval in the `req.signal.addEventListener('abort', ...)` handler. PR up.",
    ],
  },
  {
    title: "Migrate from bcrypt to argon2",
    description:
      "bcrypt with cost factor 10 is slow on modern hardware. Migrate to argon2id which is memory-hard and recommended by OWASP. Rehash passwords lazily on next login.",
    priority: 2,
    status: "TODO",
    dueDelta: -5,
    labelNames: ["Security", "Tech Debt"],
    subtasks: [
      "Install argon2 package",
      "Update hashPassword() and comparePassword()",
      "Add passwordAlgo field to User (bcrypt | argon2)",
      "On successful bcrypt login: rehash with argon2 and update",
    ],
    comments: [
      "The lazy migration approach means we don't need a forced password reset. +1 for this approach.",
    ],
  },
  {
    title: "Fix broken pagination on team page",
    description:
      "The team page fetches all users (limit=100) but doesn't show pagination controls. When there are >100 users the list is silently truncated. Add proper pagination matching the tasks page.",
    priority: 2,
    status: "TODO",
    dueDelta: -3,
    labelNames: ["Bug"],
    subtasks: [
      "Add usePagination hook to team page",
      "Add page/limit to user fetch params",
      "Render pagination controls below table",
    ],
    comments: [],
  },
];

// ─── Main seed function ───────────────────────────────────────────────────────

async function main() {
  console.log("🌱  Starting seed...");

  // Wipe existing data in dependency order
  await prisma.notification.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.taskComment.deleteMany();
  await prisma.taskHistory.deleteMany();
  await prisma.taskLabel.deleteMany();
  await prisma.subtask.deleteMany();
  await prisma.task.deleteMany();
  await prisma.label.deleteMany();
  await prisma.userPermission.deleteMany();
  await prisma.user.deleteMany();
  await prisma.tenant.deleteMany();

  console.log("🗑️   Cleared existing data");

  // ── Tenant ──────────────────────────────────────────────────────────────────

  const tenant = await prisma.tenant.create({
    data: { name: "OrgNest Demo" },
  });

  console.log(`🏢  Tenant: ${tenant.name} (${tenant.id})`);

  // ── Users ────────────────────────────────────────────────────────────────────

  const [
    adminPw,
    managerPw,
    employeePw,
  ] = await Promise.all([
    hash("Admin@1234"),
    hash("Manager@1234"),
    hash("Employee@1234"),
  ]);

  const usersData = [
    // Admin
    { name: "Sarah Chen", email: "sarah.chen@orgnest.dev", role: "ADMIN" as const, password: adminPw },
    // Managers
    { name: "James Rivera", email: "james.rivera@orgnest.dev", role: "MANAGER" as const, password: managerPw },
    { name: "Priya Patel", email: "priya.patel@orgnest.dev", role: "MANAGER" as const, password: managerPw },
    // Employees
    { name: "Alex Morgan", email: "alex.morgan@orgnest.dev", role: "EMPLOYEE" as const, password: employeePw },
    { name: "Tom Nakamura", email: "tom.nakamura@orgnest.dev", role: "EMPLOYEE" as const, password: employeePw },
    { name: "Lisa Okafor", email: "lisa.okafor@orgnest.dev", role: "EMPLOYEE" as const, password: employeePw },
    { name: "Dan Kowalski", email: "dan.kowalski@orgnest.dev", role: "EMPLOYEE" as const, password: employeePw },
    { name: "Nina Volkov", email: "nina.volkov@orgnest.dev", role: "EMPLOYEE" as const, password: employeePw },
    { name: "Omar Hassan", email: "omar.hassan@orgnest.dev", role: "EMPLOYEE" as const, password: employeePw },
  ];

  const users = await Promise.all(
    usersData.map((u) =>
      prisma.user.create({
        data: { ...u, tenantId: tenant.id },
      })
    )
  );

  const [admin, manager1, manager2, ...employees] = users;

  console.log(`👤  Created ${users.length} users`);

  // ── Special permission override: one employee gets USERS.READ ────────────────

  await prisma.userPermission.create({
    data: {
      userId: employees[0].id, // Alex Morgan
      module: "USERS",
      action: "READ",
      granted: true,
      tenantId: tenant.id,
    },
  });

  // ── Labels ───────────────────────────────────────────────────────────────────

  const labels = await Promise.all(
    LABELS.map((l) =>
      prisma.label.create({ data: { ...l, tenantId: tenant.id } })
    )
  );

  const labelByName = Object.fromEntries(labels.map((l) => [l.name, l]));

  console.log(`🏷️   Created ${labels.length} labels`);

  // ── Tasks ────────────────────────────────────────────────────────────────────

  const assignableUsers = [...users]; // all users can be assigned
  const writerUsers = [admin, manager1, manager2]; // realistic creators
  const commenterPool = users;

  const createdTasks = [];

  for (const t of TASKS) {
    const creator = pick(writerUsers);
    const assignee = Math.random() > 0.15 ? pick(assignableUsers) : null;
    const assigner = assignee ? (Math.random() > 0.3 ? creator : pick(writerUsers)) : null;

    const dueDate = t.dueDelta !== null ? daysFromNow(t.dueDelta) : null;

    const task = await prisma.task.create({
      data: {
        title: t.title,
        description: t.description,
        status: t.status,
        priority: t.priority,
        tenantId: tenant.id,
        createdById: creator.id,
        assignedToId: assignee?.id ?? null,
        assignedById: assigner?.id ?? null,
        dueDate,
        // Spread created-at backwards so tasks don't all appear at the same time
        createdAt: daysAgo(Math.floor(Math.random() * 30)),
      },
    });

    // Labels
    const taskLabelEntries = t.labelNames
      .filter((n) => labelByName[n])
      .map((n) => ({ taskId: task.id, labelId: labelByName[n].id }));

    if (taskLabelEntries.length) {
      await prisma.taskLabel.createMany({ data: taskLabelEntries });
    }

    // Subtasks
    for (let i = 0; i < t.subtasks.length; i++) {
      await prisma.subtask.create({
        data: {
          taskId: task.id,
          title: t.subtasks[i],
          completed: t.status === "DONE" ? true : Math.random() > 0.6,
          position: i,
        },
      });
    }

    // Comments
    const commentAuthors = pickMany(commenterPool, t.comments.length);
    for (let i = 0; i < t.comments.length; i++) {
      await prisma.taskComment.create({
        data: {
          taskId: task.id,
          userId: commentAuthors[i]?.id ?? commenterPool[0].id,
          content: t.comments[i],
          createdAt: daysAgo(Math.max(0, t.comments.length - i - 1)),
        },
      });
    }

    // Task history — fabricate a status progression for realism
    const progressions: Array<[TaskStatus | null, TaskStatus]> = [];
    if (t.status === "IN_PROGRESS") {
      progressions.push([null, "TODO"], ["TODO", "IN_PROGRESS"]);
    } else if (t.status === "IN_REVIEW") {
      progressions.push([null, "TODO"], ["TODO", "IN_PROGRESS"], ["IN_PROGRESS", "IN_REVIEW"]);
    } else if (t.status === "DONE") {
      progressions.push(
        [null, "TODO"],
        ["TODO", "IN_PROGRESS"],
        ["IN_PROGRESS", "IN_REVIEW"],
        ["IN_REVIEW", "DONE"]
      );
    }

    for (let i = 0; i < progressions.length; i++) {
      const [oldVal, newVal] = progressions[i];
      await prisma.taskHistory.create({
        data: {
          taskId: task.id,
          userId: pick(writerUsers).id,
          changes: [{ field: "status", oldValue: oldVal, newValue: newVal }],
          createdAt: daysAgo(progressions.length - i + Math.floor(Math.random() * 2)),
        },
      });
    }

    // Notifications for assigned tasks
    if (assignee) {
      await prisma.notification.create({
        data: {
          userId: assignee.id,
          tenantId: tenant.id,
          type: NotificationType.TASK_ASSIGNED,
          title: "Task assigned to you",
          message: `${assigner?.name ?? creator.name} assigned "${task.title}" to you`,
          read: Math.random() > 0.4,
          taskId: task.id,
          createdAt: daysAgo(Math.floor(Math.random() * 7)),
        },
      });
    }

    // Status-change notifications for DONE tasks
    if (t.status === "DONE" && assignee) {
      await prisma.notification.create({
        data: {
          userId: manager1.id,
          tenantId: tenant.id,
          type: NotificationType.TASK_STATUS_CHANGED,
          title: "Task completed",
          message: `"${task.title}" was moved to Done`,
          read: Math.random() > 0.3,
          taskId: task.id,
          createdAt: daysAgo(1),
        },
      });
    }

    createdTasks.push(task);
  }

  console.log(`✅  Created ${createdTasks.length} tasks`);

  // ── Extra notifications (comment added) ──────────────────────────────────────

  const tasksWithComments = createdTasks.filter((_, i) => TASKS[i].comments.length > 0);
  for (const task of tasksWithComments.slice(0, 6)) {
    const recipient = pick(users);
    await prisma.notification.create({
      data: {
        userId: recipient.id,
        tenantId: tenant.id,
        type: NotificationType.TASK_COMMENT_ADDED,
        title: "New comment on task",
        message: `Someone commented on "${task.title}"`,
        read: false,
        taskId: task.id,
        createdAt: daysAgo(Math.floor(Math.random() * 3)),
      },
    });
  }

  // ── Due soon notifications ────────────────────────────────────────────────────

  const nearDueTasks = createdTasks.filter((_, i) => {
    const delta = TASKS[i].dueDelta;
    return delta !== null && delta >= 0 && delta <= 2;
  });
  for (const task of nearDueTasks) {
    const idx = createdTasks.indexOf(task);
    const assigneeId = TASKS[idx] ? createdTasks[idx] : null;
    if (!assigneeId) continue;
    const recipient = pick(users);
    await prisma.notification.create({
      data: {
        userId: recipient.id,
        tenantId: tenant.id,
        type: NotificationType.TASK_DUE_SOON,
        title: "Task due soon",
        message: `"${task.title}" is due within 2 days`,
        read: false,
        taskId: task.id,
        createdAt: daysAgo(0),
      },
    });
  }

  // ── Audit logs ───────────────────────────────────────────────────────────────

  const auditEntries = [
    { action: "LOGIN", entity: "User", metadata: { email: admin.email } },
    { action: "CREATE_USER", entity: "User", entityId: manager1.id, metadata: { email: manager1.email, role: "MANAGER" } },
    { action: "CREATE_USER", entity: "User", entityId: manager2.id, metadata: { email: manager2.email, role: "MANAGER" } },
    ...employees.map((e) => ({
      action: "CREATE_USER",
      entity: "User",
      entityId: e.id,
      metadata: { email: e.email, role: "EMPLOYEE" },
    })),
    ...createdTasks.slice(0, 15).map((t) => ({
      action: "CREATE_TASK",
      entity: "Task",
      entityId: t.id,
      metadata: { title: t.title },
    })),
    ...createdTasks
      .filter((_, i) => TASKS[i].status === "DONE")
      .map((t) => ({
        action: "UPDATE_TASK",
        entity: "Task",
        entityId: t.id,
        metadata: { status: "DONE" },
      })),
    { action: "GRANT_PERMISSION", entity: "UserPermission", entityId: employees[0].id, metadata: { module: "USERS", action: "READ" } },
  ];

  for (const entry of auditEntries) {
    await prisma.auditLog.create({
      data: {
        ...entry,
        userId: admin.id,
        tenantId: tenant.id,
        createdAt: daysAgo(Math.floor(Math.random() * 20)),
      },
    });
  }

  console.log(`📋  Created ${auditEntries.length} audit log entries`);

  // ── Summary ──────────────────────────────────────────────────────────────────

  const counts = await prisma.$transaction([
    prisma.task.count(),
    prisma.subtask.count(),
    prisma.taskComment.count(),
    prisma.taskHistory.count(),
    prisma.notification.count(),
    prisma.label.count(),
    prisma.auditLog.count(),
  ]);

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  ✅  Seed complete");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`  Tenant:        ${tenant.name}`);
  console.log(`  Users:         ${users.length} (1 admin, 2 managers, 6 employees)`);
  console.log(`  Labels:        ${counts[5]}`);
  console.log(`  Tasks:         ${counts[0]}`);
  console.log(`  Subtasks:      ${counts[1]}`);
  console.log(`  Comments:      ${counts[2]}`);
  console.log(`  Task history:  ${counts[3]}`);
  console.log(`  Notifications: ${counts[4]}`);
  console.log(`  Audit logs:    ${counts[6]}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("\n  CREDENTIALS");
  console.log("  ───────────────────────────────────────────");
  console.log("  ADMIN");
  console.log("    sarah.chen@orgnest.dev     Admin@1234");
  console.log("\n  MANAGERS");
  console.log("    james.rivera@orgnest.dev   Manager@1234");
  console.log("    priya.patel@orgnest.dev    Manager@1234");
  console.log("\n  EMPLOYEES");
  console.log("    alex.morgan@orgnest.dev    Employee@1234");
  console.log("    tom.nakamura@orgnest.dev   Employee@1234");
  console.log("    lisa.okafor@orgnest.dev    Employee@1234");
  console.log("    dan.kowalski@orgnest.dev   Employee@1234");
  console.log("    nina.volkov@orgnest.dev    Employee@1234");
  console.log("    omar.hassan@orgnest.dev    Employee@1234");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  console.log("  NOTE: Alex Morgan (employee) has a USERS.READ permission");
  console.log("        override — can view the team page without MANAGER role.\n");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
