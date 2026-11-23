"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Plus, RefreshCw, Search, MoreHorizontal, Pencil, CopyPlus, Send, Trash2, ExternalLink, Eye,
  RotateCw, Loader2, AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useWaAccounts, accountName } from "../wa-accounts-context";
import { whatsappTemplatesApi, subscribeTemplateStatus, countVariables, templateManagerUrl } from "@/lib/api/whatsapp";
import { TemplateBuilderDialog } from "@/components/whatsapp/template-builder-dialog";
import { TemplatePreview } from "@/components/whatsapp/template-preview";
import { cn } from "@/lib/utils";

const STATUS = {
  APPROVED: { label: "Approved", cls: "text-success", dot: "bg-success" },
  PENDING: { label: "In review", cls: "text-foreground", dot: "bg-warning" },
  REJECTED: { label: "Rejected", cls: "text-destructive", dot: "bg-destructive" },
  PAUSED: { label: "Paused", cls: "text-foreground", dot: "bg-warning" },
  DRAFT: { label: "Draft", cls: "text-muted-foreground", dot: "bg-muted-foreground/50" },
};

const STATUS_FILTERS = ["all", "APPROVED", "PENDING", "REJECTED", "DRAFT"];

export default function WhatsAppTemplatesPage() {
  const { accounts, defaultAccount, isLoading: accountsLoading } = useWaAccounts();
  const [templates, setTemplates] = useState([]);
  const [state, setState] = useState("loading");
  const [syncing, setSyncing] = useState(false);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [category, setCategory] = useState("all");
  const [numberId, setNumberId] = useState("all");
  const [builder, setBuilder] = useState({ open: false, template: null, copyFrom: null });
  const [viewing, setViewing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    try {
      setTemplates(await whatsappTemplatesApi.getAll());
      setState("ready");
    } catch {
      setState("error");
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => subscribeTemplateStatus((t) => {
    if (!t?.id) return;
    setTemplates((list) => list.map((x) => (x.id === t.id ? t : x)));
    const s = STATUS[String(t.status).toUpperCase()];
    toast.message(`${t.displayName}: ${s?.label || t.status}`, { description: t.rejectedReason || undefined });
  }), []);

  const sync = async () => {
    setSyncing(true);
    try {
      const list = await whatsappTemplatesApi.syncAll();
      setTemplates(list);
      toast.success(`Synced ${list.length} templates from Meta`);
    } catch (e) {
      toast.error(e?.message || "Sync failed");
    } finally {
      setSyncing(false);
    }
  };

  const rowAction = async (t, key, fn, ok) => {
    setBusyId(t.id);
    try {
      const res = await fn();
      if (res?.id) setTemplates((list) => list.map((x) => (x.id === res.id ? res : x)));
      if (key === "submit" && String(res?.status).toUpperCase() === "REJECTED") toast.error(`Meta refused it: ${res.rejectedReason || "see details"}`);
      else toast.success(ok);
    } catch (e) {
      toast.error(e?.message || "Action failed");
    } finally {
      setBusyId(null);
    }
  };

  const confirmDelete = async () => {
    const t = deleting;
    setBusyId(t.id);
    try {
      await whatsappTemplatesApi.delete(t.id);
      setTemplates((list) => list.filter((x) => x.id !== t.id));
      toast.success("Template deleted");
      setDeleting(null);
    } catch (e) {
      toast.error(e?.message || "Delete failed");
    } finally {
      setBusyId(null);
    }
  };

  const selectedWaba = numberId === "all" ? null : accounts.find((a) => a.id === numberId)?.wabaId;
  const filtered = useMemo(() => templates.filter((t) => {
    const q = search.trim().toLowerCase();
    if (q && !(t.displayName || "").toLowerCase().includes(q) && !(t.templateName || "").toLowerCase().includes(q) && !(t.bodyText || "").toLowerCase().includes(q)) return false;
    if (status !== "all" && String(t.status).toUpperCase() !== status) return false;
    if (category !== "all" && String(t.category).toUpperCase() !== category) return false;
    if (selectedWaba && t.wabaId && t.wabaId !== selectedWaba) return false;
    return true;
  }), [templates, search, status, category, selectedWaba]);

  const counts = useMemo(() => {
    const c = { all: templates.length };
    for (const t of templates) c[String(t.status).toUpperCase()] = (c[String(t.status).toUpperCase()] || 0) + 1;
    return c;
  }, [templates]);

  const managerUrl = (numberId !== "all" ? accounts.find((a) => a.id === numberId) : defaultAccount)?.templateManagerUrl || templateManagerUrl();
  const noNumber = !accountsLoading && accounts.length === 0;

  return (
    <div className="h-full w-full min-w-0 max-w-full overflow-x-hidden flex flex-col min-h-0">
      <header className="px-4 sm:px-6 pt-5 pb-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Templates</h1>
          <p className="text-sm text-muted-foreground">Pre-approved messages for starting chats and campaigns. Created here, reviewed by Meta.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <a href={managerUrl} target="_blank" rel="noopener noreferrer"><ExternalLink /> Meta WhatsApp Manager</a>
          </Button>
          <Button variant="outline" size="sm" onClick={sync} disabled={syncing || noNumber}>
            <RefreshCw className={cn(syncing && "animate-spin")} /> Sync from Meta
          </Button>
          <Button size="sm" onClick={() => setBuilder({ open: true, template: null, copyFrom: null })} disabled={noNumber}><Plus /> New template</Button>
        </div>
      </header>

      {noNumber && (
        <div className="mx-4 sm:mx-6 mb-3 flex items-center gap-2 rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-xs">
          <AlertTriangle className="h-4 w-4 text-warning shrink-0" aria-hidden />
          Templates live in a WhatsApp Business account. <Link href="/whatsapp/connect" className="font-medium text-primary hover:underline">Connect a number</Link> first.
        </div>
      )}

      <div className="px-4 sm:px-6 pb-3 flex flex-wrap items-center gap-2">
        <div className="relative w-full sm:w-60">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" aria-hidden />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search templates" className="h-8 pl-8 text-xs" aria-label="Search templates" />
        </div>
        <div className="flex gap-1 overflow-x-auto no-scrollbar" role="tablist" aria-label="Status">
          {STATUS_FILTERS.map((s) => (
            <button key={s} type="button" role="tab" aria-selected={status === s} onClick={() => setStatus(s)}
              className={cn("h-8 px-2.5 rounded-md text-xs whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                status === s ? "bg-accent text-accent-foreground font-medium" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground")}>
              {s === "all" ? "All" : STATUS[s].label} <span className="tabular opacity-70">{counts[s] || 0}</span>
            </button>
          ))}
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="h-8 w-[150px] text-xs" aria-label="Category"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">All categories</SelectItem>
            {["MARKETING", "UTILITY", "AUTHENTICATION"].map((c) => <SelectItem key={c} value={c} className="text-xs">{c.charAt(0) + c.slice(1).toLowerCase()}</SelectItem>)}
          </SelectContent>
        </Select>
        {accounts.length > 1 && (
          <Select value={numberId} onValueChange={setNumberId}>
            <SelectTrigger className="h-8 w-[200px] text-xs" aria-label="Number"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">All numbers</SelectItem>
              {accounts.map((a) => <SelectItem key={a.id} value={a.id} className="text-xs">{accountName(a)}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="flex-1 min-h-0 overflow-auto px-4 sm:px-6 pb-6">
        <div className="rounded-lg border border-border bg-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 border-b border-border">
              <tr className="text-left text-2xs uppercase tracking-wider text-muted-foreground">
                <th scope="col" className="px-4 py-2.5 font-medium">Template</th>
                <th scope="col" className="px-4 py-2.5 font-medium hidden md:table-cell">Category</th>
                <th scope="col" className="px-4 py-2.5 font-medium">Status</th>
                <th scope="col" className="px-4 py-2.5 font-medium hidden lg:table-cell">Message</th>
                <th scope="col" className="px-4 py-2.5 font-medium w-12"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {state === "loading" && [0, 1, 2, 3, 4].map((i) => (
                <tr key={i}><td colSpan={5} className="px-4 py-3"><div className="h-5 rounded bg-muted animate-pulse" /></td></tr>
              ))}
              {state === "error" && (
                <tr><td colSpan={5} className="px-4 py-10 text-center space-y-2">
                  <p className="text-sm text-destructive">Could not load templates.</p>
                  <Button variant="outline" size="sm" onClick={load}>Retry</Button>
                </td></tr>
              )}
              {state === "ready" && filtered.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-12 text-center">
                  <p className="text-sm font-medium">{templates.length === 0 ? "No templates yet" : "No template matches"}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {templates.length === 0 ? "Create one here, or sync the ones you already made in Meta WhatsApp Manager." : "Try another filter."}
                  </p>
                </td></tr>
              )}
              {state === "ready" && filtered.map((t) => {
                const s = STATUS[String(t.status).toUpperCase()] || STATUS.DRAFT;
                const vars = String(t.category).toUpperCase() === "AUTHENTICATION" ? 1 : countVariables(t.bodyText);
                const isDraft = String(t.status).toUpperCase() === "DRAFT";
                const failedSubmit = String(t.status).toUpperCase() === "REJECTED" && !t.metaTemplateId;
                return (
                  <tr key={t.id} className="hover:bg-muted/30 transition-colors align-top">
                    <td className="px-4 py-3 min-w-[180px]">
                      <button type="button" onClick={() => setViewing(t)} className="text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm">
                        <span className="block font-medium hover:underline">{t.displayName || t.templateName}</span>
                        <span className="block font-mono text-2xs text-muted-foreground">{t.templateName} · {t.language}</span>
                      </button>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-xs">{String(t.category).charAt(0) + String(t.category).slice(1).toLowerCase()}</td>
                    <td className="px-4 py-3">
                      <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium", s.cls)}>
                        <span className={cn("h-1.5 w-1.5 rounded-full", s.dot)} aria-hidden />{s.label}
                      </span>
                      {t.rejectedReason && <p className="text-2xs text-muted-foreground mt-0.5 max-w-[220px] line-clamp-2" title={t.rejectedReason}>{t.rejectedReason}</p>}
                      {t.qualityRating && t.qualityRating !== "UNKNOWN" && <p className="text-2xs text-muted-foreground mt-0.5">Quality {t.qualityRating.toLowerCase()}</p>}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell max-w-[420px]">
                      <p className="text-xs text-muted-foreground line-clamp-2">{t.bodyText}</p>
                      <p className="text-2xs text-muted-foreground/70 mt-0.5">
                        {vars > 0 ? `${vars} variable${vars > 1 ? "s" : ""}` : "No variables"}
                        {t.headerType && t.headerType !== "NONE" ? ` · ${t.headerType.toLowerCase()} header` : ""}
                        {t.buttons?.length ? ` · ${t.buttons.length} button${t.buttons.length > 1 ? "s" : ""}` : ""}
                      </p>
                    </td>
                    <td className="px-2 py-2.5">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={`Actions for ${t.displayName}`} disabled={busyId === t.id}>
                            {busyId === t.id ? <Loader2 className="animate-spin" /> : <MoreHorizontal />}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-52">
                          <DropdownMenuItem onClick={() => setViewing(t)}><Eye className="h-4 w-4" /> Preview</DropdownMenuItem>
                          {(isDraft || failedSubmit) && (
                            <DropdownMenuItem onClick={() => rowAction(t, "submit", () => whatsappTemplatesApi.submit(t.id), "Submitted to Meta")}><Send className="h-4 w-4" /> Submit to Meta</DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => setBuilder({ open: true, template: t, copyFrom: null })}><Pencil className="h-4 w-4" /> Edit</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setBuilder({ open: true, template: null, copyFrom: t })}><CopyPlus className="h-4 w-4" /> Duplicate</DropdownMenuItem>
                          {t.metaTemplateId && (
                            <DropdownMenuItem onClick={() => rowAction(t, "sync", () => whatsappTemplatesApi.syncOne(t.id), "Status refreshed from Meta")}><RotateCw className="h-4 w-4" /> Refresh status</DropdownMenuItem>
                          )}
                          <DropdownMenuItem asChild>
                            <a href={t.templateManagerUrl || templateManagerUrl(t.wabaId)} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-4 w-4" /> Open in Meta</a>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeleting(t)}><Trash2 className="h-4 w-4" /> Delete</DropdownMenuItem>
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

      <TemplateBuilderDialog
        open={builder.open}
        onOpenChange={(v) => setBuilder((b) => ({ ...b, open: v }))}
        accounts={accounts}
        defaultAccountId={numberId !== "all" ? numberId : defaultAccount?.id}
        template={builder.template}
        copyFrom={builder.copyFrom}
        onSaved={(t) => setTemplates((list) => (list.some((x) => x.id === t.id) ? list.map((x) => (x.id === t.id ? t : x)) : [t, ...list]))}
      />

      <Dialog open={Boolean(viewing)} onOpenChange={(v) => !v && setViewing(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader className="text-left">
            <DialogTitle className="text-base font-semibold">{viewing?.displayName}</DialogTitle>
            <DialogDescription className="font-mono text-2xs">{viewing?.templateName} · {viewing?.language} · {viewing?.category}</DialogDescription>
          </DialogHeader>
          {viewing && <TemplatePreview template={viewing} values={viewing.variableSamples || []} headerValue={viewing.headerExample} />}
          {viewing?.rejectedReason && <p className="text-xs text-destructive">Meta: {viewing.rejectedReason}</p>}
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(deleting)} onOpenChange={(v) => !v && setDeleting(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader className="text-left">
            <DialogTitle className="text-base font-semibold">Delete “{deleting?.displayName}”?</DialogTitle>
            <DialogDescription>
              It is deleted in Meta too. Meta blocks the same name for 30 days, and campaigns using it stop sending.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setDeleting(null)}>Cancel</Button>
            <Button variant="destructive" size="sm" onClick={confirmDelete} disabled={busyId === deleting?.id}>
              {busyId === deleting?.id && <Loader2 className="animate-spin" />} Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
