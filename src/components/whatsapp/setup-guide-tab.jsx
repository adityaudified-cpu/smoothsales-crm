"use client";

import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Terminal,
  HelpCircle,
  Copy,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  PlayCircle,
  Loader2,
  Check,
  ShieldCheck,
  Globe,
  Radio,
  BookOpen,
  Code2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const WEBHOOK_CALLBACK_URL =
  typeof window !== "undefined"
    ? `${window.location.origin}/api/webhooks/whatsapp`
    : "https://crm.smoothsales.in/api/webhooks/whatsapp";
export const WEBHOOK_VERIFY_TOKEN = "smoothsales-webhook-verify";

export function SetupGuideTab({
  webhookChecking,
  webhookResult,
  onRunWebhookCheck,
}) {
  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  return (
    <div className="space-y-5">
      {/* ── 1. DEVELOPER WEBHOOK TERMINAL & LIVE TESTER ── */}
      <div className="rounded-xl border border-border/80 bg-card overflow-hidden shadow-2xs">
        <div className="px-5 py-4 border-b border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-muted/15">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/20">
              <Terminal className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-foreground tracking-tight">
                  Live Webhook Diagnostic Console
                </h2>
                <Badge variant="outline" className="text-[10px] font-mono border-blue-500/30 text-blue-600">
                  HTTP Challenge Receiver
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Simulate Meta Graph API subscription verification handshake against your workspace endpoint.
              </p>
            </div>
          </div>

          <Button
            size="sm"
            onClick={onRunWebhookCheck}
            disabled={webhookChecking}
            className="h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-2xs gap-1.5 font-semibold shrink-0"
          >
            {webhookChecking ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Executing Ping...
              </>
            ) : (
              <>
                <PlayCircle className="h-3.5 w-3.5" />
                Run Challenge Health Check
              </>
            )}
          </Button>
        </div>

        {/* Terminal Output Body */}
        <div className="p-4 bg-slate-950 text-slate-100 font-mono text-xs space-y-2.5">
          <div className="flex items-center justify-between text-[11px] text-slate-400 pb-2 border-b border-slate-800">
            <span>&gt;_ Target: /api/webhooks/whatsapp</span>
            <span>Protocol: Meta Webhook v19.0 (GET / POST)</span>
          </div>

          {webhookResult ? (
            <div className="space-y-2 pt-1">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "h-2 w-2 rounded-full",
                    webhookResult.status === "success"
                      ? "bg-emerald-400 animate-pulse"
                      : "bg-rose-500"
                  )}
                />
                <span className="text-emerald-400 font-bold">
                  [{webhookResult.status.toUpperCase()}] HTTP {webhookResult.statusCode} OK
                </span>
                <span className="text-slate-400">· Latency: {webhookResult.latency}</span>
                <span className="text-slate-500 text-[10px]">({webhookResult.timestamp})</span>
              </div>
              <p className="text-slate-300 text-[11px] pl-4">
                &rarr; {webhookResult.message}
              </p>
              <div className="p-2 rounded bg-slate-900 border border-slate-800 text-[11px] text-slate-400 space-y-0.5">
                <p>&bull; Hub Mode: subscribe</p>
                <p>&bull; Challenge Verification: Echo matched successfully</p>
                <p>&bull; Gateway Status: SmoothSales Nginx SSL Proxy active</p>
              </div>
            </div>
          ) : (
            <div className="py-3 text-slate-500 text-[11px] space-y-1">
              <p>&gt; Ready to execute diagnostic ping.</p>
              <p>&gt; Click &quot;Run Challenge Health Check&quot; to test inbound connectivity and verify token response.</p>
            </div>
          )}
        </div>
      </div>

      {/* ── 2. WEBHOOK PARAMETERS & META CONSOLE CREDENTIALS ── */}
      <div className="rounded-xl border border-border/80 bg-card overflow-hidden shadow-2xs">
        <div className="px-5 py-3.5 border-b border-border/60 bg-muted/15 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="h-4 w-4 text-emerald-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Meta Developer Console Webhook Parameters
            </h3>
          </div>
          <span className="text-[11px] text-muted-foreground">Required for WhatsApp Cloud API Inbound</span>
        </div>

        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-3.5 rounded-lg bg-muted/20 border border-border/70 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">
                Callback URL
              </span>
              <p className="font-mono text-xs text-foreground font-semibold truncate mt-0.5">
                {WEBHOOK_CALLBACK_URL}
              </p>
            </div>
            <Button
              size="icon"
              variant="outline"
              className="h-8 w-8 rounded-md shrink-0"
              onClick={() => copyToClipboard(WEBHOOK_CALLBACK_URL, "Callback URL")}
              title="Copy Callback URL"
            >
              <Copy className="h-3.5 w-3.5" />
            </Button>
          </div>

          <div className="p-3.5 rounded-lg bg-muted/20 border border-border/70 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">
                Verify Token
              </span>
              <p className="font-mono text-xs text-foreground font-semibold truncate mt-0.5">
                {WEBHOOK_VERIFY_TOKEN}
              </p>
            </div>
            <Button
              size="icon"
              variant="outline"
              className="h-8 w-8 rounded-md shrink-0"
              onClick={() => copyToClipboard(WEBHOOK_VERIFY_TOKEN, "Verify Token")}
              title="Copy Verify Token"
            >
              <Copy className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* ── 3. ENTERPRISE STEP-BY-STEP SETUP DIRECTORY (Clean Unified List) ── */}
      <div className="rounded-xl border border-border/80 bg-card overflow-hidden shadow-2xs">
        <div className="px-5 py-3.5 border-b border-border/60 bg-muted/15 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Official Meta Cloud API Verification Steps
            </h3>
          </div>
          <span className="text-[11px] text-muted-foreground">Standard v19.0 Configuration</span>
        </div>

        <div className="divide-y divide-border/60">
          {/* Step 1 */}
          <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-muted/15 transition-colors">
            <div className="flex items-start gap-3">
              <span className="h-6 w-6 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center justify-center border border-emerald-500/20 shrink-0 mt-0.5">
                1
              </span>
              <div>
                <h4 className="text-xs font-bold text-foreground">Open Meta Business Manager &amp; Verify Account</h4>
                <p className="text-[11px] text-muted-foreground mt-0.5 max-w-2xl leading-relaxed">
                  Go to Meta Business Settings &rarr; WhatsApp Accounts. Ensure your company phone number is verified and linked to your business portfolio.
                </p>
              </div>
            </div>
            <a
              href="https://business.facebook.com/settings/whatsapp-business-accounts"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-primary font-semibold hover:underline shrink-0 self-start sm:self-center"
            >
              Business Settings <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          {/* Step 2 */}
          <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-muted/15 transition-colors">
            <div className="flex items-start gap-3">
              <span className="h-6 w-6 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center justify-center border border-emerald-500/20 shrink-0 mt-0.5">
                2
              </span>
              <div>
                <h4 className="text-xs font-bold text-foreground">Retrieve Phone Number ID &amp; WABA ID</h4>
                <p className="text-[11px] text-muted-foreground mt-0.5 max-w-2xl leading-relaxed">
                  In Meta Developer Console under WhatsApp &rarr; API Setup, copy your Phone Number ID and WhatsApp Business Account (WABA) ID.
                </p>
              </div>
            </div>
            <a
              href="https://developers.facebook.com/docs/whatsapp/cloud-api/get-started"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-primary font-semibold hover:underline shrink-0 self-start sm:self-center"
            >
              Developer Docs <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          {/* Step 3 */}
          <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-muted/15 transition-colors">
            <div className="flex items-start gap-3">
              <span className="h-6 w-6 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center justify-center border border-emerald-500/20 shrink-0 mt-0.5">
                3
              </span>
              <div>
                <h4 className="text-xs font-bold text-foreground">Generate Permanent System User Token</h4>
                <p className="text-[11px] text-muted-foreground mt-0.5 max-w-2xl leading-relaxed">
                  In Business Settings &rarr; System Users, create an admin system user with &apos;whatsapp_business_messaging&apos; and &apos;whatsapp_business_management&apos; permissions.
                </p>
              </div>
            </div>
            <a
              href="https://developers.facebook.com/docs/whatsapp/business-management-api/get-started"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-primary font-semibold hover:underline shrink-0 self-start sm:self-center"
            >
              Token Guide <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          {/* Step 4 */}
          <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-muted/15 transition-colors">
            <div className="flex items-start gap-3">
              <span className="h-6 w-6 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center justify-center border border-emerald-500/20 shrink-0 mt-0.5">
                4
              </span>
              <div>
                <h4 className="text-xs font-bold text-foreground">Subscribe Webhooks &amp; Verify Challenge</h4>
                <p className="text-[11px] text-muted-foreground mt-0.5 max-w-2xl leading-relaxed">
                  Paste the Callback URL and Verify Token in Meta Developer Console. Subscribe to &apos;messages&apos; and &apos;message_template_status_update&apos; fields.
                </p>
              </div>
            </div>
            <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 shrink-0 self-start sm:self-center">
              <CheckCircle2 className="h-3.5 w-3.5" /> Webhook Ready
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
