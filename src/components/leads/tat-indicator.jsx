import React from "react";
import { Clock, AlertTriangle, CheckCircle2 } from "lucide-react";
import { differenceInMinutes, differenceInHours } from "date-fns";
import { cn } from "@/lib/utils";

/**
 * TatIndicator renders a compact SLA compliance pill for lead table cells:
 * - on_track: success-toned "On Track"
 * - due_soon: warning-toned with Clock icon and "Xm left"
 * - breached: destructive-toned with AlertTriangle icon and "Breached Xm ago"
 */
export function TatIndicator({ status = "on_track", deadline = null, className = "" }) {
  const now = new Date();
  const deadlineDate = deadline ? new Date(deadline) : null;

  if (status === "due_soon") {
    let timeLeft = "Due soon";
    if (deadlineDate && !isNaN(deadlineDate.getTime())) {
      const diffMin = differenceInMinutes(deadlineDate, now);
      if (diffMin <= 0) {
        timeLeft = "Due now";
      } else if (diffMin < 60) {
        timeLeft = `${diffMin}m left`;
      } else {
        const diffHrs = differenceInHours(deadlineDate, now);
        timeLeft = `${diffHrs}h left`;
      }
    }

    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-warning/10 text-warning border border-warning/30 whitespace-nowrap",
          className
        )}
      >
        <Clock className="h-3 w-3 shrink-0" />
        <span>{timeLeft}</span>
      </span>
    );
  }

  if (status === "breached") {
    let overdueText = "overdue";
    if (deadlineDate && !isNaN(deadlineDate.getTime())) {
      const diffMin = Math.max(1, differenceInMinutes(now, deadlineDate));
      if (diffMin < 60) {
        overdueText = `${diffMin}m ago`;
      } else {
        const diffHrs = Math.max(1, differenceInHours(now, deadlineDate));
        overdueText = `${diffHrs}h ago`;
      }
    }

    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-destructive/10 text-destructive border border-destructive/20 whitespace-nowrap",
          className
        )}
      >
        <AlertTriangle className="h-3 w-3 shrink-0" />
        <span>Breached {overdueText}</span>
      </span>
    );
  }

  // on_track (default)
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-success/10 text-success border border-success/20 whitespace-nowrap",
        className
      )}
    >
      <CheckCircle2 className="h-3 w-3 shrink-0" />
      <span>On Track</span>
    </span>
  );
}
