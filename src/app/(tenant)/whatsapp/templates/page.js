"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  FileText, Plus, RefreshCw, CheckCircle2, Clock, XCircle, Eye,
  Copy, Trash2, MessageCircle, Send, Search, Loader2,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  AlertTriangle, Globe,
} from "lucide-react";
import { toast } from "sonner";
import { useWaAccounts } from "../wa-accounts-context";
import { whatsappTemplatesApi } from "@/lib/api/whatsapp";
import { isApiMode } from "@/lib/api/client";

// ─── Data ─────────────────────────────────────────────────────────────────────

const INIT_TEMPLATES = [
  {
    id: "t1", name: "diwali_offer_v2", displayName: "Diwali Interior Offer", category: "MARKETING",
    language: "en", status: "APPROVED", source: "meta",
    body: "Hi {{1}}! 🪔 This Diwali, transform your home with our exclusive interior packages starting at ₹8L. Book a FREE site visit today and get 10% off! Reply YES to schedule. — {{2}} Team",
    header: "🎉 Diwali Special Offer", footer: "Reply STOP to unsubscribe",
    variables: ["customer_name", "company_name"], usedIn: 3, createdAt: "12 Jan 2025",
  },
  {
    id: "t2", name: "site_visit_reminder", displayName: "Site Visit Reminder", category: "UTILITY",
    language: "en", status: "APPROVED", source: "meta",
    body: "Hi {{1}}, this is a reminder that your site visit is scheduled for *{{2}}* at {{3}}. Our designer {{4}} will be there. Please confirm by replying YES. See you soon! 🏠",
    header: null, footer: "SmoothSales CRM",
    variables: ["customer_name", "visit_date", "visit_time", "designer_name"], usedIn: 2, createdAt: "10 Jan 2025",
  },
  {
    id: "t3", name: "follow_up_generic", displayName: "Generic Follow-up", category: "UTILITY",
    language: "en", status: "APPROVED", source: "meta",
    body: "Hi {{1}}! 👋 We noticed you enquired about our interior design services. We'd love to help you create your dream space. Can we schedule a quick call? Reply YES or call us at {{2}}.",
    header: null, footer: null,
    variables: ["customer_name", "phone_number"], usedIn: 5, createdAt: "08 Jan 2025",
  },
  {
    id: "t4", name: "quotation_ready", displayName: "Quotation Ready", category: "UTILITY",
    language: "en", status: "PENDING", source: "meta",
    body: "Hi {{1}}, your customized interior design quotation is ready! 📋 Total estimated value: *{{2}}*. Please review and let us know if you'd like to proceed. Our team is available for any queries.",
    header: "Your Quotation is Ready", footer: null,
    variables: ["customer_name", "quote_amount"], usedIn: 0, createdAt: "05 Jan 2025",
  },
  {
    id: "t5", name: "new_year_followup", displayName: "New Year Follow-up", category: "MARKETING",
    language: "en", status: "APPROVED", source: "meta",
    body: "Happy New Year {{1}}! 🎊 Start 2025 with a beautiful new home. Our New Year special offers are live — up to 15% off on modular kitchens and wardrobes. Interested? Reply YES!",
    header: "🎉 Happy New Year!", footer: "Reply STOP to opt out",
    variables: ["customer_name"], usedIn: 1, createdAt: "01 Jan 2025",
  },
  {
    id: "t6", name: "budget_confirmation", displayName: "Budget Confirmation", category: "UTILITY",
    language: "en", status: "DRAFT", source: "local",
    body: "Hi {{1}}, thanks for sharing your budget of {{2}}. We have great options in this range. Can we schedule a consultation this week?",
    header: null, footer: null,
    variables: ["customer_name", "budget"], usedIn: 0, createdAt: "28 Dec 2024",
  },
  {
    id: "t7", name: "deal_won_congrats", displayName: "Deal Won Congratulations", category: "UTILITY",
    language: "en", status: "APPROVED", source: "meta",
    body: "Congratulations {{1}}! 🎉 We're thrilled to start working on your dream home. Our project manager {{2}} will contact you within 24 hours to kick things off!",
    header: "Welcome to the Family!", footer: "SmoothSales CRM",
    variables: ["customer_name", "pm_name"], usedIn: 4, createdAt: "20 Dec 2024",
  },
  {
    id: "t8", name: "otp_verification", displayName: "OTP Verification", category: "AUTHENTICATION",
    language: "en", status: "APPROVED", source: "meta",
    body: "Your verification code for SmoothSales is *{{1}}*. This code expires in 10 minutes. Do not share this code with anyone.",
    header: null, footer: null,
    variables: ["otp_code"], usedIn: 0, createdAt: "15 Dec 2024",
  },
  {
    id: "t9", name: "re_engagement_cold", displayName: "Re-engagement (Cold Lead)", category: "MARKETING",
    language: "en", status: "REJECTED", source: "meta",
    body: "Hi {{1}}! It's been a while 😊 We have exciting new designs and offers. Would you like to revisit your interior design plans? Reply YES for a free consultation!",
    header: null, footer: "Reply STOP to unsubscribe",
    variables: ["customer_name"], usedIn: 0, createdAt: "10 Dec 2024",
  },
  {
    id: "t10", name: "payment_reminder", displayName: "Payment Reminder", category: "UTILITY",
    language: "en", status: "PENDING", source: "meta",
    body: "Hi {{1}}, this is a friendly reminder that your payment of *₹{{2}}* is due on {{3}}. Please make the payment to avoid any delays in your project. Thank you!",
    header: "Payment Due Reminder", footer: "SmoothSales CRM",
    variables: ["customer_name", "amount", "due_date"], usedIn: 0, createdAt: "08 Dec 2024",
  },
  {
    id: "t11", name: "project_update", displayName: "Project Progress Update", category: "UTILITY",
    language: "en", status: "DRAFT", source: "local",
    body: "Hi {{1}}! Great news — your project is {{2}}% complete. Current phase: {{3}}. Expected completion: {{4}}. Feel free to reach out for any queries!",
    header: null, footer: null,
    variables: ["customer_name", "progress", "phase", "completion_date"], usedIn: 0, createdAt: "05 Dec 2024",
  },
  {
    id: "t12", name: "referral_request", displayName: "Referral Request", category: "MARKETING",
    language: "en", status: "APPROVED", source: "meta",
    body: "Hi {{1}}! We hope you're loving your new home 🏠 If you know anyone looking for interior design, refer them to us and earn ₹5,000 cashback! Share your referral code: {{2}}",
    header: "Earn with Referrals!", footer: "Reply STOP to unsubscribe",
    variables: ["customer_name", "referral_code"], usedIn: 2, createdAt: "01 Dec 2024",
  },
];

const STATUS_CFG = {
  APPROVED: { label: "Approved", cls: "bg-emerald-500/10 text-emerald-700 border-emerald-200 dark:border-emerald-800 dark:text-emerald-400", dot: "bg-emerald-500", Icon: CheckCircle2 },
  PENDING:  { label: "Pending",  cls: "bg-amber-500/10 text-amber-700 border-amber-200 dark:border-amber-800 dark:text-amber-400",   dot: "bg-amber-500",  Icon: Clock },
  REJECTED: { label: "Rejected", cls: "bg-red-500/10 text-red-700 border-red-200 dark:border-red-800 dark:text-red-400",             dot: "bg-red-500",    Icon: XCircle },
  DRAFT:    { label: "Draft",    cls: "bg-muted text-muted-foreground border-border",                                                  dot: "bg-muted-foreground/40", Icon: FileText },
};

const CAT_CFG = {
  MARKETING:      { cls: "bg-violet-500/10 text-violet-700 border-violet-200 dark:border-violet-800 dark:text-violet-400" },
  UTILITY:        { cls: "bg-blue-500/10 text-blue-700 border-blue-200 dark:border-blue-800 dark:text-blue-400" },
  AUTHENTICATION: { cls: "bg-orange-500/10 text-orange-700 border-orange-200 dark:border-orange-800 dark:text-orange-400" },
};

const CATEGORIES = ["MARKETING", "UTILITY", "AUTHENTICATION"];
const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];
const BLANK_FORM = { displayName: "", category: "MARKETING", language: "en", header: "", body: "", footer: "" };

// ─── View Modal ───────────────────────────────────────────────────────────────

function ViewModal({ tmpl, onClose }) {
  if (!tmpl) return null;
  const sc = STATUS_CFG[tmpl.status] || STATUS_CFG.DRAFT;
  const cc = CAT_CFG[tmpl.category] || CAT_CFG.UTILITY;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-xl p-0 overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
          <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
            <MessageCircle className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{tmpl.displayName}</p>
            <p className="text-[11px] text-muted-foreground font-mono truncate">{tmpl.name}</p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Badge variant="outline" className={`text-[10px] gap-1 ${sc.cls}`}>
              <sc.Icon className="h-2.5 w-2.5" />{sc.label}
            </Badge>
            <Badge variant="outline" className={`text-[10px] ${cc.cls}`}>{tmpl.category}</Badge>
          </div>
        </div>

        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* WhatsApp preview bubble */}
          <div className="rounded-xl bg-[#0b141a] p-4">
            <p className="text-[9px] font-semibold uppercase tracking-widest text-white/30 mb-3">WhatsApp Preview</p>
            <div className="bg-[#1f2c34] rounded-xl rounded-tl-sm p-3 max-w-[85%] shadow-sm">
              {tmpl.header && (
                <p className="text-[11px] font-bold text-white mb-2 pb-2 border-b border-white/10">{tmpl.header}</p>
              )}
              <p className="text-[11px] text-white/90 leading-relaxed whitespace-pre-wrap">
                {tmpl.body.replace(/\*([^*]+)\*/g, "$1")}
              </p>
              {tmpl.footer && (
                <p className="text-[10px] text-white/40 mt-2 pt-2 border-t border-white/10">{tmpl.footer}</p>
              )}
              <p className="text-[9px] text-white/30 text-right mt-1.5">9:41 AM ✓✓</p>
            </div>
          </div>

          {/* Details grid */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-2.5">
            {[
              { label: "Template Name", value: tmpl.name, mono: true },
              { label: "Category",      value: tmpl.category },
              { label: "Language",      value: tmpl.language.toUpperCase() },
              { label: "Source",        value: tmpl.source === "meta" ? "Meta Synced" : "Local Draft" },
              { label: "Created",       value: tmpl.createdAt },
              { label: "Used In",       value: tmpl.usedIn > 0 ? `${tmpl.usedIn} campaign${tmpl.usedIn > 1 ? "s" : ""}` : "Not used yet" },
            ].map((row) => (
              <div key={row.label}>
                <p className="text-[10px] text-muted-foreground mb-0.5">{row.label}</p>
                <p className={`text-[11px] font-semibold text-foreground ${row.mono ? "font-mono" : ""}`}>{row.value}</p>
              </div>
            ))}
          </div>

          {/* Variables */}
          {tmpl.variables.length > 0 && (
            <div>
              <p className="text-[10px] text-muted-foreground mb-1.5">Variables ({tmpl.variables.length})</p>
              <div className="flex flex-wrap gap-1.5">
                {tmpl.variables.map((v, i) => (
                  <span key={v} className="inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg bg-muted border border-border font-mono text-muted-foreground">
                    <span className="text-emerald-600">{`{{${i + 1}}}`}</span>
                    <span className="opacity-40">→</span>
                    <span>{v}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 pt-1">
            <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5 flex-1"
              onClick={() => { navigator.clipboard.writeText(tmpl.body); toast.success("Body copied!"); }}>
              <Copy className="h-3.5 w-3.5" />Copy Body
            </Button>
            {tmpl.status === "DRAFT" && (
              <Button size="sm" className="h-8 text-xs gap-1.5 flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => { toast.success("Submitted to Meta"); onClose(); }}>
                <Send className="h-3.5 w-3.5" />Submit to Meta
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function WhatsAppTemplatesPage() {
  const { accounts } = useWaAccounts();
  const metaAccounts = accounts.filter((a) => a.type === "meta");
  const onlyPersonal = accounts.length > 0 && metaAccounts.length === 0;

  const [templates, setTemplates] = useState(INIT_TEMPLATES);
  const [isSyncing, setIsSyncing]   = useState(false);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [viewTmpl, setViewTmpl]     = useState(null);
  const [deleteId, setDeleteId]     = useState(null);
  const [search, setSearch]         = useState("");
  const [catFilter, setCatFilter]   = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage]             = useState(1);
  const [pageSize, setPageSize]     = useState(10);
  const [form, setForm]             = useState({ ...BLANK_FORM });

  // Load from API on mount
  useEffect(() => {
    if (!isApiMode()) return;
    setIsLoadingTemplates(true);
    whatsappTemplatesApi.getAll()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setTemplates(data.map((t) => ({
            id: t.id,
            name: t.templateName || t.name || "",
            displayName: t.displayName || t.templateName || "",
            category: t.category || "UTILITY",
            language: t.language || "en",
            status: t.status || "DRAFT",
            source: t.source || "meta",
            body: t.bodyText || t.body || "",
            header: t.headerText || t.header || null,
            footer: t.footerText || t.footer || null,
            variables: t.variables || [],
            usedIn: t.usedIn || 0,
            createdAt: t.createdAt ? new Date(t.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "",
          })));
        }
      })
      .catch(() => {})
      .finally(() => setIsLoadingTemplates(false));
  }, []);

  const filtered = useMemo(() => {
    return templates.filter((t) => {
      const q = search.toLowerCase();
      const matchSearch = !q || t.displayName.toLowerCase().includes(q) || t.name.toLowerCase().includes(q);
      const matchCat    = catFilter === "all" || t.category === catFilter;
      const matchStatus = statusFilter === "all" || t.status === statusFilter;
      return matchSearch && matchCat && matchStatus;
    });
  }, [templates, search, catFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage   = Math.min(page, totalPages);
  const pageItems  = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  React.useEffect(() => { setPage(1); }, [search, catFilter, statusFilter, pageSize]);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      if (isApiMode()) {
        await whatsappTemplatesApi.syncAll();
        const data = await whatsappTemplatesApi.getAll();
        if (Array.isArray(data) && data.length > 0) {
          setTemplates(data.map((t) => ({
            id: t.id,
            name: t.templateName || t.name || "",
            displayName: t.displayName || t.templateName || "",
            category: t.category || "UTILITY",
            language: t.language || "en",
            status: t.status || "DRAFT",
            source: t.source || "meta",
            body: t.bodyText || t.body || "",
            header: t.headerText || t.header || null,
            footer: t.footerText || t.footer || null,
            variables: t.variables || [],
            usedIn: t.usedIn || 0,
            createdAt: t.createdAt ? new Date(t.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "",
          })));
        }
      } else {
        await new Promise((r) => setTimeout(r, 1000));
      }
      toast.success("Templates synced from Meta Business Manager");
    } catch {
      toast.error("Sync failed — check your Meta credentials");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleCreate = async () => {
    if (!form.displayName.trim() || !form.body.trim()) return toast.error("Display name and body are required");
    const slug = form.displayName.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
    const vars = [...form.body.matchAll(/\{\{(\d+)\}\}/g)].map((m) => `var_${m[1]}`);
    if (isApiMode()) {
      try {
        const created = await whatsappTemplatesApi.create({
          templateName: slug,
          displayName: form.displayName,
          category: form.category,
          language: form.language || "en",
          headerText: form.header || null,
          bodyText: form.body,
          footerText: form.footer || null,
          saveDraft: true,
        });
        setTemplates((prev) => [{
          id: created.id,
          name: slug,
          displayName: form.displayName,
          category: form.category,
          language: form.language || "en",
          status: "DRAFT",
          source: "local",
          body: form.body,
          header: form.header || null,
          footer: form.footer || null,
          variables: vars,
          usedIn: 0,
          createdAt: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
        }, ...prev]);
      } catch {
        toast.error("Failed to create template");
        return;
      }
    } else {
      setTemplates((prev) => [{
        id: `t_${Date.now()}`, name: slug, ...form,
        status: "DRAFT", source: "local", variables: vars, usedIn: 0,
        createdAt: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
      }, ...prev]);
    }
    setForm({ ...BLANK_FORM });
    setCreateOpen(false);
    toast.success("Template created — submit to Meta for approval");
  };

  const handleDelete = async (id) => {
    if (isApiMode()) {
      try { await whatsappTemplatesApi.delete(id); } catch { toast.error("Delete failed"); return; }
    }
    setTemplates((prev) => prev.filter((t) => t.id !== id));
    setDeleteId(null);
    toast.success("Template deleted");
  };

  const handleSubmit = async (id) => {
    if (isApiMode()) {
      try { await whatsappTemplatesApi.submitDraft(id); } catch { toast.error("Submit failed"); return; }
    }
    setTemplates((prev) => prev.map((t) => t.id === id ? { ...t, status: "PENDING" } : t));
    toast.success("Submitted to Meta for approval");
  };

  const stats = {
    total:    templates.length,
    approved: templates.filter((t) => t.status === "APPROVED").length,
    pending:  templates.filter((t) => t.status === "PENDING").length,
    inUse:    templates.filter((t) => t.usedIn > 0).length,
  };

  return (
    <div className="flex flex-col h-full min-h-0 bg-background">

      {/* ── Top Bar ─────────────────────────────────────────────────────────── */}
      <div className="shrink-0 flex items-center justify-between gap-4 px-6 py-3 border-b border-border bg-card">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="h-8 w-8 rounded-lg bg-emerald-500 flex items-center justify-center shrink-0">
            <FileText className="h-4 w-4 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-bold text-foreground leading-tight">WhatsApp Templates</h1>
            <p className="text-[11px] text-muted-foreground">Manage Meta-approved message templates</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={handleSync} disabled={isSyncing}>
            <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? "animate-spin" : ""}`} />
            {isSyncing ? "Syncing..." : "Sync from Meta"}
          </Button>
          <Button size="sm" className="h-8 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setCreateOpen(true)}>
            <Plus className="h-3.5 w-3.5" />New Template
          </Button>
        </div>
      </div>

      {/* Personal WA restriction banner */}
      {onlyPersonal && (
        <div className="shrink-0 flex items-center gap-2.5 px-6 py-2.5 bg-amber-500/10 border-b border-amber-500/20">
          <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
          <p className="text-xs text-amber-700 font-medium">
            Templates only work with <span className="font-bold">Meta Cloud API</span> accounts. Personal WhatsApp does not support message templates.
            <a href="/whatsapp/connect" className="ml-2 underline font-semibold">Connect Meta API →</a>
          </p>
        </div>
      )}

      {/* ── KPI Strip ───────────────────────────────────────────────────────── */}
      <div className="shrink-0 grid grid-cols-4 border-b border-border bg-card/50">
        {[
          { label: "Total",    value: stats.total,    color: "text-foreground",  dot: "bg-muted-foreground/50" },
          { label: "Approved", value: stats.approved, color: "text-emerald-600", dot: "bg-emerald-500" },
          { label: "Pending",  value: stats.pending,  color: "text-amber-600",   dot: "bg-amber-500" },
          { label: "In Use",   value: stats.inUse,    color: "text-violet-600",  dot: "bg-violet-500" },
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

      {/* ── Toolbar ─────────────────────────────────────────────────────────── */}
      <div className="shrink-0 flex items-center gap-2.5 px-6 py-2.5 border-b border-border bg-card/30 flex-wrap">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search templates..." className="pl-8 h-8 text-xs w-48 bg-background" />
        </div>

        <div className="flex items-center gap-0.5 bg-muted/50 p-0.5 rounded-lg border border-border">
          {["all", ...CATEGORIES].map((c) => (
            <button key={c} onClick={() => setCatFilter(c)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${catFilter === c ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
              {c === "all" ? "All" : c.charAt(0) + c.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-0.5 bg-muted/50 p-0.5 rounded-lg border border-border">
          {["all", "APPROVED", "PENDING", "DRAFT", "REJECTED"].map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${statusFilter === s ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
              {s === "all" ? "All Status" : s.charAt(0) + s.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        <span className="ml-auto text-[11px] text-muted-foreground">{filtered.length} result{filtered.length !== 1 ? "s" : ""}</span>
      </div>

      {/* ── Table ───────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-xs border-collapse">
          <thead className="sticky top-0 z-10 bg-muted/70 backdrop-blur-sm border-b border-border">
            <tr>
              {["#", "Template", "Category", "Status", "Variables", "Used In", "Created", "Actions"].map((h, i) => (
                <th key={h} className={`px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap ${i === 0 ? "w-10" : ""} ${h === "Actions" ? "text-right" : ""}`}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {pageItems.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-16 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <FileText className="h-7 w-7 opacity-25" />
                    <p className="text-sm font-medium">No templates found</p>
                    <p className="text-xs opacity-60">Try adjusting your search or filters</p>
                  </div>
                </td>
              </tr>
            )}
            {pageItems.map((tmpl, idx) => {
              const sc = STATUS_CFG[tmpl.status] || STATUS_CFG.DRAFT;
              const cc = CAT_CFG[tmpl.category] || CAT_CFG.UTILITY;
              const globalIdx = (safePage - 1) * pageSize + idx + 1;
              return (
                <tr key={tmpl.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 text-muted-foreground font-mono text-[11px] w-10">{globalIdx}</td>

                  <td className="px-4 py-3 min-w-[200px] max-w-[260px]">
                    <div className="flex items-center gap-2.5">
                      <div className="h-7 w-7 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                        <MessageCircle className="h-3.5 w-3.5 text-emerald-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-foreground truncate text-[12px]">{tmpl.displayName}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <p className="text-[10px] text-muted-foreground font-mono truncate">{tmpl.name}</p>
                          {tmpl.source === "meta" && (
                            <span className="shrink-0 text-[9px] font-semibold text-blue-600 bg-blue-500/10 border border-blue-500/20 px-1.5 py-0.5 rounded-full">Meta</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-3 whitespace-nowrap">
                    <Badge variant="outline" className={`text-[10px] font-medium ${cc.cls}`}>
                      {tmpl.category}
                    </Badge>
                  </td>

                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1.5 text-[10px] font-medium px-2 py-1 rounded-full border ${sc.cls}`}>
                      <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${sc.dot}`} />
                      {sc.label}
                    </span>
                  </td>

                  <td className="px-4 py-3">
                    {tmpl.variables.length > 0 ? (
                      <div className="flex items-center gap-1">
                        {tmpl.variables.slice(0, 2).map((v, i) => (
                          <span key={v} className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-muted border border-border text-muted-foreground">{`{{${i + 1}}}`}</span>
                        ))}
                        {tmpl.variables.length > 2 && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-muted border border-border text-muted-foreground">+{tmpl.variables.length - 2}</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-[10px] text-muted-foreground">—</span>
                    )}
                  </td>

                  <td className="px-4 py-3 whitespace-nowrap">
                    {tmpl.usedIn > 0 ? (
                      <span className="text-[11px] font-medium text-foreground">{tmpl.usedIn} campaign{tmpl.usedIn > 1 ? "s" : ""}</span>
                    ) : (
                      <span className="text-[10px] text-muted-foreground">—</span>
                    )}
                  </td>

                  <td className="px-4 py-3 whitespace-nowrap text-[11px] text-muted-foreground">{tmpl.createdAt}</td>

                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center justify-end gap-0.5">
                      <button onClick={() => setViewTmpl(tmpl)}
                        className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors" title="View">
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => { navigator.clipboard.writeText(tmpl.body); toast.success("Body copied!"); }}
                        className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors" title="Copy body">
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                      {tmpl.status === "DRAFT" && (
                        <button onClick={() => handleSubmit(tmpl.id)}
                          className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-emerald-600 hover:bg-emerald-500/10 transition-colors" title="Submit to Meta">
                          <Send className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <button onClick={() => setDeleteId(tmpl.id)}
                        className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors" title="Delete">
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

      {/* ── Pagination ──────────────────────────────────────────────────────── */}
      <div className="shrink-0 flex items-center justify-between gap-3 px-6 py-2.5 border-t border-border bg-card">
        <div className="flex items-center gap-2.5">
          <span className="text-[11px] text-muted-foreground whitespace-nowrap">Rows</span>
          <Select value={String(pageSize)} onValueChange={(v) => setPageSize(Number(v))}>
            <SelectTrigger className="h-7 w-14 text-xs border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZE_OPTIONS.map((n) => (
                <SelectItem key={n} value={String(n)} className="text-xs">{n}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-[11px] text-muted-foreground">
            {filtered.length === 0 ? "0 results" : `${(safePage - 1) * pageSize + 1}–${Math.min(safePage * pageSize, filtered.length)} of ${filtered.length}`}
          </span>
        </div>

        <div className="flex items-center gap-0.5">
          <button onClick={() => setPage(1)} disabled={safePage === 1}
            className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
            <ChevronsLeft className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={safePage === 1}
            className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>

          <div className="flex items-center gap-0.5 mx-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
              .reduce((acc, p, i, arr) => {
                if (i > 0 && p - arr[i - 1] > 1) acc.push("...");
                acc.push(p);
                return acc;
              }, [])
              .map((p, i) =>
                p === "..." ? (
                  <span key={`e-${i}`} className="text-[11px] text-muted-foreground px-1">…</span>
                ) : (
                  <button key={p} onClick={() => setPage(p)}
                    className={`h-7 min-w-[28px] px-2 rounded-md text-[11px] font-medium transition-colors ${safePage === p ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}>
                    {p}
                  </button>
                )
              )}
          </div>

          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}
            className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => setPage(totalPages)} disabled={safePage === totalPages}
            className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
            <ChevronsRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* ── View Modal ──────────────────────────────────────────────────────── */}
      <ViewModal tmpl={viewTmpl} onClose={() => setViewTmpl(null)} />

      {/* ── Delete Confirm ───────────────────────────────────────────────────── */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-red-500/10 flex items-center justify-center">
                <Trash2 className="h-3.5 w-3.5 text-red-500" />
              </div>
              Delete Template
            </DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-3">
            <p className="text-xs text-muted-foreground">
              Are you sure you want to delete <span className="font-semibold text-foreground">{templates.find((t) => t.id === deleteId)?.displayName}</span>? This cannot be undone.
            </p>
            <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/5 border border-red-500/20 text-[11px] text-red-600 dark:text-red-400">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <span>Active campaigns using this template will stop working.</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" className="text-xs" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button size="sm" className="text-xs bg-red-600 hover:bg-red-700 text-white" onClick={() => handleDelete(deleteId)}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Create Template ──────────────────────────────────────────────────── */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-emerald-500 flex items-center justify-center">
                <Plus className="h-3.5 w-3.5 text-white" />
              </div>
              Create WhatsApp Template
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-1 max-h-[60vh] overflow-y-auto pr-1">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Display Name <span className="text-red-500">*</span></Label>
                <Input value={form.displayName} onChange={(e) => setForm((p) => ({ ...p, displayName: e.target.value }))} placeholder="e.g. Site Visit Reminder" className="h-8 text-xs" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm((p) => ({ ...p, category: v }))}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Header <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Input value={form.header} onChange={(e) => setForm((p) => ({ ...p, header: e.target.value }))} placeholder="e.g. Your Quotation is Ready" className="h-8 text-xs" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Message Body <span className="text-red-500">*</span> <span className="text-muted-foreground font-normal">— use {`{{1}}`}, {`{{2}}`} for variables</span></Label>
              <Textarea value={form.body} onChange={(e) => setForm((p) => ({ ...p, body: e.target.value }))} placeholder={`Hi {{1}}, your site visit is confirmed for {{2}}...`} className="text-xs min-h-[90px] resize-none" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Footer <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Input value={form.footer} onChange={(e) => setForm((p) => ({ ...p, footer: e.target.value }))} placeholder="e.g. Reply STOP to unsubscribe" className="h-8 text-xs" />
            </div>
            <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20 text-[11px] text-amber-700 dark:text-amber-400">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <span>Templates must be submitted to Meta for approval before use. Approval takes 24–48 hours.</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" className="text-xs" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button size="sm" className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleCreate}>Create Template</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
