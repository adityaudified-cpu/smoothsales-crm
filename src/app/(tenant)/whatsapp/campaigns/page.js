"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Megaphone, Plus, Send, Eye, MessageCircle, CheckCheck, XCircle,
  Clock, Users, Play, Pause, Copy, Trash2, Search, AlertCircle,
  RefreshCw, Upload, FileSpreadsheet, AlertTriangle, Loader2,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, FileText,
  Globe, Smartphone,
} from "lucide-react";
import { toast } from "sonner";
import {
  STATUS_CFG, encodeId,
} from "./data";
// Note: MOCK_CAMPAIGNS removed — campaigns loaded from API
import { useWaAccounts } from "../wa-accounts-context";
import { whatsappCampaignsApi, whatsappTemplatesApi, subscribeCampaignProgress } from "@/lib/api/whatsapp";
import { isApiMode } from "@/lib/api/client";

const PAGE_SIZE_OPTIONS = [5, 10, 20];
const BLANK_FORM = {
  name: "", templateId: "", segmentId: "",
  scheduleDate: "", scheduleTime: "",
  contactMode: "segment",
  manualNumbers: "",
  excelFile: null,
  excelFileName: "",
  variableValues: {},
};

// ─── Template Preview ─────────────────────────────────────────────────────────

function TemplatePreview({ tmpl, varValues }) {
  if (!tmpl) return null;
  const rendered = tmpl.body.replace(/\{\{(\d+)\}\}/g, (_, n) => {
    const key = tmpl.variables[parseInt(n) - 1];
    return varValues?.[key] ? `[${varValues[key]}]` : `{{${n}}}`;
  });
  return (
    <div className="rounded-xl bg-[#0b141a] p-3">
      <p className="text-[9px] font-semibold uppercase tracking-widest text-white/30 mb-2">Preview</p>
      <div className="bg-[#1f2c34] rounded-xl rounded-tl-sm p-2.5 max-w-[90%] shadow-sm">
        {tmpl.header && <p className="text-[10px] font-bold text-white mb-1.5 pb-1.5 border-b border-white/10">{tmpl.header}</p>}
        <p className="text-[10px] text-white/90 leading-relaxed whitespace-pre-wrap">{rendered.replace(/\*([^*]+)\*/g, "$1")}</p>
        {tmpl.footer && <p className="text-[9px] text-white/40 mt-1.5 pt-1.5 border-t border-white/10">{tmpl.footer}</p>}
        <p className="text-[8px] text-white/30 text-right mt-1">9:41 AM ✓✓</p>
      </div>
    </div>
  );
}

// ─── Create Campaign Modal ────────────────────────────────────────────────────

function CreateCampaignModal({ open, onClose, onSubmit, templates = [], segments = [] }) {
  const [form, setForm] = useState({ ...BLANK_FORM });
  const [step, setStep] = useState(1);
  const fileRef = useRef(null);

  const selectedTemplate = templates.find((t) => t.id === form.templateId);
  const selectedSegment  = segments.find((s) => s.id === form.segmentId);

  const setF = (patch) => setForm((p) => ({ ...p, ...patch }));
  const setVar = (key, val) => setForm((p) => ({ ...p, variableValues: { ...p.variableValues, [key]: val } }));

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.match(/\.(xlsx|xls|csv)$/i)) return toast.error("Only .xlsx, .xls, or .csv files allowed");
    setF({ excelFile: file, excelFileName: file.name });
    toast.success(`"${file.name}" uploaded`);
  };

  const handleClose = () => { setForm({ ...BLANK_FORM }); setStep(1); onClose(); };

  const canStep1 = form.name.trim() && form.templateId;
  const canStep2 = form.contactMode === "segment"
    ? !!form.segmentId
    : form.contactMode === "manual"
    ? form.manualNumbers.trim().length > 0
    : !!form.excelFile;

  const handleCreate = () => {
    if (!canStep1 || !canStep2) return toast.error("Please fill all required fields");
    onSubmit(form, selectedTemplate, selectedSegment);
    handleClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
          <div className="h-8 w-8 rounded-lg bg-emerald-500 flex items-center justify-center shrink-0">
            <Megaphone className="h-4 w-4 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">New Campaign</p>
            <p className="text-[11px] text-muted-foreground">Step {step} of 2 — {step === 1 ? "Template & Details" : "Audience & Schedule"}</p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {[1, 2].map((s) => (
              <div key={s} className={`h-1.5 w-8 rounded-full transition-colors ${s <= step ? "bg-emerald-500" : "bg-muted"}`} />
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 min-h-0">
          <div className="p-5 space-y-3.5 overflow-y-auto max-h-[65vh] border-r border-border">
            {step === 1 ? (
              <>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Campaign Name <span className="text-red-500">*</span></Label>
                  <Input value={form.name} onChange={(e) => setF({ name: e.target.value })} placeholder="e.g. Q1 Product Discovery Broadcast" className="h-8 text-xs" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Message Template <span className="text-red-500">*</span></Label>
                  <Select value={form.templateId} onValueChange={(v) => setF({ templateId: v, variableValues: {} })}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select approved template" /></SelectTrigger>
                    <SelectContent>
                      {templates.map((t) => (
                        <SelectItem key={t.id} value={t.id} className="text-xs">
                          {t.displayName} <span className="text-muted-foreground text-[10px]">· {t.category}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {selectedTemplate?.variables?.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Template Variables</Label>
                    <div className="space-y-2">
                      {selectedTemplate.variables.map((v, i) => (
                        <div key={v} className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-1 rounded shrink-0 w-10 text-center">{`{{${i+1}}}`}</span>
                          <Input value={form.variableValues[v] || ""} onChange={(e) => setVar(v, e.target.value)} placeholder={v.replace(/_/g, " ")} className="h-7 text-xs flex-1" />
                        </div>
                      ))}
                    </div>
                    <p className="text-[10px] text-muted-foreground">Fill sample values to preview →</p>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Target Audience <span className="text-red-500">*</span></Label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { val: "segment", label: "Segment",  Icon: Users },
                      { val: "manual",  label: "Manual",   Icon: FileText },
                      { val: "excel",   label: "Excel",    Icon: FileSpreadsheet },
                    ].map(({ val, label, Icon }) => (
                      <button key={val} onClick={() => setF({ contactMode: val })}
                        className={`flex flex-col items-center gap-1 p-2.5 rounded-lg border text-[11px] font-medium transition-colors ${form.contactMode === val ? "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : "border-border text-muted-foreground hover:text-foreground"}`}>
                        <Icon className="h-4 w-4" />{label}
                      </button>
                    ))}
                  </div>
                </div>

                {form.contactMode === "segment" && (
                  <div className="space-y-1.5">
                    <Select value={form.segmentId} onValueChange={(v) => setF({ segmentId: v })}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select segment" /></SelectTrigger>
                      <SelectContent>
                        {segments.map((s) => (
                          <SelectItem key={s.id} value={s.id} className="text-xs">
                            {s.label} <span className="text-muted-foreground">({s.count.toLocaleString()} leads)</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedSegment && (
                      <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <Users className="h-3 w-3" />{selectedSegment.count.toLocaleString()} contacts will receive this
                      </p>
                    )}
                  </div>
                )}

                {form.contactMode === "manual" && (
                  <div className="space-y-1.5">
                    <Textarea value={form.manualNumbers} onChange={(e) => setF({ manualNumbers: e.target.value })}
                      placeholder={"Enter phone numbers (one per line)\n+919876543210\n+918765432109"}
                      className="text-xs min-h-[100px] resize-none font-mono" />
                    <p className="text-[10px] text-muted-foreground">
                      {form.manualNumbers.trim() ? `${form.manualNumbers.trim().split("\n").filter(Boolean).length} numbers entered` : "Include country code e.g. +91"}
                    </p>
                  </div>
                )}

                {form.contactMode === "excel" && (
                  <div className="space-y-2">
                    <div onClick={() => fileRef.current?.click()}
                      className="border-2 border-dashed border-border rounded-xl p-5 flex flex-col items-center gap-2 cursor-pointer hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-colors">
                      <FileSpreadsheet className="h-7 w-7 text-muted-foreground/50" />
                      {form.excelFileName ? (
                        <div className="text-center">
                          <p className="text-xs font-medium text-foreground">{form.excelFileName}</p>
                          <p className="text-[10px] text-emerald-600">Uploaded — click to replace</p>
                        </div>
                      ) : (
                        <div className="text-center">
                          <p className="text-xs font-medium text-foreground">Click to upload</p>
                          <p className="text-[10px] text-muted-foreground">.xlsx, .xls, or .csv</p>
                        </div>
                      )}
                    </div>
                    <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFileUpload} />
                    <div className="flex items-start gap-2 p-2.5 rounded-lg bg-blue-500/5 border border-blue-500/20 text-[10px] text-blue-700 dark:text-blue-400">
                      <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5" />
                      <span>Column named <span className="font-mono font-semibold">phone</span> or <span className="font-mono font-semibold">mobile</span> will be used.</span>
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Schedule <span className="text-muted-foreground font-normal">(optional)</span></Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input type="date" value={form.scheduleDate} onChange={(e) => setF({ scheduleDate: e.target.value })} className="h-8 text-xs" />
                    <Input type="time" value={form.scheduleTime} onChange={(e) => setF({ scheduleTime: e.target.value })} className="h-8 text-xs" />
                  </div>
                </div>

                <div className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-500/5 border border-amber-500/20 text-[10px] text-amber-700 dark:text-amber-400">
                  <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5" />
                  <span>Only Meta-approved templates can be used for bulk campaigns.</span>
                </div>
              </>
            )}
          </div>

          <div className="p-5 bg-muted/20 flex flex-col gap-4 overflow-y-auto max-h-[65vh]">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Live Preview</p>
            {selectedTemplate ? (
              <TemplatePreview tmpl={selectedTemplate} varValues={form.variableValues} />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center gap-2 text-muted-foreground/40 py-8">
                <MessageCircle className="h-8 w-8" />
                <p className="text-xs">Select a template to preview</p>
              </div>
            )}
            {step === 2 && selectedTemplate && (
              <div className="space-y-2 mt-1">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Summary</p>
                {[
                  { label: "Template", value: selectedTemplate.displayName },
                  { label: "Audience", value: form.contactMode === "segment" ? (selectedSegment?.label || "—") : form.contactMode === "manual" ? `${form.manualNumbers.trim().split("\n").filter(Boolean).length} numbers` : (form.excelFileName || "—") },
                  { label: "Schedule", value: form.scheduleDate ? `${form.scheduleDate} ${form.scheduleTime || ""}` : "Save as draft" },
                ].map((r) => (
                  <div key={r.label} className="flex justify-between text-[11px]">
                    <span className="text-muted-foreground">{r.label}</span>
                    <span className="font-medium text-foreground text-right max-w-[60%] truncate">{r.value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 px-5 py-3.5 border-t border-border bg-card">
          <Button variant="outline" size="sm" className="text-xs" onClick={step === 1 ? handleClose : () => setStep(1)}>
            {step === 1 ? "Cancel" : "← Back"}
          </Button>
          {step === 1 ? (
            <Button size="sm" className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white" disabled={!canStep1} onClick={() => setStep(2)}>
              Next: Audience →
            </Button>
          ) : (
            <Button size="sm" className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white" disabled={!canStep2} onClick={handleCreate}>
              <Send className="h-3.5 w-3.5 mr-1.5" />Create Campaign
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function WhatsAppCampaignsPage() {
  const router = useRouter();
  const { accounts } = useWaAccounts();
  const metaAccounts = accounts.filter((a) => a.type === "meta");
  const onlyPersonal = accounts.length > 0 && metaAccounts.length === 0;

  const [campaigns, setCampaigns] = useState([]);
  const [apiTemplates, setApiTemplates] = useState([]);
  const [segments, setSegments] = useState([]);
  const [isLoadingCampaigns, setIsLoadingCampaigns] = useState(false);
  const [search, setSearch]       = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [createOpen, setCreateOpen]     = useState(false);
  const [deleteId, setDeleteId]         = useState(null);
  const [page, setPage]       = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Load campaigns from API
  useEffect(() => {
    if (!isApiMode()) { setCampaigns([]); return; }
    setIsLoadingCampaigns(true);
    whatsappCampaignsApi.getAll({ size: 100 })
      .then((data) => {
        const items = Array.isArray(data) ? data : (data?.content || []);
        setCampaigns(items.map((c) => ({
          id: c.id,
          name: c.name || "",
          template: c.templateName || c.template || "",
          templateId: c.templateId || "",
          segment: c.segmentName || c.segment || "All Leads",
          status: (c.status || "draft").toLowerCase(),
          scheduledAt: c.scheduledAt ? new Date(c.scheduledAt).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—",
          sent: c.sentCount || 0,
          delivered: c.deliveredCount || 0,
          read: c.readCount || 0,
          replied: c.repliedCount || 0,
          failed: c.failedCount || 0,
          createdAt: c.createdAt ? new Date(c.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "",
        })));
      })
      .catch(() => {})
      .finally(() => setIsLoadingCampaigns(false));
  }, []);

  // Load approved templates from API
  useEffect(() => {
    if (!isApiMode()) return;
    whatsappTemplatesApi.getApproved()
      .then((data) => { if (Array.isArray(data) && data.length > 0) setApiTemplates(data); })
      .catch(() => {});
  }, []);

  // Load segments from API
  useEffect(() => {
    if (!isApiMode()) return;
    Promise.all([
      whatsappCampaignsApi.previewAudience("all_leads"),
      whatsappCampaignsApi.previewAudience("hot_leads"),
      whatsappCampaignsApi.previewAudience("scheduled"),
      whatsappCampaignsApi.previewAudience("quote_sent"),
      whatsappCampaignsApi.previewAudience("followup_due"),
    ]).then(([all, hot, sched, quote, followup]) => {
      setSegments([
        { id: "all_leads",    label: "All Active Leads",           count: all?.count ?? 0 },
        { id: "hot_leads",    label: "Hot Leads",                  count: hot?.count ?? 0 },
        { id: "scheduled",    label: "Meeting / Visit Scheduled",  count: sched?.count ?? 0 },
        { id: "quote_sent",   label: "Quotation Sent",             count: quote?.count ?? 0 },
        { id: "followup_due", label: "Follow-up Due",              count: followup?.count ?? 0 },
      ]);
    }).catch(() => {});
  }, []);

  // WebSocket: live campaign progress
  useEffect(() => {
    if (!isApiMode()) return;
    const unsub = subscribeCampaignProgress((data) => {
      setCampaigns((prev) => prev.map((c) =>
        c.id === data.campaignId
          ? { ...c, sent: data.sentCount ?? c.sent, failed: data.failedCount ?? c.failed }
          : c
      ));
    });
    return unsub;
  }, []);

  const filtered = useMemo(() => campaigns.filter((c) => {
    const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.template.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || c.status === statusFilter;
    return matchSearch && matchStatus;
  }), [campaigns, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage   = Math.min(page, totalPages);
  const pageItems  = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);
  React.useEffect(() => setPage(1), [search, statusFilter, pageSize]);

  const stats = useMemo(() => {
    const sent = campaigns.reduce((s, c) => s + c.sent, 0);
    const read = campaigns.reduce((s, c) => s + c.read, 0);
    return {
      total:    campaigns.length,
      running:  campaigns.filter((c) => c.status === "running").length,
      sent,
      readRate: sent > 0 ? Math.round((read / sent) * 100) : 0,
    };
  }, [campaigns]);

  const handleCreate = async (form, tmpl, seg) => {
    const payload = {
      name: form.name,
      templateId: tmpl?.id || null,
      messageBody: null,
      type: "TEMPLATE",
      scheduledAt: form.scheduleDate ? `${form.scheduleDate}T${form.scheduleTime || "09:00"}:00` : null,
      segmentId: form.contactMode === "segment" ? form.segmentId || null : null,
    };
    if (isApiMode()) {
      try {
        const created = await whatsappCampaignsApi.create(payload);
        setCampaigns((prev) => [{
          id: created.id,
          name: form.name,
          template: tmpl?.displayName || "",
          templateId: tmpl?.id || "",
          segment: form.contactMode === "segment" ? (seg?.label || "") : form.contactMode === "manual" ? "Manual Numbers" : form.excelFileName,
          status: form.scheduleDate ? "scheduled" : "draft",
          scheduledAt: form.scheduleDate ? `${form.scheduleDate} · ${form.scheduleTime || "09:00"}` : "—",
          sent: 0, delivered: 0, read: 0, replied: 0, failed: 0,
          createdAt: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
        }, ...prev]);
      } catch { toast.error("Failed to create campaign"); return; }
    } else {
      const newC = {
        id: `c_${Date.now()}`, name: form.name,
        templateId: tmpl?.id || "", template: tmpl?.displayName || "",
        segment: form.contactMode === "segment" ? (seg?.label || "") : form.contactMode === "manual" ? "Manual Numbers" : form.excelFileName,
        status: form.scheduleDate ? "scheduled" : "draft",
        scheduledAt: form.scheduleDate ? `${form.scheduleDate} · ${form.scheduleTime || "09:00"}` : "—",
        sent: 0, delivered: 0, read: 0, replied: 0, failed: 0,
        createdAt: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
      };
      setCampaigns((prev) => [newC, ...prev]);
    }
    toast.success("Campaign created successfully");
  };

  const togglePause = async (id) => {
    const c = campaigns.find((x) => x.id === id);
    if (!c) return;
    const next = c.status === "running" ? "paused" : "running";
    if (isApiMode()) {
      try {
        if (next === "paused") await whatsappCampaignsApi.pause(id);
        else await whatsappCampaignsApi.start(id);
      } catch { toast.error("Action failed"); return; }
    }
    setCampaigns((prev) => prev.map((x) => x.id === id ? { ...x, status: next } : x));
    toast.success(`Campaign ${next === "paused" ? "paused" : "resumed"}`);
  };

  const sendNow = async (id) => {
    if (isApiMode()) {
      try { await whatsappCampaignsApi.start(id); } catch { toast.error("Failed to start campaign"); return; }
    }
    setCampaigns((prev) => prev.map((c) => c.id === id ? { ...c, status: "running" } : c));
    const c = campaigns.find((x) => x.id === id);
    toast.success(`Campaign "${c?.name}" is now running`);
  };

  const handleDelete = async (id) => {
    if (isApiMode()) {
      try { await whatsappCampaignsApi.delete(id); } catch { toast.error("Delete failed"); return; }
    }
    setCampaigns((prev) => prev.filter((c) => c.id !== id));
    setDeleteId(null);
    toast.success("Campaign deleted");
  };

  const duplicate = (c) => {
    setCampaigns((prev) => [{ ...c, id: `c_${Date.now()}`, name: `${c.name} (Copy)`, status: "draft", sent: 0, delivered: 0, read: 0, replied: 0, failed: 0 }, ...prev]);
    toast.success("Campaign duplicated");
  };

  return (
    <div className="flex flex-col h-full min-h-0 bg-background">

      {/* Top Bar */}
      <div className="shrink-0 flex items-center justify-between gap-4 px-6 py-3 border-b border-border bg-card">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="h-8 w-8 rounded-lg bg-emerald-500 flex items-center justify-center shrink-0">
            <Megaphone className="h-4 w-4 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-bold text-foreground leading-tight">WhatsApp Campaigns</h1>
            <p className="text-[11px] text-muted-foreground">Send bulk messages using Meta-approved templates</p>
          </div>
        </div>
        <Button size="sm" className="h-8 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shrink-0" onClick={() => setCreateOpen(true)}>
          <Plus className="h-3.5 w-3.5" />New Campaign
        </Button>
      </div>

      {/* Personal WA restriction banner */}
      {onlyPersonal && (
        <div className="shrink-0 flex items-center gap-2.5 px-6 py-2.5 bg-amber-500/10 border-b border-amber-500/20">
          <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
          <p className="text-xs text-amber-700 font-medium">
            Bulk campaigns require a <span className="font-bold">Meta Cloud API</span> account. Personal WhatsApp cannot send bulk messages or templates.
            <a href="/whatsapp/connect" className="ml-2 underline font-semibold">Connect Meta API →</a>
          </p>
        </div>
      )}

      {/* KPI Strip */}
      <div className="shrink-0 grid grid-cols-4 border-b border-border bg-card/50">
        {[
          { label: "Total",     value: stats.total,                  color: "text-foreground",  dot: "bg-muted-foreground/50" },
          { label: "Running",   value: stats.running,                color: "text-blue-600",    dot: "bg-blue-500" },
          { label: "Sent",      value: stats.sent.toLocaleString(),  color: "text-emerald-600", dot: "bg-emerald-500" },
          { label: "Read Rate", value: `${stats.readRate}%`,         color: "text-violet-600",  dot: "bg-violet-500" },
        ].map((k, i) => (
          <div key={k.label} className={`px-5 py-3 flex items-center gap-2.5 ${i < 3 ? "border-r border-border" : ""}`}>
            <span className={`h-2 w-2 rounded-full shrink-0 ${k.dot}`} />
            <div>
              <p className={`text-lg font-bold leading-none ${k.color}`}>{k.value}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{k.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="shrink-0 flex items-center gap-2.5 px-6 py-2.5 border-b border-border bg-card/30 flex-wrap">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search campaigns..." className="pl-8 h-8 text-xs w-52 bg-background" />
        </div>
        <div className="flex items-center gap-0.5 bg-muted/50 p-0.5 rounded-lg border border-border">
          {["all", "running", "scheduled", "completed", "draft", "paused"].map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors capitalize ${statusFilter === s ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
              {s === "all" ? "All" : s}
            </button>
          ))}
        </div>
        <span className="ml-auto text-[11px] text-muted-foreground">{filtered.length} campaign{filtered.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-xs border-collapse">
          <thead className="sticky top-0 z-10 bg-muted/70 backdrop-blur-sm border-b border-border">
            <tr>
              {["#", "Campaign", "Template", "Status", "Sent", "Delivered", "Read", "Replied", "Failed", "Scheduled", "Actions"].map((h, i) => (
                <th key={h} className={`px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap ${i === 0 ? "w-10" : ""} ${h === "Actions" ? "text-right pr-4" : ""}`}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {pageItems.length === 0 && (
              <tr>
                <td colSpan={11} className="px-4 py-16 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Megaphone className="h-7 w-7 opacity-25" />
                    <p className="text-sm font-medium">No campaigns found</p>
                    <p className="text-xs opacity-60">Try adjusting your search or filters</p>
                  </div>
                </td>
              </tr>
            )}
            {pageItems.map((c, idx) => {
              const sc = STATUS_CFG[c.status] || STATUS_CFG.draft;
              const globalIdx = (safePage - 1) * pageSize + idx + 1;
              const delivRate = c.sent > 0 ? Math.round((c.delivered / c.sent) * 100) : null;
              const readRate  = c.sent > 0 ? Math.round((c.read / c.sent) * 100) : null;
              const replyRate = c.sent > 0 ? Math.round((c.replied / c.sent) * 100) : null;
              return (
                <tr key={c.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-3 py-3 text-muted-foreground font-mono text-[11px] w-10">{globalIdx}</td>
                  <td className="px-3 py-3 min-w-[180px] max-w-[220px]">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                        <Megaphone className="h-3.5 w-3.5 text-emerald-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-foreground truncate text-[12px]">{c.name}</p>
                        <p className="text-[10px] text-muted-foreground truncate flex items-center gap-1">
                          <Users className="h-2.5 w-2.5 shrink-0" />{c.segment}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3 min-w-[140px] max-w-[180px]">
                    <p className="text-[11px] text-foreground truncate">{c.template}</p>
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1.5 text-[10px] font-medium px-2 py-1 rounded-full border ${sc.cls}`}>
                      <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${sc.dot} ${c.status === "running" ? "animate-pulse" : ""}`} />
                      {sc.label}
                    </span>
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    <span className="text-[11px] font-medium text-blue-600">{c.sent > 0 ? c.sent.toLocaleString() : <span className="text-muted-foreground">—</span>}</span>
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    {delivRate !== null ? (
                      <div><span className="text-[11px] font-medium text-emerald-600">{delivRate}%</span><p className="text-[9px] text-muted-foreground">{c.delivered.toLocaleString()}</p></div>
                    ) : <span className="text-muted-foreground text-[11px]">—</span>}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    {readRate !== null ? (
                      <div><span className="text-[11px] font-medium text-violet-600">{readRate}%</span><p className="text-[9px] text-muted-foreground">{c.read.toLocaleString()}</p></div>
                    ) : <span className="text-muted-foreground text-[11px]">—</span>}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    {replyRate !== null ? (
                      <div><span className="text-[11px] font-medium text-amber-600">{replyRate}%</span><p className="text-[9px] text-muted-foreground">{c.replied.toLocaleString()}</p></div>
                    ) : <span className="text-muted-foreground text-[11px]">—</span>}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    {c.failed > 0 ? <span className="text-[11px] font-medium text-red-500">{c.failed.toLocaleString()}</span> : <span className="text-muted-foreground text-[11px]">—</span>}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-[11px] text-muted-foreground min-w-[130px]">{c.scheduledAt}</td>
                  <td className="px-3 py-3 whitespace-nowrap pr-4">
                    <div className="flex items-center justify-end gap-0.5">
                      {(c.status === "draft" || c.status === "scheduled") && (
                        <button onClick={() => sendNow(c.id)} className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-emerald-600 hover:bg-emerald-500/10 transition-colors" title="Send Now">
                          <Play className="h-3.5 w-3.5" />
                        </button>
                      )}
                      {(c.status === "running" || c.status === "paused") && (
                        <button onClick={() => togglePause(c.id)} className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors" title={c.status === "running" ? "Pause" : "Resume"}>
                          {c.status === "running" ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                        </button>
                      )}
                      <button onClick={() => router.push(`/whatsapp/campaigns/${encodeId(c.id)}`)} className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors" title="View Details">
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => duplicate(c)} className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors" title="Duplicate">
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => setDeleteId(c.id)} className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors" title="Delete">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="shrink-0 flex items-center justify-between gap-3 px-6 py-2.5 border-t border-border bg-card">
        <div className="flex items-center gap-2.5">
          <span className="text-[11px] text-muted-foreground">Rows</span>
          <Select value={String(pageSize)} onValueChange={(v) => setPageSize(Number(v))}>
            <SelectTrigger className="h-7 w-14 text-xs border-border"><SelectValue /></SelectTrigger>
            <SelectContent>{PAGE_SIZE_OPTIONS.map((n) => <SelectItem key={n} value={String(n)} className="text-xs">{n}</SelectItem>)}</SelectContent>
          </Select>
          <span className="text-[11px] text-muted-foreground">
            {filtered.length === 0 ? "0 results" : `${(safePage - 1) * pageSize + 1}–${Math.min(safePage * pageSize, filtered.length)} of ${filtered.length}`}
          </span>
        </div>
        <div className="flex items-center gap-0.5">
          <button onClick={() => setPage(1)} disabled={safePage === 1} className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed"><ChevronsLeft className="h-3.5 w-3.5" /></button>
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={safePage === 1} className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed"><ChevronLeft className="h-3.5 w-3.5" /></button>
          <div className="flex items-center gap-0.5 mx-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
              .reduce((acc, p, i, arr) => { if (i > 0 && p - arr[i - 1] > 1) acc.push("..."); acc.push(p); return acc; }, [])
              .map((p, i) => p === "..." ? (
                <span key={`e-${i}`} className="text-[11px] text-muted-foreground px-1">…</span>
              ) : (
                <button key={p} onClick={() => setPage(p)} className={`h-7 min-w-[28px] px-2 rounded-md text-[11px] font-medium transition-colors ${safePage === p ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}>{p}</button>
              ))}
          </div>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={safePage === totalPages} className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed"><ChevronRight className="h-3.5 w-3.5" /></button>
          <button onClick={() => setPage(totalPages)} disabled={safePage === totalPages} className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed"><ChevronsRight className="h-3.5 w-3.5" /></button>
        </div>
      </div>

      <CreateCampaignModal open={createOpen} onClose={() => setCreateOpen(false)} onSubmit={handleCreate} templates={apiTemplates} segments={segments} />

      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-red-500/10 flex items-center justify-center">
                <Trash2 className="h-3.5 w-3.5 text-red-500" />
              </div>
              Delete Campaign
            </DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-3">
            <p className="text-xs text-muted-foreground">
              Are you sure you want to delete <span className="font-semibold text-foreground">{campaigns.find((c) => c.id === deleteId)?.name}</span>? This cannot be undone.
            </p>
            <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/5 border border-red-500/20 text-[11px] text-red-600 dark:text-red-400">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <span>All analytics data for this campaign will be permanently lost.</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" className="text-xs" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button size="sm" className="text-xs bg-red-600 hover:bg-red-700 text-white" onClick={() => handleDelete(deleteId)}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
