"use client";

import { useIsFetching } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

/**
 * Shows a spinning loader in the header while any React Query request is
 * running in the background (e.g. background refetch after returning to a page).
 * Invisible when everything is up to date.
 */
export function RefetchIndicator() {
  const isFetching = useIsFetching();

  return (
    <Tooltip>
      <TooltipTrigger
        aria-live="polite"
        aria-label={isFetching ? "Syncing latest data" : undefined}
        className={cn(
          "flex items-center justify-center h-8 w-8 rounded-lg transition-opacity duration-300",
          isFetching ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
      >
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </TooltipTrigger>
      <TooltipContent side="bottom">Syncing latest data…</TooltipContent>
    </Tooltip>
  );
}
