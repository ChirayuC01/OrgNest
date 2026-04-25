import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  Shield,
  BarChart3,
  ClipboardList,
  Users,
  ScrollText,
  Lock,
  ArrowRight,
  Github,
} from "lucide-react";

const features = [
  {
    icon: ClipboardList,
    title: "Task Management",
    description:
      "Create, assign, and track tasks with priority levels, due dates, and rich descriptions.",
  },
  {
    icon: Shield,
    title: "Role-Based Access Control",
    description:
      "ADMIN, MANAGER, and EMPLOYEE roles with a typed permissions matrix enforced on every API call.",
  },
  {
    icon: Lock,
    title: "Fine-Grained Permissions",
    description:
      "Admins can grant or revoke module access per user, overriding role defaults on a per-action basis.",
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    description:
      "Visual insights into task completion rates, priority distribution, and team activity trends.",
  },
  {
    icon: ScrollText,
    title: "Immutable Audit Logs",
    description:
      "Every user action — task changes, permission updates — is recorded with full metadata.",
  },
  {
    icon: Users,
    title: "Team Management",
    description:
      "Invite team members by email, manage roles, and control access — all from one place.",
  },
];

const techStack = [
  "Next.js 16",
  "React 19",
  "TypeScript",
  "Prisma ORM",
  "PostgreSQL",
  "Tailwind CSS v4",
  "shadcn/ui",
  "Zod",
  "JWT Auth",
  "Zustand",
];

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Nav */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex h-14 items-center justify-between">
          <span className="font-semibold text-lg tracking-tight">OrgNest</span>
          <nav className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/docs" target="_blank">API Docs</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/signup">Get started</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-24 sm:py-32">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(99,102,241,0.15),transparent_60%)]" />
          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
            <Badge
              variant="secondary"
              className="mb-6 bg-white/10 text-white border-white/20 hover:bg-white/10"
            >
              Multi-tenant SaaS · Production-grade RBAC
            </Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white mb-6">
              Organize your team.
              <br />
              <span className="text-indigo-400">Ship faster.</span>
            </h1>
            <p className="text-lg sm:text-xl text-slate-300 mb-10 max-w-2xl mx-auto leading-relaxed">
              OrgNest is a production-ready team task management platform with fine-grained permissions,
              real-time audit logging, and a clean, accessible interface.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                size="lg"
                className="w-full sm:w-auto bg-indigo-500 hover:bg-indigo-600 text-white"
                asChild
              >
                <Link href="/signup">
                  Start for free <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto border-white/20 text-white hover:bg-white/10 hover:text-white"
                asChild
              >
                <Link href="/login">Sign in to your org</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-20 sm:py-24 max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold tracking-tight mb-3">Everything your team needs</h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Built with the patterns and architecture you&apos;d find in real production SaaS applications.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-xl border bg-card p-6 space-y-3 hover:shadow-md transition-shadow"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <f.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold text-sm">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Architecture callout */}
        <section className="py-20 bg-muted/40 border-y">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tight mb-3">Production-grade architecture</h2>
              <p className="text-muted-foreground text-lg">
                Not a tutorial project. Built to demonstrate real engineering decisions.
              </p>
            </div>
            <div className="grid sm:grid-cols-3 gap-8 text-center">
              {[
                {
                  step: "01",
                  title: "Multi-tenant isolation",
                  desc: "Every record is scoped to a tenant. No cross-org data leakage, enforced at the query layer.",
                },
                {
                  step: "02",
                  title: "Layered RBAC",
                  desc: "Role defaults are a typed constant. Per-user overrides are stored in DB and resolved at request time.",
                },
                {
                  step: "03",
                  title: "URL-state filtering",
                  desc: "All task filters live in the URL — shareable, bookmarkable, survives refresh. Cursor pagination for scale.",
                },
              ].map((item) => (
                <div key={item.step} className="space-y-2">
                  <span className="text-4xl font-bold text-muted-foreground/30">{item.step}</span>
                  <h3 className="font-semibold">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Tech stack */}
        <section className="py-16 max-w-6xl mx-auto px-4 sm:px-6">
          <p className="text-center text-sm text-muted-foreground mb-6 font-medium uppercase tracking-wider">
            Built with
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {techStack.map((tech) => (
              <Badge key={tech} variant="outline" className="text-xs px-3 py-1">
                {tech}
              </Badge>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 bg-gradient-to-br from-slate-900 to-slate-800">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle className="h-10 w-10 text-indigo-400" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">Ready to explore?</h2>
            <p className="text-slate-300 mb-8">
              Create a free organization account. Invite your team, assign tasks, and see the
              permission system in action.
            </p>
            <Button
              size="lg"
              className="bg-indigo-500 hover:bg-indigo-600 text-white"
              asChild
            >
              <Link href="/signup">
                Create your organization <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-8 bg-background">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">OrgNest</span>
          <div className="flex items-center gap-4">
            <Link href="/docs" className="hover:text-foreground transition-colors">
              API Docs
            </Link>
            <Link href="/dashboard" className="hover:text-foreground transition-colors">
              Dashboard
            </Link>
            <Link
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors flex items-center gap-1"
            >
              <Github className="h-4 w-4" />
              GitHub
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
