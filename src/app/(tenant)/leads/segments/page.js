"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { Download, Layers, MessageCircle, Phone, Plus, Trash2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLeads } from "@/lib/hooks/use-leads";
import { usePersistedState } from "@/lib/hooks/use-persisted-state";
import { toast } from "sonner";
import { LeadsPageHeader } from "@/components/leads/leads-page-header";

import { downloadCSV } from "@/lib/export-utils";
import { LEAD_EXPORT_COLUMNS, LIFECYCLES, leadsToCSV, lifecycleOf } from "@/lib/leads-workspace";
import { WhatsAppBroadcastDialog } from "@/components/leads/whatsapp-broadcast-dialog";

const STORAGE_KEY = "smoothsales_saved_lead_segments_v1";
const EMPTY_FILTERS = { lifecycle: "all", stage: "all", source: "all", city: "all", priority: "all" };

function matches(lead, filters) {
  if (filters.lifecycle && filters.lifecycle !== "all" && lifecycleOf(lead) !== filters.lifecycle) return false;
  if (filters.stage !== "all" && lead.lead_stage !== filters.stage) return false;
  if (filters.source !== "all" && lead.lead_source !== filters.source) return false;
  if (filters.city !== "all" && lead.city !== filters.city) return false;
  if (filters.priority !== "all" && Number(lead.lead_priority || 0) < Number(filters.priority)) return false;
  return true;
}

export default function SegmentsPage() {
  const { data: leads } = useLeads();
  const [segments, setSegments] = usePersistedState(STORAGE_KEY, []);
  const [name, setName] = useState("");
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [expandedId, setExpandedId] = useState(null);
  const [broadcastSegment, setBroadcastSegment] = useState(null);
  const savedSegments = Array.isArray(segments) ? segments : [];
  const stages = useMemo(() => [...new Set(leads.map((lead) => lead.lead_stage).filter(Boolean))].sort(), [leads]);
  const sources = useMemo(() => [...new Set(leads.map((lead) => lead.lead_source).filter(Boolean))].sort(), [leads]);
  const cities = useMemo(() => [...new Set(leads.map((lead) => lead.city).filter(Boolean))].sort(), [leads]);

  const createSegment = (event) => {
    event.preventDefault();
    const title = name.trim();
    if (!title) return;
    if (savedSegments.some((segment) => segment.name.toLowerCase() === title.toLowerCase())) return toast.error("A segment with that name already exists");
    setSegments((current) => [...(Array.isArray(current) ? current : []), { id: `segment_${Date.now()}`, name: title, filters, createdAt: new Date().toISOString() }]);
    setName(""); setFilters(EMPTY_FILTERS);
    toast.success("Smart segment saved");
  };

  const liveMatchCount = useMemo(() => leads.filter((lead) => matches(lead, filters)).length, [leads, filters]);

  const exportSegment = (segment, matchingLeads) => {
    if (!matchingLeads.length) return toast.error("This segment has no leads to export");
    const slug = segment.name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
    downloadCSV(leadsToCSV(matchingLeads, LEAD_EXPORT_COLUMNS), `segment_${slug || "leads"}.csv`);
    toast.success(`Exported ${matchingLeads.length} leads`);
  };

  const removeSegment = (id) => {
    if (!window.confirm("Delete this segment? Leads are not affected.")) return;
    setSegments((current) => (Array.isArray(current) ? current.filter((segment) => segment.id !== id) : []));
    if (expandedId === id) setExpandedId(null);
    toast.success("Segment removed");
  };

  return (
    <div className="flex w-full flex-col gap-4 pb-10">
      <LeadsPageHeader icon={Layers} title="Lead Segments & Smart Lists" subtitle="Save reusable filters; membership updates as lead data changes." />

      <form onSubmit={createSegment} className="grid gap-3 rounded-xl border border-border bg-card p-4 md:grid-cols-3 xl:grid-cols-6">
        <label className="flex flex-col gap-1 text-xs font-medium">Segment name<Input value={name} onChange={(event) => setName(event.target.value)} placeholder="High intent in Mumbai" maxLength={80} /></label>
        <label className="flex flex-col gap-1 text-xs font-medium">Lifecycle<select className="h-9 rounded-md border border-input bg-background px-2 text-xs" value={filters.lifecycle} onChange={(event) => setFilters((current) => ({ ...current, lifecycle: event.target.value }))}><option value="all">Any lifecycle</option>{LIFECYCLES.map((value) => <option key={value}>{value}</option>)}</select></label>
        <label className="flex flex-col gap-1 text-xs font-medium">Stage<select className="h-9 rounded-md border border-input bg-background px-2 text-xs" value={filters.stage} onChange={(event) => setFilters((current) => ({ ...current, stage: event.target.value }))}><option value="all">Any stage</option>{stages.map((value) => <option key={value}>{value}</option>)}</select></label>
        <label className="flex flex-col gap-1 text-xs font-medium">Source<select className="h-9 rounded-md border border-input bg-background px-2 text-xs" value={filters.source} onChange={(event) => setFilters((current) => ({ ...current, source: event.target.value }))}><option value="all">Any source</option>{sources.map((value) => <option key={value}>{value}</option>)}</select></label>
        <label className="flex flex-col gap-1 text-xs font-medium">City<select className="h-9 rounded-md border border-input bg-background px-2 text-xs" value={filters.city} onChange={(event) => setFilters((current) => ({ ...current, city: event.target.value }))}><option value="all">Any city</option>{cities.map((value) => <option key={value}>{value}</option>)}</select></label>
        <div className="flex items-end gap-2"><label className="flex flex-1 flex-col gap-1 text-xs font-medium">Minimum priority<select className="h-9 rounded-md border border-input bg-background px-2 text-xs" value={filters.priority} onChange={(event) => setFilters((current) => ({ ...current, priority: event.target.value }))}><option value="all">Any</option>{[1, 2, 3, 4, 5].map((value) => <option key={value} value={value}>{value}+ stars</option>)}</select></label><Button type="submit" size="sm" className="h-9 gap-1 text-xs" disabled={!name.trim()}><Plus className="h-3.5 w-3.5" />Save</Button></div>
        <p className="flex items-center gap-2 text-[11px] text-muted-foreground md:col-span-3 xl:col-span-6"><span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 font-semibold text-primary"><Users className="h-3 w-3" />Matches {liveMatchCount} lead{liveMatchCount === 1 ? "" : "s"} right now</span>{JSON.stringify(filters) !== JSON.stringify(EMPTY_FILTERS) && <button type="button" className="hover:text-foreground hover:underline" onClick={() => setFilters(EMPTY_FILTERS)}>Reset criteria</button>}</p>
      </form>

      <div className="space-y-3">{savedSegments.length ? savedSegments.map((segment) => {
        const matchingLeads = leads.filter((lead) => matches(lead, segment.filters || EMPTY_FILTERS));
        const expanded = expandedId === segment.id;
        const criteria = Object.entries(segment.filters || EMPTY_FILTERS).filter(([, value]) => value && value !== "all").map(([key, value]) => `${key}: ${value === "all" ? "any" : value}`);
        return <section key={segment.id} className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div className="min-w-[200px] flex-1"><h2 className="text-sm font-semibold">{segment.name}</h2><p className="mt-1 text-[11px] text-muted-foreground">{criteria.length ? criteria.join(" · ") : "All leads"}</p></div>
            <div className="flex items-center gap-2"><span className="inline-flex items-center gap-1 rounded-full bg-primary/8 px-2.5 py-1 text-xs font-semibold text-primary"><Users className="h-3.5 w-3.5" />{matchingLeads.length} leads</span><Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => setExpandedId(expanded ? null : segment.id)}>{expanded ? "Hide leads" : "View leads"}</Button><Button size="sm" variant="outline" className="h-8 gap-1 text-xs" onClick={() => exportSegment(segment, matchingLeads)}><Download className="h-3.5 w-3.5" />CSV</Button><Button size="sm" variant="outline" className="h-8 gap-1 text-xs text-emerald-700 dark:text-emerald-400" disabled={!matchingLeads.length} onClick={() => setBroadcastSegment(segment)}><MessageCircle className="h-3.5 w-3.5" />Broadcast</Button><Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-destructive" aria-label={`Delete ${segment.name}`} onClick={() => removeSegment(segment.id)}><Trash2 className="h-3.5 w-3.5" /></Button></div>
          </div>
          {expanded && <div className="flex flex-wrap gap-2 border-t border-border bg-muted/20 p-4">{matchingLeads.length ? matchingLeads.map((lead) => <div key={lead.id} className="inline-flex items-center gap-1 rounded-md border border-border bg-card py-1 pl-2.5 pr-1 text-xs hover:border-primary/50"><Link href={`/leads/active/${lead.id}`}><span className="font-medium">{lead.lead_name || lead.name}</span><span className="ml-2 text-muted-foreground">{lead.city || "No city"}</span>{lead.mobile_number && <span className="ml-2 font-mono text-[10.5px] text-muted-foreground">{lead.mobile_number}</span>}</Link>{lead.mobile_number && <a href={`tel:${lead.mobile_number.replace(/[^\d+]/g, "")}`} aria-label={`Call ${lead.lead_name}`} className="rounded p-1 text-emerald-600 hover:bg-emerald-500/10"><Phone className="h-3 w-3" /></a>}</div>) : <p className="text-xs text-muted-foreground">No leads match this segment currently.</p>}</div>}
        </section>;
      }) : <div className="rounded-xl border border-dashed border-border p-10 text-center text-xs text-muted-foreground">No saved segments yet. Choose filter criteria above and save a smart list.</div>}</div>
      <WhatsAppBroadcastDialog
        open={Boolean(broadcastSegment)}
        onOpenChange={(open) => !open && setBroadcastSegment(null)}
        title={`Broadcast to “${broadcastSegment?.name || ""}”`}
        leads={broadcastSegment ? leads.filter((lead) => matches(lead, broadcastSegment.filters || EMPTY_FILTERS)) : []}
      />
    </div>
  );
}
