"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Plug,
  Megaphone,
  MessageSquare,
  Building,
  CreditCard,
  Globe,
  CheckCircle2,
  Settings2,
  RefreshCw,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Zap,
  Activity,
  Code2,
  Database,
  Search,
  ArrowRight,
  Layers,
  Clock,
  Lock,
  Loader2,
  SlidersHorizontal,
  Bot,
  RotateCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  listIntegrations,
  saveIntegration,
  testIntegration,
  listWebhookAudit,
  reprocessWebhook,
} from "@/lib/api/integrations";
import { UniversalConfigModal } from "@/components/integrations/universal-config-modal";
import { getIntegrationLogo } from "@/components/integrations/brand-logos";

// Fallback catalog metadata when server catalog is loading
const FALLBACK_CATALOG = [
  { key: "meta_ads", name: "Meta Lead Ads", category: "Ads", kind: "API_TOKEN", available: true, description: "Pull leads from Facebook and Instagram lead forms in real time with HMAC verification." },
  { key: "google_ads", name: "Google Ads Lead Forms", category: "Ads", kind: "LEAD_WEBHOOK", available: true, description: "Receive leads from Google Ads search and YouTube lead form assets." },
  { key: "indiamart", name: "IndiaMART", category: "Portals", kind: "LEAD_WEBHOOK", available: true, description: "Instant buyer enquiries from IndiaMART Lead Manager Push API." },
  { key: "justdial", name: "Justdial", category: "Portals", kind: "LEAD_WEBHOOK", available: true, description: "Real-time inbound prospect leads from your Justdial business listing." },
  { key: "99acres", name: "99acres", category: "Portals", kind: "LEAD_WEBHOOK", available: true, description: "Property buyer inquiries and verified leads from 99acres." },
  { key: "magicbricks", name: "MagicBricks", category: "Portals", kind: "LEAD_WEBHOOK", available: true, description: "Real estate buyer and tenant lead capture from MagicBricks gateway." },
  { key: "housing", name: "Housing.com", category: "Portals", kind: "LEAD_WEBHOOK", available: true, description: "Property buyer and investor leads from Housing.com." },
  { key: "website", name: "Website Webhook", category: "Forms", kind: "LEAD_WEBHOOK", available: true, description: "Any custom website form or landing page that can POST JSON or form data." },
  { key: "google_forms", name: "Google Forms", category: "Forms", kind: "LEAD_WEBHOOK", available: true, description: "Google Forms survey responses via Apps Script webhook push." },
  { key: "jotform", name: "Jotform", category: "Forms", kind: "LEAD_WEBHOOK", available: true, description: "Jotform submissions via custom REST webhook connector." },
  { key: "whatsapp", name: "WhatsApp Business Cloud API", category: "Messaging", kind: "NATIVE", available: true, description: "Official Meta Cloud API numbers for team inbox, templates, and campaigns." },
  { key: "openai", name: "OpenAI GPT-4o", category: "AI", kind: "API_TOKEN", available: true, description: "Powers autonomous WhatsApp AI qualification, script generation, and FAQ replies." },
  { key: "exotel", name: "Exotel Telephony", category: "Telephony", kind: "API_TOKEN", available: true, description: "Click-to-call, smart call routing, and automatic call recording through Exotel." },
  { key: "meta_capi", name: "Meta Conversions API (CAPI)", category: "Ads", kind: "API_TOKEN", available: false, description: "Server-side feedback loop sending qualified lead milestones back to Meta Ads." },
  { key: "google_oci", name: "Google Offline Conversions (OCI)", category: "Ads", kind: "LEAD_WEBHOOK", available: false, description: "Upload qualified offline deals back to Google Ads using captured GCLID." },
  { key: "razorpay", name: "Razorpay Payments", category: "Payments", kind: "LEAD_WEBHOOK", available: false, description: "Auto-reconcile booking tokens, UPI smart collect, and payment webhooks." },
  { key: "cashfree", name: "Cashfree Payments", category: "Payments", kind: "LEAD_WEBHOOK", available: false, description: "Instant partner commission payouts and direct bank disbursement splits." },
  { key: "google_sheets", name: "Google Sheets", category: "Productivity", kind: "API_TOKEN", available: false, description: "Continuous two-way live sync between CRM leads and Google Spreadsheets." },
  { key: "calendly", name: "Calendly", category: "Productivity", kind: "LEAD_WEBHOOK", available: false, description: "Automatic site visit booking and discovery call synchronization." },
  { key: "google_meet", name: "Google Meet", category: "Productivity", kind: "API_TOKEN", available: false, description: "Instant video discovery meeting link generation for sales reps." },
];

export default function IntegrationsPage() {
  const [activeTab, setActiveTab] = useState("all"); // 'all' | 'Ads' | 'Portals' | 'Forms' | 'Messaging' | 'Coming Soon' | 'audit'
  const [searchQuery, setSearchQuery] = useState("");
  const [onlyConnectedFilter, setOnlyConnectedFilter] = useState(false);

  // Server state
  const [integrations, setIntegrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loadingAudit, setLoadingAudit] = useState(false);

  // Active Modal State
  const [selectedIntegration, setSelectedIntegration] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [savingKey, setSavingKey] = useState(false);
  const [testingKey, setTestingKey] = useState(null);

  // Payload inspect modal state
  const [inspectedPayload, setInspectedPayload] = useState(null);
  const [reprocessingId, setReprocessingId] = useState(null);

  // ── Load Integration Data ───────────────────────────────────────────────────
  const loadData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      const res = await listIntegrations();
      const data = res?.data || res;
      if (Array.isArray(data)) {
        setIntegrations(data);
      } else {
        setIntegrations(FALLBACK_CATALOG);
      }
    } catch (err) {
      console.warn("Using fallback catalog. Error:", err?.message);
      setIntegrations(FALLBACK_CATALOG);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const loadAuditData = useCallback(async () => {
    setLoadingAudit(true);
    try {
      const res = await listWebhookAudit();
      const data = res?.data || res;
      if (Array.isArray(data)) {
        setAuditLogs(data);
      }
    } catch (err) {
      console.error("Failed to load webhook audit logs:", err);
    } finally {
      setLoadingAudit(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (activeTab === "audit") {
      loadAuditData();
    }
  }, [activeTab, loadAuditData]);

  // Merge server list with fallback catalog descriptions
  const catalog = useMemo(() => {
    if (!integrations.length) return FALLBACK_CATALOG;

    // Map by key
    const serverMap = new Map();
    integrations.forEach((item) => serverMap.set(item.key, item));

    // Combine
    const merged = FALLBACK_CATALOG.map((fallback) => {
      const serverItem = serverMap.get(fallback.key);
      if (serverItem) {
        return {
          ...fallback,
          ...serverItem,
          name: serverItem.name || fallback.name,
          displayName: serverItem.name || fallback.name,
          category: serverItem.category || fallback.category,
        };
      }
      return fallback;
    });

    // Add any extra server items not in fallback
    integrations.forEach((item) => {
      if (!FALLBACK_CATALOG.some((f) => f.key === item.key)) {
        merged.push({
          ...item,
          displayName: item.name || item.key,
        });
      }
    });

    return merged;
  }, [integrations]);

  // ── Actions ─────────────────────────────────────────────────────────────────
  const handleToggle = async (key, currentStatus) => {
    const nextStatus = !currentStatus;
    const item = catalog.find((i) => i.key === key);
    if (!item) return;

    if (!item.available) {
      toast.info("This integration is on the product roadmap and will be available soon.");
      return;
    }

    try {
      await saveIntegration(key, {
        displayName: item.name || item.displayName,
        category: item.category,
        enabled: nextStatus,
        config: item.config || {},
      });
      toast.success(`${item.name || item.displayName} is now ${nextStatus ? "Active" : "Disabled"}`);
      loadData(true);
    } catch (err) {
      toast.error(`Failed to update ${item.name || item.displayName}: ${err.message}`);
    }
  };

  const handleTestConnection = async (key) => {
    setTestingKey(key);
    try {
      const res = await testIntegration(key);
      const data = res?.data || res;
      if (data?.success) {
        toast.success(`Connection Verified for ${key}`, {
          description: data?.message || "Endpoint handshake successful.",
        });
      } else {
        toast.warning(data?.message || "Check credentials");
      }
      loadData(true);
    } catch (err) {
      toast.error(`Connection Test Failed: ${err.message}`);
    } finally {
      setTestingKey(null);
    }
  };

  const handleOpenConfigModal = (item) => {
    if (!item.available) {
      toast.info("This integration is coming soon.");
      return;
    }
    if (item.key === "whatsapp" || item.kind === "NATIVE") {
      window.location.href = "/whatsapp/connect";
      return;
    }
    setSelectedIntegration(item);
    setIsModalOpen(true);
  };

  const handleSaveConfig = async (key, payload) => {
    setSavingKey(true);
    try {
      await saveIntegration(key, payload);
      toast.success(`${payload.displayName || key} configuration saved successfully`);
      setIsModalOpen(false);
      loadData(true);
    } catch (err) {
      toast.error(`Save failed: ${err.message}`);
    } finally {
      setSavingKey(false);
    }
  };

  const handleReprocessEvent = async (id) => {
    setReprocessingId(id);
    try {
      await reprocessWebhook(id);
      toast.success("Webhook event reprocessed successfully");
      loadAuditData();
    } catch (err) {
      toast.error(`Reprocess failed: ${err.message}`);
    } finally {
      setReprocessingId(null);
    }
  };

  // Filter Catalog
  const filteredItems = useMemo(() => {
    return catalog.filter((item) => {
      const name = (item.name || item.displayName || "").toLowerCase();
      const desc = (item.description || "").toLowerCase();
      const key = (item.key || "").toLowerCase();
      const q = searchQuery.toLowerCase();

      const matchesSearch = !q || name.includes(q) || desc.includes(q) || key.includes(q);

      let matchesCat = true;
      if (activeTab === "all") {
        matchesCat = true;
      } else if (activeTab === "coming_soon") {
        matchesCat = !item.available;
      } else {
        matchesCat = item.category?.toLowerCase() === activeTab.toLowerCase();
      }

      const matchesConnected = !onlyConnectedFilter || item.status === "connected" || item.enabled;

      return matchesSearch && matchesCat && matchesConnected;
    });
  }, [catalog, searchQuery, activeTab, onlyConnectedFilter]);

  const activeCount = catalog.filter((i) => i.enabled || i.status === "connected").length;
  const totalAvailable = catalog.filter((i) => i.available).length;

  return (
    <div className="space-y-6 pb-20">
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-card border border-border">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold font-heading text-foreground tracking-tight">
              Integrations &amp; Lead Channels
            </h1>
            <Badge
              variant="outline"
              className={cn(
                "text-xs font-semibold gap-1.5 py-0.5",
                activeCount > 0
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                  : "bg-muted text-muted-foreground border-border"
              )}
            >
              <span className={cn("h-2 w-2 rounded-full", activeCount > 0 ? "bg-emerald-500" : "bg-muted-foreground/40")} />
              {activeCount} of {totalAvailable} Active
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Connect ad accounts, Indian property portals, website forms, and messaging channels to capture leads automatically.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="text-xs h-9 gap-2 border-border shadow-xs font-medium"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} />
            Refresh
          </Button>

          <Button
            variant={activeTab === "audit" ? "default" : "secondary"}
            size="sm"
            onClick={() => setActiveTab(activeTab === "audit" ? "all" : "audit")}
            className="text-xs h-9 gap-2 font-medium"
          >
            <Activity className="h-3.5 w-3.5" />
            Inbound Stream ({auditLogs.length})
          </Button>
        </div>
      </div>

      {/* ── Filter Toolbar ───────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 p-2 rounded-2xl bg-card border border-border">
        {/* Category Pills */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar w-full md:w-auto p-1">
          {[
            { id: "all", label: "All Channels" },
            { id: "Ads", label: "Ads & Social" },
            { id: "Portals", label: "Portals" },
            { id: "Forms", label: "Web & Forms" },
            { id: "Messaging", label: "Messaging & AI" },
            { id: "Telephony", label: "Telephony" },
            { id: "coming_soon", label: "Roadmap" },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveTab(cat.id)}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all",
                activeTab === cat.id
                  ? "bg-primary text-primary-foreground shadow-xs font-bold"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search & Connected-Only Toggle */}
        <div className="flex items-center gap-2.5 w-full md:w-auto p-1">
          <div className="relative w-full md:w-60">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search integrations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-8 text-xs bg-muted/30 border-border rounded-xl"
            />
          </div>

          <button
            type="button"
            onClick={() => setOnlyConnectedFilter(!onlyConnectedFilter)}
            className={cn(
              "px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap border transition-all flex items-center gap-1.5 shrink-0",
              onlyConnectedFilter
                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                : "bg-muted/30 text-muted-foreground border-border hover:text-foreground"
            )}
          >
            <span
              className={cn(
                "h-2 w-2 rounded-full",
                onlyConnectedFilter ? "bg-emerald-500" : "bg-muted-foreground/40"
              )}
            />
            Connected Only
          </button>
        </div>
      </div>

      {/* ── TAB: AUDIT / INBOUND STREAM LEDGER ───────────────────────────── */}
      {activeTab === "audit" ? (
        <div className="p-6 rounded-2xl bg-card border border-border space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-heading font-bold text-base text-foreground">
                Inbound Webhook Event Ledger
              </h3>
              <p className="text-xs text-muted-foreground">
                Raw record of all recent lead captures, webhooks, and retry attempts for this workspace.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadAuditData}
              disabled={loadingAudit}
              className="text-xs h-8 gap-1.5"
            >
              <RefreshCw className={cn("h-3 w-3", loadingAudit && "animate-spin")} />
              Refresh Events
            </Button>
          </div>

          {auditLogs.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground space-y-2">
              <Activity className="h-8 w-8 mx-auto text-muted-foreground/50" />
              <p className="text-xs font-medium">No inbound webhook events received yet.</p>
              <p className="text-[11px] text-muted-foreground/80">
                Trigger a test lead from any integration card to see live stream data here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/50 border-b border-border text-muted-foreground font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Source</th>
                    <th className="py-2.5 px-3">Received At</th>
                    <th className="py-2.5 px-3">Retries</th>
                    <th className="py-2.5 px-3">Error / Note</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-2.5 px-3">
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase",
                            log.status === "PROCESSED"
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                              : log.status === "FAILED" || log.status === "FAILED_PERMANENT"
                              ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                              : "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                          )}
                        >
                          {log.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-foreground">
                        {log.source}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-muted-foreground">
                        {log.receivedAt ? new Date(log.receivedAt).toLocaleString() : "Just now"}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-muted-foreground">
                        {log.retryCount || 0}
                      </td>
                      <td className="py-2.5 px-3 text-muted-foreground max-w-xs truncate">
                        {log.errorMessage || "—"}
                      </td>
                      <td className="py-2.5 px-3 text-right space-x-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setInspectedPayload(log)}
                          className="text-[11px] h-7 px-2"
                        >
                          View Payload
                        </Button>
                        {(log.status === "FAILED" || log.status === "FAILED_PERMANENT") && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleReprocessEvent(log.id)}
                            disabled={reprocessingId === log.id}
                            className="text-[11px] h-7 px-2 text-primary"
                          >
                            {reprocessingId === log.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <RotateCw className="h-3 w-3" />
                            )}
                            Reprocess
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* ── GRID OF INTEGRATIONS ─────────────────────────────────────────── */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => {
            const isConnected = item.status === "connected" || (item.enabled && item.configured);
            const isComingSoon = !item.available;

            return (
              <div
                key={item.key}
                className={cn(
                  "group relative flex flex-col justify-between p-5 rounded-2xl bg-card border transition-all duration-200",
                  isConnected
                    ? "border-emerald-500/30 hover:border-emerald-500/50 shadow-xs"
                    : isComingSoon
                    ? "border-border/60 opacity-75"
                    : "border-border hover:border-border/80 hover:shadow-xs"
                )}
              >
                <div className="space-y-3.5">
                  {/* Top Bar with Icon, Title & Switch */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-xl bg-card border border-border/80 p-2 flex items-center justify-center shrink-0 shadow-xs">
                        {getIntegrationLogo(item.key, "h-6 w-6")}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-heading font-bold text-sm text-foreground truncate">
                          {item.name || item.displayName}
                        </h3>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] font-mono text-muted-foreground uppercase font-semibold">
                            {item.category}
                          </span>
                          {item.kind === "LEAD_WEBHOOK" && (
                            <>
                              <span className="text-muted-foreground/40 text-[9px]">•</span>
                              <span className="text-[10px] font-mono text-primary font-medium">Webhook</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {!isComingSoon && item.key !== "whatsapp" && (
                      <div className="shrink-0 pt-0.5">
                        <Switch
                          checked={item.enabled || isConnected}
                          onCheckedChange={() => handleToggle(item.key, item.enabled)}
                          aria-label={`Toggle ${item.name || item.displayName}`}
                        />
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 min-h-[36px]">
                    {item.description}
                  </p>

                  {/* Status Strip */}
                  <div className="pt-2 text-[11px] flex items-center justify-between text-muted-foreground border-t border-border/40">
                    <div className="flex items-center gap-1.5">
                      {isComingSoon ? (
                        <span className="text-[10px] font-semibold text-muted-foreground">
                          On Roadmap
                        </span>
                      ) : isConnected ? (
                        <>
                          <span className="h-2 w-2 rounded-full bg-emerald-500" />
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                            Active &amp; Connected
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="h-2 w-2 rounded-full bg-muted-foreground/30" />
                          <span>Not Connected</span>
                        </>
                      )}
                    </div>

                    {item.lastTestedAt && (
                      <span className="font-mono text-[10px] text-muted-foreground">
                        Verified {new Date(item.lastTestedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    )}
                  </div>
                </div>

                {/* Footer Action */}
                <div className="pt-3 mt-3 border-t border-border/40 flex items-center justify-between gap-2">
                  {!isComingSoon && item.available && (isConnected || item.configured) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleTestConnection(item.key)}
                      disabled={testingKey === item.key}
                      className="h-8 text-xs gap-1 font-medium text-muted-foreground hover:text-foreground px-2"
                    >
                      {testingKey === item.key ? (
                        <Loader2 className="h-3 w-3 animate-spin text-primary" />
                      ) : (
                        <Zap className="h-3 w-3 text-amber-500" />
                      )}
                      Test
                    </Button>
                  )}

                  <div className="ml-auto">
                    {isComingSoon ? (
                      <span className="text-[11px] font-medium text-muted-foreground/80 px-2 py-1">
                        Coming Soon
                      </span>
                    ) : item.key === "whatsapp" ? (
                      <Button
                        size="sm"
                        onClick={() => handleOpenConfigModal(item)}
                        className="h-8 text-xs gap-1.5 font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        Manage Numbers
                        <ArrowRight className="h-3 w-3" />
                      </Button>
                    ) : isConnected ? (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleOpenConfigModal(item)}
                        className="h-8 text-xs gap-1.5 font-semibold"
                      >
                        <Settings2 className="h-3 w-3" />
                        Configure
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleOpenConfigModal(item)}
                        className="h-8 text-xs gap-1.5 font-semibold bg-primary text-primary-foreground"
                      >
                        Connect
                        <ArrowRight className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Universal Configuration Modal ───────────────────────────────── */}
      {selectedIntegration && (
        <UniversalConfigModal
          integration={selectedIntegration}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveConfig}
          saving={savingKey}
        />
      )}

      {/* ── Raw Payload Inspection Dialog ──────────────────────────────── */}
      {inspectedPayload && (
        <Dialog open={!!inspectedPayload} onOpenChange={() => setInspectedPayload(null)}>
          <DialogContent className="sm:max-w-xl max-h-[80vh] flex flex-col p-5">
            <DialogHeader>
              <DialogTitle className="text-base font-bold">
                Webhook Event Payload
              </DialogTitle>
              <DialogDescription className="text-xs">
                Source: {inspectedPayload.source} · ID: {inspectedPayload.id}
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto mt-2">
              <pre className="p-3 rounded-xl bg-muted font-mono text-[11px] leading-relaxed select-all overflow-x-auto">
                {JSON.stringify(
                  (() => {
                    try {
                      return typeof inspectedPayload.payloadJson === "string"
                        ? JSON.parse(inspectedPayload.payloadJson)
                        : inspectedPayload.payloadJson || inspectedPayload;
                    } catch {
                      return inspectedPayload.payloadJson;
                    }
                  })(),
                  null,
                  2
                )}
              </pre>
            </div>
            <DialogFooter className="mt-4">
              <Button size="sm" onClick={() => setInspectedPayload(null)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
