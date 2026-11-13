"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CheckCircle2, XCircle, RefreshCw, Copy, ExternalLink, AlertTriangle,
  Zap, Globe, Key, Activity, ChevronRight, Loader2, Eye, EyeOff,
} from "lucide-react";
import { toast } from "sonner";
import { metaAdminApi, integrationsApi } from "@/lib/api/integrations";

const WEBHOOK_URL = `${process.env.NEXT_PUBLIC_API_URL || "https://api.smoothsales.in/api"}/webhooks/meta`;
const REQUIRED_PERMISSIONS = ["leads_retrieval", "pages_read_engagement", "pages_manage_metadata", "pages_show_list"];

export function MetaLeadsModal({ open, onClose, onSaved }) {
  const [tab, setTab] = useState("setup");
  const [saving, setSaving] = useState(false);
  const [testing, setSyncing] = useState(false);
  const [pages, setPages] = useState([]);
  const [diagnostics, setDiagnostics] = useState(null);
  const [loadingDiag, setLoadingDiag] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [showToken, setShowToken] = useState(false);

  const [form, setForm] = useState({
    appId: "",
    appSecret: "",
    systemUserToken: "",
    verifyToken: "",
    pixelId: "",
    conversionsApiToken: "",
  });

  // Load existing config on open
  useEffect(() => {
    if (!open) return;
    integrationsApi.getByKey("meta_ads").then((cfg) => {
      if (cfg?.configJson) {
        try {
          const c = typeof cfg.configJson === "string" ? JSON.parse(cfg.configJson) : cfg.configJson;
          setForm((prev) => ({ ...prev, ...c }));
        } catch {}
      }
    }).catch(() => {});
  }, [open]);

  const handleSave = async () => {
    if (!form.systemUserToken || !form.verifyToken) {
      toast.error("System User Token and Verify Token are required");
      return;
    }
    setSaving(true);
    try {
      await integrationsApi.save("meta_ads", {
        displayName: "Meta Ads & Conversions API",
        category: "Advertising",
        enabled: true,
        config: {
          appId: form.appId,
          appSecret: form.appSecret,
          systemUserToken: form.systemUserToken,
          verifyToken: form.verifyToken,
          pixelId: form.pixelId,
          conversionsApiToken: form.conversionsApiToken,
        },
      });
      toast.success("Meta integration saved", { description: "Credentials stored securely." });
      onSaved?.();
    } catch (e) {
      toast.error("Failed to save", { description: e.message });
    } finally {
      setSaving(false);
    }
  };

  const handleSyncPages = async () => {
    setSyncing(true);
    try {
      const synced = await metaAdminApi.syncPages();
      setPages(Array.isArray(synced) ? synced : []);
      toast.success(`${synced?.length || 0} pages synced from Meta`);
    } catch (e) {
      toast.error("Sync failed", { description: e.message });
    } finally {
      setSyncing(false);
    }
  };

  const handleLoadPages = useCallback(async () => {
    try {
      const list = await metaAdminApi.listPages();
      setPages(Array.isArray(list) ? list : []);
    } catch {}
  }, []);

  const handleSubscribePage = async (pageId) => {
    try {
      await metaAdminApi.subscribePage(pageId);
      toast.success("Page subscribed to leadgen webhooks");
      handleLoadPages();
    } catch (e) {
      toast.error("Subscribe failed", { description: e.message });
    }
  };

  const handleDiagnostics = async () => {
    setLoadingDiag(true);
    try {
      const diag = await metaAdminApi.getDiagnostics();
      setDiagnostics(diag);
    } catch (e) {
      toast.error("Diagnostics failed", { description: e.message });
    } finally {
      setLoadingDiag(false);
    }
  };

  useEffect(() => {
    if (open && tab === "pages") handleLoadPages();
  }, [open, tab, handleLoadPages]);

  const copy = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center shrink-0">
              <span className="text-white font-bold text-sm">M</span>
            </div>
            <div>
              <DialogTitle className="text-base font-bold">Meta Ads & Conversions API</DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">Facebook & Instagram Lead Ads + Offline Conversions</p>
            </div>
          </div>
        </DialogHeader>

        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="w-full rounded-none border-b border-border bg-transparent h-auto p-0">
            {[
              { id: "setup", label: "Setup" },
              { id: "webhook", label: "Webhook" },
              { id: "pages", label: "Pages" },
              { id: "conversions", label: "Conversions API" },
              { id: "diagnostics", label: "Diagnostics" },
            ].map((t) => (
              <TabsTrigger
                key={t.id}
                value={t.id}
                className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent text-xs py-3"
              >
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* ── Setup Tab ── */}
          <TabsContent value="setup" className="p-6 space-y-5">
            <div className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 p-4 space-y-2">
              <p className="text-xs font-semibold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5" /> Required Permissions
              </p>
              <div className="flex flex-wrap gap-1.5">
                {REQUIRED_PERMISSIONS.map((p) => (
                  <span key={p} className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-700">{p}</span>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">App ID</Label>
                <Input
                  placeholder="123456789012345"
                  value={form.appId}
                  onChange={(e) => setForm((f) => ({ ...f, appId: e.target.value }))}
                  className="h-9 text-sm font-mono"
                />
                <p className="text-[10px] text-muted-foreground">Meta for Developers → Your App → Settings → Basic</p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">App Secret</Label>
                <div className="relative">
                  <Input
                    type={showSecret ? "text" : "password"}
                    placeholder="••••••••••••••••"
                    value={form.appSecret}
                    onChange={(e) => setForm((f) => ({ ...f, appSecret: e.target.value }))}
                    className="h-9 text-sm font-mono pr-9"
                  />
                  <button onClick={() => setShowSecret((s) => !s)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showSecret ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">System User Token <span className="text-destructive">*</span></Label>
              <div className="relative">
                <Input
                  type={showToken ? "text" : "password"}
                  placeholder="EAAxxxxxxxxxxxxxxx..."
                  value={form.systemUserToken}
                  onChange={(e) => setForm((f) => ({ ...f, systemUserToken: e.target.value }))}
                  className="h-9 text-sm font-mono pr-9"
                />
                <button onClick={() => setShowToken((s) => !s)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showToken ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
              <p className="text-[10px] text-muted-foreground">Business Manager → System Users → Generate Token (never expires)</p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Verify Token <span className="text-destructive">*</span></Label>
              <Input
                placeholder="my-secret-verify-token-123"
                value={form.verifyToken}
                onChange={(e) => setForm((f) => ({ ...f, verifyToken: e.target.value }))}
                className="h-9 text-sm font-mono"
              />
              <p className="text-[10px] text-muted-foreground">Any random string — must match META_VERIFY_TOKEN in your backend .env</p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
              <Button size="sm" onClick={handleSave} disabled={saving} className="gap-1.5">
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Key className="h-3.5 w-3.5" />}
                Save Credentials
              </Button>
            </div>
          </TabsContent>

          {/* ── Webhook Tab ── */}
          <TabsContent value="webhook" className="p-6 space-y-5">
            <div className="space-y-3">
              <p className="text-sm font-semibold">Webhook Configuration</p>
              <p className="text-xs text-muted-foreground">Add this URL in your Meta App → Webhooks → leadgen subscription.</p>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Callback URL</Label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs bg-muted px-3 py-2 rounded-lg border border-border font-mono break-all">{WEBHOOK_URL}</code>
                  <Button variant="outline" size="icon" className="h-9 w-9 shrink-0" onClick={() => copy(WEBHOOK_URL)}>
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Verify Token</Label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs bg-muted px-3 py-2 rounded-lg border border-border font-mono">
                    {form.verifyToken || <span className="text-muted-foreground italic">Set in Setup tab first</span>}
                  </code>
                  {form.verifyToken && (
                    <Button variant="outline" size="icon" className="h-9 w-9 shrink-0" onClick={() => copy(form.verifyToken)}>
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-2">
                <p className="text-xs font-semibold">Setup Steps</p>
                {[
                  "Go to Meta for Developers → Your App → Webhooks",
                  "Click 'Add Subscription' → select 'leadgen' object",
                  "Paste the Callback URL above",
                  "Paste your Verify Token",
                  "Subscribe to 'leadgen' field",
                  "Go to Pages tab → Sync & Subscribe each page",
                ].map((step, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="h-4 w-4 rounded-full bg-primary/10 text-primary text-[9px] font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                    <p className="text-xs text-muted-foreground">{step}</p>
                  </div>
                ))}
              </div>

              <Button variant="outline" size="sm" className="gap-1.5 w-full" onClick={() => window.open("https://developers.facebook.com/apps", "_blank")}>
                <ExternalLink className="h-3.5 w-3.5" /> Open Meta for Developers
              </Button>
            </div>
          </TabsContent>

          {/* ── Pages Tab ── */}
          <TabsContent value="pages" className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Facebook Pages</p>
              <Button size="sm" variant="outline" onClick={handleSyncPages} disabled={testing} className="gap-1.5 h-8 text-xs">
                {testing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                Sync from Meta
              </Button>
            </div>

            {pages.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <Globe className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No pages synced yet</p>
                <p className="text-xs mt-1">Click "Sync from Meta" to discover your pages</p>
              </div>
            ) : (
              <div className="space-y-2">
                {pages.map((page) => (
                  <div key={page.id} className="flex items-center justify-between p-3 rounded-xl border border-border bg-card">
                    <div>
                      <p className="text-sm font-semibold">{page.pageName}</p>
                      <p className="text-[10px] text-muted-foreground font-mono">{page.pageId}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {page.webhookSubscribed ? (
                        <Badge className="text-[10px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700">
                          <CheckCircle2 className="h-2.5 w-2.5 mr-1" /> Subscribed
                        </Badge>
                      ) : (
                        <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => handleSubscribePage(page.pageId)}>
                          <Zap className="h-3 w-3" /> Subscribe
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ── Conversions API Tab ── */}
          <TabsContent value="conversions" className="p-6 space-y-5">
            <div className="rounded-xl border border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800 p-4">
              <p className="text-xs font-semibold text-blue-800 dark:text-blue-300">Meta Conversions API</p>
              <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">Send offline conversion events back to Meta to improve ad targeting and measure ROI. When a lead converts (deal won), we send a Purchase event to your Pixel.</p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Pixel ID</Label>
              <Input
                placeholder="1234567890123456"
                value={form.pixelId}
                onChange={(e) => setForm((f) => ({ ...f, pixelId: e.target.value }))}
                className="h-9 text-sm font-mono"
              />
              <p className="text-[10px] text-muted-foreground">Events Manager → Your Pixel → Settings</p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Conversions API Access Token</Label>
              <Input
                type="password"
                placeholder="EAAxxxxxxxxxxxxxxx..."
                value={form.conversionsApiToken}
                onChange={(e) => setForm((f) => ({ ...f, conversionsApiToken: e.target.value }))}
                className="h-9 text-sm font-mono"
              />
              <p className="text-[10px] text-muted-foreground">Events Manager → Your Pixel → Settings → Conversions API → Generate Access Token</p>
            </div>

            <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-2">
              <p className="text-xs font-semibold">Events Sent Automatically</p>
              {[
                { event: "Lead", trigger: "New lead captured from Meta Lead Ad" },
                { event: "Purchase", trigger: "Deal marked as Won in CRM" },
                { event: "Contact", trigger: "Lead status updated to Hot/Qualified" },
              ].map((e) => (
                <div key={e.event} className="flex items-center gap-3">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700 shrink-0">{e.event}</span>
                  <p className="text-xs text-muted-foreground">{e.trigger}</p>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2">
              <Button size="sm" onClick={handleSave} disabled={saving} className="gap-1.5">
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Key className="h-3.5 w-3.5" />}
                Save
              </Button>
            </div>
          </TabsContent>

          {/* ── Diagnostics Tab ── */}
          <TabsContent value="diagnostics" className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Integration Health</p>
              <Button size="sm" variant="outline" onClick={handleDiagnostics} disabled={loadingDiag} className="gap-1.5 h-8 text-xs">
                {loadingDiag ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Activity className="h-3.5 w-3.5" />}
                Run Diagnostics
              </Button>
            </div>

            {!diagnostics ? (
              <div className="text-center py-10 text-muted-foreground">
                <Activity className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Click "Run Diagnostics" to check your integration</p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Token Status */}
                <div className={`flex items-center gap-3 p-3 rounded-xl border ${diagnostics.tokenValid ? "border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20" : "border-red-200 bg-red-50 dark:bg-red-950/20"}`}>
                  {diagnostics.tokenValid
                    ? <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    : <XCircle className="h-4 w-4 text-red-500 shrink-0" />}
                  <div>
                    <p className="text-xs font-semibold">{diagnostics.tokenValid ? "Token Valid" : "Token Invalid"}</p>
                    <p className="text-[10px] text-muted-foreground">{diagnostics.tokenOwnerName || diagnostics.statusMessage}</p>
                  </div>
                  <code className="ml-auto text-[10px] font-mono text-muted-foreground">{diagnostics.maskedToken}</code>
                </div>

                {/* Permissions */}
                {diagnostics.grantedPermissions?.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-xs font-semibold">Granted Permissions</p>
                    <div className="flex flex-wrap gap-1.5">
                      {diagnostics.grantedPermissions.map((p) => (
                        <span key={p} className={`text-[10px] font-mono px-2 py-0.5 rounded border ${REQUIRED_PERMISSIONS.includes(p) ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700" : "bg-muted text-muted-foreground border-border"}`}>
                          {REQUIRED_PERMISSIONS.includes(p) && <CheckCircle2 className="h-2.5 w-2.5 inline mr-1" />}{p}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Pages */}
                {diagnostics.pages?.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-xs font-semibold">Pages ({diagnostics.pages.length})</p>
                    {diagnostics.pages.map((p) => (
                      <div key={p.pageId} className="flex items-center justify-between text-xs p-2 rounded-lg border border-border bg-muted/30">
                        <span className="font-medium">{p.pageName}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">{p.formsCount ?? 0} forms</span>
                          {p.webhookSubscribed
                            ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                            : <XCircle className="h-3.5 w-3.5 text-red-400" />}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
