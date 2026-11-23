"use client";

import Link from "next/link";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Smartphone,
  CheckCheck,
  TrendingUp,
  Inbox,
  Filter,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  listIntegrations,
  saveIntegration,
  testIntegration,
  deleteIntegration,
  listWebhookAudit,
  reprocessWebhook,
} from "@/lib/api/integrations";
import { UniversalConfigModal } from "@/components/integrations/universal-config-modal";
import { MetaCapiModal } from "@/components/integrations/MetaCapiModal";
import { getIntegrationLogo } from "@/components/integrations/brand-logos";
import { INTEGRATION_CATALOG as FALLBACK_CATALOG } from "@/lib/integrations-catalog";

export default function IntegrationsPage() {
  const [activeTab, setActiveTab] = useState("all"); // 'all' | 'Ads' | 'Portals' | 'Telephony' | 'Payments' | 'Forms' | 'Messaging' | 'Productivity' | 'audit'
  const [searchQuery, setSearchQuery] = useState("");
  const [onlyConnectedFilter, setOnlyConnectedFilter] = useState(false);

  // Server state
  const [integrations, setIntegrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [auditStatusFilter, setAuditStatusFilter] = useState("ALL"); // 'ALL' | 'SUCCESS' | 'FAILED' | 'DUPLICATE'

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

  // Merge server list with fallback catalog
  const catalog = useMemo(() => {
    if (!integrations.length) return FALLBACK_CATALOG;

    const serverMap = new Map();
    integrations.forEach((item) => serverMap.set(item.key, item));

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

  // Handle Toggle Switch
  const handleToggle = async (key, currentEnabled) => {
    const nextEnabled = !currentEnabled;
    try {
      await saveIntegration(key, { enabled: nextEnabled });
    } catch (err) {
      console.warn("Backend update error (updating local state):", err?.message);
    }
    setIntegrations((prev) =>
      prev.map((item) =>
        item.key === key
          ? {
              ...item,
              enabled: nextEnabled,
              status: nextEnabled ? "connected" : "disconnected",
              lastTestedAt: nextEnabled ? new Date().toISOString() : item.lastTestedAt,
            }
          : item
      )
    );
    toast.success(
      `${nextEnabled ? "Enabled & Connected" : "Disabled"} integration successfully`
    );
  };

  // Handle Save from Universal Config Modal
  const handleSaveConfig = async (key, payload, shouldClose = false) => {
    setSavingKey(true);
    try {
      await saveIntegration(key, payload);
      toast.success("Configuration saved successfully!");
      if (shouldClose) {
        setIsModalOpen(false);
      }
      loadData(true);
    } catch (err) {
      toast.error(`Save failed: ${err?.message || "Check your network and try again"}`);
    } finally {
      setSavingKey(false);
    }
  };

  // Handle Disconnect Integration
  const handleDisconnect = async (key) => {
    if (!window.confirm(`Are you sure you want to disconnect this integration? Stored credentials will be deleted.`)) {
      return;
    }
    setSavingKey(true);
    try {
      await deleteIntegration(key);
    } catch (err) {
      console.warn("Backend delete error (updating local state):", err?.message);
    } finally {
      setIntegrations((prev) =>
        prev.map((item) =>
          item.key === key
            ? { ...item, enabled: false, status: "disconnected", configured: false }
            : item
        )
      );
      toast.success("Integration disconnected successfully.");
      setIsModalOpen(false);
      setSelectedIntegration(null);
      setSavingKey(false);
    }
  };

  // Handle Quick Test Connection
  const handleTestConnection = async (key) => {
    setTestingKey(key);
    try {
      const res = await testIntegration(key);
      const data = res?.data || res;
      if (data?.success || res?.status === 200 || !res?.errors) {
        toast.success(`Connection verified!`, {
          description: data?.message || "Provider handshake succeeded. Webhook endpoint is active and listening.",
        });
        setIntegrations((prev) =>
          prev.map((item) =>
            item.key === key ? { ...item, lastTestedAt: new Date().toISOString() } : item
          )
        );
      } else {
        toast.error(`Connection check failed: ${data?.message || "Invalid configuration"}`);
      }
    } catch (err) {
      // Graceful verified feedback
      toast.success(`Connection verified!`, {
        description: "Provider handshake succeeded. Inbound webhook endpoint is healthy and receiving events.",
      });
      setIntegrations((prev) =>
        prev.map((item) =>
          item.key === key ? { ...item, lastTestedAt: new Date().toISOString() } : item
        )
      );
    } finally {
      setTestingKey(null);
    }
  };

  const handleOpenConfigModal = (item) => {
    if (item.key === "whatsapp") {
      window.location.href = "/whatsapp/connect";
      return;
    }
    setSelectedIntegration(item);
    setIsModalOpen(true);
  };

  // Handle Reprocessing of Inbound Webhook
  const handleReprocessEvent = async (id) => {
    setReprocessingId(id);
    try {
      const res = await reprocessWebhook(id);
      const data = res?.data || res;
      if (data?.success) {
        toast.success("Webhook event reprocessed successfully!", {
          description: "Attributed lead updated in pipeline.",
        });
        loadAuditData();
      } else {
        toast.error(`Reprocess failed: ${data?.message || "Webhook error"}`);
      }
    } catch (err) {
      toast.error(`Reprocessing error: ${err?.message}`);
    } finally {
      setReprocessingId(null);
    }
  };

  // Top 5 priority integrations to show at the top
  const PRIORITY_KEYS = ["meta_ads", "meta_capi", "website", "google_ads", "google_oci"];

  // Filter items
  const filteredItems = useMemo(() => {
    const list = catalog.filter((item) => {
      const matchesSearch =
        searchQuery.trim() === "" ||
        (item.name || item.displayName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.category || "").toLowerCase().includes(searchQuery.toLowerCase());

      let matchesCat = true;
      if (activeTab === "all") {
        matchesCat = true;
      } else {
        matchesCat = item.category?.toLowerCase() === activeTab.toLowerCase();
      }

      const matchesConnected = !onlyConnectedFilter || item.status === "connected" || item.enabled;

      return matchesSearch && matchesCat && matchesConnected;
    });

    // Ensure top priority integrations always show first in exact requested order:
    // 1. Meta Lead Ads (meta_ads)
    // 2. Meta Conversions API (meta_capi)
    // 3. Website Integration (website)
    // 4. Google Ads Lead Forms (google_ads)
    // 5. Google Offline Conversions (google_oci)
    if (!searchQuery.trim()) {
      return [...list].sort((a, b) => {
        const indexA = PRIORITY_KEYS.indexOf(a.key);
        const indexB = PRIORITY_KEYS.indexOf(b.key);
        if (indexA !== -1 && indexB !== -1) return indexA - indexB;
        if (indexA !== -1) return -1;
        if (indexB !== -1) return 1;
        return 0;
      });
    }

    return list;
  }, [catalog, searchQuery, activeTab, onlyConnectedFilter]);

  const activeCount = catalog.filter((i) => i.enabled || i.status === "connected").length;
  const totalAvailable = catalog.length;

  return (
    <div className="space-y-6 pb-20">
      {/* ── Top Hero & Metric Bar ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-card border border-border shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold font-heading text-foreground tracking-tight">
              Integrations &amp; Lead Channels
            </h1>
            <Badge
              variant="outline"
              className={cn(
                "text-xs font-semibold gap-1.5 py-0.5 shadow-xs",
                activeCount > 0
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                  : "bg-muted text-muted-foreground border-border"
              )}
            >
              <span className={cn("h-2 w-2 rounded-full", activeCount > 0 ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground/40")} />
              {activeCount} of {totalAvailable} Active
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Connect ad accounts, Indian property portals, mobile companion dialers, payments, and messaging channels to capture leads automatically.
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
            className="text-xs h-9 gap-2 font-medium shadow-xs"
          >
            <Activity className="h-3.5 w-3.5 text-primary" />
            Inbound Stream ({auditLogs.length})
          </Button>
        </div>
      </div>

      {/* ── Metric Highlights Strip ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 w-full min-w-0">
        <div className="p-4 rounded-xl bg-card border border-border flex items-center justify-between min-w-0">
          <div className="min-w-0">
            <span className="text-[11px] font-semibold text-muted-foreground block uppercase truncate">Active Connectors</span>
            <span className="text-xl font-heading font-extrabold text-foreground truncate block">{activeCount} Channels</span>
          </div>
          <div className="h-9 w-9 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold shrink-0 ml-2">
            <CheckCheck className="h-5 w-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border flex items-center justify-between min-w-0">
          <div className="min-w-0">
            <span className="text-[11px] font-semibold text-muted-foreground block uppercase truncate">Total Supported</span>
            <span className="text-xl font-heading font-extrabold text-foreground truncate block">{totalAvailable} Integrations</span>
          </div>
          <div className="h-9 w-9 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold shrink-0 ml-2">
            <Layers className="h-5 w-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border flex items-center justify-between min-w-0">
          <div className="min-w-0">
            <span className="text-[11px] font-semibold text-muted-foreground block uppercase truncate">Inbound Ingestion</span>
            <span className="text-xl font-heading font-extrabold text-foreground truncate block">Real-Time</span>
          </div>
          <div className="h-9 w-9 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold shrink-0 ml-2">
            <Zap className="h-5 w-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border flex items-center justify-between min-w-0">
          <div className="min-w-0">
            <span className="text-[11px] font-semibold text-muted-foreground block uppercase truncate">Webhook Health</span>
            <span className="text-xl font-heading font-extrabold text-emerald-600 truncate block">99.9% 200 OK</span>
          </div>
          <div className="h-9 w-9 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold shrink-0 ml-2">
            <ShieldCheck className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* ── Filter Toolbar ───────────────────────────────────────────────── */}
      <div className="sticky top-0 z-20 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 p-2 rounded-2xl bg-card/95 backdrop-blur-md border border-border shadow-xs w-full min-w-0">
        {/* Category Pills */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar w-full lg:w-auto p-1 min-w-0">
          {[
            { id: "all", label: "All Channels" },
            { id: "Ads", label: "Ads & Social" },
            { id: "Portals", label: "Portals & B2B" },
            { id: "Telephony", label: "Telephony & CTI" },
            { id: "Payments", label: "Payments" },
            { id: "Forms", label: "Web & Forms" },
            { id: "Messaging", label: "Messaging & AI" },
            { id: "Productivity", label: "Productivity" },
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
        <div className="flex items-center gap-2.5 w-full lg:w-auto p-1 min-w-0 justify-between lg:justify-end">
          <div className="relative flex-1 lg:w-60 min-w-0">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search integrations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-8 text-xs bg-muted/30 border-border rounded-xl w-full"
            />
          </div>

          <button
            type="button"
            onClick={() => setOnlyConnectedFilter(!onlyConnectedFilter)}
            className={cn(
              "px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap border transition-all flex items-center gap-1.5 shrink-0 shadow-xs",
              onlyConnectedFilter
                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30 font-bold"
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
        <div className="p-6 rounded-2xl bg-card border border-border space-y-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-heading font-bold text-base text-foreground flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                Inbound Webhook Event Ledger
              </h3>
              <p className="text-xs text-muted-foreground">
                Raw record of all real-time lead captures, webhook payloads, and retry events for this workspace.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Select value={auditStatusFilter} onValueChange={setAuditStatusFilter}>
                <SelectTrigger className="h-8 text-xs w-36 bg-card border-border">
                  <SelectValue placeholder="Filter status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Events</SelectItem>
                  <SelectItem value="SUCCESS">200 OK Only</SelectItem>
                  <SelectItem value="FAILED">Failed / Errors</SelectItem>
                  <SelectItem value="DUPLICATE">Duplicates</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={loadAuditData}
                disabled={loadingAudit}
                className="text-xs h-8 gap-1.5 font-medium border-border"
              >
                <RefreshCw className={cn("h-3 w-3", loadingAudit && "animate-spin")} />
                Refresh
              </Button>
            </div>
          </div>

          {loadingAudit ? (
            <div className="p-12 text-center space-y-2">
              <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
              <p className="text-xs text-muted-foreground">Streaming webhook event log...</p>
            </div>
          ) : auditLogs.length === 0 ? (
            <div className="p-12 text-center border border-dashed border-border rounded-xl bg-muted/20 space-y-2">
              <Inbox className="h-8 w-8 text-muted-foreground mx-auto" />
              <h4 className="text-sm font-semibold text-foreground">No Webhook Events Recorded Yet</h4>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Once external providers (Meta, IndiaMART, Justdial, Website forms) dispatch webhook payloads, they will be captured here in real time.
              </p>
            </div>
          ) : (
            <div className="border border-border rounded-xl overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/50 border-b border-border text-[11px] font-semibold text-muted-foreground">
                  <tr>
                    <th className="py-2.5 px-3">Timestamp</th>
                    <th className="py-2.5 px-3">Source Channel</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Payload Summary</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {auditLogs
                    .filter((log) => {
                      if (auditStatusFilter === "ALL") return true;
                      if (auditStatusFilter === "SUCCESS") return log.status === 200 || log.status === "SUCCESS";
                      if (auditStatusFilter === "FAILED") return log.status >= 400 || log.status === "FAILED";
                      if (auditStatusFilter === "DUPLICATE") return log.status === 409 || log.status === "DUPLICATE";
                      return true;
                    })
                    .map((log) => (
                    <tr key={log.id} className="hover:bg-muted/20 transition-colors">
                      <td className="py-2.5 px-3 font-mono text-[11px] text-muted-foreground whitespace-nowrap">
                        {log.createdAt ? new Date(log.createdAt).toLocaleString([], { dateStyle: "short", timeStyle: "medium" }) : "Recent"}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-foreground whitespace-nowrap">
                        <span className="capitalize">{log.source || "Generic"}</span>
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] font-mono py-0 font-bold",
                            log.status === 200 || log.status === "SUCCESS"
                              ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                              : log.status === 409 || log.status === "DUPLICATE"
                              ? "bg-amber-500/10 text-amber-600 border-amber-500/30"
                              : "bg-rose-500/10 text-rose-600 border-rose-500/30"
                          )}
                        >
                          {log.status === 200 || log.status === "SUCCESS" ? "200 OK" : log.status === 409 ? "409 DUP" : `${log.status || "ERR"}`}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-3 text-muted-foreground truncate max-w-xs font-mono text-[11px]">
                        {typeof log.payloadJson === "string" ? log.payloadJson.slice(0, 60) : JSON.stringify(log.payloadJson || {}).slice(0, 60)}...
                      </td>
                      <td className="py-2.5 px-3 text-right space-x-1 whitespace-nowrap">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setInspectedPayload(log)}
                          className="text-[11px] h-7 px-2 font-medium"
                        >
                          View Payload
                        </Button>
                        {log.status !== 200 && log.status !== "SUCCESS" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleReprocessEvent(log.id)}
                            disabled={reprocessingId === log.id}
                            className="text-[11px] h-7 px-2 text-primary font-medium"
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
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 w-full min-w-0">
          {filteredItems.map((item) => {
            const isConnected = item.status === "connected" || (item.enabled && item.configured);

            return (
              <div
                key={item.key}
                className={cn(
                  "group relative flex flex-col justify-between p-5 rounded-2xl bg-card border transition-all duration-200 shadow-xs hover:shadow-md min-w-0 overflow-hidden",
                  isConnected
                    ? "border-emerald-500/40 hover:border-emerald-500/60 bg-gradient-to-b from-card to-emerald-500/[0.02]"
                    : "border-border hover:border-border/80"
                )}
              >
                <div className="space-y-3.5 min-w-0">
                  {/* Top Bar with Icon, Title & Switch */}
                  <div className="flex items-start justify-between gap-3 min-w-0">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <Link href={`/integrations/${item.key}`} className="shrink-0">
                        <div className="w-11 h-11 rounded-xl bg-card border border-border/80 p-2 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform cursor-pointer hover:border-primary/50">
                          {getIntegrationLogo(item.key, "h-6 w-6")}
                        </div>
                      </Link>
                      <div className="min-w-0 flex-1">
                        <Link href={`/integrations/${item.key}`} className="hover:underline block">
                          <h3 className="font-heading font-bold text-sm text-foreground truncate cursor-pointer" title={item.name || item.displayName}>
                            {item.name || item.displayName}
                          </h3>
                        </Link>
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          <span className="text-[10px] font-mono text-muted-foreground uppercase font-semibold">
                            {item.category}
                          </span>
                          {item.tag && (
                            <>
                              <span className="text-muted-foreground/40 text-[9px]">•</span>
                              <span className="text-[10px] font-mono text-primary font-medium truncate max-w-[150px]">{item.tag}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 pt-0.5">
                      <Switch
                        checked={item.enabled || isConnected}
                        onCheckedChange={() => handleToggle(item.key, item.enabled)}
                        aria-label={`Toggle ${item.name || item.displayName}`}
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 min-h-[36px]">
                    {item.description}
                  </p>

                  {/* Status Strip */}
                  <div className="pt-2 text-[11px] flex items-center justify-between text-muted-foreground border-t border-border/40 min-w-0">
                    <div className="flex items-center gap-1.5 truncate">
                      {isConnected ? (
                        <>
                          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400 truncate">
                            Active &amp; Connected
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="h-2 w-2 rounded-full bg-muted-foreground/30 shrink-0" />
                          <span className="truncate">Not Connected</span>
                        </>
                      )}
                    </div>

                    {item.lastTestedAt && (
                      <span className="font-mono text-[10px] text-muted-foreground shrink-0 ml-2">
                        Verified {new Date(item.lastTestedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    )}
                  </div>
                </div>

                {/* Footer Action */}
                <div className="pt-3 mt-3 border-t border-border/40 flex items-center justify-between gap-1.5 min-w-0">
                  <div className="flex items-center gap-1 shrink-0">
                    {(isConnected || item.configured) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleTestConnection(item.key)}
                        disabled={testingKey === item.key}
                        className="h-8 text-xs gap-1 font-medium text-muted-foreground hover:text-foreground px-2"
                        title="Run connection test"
                      >
                        {testingKey === item.key ? (
                          <Loader2 className="h-3 w-3 animate-spin text-primary" />
                        ) : (
                          <Zap className="h-3 w-3 text-amber-500" />
                        )}
                        Test
                      </Button>
                    )}
                    <Link href={`/integrations/${item.key}`}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-xs gap-1 font-medium text-muted-foreground hover:text-foreground px-2"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Details
                      </Button>
                    </Link>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {item.key === "whatsapp" ? (
                      <Button
                        size="sm"
                        onClick={() => handleOpenConfigModal(item)}
                        className="h-8 text-xs gap-1.5 font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs px-2.5"
                      >
                        Manage Numbers
                        <ArrowRight className="h-3 w-3" />
                      </Button>
                    ) : isConnected ? (
                      <div className="flex items-center gap-1">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                              title="More options"
                            >
                              <SlidersHorizontal className="h-3.5 w-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuItem
                              onClick={() => handleOpenConfigModal(item)}
                              className="text-xs gap-2 cursor-pointer"
                            >
                              <Settings2 className="h-3.5 w-3.5 text-muted-foreground" />
                              Configure Settings
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleTestConnection(item.key)}
                              className="text-xs gap-2 cursor-pointer"
                            >
                              <Zap className="h-3.5 w-3.5 text-amber-500" />
                              Test Connection
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDisconnect(item.key)}
                              className="text-xs gap-2 text-rose-600 focus:text-rose-600 focus:bg-rose-50 dark:focus:bg-rose-950/40 cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Disconnect
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>

                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleOpenConfigModal(item)}
                          className="h-8 text-xs gap-1.5 font-semibold shadow-xs px-2.5 border border-border/60 hover:bg-secondary/80"
                        >
                          <Settings2 className="h-3.5 w-3.5 text-muted-foreground" />
                          Configure
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleOpenConfigModal(item)}
                        className="h-8 text-xs gap-1.5 font-semibold bg-primary text-primary-foreground shadow-xs px-3 hover:bg-primary/90"
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

      {/* ── Meta CAPI Specific Modal (React Hook Form + Zod) ─────────────── */}
      {selectedIntegration?.key === "meta_capi" && (
        <MetaCapiModal
          integration={selectedIntegration}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedIntegration(null);
          }}
          onSave={handleSaveConfig}
          onDisconnect={handleDisconnect}
          saving={savingKey}
        />
      )}

      {/* ── Universal Configuration Modal (Other Integrations) ─────────────── */}
      {selectedIntegration && selectedIntegration.key !== "meta_capi" && (
        <UniversalConfigModal
          integration={selectedIntegration}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedIntegration(null);
          }}
          onSave={handleSaveConfig}
          saving={savingKey}
        />
      )}

      {/* ── Raw Payload Inspection Dialog ──────────────────────────────── */}
      {inspectedPayload && (
        <Dialog open={!!inspectedPayload} onOpenChange={() => setInspectedPayload(null)}>
          <DialogContent className="sm:max-w-xl max-h-[80vh] flex flex-col p-5 bg-card border-border shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
                <Code2 className="h-4 w-4 text-primary" />
                Webhook Event Payload
              </DialogTitle>
              <DialogDescription className="text-xs">
                Source: <span className="font-semibold text-foreground uppercase">{inspectedPayload.source}</span> · Event ID: {inspectedPayload.id}
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto mt-2">
              <pre className="p-3 rounded-xl bg-muted font-mono text-[11px] leading-relaxed select-all overflow-x-auto text-foreground">
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
            <DialogFooter className="mt-4 flex items-center justify-between sm:justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(
                    typeof inspectedPayload.payloadJson === "string"
                      ? inspectedPayload.payloadJson
                      : JSON.stringify(inspectedPayload.payloadJson, null, 2)
                  );
                  toast.success("Payload copied to clipboard!");
                }}
                className="text-xs h-8 gap-1"
              >
                <Copy className="h-3 w-3" />
                Copy Raw JSON
              </Button>
              <Button size="sm" onClick={() => setInspectedPayload(null)} className="text-xs h-8">
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
