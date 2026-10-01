"use client";

import React from "react";
import { Lock, Unlock, AlertTriangle, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export function AttributionLockBadge({
  partnerName,
  lockedUntil,
  status,
  className,
}) {
  // If no partner attribution data, don't render
  if (!partnerName && !lockedUntil) return null;

  const isColdOrReleased = status === "Not Interested" || status === "Junk";

  if (isColdOrReleased) {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800 transition-colors shadow-xs",
          className
        )}
      >
        <Unlock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
        <span>Attribution released — eligible for local revival</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border bg-muted/60 text-muted-foreground border-border transition-colors",
        className
      )}
    >
      <Lock className="h-3 w-3 text-primary shrink-0" />
      <span>
        Locked to <strong className="text-foreground font-semibold">{partnerName}</strong>
        {lockedUntil ? ` until ${lockedUntil}` : ""}
      </span>
    </div>
  );
}
