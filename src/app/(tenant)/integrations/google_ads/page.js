"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
  Shield,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Plus,
  Trash2,
  Eye,
  Key,
  Layers,
  Activity,
  ArrowRight,
  TrendingUp,
  SlidersHorizontal,
  ChevronRight,
  Loader2,
  FileText,
  Clock,
  Sparkles,
  ArrowLeft,
  Settings2,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow, format } from "date-fns";
import {
  listGoogleAdsIntegrations,
  getGoogleAdsIntegration,
  createGoogleAdsIntegration,
  updateGoogleAdsIntegration,
  regenerateGoogleAdsKey,
  deleteGoogleAdsIntegration,
  getGoogleAdsEvents,
  reprocessGoogleAdsEvent,
  getGoogleAdsStats,
  getGoogleAdsMappings,
  saveGoogleAdsMappings,
} from "@/lib/api/google-ads";
import { apiRequest } from "@/lib/api/client";

// Standard Google Column Definitions
const DEFAULT_GOOGLE_COLUMNS = [
  { columnId: "FULL_NAME", name: "Full Name", targetField: "name", required: true },
  { columnId: "FIRST_NAME", name: "First Name", targetField: "firstName" },
  { columnId: "LAST_NAME", name: "Last Name", targetField: "lastName" },
  { columnId: "EMAIL", name: "Email Address", targetField: "email", required: true },
  { columnId: "PHONE_NUMBER", name: "Phone Number", targetField: "phone", required: true },
  { columnId: "CITY", name: "City", targetField: "city" },
  { columnId: "COMPANY_NAME", name: "Company Name", targetField: "company" },
  { columnId: "POSTAL_CODE", name: "Postal Code", targetField: "notes" },
  { columnId: "JOB_TITLE", name: "Job Title", targetField: "notes" },
];

const CRM_FIELD_OPTIONS = [
  { value: "name", label: "Lead Name (Full)" },
  { value: "firstName", label: "First Name" },
  { value: "lastName", label: "Last Name" },
  { value: "email", label: "Email Address" },
  { value: "phone", label: "Phone (Normalized)" },
  { value: "city", label: "Preferred Location / City" },
  { value: "company", label: "Company Name" },
  { value: "notes", label: "Lead Notes / Extra Information" },
];

export default function GoogleAdsIntegrationPage() {
  // Navigation & State
  const [integrations, setIntegrations] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [integration, setIntegration] = useState(null);
  const [stats, setStats] = useState(null);
  const [events, setEvents] = useState([]);
  const [mappings, setMappings] = useState([]);
  const [activeTab, setActiveTab] = useState("connection");
  const [staffList, setStaffList] = useState([]);

  // Loaders
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ name: "", defaultOwnerId: "", defaultLeadSource: "Google Ads" });
  const [isRegenerateOpen, setIsRegenerateOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [inspectedEvent, setInspectedEvent] = useState(null);
  const [reprocessingId, setReprocessingId] = useState(null);

  // Newly generated plain key (shown once only)
  const [newlyCreatedKey, setNewlyCreatedKey] = useState(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedWebhook, setCopiedWebhook] = useState(false);

  // Filter & Pagination for Events
  const [eventStatusFilter, setEventStatusFilter] = useState("ALL");
  const [eventPage, setEventPage] = useState(0);
  const [hasMoreEvents, setHasMoreEvents] = useState(false);

  // Auto-refresh interval
  const [autoRefresh, setAutoRefresh] = useState(false);

  // ── Load Staff for Assignment ───────────────────────────────────────────────
  useEffect(() => {
    apiRequest("/users")
      .then((res) => {
        const users = Array.isArray(res) ? res : res?.items || res?.data || [];
        setStaffList(users);
      })
      .catch(() => setStaffList([]));
  }, []);

  // ── 1. Fetch Integrations List ──────────────────────────────────────────────
  const loadIntegrations = useCallback(async (preferredId = null) => {
    try {
      const data = await listGoogleAdsIntegrations();
      const list = Array.isArray(data) ? data : data?.data || [];
      setIntegrations(list);

      if (list.length > 0) {
        const match = preferredId ? list.find((i) => i.id === preferredId) : null;
        const current = match || list[0];
        setSelectedId(current.id);
        setIntegration(current);
      } else {
        setSelectedId(null);
        setIntegration(null);
      }
    } catch (err) {
      toast.error("Failed to load Google Ads integrations", { description: err.message });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadIntegrations();
  }, [loadIntegrations]);

  // ── 2. Fetch Selected Integration Details, Stats, Events & Mappings ─────────
  const loadDetailData = useCallback(async (id, silent = false) => {
    if (!id) return;
    if (!silent) setRefreshing(true);
    try {
      const [detailData, statsData, eventsData, mappingsData] = await Promise.allSettled([
        getGoogleAdsIntegration(id),
        getGoogleAdsStats(id),
        getGoogleAdsEvents(id, { status: eventStatusFilter, page: eventPage, size: 20 }),
        getGoogleAdsMappings(id),
      ]);

      if (detailData.status === "fulfilled" && detailData.value) {
        setIntegration(detailData.value);
      }
      if (statsData.status === "fulfilled" && statsData.value) {
        setStats(statsData.value);
      }
      if (eventsData.status === "fulfilled" && eventsData.value) {
        const items = eventsData.value?.items || eventsData.value?.content || (Array.isArray(eventsData.value) ? eventsData.value : []);
        setEvents(items);
        setHasMoreEvents(items.length >= 20);
      }
      if (mappingsData.status === "fulfilled" && mappingsData.value) {
        setMappings(Array.isArray(mappingsData.value) ? mappingsData.value : []);
      }
    } catch (err) {
      console.error("Failed to refresh details", err);
    } finally {
      setRefreshing(false);
    }
  }, [eventStatusFilter, eventPage]);

  useEffect(() => {
    if (selectedId) {
      loadDetailData(selectedId);
    }
  }, [selectedId, loadDetailData]);

  // ── Auto-poll live status ───────────────────────────────────────────────────
  useEffect(() => {
    if (!autoRefresh || !selectedId) return;
    const interval = setInterval(() => {
      loadDetailData(selectedId, true);
    }, 10000);
    return () => clearInterval(interval);
  }, [autoRefresh, selectedId, loadDetailData]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleCopy = (text, type) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    if (type === "key") {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    } else {
      setCopiedWebhook(true);
      setTimeout(() => setCopiedWebhook(false), 2000);
    }
    toast.success("Copied to clipboard");
  };

  const handleStatusToggle = async (checked) => {
    if (!integration) return;
    const newStatus = checked ? "ACTIVE" : "PAUSED";
    setIntegration((prev) => ({ ...prev, status: newStatus }));

    try {
      await updateGoogleAdsIntegration(integration.id, { status: newStatus });
      toast.success(`Google Ads integration is now ${newStatus}`);
      loadIntegrations(integration.id);
    } catch (err) {
      setIntegration((prev) => ({ ...prev, status: prev.status === "ACTIVE" ? "PAUSED" : "ACTIVE" }));
      toast.error("Failed to update status", { description: err.message });
    }
  };

  const handleCreateIntegration = async () => {
    if (!createForm.name.trim()) {
      toast.error("Account name is required");
      return;
    }
    setSavingSettings(true);
    try {
      const res = await createGoogleAdsIntegration({
        name: createForm.name.trim(),
        defaultOwnerId: createForm.defaultOwnerId || null,
        defaultLeadSource: createForm.defaultLeadSource || "Google Ads",
      });

      const created = res?.data || res;
      toast.success("Google Ads account connected successfully!");
      setIsCreateOpen(false);
      setCreateForm({ name: "", defaultOwnerId: "", defaultLeadSource: "Google Ads" });

      // Save returned secret key in state to show in the alert banner
      if (created?.googleKey) {
        setNewlyCreatedKey(created.googleKey);
      }

      await loadIntegrations(created?.id);
    } catch (err) {
      toast.error("Failed to create integration", { description: err.message });
    } finally {
      setSavingSettings(false);
    }
  };

  const handleRegenerateKey = async () => {
    if (!integration) return;
    setSavingSettings(true);
    try {
      const res = await regenerateGoogleAdsKey(integration.id);
      const updated = res?.data || res;
      toast.success("Google Key regenerated. Save it now!");
      if (updated?.googleKey) {
        setNewlyCreatedKey(updated.googleKey);
      }
      setIsRegenerateOpen(false);
      loadDetailData(integration.id);
    } catch (err) {
      toast.error("Failed to regenerate key", { description: err.message });
    } finally {
      setSavingSettings(false);
    }
  };

  const handleDeleteIntegration = async () => {
    if (!integration) return;
    setSavingSettings(true);
    try {
      await deleteGoogleAdsIntegration(integration.id);
      toast.success("Integration disconnected");
      setIsDeleteOpen(false);
      loadIntegrations();
    } catch (err) {
      toast.error("Failed to delete integration", { description: err.message });
    } finally {
      setSavingSettings(false);
    }
  };

  const handleReprocess = async (eventId) => {
    if (!integration || !eventId) return;
    setReprocessingId(eventId);
    try {
      await reprocessGoogleAdsEvent(integration.id, eventId);
      toast.success("Event reprocessed successfully");
      loadDetailData(integration.id, true);
    } catch (err) {
      toast.error("Reprocessing failed", { description: err.message });
    } finally {
      setReprocessingId(null);
    }
  };

  const handleAddCustomMapping = () => {
    setMappings((prev) => [
      ...prev,
      {
        formId: "",
        campaignId: "",
        label: "New Form Mapping",
        fieldMapping: { FULL_NAME: "name", EMAIL: "email", PHONE_NUMBER: "phone" },
      },
    ]);
  };

  const handleSaveMappings = async () => {
    if (!integration) return;
    setSavingSettings(true);
    try {
      await saveGoogleAdsMappings(integration.id, mappings);
      toast.success("Field mappings saved successfully");
    } catch (err) {
      toast.error("Failed to save mappings", { description: err.message });
    } finally {
      setSavingSettings(false);
    }
  };

  // Helper status color badge
  const getStatusBadge = (status) => {
    switch (status) {
      case "PROCESSED":
        return <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-mono text-[10px]">PROCESSED</Badge>;
      case "TEST":
        return <Badge className="bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 font-mono text-[10px]">TEST LEAD</Badge>;
      case "DUPLICATE":
        return <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-mono text-[10px]">DUPLICATE</Badge>;
      case "PAUSED":
        return <Badge className="bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20 font-mono text-[10px]">PAUSED</Badge>;
      case "FAILED":
        return <Badge className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 font-mono text-[10px]">FAILED</Badge>;
      default:
        return <Badge variant="outline" className="font-mono text-[10px]">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading Google Ads integrations...</p>
      </div>
    );
  }

  return (
    <div className="container max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      {/* ── Header ────────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link
              href="/integrations"
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Integrations
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-red-600 to-amber-500 flex items-center justify-center text-white font-bold text-base shadow-sm">
              G
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                Google Ads Lead Form Integration
                {integration && (
                  <Badge
                    variant="outline"
                    className={
                      integration.status === "ACTIVE"
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                        : "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/30"
                    }
                  >
                    {integration.status}
                  </Badge>
                )}
              </h1>
              <p className="text-xs text-muted-foreground">
                Capture verified leads in real-time from Google Search, Display & YouTube lead form extensions.
              </p>
            </div>
          </div>
        </div>

        {/* Account Selector & Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          {integrations.length > 0 && (
            <div className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground hidden sm:inline">Account:</Label>
              <Select value={selectedId || ""} onValueChange={(val) => setSelectedId(val)}>
                <SelectTrigger className="w-[190px] h-9 text-xs font-medium">
                  <SelectValue placeholder="Select Account" />
                </SelectTrigger>
                <SelectContent>
                  {integrations.map((item) => (
                    <SelectItem key={item.id} value={item.id} className="text-xs">
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <Button size="sm" onClick={() => setIsCreateOpen(true)} className="gap-1.5 h-9 text-xs">
            <Plus className="h-3.5 w-3.5" /> Connect Account
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => loadDetailData(selectedId)}
            disabled={refreshing}
            className="h-9 gap-1.5 text-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>
      </div>

      {/* ── Empty State if no account connected ─────────────────────────────────── */}
      {integrations.length === 0 ? (
        <Card className="border-dashed border-2 text-center p-12 space-y-4">
          <div className="mx-auto h-16 w-16 rounded-2xl bg-red-500/10 text-red-600 flex items-center justify-center font-black text-2xl">
            G
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <h3 className="text-lg font-bold text-foreground">No Google Ads Account Connected</h3>
            <p className="text-xs text-muted-foreground">
              Connect your Google Ads account to start receiving leads directly from your Search, Video, and Performance Max lead form assets.
            </p>
          </div>
          <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Connect Google Ads Account
          </Button>
        </Card>
      ) : (
        <>
          {/* ── Key Generated Alert Banner (Shown once only) ─────────────────────── */}
          {newlyCreatedKey && (
            <div className="rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-950/40 dark:border-amber-700/60 p-4 shadow-sm animate-in fade-in-50">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1.5 flex-1">
                  <h4 className="text-sm font-bold text-amber-900 dark:text-amber-200">
                    Important: Copy Your Google Key Now
                  </h4>
                  <p className="text-xs text-amber-800 dark:text-amber-300">
                    Google Ads sends this secret key with every lead webhook to verify authenticity. For your security, this key is encrypted at rest and will <strong>never be shown in full again</strong>.
                  </p>
                  <div className="flex items-center gap-2 pt-1 max-w-xl">
                    <code className="flex-1 bg-white dark:bg-black/60 px-3 py-1.5 rounded-lg border border-amber-300 dark:border-amber-700 font-mono text-xs select-all text-amber-950 dark:text-amber-100 font-semibold break-all">
                      {newlyCreatedKey}
                    </code>
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-white dark:bg-black/40 border-amber-300 dark:border-amber-700 h-8 gap-1.5 shrink-0"
                      onClick={() => handleCopy(newlyCreatedKey, "key")}
                    >
                      {copiedKey ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                      {copiedKey ? "Copied" : "Copy Key"}
                    </Button>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs text-amber-700 hover:text-amber-950"
                  onClick={() => setNewlyCreatedKey(null)}
                >
                  Dismiss
                </Button>
              </div>
            </div>
          )}

          {/* ── Live Performance Metrics & Quick Status ─────────────────────────── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
            <Card className="p-4 bg-card/60 backdrop-blur-sm border-border shadow-xs">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Total Leads</p>
              <div className="flex items-baseline gap-2 mt-1">
                <p className="text-2xl font-bold tracking-tight text-foreground">{stats?.totalLeads ?? integration?.totalLeads ?? 0}</p>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center">
                  <TrendingUp className="h-3 w-3 mr-0.5" /> All-time
                </span>
              </div>
            </Card>

            <Card className="p-4 bg-card/60 backdrop-blur-sm border-border shadow-xs">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Leads Today</p>
              <div className="flex items-baseline gap-2 mt-1">
                <p className="text-2xl font-bold tracking-tight text-foreground">{stats?.leadsToday ?? 0}</p>
                <span className="text-[10px] text-muted-foreground">Last 24h</span>
              </div>
            </Card>

            <Card className="p-4 bg-card/60 backdrop-blur-sm border-border shadow-xs">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Last Lead Received</p>
              <p className="text-sm font-semibold text-foreground mt-1.5 truncate">
                {integration?.lastLeadAt
                  ? formatDistanceToNow(new Date(integration.lastLeadAt), { addSuffix: true })
                  : "No leads yet"}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {integration?.lastLeadAt ? format(new Date(integration.lastLeadAt), "MMM d, yyyy HH:mm") : "Awaiting first submission"}
              </p>
            </Card>

            <Card className="p-4 bg-card/60 backdrop-blur-sm border-border shadow-xs">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Live Status</p>
                <div className="flex items-center gap-1.5">
                  <span className={`h-2 w-2 rounded-full ${integration?.status === "ACTIVE" ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`} />
                  <span className="text-[11px] font-semibold">{integration?.status}</span>
                </div>
              </div>
              <div className="flex items-center justify-between mt-2 pt-1 border-t border-border/50">
                <span className="text-[11px] text-muted-foreground">Auto-refresh (10s)</span>
                <Switch checked={autoRefresh} onCheckedChange={setAutoRefresh} className="scale-75 origin-right" />
              </div>
            </Card>
          </div>

          {/* ── Main Tabbed Content Area ────────────────────────────────────────── */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="bg-muted/50 p-1 border border-border rounded-xl">
              <TabsTrigger value="connection" className="gap-2 text-xs py-1.5">
                <Key className="h-3.5 w-3.5" /> Connection & Credentials
              </TabsTrigger>
              <TabsTrigger value="guide" className="gap-2 text-xs py-1.5">
                <HelpCircle className="h-3.5 w-3.5" /> Setup Guide
              </TabsTrigger>
              <TabsTrigger value="mapping" className="gap-2 text-xs py-1.5">
                <SlidersHorizontal className="h-3.5 w-3.5" /> Field Mappings
              </TabsTrigger>
              <TabsTrigger value="events" className="gap-2 text-xs py-1.5">
                <Activity className="h-3.5 w-3.5" /> Inbound Event Logs ({events.length})
              </TabsTrigger>
            </TabsList>

            {/* ── TAB 1: CONNECTION CARD ───────────────────────────────────────── */}
            <TabsContent value="connection" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 shadow-xs">
                  <CardHeader className="pb-3 border-b border-border">
                    <CardTitle className="text-base font-bold flex items-center justify-between">
                      <span>Webhook Delivery Configuration</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-normal text-muted-foreground">Active Webhook Ingestion</span>
                        <Switch
                          checked={integration?.status === "ACTIVE"}
                          onCheckedChange={handleStatusToggle}
                        />
                      </div>
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Paste these credentials directly into your Google Ads Lead Form Asset under <strong>Export leads from Google Ads</strong>.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5 pt-4">
                    {/* Webhook URL */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-foreground flex items-center justify-between">
                        <span>Webhook URL</span>
                        <span className="text-[10px] text-muted-foreground font-mono">Public Endpoint (PermitAll)</span>
                      </Label>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 text-xs bg-muted/60 px-3 py-2.5 rounded-lg border border-border font-mono break-all select-all text-foreground">
                          {integration?.webhookUrl || `https://api.smoothsales.in/api/v1/webhooks/google-ads/${integration?.publicId}`}
                        </code>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-9 w-9 shrink-0"
                          onClick={() => handleCopy(integration?.webhookUrl, "url")}
                        >
                          {copiedWebhook ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>

                    {/* Google Key */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-foreground flex items-center justify-between">
                        <span>Google Key (Webhook Secret)</span>
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                          <Shield className="h-3 w-3" /> AES-256-GCM Encrypted at Rest
                        </span>
                      </Label>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 flex items-center justify-between bg-muted/60 px-3 py-2.5 rounded-lg border border-border font-mono text-xs text-muted-foreground">
                          <span>{integration?.googleKeyHint || "••••••••"}</span>
                          <span className="text-[10px] text-muted-foreground italic">(Hidden for security)</span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-9 text-xs gap-1.5 shrink-0 text-amber-700 dark:text-amber-400 hover:text-amber-800"
                          onClick={() => setIsRegenerateOpen(true)}
                        >
                          <RefreshCw className="h-3.5 w-3.5" /> Regenerate
                        </Button>
                      </div>
                    </div>

                    {/* Settings & Default Owner */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">Account / Campaign Name</Label>
                        <Input
                          value={integration?.name || ""}
                          onChange={(e) => setIntegration((prev) => ({ ...prev, name: e.target.value }))}
                          className="h-9 text-xs"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">Default Assigned Staff</Label>
                        <Select
                          value={integration?.defaultOwnerId || "AUTO"}
                          onValueChange={(val) =>
                            setIntegration((prev) => ({
                              ...prev,
                              defaultOwnerId: val === "AUTO" ? null : val,
                            }))
                          }
                        >
                          <SelectTrigger className="h-9 text-xs">
                            <SelectValue placeholder="Automatic Round-Robin (Default)" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="AUTO" className="text-xs">
                              Automatic (Least-loaded Agent)
                            </SelectItem>
                            {staffList.map((user) => (
                              <SelectItem key={user.id} value={user.id} className="text-xs">
                                {user.firstName} {user.lastName || ""} ({user.roleName || user.email})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/20 gap-1.5"
                        onClick={() => setIsDeleteOpen(true)}
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Disconnect Integration
                      </Button>

                      <Button
                        size="sm"
                        className="text-xs gap-1.5"
                        disabled={savingSettings}
                        onClick={async () => {
                          setSavingSettings(true);
                          try {
                            await updateGoogleAdsIntegration(integration.id, {
                              name: integration.name,
                              defaultOwnerId: integration.defaultOwnerId,
                              status: integration.status,
                            });
                            toast.success("Settings updated");
                          } catch (err) {
                            toast.error("Failed to update settings", { description: err.message });
                          } finally {
                            setSavingSettings(false);
                          }
                        }}
                      >
                        {savingSettings ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                        Save Changes
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Status & Health Side Card */}
                <Card className="shadow-xs space-y-4">
                  <CardHeader className="pb-3 border-b border-border">
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                      <Activity className="h-4 w-4 text-primary" /> Delivery Health & Security
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3.5 pt-4 text-xs">
                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40 border border-border">
                      <span className="text-muted-foreground">HTTP Handshake</span>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" /> 200 OK (&lt; 200ms)
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40 border border-border">
                      <span className="text-muted-foreground">Timing Protection</span>
                      <span className="font-semibold text-foreground font-mono">Constant-Time Compare</span>
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40 border border-border">
                      <span className="text-muted-foreground">Deduplication</span>
                      <span className="font-semibold text-foreground font-mono">Unique google_lead_id</span>
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40 border border-border">
                      <span className="text-muted-foreground">Failures Recorded</span>
                      <span className={`font-semibold ${stats?.failureCount > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                        {stats?.failureCount ?? 0}
                      </span>
                    </div>

                    <div className="pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-xs gap-1.5"
                        onClick={() => window.open("https://ads.google.com", "_blank")}
                      >
                        <ExternalLink className="h-3.5 w-3.5" /> Open Google Ads Console
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* ── TAB 2: STEP-BY-STEP SETUP GUIDE ───────────────────────────────── */}
            <TabsContent value="guide" className="space-y-4">
              <Card className="shadow-xs">
                <CardHeader className="pb-3 border-b border-border">
                  <CardTitle className="text-base font-bold">Google Ads Webhook Setup Walkthrough</CardTitle>
                  <CardDescription className="text-xs">
                    Follow these 5 simple steps in your Google Ads campaign manager to activate automated real-time lead ingestion.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  {[
                    {
                      step: 1,
                      title: "Navigate to Lead Form Assets",
                      desc: "Log in to Google Ads Manager. Go to Campaigns or Assets > Lead Form. Click '+' to create a new form or edit an existing one.",
                      tip: "Google supports Lead Forms on Search, Performance Max, Discovery, and YouTube Video campaigns.",
                    },
                    {
                      step: 2,
                      title: "Configure Form Fields",
                      desc: "Choose the fields you wish to capture: Full Name, Email, Phone Number, City, Company Name, etc. These match automatically with SmoothSales CRM.",
                      tip: "Our phone normalizer automatically converts all Indian mobile numbers into valid standard format.",
                    },
                    {
                      step: 3,
                      title: "Scroll to 'Export leads from Google Ads' (Webhook)",
                      desc: "Under the Lead Delivery section, expand the 'Export leads from Google Ads' dropdown option.",
                    },
                    {
                      step: 4,
                      title: "Paste Webhook URL & Google Key",
                      desc: "Copy the Webhook URL and the secret Google Key from the Connection tab above, and paste them into Google's fields.",
                    },
                    {
                      step: 5,
                      title: "Click 'Send Test Data' & Save",
                      desc: "Click Google's 'Send test data' button. Switch back to SmoothSales CRM and check the Inbound Event Logs tab below to see your verified test lead!",
                      tip: "Test leads are clearly flagged as 'TEST' and will not clutter your real customer database.",
                    },
                  ].map((s) => (
                    <div key={s.step} className="flex items-start gap-4 p-4 rounded-xl border border-border bg-muted/20">
                      <div className="h-8 w-8 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 font-bold flex items-center justify-center shrink-0 text-sm border border-red-500/20">
                        {s.step}
                      </div>
                      <div className="space-y-1 flex-1">
                        <h4 className="text-sm font-bold text-foreground">{s.title}</h4>
                        <p className="text-xs text-muted-foreground">{s.desc}</p>
                        {s.tip && (
                          <p className="text-[11px] text-primary/80 bg-primary/5 px-2.5 py-1 rounded-md mt-1.5 inline-block">
                            💡 {s.tip}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── TAB 3: FIELD MAPPINGS ────────────────────────────────────────── */}
            <TabsContent value="mapping" className="space-y-4">
              <Card className="shadow-xs">
                <CardHeader className="pb-3 border-b border-border flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-bold">Standard & Custom Field Mappings</CardTitle>
                    <CardDescription className="text-xs">
                      Map standard Google Ads Lead Form column IDs and custom questions to SmoothSales CRM contact fields.
                    </CardDescription>
                  </div>
                  <Button size="sm" onClick={handleAddCustomMapping} className="gap-1.5 text-xs h-8">
                    <Plus className="h-3.5 w-3.5" /> Add Form Override
                  </Button>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  {/* Default Google Column Mapping Table */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Default Automatic Column Mapping
                    </h4>
                    <div className="rounded-xl border border-border overflow-hidden">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-muted/50 border-b border-border text-muted-foreground font-semibold">
                          <tr>
                            <th className="p-3">Google Column ID</th>
                            <th className="p-3">Field Label</th>
                            <th className="p-3">CRM Customer Field</th>
                            <th className="p-3">Processing Rule</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {DEFAULT_GOOGLE_COLUMNS.map((col) => (
                            <tr key={col.columnId} className="hover:bg-muted/20">
                              <td className="p-3 font-mono font-medium text-foreground">{col.columnId}</td>
                              <td className="p-3 text-muted-foreground">{col.name}</td>
                              <td className="p-3">
                                <Badge variant="outline" className="font-mono text-[10px]">
                                  {col.targetField}
                                </Badge>
                              </td>
                              <td className="p-3 text-muted-foreground">
                                {col.columnId === "PHONE_NUMBER" ? "E.164 + Indian Normalization" : "Automatic Mapping"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Custom Form / Campaign Overrides */}
                  {mappings.length > 0 && (
                    <div className="space-y-3 pt-4 border-t border-border">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Custom Form / Campaign Overrides
                      </h4>
                      {mappings.map((m, idx) => (
                        <div key={idx} className="p-4 rounded-xl border border-border bg-card space-y-3">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="space-y-1">
                              <Label className="text-[11px]">Form ID (Google)</Label>
                              <Input
                                placeholder="e.g. 9876543210"
                                value={m.formId || ""}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setMappings((prev) =>
                                    prev.map((item, i) => (i === idx ? { ...item, formId: val } : item))
                                  );
                                }}
                                className="h-8 text-xs font-mono"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-[11px]">Campaign ID (Google)</Label>
                              <Input
                                placeholder="e.g. 1234567890"
                                value={m.campaignId || ""}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setMappings((prev) =>
                                    prev.map((item, i) => (i === idx ? { ...item, campaignId: val } : item))
                                  );
                                }}
                                className="h-8 text-xs font-mono"
                              />
                            </div>
                            <div className="space-y-1 flex items-end justify-between">
                              <div className="flex-1 mr-2">
                                <Label className="text-[11px]">Label</Label>
                                <Input
                                  placeholder="Campaign Label"
                                  value={m.label || ""}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setMappings((prev) =>
                                      prev.map((item, i) => (i === idx ? { ...item, label: val } : item))
                                    );
                                  }}
                                  className="h-8 text-xs"
                                />
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-rose-500 hover:text-rose-600"
                                onClick={() => setMappings((prev) => prev.filter((_, i) => i !== idx))}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex justify-end pt-2">
                    <Button size="sm" onClick={handleSaveMappings} disabled={savingSettings} className="gap-1.5 text-xs">
                      {savingSettings ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                      Save Field Mappings
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── TAB 4: EVENT LOGS TABLE ──────────────────────────────────────── */}
            <TabsContent value="events" className="space-y-4">
              <Card className="shadow-xs">
                <CardHeader className="pb-3 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-base font-bold">Inbound Webhook Events & Audit Log</CardTitle>
                    <CardDescription className="text-xs">
                      Inspect raw incoming Google Ads lead payloads, verify delivery status, and reprocess failed leads.
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select value={eventStatusFilter} onValueChange={(val) => { setEventStatusFilter(val); setEventPage(0); }}>
                      <SelectTrigger className="w-[140px] h-8 text-xs">
                        <SelectValue placeholder="All Statuses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL" className="text-xs">All Statuses</SelectItem>
                        <SelectItem value="PROCESSED" className="text-xs">Processed</SelectItem>
                        <SelectItem value="TEST" className="text-xs">Test Leads</SelectItem>
                        <SelectItem value="DUPLICATE" className="text-xs">Duplicates</SelectItem>
                        <SelectItem value="PAUSED" className="text-xs">Paused</SelectItem>
                        <SelectItem value="FAILED" className="text-xs">Failed</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs gap-1"
                      onClick={() => loadDetailData(selectedId, true)}
                    >
                      <RefreshCw className="h-3 w-3" /> Refresh
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {events.length === 0 ? (
                    <div className="text-center p-12 space-y-2">
                      <Clock className="h-8 w-8 text-muted-foreground mx-auto" />
                      <p className="text-sm font-semibold text-foreground">No Webhook Events Recorded</p>
                      <p className="text-xs text-muted-foreground">
                        Trigger a test submission from Google Ads or click "Send test data" in your Lead Form settings.
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-muted/50 border-b border-border text-muted-foreground font-semibold">
                          <tr>
                            <th className="p-3">Received Time</th>
                            <th className="p-3">Google Lead ID</th>
                            <th className="p-3">Form / Campaign</th>
                            <th className="p-3">GCLID</th>
                            <th className="p-3">Status</th>
                            <th className="p-3">CRM Lead</th>
                            <th className="p-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {events.map((ev) => (
                            <tr key={ev.id} className="hover:bg-muted/20 transition-colors">
                              <td className="p-3 whitespace-nowrap text-muted-foreground">
                                {ev.createdAt ? format(new Date(ev.createdAt), "MMM d, HH:mm:ss") : "—"}
                              </td>
                              <td className="p-3 font-mono font-medium text-foreground">{ev.googleLeadId}</td>
                              <td className="p-3">
                                <div className="space-y-0.5">
                                  <span className="font-mono text-[11px] text-foreground">Form: {ev.formId || "—"}</span>
                                  {ev.campaignId && <p className="text-[10px] text-muted-foreground font-mono">Camp: {ev.campaignId}</p>}
                                </div>
                              </td>
                              <td className="p-3 font-mono text-[11px] text-muted-foreground max-w-[130px] truncate">
                                {ev.gclid || "—"}
                              </td>
                              <td className="p-3">{getStatusBadge(ev.status)}</td>
                              <td className="p-3">
                                {ev.crmLeadId ? (
                                  <Link
                                    href={`/leads/active/${ev.crmLeadId}`}
                                    className="text-primary hover:underline font-mono text-[11px] flex items-center gap-1"
                                  >
                                    View Lead <ExternalLink className="h-3 w-3" />
                                  </Link>
                                ) : (
                                  <span className="text-muted-foreground">—</span>
                                )}
                              </td>
                              <td className="p-3 text-right space-x-1.5 whitespace-nowrap">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 text-[11px] px-2 gap-1 text-muted-foreground hover:text-foreground"
                                  onClick={() => setInspectedEvent(ev)}
                                >
                                  <FileText className="h-3 w-3" /> Inspect
                                </Button>

                                {(ev.status === "FAILED" || ev.status === "RECEIVED") && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 text-[11px] px-2 gap-1"
                                    disabled={reprocessingId === ev.id}
                                    onClick={() => handleReprocess(ev.id)}
                                  >
                                    {reprocessingId === ev.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
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
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}

      {/* ── Create Integration Modal ─────────────────────────────────────────── */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Connect Google Ads Account</DialogTitle>
            <DialogDescription className="text-xs">
              Generate a dedicated, authenticated webhook endpoint and secret key for your Google Ads Lead Form assets.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Account / Campaign Name <span className="text-destructive">*</span></Label>
              <Input
                placeholder="e.g. Google Search Ads - Main Branch"
                value={createForm.name}
                onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Default Assigned Staff</Label>
              <Select
                value={createForm.defaultOwnerId || "AUTO"}
                onValueChange={(val) => setCreateForm((f) => ({ ...f, defaultOwnerId: val === "AUTO" ? "" : val }))}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Automatic Round-Robin (Default)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AUTO" className="text-xs">
                    Automatic (Fewest Open Leads)
                  </SelectItem>
                  {staffList.map((user) => (
                    <SelectItem key={user.id} value={user.id} className="text-xs">
                      {user.firstName} {user.lastName || ""} ({user.roleName || user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[10px] text-muted-foreground">New leads will be routed to this agent or distributed by existing round-robin rules.</p>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" size="sm" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleCreateIntegration} disabled={savingSettings} className="gap-1.5">
              {savingSettings ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Key className="h-3.5 w-3.5" />}
              Generate Credentials
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Regenerate Key Confirmation Modal ─────────────────────────────────── */}
      <Dialog open={isRegenerateOpen} onOpenChange={setIsRegenerateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-amber-600 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" /> Regenerate Google Key?
            </DialogTitle>
            <DialogDescription className="text-xs space-y-2 pt-1">
              <p>
                Regenerating this key will <strong>immediately invalidate the old key</strong>. Any leads submitted with the old key will be rejected with <code>401 Unauthorized</code>.
              </p>
              <p>
                You must update the key in your Google Ads Lead Form settings immediately after regenerating.
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" size="sm" onClick={() => setIsRegenerateOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleRegenerateKey}
              disabled={savingSettings}
              className="gap-1.5"
            >
              {savingSettings ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
              Yes, Regenerate Key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Disconnect Integration Confirmation Modal ─────────────────────────── */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-destructive flex items-center gap-2">
              <Trash2 className="h-5 w-5" /> Disconnect Google Ads Account?
            </DialogTitle>
            <DialogDescription className="text-xs pt-1">
              Are you sure you want to delete <strong>{integration?.name}</strong>? The webhook URL will stop accepting submissions immediately. Existing leads in your CRM will remain untouched.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" size="sm" onClick={() => setIsDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteIntegration}
              disabled={savingSettings}
            >
              Delete Integration
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Raw Payload Viewer Modal ─────────────────────────────────────────── */}
      <Dialog open={Boolean(inspectedEvent)} onOpenChange={() => setInspectedEvent(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-6">
          <DialogHeader className="pb-3 border-b border-border">
            <DialogTitle className="text-base font-bold flex items-center justify-between">
              <span>Raw Webhook Event #{inspectedEvent?.googleLeadId}</span>
              {inspectedEvent && getStatusBadge(inspectedEvent.status)}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Received at {inspectedEvent?.createdAt ? format(new Date(inspectedEvent.createdAt), "PPpp") : "—"}
            </DialogDescription>
          </DialogHeader>

          {inspectedEvent?.errorMessage && (
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-300">
              <span className="font-bold">Error:</span> {inspectedEvent.errorMessage}
            </div>
          )}

          <div className="flex-1 overflow-y-auto space-y-2 py-2">
            <Label className="text-xs font-semibold">Raw JSON Payload:</Label>
            <pre className="p-3 rounded-lg bg-muted text-[11px] font-mono overflow-x-auto text-foreground border border-border select-all">
              {(() => {
                try {
                  return JSON.stringify(JSON.parse(inspectedEvent?.rawPayload || "{}"), null, 2);
                } catch {
                  return inspectedEvent?.rawPayload || "{}";
                }
              })()}
            </pre>
          </div>

          <DialogFooter className="pt-2 border-t border-border flex justify-between items-center sm:justify-between">
            <Button
              variant="outline"
              size="sm"
              className="text-xs gap-1.5"
              onClick={() => handleCopy(inspectedEvent?.rawPayload, "json")}
            >
              <Copy className="h-3.5 w-3.5" /> Copy JSON
            </Button>

            <Button size="sm" onClick={() => setInspectedEvent(null)} className="text-xs">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
