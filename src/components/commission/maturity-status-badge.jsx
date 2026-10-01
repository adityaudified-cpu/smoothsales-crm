import React from "react";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle2, XCircle } from "lucide-react";

export function MaturityStatusBadge({ status }) {
  const config = {
    PENDING_VERIFICATION: {
      label: "Pending Verification",
      icon: Clock,
      color: "text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900 bg-amber-500/10",
    },
    MATURED_APPROVED: {
      label: "Available for Payout",
      icon: CheckCircle2,
      color: "text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900 bg-emerald-500/10",
    },
    REFUND_CANCELLED: {
      label: "Voided (Refunded)",
      icon: XCircle,
      color: "text-red-700 dark:text-red-300 border-red-200 dark:border-red-900 bg-red-500/10",
    },
  };

  const current = config[status] || config.PENDING_VERIFICATION;
  const Icon = current.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-semibold border ${current.color}`}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <span>{current.label}</span>
    </span>
  );
}
