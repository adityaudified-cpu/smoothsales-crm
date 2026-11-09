"use client";

import React, { useState, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  Zap, Plus, Bot, MessageCircle, Clock, GitBranch, Trash2, Play, Pause,
  ArrowDown, CheckCircle2, X, Edit2, Copy, Search, BarChart2, ChevronUp,
  ChevronDown, RefreshCw, Settings2, FlaskConical, Users, TrendingUp,
  ArrowRight, Webhook, Activity, Layers, MousePointerClick, Globe, Smartphone, AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { useWaAccounts, CHANNEL_BADGE } from "../wa-accounts-context";

// ─── Static Data ──────────────────────────────────────────────────────────────

const TRIGGERS = [
  { id: "lead_created",       label: "New Lead Created",       bg: "bg-blue-500",    hex: "#3b82f6", Icon: Users },
  { id: "visit_scheduled",    label: "Visit Scheduled",        bg: "bg-violet-500",  hex: "#8b5cf6", Icon: Activity },
  { id: "quotation_sent",     label: "Quotation Sent",         bg: "bg-amber-500",   hex: "#f59e0b", Icon: Layers },
  { id: "lead_inactive_30d",  label: "Lead Inactive 30d",      bg: "bg-red-500",     hex: "#ef4444", Icon: Clock },
  { id: "deal_won",           label: "Deal Won",               bg: "bg-emerald-500", hex: "#10b981", Icon: CheckCircle2 },
  { id: "campaign_reply",     label: "Campaign Reply",         bg: "bg-cyan-500",    hex: "#06b6d4", Icon: MessageCircle },
  { id: "keyword_received",   label: "Keyword Received",       bg: "bg-pink-500",    hex: "#ec4899", Icon: MousePointerClick },
  { id: "deal_stage_changed", label: "Deal Stage Changed",     bg: "bg-indigo-500",  hex: "#6366f1", Icon: GitBranch },
  { id: "webhook",            label: "Webhook Trigger",        bg: "bg-orange-500",  hex: "#f97316", Icon: Webhook },
];

const TEMPLATES = [
  { id: "t1", name: "welcome_message",    display: "Welcome Message",    body: "Hi {{1}}! Welcome to {{2}}. Reply YES to schedule a free site visit!", vars: ["customer_name","company_name"] },
  { id: "t2", name: "site_visit_reminder",display: "Site Visit Reminder",body: "Hi {{1}}, your site visit is on {{2}} at {{3}}. Reply YES to confirm.", vars: ["customer_name","visit_date","visit_time"] },
  { id: "t3", name: "follow_up_generic",  display: "Generic Follow-up",  body: "Hi {{1}}! Following up on your enquiry. Reply YES or call {{2}}.",    vars: ["customer_name","phone_number"] },
  { id: "t4", name: "quotation_ready",    display: "Quotation Ready",    body: "Hi {{1}}, your quotation is ready! Estimated value: {{2}}.",           vars: ["customer_name","quote_amount"] },
  { id: "t5", name: "new_year_followup",  display: "New Year Follow-up", body: "Happy New Year {{1}}! Up to 15% off this month. Reply YES!",           vars: ["customer_name"] },
  { id: "t6", name: "diwali_offer_v2",    display: "Diwali Offer",       body: "Hi {{1}}! Packages from ₹8L. Book a FREE site visit — reply YES!",     vars: ["customer_name"] },
];

const LEAD_FIELDS = [
  { id: "lead.name",        label: "Lead Name" },
  { id: "lead.phone",       label: "Phone Number" },
  { id: "lead.email",       label: "Email" },
  { id: "lead.source",      label: "Lead Source" },
  { id: "lead.assigned_to", label: "Assigned Agent" },
  { id: "lead.visit_date",  label: "Visit Date" },
  { id: "lead.visit_time",  label: "Visit Time" },
  { id: "lead.quote_amount",label: "Quote Amount" },
  { id: "company.name",     label: "Company Name" },
  { id: "company.phone",    label: "Company Phone" },
];

const DELAY_UNITS = [
  { id: "minutes", label: "Minutes" },
  { id: "hours",   label: "Hours" },
  { id: "days",    label: "Days" },
  { id: "weeks",   label: "Weeks" },
];

const CONDITIONS = [
  { id: "replied",        label: "Did they reply?" },
  { id: "clicked_link",   label: "Did they click the link?" },
  { id: "status_hot",     label: "Is lead status = Hot?" },
  { id: "visit_scheduled",label: "Is visit scheduled?" },
  { id: "quote_sent",     label: "Was quotation sent?" },
  { id: "keyword_yes",    label: "Replied with YES?" },
];

const NODE_TYPES = [
  { id: "send_template", label: "Send Template",  Icon: MessageCircle, hex: "#10b981", light: "rgba(16,185,129,0.07)",  border: "rgba(16,185,129,0.22)" },
  { id: "wait",          label: "Wait / Delay",   Icon: Clock,         hex: "#f59e0b", light: "rgba(245,158,11,0.07)",  border: "rgba(245,158,11,0.22)" },
  { id: "condition",     label: "Condition",      Icon: GitBranch,     hex: "#3b82f6", light: "rgba(59,130,246,0.07)",  border: "rgba(59,130,246,0.22)" },
  { id: "ai_reply",      label: "AI Auto-Reply",  Icon: Bot,           hex: "#8b5cf6", light: "rgba(139,92,246,0.07)",  border: "rgba(139,92,246,0.22)" },
  { id: "end",           label: "End Flow",       Icon: CheckCircle2,  hex: "#6b7280", light: "rgba(107,114,128,0.05)", border: "rgba(107,114,128,0.18)" },
];

const MOCK_FLOWS = [
  {
    id: "f1", name: "New Lead Welcome Flow", active: true,
    trigger: "lead_created", triggerLabel: "New Lead Created", triggerBg: "bg-blue-500",
    leadsProcessed: 842, lastRun: "2 min ago", lastEdited: "Today",
    stats: { sent: 842, delivered: 801, replied: 312, converted: 89 },
    reenrollAfterDays: 0,
    steps: [
      { id: "s1", type: "send_template", label: "Send Welcome Message",  templateId: "t1", varMap: { "1": "lead.name", "2": "company.name" },  delayValue: "", delayUnit: "hours" },
      { id: "s2", type: "wait",          label: "Wait 24 Hours",         delayValue: "24", delayUnit: "hours" },
      { id: "s3", type: "condition",     label: "Did they reply?",       conditionId: "replied" },
      { id: "s4", type: "send_template", label: "Send Follow-up",        templateId: "t3", varMap: { "1": "lead.name", "2": "company.phone" }, delayValue: "", delayUnit: "hours" },
      { id: "s5", type: "end",           label: "End Flow" },
    ],
  },
  {
    id: "f2", name: "Site Visit Confirmation", active: true,
    trigger: "visit_scheduled", triggerLabel: "Visit Scheduled", triggerBg: "bg-violet-500",
    leadsProcessed: 234, lastRun: "1 hour ago", lastEdited: "Yesterday",
    stats: { sent: 234, delivered: 228, replied: 198, converted: 54 },
    reenrollAfterDays: 0,
    steps: [
      { id: "s1", type: "send_template", label: "Send Confirmation", templateId: "t2", varMap: { "1": "lead.name", "2": "lead.visit_date", "3": "lead.visit_time" }, delayValue: "", delayUnit: "hours" },
      { id: "s2", type: "wait",          label: "Wait 2 Hours",      delayValue: "2", delayUnit: "hours" },
      { id: "s3", type: "send_template", label: "Send Reminder",     templateId: "t2", varMap: {}, delayValue: "", delayUnit: "hours" },
      { id: "s4", type: "end",           label: "End Flow" },
    ],
  },
  {
    id: "f3", name: "Quotation Follow-up", active: false,
    trigger: "quotation_sent", triggerLabel: "Quotation Sent", triggerBg: "bg-amber-500",
    leadsProcessed: 156, lastRun: "3 days ago", lastEdited: "3 days ago",
    stats: { sent: 156, delivered: 149, replied: 67, converted: 23 },
    reenrollAfterDays: 7,
    steps: [
      { id: "s1", type: "send_template", label: "Quotation Notification", templateId: "t4", varMap: { "1": "lead.name", "2": "lead.quote_amount" }, delayValue: "", delayUnit: "hours" },
      { id: "s2", type: "wait",          label: "Wait 48 Hours",          delayValue: "48", delayUnit: "hours" },
      { id: "s3", type: "condition",     label: "If No Reply",            conditionId: "replied" },
      { id: "s4", type: "send_template", label: "Send Reminder",          templateId: "t3", varMap: { "1": "lead.name", "2": "company.phone" }, delayValue: "", delayUnit: "hours" },
      { id: "s5", type: "end",           label: "End Flow" },
    ],
  },
];

const BLANK = { type: "send_template", label: "", templateId: "", varMap: {}, delayValue: "", delayUnit: "hours", conditionId: "" };

// ─── Canvas Node ──────────────────────────────────────────────────────────────

function CanvasNode({ step, index, isLast, onDelete, onEdit, onMoveUp, onMoveDown, canMoveUp, canMoveDown, onAddAfter }) {
  const nt = NODE_TYPES.find((t) => t.id === step.type) || NODE_TYPES[0];
  const { Icon } = nt;
  const tmpl = step.templateId ? TEMPLATES.find((t) => t.id === step.templateId) : null;
  const cond = step.conditionId ? CONDITIONS.find((c) => c.id === step.conditionId) : null;
  const isEnd = step.type === "end";

  return (
    <div className="flex flex-col items-center w-full">
      {/* Node */}
      <div className="relative w-full max-w-[500px] group">
        {/* Step number */}
        {!isEnd && (
          <div className="absolute -left-7 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full bg-background border border-border flex items-center justify-center z-10 shadow-sm">
            <span className="text-[9px] font-bold text-muted-foreground">{index + 1}</span>
          </div>
        )}

        <div
          className="rounded-2xl border-2 transition-all duration-150 hover:shadow-lg"
          style={{ background: nt.light, borderColor: nt.border }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: nt.border }}>
            <div className="h-8 w-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: nt.hex }}>
              <Icon className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: nt.hex }}>{nt.label}</p>
              <p className="text-sm font-semibold text-foreground truncate leading-tight mt-0.5">{step.label || "Untitled Step"}</p>
            </div>
            {!isEnd && (
              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                <button onClick={() => onEdit(step)} className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-background/80 transition-colors" title="Edit"><Edit2 className="h-3.5 w-3.5" /></button>
                <button onClick={() => onMoveUp(index)} disabled={!canMoveUp} className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-background/80 transition-colors disabled:opacity-20" title="Move up"><ChevronUp className="h-3.5 w-3.5" /></button>
                <button onClick={() => onMoveDown(index)} disabled={!canMoveDown} className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-background/80 transition-colors disabled:opacity-20" title="Move down"><ChevronDown className="h-3.5 w-3.5" /></button>
                <button onClick={() => onDelete(step.id)} className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors" title="Delete"><X className="h-3.5 w-3.5" /></button>
              </div>
            )}
          </div>

          {/* Body */}
          <div className="px-4 py-3 space-y-2.5">
            {step.type === "send_template" && tmpl && (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground font-medium">Template:</span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-background border border-border" style={{ color: nt.hex }}>{tmpl.name}</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2 bg-background/70 rounded-xl px-3 py-2 border border-border/50">{tmpl.body}</p>
                {step.varMap && Object.keys(step.varMap).length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(step.varMap).map(([k, v]) => (
                      <span key={k} className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-background border border-border font-mono text-muted-foreground">
                        <span style={{ color: nt.hex }}>{`{{${k}}}`}</span>
                        <ArrowRight className="h-2.5 w-2.5 opacity-50" />
                        <span>{LEAD_FIELDS.find((f) => f.id === v)?.label || v}</span>
                      </span>
                    ))}
                  </div>
                )}
              </>
            )}
            {step.type === "wait" && step.delayValue && (
              <div className="flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 shrink-0" style={{ color: nt.hex }} />
                <span className="text-xs font-bold text-foreground">{step.delayValue} {step.delayUnit}</span>
                <span className="text-[10px] text-muted-foreground">delay before next step</span>
              </div>
            )}
            {step.type === "condition" && (
              <div className="space-y-2">
                {cond && <p className="text-[11px] text-muted-foreground">{cond.label}</p>}
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                    <CheckCircle2 className="h-3 w-3 text-emerald-600 shrink-0" />
                    <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">YES → Continue</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-red-500/10 border border-red-500/20">
                    <X className="h-3 w-3 text-red-500 shrink-0" />
                    <span className="text-[10px] font-semibold text-red-600 dark:text-red-400">NO → End / Skip</span>
                  </div>
                </div>
              </div>
            )}
            {step.type === "ai_reply" && (
              <div className="flex items-center gap-2">
                <Bot className="h-3.5 w-3.5 shrink-0" style={{ color: nt.hex }} />
                <span className="text-[11px] text-muted-foreground">AI generates contextual reply from conversation history</span>
              </div>
            )}
            {step.type === "end" && (
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="text-[11px] text-muted-foreground">Flow execution complete</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Connector + inline add button */}
      {!isLast && (
        <div className="flex flex-col items-center my-0.5 group/conn relative">
          <div className="w-px h-5 bg-border" />
          <button
            onClick={onAddAfter}
            className="h-6 w-6 rounded-full border-2 border-dashed border-border bg-background flex items-center justify-center text-muted-foreground hover:border-primary hover:text-primary hover:bg-primary/5 transition-all opacity-0 group-hover/conn:opacity-100 focus:opacity-100 z-10"
            title="Add step here"
          >
            <Plus className="h-3 w-3" />
          </button>
          <div className="w-px h-5 bg-border" />
          <ArrowDown className="h-3.5 w-3.5 text-muted-foreground -mt-1" />
        </div>
      )}
    </div>
  );
}

// ─── Step Config Dialog ───────────────────────────────────────────────────────

function StepDialog({ open, onOpenChange, initial, onSave, mode }) {
  const { accounts = [] } = useWaAccounts();
  const metaAccounts = (accounts || []).filter((a) => a.type === "meta");
  const personalAccounts = (accounts || []).filter((a) => a.type === "personal");
  const [step, setStep] = useState({ ...BLANK });
  React.useEffect(() => { if (open) setStep({ ...initial }); }, [open]);

  const tmpl = step.templateId ? TEMPLATES.find((t) => t.id === step.templateId) : null;

  const setType = (type) => setStep({ ...BLANK, type, id: step.id });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="text-sm font-bold flex items-center gap-2">
            {mode === "add"
              ? <><div className="h-6 w-6 rounded-lg bg-blue-500 flex items-center justify-center"><Plus className="h-3.5 w-3.5 text-white" /></div>Add Step</>
              : <><div className="h-6 w-6 rounded-lg bg-amber-500 flex items-center justify-center"><Edit2 className="h-3.5 w-3.5 text-white" /></div>Edit Step</>
            }
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-1 max-h-[62vh] overflow-y-auto pr-1">
          {/* Type Picker */}
          <div className="space-y-2">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Step Type</Label>
            <div className="grid grid-cols-2 gap-2">
              {NODE_TYPES.filter((t) => t.id !== "end").map((t) => {
                const { Icon } = t;
                const active = step.type === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setType(t.id)}
                    className="flex items-center gap-2.5 p-3 rounded-xl border-2 text-left transition-all"
                    style={{ borderColor: active ? t.hex : "hsl(var(--border))", background: active ? t.light : "transparent" }}
                  >
                    <div className="h-7 w-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: active ? t.hex : "hsl(var(--muted))" }}>
                      <Icon className="h-3.5 w-3.5" style={{ color: active ? "white" : "hsl(var(--muted-foreground))" }} />
                    </div>
                    <span className="text-xs font-semibold" style={{ color: active ? t.hex : "hsl(var(--muted-foreground))" }}>{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Send Template */}
          {step.type === "send_template" && (
            <div className="space-y-3">
              {personalAccounts.length > 0 && metaAccounts.length === 0 && (
                <div className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-[10.5px] text-amber-700">Templates only work with Meta Cloud API accounts. Personal WA cannot send templates.</p>
                </div>
              )}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Template *</Label>
                <Select value={step.templateId} onValueChange={(v) => {
                  const t = TEMPLATES.find((x) => x.id === v);
                  setStep((p) => ({ ...p, templateId: v, label: t?.display || "", varMap: {} }));
                }}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Choose approved template" /></SelectTrigger>
                  <SelectContent>
                    {TEMPLATES.map((t) => (
                      <SelectItem key={t.id} value={t.id} className="text-xs">
                        <span className="font-semibold">{t.display}</span>
                        <span className="text-muted-foreground ml-1.5 font-mono text-[10px]">{t.name}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {tmpl && (
                <>
                  <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-[11px] text-foreground leading-relaxed">{tmpl.body}</div>
                  {tmpl.vars.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold">Variable Mapping</Label>
                      {tmpl.vars.map((_, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <span className="text-[10px] font-mono font-bold bg-muted px-2 py-1.5 rounded-lg border border-border w-14 text-center shrink-0 text-emerald-600">{`{{${i + 1}}}`}</span>
                          <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                          <Select value={step.varMap?.[String(i + 1)] || ""} onValueChange={(val) => setStep((p) => ({ ...p, varMap: { ...p.varMap, [String(i + 1)]: val } }))}>
                            <SelectTrigger className="h-8 text-xs flex-1"><SelectValue placeholder="Map to lead field" /></SelectTrigger>
                            <SelectContent>{LEAD_FIELDS.map((f) => <SelectItem key={f.id} value={f.id} className="text-xs">{f.label}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Wait */}
          {step.type === "wait" && (
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Delay Duration *</Label>
              <div className="flex gap-2">
                <Input type="number" min="1" value={step.delayValue}
                  onChange={(e) => setStep((p) => ({ ...p, delayValue: e.target.value, label: `Wait ${e.target.value} ${p.delayUnit}` }))}
                  placeholder="e.g. 24" className="h-9 text-xs w-28" />
                <Select value={step.delayUnit} onValueChange={(v) => setStep((p) => ({ ...p, delayUnit: v, label: `Wait ${p.delayValue} ${v}` }))}>
                  <SelectTrigger className="h-9 text-xs flex-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{DELAY_UNITS.map((u) => <SelectItem key={u.id} value={u.id} className="text-xs">{u.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Condition */}
          {step.type === "condition" && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Condition *</Label>
                <Select value={step.conditionId || ""} onValueChange={(v) => {
                  const c = CONDITIONS.find((x) => x.id === v);
                  setStep((p) => ({ ...p, conditionId: v, label: c?.label || v }));
                }}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Select condition" /></SelectTrigger>
                  <SelectContent>{CONDITIONS.map((c) => <SelectItem key={c.id} value={c.id} className="text-xs">{c.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-200 dark:border-emerald-900 text-[11px]">
                  <p className="font-bold text-emerald-700 dark:text-emerald-400 mb-1">YES branch</p>
                  <p className="text-muted-foreground">Continue to next step</p>
                </div>
                <div className="p-3 rounded-xl bg-red-500/5 border border-red-200 dark:border-red-900 text-[11px]">
                  <p className="font-bold text-red-600 dark:text-red-400 mb-1">NO branch</p>
                  <p className="text-muted-foreground">Skip to end</p>
                </div>
              </div>
            </div>
          )}

          {/* AI Reply */}
          {step.type === "ai_reply" && (
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Step Label</Label>
              <Input value={step.label} onChange={(e) => setStep((p) => ({ ...p, label: e.target.value }))} placeholder="e.g. AI Follow-up Reply" className="h-9 text-xs" />
              <p className="text-[11px] text-muted-foreground mt-1">AI generates a contextual reply based on conversation history and lead data.</p>
            </div>
          )}

          {/* Custom label override */}
          {step.type !== "ai_reply" && step.type !== "end" && (
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground">Custom Label <span className="font-normal">(optional)</span></Label>
              <Input value={step.label} onChange={(e) => setStep((p) => ({ ...p, label: e.target.value }))} placeholder="Override step label..." className="h-8 text-xs" />
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 pt-2">
          <Button variant="outline" size="sm" className="text-xs" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button size="sm" className="text-xs text-white" style={{ background: mode === "add" ? "#3b82f6" : "#f59e0b" }} onClick={() => onSave(step)}>
            {mode === "add" ? "Add Step" : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function WhatsAppAutomationPage() {
  const { accounts } = useWaAccounts();
  const metaAccounts = accounts.filter((a) => a.type === "meta");
  const personalAccounts = accounts.filter((a) => a.type === "personal");

  const [flows, setFlows] = useState(MOCK_FLOWS);
  const [selected, setSelected] = useState(MOCK_FLOWS[0]);
  const [createOpen, setCreateOpen] = useState(false);
  const [stepOpen, setStepOpen] = useState(false);
  const [stepMode, setStepMode] = useState("add");
  const [stepInitial, setStepInitial] = useState({ ...BLANK });
  const [insertAfter, setInsertAfter] = useState(null);
  const [search, setSearch] = useState("");
  const [showStats, setShowStats] = useState(true);
  const [testOpen, setTestOpen] = useState(false);
  const [testPhone, setTestPhone] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [form, setForm] = useState({ name: "", trigger: "", reenroll: 0 });

  // Update flows and keep selected in sync
  const mutate = useCallback((fn) => {
    setFlows((prev) => {
      const next = fn(prev);
      setSelected((sel) => sel ? (next.find((f) => f.id === sel.id) || next[0] || null) : null);
      return next;
    });
  }, []);

  const toggleFlow = (id) => {
    const f = flows.find((x) => x.id === id);
    mutate((prev) => prev.map((x) => x.id === id ? { ...x, active: !x.active } : x));
    toast.success(`"${f?.name}" ${f?.active ? "paused" : "activated"}`);
  };

  const deleteFlow = (id) => {
    setFlows((prev) => {
      const next = prev.filter((f) => f.id !== id);
      setSelected((sel) => sel?.id === id ? (next[0] || null) : sel);
      return next;
    });
    toast.success("Flow deleted");
  };

  const duplicateFlow = (flow) => {
    const copy = {
      ...flow,
      id: `f_${Date.now()}`,
      name: `${flow.name} (Copy)`,
      active: false,
      leadsProcessed: 0,
      lastRun: "Never",
      lastEdited: "Just now",
      stats: { sent: 0, delivered: 0, replied: 0, converted: 0 },
      steps: flow.steps.map((s) => ({ ...s, id: `s_${Date.now()}_${Math.random().toString(36).slice(2)}` })),
    };
    setFlows((prev) => [copy, ...prev]);
    setSelected(copy);
    toast.success("Flow duplicated");
  };

  const deleteStep = (stepId) => {
    mutate((prev) => prev.map((f) =>
      f.id === selected.id ? { ...f, steps: f.steps.filter((s) => s.id !== stepId) } : f
    ));
  };

  const moveStep = (index, dir) => {
    mutate((prev) => prev.map((f) => {
      if (f.id !== selected.id) return f;
      const steps = [...f.steps];
      const t = index + dir;
      if (t < 0 || t >= steps.length) return f;
      [steps[index], steps[t]] = [steps[t], steps[index]];
      return { ...f, steps };
    }));
  };

  const openAdd = (afterIndex = null) => {
    setInsertAfter(afterIndex);
    setStepInitial({ ...BLANK });
    setStepMode("add");
    setStepOpen(true);
  };

  const openEdit = (step) => {
    setStepInitial({ ...step, varMap: step.varMap || {} });
    setStepMode("edit");
    setStepOpen(true);
  };

  const saveStep = (step) => {
    if (!step.label?.trim() && !step.templateId && !step.conditionId && step.type !== "ai_reply") {
      return toast.error("Configure the step before saving");
    }
    if (stepMode === "add") {
      const ns = { id: `s_${Date.now()}`, ...step };
      mutate((prev) => prev.map((f) => {
        if (f.id !== selected.id) return f;
        const steps = [...f.steps];
        const endIdx = steps.findIndex((s) => s.type === "end");
        if (insertAfter !== null && insertAfter >= 0) steps.splice(insertAfter + 1, 0, ns);
        else if (endIdx >= 0) steps.splice(endIdx, 0, ns);
        else steps.push(ns);
        return { ...f, steps };
      }));
      toast.success("Step added");
    } else {
      mutate((prev) => prev.map((f) =>
        f.id === selected.id ? { ...f, steps: f.steps.map((s) => s.id === step.id ? step : s) } : f
      ));
      toast.success("Step updated");
    }
    setStepOpen(false);
    setInsertAfter(null);
  };

  const createFlow = () => {
    if (!form.name.trim() || !form.trigger) return toast.error("Fill all required fields");
    const trig = TRIGGERS.find((t) => t.id === form.trigger);
    const nf = {
      id: `f_${Date.now()}`,
      name: form.name,
      active: false,
      trigger: form.trigger,
      triggerLabel: trig?.label || form.trigger,
      triggerBg: trig?.bg || "bg-muted",
      leadsProcessed: 0,
      lastRun: "Never",
      lastEdited: "Just now",
      reenrollAfterDays: Number(form.reenroll) || 0,
      stats: { sent: 0, delivered: 0, replied: 0, converted: 0 },
      steps: [{ id: "s_end", type: "end", label: "End Flow" }],
    };
    setFlows((prev) => [nf, ...prev]);
    setSelected(nf);
    setForm({ name: "", trigger: "", reenroll: 0 });
    setCreateOpen(false);
    toast.success("Flow created — add steps in the canvas");
  };

  const filtered = flows.filter((f) => !search || f.name.toLowerCase().includes(search.toLowerCase()));
  const activeCount = flows.filter((f) => f.active).length;
  const totalProcessed = flows.reduce((s, f) => s + f.leadsProcessed, 0);
  const totalConverted = flows.reduce((s, f) => s + (f.stats?.converted || 0), 0);

  return (
    <div className="flex flex-col h-full min-h-0 bg-background">

      {/* ── Top Bar ─────────────────────────────────────────────────────────── */}
      <div className="shrink-0 flex items-center justify-between gap-4 px-6 py-3.5 border-b border-border bg-card">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-9 w-9 rounded-xl bg-emerald-500 flex items-center justify-center shrink-0 shadow-sm">
            <Zap className="h-[18px] w-[18px] text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-[15px] font-bold text-foreground leading-tight">WhatsApp Automation</h1>
            <p className="text-[11px] text-muted-foreground">Build trigger-based flows — n8n style visual canvas</p>
          </div>
        </div>

        {/* API status pill — multi-account aware */}
        <div className="hidden md:flex items-center gap-2 flex-wrap shrink-0">
          {accounts.length === 0 ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-red-500/20 bg-red-500/5 text-xs text-red-600 font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
              No WhatsApp Connected
            </div>
          ) : (
            accounts.map((acc) => {
              const cfg = CHANNEL_BADGE[acc.type] || CHANNEL_BADGE.meta;
              const Icon = acc.type === "personal" ? Smartphone : Globe;
              return (
                <div key={acc.id} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium ${cfg.cls}`}>
                  <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
                  <Icon className="h-3 w-3" />
                  {acc.label}
                </div>
              );
            })
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5 hidden sm:flex" onClick={() => setSettingsOpen(true)}>
            <Settings2 className="h-3.5 w-3.5" />Settings
          </Button>
          <Button size="sm" className="h-8 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setCreateOpen(true)}>
            <Plus className="h-3.5 w-3.5" />New Flow
          </Button>
        </div>
      </div>

      {/* ── KPI Strip ───────────────────────────────────────────────────────── */}
      <div className="shrink-0 grid grid-cols-2 sm:grid-cols-4 border-b border-border bg-card/60">
        {[
          { label: "Active Flows",     value: activeCount,                  sub: `of ${flows.length} total`,   color: "text-emerald-600", dot: "bg-emerald-500" },
          { label: "Leads Processed",  value: totalProcessed.toLocaleString(), sub: "all time",               color: "text-blue-600",    dot: "bg-blue-500" },
          { label: "Conversions",      value: totalConverted.toLocaleString(), sub: "from automation",         color: "text-violet-600",  dot: "bg-violet-500" },
          { label: "Templates",        value: TEMPLATES.length,             sub: `${TEMPLATES.length} approved`, color: "text-amber-600", dot: "bg-amber-500" },
        ].map((k, i) => (
          <div key={k.label} className={`px-5 py-3 flex items-center gap-3 ${i < 3 ? "border-r border-border" : ""}`}>
            <span className={`h-2 w-2 rounded-full shrink-0 ${k.dot}`} />
            <div>
              <p className={`text-xl font-extrabold leading-none ${k.color}`}>{k.value}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{k.label} <span className="opacity-50">· {k.sub}</span></p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Main Split ──────────────────────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* ── Left Panel ──────────────────────────────────────────────────── */}
        <div className="w-[280px] shrink-0 flex flex-col border-r border-border bg-card overflow-hidden">
          {/* Panel header */}
          <div className="px-4 pt-4 pb-3 border-b border-border space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Flows ({flows.length})</span>
              <button onClick={() => setCreateOpen(true)} className="h-6 w-6 rounded-lg bg-primary/10 hover:bg-primary/20 flex items-center justify-center text-primary transition-colors" title="New flow">
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search flows..." className="pl-8 h-8 text-xs bg-muted/40 border-border/60" />
            </div>
          </div>

          {/* Flow list */}
          <div className="flex-1 overflow-y-auto py-2 px-2 space-y-1">
            {filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center mb-3">
                  <GitBranch className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-xs font-semibold text-foreground">No flows found</p>
                <p className="text-[11px] text-muted-foreground mt-1">Create your first automation flow</p>
                <Button size="sm" className="mt-3 h-7 text-xs gap-1 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setCreateOpen(true)}>
                  <Plus className="h-3 w-3" />New Flow
                </Button>
              </div>
            )}
            {filtered.map((flow) => {
              const isSelected = selected?.id === flow.id;
              const TrigIcon = TRIGGERS.find((t) => t.id === flow.trigger)?.Icon || Zap;
              const trigBg = TRIGGERS.find((t) => t.id === flow.trigger)?.bg || "bg-muted";
              return (
                <button
                  key={flow.id}
                  onClick={() => setSelected(flow)}
                  className={`w-full text-left p-3 rounded-xl border transition-all group ${isSelected ? "border-primary/40 bg-primary/5 shadow-sm" : "border-transparent hover:border-border hover:bg-muted/40"}`}
                >
                  <div className="flex items-start gap-2.5">
                    <div className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 ${trigBg}`}>
                      <TrigIcon className="h-3.5 w-3.5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-semibold text-foreground truncate flex-1">{flow.name}</p>
                        <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${flow.active ? "bg-emerald-500" : "bg-muted-foreground/30"}`} />
                      </div>
                      <p className="text-[10px] text-muted-foreground truncate mt-0.5">{flow.triggerLabel}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[10px] text-muted-foreground">{flow.steps.length} steps</span>
                        <span className="text-[10px] text-muted-foreground/40">·</span>
                        <span className="text-[10px] text-muted-foreground">{flow.leadsProcessed.toLocaleString()} processed</span>
                      </div>
                    </div>
                  </div>
                  {/* Hover actions */}
                  <div className="flex items-center gap-1 mt-2.5 pt-2 border-t border-border/50 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                    <Switch checked={flow.active} onCheckedChange={() => toggleFlow(flow.id)} className="scale-[0.7] origin-left" />
                    <span className="text-[10px] text-muted-foreground">{flow.active ? "Active" : "Paused"}</span>
                    <div className="ml-auto flex items-center gap-0.5">
                      <button onClick={() => duplicateFlow(flow)} className="h-6 w-6 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors" title="Duplicate">
                        <Copy className="h-3 w-3" />
                      </button>
                      <button onClick={() => deleteFlow(flow.id)} className="h-6 w-6 rounded-md flex items-center justify-center text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors" title="Delete">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Right Canvas Panel ───────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {selected ? (
            <>
              {/* Canvas Toolbar */}
              <div className="shrink-0 flex items-center gap-3 px-6 py-3 border-b border-border bg-card/80 backdrop-blur-sm flex-wrap">
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <div className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 ${selected.triggerBg}`}>
                    <Zap className="h-3.5 w-3.5 text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-foreground truncate leading-tight">{selected.name}</p>
                    <p className="text-[10px] text-muted-foreground">Trigger: {selected.triggerLabel} · {selected.steps.length} steps · Last run {selected.lastRun}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  <span className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-full border ${selected.active ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20" : "bg-muted text-muted-foreground border-border"}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${selected.active ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground/40"}`} />
                    {selected.active ? "Active" : "Paused"}
                  </span>
                  <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5" onClick={() => setShowStats((p) => !p)}>
                    <BarChart2 className="h-3 w-3" />{showStats ? "Hide Stats" : "Stats"}
                  </Button>
                  <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5" onClick={() => setTestOpen(true)}>
                    <FlaskConical className="h-3 w-3" />Test
                  </Button>
                  <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5" onClick={() => toggleFlow(selected.id)}>
                    {selected.active ? <><Pause className="h-3 w-3" />Pause</> : <><Play className="h-3 w-3" />Activate</>}
                  </Button>
                  <button onClick={() => deleteFlow(selected.id)} className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 border border-border transition-colors" title="Delete flow">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Analytics Strip */}
              {showStats && selected.stats && (() => {
                const s = selected.stats;
                const dr = s.sent > 0 ? Math.round(s.delivered / s.sent * 100) : 0;
                const rr = s.delivered > 0 ? Math.round(s.replied / s.delivered * 100) : 0;
                const cr = s.replied > 0 ? Math.round(s.converted / s.replied * 100) : 0;
                return (
                  <div className="shrink-0 grid grid-cols-4 border-b border-border bg-muted/20">
                    {[
                      { label: "Sent",      value: s.sent.toLocaleString(),      rate: null,    color: "text-foreground" },
                      { label: "Delivered", value: s.delivered.toLocaleString(), rate: `${dr}%`, color: "text-emerald-600" },
                      { label: "Replied",   value: s.replied.toLocaleString(),   rate: `${rr}%`, color: "text-blue-600" },
                      { label: "Converted", value: s.converted.toLocaleString(), rate: `${cr}%`, color: "text-violet-600" },
                    ].map((stat, i) => (
                      <div key={stat.label} className={`px-5 py-2.5 ${i < 3 ? "border-r border-border" : ""}`}>
                        <div className="flex items-baseline gap-1.5">
                          <span className={`text-lg font-extrabold leading-none ${stat.color}`}>{stat.value}</span>
                          {stat.rate && <span className={`text-[10px] font-bold opacity-70 ${stat.color}`}>{stat.rate}</span>}
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{stat.label}</p>
                      </div>
                    ))}
                  </div>
                );
              })()}

              {/* Canvas — dotted grid like n8n */}
              <div
                className="flex-1 overflow-y-auto overflow-x-hidden"
                style={{ background: "radial-gradient(circle, hsl(var(--border)) 1px, transparent 1px)", backgroundSize: "24px 24px" }}
              >
                <div className="flex flex-col items-center py-10 px-10 min-h-full">
                  <div className="w-full max-w-[540px] flex flex-col items-center">

                    {/* Trigger Node */}
                    <div className="w-full max-w-[500px]">
                      <div className="rounded-2xl border-2 border-dashed border-border bg-card/90 backdrop-blur-sm shadow-sm">
                        <div className="flex items-center gap-3 px-4 py-4">
                          <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${selected.triggerBg} shadow-sm`}>
                            <Zap className="h-5 w-5 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Trigger · Entry Point</p>
                            <p className="text-sm font-bold text-foreground mt-0.5">{selected.triggerLabel}</p>
                          </div>
                          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-muted text-muted-foreground border border-border">START</span>
                        </div>
                      </div>
                    </div>

                    {/* Connector after trigger */}
                    <div className="flex flex-col items-center my-0.5 group/conn0 relative">
                      <div className="w-px h-5 bg-border" />
                      <button onClick={() => openAdd(-1)} className="h-6 w-6 rounded-full border-2 border-dashed border-border bg-background flex items-center justify-center text-muted-foreground hover:border-primary hover:text-primary hover:bg-primary/5 transition-all opacity-0 group-hover/conn0:opacity-100 focus:opacity-100 z-10" title="Add step here">
                        <Plus className="h-3 w-3" />
                      </button>
                      <div className="w-px h-5 bg-border" />
                      <ArrowDown className="h-3.5 w-3.5 text-muted-foreground -mt-1" />
                    </div>

                    {/* Step Nodes */}
                    {selected.steps.map((step, i) => (
                      <CanvasNode
                        key={step.id}
                        step={step}
                        index={i}
                        isLast={i === selected.steps.length - 1}
                        onDelete={deleteStep}
                        onEdit={openEdit}
                        onMoveUp={(idx) => moveStep(idx, -1)}
                        onMoveDown={(idx) => moveStep(idx, 1)}
                        canMoveUp={step.type !== "end" && i > 0 && selected.steps[i - 1]?.type !== "end"}
                        canMoveDown={step.type !== "end" && i < selected.steps.length - 2}
                        onAddAfter={() => openAdd(i)}
                      />
                    ))}

                    {/* Add Step CTA */}
                    <div className="mt-8 mb-4">
                      <button
                        onClick={() => openAdd(null)}
                        className="flex items-center gap-2 px-6 py-3 rounded-2xl border-2 border-dashed border-border text-muted-foreground hover:border-primary hover:text-primary hover:bg-primary/5 transition-all text-xs font-semibold"
                      >
                        <Plus className="h-4 w-4" />Add Step
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* Empty state */
            <div
              className="flex-1 flex flex-col items-center justify-center"
              style={{ background: "radial-gradient(circle, hsl(var(--border)) 1px, transparent 1px)", backgroundSize: "24px 24px" }}
            >
              <div className="bg-card border border-border rounded-2xl p-8 text-center shadow-sm max-w-xs">
                <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                  <GitBranch className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-sm font-bold text-foreground">No flow selected</p>
                <p className="text-xs text-muted-foreground mt-1 mb-4">Select a flow from the left panel or create a new one</p>
                <Button size="sm" className="text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setCreateOpen(true)}>
                  <Plus className="h-3.5 w-3.5" />Create First Flow
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Create Flow Dialog ──────────────────────────────────────────────── */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-emerald-500 flex items-center justify-center"><Zap className="h-3.5 w-3.5 text-white" /></div>
              New Automation Flow
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Flow Name *</Label>
              <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="e.g. New Lead Welcome Flow" className="h-9 text-xs" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Trigger Event *</Label>
              <Select value={form.trigger} onValueChange={(v) => setForm((p) => ({ ...p, trigger: v }))}>
                <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Select what triggers this flow" /></SelectTrigger>
                <SelectContent>
                  {TRIGGERS.map((t) => {
                    const { Icon } = t;
                    return (
                      <SelectItem key={t.id} value={t.id} className="text-xs">
                        <div className="flex items-center gap-2">
                          <div className={`h-5 w-5 rounded-md flex items-center justify-center ${t.bg}`}><Icon className="h-3 w-3 text-white" /></div>
                          {t.label}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Re-enroll After (days) <span className="font-normal text-muted-foreground">— 0 = never</span></Label>
              <Input type="number" min="0" value={form.reenroll} onChange={(e) => setForm((p) => ({ ...p, reenroll: e.target.value }))} placeholder="0" className="h-9 text-xs" />
            </div>
            {form.trigger === "webhook" && (
              <div className="p-3 rounded-xl bg-orange-500/5 border border-orange-500/20 text-[11px] space-y-1">
                <p className="font-semibold text-orange-700 dark:text-orange-400 flex items-center gap-1.5"><Webhook className="h-3 w-3" />Webhook URL (generated after save)</p>
                <p className="font-mono text-muted-foreground break-all text-[10px]">https://api.smoothsales.in/webhooks/wa/flow/{"{id}"}</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" className="text-xs" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button size="sm" className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white" onClick={createFlow}>Create Flow</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Step Dialog ─────────────────────────────────────────────────────── */}
      <StepDialog open={stepOpen} onOpenChange={setStepOpen} initial={stepInitial} onSave={saveStep} mode={stepMode} />

      {/* ── Test Flow Dialog ─────────────────────────────────────────────────── */}
      <Dialog open={testOpen} onOpenChange={setTestOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold flex items-center gap-2">
              <FlaskConical className="h-4 w-4 text-blue-500" />Test Flow
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-xs text-muted-foreground">Send a test run of <span className="font-semibold text-foreground">{selected?.name}</span> to a phone number.</p>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Phone Number (with country code)</Label>
              <Input value={testPhone} onChange={(e) => setTestPhone(e.target.value)} placeholder="+91 98765 43210" className="h-9 text-xs" />
            </div>
            <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 text-[11px] text-amber-700 dark:text-amber-400">
              Test messages use real WhatsApp API credits. The number must have WhatsApp installed.
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" className="text-xs" onClick={() => setTestOpen(false)}>Cancel</Button>
            <Button size="sm" className="text-xs bg-blue-600 hover:bg-blue-700 text-white" onClick={() => {
              if (!testPhone.trim()) return toast.error("Enter a phone number");
              toast.success(`Test sent to ${testPhone}`);
              setTestOpen(false); setTestPhone("");
            }}>Send Test</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Settings Dialog ──────────────────────────────────────────────────── */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold flex items-center gap-2">
              <Settings2 className="h-4 w-4 text-muted-foreground" />Automation Settings
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {[
              { label: "Global Automation",  desc: "Pause all flows at once",              on: true },
              { label: "Respect DND Hours",  desc: "Don't send between 10PM–8AM",          on: true },
              { label: "Stop on Reply",      desc: "Pause flow when lead replies",          on: true },
              { label: "Skip Weekends",      desc: "Don't trigger flows on Sat/Sun",        on: false },
            ].map((s) => (
              <div key={s.label} className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold text-foreground">{s.label}</p>
                  <p className="text-[11px] text-muted-foreground">{s.desc}</p>
                </div>
                <Switch defaultChecked={s.on} />
              </div>
            ))}
            <div className="space-y-1.5 pt-2 border-t border-border">
              <Label className="text-xs font-semibold">Default Sender Name</Label>
              <Input defaultValue="SmoothSales Team" className="h-9 text-xs" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" className="text-xs" onClick={() => setSettingsOpen(false)}>Cancel</Button>
            <Button size="sm" className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => { setSettingsOpen(false); toast.success("Settings saved"); }}>Save Settings</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
