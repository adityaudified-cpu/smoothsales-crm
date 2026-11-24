"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Check, Copy, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { deleteIntegration, getIntegration, saveIntegration, testIntegration } from "@/lib/api/integrations";
import { getIntegrationLogo } from "./brand-logos";

export const STAGES = [
  ["NEW", "New Lead"],
  ["CONTACTED", "Contacted"],
  ["QUALIFIED", "Qualified"],
  ["SITE_VISIT_SCHEDULED", "Meeting Scheduled"],
  ["SITE_VISIT_DONE", "Site Visit Done"],
  ["NEGOTIATION", "Proposal Sent"],
  ["BOOKED", "Deal Won"],
  ["LOST", "Lost"],
  ["JUNK", "Disqualified"],
];
export const stageLabel = (key) => STAGES.find(([k]) => k === key)?.[1] || key;

export function ago(iso) {
  if (!iso) return null;
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 86400 * 30) return `${Math.floor(s / 86400)}d ago`;
  return new Date(iso).toLocaleDateString();
}

export function when(iso) {
  return iso ? new Date(iso).toLocaleString([], { dateStyle: "medium", timeStyle: "short" }) : "Never";
}

// Status colour lives in the dot; the text stays in ink so it is readable on every surface.
const TONES = { success: "bg-success", warning: "bg-warning", destructive: "bg-destructive", info: "bg-info", muted: "bg-muted-foreground/40" };
export function Status({ tone = "muted", children, className }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium text-foreground whitespace-nowrap", className)}>
      <span className={cn("h-2 w-2 rounded-full shrink-0", TONES[tone])} aria-hidden />
      {children}
    </span>
  );
}

export const INTEGRATION_STATUS = {
  connected: ["success", "Connected"],
  disabled: ["muted", "Paused"],
  error: ["destructive", "Needs attention"],
  not_configured: ["muted", "Not set up"],
  coming_soon: ["muted", "Coming soon"],
};

export function IntegrationStatus({ status }) {
  const [tone, label] = INTEGRATION_STATUS[status] || INTEGRATION_STATUS.not_configured;
  return <Status tone={tone}>{label}</Status>;
}

export function CopyButton({ value, label = "Copy" }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Your browser blocked copying. Select the text and copy it.");
    }
  };
  return (
    <button type="button" onClick={copy} aria-label={label}
      className="shrink-0 p-1.5 rounded text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
      {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

export function CopyField({ label, value, placeholder = "Not available yet", canCopy = true }) {
  return (
    <div className="space-y-1 min-w-0">
      <p className="text-2xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <div className="flex items-center gap-1 rounded-md border border-border bg-input-background pl-2.5 pr-1 h-8">
        <code className="font-mono text-xs truncate flex-1" title={value || undefined}>{value || placeholder}</code>
        {value && canCopy && <CopyButton value={value} label={`Copy ${label}`} />}
      </div>
    </div>
  );
}

export function CodeBlock({ code, label }) {
  return (
    <div className="relative rounded-md border border-border bg-input-background">
      <div className="absolute right-1 top-1"><CopyButton value={code} label={`Copy ${label}`} /></div>
      <pre tabIndex={0} aria-label={label} className="overflow-x-auto p-3 pr-10 font-mono text-xs leading-relaxed text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md">{code}</pre>
    </div>
  );
}

export function Panel({ title, description, action, children, className, id }) {
  const hid = id ? `${id}-h` : undefined;
  return (
    <section className={cn("rounded-lg border border-border bg-card p-4 space-y-4 min-w-0", className)} aria-labelledby={hid}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 id={hid} className="text-sm font-semibold text-foreground">{title}</h2>
          {description && <p className="text-xs text-muted-foreground mt-0.5 max-w-prose">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function Rows({ count = 4 }) {
  return (
    <div className="space-y-2" aria-busy="true" aria-label="Loading">
      {Array.from({ length: count }, (_, i) => <div key={i} className="h-10 rounded bg-muted animate-pulse" />)}
    </div>
  );
}

export function LoadError({ message, onRetry }) {
  return (
    <div role="alert" className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-destructive/40 p-3">
      <p className="text-sm text-foreground">{message}</p>
      <Button variant="outline" size="sm" onClick={onRetry}><RefreshCw /> Retry</Button>
    </div>
  );
}

export function Empty({ children }) {
  return <p className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">{children}</p>;
}

export function Confirm({ trigger, title, description, action = "Continue", destructive = true, onConfirm }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleConfirm = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (onConfirm) await onConfirm();
      setOpen(false);
    } catch (err) {
      toast.error(err?.message || "Operation failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={(o) => { if (!busy) setOpen(o); }}>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
          <Button
            type="button"
            disabled={busy}
            onClick={handleConfirm}
            className={destructive ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : undefined}
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
            {action}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function PayloadDialog({ event, onClose }) {
  let text = event?.payload ?? event?.rawPayload ?? "";
  try { text = JSON.stringify(typeof text === "string" ? JSON.parse(text) : text, null, 2); } catch { /* form-encoded: show as sent */ }
  return (
    <Dialog open={!!event} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>What was received</DialogTitle>
          <DialogDescription>{when(event?.receivedAt || event?.createdAt)}</DialogDescription>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-auto"><CodeBlock code={text || "(empty)"} label="payload" /></div>
      </DialogContent>
    </Dialog>
  );
}

/** Loads one integration and exposes honest save / test / disconnect. Errors are shown, never hidden. */
export function useIntegration(key) {
  const [state, setState] = useState("loading"); // loading | ready | error
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(null); // save | test | remove

  const load = useCallback(async () => {
    try {
      setData(await getIntegration(key));
      setState("ready");
    } catch {
      setState((s) => (s === "ready" ? s : "error"));
    }
  }, [key]);
  useEffect(() => { load(); }, [load]);

  const save = async (payload, message = "Saved") => {
    setBusy("save");
    try {
      setData(await saveIntegration(key, payload));
      toast.success(message);
      return true;
    } catch (e) {
      toast.error(e?.message || "Could not save");
      return false;
    } finally {
      setBusy(null);
    }
  };

  const test = async () => {
    setBusy("test");
    try {
      const r = await testIntegration(key);
      if (r?.success) toast.success(r.message);
      else toast.error(r?.message || "The check failed");
      await load();
    } catch (e) {
      toast.error(e?.message || "Could not run the check");
    } finally {
      setBusy(null);
    }
  };

  const remove = async () => {
    setBusy("remove");
    try {
      await deleteIntegration(key);
      toast.success("Disconnected");
      await load();
    } catch (e) {
      toast.error(e?.message || "Could not disconnect");
    } finally {
      setBusy(null);
    }
  };

  return { state, data, busy, load, save, test, remove };
}

export function DetailShell({ integrationKey, title, description, status, children, actions, testMessage, testedAt, testOk }) {
  return (
    <div className="space-y-4 pb-16 max-w-6xl">
      <div>
        <Link href="/integrations" className="inline-flex items-center gap-1 rounded text-xs text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden /> Integrations
        </Link>
      </div>
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="h-10 w-10 shrink-0 rounded-lg border border-border bg-card grid place-items-center" aria-hidden>{getIntegrationLogo(integrationKey, "h-6 w-6")}</div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <h1 className="text-xl font-semibold tracking-tight text-foreground">{title}</h1>
              {status && <IntegrationStatus status={status} />}
            </div>
            <p className="text-sm text-muted-foreground max-w-prose">{description}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      </header>
      {testMessage && (
        <p className="rounded-md border border-border bg-card px-3 py-2 text-xs text-foreground" role="status">
          <Status tone={testOk ? "success" : "destructive"} className="mr-2">{testOk ? "Last check passed" : "Last check failed"}</Status>
          <span className="text-muted-foreground">{ago(testedAt)} · </span>{testMessage}
        </p>
      )}
      {children}
    </div>
  );
}

export function Saving({ on }) {
  return on ? <Loader2 className="animate-spin" /> : null;
}
