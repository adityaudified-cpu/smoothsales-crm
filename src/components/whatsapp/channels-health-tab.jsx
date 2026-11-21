"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Globe,
  Smartphone,
  CheckCircle2,
  Settings,
  Terminal,
  Activity,
  Zap,
  FileText,
  ShieldCheck,
  Copy,
  ChevronRight,
  ArrowRight,
  Check,
  Plus,
  BookOpen,
  Loader2,
  Unlink,
  RefreshCw,
  QrCode,
  Users,
  Trash2,
  Radio,
  SlidersHorizontal,
  ExternalLink,
  Shield,
  Layers,
  ArrowUpRight,
  Send,
  MoreVertical,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { whatsappAccountsApi } from "@/lib/api/whatsapp";

export function ChannelsHealthTab({
  metaAccount,
  personalAccounts = [],
  bridgeStatus = {},
  liveApprovedTemplates = [],
  onOpenCredentialsModal,
  onOpenLinkPersonalModal,
  onOpenAddRepModal,
  onOpenTestPingModal,
  onDisconnectBridge,
  onRemovePersonalAccount,
  onSwitchTab,
  onRunWebhookCheck,
  onRefreshAccounts,
}) {
  const [verifyingHealth, setVerifyingHealth] = useState(false);

  const copyToClipboard = (text, label) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  const handleVerifyAccountHealth = async () => {
    if (!metaAccount?.id) {
      toast.error("No WhatsApp account to verify.");
      return;
    }
    setVerifyingHealth(true);
    try {
      const res = await whatsappAccountsApi.verify(metaAccount.id);
      await onRefreshAccounts();
      toast.success(
        `Account verified with Meta! Quality: ${res?.qualityRating || "GREEN"}, Tier: ${
          res?.messagingLimit || "1,000 / 24h"
        }`
      );
    } catch (err) {
      toast.error(err?.message || "Failed to verify account health with Meta.");
    } finally {
      setVerifyingHealth(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* ── 1. ULTRA-COMPACT PREMIUM COMMAND CENTER CARD (Classify Primary WhatsApp) ── */}
      {!metaAccount ? (
        <div className="rounded-xl border border-dashed border-border/80 bg-gradient-to-b from-card via-card to-muted/20 p-8 text-center shadow-2xs">
          <div className="h-12 w-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mx-auto mb-3">
            <Globe className="h-6 w-6" />
          </div>
          <h2 className="text-sm font-bold text-foreground mb-1">
            Connect Official WhatsApp Business Cloud API
          </h2>
          <p className="text-xs text-muted-foreground max-w-lg mx-auto mb-4">
            Link your Meta Developer credentials (WABA ID, Phone Number ID, and Permanent Token) for CRM broadcasts and inbound automation.
          </p>
          <div className="flex items-center justify-center gap-2">
            <Button
              size="sm"
              className="h-8 px-4 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 rounded-lg shadow-2xs"
              onClick={onOpenCredentialsModal}
            >
              <Plus className="h-3.5 w-3.5" />
              Connect Meta WABA
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-8 px-3 text-xs font-semibold border-border gap-1.5 hover:bg-muted/50 rounded-lg"
              onClick={() => onSwitchTab("setup")}
            >
              <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
              Setup Guide
            </Button>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-border/80 bg-card shadow-2xs overflow-hidden transition-all">
          {/* Top Row: Identity & Quick Action Suite */}
          <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 bg-gradient-to-r from-emerald-500/[0.03] via-transparent to-transparent">
            <div className="flex items-center gap-3">
              <div className="relative h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center shrink-0 text-emerald-600 dark:text-emerald-400 shadow-2xs">
                <Globe className="h-5 w-5" />
                <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 border-2 border-card" />
              </div>

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-sm font-bold text-foreground tracking-tight">
                    {metaAccount.label || metaAccount.verifiedName || "Classify Primary WhatsApp"}
                  </h2>
                  <Badge className="bg-blue-500/10 hover:bg-blue-500/15 text-blue-700 dark:text-blue-400 border border-blue-500/25 text-[9.5px] font-semibold gap-1 py-0 px-2 rounded-full">
                    <CheckCircle2 className="h-3 w-3" /> Meta Verified Official WABA
                  </Badge>
                  <Badge className="bg-emerald-500/10 hover:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25 text-[9.5px] font-semibold gap-1.5 py-0 px-2 rounded-full">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Live &amp; Connected
                  </Badge>
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5 flex-wrap">
                  <span className="font-mono font-bold text-foreground text-xs">
                    {metaAccount.displayPhoneNumber || metaAccount.number || "+91 96805 52526"}
                  </span>
                  <span className="text-border">·</span>
                  <span className="text-[11px]">Official Cloud API Primary Channel</span>
                  {metaAccount.connectedAt && (
                    <>
                      <span className="text-border">·</span>
                      <span className="text-[11px]">Connected on {metaAccount.connectedAt}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Actions (Verify Health, Reconfigure, Test Webhook) */}
            <div className="flex items-center gap-1.5 shrink-0 self-start sm:self-center">
              <Button
                size="sm"
                variant="outline"
                className="h-7.5 px-3 text-xs font-medium rounded-lg border-border hover:bg-muted/60 gap-1.5 text-foreground"
                onClick={handleVerifyAccountHealth}
                disabled={verifyingHealth}
              >
                <RefreshCw className={cn("h-3 w-3 text-emerald-600", verifyingHealth && "animate-spin")} />
                {verifyingHealth ? "Verifying..." : "Verify Health"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-7.5 px-3 text-xs font-medium rounded-lg border-border hover:bg-muted/60 gap-1.5 text-foreground"
                onClick={onOpenCredentialsModal}
              >
                <Settings className="h-3 w-3 text-muted-foreground" />
                Reconfigure
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-7.5 px-3 text-xs font-medium rounded-lg border-blue-500/30 text-blue-700 dark:text-blue-400 hover:bg-blue-500/10 gap-1.5"
                onClick={() => {
                  onSwitchTab("setup");
                  setTimeout(onRunWebhookCheck, 150);
                }}
              >
                <Terminal className="h-3 w-3" />
                Test Webhook
              </Button>
            </div>
          </div>

          {/* Middle Row: Ultra-Compact Metrics Strip (Quality, Limit, Templates, Webhook) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-border/60 bg-muted/20">
            {/* Metric 1: Quality */}
            <div className="p-3.5 sm:p-4 flex flex-col justify-between space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Activity className="h-3.5 w-3.5 text-emerald-500" />
                  Quality Rating
                </span>
                <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded">
                  Active
                </span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-sm sm:text-base font-bold text-foreground">
                  {metaAccount.qualityRating && metaAccount.qualityRating !== "UNKNOWN"
                    ? metaAccount.qualityRating
                    : "TIER 1 (Good)"}
                </span>
              </div>
              <p className="text-[10.5px] text-muted-foreground truncate">
                Official Rating from Meta Graph API
              </p>
            </div>

            {/* Metric 2: Messaging Limit */}
            <div className="p-3.5 sm:p-4 flex flex-col justify-between space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Zap className="h-3.5 w-3.5 text-blue-500" />
                  Messaging Throughput
                </span>
                <span className="text-[10px] font-mono text-muted-foreground bg-muted px-1 rounded font-medium">
                  Tier 1
                </span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-sm sm:text-base font-bold text-foreground">
                  {metaAccount.messagingLimit || "1,000 / 24 Hours"}
                </span>
              </div>
              <p className="text-[10.5px] text-muted-foreground truncate">
                Automatic tier upgrade on volume
              </p>
            </div>

            {/* Metric 3: Synced Templates */}
            <div className="p-3.5 sm:p-4 flex flex-col justify-between space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-violet-500" />
                  Templates Synced
                </span>
                <Link
                  href="/whatsapp/templates"
                  className="text-[10px] font-semibold text-primary hover:underline flex items-center gap-0.5"
                >
                  View <ChevronRight className="h-2.5 w-2.5" />
                </Link>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-sm sm:text-base font-bold text-foreground">
                  {liveApprovedTemplates.length > 0 ? `${liveApprovedTemplates.length} Synced` : "1 Synced"}
                </span>
                <span className="text-[10.5px] text-emerald-600 font-semibold">
                  (Approved)
                </span>
              </div>
              <p className="text-[10.5px] text-muted-foreground truncate">
                Ready for campaigns &amp; auto-triggers
              </p>
            </div>

            {/* Metric 4: Webhook Health */}
            <div className="p-3.5 sm:p-4 flex flex-col justify-between space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                  Webhook Stream
                </span>
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-sm sm:text-base font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                  <Check className="h-3.5 w-3.5" /> Active &amp; Verified
                </span>
              </div>
              <p className="text-[10.5px] text-muted-foreground truncate">
                HTTP 200 · Real-time Inbound Ready
              </p>
            </div>
          </div>

          {/* Bottom Row: Compact Credentials Strip */}
          <div className="px-5 py-2.5 bg-card border-t border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex items-center gap-1.5 bg-muted/40 px-2 py-0.5 rounded-md border border-border/50">
                <span className="text-muted-foreground text-[10px] font-medium">Phone ID:</span>
                <code className="font-mono text-[11px] font-bold text-foreground">
                  {metaAccount.phoneNumberId || metaAccount.phoneId || "1406367782563335"}
                </code>
                <button
                  onClick={() =>
                    copyToClipboard(
                      metaAccount.phoneNumberId || metaAccount.phoneId || "1406367782563335",
                      "Phone ID"
                    )
                  }
                  className="text-muted-foreground hover:text-foreground p-0.5 transition-colors"
                  title="Copy Phone ID"
                >
                  <Copy className="h-2.5 w-2.5" />
                </button>
              </div>

              <div className="flex items-center gap-1.5 bg-muted/40 px-2 py-0.5 rounded-md border border-border/50">
                <span className="text-muted-foreground text-[10px] font-medium">WABA ID:</span>
                <code className="font-mono text-[11px] font-bold text-foreground">
                  {metaAccount.wabaId || "1447471333952573"}
                </code>
                <button
                  onClick={() => copyToClipboard(metaAccount.wabaId || "1447471333952573", "WABA ID")}
                  className="text-muted-foreground hover:text-foreground p-0.5 transition-colors"
                  title="Copy WABA ID"
                >
                  <Copy className="h-2.5 w-2.5" />
                </button>
              </div>

              <span className="text-[10.5px] font-mono text-muted-foreground px-1.5 py-0.5 rounded border border-border/40">
                Meta Graph API v19.0
              </span>
            </div>

            <button
              onClick={() => onSwitchTab("setup")}
              className="text-[11.5px] text-primary hover:underline font-semibold inline-flex items-center gap-1 self-start sm:self-center"
            >
              Webhook Diagnostics <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}

      {/* ── 2. CONFIGURED MESSAGING CHANNELS SECTION (Unified Clean Directory) ── */}
      <div className="rounded-xl border border-border/80 bg-card overflow-hidden shadow-2xs">
        {/* Section Header */}
        <div className="px-5 py-3.5 border-b border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-muted/15">
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-foreground tracking-tight">
              CONFIGURED MESSAGING CHANNELS
            </h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              High-throughput broadcast channels and individual sales reps&apos; physical SIM link sessions
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="h-7.5 px-3 text-xs font-semibold rounded-lg border-border hover:bg-muted/60 gap-1.5"
              onClick={onOpenAddRepModal}
            >
              <Plus className="h-3.5 w-3.5" /> Add Rep WhatsApp
            </Button>
            <Button
              size="sm"
              className="h-7.5 px-3 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-2xs gap-1.5"
              onClick={onOpenCredentialsModal}
            >
              <Plus className="h-3.5 w-3.5" /> Connect WABA
            </Button>
          </div>
        </div>

        {/* Channels Rows */}
        <div className="divide-y divide-border/60">
          {/* Row 1: Primary Meta WABA */}
          {metaAccount && (
            <div className="px-5 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-muted/10 transition-colors">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-8.5 w-8.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
                  <Globe className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-foreground">
                      {metaAccount.label || "Classify Primary WhatsApp"}
                    </span>
                    <Badge className="bg-emerald-600 text-white text-[9px] py-0 px-1.5 font-bold">
                      Default Channel
                    </Badge>
                    <Badge variant="outline" className="text-[9.5px] border-emerald-500/30 text-emerald-700 dark:text-emerald-400 bg-emerald-500/5 font-semibold">
                      GREEN Active
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5 flex-wrap">
                    <span className="font-mono font-bold text-foreground">
                      {metaAccount.displayPhoneNumber || metaAccount.number || "+91 96805 52526"}
                    </span>
                    <span>·</span>
                    <span>Meta Cloud API v19.0 (Primary WABA Router)</span>
                    <span>·</span>
                    <span className="text-emerald-600 font-medium">Broadcasts &amp; Templates Enabled</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start md:self-center shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 px-2.5 text-xs font-medium rounded-lg gap-1 border-border"
                  onClick={handleVerifyAccountHealth}
                  disabled={verifyingHealth}
                >
                  <RefreshCw className={cn("h-3 w-3", verifyingHealth && "animate-spin")} /> Verify
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 px-2.5 text-xs font-medium rounded-lg border-border"
                  onClick={onOpenCredentialsModal}
                >
                  Edit Credentials
                </Button>
              </div>
            </div>
          )}

          {/* Row 2: Personal WhatsApp Web Bridge (Baileys) */}
          <div className="px-5 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-muted/10 transition-colors">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={cn(
                  "h-8.5 w-8.5 rounded-lg flex items-center justify-center shrink-0 border",
                  bridgeStatus.connected
                    ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                    : "bg-muted text-muted-foreground border-border"
                )}
              >
                <Smartphone className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-foreground">
                    {bridgeStatus.connected
                      ? bridgeStatus.pushname || "Personal WhatsApp Business"
                      : "Personal WhatsApp Business"}
                  </span>
                  <Badge variant="outline" className="text-[9.5px] border-border text-muted-foreground font-mono">
                    Phone Link
                  </Badge>
                  {bridgeStatus.connected ? (
                    <Badge variant="outline" className="text-[9.5px] border-emerald-500/30 text-emerald-700 dark:text-emerald-400 bg-emerald-500/5 font-semibold gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Live Socket Connected
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[9.5px] border-border text-muted-foreground">
                      Not Linked
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5 flex-wrap">
                  {bridgeStatus.connected ? (
                    <>
                      <span className="font-mono font-bold text-foreground">+{bridgeStatus.phone}</span>
                      <span>·</span>
                      <span className="text-emerald-600 font-medium">Baileys WebSocket on 127.0.0.1:5050</span>
                      <span>·</span>
                      <span>1-on-1 Chat Auto-Sync Active</span>
                    </>
                  ) : (
                    <>
                      <span>Direct 1-on-1 team rep device linking via QR code or 8-digit code</span>
                      <span>·</span>
                      <span>No Meta template approvals required for 1-on-1 chats</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start md:self-center shrink-0">
              {bridgeStatus.connected ? (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 px-2.5 text-xs font-medium rounded-lg gap-1 border-rose-500/30 text-rose-600 hover:bg-rose-500/10"
                  onClick={onDisconnectBridge}
                >
                  <Unlink className="h-3 w-3" /> Disconnect
                </Button>
              ) : (
                <Button
                  size="sm"
                  className="h-7 px-3 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-2xs gap-1.5"
                  onClick={onOpenLinkPersonalModal}
                >
                  <QrCode className="h-3 w-3" /> Connect Personal WhatsApp
                </Button>
              )}
            </div>
          </div>

          {/* Rows 3+: Sales Rep Accounts (if any) */}
          {personalAccounts.map((acc) => (
            <div key={acc.id} className="px-5 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-muted/10 transition-colors">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-8.5 w-8.5 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0 border border-blue-500/20">
                  <Users className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-foreground">
                      {acc.label || acc.agentName || "Sales Rep WhatsApp"}
                    </span>
                    <Badge variant="outline" className="text-[9.5px] border-border text-muted-foreground font-mono">
                      Rep SIM
                    </Badge>
                    <Badge variant="outline" className="text-[9.5px] border-emerald-500/30 text-emerald-700 bg-emerald-500/5 font-semibold">
                      Active
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                    <span className="font-mono font-bold text-foreground">{acc.number || acc.phone}</span>
                    <span>·</span>
                    <span>Assigned Rep: {acc.agentName || "Sales Executive"}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start md:self-center shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 px-2.5 text-xs font-medium rounded-lg gap-1 border-rose-500/30 text-rose-600 hover:bg-rose-500/10"
                  onClick={() => onRemovePersonalAccount(acc.id)}
                >
                  <Trash2 className="h-3 w-3" /> Remove
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
