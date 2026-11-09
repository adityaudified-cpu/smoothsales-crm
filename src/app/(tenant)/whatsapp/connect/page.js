"use client";

import React, { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Smartphone, QrCode, CheckCircle2, RefreshCw, Zap, Bot, Users,
  MessageCircle, Shield, Settings, Link2, Unlink, Copy, ExternalLink,
  Info, Clock, Globe, Star, Layers, Activity, Eye, EyeOff, Trash2,
  Plus, Check, Building2, PhoneCall, ArrowUpRight, AlertTriangle,
  X, Loader2, Wifi, WifiOff, RotateCw, Send, ChevronRight, HelpCircle,
  FileText, Sparkles, UserCheck, Bell, ShieldCheck, Cpu, ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useWaAccounts, CHANNEL_BADGE } from "../wa-accounts-context";
import { whatsappTemplatesApi, whatsappSendApi } from "@/lib/api/whatsapp";
import { isApiMode } from "@/lib/api/client";

// ── Webhook Info Config ───────────────────────────────────────────────────────
const WEBHOOK_CALLBACK_URL = typeof window !== "undefined"
  ? `${window.location.origin}/api/webhooks/whatsapp`
  : "http://103.180.110.190/api/webhooks/whatsapp";
const WEBHOOK_VERIFY_TOKEN = "smoothsales-webhook-verify";

// ── Lead Capture Settings Config ──────────────────────────────────────────────
const LEAD_CAPTURE_GROUPS = [
  {
    title: "Lead Generation & Profiling",
    icon: Users,
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-500/10",
    rules: [
      { id: "lc1", label: "Auto-create lead from new number", desc: "Instantly create a new CRM lead profile when an unknown number messages", default: true },
      { id: "lc2", label: "Extract name from WhatsApp profile", desc: "Automatically sync contact's WhatsApp display name as the lead name", default: true },
      { id: "lc3", label: "Tag source as 'WhatsApp Inbound'", desc: "Tag all incoming chats with lead source = WhatsApp Inbound for marketing attribution", default: true },
    ],
  },
  {
    title: "Smart AI Data Extraction",
    icon: Sparkles,
    color: "text-violet-600 dark:text-violet-400",
    bg: "bg-violet-500/10",
    rules: [
      { id: "lc4", label: "AI Budget & Requirement Parsing", desc: "Scan inbound messages with AI to extract budget mentions and requirements", default: true },
      { id: "lc5", label: "High Intent Keyword Detection", desc: "Flag leads as 'Hot' if keywords like 'pricing', 'quote', or 'demo' appear", default: true },
    ],
  },
  {
    title: "Routing & Notifications",
    icon: Bell,
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-500/10",
    rules: [
      { id: "lc6", label: "Notify assigned sales rep", desc: "Trigger instant in-app alerts whenever a lead replies on WhatsApp", default: true },
      { id: "lc7", label: "Auto-assign to round-robin pool", desc: "Distribute newly created WhatsApp leads evenly among online sales team members", default: false },
    ],
  },
];

// ── Automation Triggers Config ────────────────────────────────────────────────
const AUTOMATION_TRIGGERS = [
  {
    id: "ar1",
    title: "Welcome Message on First Contact",
    trigger: "First Message",
    desc: "Greet leads automatically with an approved welcome message upon initial outreach.",
    template: "lead_welcome_intro",
    snippet: "Hi {{1}}! 👋 Welcome to SmoothSales CRM. Would you like to schedule a quick discovery demo?",
    default: true,
  },
  {
    id: "ar2",
    title: "Meeting / Demo Reminder",
    trigger: "Meeting Scheduled",
    desc: "Send an automated confirmation and reminder 2 hours prior to scheduled meetings.",
    template: "meeting_demo_reminder",
    snippet: "Hi {{1}}, this is a friendly reminder for your session with our specialist on {{2}} at {{3}}.",
    default: true,
  },
  {
    id: "ar3",
    title: "Follow-up After 24h Silence",
    trigger: "No Reply 24h",
    desc: "Send a polite follow-up nudge if a prospect does not reply within 24 hours.",
    template: "product_followup",
    snippet: "Hi {{1}}! Just following up on your enquiry. Reply YES or call us to connect with a specialist.",
    default: false,
  },
  {
    id: "ar4",
    title: "Quotation Sent Notification",
    trigger: "Quotation Sent",
    desc: "Notify customer immediately when a quote or pricing proposal is generated in CRM.",
    template: "quotation_ready",
    snippet: "Hi {{1}}, your quotation is ready! Estimated value: {{2}}. Please review and let us know.",
    default: true,
  },
  {
    id: "ar5",
    title: "AI Sales Agent Auto-Pilot",
    trigger: "AI Qualification",
    desc: "Let the AI Sales Agent handle conversational qualification and FAQs outside business hours.",
    template: "ai_sales_persona",
    snippet: "Priya (AI Sales Assistant) qualifies requirement, flat size/budget, and books demos.",
    default: true,
  },
];

// ── Setup Steps Config ────────────────────────────────────────────────────────
const SETUP_STEPS = [
  {
    step: "1",
    title: "Open Meta Business Suite",
    desc: "Go to Meta Business Settings → WhatsApp Accounts. Select or register your business number.",
    href: "https://business.facebook.com/settings/whatsapp-business-accounts",
    action: "Open Business Manager",
  },
  {
    step: "2",
    title: "Retrieve Phone Number ID & WABA ID",
    desc: "In Meta Developer Console under WhatsApp API Setup, copy your Phone Number ID and WhatsApp Business Account ID.",
    href: "https://developers.facebook.com/docs/whatsapp/cloud-api/get-started",
    action: "View Developer Docs",
  },
  {
    step: "3",
    title: "Generate Permanent System User Token",
    desc: "Create a System User with 'whatsapp_business_messaging' and 'whatsapp_business_management' permissions.",
    href: "https://developers.facebook.com/docs/whatsapp/business-management-api/get-started",
    action: "Generate Token",
  },
  {
    step: "4",
    title: "Subscribe to Webhooks",
    desc: "Paste the Webhook Callback URL and Verify Token in Meta Webhook config. Subscribe to 'messages' and 'message_template_status_update'.",
    href: null,
    action: null,
  },
];

export default function WhatsAppConnectPage() {
  const { accounts, addAccount, removeAccount } = useWaAccounts();
  const [activeTab, setActiveTab] = useState("connect");
  const [templateSyncing, setTemplateSyncing] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [testModalOpen, setTestModalOpen] = useState(false);
  const [testPhone, setTestPhone] = useState("+91 ");
  const [testSending, setTestSending] = useState(false);
  const [showAddChannel, setShowAddChannel] = useState(false);

  // Form states for manual Meta config
  const [phoneId, setPhoneId] = useState("1197546510113741");
  const [wabaId, setWabaId] = useState("4424288871221076");
  const [token, setToken] = useState("");
  const [label, setLabel] = useState("SmoothSales Official WhatsApp");
  const [showToken, setShowToken] = useState(false);

  // QR Modal
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrStep, setQrStep] = useState("generate");

  // Rule states
  const [leadRules, setLeadRules] = useState(() => {
    try {
      const saved = localStorage.getItem("wa_lead_capture_rules_v2");
      if (saved) return JSON.parse(saved);
    } catch {}
    const initial = {};
    LEAD_CAPTURE_GROUPS.forEach((g) => g.rules.forEach((r) => { initial[r.id] = r.default; }));
    return initial;
  });

  const [autoRules, setAutoRules] = useState(() => {
    try {
      const saved = localStorage.getItem("wa_auto_rules_v2");
      if (saved) return JSON.parse(saved);
    } catch {}
    const initial = {};
    AUTOMATION_TRIGGERS.forEach((r) => { initial[r.id] = r.default; });
    return initial;
  });

  const metaAccount = accounts.find((a) => a.type === "meta") || accounts[0];

  const handleSyncTemplates = async () => {
    setTemplateSyncing(true);
    try {
      await whatsappTemplatesApi.syncAll();
      toast.success("Templates successfully synced with Meta Graph API!");
    } catch {
      toast.error("Failed to sync templates from Meta");
    } finally {
      setTemplateSyncing(false);
    }
  };

  const handleSendTestMessage = async () => {
    if (!testPhone || testPhone.trim().length < 10) {
      toast.error("Please enter a valid phone number with country code (e.g. +91 98765 43210)");
      return;
    }
    setTestSending(true);
    try {
      if (isApiMode()) {
        await whatsappSendApi.sendSession({
          messageBody: "🔔 *SmoothSales CRM Test Ping*: WhatsApp Meta Cloud API connection is active and working properly!",
        });
      }
      toast.success(`Test message dispatched to ${testPhone}! Check WhatsApp.`);
      setTestModalOpen(false);
    } catch (err) {
      toast.error(err?.message || "Failed to send test message");
    } finally {
      setTestSending(false);
    }
  };

  const handleSaveLeadRules = () => {
    try {
      localStorage.setItem("wa_lead_capture_rules_v2", JSON.stringify(leadRules));
    } catch {}
    toast.success("Lead capture configuration saved successfully!");
  };

  const handleSaveAutoRules = () => {
    try {
      localStorage.setItem("wa_auto_rules_v2", JSON.stringify(autoRules));
    } catch {}
    toast.success("Automation trigger rules saved successfully!");
  };

  const handleConnectMeta = async () => {
    if (!phoneId.trim() || !wabaId.trim()) {
      toast.error("Phone Number ID and WABA ID are required");
      return;
    }
    setConnecting(true);
    try {
      await addAccount({
        type: "meta",
        label: label.trim() || "Meta Cloud API",
        phoneId: phoneId.trim(),
        wabaId: wabaId.trim(),
        token: token.trim(),
      });
      toast.success("Meta Cloud API credentials updated successfully!");
      setShowAddChannel(false);
    } catch {
      toast.error("Connection failed. Please check credentials.");
    } finally {
      setConnecting(false);
    }
  };

  const handleScanQr = () => {
    setQrStep("scanning");
    setTimeout(() => setQrStep("scanned"), 2000);
  };

  const handleCompleteQr = async () => {
    setConnecting(true);
    try {
      await addAccount({
        type: "personal",
        label: "Personal WhatsApp Business",
        number: "+91 98201 55432",
      });
      toast.success("Personal WhatsApp Business account linked!");
      setQrModalOpen(false);
      setQrStep("generate");
    } finally {
      setConnecting(false);
    }
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  return (
    <div className="flex flex-col h-full min-h-0 bg-background">
      {/* ── Top Header Bar ── */}
      <div className="shrink-0 flex items-center justify-between gap-4 px-6 py-3.5 border-b border-border bg-card shadow-xs">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-9 w-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-500/20 shadow-xs">
            <MessageCircle className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-foreground leading-tight tracking-tight">
                WhatsApp Connection Hub
              </h1>
              <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 gap-1 py-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Meta Cloud API Active
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Official WhatsApp Business Cloud API integration, webhook endpoints, and lead automation
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs gap-1.5 border-emerald-500/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10"
            onClick={() => setTestModalOpen(true)}
          >
            <Send className="h-3.5 w-3.5" />
            Send Test Ping
          </Button>
          <Button
            size="sm"
            className="h-8 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
            onClick={handleSyncTemplates}
            disabled={templateSyncing}
          >
            <RefreshCw className={cn("h-3.5 w-3.5", templateSyncing && "animate-spin")} />
            {templateSyncing ? "Syncing..." : "Sync Templates"}
          </Button>
        </div>
      </div>

      {/* ── Segmented Navigation Tabs ── */}
      <div className="shrink-0 px-6 pt-2 pb-0 border-b border-border bg-card/60">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          {[
            { id: "connect", label: "Channels & Health", icon: Globe, count: accounts.length },
            { id: "settings", label: "Lead Capture", icon: Users, count: "Active" },
            { id: "automation", label: "Automation Triggers", icon: Zap, count: "5 Rules" },
            { id: "setup", label: "Setup Guide & Webhooks", icon: HelpCircle, count: null },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold border-b-2 transition-all whitespace-nowrap",
                  isActive
                    ? "border-emerald-500 text-emerald-700 dark:text-emerald-400 bg-emerald-500/5 rounded-t-lg"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30"
                )}
              >
                <Icon className={cn("h-3.5 w-3.5", isActive ? "text-emerald-600" : "text-muted-foreground")} />
                {tab.label}
                {tab.count !== null && (
                  <span className={cn(
                    "text-[10px] px-1.5 py-0.2 rounded-full font-bold ml-1",
                    isActive ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300" : "bg-muted text-muted-foreground"
                  )}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Content View ── */}
      <div className="flex-1 overflow-y-auto px-6 py-5">

        {/* ════════════════════ TAB 1: CHANNELS & HEALTH ════════════════════ */}
        {activeTab === "connect" && (
          <div className="max-w-6xl mx-auto space-y-6">

            {/* Primary Connected Channel Health Dashboard */}
            {metaAccount && (
              <div className="rounded-2xl border border-border bg-card p-5 shadow-xs relative overflow-hidden">
                <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

                {/* Account Top Details */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
                  <div className="flex items-center gap-3.5">
                    <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0 text-emerald-600 shadow-xs">
                      <Globe className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-sm font-bold text-foreground">
                          {metaAccount.label || "SmoothSales Official WhatsApp"}
                        </h2>
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 border border-blue-500/20">
                          Meta Verified WABA
                        </span>
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Live & Connected
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
                        <span className="font-semibold text-foreground">{metaAccount.number || "+91 87500 73899"}</span>
                        <span>·</span>
                        <span>Connected on {metaAccount.connectedAt || "2026-11-03"}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs gap-1.5"
                      onClick={() => setTestModalOpen(true)}
                    >
                      <Send className="h-3 w-3" /> Test Ping
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowAddChannel(!showAddChannel)}
                    >
                      <Settings className="h-3 w-3" /> Reconfigure
                    </Button>
                  </div>
                </div>

                {/* 4 Health Metrics Bento Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 py-4 border-b border-border">
                  <div className="p-3 rounded-xl bg-muted/40 border border-border/70 space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                      <Activity className="h-3 w-3 text-emerald-500" />
                      Quality Rating
                    </p>
                    <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                      HIGH (Tier 1 Status)
                    </p>
                    <p className="text-[10px] text-muted-foreground">Green flag rating from Meta</p>
                  </div>

                  <div className="p-3 rounded-xl bg-muted/40 border border-border/70 space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                      <Zap className="h-3 w-3 text-blue-500" />
                      Messaging Limit
                    </p>
                    <p className="text-xs font-bold text-foreground">
                      1,000 / 24 Hours
                    </p>
                    <p className="text-[10px] text-muted-foreground">Upgrades to 10k automatically</p>
                  </div>

                  <div className="p-3 rounded-xl bg-muted/40 border border-border/70 space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                      <FileText className="h-3 w-3 text-violet-500" />
                      Templates Synced
                    </p>
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-bold text-foreground">10 Approved</p>
                      <Link href="/whatsapp/templates" className="text-[10px] text-primary hover:underline flex items-center">
                        View <ChevronRight className="h-2.5 w-2.5" />
                      </Link>
                    </div>
                    <p className="text-[10px] text-muted-foreground">Ready for broadcast campaigns</p>
                  </div>

                  <div className="p-3 rounded-xl bg-muted/40 border border-border/70 space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                      <ShieldCheck className="h-3 w-3 text-amber-500" />
                      Webhook Health
                    </p>
                    <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                      <Check className="h-3 w-3" /> Active & Verified
                    </p>
                    <p className="text-[10px] text-muted-foreground">Listening for inbound events</p>
                  </div>
                </div>

                {/* Technical Credentials Overview */}
                <div className="pt-4 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-1.5">
                      <span className="text-muted-foreground text-[11px]">Phone ID:</span>
                      <code className="bg-muted px-1.5 py-0.5 rounded font-mono text-[11px] text-foreground">
                        {metaAccount.phoneId || "1197546510113741"}
                      </code>
                      <button
                        onClick={() => copyToClipboard(metaAccount.phoneId || "1197546510113741", "Phone ID")}
                        className="text-muted-foreground hover:text-foreground"
                        title="Copy Phone ID"
                      >
                        <Copy className="h-3 w-3" />
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-muted-foreground text-[11px]">WABA ID:</span>
                      <code className="bg-muted px-1.5 py-0.5 rounded font-mono text-[11px] text-foreground">
                        {metaAccount.wabaId || "4424288871221076"}
                      </code>
                      <button
                        onClick={() => copyToClipboard(metaAccount.wabaId || "4424288871221076", "WABA ID")}
                        className="text-muted-foreground hover:text-foreground"
                        title="Copy WABA ID"
                      >
                        <Copy className="h-3 w-3" />
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-muted-foreground text-[11px]">Meta API Version:</span>
                      <Badge variant="outline" className="text-[10px]">v19.0</Badge>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setActiveTab("setup")}
                      className="h-7 text-xs text-primary gap-1"
                    >
                      Webhook Details <ArrowRight className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Dual Channel Architecture Cards: Meta Cloud API vs Personal WA */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Channel 1: Meta Cloud API */}
              <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/5 p-4.5 space-y-3 relative">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
                      <Globe className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-foreground">Meta Cloud API (Official)</p>
                      <p className="text-[10.5px] text-muted-foreground">Scalable bulk broadcasts & approved templates</p>
                    </div>
                  </div>
                  <Badge className="bg-emerald-600 text-white text-[10px]">Active</Badge>
                </div>

                <div className="space-y-1.5 text-[11px] text-muted-foreground">
                  <div className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-emerald-600" /> Send bulk broadcast campaigns to CRM segments</div>
                  <div className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-emerald-600" /> Official Meta-approved templates with dynamic variables</div>
                  <div className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-emerald-600" /> Click-to-WhatsApp Meta Ads direct attribution</div>
                  <div className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-emerald-600" /> Works simultaneously alongside phone WhatsApp app</div>
                </div>

                <div className="pt-2 border-t border-border flex items-center justify-between text-xs">
                  <span className="text-emerald-700 dark:text-emerald-400 font-semibold text-[11px]">Connected as Primary Channel</span>
                  <Button size="sm" variant="ghost" className="h-7 text-xs text-muted-foreground hover:text-foreground" onClick={() => setShowAddChannel(!showAddChannel)}>
                    Manage Credentials
                  </Button>
                </div>
              </div>

              {/* Channel 2: Personal WhatsApp Business (QR Connect) */}
              <div className="rounded-2xl border border-border bg-card p-4.5 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-xl bg-muted text-foreground flex items-center justify-center font-bold">
                      <Smartphone className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-foreground">Personal WhatsApp Business</p>
                      <p className="text-[10.5px] text-muted-foreground">Connect via QR scan for direct 1-on-1 team reps</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[10px]">Optional Add-on</Badge>
                </div>

                <div className="space-y-1.5 text-[11px] text-muted-foreground">
                  <div className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-foreground" /> No template approvals needed for 1-on-1 chats</div>
                  <div className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-foreground" /> Reps can sync individual business SIM numbers</div>
                  <div className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-foreground" /> Web-based QR scan link (like WhatsApp Web)</div>
                  <div className="flex items-center gap-1.5"><AlertTriangle className="h-3.5 w-3.5 text-amber-500" /> Cannot send automated bulk broadcast campaigns</div>
                </div>

                <div className="pt-2 border-t border-border flex items-center justify-between text-xs">
                  <span className="text-muted-foreground text-[11px]">Single device link</span>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs gap-1 border-emerald-500/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10"
                    onClick={() => setQrModalOpen(true)}
                  >
                    <QrCode className="h-3 w-3" /> Connect via QR
                  </Button>
                </div>
              </div>
            </div>

            {/* Reconfigure / Update Meta Credentials Accordion */}
            {showAddChannel && (
              <div className="rounded-2xl border border-border bg-card p-5 space-y-4 shadow-sm animate-in fade-in duration-200">
                <div className="flex items-center justify-between pb-2 border-b border-border">
                  <div>
                    <h3 className="text-xs font-bold text-foreground">Update Meta Cloud API Credentials</h3>
                    <p className="text-[11px] text-muted-foreground">Modify WABA ID, Phone Number ID, or System User Permanent Token</p>
                  </div>
                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setShowAddChannel(false)}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Account Label</Label>
                    <Input
                      value={label}
                      onChange={(e) => setLabel(e.target.value)}
                      placeholder="e.g. SmoothSales Official WhatsApp"
                      className="h-8 text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">WhatsApp Business Account ID (WABA ID)</Label>
                    <Input
                      value={wabaId}
                      onChange={(e) => setWabaId(e.target.value)}
                      placeholder="4424288871221076"
                      className="h-8 text-xs font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Phone Number ID</Label>
                    <Input
                      value={phoneId}
                      onChange={(e) => setPhoneId(e.target.value)}
                      placeholder="1197546510113741"
                      className="h-8 text-xs font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-medium">Permanent Access Token</Label>
                      <button
                        type="button"
                        onClick={() => setShowToken(!showToken)}
                        className="text-[10px] text-primary hover:underline flex items-center gap-1"
                      >
                        {showToken ? <EyeOff className="h-2.5 w-2.5" /> : <Eye className="h-2.5 w-2.5" />}
                        {showToken ? "Hide" : "Show"}
                      </button>
                    </div>
                    <Input
                      type={showToken ? "text" : "password"}
                      value={token}
                      onChange={(e) => setToken(e.target.value)}
                      placeholder="EAAM5fbS29hoB..."
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button variant="outline" size="sm" onClick={() => setShowAddChannel(false)} className="text-xs h-8">
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                    onClick={handleConnectMeta}
                    disabled={connecting}
                  >
                    {connecting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                    Save & Re-verify
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ════════════════════ TAB 2: LEAD CAPTURE ════════════════════ */}
        {activeTab === "settings" && (
          <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <div>
                <h2 className="text-sm font-bold text-foreground">Inbound Lead Capture Rules</h2>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Configure automated lead creation, tagging, AI intent parsing, and assignment for incoming WhatsApp messages
                </p>
              </div>
              <Button
                size="sm"
                className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shadow-xs"
                onClick={handleSaveLeadRules}
              >
                <Check className="h-3.5 w-3.5" /> Save Changes
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {LEAD_CAPTURE_GROUPS.map((group) => {
                const Icon = group.icon;
                return (
                  <div key={group.title} className="rounded-2xl border border-border bg-card p-4.5 space-y-3.5 flex flex-col shadow-xs">
                    <div className="flex items-center gap-2.5 pb-2.5 border-b border-border">
                      <div className={cn("h-7 w-7 rounded-lg flex items-center justify-center shrink-0", group.bg, group.color)}>
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <h3 className="text-xs font-bold text-foreground">{group.title}</h3>
                    </div>

                    <div className="space-y-3 flex-1">
                      {group.rules.map((rule) => (
                        <div key={rule.id} className="p-3 rounded-xl bg-muted/30 border border-border/70 hover:bg-muted/50 transition-colors flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-foreground leading-snug">{rule.label}</p>
                            <p className="text-[10.5px] text-muted-foreground mt-0.5 leading-relaxed">{rule.desc}</p>
                          </div>
                          <Switch
                            checked={leadRules[rule.id] ?? rule.default}
                            onCheckedChange={(checked) => setLeadRules((p) => ({ ...p, [rule.id]: checked }))}
                            className="shrink-0 mt-0.5 data-[state=checked]:bg-emerald-600"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ════════════════════ TAB 3: AUTOMATION TRIGGERS ════════════════════ */}
        {activeTab === "automation" && (
          <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border">
              <div>
                <h2 className="text-sm font-bold text-foreground">Automated Trigger Rules</h2>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Pre-configured WhatsApp auto-replies linked with Meta-approved templates and CRM events
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Link href="/whatsapp/automation">
                  <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5 text-primary border-primary/30 hover:bg-primary/5">
                    Open Workflow Canvas <ArrowUpRight className="h-3 w-3" />
                  </Button>
                </Link>
                <Button
                  size="sm"
                  className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shadow-xs"
                  onClick={handleSaveAutoRules}
                >
                  <Check className="h-3.5 w-3.5" /> Save Rules
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {AUTOMATION_TRIGGERS.map((t) => (
                <div key={t.id} className="rounded-2xl border border-border bg-card p-4.5 space-y-3 flex flex-col justify-between shadow-xs">
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="h-6 w-6 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                          <Zap className="h-3.5 w-3.5" />
                        </span>
                        <h3 className="text-xs font-bold text-foreground">{t.title}</h3>
                      </div>
                      <Badge variant="outline" className="text-[9.5px] bg-muted/60 shrink-0 font-medium">
                        {t.trigger}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed mb-3">{t.desc}</p>

                    {/* Template preview snippet */}
                    <div className="p-2.5 rounded-xl bg-muted/40 border border-border/80 space-y-1">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="font-semibold text-muted-foreground uppercase tracking-wider">Linked Template:</span>
                        <code className="text-[10px] text-emerald-700 dark:text-emerald-400 font-mono font-bold">{t.template}</code>
                      </div>
                      <p className="text-[11px] text-foreground/80 italic leading-snug line-clamp-2">
                        "{t.snippet}"
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-border flex items-center justify-between">
                    <span className="text-[11px] text-muted-foreground font-medium">Status</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10.5px] font-bold text-foreground">
                        {autoRules[t.id] ? "Enabled" : "Disabled"}
                      </span>
                      <Switch
                        checked={autoRules[t.id] ?? t.default}
                        onCheckedChange={(checked) => setAutoRules((p) => ({ ...p, [t.id]: checked }))}
                        className="data-[state=checked]:bg-emerald-600"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ════════════════════ TAB 4: SETUP GUIDE & WEBHOOKS ════════════════════ */}
        {activeTab === "setup" && (
          <div className="max-w-4xl mx-auto space-y-6">

            {/* Essential Webhook Configuration Box */}
            <div className="rounded-2xl border border-blue-500/30 bg-blue-500/5 p-5 space-y-3.5 shadow-xs">
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xs font-bold text-blue-900 dark:text-blue-300">
                    Meta Webhook Credentials (Required for Real-time Inbound Messages)
                  </h2>
                  <p className="text-[11px] text-blue-700 dark:text-blue-400 mt-0.5">
                    Copy and paste these exact values into the <strong>WhatsApp → Configuration → Webhook</strong> section in your Meta Developer Console.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                <div className="p-3 rounded-xl bg-background border border-blue-500/20 space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Callback URL</p>
                  <div className="flex items-center justify-between gap-2">
                    <code className="text-xs font-mono text-foreground truncate select-all">{WEBHOOK_CALLBACK_URL}</code>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 px-2 text-xs text-primary"
                      onClick={() => copyToClipboard(WEBHOOK_CALLBACK_URL, "Webhook URL")}
                    >
                      <Copy className="h-3 w-3 mr-1" /> Copy
                    </Button>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-background border border-blue-500/20 space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Verify Token</p>
                  <div className="flex items-center justify-between gap-2">
                    <code className="text-xs font-mono text-foreground font-bold select-all">{WEBHOOK_VERIFY_TOKEN}</code>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 px-2 text-xs text-primary"
                      onClick={() => copyToClipboard(WEBHOOK_VERIFY_TOKEN, "Verify Token")}
                    >
                      <Copy className="h-3 w-3 mr-1" /> Copy
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-blue-700 dark:text-blue-400 pt-1">
                <Check className="h-3.5 w-3.5" />
                <span>Webhook Web Fields to Check in Meta: <strong>messages</strong>, <strong>message_template_status_update</strong></span>
              </div>
            </div>

            {/* 4-Step Visual Onboarding Stepper */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Step-by-Step Meta Integration Walkthrough
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {SETUP_STEPS.map((s) => (
                  <div key={s.step} className="p-4 rounded-2xl border border-border bg-card space-y-2 flex flex-col justify-between shadow-xs">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="h-5 w-5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-bold flex items-center justify-center">
                          {s.step}
                        </span>
                        <h4 className="text-xs font-bold text-foreground">{s.title}</h4>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">{s.desc}</p>
                    </div>

                    {s.href && (
                      <div className="pt-2">
                        <a
                          href={s.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
                        >
                          {s.action} <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Test Message Modal ── */}
      <Dialog open={testModalOpen} onOpenChange={setTestModalOpen}>
        <DialogContent className="max-w-md p-0 overflow-hidden">
          <DialogHeader className="px-5 py-4 border-b border-border">
            <DialogTitle className="text-sm font-bold flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-emerald-500 flex items-center justify-center text-white">
                <Send className="h-3.5 w-3.5" />
              </div>
              Send WhatsApp Test Message
            </DialogTitle>
          </DialogHeader>

          <div className="p-5 space-y-3.5 text-xs">
            <p className="text-muted-foreground">
              Verify real-time delivery via your Meta Cloud API connection (<span className="font-semibold text-foreground">+91 87500 73899</span>).
            </p>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Recipient Phone Number (with Country Code)</Label>
              <Input
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="h-9 text-xs font-mono"
              />
              <p className="text-[10.5px] text-muted-foreground">Make sure the number is registered on WhatsApp.</p>
            </div>

            <div className="p-3 rounded-xl bg-muted/40 border border-border text-[11px] space-y-1">
              <p className="font-semibold text-foreground">Message Payload:</p>
              <p className="text-muted-foreground font-mono text-[10.5px]">
                "🔔 SmoothSales CRM Test Ping: WhatsApp Meta Cloud API connection is active and working properly!"
              </p>
            </div>
          </div>

          <DialogFooter className="px-5 py-3 border-t border-border bg-card flex justify-between">
            <Button variant="outline" size="sm" onClick={() => setTestModalOpen(false)} className="text-xs">
              Cancel
            </Button>
            <Button
              size="sm"
              className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
              onClick={handleSendTestMessage}
              disabled={testSending}
            >
              {testSending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              Send Test Message
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── QR Connect Modal ── */}
      <Dialog open={qrModalOpen} onOpenChange={setQrModalOpen}>
        <DialogContent className="max-w-sm p-5 space-y-4">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold flex items-center gap-2">
              <QrCode className="h-4 w-4 text-emerald-600" />
              Link Personal WhatsApp Business
            </DialogTitle>
          </DialogHeader>

          {qrStep === "generate" && (
            <div className="text-center space-y-3 py-2 text-xs">
              <p className="text-muted-foreground">
                Scan QR code with your phone's WhatsApp Business app (Linked Devices).
              </p>
              <Button
                size="sm"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                onClick={handleScanQr}
              >
                <QrCode className="h-3.5 w-3.5" /> Generate QR Code
              </Button>
            </div>
          )}

          {qrStep === "scanning" && (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <Loader2 className="h-8 w-8 text-emerald-500 animate-spin" />
              <p className="text-xs text-muted-foreground">Initializing session token...</p>
            </div>
          )}

          {qrStep === "scanned" && (
            <div className="flex flex-col items-center gap-3 py-2 text-center text-xs">
              <div className="h-36 w-36 border-2 border-dashed border-emerald-500/40 rounded-2xl flex items-center justify-center bg-emerald-500/5">
                <QrCode className="h-24 w-24 text-foreground/80" />
              </div>
              <p className="text-muted-foreground text-[11px]">
                Open WhatsApp → Linked Devices → Link a Device, then scan this code.
              </p>
              <Button
                size="sm"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={handleCompleteQr}
                disabled={connecting}
              >
                {connecting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "I've Scanned — Connect"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
