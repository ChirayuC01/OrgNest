"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { ClipboardList } from "lucide-react";

type FormErrors = Partial<Record<"name" | "email" | "password" | "organizationName" | "root", string>>;

export default function SignupPage() {
  const router  = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [form, setForm]       = useState({ name: "", email: "", password: "", organizationName: "" });
  const [errors, setErrors]   = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);

  function set(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [key]: e.target.value }));
  }

  function validate(): boolean {
    const e: FormErrors = {};
    if (!form.organizationName || form.organizationName.length < 2)
      e.organizationName = "Organization name must be at least 2 characters";
    if (!form.name || form.name.length < 2)
      e.name = "Name must be at least 2 characters";
    if (!form.email || !/\S+@\S+\.\S+/.test(form.email))
      e.email = "Valid email address is required";
    if (!form.password || form.password.length < 8)
      e.password = "Password must be at least 8 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSignup(ev: React.FormEvent) {
    ev.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        const meRes = await fetch("/api/auth/me", { credentials: "include" });
        if (meRes.ok) {
          const me = await meRes.json();
          setAuth({ ...me.data.user, permissions: me.data.permissions });
        }
        router.push("/dashboard");
      } else {
        setErrors({ root: data.error ?? "Signup failed" });
      }
    } catch {
      setErrors({ root: "Network error. Please try again." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left brand panel */}
      <div className="hidden lg:flex flex-col justify-between bg-gradient-to-br from-slate-900 to-slate-800 p-10 text-white">
        <Link href="/" className="flex items-center gap-2 font-semibold text-lg">
          <ClipboardList className="h-5 w-5 text-indigo-400" />
          OrgNest
        </Link>
        <div className="space-y-4">
          <h2 className="text-2xl font-bold leading-snug">
            Set up your organization in seconds.
          </h2>
          <ul className="space-y-2 text-sm text-slate-300">
            {[
              "You become the Admin of your organization",
              "Invite your team with fine-grained permissions",
              "Full audit trail from day one",
            ].map((t) => (
              <li key={t} className="flex items-start gap-2">
                <span className="mt-0.5 h-4 w-4 rounded-full bg-indigo-500 flex items-center justify-center text-[10px] font-bold shrink-0">✓</span>
                {t}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-xs text-slate-500">Free forever for small teams</p>
      </div>

      {/* Right form panel */}
      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center lg:text-left">
            <h1 className="text-2xl font-semibold tracking-tight">Create your organization</h1>
            <p className="text-sm text-muted-foreground mt-1">
              You&apos;ll be the admin. Invite your team next.
            </p>
          </div>

          <Card className="border-0 shadow-none lg:border lg:shadow-sm">
            <CardContent className="p-0 lg:p-6">
              <form onSubmit={handleSignup} className="space-y-4" noValidate>
                {errors.root && (
                  <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {errors.root}
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="orgName">Organization name</Label>
                  <Input
                    id="orgName"
                    placeholder="Acme Inc."
                    value={form.organizationName}
                    onChange={set("organizationName")}
                    className={errors.organizationName ? "border-destructive" : ""}
                  />
                  {errors.organizationName && (
                    <p className="text-xs text-destructive">{errors.organizationName}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="name">Your name</Label>
                  <Input
                    id="name"
                    placeholder="Jane Smith"
                    autoComplete="name"
                    value={form.name}
                    onChange={set("name")}
                    className={errors.name ? "border-destructive" : ""}
                  />
                  {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="email">Work email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="jane@acme.com"
                    autoComplete="email"
                    value={form.email}
                    onChange={set("email")}
                    className={errors.email ? "border-destructive" : ""}
                  />
                  {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Min. 8 characters"
                    autoComplete="new-password"
                    value={form.password}
                    onChange={set("password")}
                    className={errors.password ? "border-destructive" : ""}
                  />
                  {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Creating organization…" : "Create organization"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-foreground underline-offset-4 hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
