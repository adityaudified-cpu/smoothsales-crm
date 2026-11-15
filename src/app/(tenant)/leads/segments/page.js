"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertCircle, Download, Layers, Loader2, MessageCircle, Phone, Plus, RotateCw, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { LeadsPageHeader } from "@/components/leads/leads-page-header";
import { WhatsAppBroadcastDialog } from "@/components/leads/whatsapp-broadcast-dialog";
import { downloadCSV } from "@/lib/export-utils";
import { LEAD_EXPORT_COLUMNS, LIFECYCLES, leadsToCSV } from "@/lib/leads-workspace";
import { segmentsApi } from "@/lib/api/segments";
import { customerToLead, SOURCE_FROM_API, STAGE_FROM_API } from "@/lib/api/mappers";

// Lifecycle buckets → backend stages (same grouping as lifecycleOf in leads-workspace).
const LIFECYCLE_STAGES = {
  "New lead": ["NEW"],
  Prospecting: ["CONTACTED", "SITE_VISIT_SCHEDULED", "SITE_VISIT_DONE"],
  Opportunity: ["QUALIFIED", "NEGOTIATION"],
  Closed: ["BOOKED", "LOST", "JUNK"],
};
const PRIORITY_LABEL = { HIGH: "High", MEDIUM: "Medium", LOW: "Low" };
const SOURCE_OPTIONS = Object.keys(SOURCE_FROM_API).filter((v) => v !== "OTHER").concat("INDIAMART", "JUSTDIAL", "WEB_FORM", "IMPORT", "OTHER");
const sourceLabel = (v) => SOURCE_FROM_API[v] || v.charAt(0) + v.slice(1).toLowerCase().replace(/_/g, " ");
const EMPTY_FORM = { lifecycle: "all", stage: "all", source: "all", city: "", priority: "all", createdWithinDays: "" };
const MAX_EXPORT = 5000;

const selectClass = "h-9 rounded-md border border-input bg-background px-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

function formToFilters(form) {
  const stages = form.stage !== "all" ? [form.stage] : form.lifecycle !== "all" ? LIFECYCLE_STAGES[form.lifecycle] : [];
  return {
    stages,
    sources: form.source !== "all" ? [form.source] : [],
    priorities: form.priority !== "all" ? [form.priority] : [],
    city: form.city.trim() || null,
    createdWithinDays: form.createdWithinDays ? Number(form.createdWithinDays) : null,
  };
}

function describe(filters = {}) {
  const parts = [];
  if (filters.stages?.length) parts.push(`stage: ${filters.stages.map((s) => STAGE_FROM_API[s] || s).join(", ")}`);
  if (filters.sources?.length) parts.push(`source: ${filters.sources.map(sourceLabel).join(", ")}`);
  if (filters.priorities?.length) parts.push(`priority: ${filters.priorities.map((p) => PRIORITY_LABEL[p] || p).join(", ")}`);
  if (filters.city) parts.push(`city: ${filters.city}`);
  if (filters.unassigned) parts.push("unassigned");
  if (filters.createdWithinDays) parts.push(`created in last ${filters.createdWithinDays} days`);
  return parts.length ? parts.join(" · ") : "All leads you can see";
}

async function fetchAllMembers(id) {
  const first = await segmentsApi.leads(id, { page: 0, size: 500 });
  let items = first.items;
  for (let page = 1; page < first.totalPages && items.length < MAX_EXPORT; page++) {
    items = items.concat((await segmentsApi.leads(id, { page, size: 500 })).items);
  }
  return items.map(customerToLead);
}

export default function SegmentsPage() {
  const [segments, setSegments] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [loadError, setLoadError] = useState(null);
  const [name, setName] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState({ count: null, loading: false });
  const [expanded, setExpanded] = useState({ id: null, leads: [], loading: false });
  const [busyId, setBusyId] = useState(null);
  const [broadcast, setBroadcast] = useState(null); // { segment, leads }

  const filters = useMemo(() => formToFilters(form), [form]);
  const dirty = JSON.stringify(form) !== JSON.stringify(EMPTY_FORM);

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      setSegments(await segmentsApi.list());
      setStatus("ready");
    } catch (err) {
      setLoadError(err);
      setStatus("error");
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Live "matches N leads" while editing criteria (debounced).
  useEffect(() => {
    let cancelled = false;
    setPreview((p) => ({ ...p, loading: true }));
    const t = setTimeout(async () => {
      try {
        const count = await segmentsApi.preview(filters);
        if (!cancelled) setPreview({ count, loading: false });
      } catch {
        if (!cancelled) setPreview({ count: null, loading: false });
      }
    }, 300);
    return () => { cancelled = true; clearTimeout(t); };
  }, [filters]);

  const set = (key) => (event) => setForm((f) => ({ ...f, [key]: event.target.value, ...(key === "lifecycle" ? { stage: "all" } : {}) }));

  const createSegment = async (event) => {
    event.preventDefault();
    const title = name.trim();
    if (!title) return;
    setSaving(true);
    try {
      const saved = await segmentsApi.create({ name: title, filters });
      setSegments((list) => [...list, saved].sort((a, b) => a.name.localeCompare(b.name)));
      setName("");
      setForm(EMPTY_FORM);
      toast.success("Segment saved");
    } catch (err) {
      toast.error("Could not save segment", { description: err.message });
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (segment) => {
    if (expanded.id === segment.id) return setExpanded({ id: null, leads: [], loading: false });
    setExpanded({ id: segment.id, leads: [], loading: true });
    try {
      const page = await segmentsApi.leads(segment.id, { size: 100 });
      setExpanded({ id: segment.id, leads: page.items.map(customerToLead), loading: false, total: page.total });
    } catch (err) {
      toast.error("Could not load leads", { description: err.message });
      setExpanded({ id: null, leads: [], loading: false });
    }
  };

  const withMembers = async (segment, action) => {
    setBusyId(segment.id);
    try {
      action(await fetchAllMembers(segment.id));
    } catch (err) {
      toast.error("Could not load segment leads", { description: err.message });
    } finally {
      setBusyId(null);
    }
  };

  const exportSegment = (segment) => withMembers(segment, (leads) => {
    if (!leads.length) return toast.error("This segment has no leads to export");
    const slug = segment.name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
    downloadCSV(leadsToCSV(leads, LEAD_EXPORT_COLUMNS), `segment_${slug || "leads"}.csv`);
    toast.success(`Exported ${leads.length} leads${segment.count > leads.length ? ` (first ${leads.length} of ${segment.count})` : ""}`);
  });

  const removeSegment = async (segment) => {
    if (!window.confirm(`Delete "${segment.name}"? Leads are not affected.`)) return;
    setBusyId(segment.id);
    try {
      await segmentsApi.remove(segment.id);
      setSegments((list) => list.filter((s) => s.id !== segment.id));
      if (expanded.id === segment.id) setExpanded({ id: null, leads: [], loading: false });
      toast.success("Segment deleted");
    } catch (err) {
      toast.error("Could not delete segment", { description: err.message });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="flex w-full flex-col gap-4 pb-10">
      <LeadsPageHeader icon={Layers} title="Lead Segments & Smart Lists" subtitle="Save reusable filters. Membership is recalculated from live lead data every time." />

      <form onSubmit={createSegment} className="grid gap-3 rounded-xl border border-border bg-card p-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-7" aria-label="New segment">
        <label className="flex flex-col gap-1 text-xs font-medium xl:col-span-2">Segment name
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="High intent in Mumbai" maxLength={80} required />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium">Lifecycle
          <select className={selectClass} value={form.lifecycle} onChange={set("lifecycle")}>
            <option value="all">Any lifecycle</option>
            {LIFECYCLES.map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium">Stage
          <select className={selectClass} value={form.stage} onChange={set("stage")}>
            <option value="all">Any stage</option>
            {(form.lifecycle !== "all" ? LIFECYCLE_STAGES[form.lifecycle] : Object.keys(STAGE_FROM_API)).map((v) => <option key={v} value={v}>{STAGE_FROM_API[v]}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium">Source
          <select className={selectClass} value={form.source} onChange={set("source")}>
            <option value="all">Any source</option>
            {SOURCE_OPTIONS.map((v) => <option key={v} value={v}>{sourceLabel(v)}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium">Priority
          <select className={selectClass} value={form.priority} onChange={set("priority")}>
            <option value="all">Any</option>
            {Object.entries(PRIORITY_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium">City
          <Input value={form.city} onChange={set("city")} placeholder="Any city" maxLength={80} />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium">Created within
          <select className={selectClass} value={form.createdWithinDays} onChange={set("createdWithinDays")}>
            <option value="">Any time</option>
            {[1, 7, 30, 90].map((d) => <option key={d} value={d}>Last {d} day{d === 1 ? "" : "s"}</option>)}
          </select>
        </label>
        <div className="flex flex-wrap items-center justify-between gap-2 sm:col-span-2 md:col-span-3 xl:col-span-7">
          <p className="flex items-center gap-2 text-[11px] text-muted-foreground" aria-live="polite">
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 font-semibold text-primary">
              {preview.loading ? <Loader2 className="h-3 w-3 animate-spin motion-reduce:animate-none" /> : <Users className="h-3 w-3" />}
              {preview.count === null ? "Count unavailable" : `Matches ${preview.count} lead${preview.count === 1 ? "" : "s"} now`}
            </span>
            {dirty && <button type="button" className="rounded hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" onClick={() => setForm(EMPTY_FORM)}>Reset criteria</button>}
          </p>
          <Button type="submit" size="sm" className="h-9 gap-1 text-xs" disabled={!name.trim() || saving}>
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin motion-reduce:animate-none" /> : <Plus className="h-3.5 w-3.5" />}Save segment
          </Button>
        </div>
      </form>

      {status === "loading" && (
        <div className="space-y-3" aria-busy="true" aria-label="Loading segments">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-[72px] w-full rounded-xl" />)}
        </div>
      )}

      {status === "error" && (
        <div role="alert" className="flex flex-col items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center">
          <AlertCircle className="h-5 w-5 text-destructive" />
          <p className="text-sm font-medium">Could not load segments</p>
          <p className="text-xs text-muted-foreground">{loadError?.message}</p>
          <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={load}><RotateCw className="h-3.5 w-3.5" />Try again</Button>
        </div>
      )}

      {status === "ready" && (
        <div className="space-y-3">
          {segments.length ? segments.map((segment) => {
            const open = expanded.id === segment.id;
            const busy = busyId === segment.id;
            return (
              <section key={segment.id} className="overflow-hidden rounded-xl border border-border bg-card" aria-labelledby={`seg-${segment.id}`}>
                <div className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div className="min-w-[200px] flex-1">
                    <h2 id={`seg-${segment.id}`} className="text-sm font-semibold">{segment.name}</h2>
                    <p className="mt-1 text-[11px] text-muted-foreground">{describe(segment.filters)}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold tabular-nums text-primary"><Users className="h-3.5 w-3.5" />{segment.count} leads</span>
                    <Button size="sm" variant="outline" className="h-8 text-xs" aria-expanded={open} onClick={() => toggle(segment)}>{open ? "Hide leads" : "View leads"}</Button>
                    <Button size="sm" variant="outline" className="h-8 gap-1 text-xs" disabled={busy || !segment.count} onClick={() => exportSegment(segment)}><Download className="h-3.5 w-3.5" />CSV</Button>
                    <Button size="sm" variant="outline" className="h-8 gap-1 text-xs text-primary" disabled={busy || !segment.count} onClick={() => withMembers(segment, (leads) => setBroadcast({ segment, leads }))}><MessageCircle className="h-3.5 w-3.5" />Broadcast</Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-destructive" disabled={busy} aria-label={`Delete ${segment.name}`} onClick={() => removeSegment(segment)}>
                      {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin motion-reduce:animate-none" /> : <Trash2 className="h-3.5 w-3.5" />}
                    </Button>
                  </div>
                </div>
                {open && (
                  <div className="border-t border-border bg-muted/20 p-4">
                    {expanded.loading ? (
                      <div className="flex gap-2">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-7 w-40" />)}</div>
                    ) : expanded.leads.length ? (
                      <>
                        <ul className="flex flex-wrap gap-2">
                          {expanded.leads.map((lead) => (
                            <li key={lead.id} className="inline-flex items-center gap-1 rounded-md border border-border bg-card py-1 pl-2.5 pr-1 text-xs hover:border-primary/50">
                              <Link href={`/leads/active/${lead.id}`} className="rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                                <span className="font-medium">{lead.lead_name}</span>
                                <span className="ml-2 text-muted-foreground">{lead.city || "No city"}</span>
                                {lead.mobile_number && <span className="ml-2 font-mono text-[10.5px] text-muted-foreground">{lead.mobile_number}</span>}
                              </Link>
                              {lead.mobile_number && <a href={`tel:${lead.mobile_number.replace(/[^\d+]/g, "")}`} aria-label={`Call ${lead.lead_name}`} className="rounded p-1 text-primary hover:bg-primary/10"><Phone className="h-3 w-3" /></a>}
                            </li>
                          ))}
                        </ul>
                        {expanded.total > expanded.leads.length && <p className="mt-3 text-[11px] text-muted-foreground">Showing {expanded.leads.length} of {expanded.total}. Export CSV for the full list.</p>}
                      </>
                    ) : <p className="text-xs text-muted-foreground">No leads match this segment right now.</p>}
                  </div>
                )}
              </section>
            );
          }) : (
            <div className="rounded-xl border border-dashed border-border p-10 text-center text-xs text-muted-foreground">No saved segments yet. Pick criteria above and save a smart list.</div>
          )}
        </div>
      )}

      <WhatsAppBroadcastDialog
        open={Boolean(broadcast)}
        onOpenChange={(open) => !open && setBroadcast(null)}
        title={`Broadcast to “${broadcast?.segment?.name || ""}”`}
        leads={broadcast?.leads || []}
      />
    </div>
  );
}
