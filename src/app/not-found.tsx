import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Zap } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-background">
      <div className="mb-6 flex items-center gap-2">
        <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
          <Zap className="h-3.5 w-3.5 text-primary-foreground" />
        </div>
        <span className="font-bold text-lg tracking-tight">OrgNest</span>
      </div>

      <p className="text-7xl font-bold text-primary/20 mb-4">404</p>
      <h1 className="text-2xl font-bold mb-2">Page not found</h1>
      <p className="text-muted-foreground max-w-xs mb-8">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <div className="flex gap-3">
        <Link href="/dashboard" className={buttonVariants()}>
          Go to dashboard
        </Link>
        <Link href="/" className={cn(buttonVariants({ variant: "outline" }))}>
          Home
        </Link>
      </div>
    </div>
  );
}
