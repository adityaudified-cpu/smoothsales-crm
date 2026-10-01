import React from "react";
import { Badge } from "@/components/ui/badge";

export function CommissionTypeBadge({ type }) {
  const config = {
    SELF_GENERATED: {
      label: "Self-Generated",
      dot: "bg-blue-600 dark:bg-blue-400",
      badge: "border-blue-200 dark:border-blue-900 bg-blue-500/10 text-blue-700 dark:text-blue-300",
    },
    JOINT_HANDOVER: {
      label: "Joint Handover",
      dot: "bg-amber-600 dark:bg-amber-400",
      badge: "border-amber-200 dark:border-amber-900 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    },
    DEAD_LEAD_REVIVED: {
      label: "Dead-Lead Revival",
      dot: "bg-emerald-600 dark:bg-emerald-400",
      badge: "border-emerald-200 dark:border-emerald-900 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    },
    AFFILIATE: {
      label: "Affiliate",
      dot: "bg-slate-500",
      badge: "border-slate-200 dark:border-slate-800 bg-slate-500/10 text-slate-700 dark:text-slate-300",
    },
  };

  const current = config[type] || config.SELF_GENERATED;

  return (
    <Badge
      variant="outline"
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-semibold ${current.badge}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${current.dot}`} />
      <span>{current.label}</span>
    </Badge>
  );
}
