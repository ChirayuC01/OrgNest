import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ThemeToggle";
import { cn } from "@/lib/utils";
import {
  CheckSquare,
  Users,
  ShieldCheck,
  BarChart3,
  ArrowRight,
  Layers,
  Zap,
  Lock,
} from "lucide-react";

const features = [
  {
    icon: CheckSquare,
    title: "Task Management",
    description:
      "Create, assign, and track tasks with statuses, priorities, and due dates across your entire organization.",
  },
  {
    icon: Users,
    title: "Team Collaboration",
    description:
      "Invite team members, assign roles, and keep everyone aligned on what matters most.",
  },
  {
    icon: ShieldCheck,
    title: "Granular Permissions",
    description:
      "Fine-grained module-level access control per user. Go beyond roles — grant exactly what each person needs.",
  },
  {
    icon: BarChart3,
    title: "Audit & Visibility",
    description:
      "Every action is logged. Full audit trail across users, tasks, and settings for compliance and transparency.",
  },
  {
    icon: Layers,
    title: "Multi-Tenant",
    description:
      "Each organization gets its own isolated workspace. Your data is never shared with other tenants.",
  },
  {
    icon: Lock,
    title: "Secure by Default",
    description:
      "HttpOnly cookies, short-lived JWTs, refresh tokens, and CSP headers. Security is not an afterthought.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Nav */}
      <header className="border-b border-border/60 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Zap className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg tracking-tight">OrgNest</span>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link href="/login" className={buttonVariants({ variant: "ghost" })}>
              Sign in
            </Link>
            <Link href="/signup" className={buttonVariants()}>
              Get started <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1">
        <section className="py-24 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm text-primary font-medium mb-8">
              <Zap className="h-3.5 w-3.5" />
              Production-grade task management
            </div>
            <h1 className="text-5xl sm:text-6xl font-bold tracking-tight mb-6 leading-tight">
              Where teams get{" "}
              <span className="text-primary">organized</span> and stay{" "}
              <span className="text-primary">accountable</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
              OrgNest brings tasks, teams, and permissions together in one secure workspace. Built
              for organizations that care about structure, visibility, and control.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/signup"
                className={cn(buttonVariants({ size: "lg" }), "text-base px-8")}
              >
                Start for free <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link
                href="/login"
                className={cn(buttonVariants({ size: "lg", variant: "outline" }), "text-base px-8")}
              >
                Sign in to your org
              </Link>
            </div>
            <p className="mt-6 text-sm text-muted-foreground">
              No credit card required. Free forever for small teams.
            </p>
          </div>
        </section>

        {/* Features */}
        <section className="py-20 px-6 bg-muted/30">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-14">
              <h2 className="text-3xl font-bold tracking-tight mb-4">
                Everything your team needs
              </h2>
              <p className="text-muted-foreground text-lg max-w-xl mx-auto">
                From task tracking to enterprise-grade access control, OrgNest has you covered.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature) => (
                <Card
                  key={feature.title}
                  className="border-border/60 hover:border-primary/30 hover:shadow-md transition-all duration-200"
                >
                  <CardHeader className="pb-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                      <feature.icon className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-base">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-24 px-6">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl font-bold tracking-tight mb-4">
              Ready to bring order to your org?
            </h2>
            <p className="text-muted-foreground text-lg mb-8">
              Join teams that rely on OrgNest to stay organized, accountable, and secure.
            </p>
            <Link
              href="/signup"
              className={cn(buttonVariants({ size: "lg" }), "text-base px-10")}
            >
              Create your workspace <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/60 py-6 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-primary flex items-center justify-center">
              <Zap className="h-3 w-3 text-primary-foreground" />
            </div>
            <span className="font-medium text-foreground">OrgNest</span>
          </div>
          <p>© {new Date().getFullYear()} OrgNest. Built with Next.js &amp; Prisma.</p>
          <div className="flex gap-4">
            <Link href="/api-docs" className="hover:text-foreground transition-colors">
              API Docs
            </Link>
            <Link href="/login" className="hover:text-foreground transition-colors">
              Sign in
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
