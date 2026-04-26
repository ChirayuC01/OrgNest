"use client";

import { useEffect } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AlertTriangle } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-background">
      <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center mb-5">
        <AlertTriangle className="h-7 w-7 text-destructive" />
      </div>
      <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
      <p className="text-muted-foreground max-w-sm mb-6">
        An unexpected error occurred. Our team has been notified. You can try again or return to the
        dashboard.
      </p>
      {error.digest && (
        <p className="text-xs text-muted-foreground font-mono mb-4">Error ID: {error.digest}</p>
      )}
      <div className="flex gap-3">
        <Button onClick={reset}>Try again</Button>
        <a href="/dashboard" className={cn(buttonVariants({ variant: "outline" }))}>
          Go to dashboard
        </a>
      </div>
    </div>
  );
}
