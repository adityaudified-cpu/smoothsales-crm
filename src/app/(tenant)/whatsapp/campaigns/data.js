import { CheckCircle2, Clock, AlertCircle, Pause, RefreshCw } from "lucide-react";

export const STATUS_CFG = {
  completed: { label: "Completed", cls: "bg-emerald-500/10 text-emerald-700 border-emerald-200 dark:border-emerald-800 dark:text-emerald-400", dot: "bg-emerald-500", Icon: CheckCircle2 },
  running:   { label: "Running",   cls: "bg-blue-500/10 text-blue-700 border-blue-200 dark:border-blue-800 dark:text-blue-400",               dot: "bg-blue-500",    Icon: RefreshCw },
  scheduled: { label: "Scheduled", cls: "bg-amber-500/10 text-amber-700 border-amber-200 dark:border-amber-800 dark:text-amber-400",           dot: "bg-amber-500",   Icon: Clock },
  draft:     { label: "Draft",     cls: "bg-muted text-muted-foreground border-border",                                                         dot: "bg-muted-foreground/40", Icon: AlertCircle },
  paused:    { label: "Paused",    cls: "bg-orange-500/10 text-orange-700 border-orange-200 dark:border-orange-800 dark:text-orange-400",       dot: "bg-orange-500", Icon: Pause },
  cancelled: { label: "Cancelled", cls: "bg-rose-500/10 text-rose-700 border-rose-200 dark:border-rose-800 dark:text-rose-400",               dot: "bg-rose-500",   Icon: AlertCircle },
};

export const MSG_STATUS_CFG = {
  replied:   { label: "Replied",   cls: "bg-emerald-500/10 text-emerald-700 border-emerald-200 dark:border-emerald-800 dark:text-emerald-400", dot: "bg-emerald-500" },
  read:      { label: "Read",      cls: "bg-violet-500/10 text-violet-700 border-violet-200 dark:border-violet-800 dark:text-violet-400",     dot: "bg-violet-500" },
  delivered: { label: "Delivered", cls: "bg-blue-500/10 text-blue-700 border-blue-200 dark:border-blue-800 dark:text-blue-400",               dot: "bg-blue-500" },
  sent:      { label: "Sent",      cls: "bg-muted text-muted-foreground border-border",                                                        dot: "bg-muted-foreground/40" },
  failed:    { label: "Failed",    cls: "bg-red-500/10 text-red-700 border-red-200 dark:border-red-800 dark:text-red-400",                    dot: "bg-red-500" },
};

export const CAMPAIGN_CONTACTS = {};

export function encodeId(id) {
  if (!id) return "";
  try {
    return btoa(String(id)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  } catch {
    return String(id);
  }
}

export function decodeId(encoded) {
  if (!encoded) return null;
  try {
    return atob(String(encoded).replace(/-/g, "+").replace(/_/g, "/"));
  } catch {
    return encoded;
  }
}
