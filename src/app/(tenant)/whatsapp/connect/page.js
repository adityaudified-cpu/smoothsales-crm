"use client";

import React, { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Smartphone, QrCode, CheckCircle2, RefreshCw, Zap, Bot, Users,
  MessageCircle, Shield, Settings, Link2, Unlink, Copy, ExternalLink,
  Info, Clock, Globe, Star, Layers, Activity, Eye, EyeOff, Trash2,
  Plus, Check, Building2, PhoneCall, ArrowUpRight, AlertTriangle,
  X, Loader2, Wifi, WifiOff, RotateCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useWaAccounts, CHANNEL_BADGE } from "../wa-accounts-context";
import { whatsappTemplatesApi } from "@/lib/api/whatsapp";
import { isApiMode } from "@/lib/api/client";

// ── Static config ─────────────────────────────────────────────────────────────

const CHANNEL_TYPES = [
  {
    id: "meta",
    label: "Meta Cloud API",
    sub: "Official Business API — templates, broadcasts, green tick",
    Icon: Globe,
    color: "text-blue-600",
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
    badge: "Recommended",
    badgeCls: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    features: [
      "Bulk campaigns & broadcasts",
      "Meta-approved templates",
      "Green tick verification",
      "Click-to-WA ad attribution",
      "Works alongside your phone app",
    ],
  },
  {
    id: "personal",
    label: "Personal WhatsApp Business",
    sub: "Scan QR — direct personal number, no template needed",
    Icon: Smartphone,
    color: "text-emerald-600",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    badge: "QR Scan",
    badgeCls: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    features: [
      "No template approval needed",
      "Send any message freely",
      "Personal number stays active",
      "Best for 1-on-1 conversations",
      "Session-based (24hr window)",
    ],
  },
];

const SETUP_STEPS = [
  {
    step: "1", title: "Open Meta Business Manager",
    desc: "Go to business.facebook.com → Settings → WhatsApp Accounts. Your WhatsApp Business App number should already be listed here.",
    Icon: Building2, color: "text-primary", bg: "bg-primary/10",
    href: "https://business.facebook.com/settings/whatsapp-business-accounts",
  },
  {
    step: "2", title: "Get Your Phone Number ID",
    desc: "In Meta Business Manager → WhatsApp → select your number → click on it to find the Phone Number ID.",
    Icon: PhoneCall, color: "text-emerald-600", bg: "bg-emerald-500/10",
    href: "https://developers.facebook.com/docs/whatsapp/cloud-api/get-started",
  },
  {
    step: "3", title: "Generate a Permanent Access Token",
    desc: "In Meta Developer Console → your App → WhatsApp → API Setup → generate a System User token with whatsapp_business_messaging permission.",
    Icon: Shield, color: "text-blue-600", bg: "bg-blue-500/10",
    href: "https://developers.facebook.com/docs/whatsapp/business-management-api/get-started",
  },
  {
    step: "4", title: "Paste Credentials & Connect",
    desc: "Enter your WABA ID, Phone Number ID, and Access Token below. SmoothSales verifies with Meta and starts receiving messages via webhook.",
    Icon: Link2, color: "text-violet-600", bg: "bg-violet-500/10",
    href: null,
  },
];

const LEAD_CAPTURE_RULES = [
  { id: "lc1", label: "Auto-create lead from new number", desc: "Any new WhatsApp message from an unknown number creates a lead automatically", on: true },
  { id: "lc2", label: "Extract name from WhatsApp profile", desc: "Automatically save the contact's WhatsApp display name as lead name", on: true },
  { id: "lc3", label: "Tag source as 'WhatsApp Inbound'", desc: "All leads captured via WhatsApp are tagged with source = WhatsApp Inbound", on: true },
  { id: "lc4", label: "Extract budget from conversation", desc: "AI scans messages for budget mentions and saves to lead profile", on: false },
  { id: "lc5", label: "Notify assigned rep on new message", desc: "Send in-app notification when a lead sends a new WhatsApp message", on: true },
  { id: "lc6", label: "Auto-assign to round-robin", desc: "New WhatsApp leads are auto-assigned using distribution rules", on: false },
];

const AUTOMATION_RULES = [
  { id: "ar1", label: "Welcome message on first contact", desc: "Send a greeting when someone messages for the first time", on: true, trigger: "First Message" },
  { id: "ar2", label: "Follow-up after 24h no reply", desc: "Auto-send a follow-up if lead has not replied in 24 hours", on: false, trigger: "No Reply 24h" },
  { id: "ar3", label: "Re-engage after 7 days silence", desc: "Send a re-engagement message after 7 days of no activity", on: false, trigger: "Inactive 7d" },
  { id: "ar4", label: "Site visit confirmation message", desc: "Auto-send confirmation when a site visit is scheduled in CRM", on: true, trigger: "Visit Scheduled" },
  { id: "ar5", label: "AI Agent handles new inbound", desc: "AI Agent auto-replies to new WhatsApp leads, qualifies them, and hands off to your team", on: true, trigger: "AI Agent" },
];

// ── Sub-components ────────────────────────────────────────────────────────────

function RuleRow({ rule, checked, onChange, badge }) {
  return (
    <div className="flex items-start justify-between gap-4 p-3.5 rounded-xl border border-border bg-card hover:bg-muted/30 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="text-xs font-semibold text-foreground">{rule.label}</p>
          {badge && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
              {badge}
            </span>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground leading-relaxed">{rule.desc}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} className="shrink-0 mt-0.5" />
    </div>
  );
}

function MetaConnectForm({ onConnect, loading }) {
  const [phoneId, setPhoneId] = useState("");
  const [token, setToken] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [wabaId, setWabaId] = useState("");
  const [label, setLabel] = useState("");
  const canConnect = phoneId.trim().length > 5 && token.trim().length > 10 && wabaId.trim().length > 5;

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-2 p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
        <p className="text-[10.5px] text-emerald-700 leading-relaxed">
          Your WhatsApp Business App stays active on your phone. SmoothSales receives messages in parallel via Meta Cloud API.
        </p>
      </div>

      <div className="space-y-1.5">
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Account Label (optional)</p>
        <Input placeholder="e.g. SmoothSales Business" value={label} onChange={(e) => setLabel(e.target.value)} className="h-9 text-xs" />
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">WhatsApp Business Account ID</p>
          <a href="https://business.facebook.com/settings/whatsapp-business-accounts" target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary hover:underline flex items-center gap-0.5">
            Find it <ArrowUpRight className="h-2.5 w-2.5" />
          </a>
        </div>
        <Input placeholder="e.g. 123456789012345" value={wabaId} onChange={(e) => setWabaId(e.target.value)} className="h-9 text-xs font-mono" />
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Phone Number ID</p>
          <a href="https://developers.facebook.com/docs/whatsapp/cloud-api/get-started" target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary hover:underline flex items-center gap-0.5">
            Find it <ArrowUpRight className="h-2.5 w-2.5" />
          </a>
        </div>
        <Input placeholder="e.g. 987654321098765" value={phoneId} onChange={(e) => setPhoneId(e.target.value)} className="h-9 text-xs font-mono" />
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Permanent Access Token</p>
          <a href="https://developers.facebook.com/docs/whatsapp/business-management-api/get-started" target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary hover:underline flex items-center gap-0.5">
            How to get <ArrowUpRight className="h-2.5 w-2.5" />
          </a>
        </div>
        <div className="relative">
          <Input
            type={showToken ? "text" : "password"}
            placeholder="EAAxxxxxxxxxxxxxxx..."
            value={token}
            onChange={(e) => setToken(e.target.value)}
            className="h-9 text-xs font-mono pr-9"
          />
          <button type="button" onClick={() => setShowToken(!showToken)} className="absolute right-2.5 top-2 text-muted-foreground hover:text-foreground">
            {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <Button
        className="w-full h-9 text-xs gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold mt-1"
        disabled={!canConnect || loading}
        onClick={() => onConnect({ type: "meta", phoneId, token, wabaId, label: label.trim() || "Meta Cloud API" })}
      >
        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Link2 className="h-3.5 w-3.5" />}
        {loading ? "Verifying with Meta..." : "Connect via Meta Cloud API"}
      </Button>
    </div>
  );
}

function QrConnectForm({ onConnect, loading }) {
  const [step, setStep] = useState("info");
  const [phoneLabel, setPhoneLabel] = useState("");

  const handleScan = () => {
    setStep("scanning");
    setTimeout(() => setStep("scanned"), 2500);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-2 p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
        <p className="text-[10.5px] text-emerald-700 leading-relaxed">
          Your personal WhatsApp Business App connects via QR scan — just like WhatsApp Web. No API credentials needed.
        </p>
      </div>
      <div className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
        <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
        <p className="text-[10.5px] text-amber-700 leading-relaxed">
          Personal WA cannot send bulk campaigns or templates. Best for 1-on-1 conversations only.
        </p>
      </div>

      {step === "info" && (
        <>
          <div className="space-y-1.5">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Account Label</p>
            <Input placeholder="e.g. Aditya Personal WA" value={phoneLabel} onChange={(e) => setPhoneLabel(e.target.value)} className="h-9 text-xs" />
          </div>
          <Button className="w-full h-9 text-xs gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold" onClick={handleScan} disabled={!phoneLabel.trim()}>
            <QrCode className="h-3.5 w-3.5" /> Generate QR Code
          </Button>
        </>
      )}

      {step === "scanning" && (
        <div className="flex flex-col items-center gap-3 py-4">
          <div className="h-40 w-40 rounded-2xl border-2 border-dashed border-emerald-500/40 bg-emerald-500/5 flex items-center justify-center">
            <div className="space-y-1.5 text-center">
              <Loader2 className="h-8 w-8 text-emerald-500 animate-spin mx-auto" />
              <p className="text-[11px] text-muted-foreground">Generating QR...</p>
            </div>
          </div>
        </div>
      )}

      {step === "scanned" && (
        <div className="flex flex-col items-center gap-3 py-2">
          <div className="relative h-40 w-40 rounded-2xl border-2 border-emerald-500/40 bg-muted/30 flex items-center justify-center overflow-hidden">
            <div className="grid grid-cols-7 gap-0.5 p-3 opacity-80">
              {Array.from({ length: 49 }).map((_, i) => (
                <div key={i} className={`h-3.5 w-3.5 rounded-sm ${[0,1,2,3,4,5,6,7,13,14,20,21,27,28,34,35,41,42,43,44,45,46,48].includes(i) ? "bg-foreground" : "bg-transparent"}`} />
              ))}
            </div>
            <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm">
              <div className="text-center space-y-1">
                <QrCode className="h-8 w-8 text-emerald-500 mx-auto" />
                <p className="text-[10px] font-semibold text-foreground">Scan with WhatsApp</p>
              </div>
            </div>
          </div>
          <div className="text-center space-y-1">
            <p className="text-[11px] font-semibold text-foreground">Open WhatsApp → Linked Devices → Link a Device</p>
            <p className="text-[10px] text-muted-foreground">Scan the QR code above with your phone</p>
          </div>
          <Button
            className="w-full h-9 text-xs gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold"
            disabled={loading}
            onClick={() => onConnect({ type: "personal", label: phoneLabel })}
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
            {loading ? "Connecting..." : "I've Scanned — Connect"}
          </Button>
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function WhatsAppConnectPage() {
  const { accounts, addAccount, removeAccount } = useWaAccounts();
  const [selectedChannel, setSelectedChannel] = useState("meta");
  const [activeTab, setActiveTab] = useState("connect");
  const [connecting, setConnecting] = useState(false);
  const [templateSyncing, setTemplateSyncing] = useState(false);
  const [leadRules, setLeadRules] = useState(() =>
    Object.fromEntries(LEAD_CAPTURE_RULES.map((r) => [r.id, r.on]))
  );
  const [autoRules, setAutoRules] = useState(() =>
    Object.fromEntries(AUTOMATION_RULES.map((r) => [r.id, r.on]))
  );

  const hasAnyAccount = accounts.length > 0;

  const handleConnect = async (data) => {
    setConnecting(true);
    try {
      await addAccount(data);
      toast.success(
        data.type === "meta" ? "Meta Cloud API connected!" : "Personal WhatsApp connected!",
        { description: "You can now send and receive WhatsApp messages." }
      );
      setActiveTab("settings");
    } catch {
      toast.error("Connection failed. Please check your credentials.");
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async (id, label) => {
    await removeAccount(id);
    toast.success(`"${label}" disconnected`);
  };

  const handleSyncTemplates = async () => {
    if (!isApiMode()) { toast.info("Template sync requires API mode"); return; }
    setTemplateSyncing(true);
    try {
      await whatsappTemplatesApi.syncAll();
      toast.success("Templates synced from Meta");
    } catch {
      toast.error("Template sync failed");
    } finally {
      setTemplateSyncing(false);
    }
  };

  const TABS = [
    { key: "connect", label: "Connect Account" },
    { key: "settings", label: "Lead Capture" },
    { key: "automation", label: "Automation" },
    { key: "setup", label: "Setup Guide" },
  ];

  return (
    <div className="flex flex-col h-full min-h-0 bg-background">

      {/* Top Bar */}
      <div className="shrink-0 flex items-center justify-between gap-4 px-6 py-3 border-b border-border bg-card">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="h-8 w-8 rounded-lg bg-emerald-500 flex items-center justify-center shrink-0">
            <MessageCircle className="h-4 w-4 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-bold text-foreground leading-tight">WhatsApp Connect</h1>
            <p className="text-[11px] text-muted-foreground">Connect your WhatsApp account to SmoothSales CRM</p>
          </div>
        </div>
        {hasAnyAccount && (
          <span className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full shrink-0">
            <CheckCircle2 className="h-3 w-3" />
            {accounts.length} account{accounts.length > 1 ? "s" : ""} connected
          </span>
        )}
      </div>

      {/* Tab Bar */}
      <div className="shrink-0 flex items-center px-6 border-b border-border bg-card/50">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === tab.key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">

        {/* ── Connect Tab ── */}
        {activeTab === "connect" && (
          <div className="max-w-4xl mx-auto px-6 py-6 space-y-6">

            {/* Connected accounts list */}
            {hasAnyAccount && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Connected Accounts</p>
                <div className="space-y-2">
                  {accounts.map((acc) => {
                    const badge = CHANNEL_BADGE[acc.type];
                    return (
                      <div key={acc.id} className="flex items-center gap-3 p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/5">
                        <div className="h-9 w-9 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                          {acc.type === "meta" ? <Globe className="h-4 w-4 text-emerald-600" /> : <Smartphone className="h-4 w-4 text-emerald-600" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-xs font-semibold text-foreground">{acc.label}</p>
                            {badge && (
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${badge.cls}`}>{badge.label}</span>
                            )}
                            <span className="flex items-center gap-1 text-[9px] font-semibold text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-full">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />Active
                            </span>
                          </div>
                          <p className="text-[10.5px] text-muted-foreground mt-0.5">
                            Connected {acc.connectedAt}{acc.number ? ` · ${acc.number}` : ""}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {acc.type === "meta" && (
                            <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5" onClick={handleSyncTemplates} disabled={templateSyncing}>
                              <RefreshCw className={`h-3 w-3 ${templateSyncing ? "animate-spin" : ""}`} />
                              {templateSyncing ? "Syncing..." : "Sync Templates"}
                            </Button>
                          )}
                          <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5 text-red-500 hover:text-red-600 hover:border-red-300" onClick={() => handleDisconnect(acc.id, acc.label)}>
                            <Unlink className="h-3 w-3" />Disconnect
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Channel type selector */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Add New Account</p>
              <div className="grid grid-cols-2 gap-3">
                {CHANNEL_TYPES.map((ch) => (
                  <button
                    key={ch.id}
                    onClick={() => setSelectedChannel(ch.id)}
                    className={`relative flex flex-col gap-3 p-4 rounded-xl border text-left transition-all ${
                      selectedChannel === ch.id ? `${ch.border} ${ch.bg} shadow-sm` : "border-border hover:bg-muted/20"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className={`h-9 w-9 rounded-lg ${ch.bg} flex items-center justify-center`}>
                        <ch.Icon className={`h-4 w-4 ${ch.color}`} />
                      </div>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${ch.badgeCls}`}>{ch.badge}</span>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-foreground">{ch.label}</p>
                      <p className="text-[10.5px] text-muted-foreground mt-0.5 leading-relaxed">{ch.sub}</p>
                    </div>
                    <ul className="space-y-1">
                      {ch.features.map((f) => (
                        <li key={f} className="flex items-center gap-1.5 text-[10.5px] text-muted-foreground">
                          <Check className={`h-3 w-3 shrink-0 ${ch.color}`} />{f}
                        </li>
                      ))}
                    </ul>
                    {selectedChannel === ch.id && (
                      <div className={`absolute top-3 right-3 h-4 w-4 rounded-full ${ch.bg} border-2 ${ch.border} flex items-center justify-center`}>
                        <Check className={`h-2.5 w-2.5 ${ch.color}`} />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Connect form */}
            <div className="rounded-xl border border-border bg-card p-5">
              <p className="text-xs font-bold text-foreground mb-4">
                {selectedChannel === "meta" ? "Meta Cloud API Credentials" : "Personal WhatsApp QR Connect"}
              </p>
              {selectedChannel === "meta"
                ? <MetaConnectForm onConnect={handleConnect} loading={connecting} />
                : <QrConnectForm onConnect={handleConnect} loading={connecting} />
              }
            </div>
          </div>
        )}

        {/* ── Lead Capture Tab ── */}
        {activeTab === "settings" && (
          <div className="max-w-2xl mx-auto px-6 py-6 space-y-4">
            <div>
              <p className="text-sm font-bold text-foreground">Lead Capture Rules</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Configure how inbound WhatsApp messages create and update leads</p>
            </div>
            <div className="space-y-2">
              {LEAD_CAPTURE_RULES.map((rule) => (
                <RuleRow key={rule.id} rule={rule} checked={leadRules[rule.id]} onChange={(v) => setLeadRules((p) => ({ ...p, [rule.id]: v }))} />
              ))}
            </div>
            <Button size="sm" className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5" onClick={() => toast.success("Lead capture settings saved")}>
              <Check className="h-3.5 w-3.5" /> Save Settings
            </Button>
          </div>
        )}

        {/* ── Automation Tab ── */}
        {activeTab === "automation" && (
          <div className="max-w-2xl mx-auto px-6 py-6 space-y-4">
            <div>
              <p className="text-sm font-bold text-foreground">Automation Rules</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Auto-send messages based on lead activity and CRM events</p>
            </div>
            <div className="space-y-2">
              {AUTOMATION_RULES.map((rule) => (
                <RuleRow key={rule.id} rule={rule} checked={autoRules[rule.id]} onChange={(v) => setAutoRules((p) => ({ ...p, [rule.id]: v }))} badge={rule.trigger} />
              ))}
            </div>
            <Button size="sm" className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5" onClick={() => toast.success("Automation rules saved")}>
              <Check className="h-3.5 w-3.5" /> Save Rules
            </Button>
          </div>
        )}

        {/* ── Setup Guide Tab ── */}
        {activeTab === "setup" && (
          <div className="max-w-2xl mx-auto px-6 py-6 space-y-4">
            <div>
              <p className="text-sm font-bold text-foreground">Meta Cloud API Setup Guide</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Follow these steps to connect your WhatsApp Business number</p>
            </div>
            <div className="space-y-3">
              {SETUP_STEPS.map((s) => (
                <div key={s.step} className="flex gap-3.5 p-4 rounded-xl border border-border bg-card">
                  <div className={`h-9 w-9 rounded-lg ${s.bg} flex items-center justify-center shrink-0`}>
                    <s.Icon className={`h-4 w-4 ${s.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded">Step {s.step}</span>
                      <p className="text-xs font-semibold text-foreground">{s.title}</p>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">{s.desc}</p>
                    {s.href && (
                      <a href={s.href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[10.5px] text-primary hover:underline mt-1.5">
                        Open in Meta <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-blue-500/5 border border-blue-500/20">
              <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-blue-700">Webhook URL</p>
                <p className="text-[10.5px] text-blue-600 mt-0.5">Set this as your Meta webhook callback URL:</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <code className="text-[10px] font-mono bg-blue-500/10 px-2 py-1 rounded text-blue-700 flex-1 truncate">
                    {(process.env.NEXT_PUBLIC_API_URL || "https://your-api.com/api").replace("/api", "")}/api/whatsapp/webhook
                  </code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`${(process.env.NEXT_PUBLIC_API_URL || "https://your-api.com/api").replace("/api", "")}/api/whatsapp/webhook`);
                      toast.success("Webhook URL copied");
                    }}
                    className="text-blue-600 hover:text-blue-700 shrink-0"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
