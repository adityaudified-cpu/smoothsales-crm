"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Search, MoreHorizontal, Play, Pause, Ban, CopyPlus, Trash2, Eye, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useWaAccounts } from "../wa-accounts-context";
import { whatsappCampaignsApi, subscribeCampaignProgress } from "@/lib/api/whatsapp";
import { CampaignBuilderDialog } from "@/components/whatsapp/campaign-builder-dialog";
import { STATUS_CFG, encodeId } from "./data";
import { cn } from "@/lib/utils";

const FILTERS = ["all", "running", "scheduled", "draft", "paused", "completed", "cancelled"];

function mapCampaign(c) {
  return {
    id: String(c.id),
    name: c.name,
    template: c.templateName || "—",
    status: String(c.status || "DRAFT").toLowerCase(),
    total: c.totalRecipients || 0,
    sent: c.sentCount || 0,
    delivered: c.deliveredCount || 0,
    read: c.readCount || 0,
    replied: c.repliedCount || 0,
    failed: c.failedCount || 0,
    accountId: c.whatsappAccountId || null,
    scheduledAt: c.scheduledAt,
    createdAt: c.createdAt,
  };
}

const pct = (n, d) => (d > 0 ? Math.round((n / d) * 100) : 0);
const fmtDate = (iso) => (iso ? new Date(iso).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—");

/** Funnel strip: sent → delivered → read → replied, plus failures. */
function Funnel({ c }) {
  const processed = c.sent + c.failed;
  return (
    <div className="min-w-[180px] space-y-1">
      <div className="h-1.5 rounded-full bg-muted overflow-hidden flex" role="progressbar" aria-valuenow={pct(processed, c.total)} aria-valuemin={0} aria-valuemax={100} aria-label="Progress">
        <span className="bg-primary h-full" style={{ width: `${pct(c.sent, c.total)}%` }} />
        <span className="bg-destructive h-full" style={{ width: `${pct(c.failed, c.total)}%` }} />
      </div>
      <p className="text-2xs text-muted-foreground tabular">
        <span className="text-foreground font-medium">{c.sent.toLocaleString()}</span>/{c.total.toLocaleString()} sent
        {c.sent > 0 && <> · {pct(c.delivered, c.sent)}% delivered · {pct(c.read, c.sent)}% read · {c.replied} replied</>}
        {c.failed > 0 && <span className="text-destructive"> · {c.failed} failed</span>}
      </p>
    </div>
  );
}

export default function WhatsAppCampaignsPage() {
  const router = useRouter();
  const { accounts, defaultAccount, accountById, isLoading: accountsLoading } = useWaAccounts();
  const [campaigns, setCampaigns] = useState([]);
  const [state, setState] = useState("loading");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [builderOpen, setBuilderOpen] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [confirm, setConfirm] = useState(null); // { type: delete|cancel, c }

  const load = useCallback(async () => {
    try {
      const page = await whatsappCampaignsApi.getAll({ size: 100 });
      setCampaigns(page.items.map(mapCampaign));
      setState("ready");
    } catch {
      setState("error");
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => subscribeCampaignProgress((p) => {
    setCampaigns((list) => list.map((c) => (c.id === String(p.campaignId) ? {
      ...c,
      status: p.status ? String(p.status).toLowerCase() : c.status,
      sent: p.sentCount ?? c.sent, failed: p.failedCount ?? c.failed,
      delivered: p.deliveredCount ?? c.delivered, read: p.readCount ?? c.read, total: p.totalRecipients ?? c.total,
    } : c)));
  }), []);

  const act = async (c, fn, ok) => {
    setBusyId(c.id);
    try {
      const res = await fn();
      if (res?.id) setCampaigns((list) => list.map((x) => (x.id === String(res.id) ? { ...x, ...mapCampaign(res), replied: x.replied } : x)));
      toast.success(ok);
    } catch (e) {
      toast.error(e?.message || "Action failed");
    } finally {
      setBusyId(null);
    }
  };

  const runConfirm = async () => {
    const { type, c } = confirm;
    if (type === "delete") {
      setBusyId(c.id);
      try {
        await whatsappCampaignsApi.delete(c.id);
        setCampaigns((list) => list.filter((x) => x.id !== c.id));
        toast.success("Campaign deleted");
      } catch (e) {
        toast.error(e?.message || "Delete failed");
      } finally {
        setBusyId(null);
      }
    } else {
      await act(c, () => whatsappCampaignsApi.cancel(c.id), "Campaign cancelled");
    }
    setConfirm(null);
  };

  const filtered = useMemo(() => campaigns.filter((c) => {
    const q = search.trim().toLowerCase();
    if (q && !c.name.toLowerCase().includes(q) && !c.template.toLowerCase().includes(q)) return false;
    return filter === "all" || c.status === filter;
  }), [campaigns, search, filter]);

  const totals = useMemo(() => {
    const sent = campaigns.reduce((s, c) => s + c.sent, 0);
    return {
      running: campaigns.filter((c) => c.status === "running").length,
      sent,
      read: pct(campaigns.reduce((s, c) => s + c.read, 0), sent),
      replied: pct(campaigns.reduce((s, c) => s + c.replied, 0), sent),
    };
  }, [campaigns]);

  const noNumber = !accountsLoading && accounts.length === 0;

  return (
    <div className="h-full w-full min-w-0 max-w-full overflow-x-hidden flex flex-col min-h-0">
      <header className="px-4 sm:px-6 pt-5 pb-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Campaigns</h1>
          <p className="text-sm text-muted-foreground">Broadcast an approved template to leads, segments or imported numbers.</p>
        </div>
        <Button size="sm" onClick={() => setBuilderOpen(true)} disabled={noNumber}><Plus /> New campaign</Button>
      </header>

      {noNumber && (
        <div className="mx-4 sm:mx-6 mb-3 flex items-center gap-2 rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-xs">
          <AlertTriangle className="h-4 w-4 text-warning shrink-0" aria-hidden />
          <span><Link href="/whatsapp/connect" className="font-medium text-primary hover:underline">Connect a WhatsApp number</Link> to send campaigns.</span>
        </div>
      )}

      <dl className="mx-4 sm:mx-6 mb-3 grid grid-cols-2 sm:grid-cols-4 rounded-lg border border-border bg-card divide-x divide-y sm:divide-y-0 divide-border">
        {[
          ["Sending now", totals.running, ""],
          ["Messages sent", totals.sent.toLocaleString(), ""],
          ["Read rate", `${totals.read}%`, ""],
          ["Reply rate", `${totals.replied}%`, ""],
        ].map(([l, v]) => (
          <div key={l} className="px-4 py-3">
            <dt className="text-2xs font-medium uppercase tracking-wider text-muted-foreground">{l}</dt>
            <dd className="text-xl font-semibold tabular mt-0.5">{v}</dd>
          </div>
        ))}
      </dl>

      <div className="px-4 sm:px-6 pb-3 flex flex-wrap items-center gap-2">
        <div className="relative w-full sm:w-60">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" aria-hidden />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search campaigns" className="h-8 pl-8 text-xs" aria-label="Search campaigns" />
        </div>
        <div className="flex gap-1 overflow-x-auto no-scrollbar" role="tablist" aria-label="Status">
          {FILTERS.map((f) => (
            <button key={f} type="button" role="tab" aria-selected={filter === f} onClick={() => setFilter(f)}
              className={cn("h-8 px-2.5 rounded-md text-xs whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                filter === f ? "bg-accent text-accent-foreground font-medium" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground")}>
              {f === "all" ? "All" : STATUS_CFG[f]?.label || f}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-auto px-4 sm:px-6 pb-6">
        <div className="rounded-lg border border-border bg-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 border-b border-border">
              <tr className="text-left text-2xs uppercase tracking-wider text-muted-foreground">
                <th scope="col" className="px-4 py-2.5 font-medium">Campaign</th>
                <th scope="col" className="px-4 py-2.5 font-medium">Status</th>
                <th scope="col" className="px-4 py-2.5 font-medium hidden md:table-cell">Progress</th>
                <th scope="col" className="px-4 py-2.5 font-medium hidden lg:table-cell">When</th>
                <th scope="col" className="w-12"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {state === "loading" && [0, 1, 2, 3].map((i) => <tr key={i}><td colSpan={5} className="px-4 py-3"><div className="h-6 rounded bg-muted animate-pulse" /></td></tr>)}
              {state === "error" && (
                <tr><td colSpan={5} className="px-4 py-10 text-center space-y-2"><p className="text-sm text-destructive">Could not load campaigns.</p><Button variant="outline" size="sm" onClick={load}>Retry</Button></td></tr>
              )}
              {state === "ready" && filtered.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-12 text-center">
                  <p className="text-sm font-medium">{campaigns.length === 0 ? "No campaigns yet" : "No campaign matches"}</p>
                  <p className="text-xs text-muted-foreground mt-1">{campaigns.length === 0 ? "Pick an approved template and an audience to send your first broadcast." : "Try another filter."}</p>
                </td></tr>
              )}
              {state === "ready" && filtered.map((c) => {
                const s = STATUS_CFG[c.status] || STATUS_CFG.draft;
                const acc = accounts.length > 1 ? accountById(c.accountId) : null;
                return (
                  <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 min-w-[200px]">
                      <Link href={`/whatsapp/campaigns/${encodeId(c.id)}`} className="font-medium hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm">{c.name}</Link>
                      <p className="text-2xs text-muted-foreground">{c.template}{acc ? ` · ${acc.label}` : ""}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn("inline-flex items-center gap-1.5 rounded-sm border px-1.5 py-0.5 text-2xs font-medium", s.cls)}>
                        <span className={cn("h-1.5 w-1.5 rounded-full", s.dot, c.status === "running" && "motion-safe:animate-pulse")} aria-hidden />{s.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell"><Funnel c={c} /></td>
                    <td className="px-4 py-3 hidden lg:table-cell text-xs text-muted-foreground tabular">
                      {c.status === "scheduled" ? `Starts ${fmtDate(c.scheduledAt)}` : `Created ${fmtDate(c.createdAt)}`}
                    </td>
                    <td className="px-2 py-2.5">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={`Actions for ${c.name}`} disabled={busyId === c.id}>
                            {busyId === c.id ? <Loader2 className="animate-spin" /> : <MoreHorizontal />}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={() => router.push(`/whatsapp/campaigns/${encodeId(c.id)}`)}><Eye className="h-4 w-4" /> View report</DropdownMenuItem>
                          {["draft", "scheduled", "paused"].includes(c.status) && (
                            <DropdownMenuItem onClick={() => act(c, () => whatsappCampaignsApi.start(c.id), c.status === "paused" ? "Resumed" : "Sending started")}>
                              <Play className="h-4 w-4" /> {c.status === "paused" ? "Resume" : "Send now"}
                            </DropdownMenuItem>
                          )}
                          {["running", "scheduled"].includes(c.status) && (
                            <DropdownMenuItem onClick={() => act(c, () => whatsappCampaignsApi.pause(c.id), "Paused — unsent people wait")}><Pause className="h-4 w-4" /> Pause</DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => act(c, async () => {
                            const copy = await whatsappCampaignsApi.duplicate(c.id);
                            setCampaigns((list) => [mapCampaign(copy), ...list]);
                            return null;
                          }, "Copied as a draft")}><CopyPlus className="h-4 w-4" /> Duplicate</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {!["completed", "cancelled"].includes(c.status) && (
                            <DropdownMenuItem onClick={() => setConfirm({ type: "cancel", c })}><Ban className="h-4 w-4" /> Cancel</DropdownMenuItem>
                          )}
                          {c.status !== "running" && (
                            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setConfirm({ type: "delete", c })}><Trash2 className="h-4 w-4" /> Delete</DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <CampaignBuilderDialog open={builderOpen} onOpenChange={setBuilderOpen} accounts={accounts} defaultAccountId={defaultAccount?.id}
        onCreated={(c) => setCampaigns((list) => [mapCampaign(c), ...list])} />

      <Dialog open={Boolean(confirm)} onOpenChange={(v) => !v && setConfirm(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader className="text-left">
            <DialogTitle className="text-base font-semibold">{confirm?.type === "delete" ? `Delete “${confirm?.c.name}”?` : `Cancel “${confirm?.c.name}”?`}</DialogTitle>
            <DialogDescription>
              {confirm?.type === "delete" ? "The campaign and its report are removed. Messages already sent stay in the inbox." : "People who have not been messaged yet will not receive it. This cannot be undone."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setConfirm(null)}>Keep</Button>
            <Button variant="destructive" size="sm" onClick={runConfirm} disabled={busyId === confirm?.c.id}>
              {busyId === confirm?.c.id && <Loader2 className="animate-spin" />} {confirm?.type === "delete" ? "Delete" : "Cancel campaign"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
