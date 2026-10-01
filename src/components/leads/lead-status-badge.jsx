import React from "react";
import { cn } from "@/lib/utils";

export const statusColorMap = {
  Qualified: "hsl(var(--success))",
  Converted: "hsl(var(--success))",
  Connected: "hsl(var(--warning))",
  "Not Connected": "hsl(var(--neutral-status))",
  "Not Interested": "hsl(var(--destructive))",
  Junk: "hsl(var(--destructive))",
  New: "hsl(var(--primary))",
};

export function getStatusColorClass(status) {
  switch (status) {
    case "Qualified":
    case "Converted":
      return "border-l-[hsl(var(--success))]";
    case "Connected":
      return "border-l-[hsl(var(--warning))]";
    case "Not Connected":
      return "border-l-[hsl(var(--neutral-status))]";
    case "Not Interested":
    case "Junk":
      return "border-l-[hsl(var(--destructive))]";
    case "New":
    default:
      return "border-l-[hsl(var(--primary))]";
  }
}

export function getStatusDotColorClass(status) {
  switch (status) {
    case "Qualified":
    case "Converted":
      return "bg-success";
    case "Connected":
      return "bg-warning";
    case "Not Connected":
      return "bg-neutral-status";
    case "Not Interested":
    case "Junk":
      return "bg-destructive";
    case "New":
    default:
      return "bg-primary";
  }
}

export function LeadStatusBadge({ status, className }) {
  const dotColorClass = getStatusDotColorClass(status);

  return (
    <div className={cn("inline-flex items-center gap-1.5 text-sm font-medium text-foreground", className)}>
      <span className={cn("h-2 w-2 rounded-full shrink-0", dotColorClass)} />
      <span>{status}</span>
    </div>
  );
}
