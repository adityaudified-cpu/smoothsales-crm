"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, ExternalLink, Key, Loader2, Eye, EyeOff, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { integrationsApi } from "@/lib/api/integrations";

const GOOGLE_ADS_WEBHOOK = `${process.env.NEXT_PUBLIC_API_URL || "https://api.smoothsales.in/api"}/webhooks/google-ads`;

export function GoogleAdsModal({ open, onClose, onSaved }) {
  const [tab, setTab] = useState("setup");
  const [saving, setSaving] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [showRefresh, setShowRefresh] = useState(false);

  const [form, setForm] = useState({
    developerToken: "",
    clientId: "",
    clientSecret: "",
    refreshToken: "",
    customerId: "",
  });

  useEffect(() => {
    if (!open) return;
    integrationsApi.getByKey("google_ads").then((cfg) => {
      if (cfg?.configJson) {
        try {
          const c = typeof cfg.configJson === "string" ? JSON.parse(cfg.configJson) : cfg.configJson;
          setForm((prev) => ({ ...prev, ...c }));
        } catch {}
      }
    }).catch(() => {});
  }, [open]);

  const handleSave = async () => {
    if (!form.developerToken) {
      toast.error("Developer Token is required");
      return;
    }
    setSaving(true);
    try {
      await integrationsApi.save("google_ads", {
        displayName: "Google Ads Lead Form Extensions",
        category: "Advertising",
        enabled: true,
        config: form,
      });
      toast.success("Google Ads integration saved");
      onSaved?.();
    } catch (e) {
      toast.error("Failed to save", { description: e.message });
    } finally {
      setSaving(false);
    }
  };

  const copy = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-red-500 flex items-center justify-center shrink-0">
              <span className="text-white font-bold text-sm">G</span>
            </div>
            <div>
              <DialogTitle className="text-base font-bold">Google Ads Lead Form Extensions</DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">Capture leads from Google Search & YouTube ads</p>
            </div>
          </div>
        </DialogHeader>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="w-full rounded-none border-b border-border bg-transparent h-auto p-0">
            {["setup", "webhook", "offline-conversions"].map((t) => (
              <TabsTrigger key={t} value={t} className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent text-xs py-3 capitalize">
                {t.replace("-", " ")}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* ── Setup ── */}
          <TabsContent value="setup" className="p-6 space-y-5">
            <div className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 p-4">
              <p className="text-xs font-semibold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5" /> Prerequisites
              </p>
              <ul className="mt-2 space-y-1">
                {[
                  "Apply for Google Ads API access (developer token)",
                  "Create OAuth 2.0 credentials in Google Cloud Console",
                  "Enable Google Ads API in your Cloud project",
                ].map((s, i) => (
                  <li key={i} className="text-xs text-amber-700 dark:text-amber-400 flex items-start gap-1.5">
                    <span className="mt-0.5">•</span>{s}
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Developer Token <span className="text-destructive">*</span></Label>
              <Input
                type="password"
                placeholder="ABcDeFgHiJkLmNoPqRsTuVwXyZ"
                value={form.developerToken}
                onChange={(e) => setForm((f) => ({ ...f, developerToken: e.target.value }))}
                className="h-9 text-sm font-mono"
              />
              <p className="text-[10px] text-muted-foreground">Google Ads → Tools → API Center → Apply for access</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">OAuth Client ID</Label>
                <Input
                  placeholder="123456789-abc.apps.googleusercontent.com"
                  value={form.clientId}
                  onChange={(e) => setForm((f) => ({ ...f, clientId: e.target.value }))}
                  className="h-9 text-sm font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">OAuth Client Secret</Label>
                <div className="relative">
                  <Input
                    type={showSecret ? "text" : "password"}
                    placeholder="GOCSPX-xxxxxxxx"
                    value={form.clientSecret}
                    onChange={(e) => setForm((f) => ({ ...f, clientSecret: e.target.value }))}
                    className="h-9 text-sm font-mono pr-9"
                  />
                  <button onClick={() => setShowSecret((s) => !s)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showSecret ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
                <p className="text-[10px] text-muted-foreground">Google Cloud Console → OAuth 2.0 Credentials</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Refresh Token</Label>
              <div className="relative">
                <Input
                  type={showRefresh ? "text" : "password"}
                  placeholder="1//0gxxxxxxxxxxxxxxxx"
                  value={form.refreshToken}
                  onChange={(e) => setForm((f) => ({ ...f, refreshToken: e.target.value }))}
                  className="h-9 text-sm font-mono pr-9"
                />
                <button onClick={() => setShowRefresh((s) => !s)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showRefresh ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
              <p className="text-[10px] text-muted-foreground">OAuth flow with scope: https://www.googleapis.com/auth/adwords</p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Customer ID</Label>
              <Input
                placeholder="123-456-7890"
                value={form.customerId}
                onChange={(e) => setForm((f) => ({ ...f, customerId: e.target.value }))}
                className="h-9 text-sm font-mono"
              />
              <p className="text-[10px] text-muted-foreground">10-digit Google Ads account ID (no dashes needed)</p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
              <Button size="sm" onClick={handleSave} disabled={saving} className="gap-1.5">
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Key className="h-3.5 w-3.5" />}
                Save
              </Button>
            </div>
          </TabsContent>

          {/* ── Webhook ── */}
          <TabsContent value="webhook" className="p-6 space-y-5">
            <p className="text-sm font-semibold">Lead Form Webhook</p>
            <p className="text-xs text-muted-foreground">Configure this URL in Google Ads to receive lead form submissions in real-time.</p>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Webhook URL</Label>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs bg-muted px-3 py-2 rounded-lg border border-border font-mono break-all">{GOOGLE_ADS_WEBHOOK}</code>
                <Button variant="outline" size="icon" className="h-9 w-9 shrink-0" onClick={() => copy(GOOGLE_ADS_WEBHOOK)}>
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-2">
              <p className="text-xs font-semibold">Setup Steps</p>
              {[
                "Go to Google Ads → Assets → Lead Forms",
                "Create or edit a Lead Form asset",
                "Scroll to 'Lead delivery' section",
                "Select 'Webhook' and paste the URL above",
                "Set Google Key to any value (e.g. smoothsales)",
                "Save and test with a sample submission",
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="h-4 w-4 rounded-full bg-red-500/10 text-red-600 text-[9px] font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                  <p className="text-xs text-muted-foreground">{step}</p>
                </div>
              ))}
            </div>

            <Button variant="outline" size="sm" className="gap-1.5 w-full" onClick={() => window.open("https://ads.google.com", "_blank")}>
              <ExternalLink className="h-3.5 w-3.5" /> Open Google Ads
            </Button>
          </TabsContent>

          {/* ── Offline Conversions ── */}
          <TabsContent value="offline-conversions" className="p-6 space-y-4">
            <div className="rounded-xl border border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800 p-4">
              <p className="text-xs font-semibold text-blue-800 dark:text-blue-300">Offline Conversion Tracking</p>
              <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">When a lead converts in your CRM (deal won), we send the conversion back to Google Ads using the GCLID. This helps Google optimize your campaigns for qualified leads.</p>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold">Conversion Events Sent</p>
              {[
                { event: "Lead", trigger: "Lead captured from Google Ads form" },
                { event: "Qualified Lead", trigger: "Lead status changed to Hot/Qualified" },
                { event: "Purchase", trigger: "Deal marked as Won" },
              ].map((e) => (
                <div key={e.event} className="flex items-center gap-3 p-2.5 rounded-lg border border-border bg-muted/30">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-700 shrink-0">{e.event}</span>
                  <p className="text-xs text-muted-foreground">{e.trigger}</p>
                </div>
              ))}
            </div>

            <p className="text-[10px] text-muted-foreground">Requires GCLID to be captured on your landing pages. The CRM stores GCLID from the lead attribution data.</p>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
