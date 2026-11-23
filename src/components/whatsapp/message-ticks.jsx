"use client";

import { Check, CheckCheck, Clock, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const LABELS = {
  queued: "Queued",
  pending: "Sending",
  sent: "Sent",
  delivered: "Delivered",
  read: "Read",
  failed: "Failed",
};

/**
 * The product-wide tick language: queued/sending → sent → delivered → read, or failed.
 * `tone="onPrimary"` for ticks drawn on an outbound (primary) bubble.
 */
export function MessageTicks({ status, tone = "default", className, title }) {
  const s = String(status || "sent").toLowerCase();
  const base = tone === "onPrimary" ? "text-primary-foreground/70" : "text-muted-foreground";
  const label = title || LABELS[s] || s;
  const props = { className: cn("h-3.5 w-3.5 shrink-0", className), "aria-label": label, role: "img" };
  if (s === "failed") return <AlertCircle {...props} className={cn(props.className, "text-destructive")} />;
  if (s === "read") return <CheckCheck {...props} className={cn(props.className, tone === "onPrimary" ? "text-info" : "text-info")} />;
  if (s === "delivered") return <CheckCheck {...props} className={cn(props.className, base)} />;
  if (s === "queued" || s === "pending") return <Clock {...props} className={cn(props.className, base)} />;
  return <Check {...props} className={cn(props.className, base)} />;
}

export function tickLabel(status) {
  return LABELS[String(status || "").toLowerCase()] || status;
}
