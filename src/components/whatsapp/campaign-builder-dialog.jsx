"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Loader2, Upload, X, Search, Send, Users, Filter, FileSpreadsheet, ListPlus, UserPlus, Check, CalendarClock,
} from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { whatsappTemplatesApi, whatsappCampaignsApi, whatsappSendApi, countVariables } from "@/lib/api/whatsapp";
import { segmentsApi } from "@/lib/api/segments";
import { customersApi } from "@/lib/api/customers";
import { accountName } from "@/app/(tenant)/whatsapp/wa-accounts-context";
import { TemplatePreview } from "./template-preview";
import { cn } from "@/lib/utils";

export const LEAD_FIELDS = [
  ["{{lead.first_name}}", "Lead first name"],
  ["{{lead.full_name}}", "Lead full name"],
  ["{{lead.phone}}", "Lead phone"],
  ["{{lead.email}}", "Lead email"],
  ["{{lead.city}}", "Lead city"],
  ["{{lead.company}}", "Lead company"],
  ["{{lead.property_interest}}", "Property / product interest"],
  ["{{lead.agent_name}}", "Assigned agent name"],
];
const SAMPLE = {
  "{{lead.first_name}}": "Rahul", "{{lead.full_name}}": "Rahul Sharma", "{{lead.phone}}": "+919876543210",
  "{{lead.email}}": "rahul@example.com", "{{lead.city}}": "Pune", "{{lead.company}}": "Acme", "{{lead.property_interest}}": "2 BHK",
  "{{lead.agent_name}}": "Priya",
};
const STAGES = ["NEW", "CONTACTED", "QUALIFIED", "SITE_VISIT_SCHEDULED", "SITE_VISIT_DONE", "NEGOTIATION", "BOOKED", "LOST", "JUNK"];
const SOURCES = ["MANUAL", "META_LEAD_AD", "FACEBOOK_AD", "GOOGLE_AD", "GOOGLE", "WEBSITE", "WEB_FORM", "WHATSAPP_CTWA", "WHATSAPP_CAMPAIGN",
  "CALL_CAMPAIGN", "PORTAL_99ACRES", "PORTAL_MAGICBRICKS", "PORTAL_HOUSING", "INDIAMART", "JUSTDIAL", "LINKEDIN", "REFERRAL", "WALK_IN", "IMPORT", "OTHER"];
const PRIORITIES = ["HIGH", "MEDIUM", "LOW"];

const pretty = (s) => s.replaceAll("_", " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase());

/** "+91 98765-43210" / 9876543210 / 919876543210 → "919876543210", or null if not a mobile number. */
export function normalizePhone(raw) {
  let d = String(raw ?? "").replace(/\.0+$/, "").replace(/\D/g, "");
  if (d.startsWith("00")) d = d.slice(2);
  if (d.length === 11 && d.startsWith("0")) d = d.slice(1);
  if (d.length === 10) d = `91${d}`;
  return d.length >= 11 && d.length <= 15 ? d : null;
}

/** Reads the first sheet: finds the phone and name columns, dedupes, reports bad rows. */
async function parseSheet(file) {
  const XLSX = await import("xlsx");
  const wb = XLSX.read(await file.arrayBuffer(), { type: "array" });
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, defval: "", raw: true });
  if (!rows.length) throw new Error("The file is empty");
  const head = rows[0].map((h) => String(h).toLowerCase().trim());
  let phoneCol = head.findIndex((h) => /(phone|mobile|whatsapp|number|contact|cell)/.test(h));
  const nameCol = head.findIndex((h) => /(name)/.test(h) && !/(company|business)/.test(h));
  let start = 1;
  if (phoneCol === -1) {
    // No header: pick the first column that looks like phone numbers.
    phoneCol = rows[0].findIndex((v) => normalizePhone(typeof v === "number" ? Math.round(v) : v));
    start = 0;
    if (phoneCol === -1) throw new Error("Could not find a phone number column");
  }
  const seen = new Set();
  const contacts = [];
  let invalid = 0, dupes = 0;
  for (let r = start; r < rows.length; r++) {
    const raw = rows[r][phoneCol];
    if (raw === "" || raw == null) continue;
    const phone = normalizePhone(typeof raw === "number" ? Math.round(raw) : raw);
    if (!phone) { invalid++; continue; }
    if (seen.has(phone)) { dupes++; continue; }
    seen.add(phone);
    contacts.push({ phone: `+${phone}`, name: nameCol >= 0 ? String(rows[r][nameCol] || "").trim() : "" });
  }
  return { contacts, invalid, dupes, phoneHeader: start ? rows[0][phoneCol] : `Column ${phoneCol + 1}` };
}

function Chips({ options, value, onChange, label }) {
  return (
    <div className="flex flex-wrap gap-1.5" role="group" aria-label={label}>
      {options.map((o) => {
        const on = value.includes(o);
        return (
          <button key={o} type="button" aria-pressed={on} onClick={() => onChange(on ? value.filter((x) => x !== o) : [...value, o])}
            className={cn("h-7 px-2.5 rounded-md border text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              on ? "border-primary bg-accent text-accent-foreground" : "border-border hover:bg-muted/60")}>
            {on && <Check className="inline h-3 w-3 mr-1" aria-hidden />}{pretty(o)}
          </button>
        );
      })}
    </div>
  );
}

const SOURCES_TABS = [
  { id: "segment", label: "Segment", icon: Users },
  { id: "filters", label: "CRM filters", icon: Filter },
  { id: "pick", label: "Pick leads", icon: UserPlus },
  { id: "excel", label: "Excel / CSV", icon: FileSpreadsheet },
  { id: "paste", label: "Type numbers", icon: ListPlus },
];

const EMPTY_FILTERS = { stages: [], sources: [], priorities: [], city: "", unassigned: false, createdWithinDays: "" };

/**
 * Three-step campaign wizard: message → audience → review & schedule.
 * The audience is the union of every source filled in.
 */
export function CampaignBuilderDialog({ open, onOpenChange, accounts = [], defaultAccountId, onCreated }) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [accountId, setAccountId] = useState("");
  const [templates, setTemplates] = useState([]);
  const [tplState, setTplState] = useState("idle");
  const [templateId, setTemplateId] = useState("");
  const [mappings, setMappings] = useState([]); // [{ mode: field|text, value }]
  const [headerVar, setHeaderVar] = useState({ mode: "field", value: "{{lead.first_name}}" });
  const [headerMediaUrl, setHeaderMediaUrl] = useState("");
  // audience
  const [tab, setTab] = useState("segment");
  const [segments, setSegments] = useState([]);
  const [segmentId, setSegmentId] = useState("");
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [useFilters, setUseFilters] = useState(false);
  const [picked, setPicked] = useState([]);
  const [pickQuery, setPickQuery] = useState("");
  const [pickResults, setPickResults] = useState([]);
  const [excel, setExcel] = useState(null); // { fileName, contacts, invalid, dupes }
  const [parsing, setParsing] = useState(false);
  const [pasted, setPasted] = useState("");
  const [estimate, setEstimate] = useState(null);
  const [estimating, setEstimating] = useState(false);
  // schedule
  const [when, setWhen] = useState("now"); // now | later | draft
  const [scheduledAt, setScheduledAt] = useState("");
  const [testPhone, setTestPhone] = useState("");
  const [testing, setTesting] = useState(false);
  const [creating, setCreating] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    setStep(1); setName(""); setTemplateId(""); setMappings([]); setHeaderMediaUrl("");
    setSegmentId(""); setFilters(EMPTY_FILTERS); setUseFilters(false); setPicked([]); setExcel(null); setPasted("");
    setWhen("now"); setScheduledAt(""); setEstimate(null);
    setAccountId(defaultAccountId || accounts[0]?.id || "");
    segmentsApi.list().then((r) => setSegments(Array.isArray(r) ? r : [])).catch(() => setSegments([]));
  }, [open, defaultAccountId, accounts]);

  useEffect(() => {
    if (!open || !accountId) return;
    setTplState("loading");
    whatsappTemplatesApi.getApproved(accountId)
      .then((list) => { setTemplates(list); setTplState("ready"); })
      .catch(() => setTplState("error"));
  }, [open, accountId]);

  const template = templates.find((t) => t.id === templateId) || null;
  const varCount = template ? countVariables(template.bodyText) : 0;
  const headerType = String(template?.headerType || "NONE").toUpperCase();
  const mediaHeader = ["IMAGE", "VIDEO", "DOCUMENT"].includes(headerType);
  const headerHasVar = headerType === "TEXT" && String(template?.headerText || "").includes("{{1}}");

  const chooseTemplate = (id) => {
    setTemplateId(id);
    const t = templates.find((x) => x.id === id);
    const n = t ? countVariables(t.bodyText) : 0;
    setMappings(Array.from({ length: n }, (_, i) => (i === 0 ? { mode: "field", value: "{{lead.first_name}}" } : { mode: "text", value: "" })));
  };

  const mappingValue = (m) => m.value;
  const sampleValue = (m) => (m.mode === "field" ? SAMPLE[m.value] || "…" : m.value);

  // ── audience ──
  const pastedContacts = useMemo(() => {
    const seen = new Set();
    const out = [];
    let invalid = 0;
    for (const line of pasted.split(/\n/)) {
      if (!line.trim()) continue;
      const [rawPhone, ...rest] = line.split(/[,\t;]/);
      const p = normalizePhone(rawPhone);
      if (!p) { invalid++; continue; }
      if (seen.has(p)) continue;
      seen.add(p);
      out.push({ phone: `+${p}`, name: rest.join(" ").trim() });
    }
    return { contacts: out, invalid };
  }, [pasted]);

  const activeFilters = useFilters ? {
    stages: filters.stages, sources: filters.sources, priorities: filters.priorities,
    city: filters.city.trim() || null, unassigned: filters.unassigned || null,
    createdWithinDays: filters.createdWithinDays ? Number(filters.createdWithinDays) : null,
  } : null;

  const contacts = useMemo(() => {
    const map = new Map();
    for (const c of [...(excel?.contacts || []), ...pastedContacts.contacts]) map.set(c.phone, c);
    return [...map.values()];
  }, [excel, pastedContacts]);

  // Live count for CRM-based sources
  useEffect(() => {
    if (!open || step !== 2) return;
    const hasCrm = segmentId || activeFilters || picked.length;
    if (!hasCrm) { setEstimate(null); return; }
    const t = setTimeout(() => {
      setEstimating(true);
      whatsappCampaignsApi.previewAudience({ name: "preview", segmentId: segmentId || null, filters: activeFilters, customerIds: picked.map((p) => p.id) })
        .then(setEstimate).catch(() => setEstimate(null)).finally(() => setEstimating(false));
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, step, segmentId, JSON.stringify(activeFilters), picked.length]);

  useEffect(() => {
    if (pickQuery.trim().length < 2) { setPickResults([]); return; }
    const t = setTimeout(() => customersApi.search(pickQuery.trim(), { size: 8 }).then((r) => setPickResults(r.items || [])).catch(() => setPickResults([])), 250);
    return () => clearTimeout(t);
  }, [pickQuery]);

  const onExcel = async (file) => {
    if (!file) return;
    if (!/\.(xlsx|xls|csv)$/i.test(file.name)) return toast.error("Use an .xlsx, .xls or .csv file");
    setParsing(true);
    try {
      const res = await parseSheet(file);
      if (!res.contacts.length) throw new Error("No valid phone numbers found");
      setExcel({ fileName: file.name, ...res });
    } catch (e) {
      toast.error(e?.message || "Could not read the file");
    } finally {
      setParsing(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const crmEligible = estimate?.eligible ?? 0;
  const totalEstimate = crmEligible + contacts.length;
  const audienceEmpty = !segmentId && !activeFilters && picked.length === 0 && contacts.length === 0;

  const step1Ready = name.trim() && template
    && mappings.every((m) => String(m.value || "").trim())
    && (!mediaHeader || /^https:\/\/.+/.test(headerMediaUrl.trim()))
    && (!headerHasVar || String(headerVar.value || "").trim());
  const step3Ready = when !== "later" || (scheduledAt && new Date(scheduledAt) > new Date());

  const sendTest = async () => {
    const p = normalizePhone(testPhone);
    if (!p) return toast.error("Enter your number with country code");
    setTesting(true);
    try {
      const msg = await whatsappSendApi.sendTemplate({
        phone: `+${p}`, name: "Test", templateId, accountId,
        variables: mappings.map(sampleValue),
        headerVariable: headerHasVar ? sampleValue(headerVar) : undefined,
        headerMedia: mediaHeader ? headerMediaUrl.trim() : undefined,
      });
      if (String(msg?.status).toUpperCase() === "FAILED") toast.error(msg.failureReason || "Meta rejected the test");
      else toast.success("Test sent — check your WhatsApp");
    } catch (e) {
      toast.error(e?.message || "Test failed");
    } finally {
      setTesting(false);
    }
  };

  const create = async () => {
    setCreating(true);
    try {
      const created = await whatsappCampaignsApi.create({
        name: name.trim(),
        templateId,
        accountId: accountId || null,
        variableMappings: mappings.map(mappingValue),
        headerVariable: headerHasVar ? headerVar.value : null,
        headerMediaUrl: mediaHeader ? headerMediaUrl.trim() : null,
        segmentId: segmentId || null,
        filters: activeFilters,
        customerIds: picked.map((p) => p.id),
        contacts,
        scheduledAt: when === "later" ? new Date(scheduledAt).toISOString() : null,
        startImmediately: when === "now",
      });
      toast.success(when === "now" ? `Sending to ${created.totalRecipients} people` : when === "later" ? "Campaign scheduled" : "Saved as draft");
      onCreated?.(created);
      onOpenChange(false);
    } catch (e) {
      toast.error(e?.message || "Could not create the campaign");
    } finally {
      setCreating(false);
    }
  };

  const minDate = new Date(Date.now() + 5 * 60000 - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);

  return (
    <Dialog open={open} onOpenChange={(v) => !creating && onOpenChange(v)}>
      <DialogContent className="max-w-5xl p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-5 py-4 border-b border-border text-left">
          <DialogTitle className="text-base font-semibold">New WhatsApp campaign</DialogTitle>
          <DialogDescription>
            <ol className="flex flex-wrap gap-x-4 gap-y-1 mt-1" aria-label="Steps">
              {["Message", "Audience", "Review & send"].map((s, i) => (
                <li key={s} className={cn("flex items-center gap-1.5", step === i + 1 ? "text-foreground font-medium" : "text-muted-foreground")} aria-current={step === i + 1 ? "step" : undefined}>
                  <span className={cn("h-5 w-5 rounded-full text-2xs flex items-center justify-center border tabular", step > i + 1 ? "bg-primary border-primary text-primary-foreground" : step === i + 1 ? "border-primary" : "border-border")}>
                    {step > i + 1 ? <Check className="h-3 w-3" /> : i + 1}
                  </span>{s}
                </li>
              ))}
            </ol>
          </DialogDescription>
        </DialogHeader>

        <div className="grid lg:grid-cols-[1fr_320px] max-h-[70vh] overflow-y-auto lg:overflow-hidden">
          <div className="p-5 space-y-5 lg:overflow-y-auto lg:max-h-[70vh]">
            {step === 1 && (
              <>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="cb-name" className="text-xs">Campaign name</Label>
                    <Input id="cb-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={150} placeholder="Diwali offer — Pune leads" className="h-9 text-sm" />
                  </div>
                  {accounts.length > 1 && (
                    <div className="space-y-1.5">
                      <Label className="text-xs">Send from</Label>
                      <Select value={accountId} onValueChange={(v) => { setAccountId(v); setTemplateId(""); setMappings([]); }}>
                        <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Choose a number" /></SelectTrigger>
                        <SelectContent>{accounts.map((a) => <SelectItem key={a.id} value={a.id} className="text-xs">{accountName(a)}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  )}
                  <div className={cn("space-y-1.5", accounts.length <= 1 && "sm:col-span-2")}>
                    <Label className="text-xs">Approved template</Label>
                    <Select value={templateId} onValueChange={chooseTemplate} disabled={tplState !== "ready" || templates.length === 0}>
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue placeholder={tplState === "loading" ? "Loading…" : templates.length === 0 ? "No approved templates for this number" : "Choose a template"} />
                      </SelectTrigger>
                      <SelectContent>{templates.map((t) => <SelectItem key={t.id} value={t.id} className="text-xs">{t.displayName} · {String(t.category).toLowerCase()} · {t.language}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>

                {template && (headerHasVar || mediaHeader || varCount > 0) && (
                  <section className="space-y-3" aria-labelledby="cb-vars">
                    <h3 id="cb-vars" className="text-2xs font-medium uppercase tracking-wider text-muted-foreground">Personalise for each person</h3>
                    {mediaHeader && (
                      <div className="space-y-1.5">
                        <Label htmlFor="cb-media" className="text-xs">Header {headerType.toLowerCase()} — public https link</Label>
                        <Input id="cb-media" value={headerMediaUrl} onChange={(e) => setHeaderMediaUrl(e.target.value)} placeholder="https://yoursite.com/brochure.jpg" className="h-8 text-xs font-mono" />
                        <p className="text-2xs text-muted-foreground">Meta downloads it once per message, so it must stay online while the campaign sends.</p>
                      </div>
                    )}
                    {headerHasVar && <MappingRow label="Header {{1}}" m={headerVar} onChange={setHeaderVar} />}
                    {mappings.map((m, i) => (
                      <MappingRow key={i} label={`{{${i + 1}}}`} m={m} sample={template.variableSamples?.[i]}
                        onChange={(next) => setMappings((all) => all.map((x, j) => (j === i ? next : x)))} />
                    ))}
                  </section>
                )}
              </>
            )}

            {step === 2 && (
              <>
                <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Audience sources">
                  {SOURCES_TABS.map(({ id, label, icon: Icon }) => {
                    const count = id === "segment" ? (segmentId ? 1 : 0) : id === "filters" ? (useFilters ? 1 : 0) : id === "pick" ? picked.length
                      : id === "excel" ? excel?.contacts.length || 0 : pastedContacts.contacts.length;
                    return (
                      <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => setTab(id)}
                        className={cn("h-8 px-3 rounded-md border text-xs inline-flex items-center gap-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          tab === id ? "border-primary bg-accent text-accent-foreground font-medium" : "border-border hover:bg-muted/60")}>
                        <Icon className="h-3.5 w-3.5" aria-hidden />{label}
                        {count > 0 && <span className="rounded-full bg-primary text-primary-foreground px-1.5 text-2xs tabular">{id === "segment" || id === "filters" ? "on" : count}</span>}
                      </button>
                    );
                  })}
                </div>
                <p className="text-2xs text-muted-foreground -mt-2">Combine any of these — everyone is messaged once, even if they appear in several.</p>

                {tab === "segment" && (
                  <div className="space-y-2">
                    <Select value={segmentId || "none"} onValueChange={(v) => setSegmentId(v === "none" ? "" : v)}>
                      <SelectTrigger className="h-9 text-xs" aria-label="Segment"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none" className="text-xs">No segment</SelectItem>
                        {segments.map((s) => <SelectItem key={s.id} value={String(s.id)} className="text-xs">{s.name} <span className="text-muted-foreground tabular">({s.count ?? s.leadCount ?? 0})</span></SelectItem>)}
                      </SelectContent>
                    </Select>
                    {segments.length === 0 && <p className="text-xs text-muted-foreground">No saved segments. Create them under Leads → Segments, or use CRM filters.</p>}
                  </div>
                )}

                {tab === "filters" && (
                  <div className="space-y-3">
                    <label className="flex items-center gap-2 text-xs">
                      <input type="checkbox" checked={useFilters} onChange={(e) => setUseFilters(e.target.checked)} className="h-4 w-4 accent-[hsl(var(--primary))]" />
                      Include leads matching these filters
                    </label>
                    <fieldset disabled={!useFilters} className={cn("space-y-3", !useFilters && "opacity-50")}>
                      <div className="space-y-1.5"><p className="text-xs font-medium">Stage</p><Chips label="Stage" options={STAGES} value={filters.stages} onChange={(v) => setFilters((f) => ({ ...f, stages: v }))} /></div>
                      <div className="space-y-1.5"><p className="text-xs font-medium">Source</p><Chips label="Source" options={SOURCES} value={filters.sources} onChange={(v) => setFilters((f) => ({ ...f, sources: v }))} /></div>
                      <div className="space-y-1.5"><p className="text-xs font-medium">Priority</p><Chips label="Priority" options={PRIORITIES} value={filters.priorities} onChange={(v) => setFilters((f) => ({ ...f, priorities: v }))} /></div>
                      <div className="grid sm:grid-cols-3 gap-3">
                        <div className="space-y-1.5"><Label htmlFor="cb-city" className="text-xs">City</Label><Input id="cb-city" value={filters.city} onChange={(e) => setFilters((f) => ({ ...f, city: e.target.value }))} className="h-8 text-xs" /></div>
                        <div className="space-y-1.5"><Label htmlFor="cb-days" className="text-xs">Created in last (days)</Label><Input id="cb-days" type="number" min={1} value={filters.createdWithinDays} onChange={(e) => setFilters((f) => ({ ...f, createdWithinDays: e.target.value }))} className="h-8 text-xs" /></div>
                        <label className="flex items-end gap-2 text-xs pb-2"><input type="checkbox" checked={filters.unassigned} onChange={(e) => setFilters((f) => ({ ...f, unassigned: e.target.checked }))} className="h-4 w-4" /> Only unassigned</label>
                      </div>
                    </fieldset>
                  </div>
                )}

                {tab === "pick" && (
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" aria-hidden />
                      <Input value={pickQuery} onChange={(e) => setPickQuery(e.target.value)} placeholder="Search leads by name or phone" className="h-9 pl-8 text-xs" aria-label="Search leads" />
                    </div>
                    {pickResults.length > 0 && (
                      <ul className="rounded-md border border-border divide-y divide-border max-h-44 overflow-y-auto">
                        {pickResults.map((c) => {
                          const added = picked.some((p) => p.id === String(c.id));
                          return (
                            <li key={c.id} className="flex items-center justify-between gap-2 px-3 py-1.5">
                              <span className="min-w-0"><span className="block text-xs font-medium truncate">{c.fullName || `${c.firstName || ""} ${c.lastName || ""}`}</span><span className="block text-2xs font-mono text-muted-foreground">{c.phone}</span></span>
                              <Button variant="outline" size="sm" className="h-7 text-xs" disabled={added}
                                onClick={() => setPicked((p) => [...p, { id: String(c.id), name: c.fullName || c.firstName, phone: c.phone }])}>{added ? "Added" : "Add"}</Button>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                    {picked.length > 0 && (
                      <ul className="flex flex-wrap gap-1.5" aria-label="Selected leads">
                        {picked.map((p) => (
                          <li key={p.id} className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs">
                            {p.name}
                            <button type="button" aria-label={`Remove ${p.name}`} onClick={() => setPicked((all) => all.filter((x) => x.id !== p.id))} className="rounded hover:bg-foreground/10"><X className="h-3 w-3" /></button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                {tab === "excel" && (
                  <div className="space-y-2">
                    <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={(e) => onExcel(e.target.files?.[0])} />
                    <button type="button" onClick={() => fileRef.current?.click()} disabled={parsing}
                      className="w-full rounded-md border border-dashed border-border p-6 text-center hover:bg-muted/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                      {parsing ? <Loader2 className="h-5 w-5 mx-auto animate-spin text-muted-foreground" /> : <Upload className="h-5 w-5 mx-auto text-muted-foreground" aria-hidden />}
                      <span className="block text-sm font-medium mt-2">{excel ? excel.fileName : "Upload Excel or CSV"}</span>
                      <span className="block text-2xs text-muted-foreground">A column named phone / mobile / number (and optionally name). 10-digit numbers get +91.</span>
                    </button>
                    {excel && (
                      <div className="rounded-md border border-border p-3 text-xs space-y-2">
                        <p><span className="font-semibold tabular">{excel.contacts.length}</span> valid numbers from “{String(excel.phoneHeader)}”
                          {excel.invalid > 0 && <span className="text-warning"> · {excel.invalid} invalid skipped</span>}
                          {excel.dupes > 0 && <span className="text-muted-foreground"> · {excel.dupes} duplicates removed</span>}</p>
                        <ul className="font-mono text-2xs text-muted-foreground space-y-0.5">
                          {excel.contacts.slice(0, 5).map((c) => <li key={c.phone}>{c.phone}{c.name ? ` — ${c.name}` : ""}</li>)}
                          {excel.contacts.length > 5 && <li>… and {excel.contacts.length - 5} more</li>}
                        </ul>
                        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setExcel(null)}><X /> Remove file</Button>
                      </div>
                    )}
                  </div>
                )}

                {tab === "paste" && (
                  <div className="space-y-1.5">
                    <Label htmlFor="cb-paste" className="text-xs">One number per line, optionally followed by a comma and the name</Label>
                    <Textarea id="cb-paste" value={pasted} onChange={(e) => setPasted(e.target.value)} rows={8} className="font-mono text-xs" placeholder={"+919876543210, Rahul\n9822012345, Priya\n+971501234567"} />
                    <p className="text-2xs text-muted-foreground tabular">{pastedContacts.contacts.length} valid{pastedContacts.invalid > 0 && <span className="text-warning"> · {pastedContacts.invalid} invalid</span>}</p>
                  </div>
                )}

                <p className="text-2xs text-muted-foreground">New numbers are saved as contacts (not leads). They become leads automatically when they reply.</p>
              </>
            )}

            {step === 3 && (
              <>
                <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-2 text-xs rounded-md border border-border p-4">
                  <div><dt className="text-muted-foreground">Campaign</dt><dd className="font-medium">{name}</dd></div>
                  <div><dt className="text-muted-foreground">Template</dt><dd className="font-medium">{template?.displayName}</dd></div>
                  <div><dt className="text-muted-foreground">From</dt><dd className="font-medium">{accountName(accounts.find((a) => a.id === accountId)) || "Default number"}</dd></div>
                  <div><dt className="text-muted-foreground">Recipients (estimate)</dt><dd className="font-medium tabular">{totalEstimate.toLocaleString()} {estimate?.excluded > 0 && <span className="text-muted-foreground font-normal">· {estimate.excluded} on DND skipped</span>}</dd></div>
                </dl>

                <fieldset className="space-y-2">
                  <legend className="text-2xs font-medium uppercase tracking-wider text-muted-foreground mb-1">When</legend>
                  {[["now", "Send now"], ["later", "Schedule for later"], ["draft", "Save as draft — start it from the list"]].map(([v, l]) => (
                    <label key={v} className="flex items-center gap-2 text-sm">
                      <input type="radio" name="cb-when" value={v} checked={when === v} onChange={() => setWhen(v)} className="h-4 w-4" /> {l}
                    </label>
                  ))}
                  {when === "later" && (
                    <div className="pl-6 flex items-center gap-2">
                      <CalendarClock className="h-4 w-4 text-muted-foreground" aria-hidden />
                      <Input type="datetime-local" min={minDate} value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} className="h-8 text-xs w-auto" aria-label="Send at" />
                    </div>
                  )}
                </fieldset>

                <section className="rounded-md border border-border p-3 space-y-2" aria-labelledby="cb-test">
                  <p id="cb-test" className="text-xs font-medium">Send a test to yourself first</p>
                  <div className="flex gap-2">
                    <Input value={testPhone} onChange={(e) => setTestPhone(e.target.value)} placeholder="+91 98765 43210" className="h-8 text-xs font-mono" aria-label="Test phone number" inputMode="tel" />
                    <Button variant="outline" size="sm" onClick={sendTest} disabled={testing || !testPhone.trim()}>
                      {testing ? <Loader2 className="animate-spin" /> : <Send />} Send test
                    </Button>
                  </div>
                  <p className="text-2xs text-muted-foreground">Lead fields are filled with sample values in the test.</p>
                </section>
              </>
            )}
          </div>

          <aside className="border-t lg:border-t-0 lg:border-l border-border bg-muted/30 p-5 space-y-4 lg:overflow-y-auto lg:max-h-[70vh]">
            <div>
              <p className="text-2xs font-medium uppercase tracking-wider text-muted-foreground">Audience</p>
              <p className="text-2xl font-semibold tabular mt-0.5">
                {estimating ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" aria-label="Counting" /> : totalEstimate.toLocaleString()}
              </p>
              <p className="text-2xs text-muted-foreground">
                {audienceEmpty ? "Add people in step 2" : `${crmEligible.toLocaleString()} from CRM · ${contacts.length.toLocaleString()} imported/typed`}
              </p>
            </div>
            {template ? (
              <TemplatePreview template={template} values={mappings.map(sampleValue)} headerValue={sampleValue(headerVar)} headerMediaName={mediaHeader && headerMediaUrl ? headerMediaUrl.split("/").pop() : undefined} compact />
            ) : (
              <p className="text-xs text-muted-foreground">Choose a template to preview the message.</p>
            )}
          </aside>
        </div>

        <DialogFooter className="px-5 py-3 border-t border-border">
          {step > 1 ? <Button variant="outline" size="sm" onClick={() => setStep((s) => s - 1)} disabled={creating}>Back</Button>
            : <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>}
          {step < 3 ? (
            <Button size="sm" onClick={() => setStep((s) => s + 1)} disabled={step === 1 ? !step1Ready : audienceEmpty}>Next</Button>
          ) : (
            <Button size="sm" onClick={create} disabled={creating || !step3Ready}>
              {creating && <Loader2 className="animate-spin" />}
              {when === "now" ? "Start sending" : when === "later" ? "Schedule" : "Save draft"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function MappingRow({ label, m, onChange, sample }) {
  return (
    <div className="grid grid-cols-[64px_1fr] sm:grid-cols-[64px_200px_1fr] gap-2 items-center">
      <span className="font-mono text-xs text-muted-foreground">{label}</span>
      <Select value={m.mode === "field" ? m.value : "text"} onValueChange={(v) => onChange(v === "text" ? { mode: "text", value: "" } : { mode: "field", value: v })}>
        <SelectTrigger className="h-8 text-xs" aria-label={`Value for ${label}`}><SelectValue /></SelectTrigger>
        <SelectContent>
          {LEAD_FIELDS.map(([v, l]) => <SelectItem key={v} value={v} className="text-xs">{l}</SelectItem>)}
          <SelectItem value="text" className="text-xs">Same text for everyone…</SelectItem>
        </SelectContent>
      </Select>
      {m.mode === "text" ? (
        <Input value={m.value} onChange={(e) => onChange({ mode: "text", value: e.target.value })} placeholder={sample ? `e.g. ${sample}` : "Text"} className="h-8 text-xs col-span-2 sm:col-span-1" aria-label={`Text for ${label}`} />
      ) : <span className="hidden sm:block text-2xs text-muted-foreground">e.g. {SAMPLE[m.value]}</span>}
    </div>
  );
}
