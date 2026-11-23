import { CheckCircle2, Clock, AlertCircle, Pause, RefreshCw } from "lucide-react";

/** Campaign status → label and token-based styles. */
export const STATUS_CFG = {
  completed: { label: "Completed", cls: "bg-success/10 text-success border-success/30", dot: "bg-success", Icon: CheckCircle2 },
  running: { label: "Sending", cls: "bg-info/10 text-info border-info/30", dot: "bg-info", Icon: RefreshCw },
  scheduled: { label: "Scheduled", cls: "bg-warning/10 text-foreground border-warning/40", dot: "bg-warning", Icon: Clock },
  draft: { label: "Draft", cls: "bg-muted text-muted-foreground border-border", dot: "bg-muted-foreground/50", Icon: AlertCircle },
  paused: { label: "Paused", cls: "bg-warning/10 text-foreground border-warning/40", dot: "bg-warning", Icon: Pause },
  cancelled: { label: "Cancelled", cls: "bg-destructive/10 text-destructive border-destructive/30", dot: "bg-destructive", Icon: AlertCircle },
};

/** Per-recipient message status (same tick language as the inbox). */
export const MSG_STATUS_CFG = {
  replied: { label: "Replied", cls: "bg-success/10 text-success border-success/30", dot: "bg-success" },
  read: { label: "Read", cls: "bg-info/10 text-info border-info/30", dot: "bg-info" },
  delivered: { label: "Delivered", cls: "bg-accent text-accent-foreground border-border", dot: "bg-primary" },
  sent: { label: "Sent", cls: "bg-muted text-muted-foreground border-border", dot: "bg-muted-foreground/50" },
  pending: { label: "Sending", cls: "bg-muted text-muted-foreground border-border", dot: "bg-muted-foreground/50" },
  queued: { label: "Queued", cls: "bg-muted text-muted-foreground border-border", dot: "bg-muted-foreground/30" },
  failed: { label: "Failed", cls: "bg-destructive/10 text-destructive border-destructive/30", dot: "bg-destructive" },
};

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
