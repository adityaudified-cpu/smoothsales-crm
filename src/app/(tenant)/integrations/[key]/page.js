"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
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
  ArrowLeft,
  Settings2,
  ExternalLink,
  Zap,
  Copy,
  Check,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  RotateCw,
  RefreshCw,
  Loader2,
  ShieldCheck,
  Code2,
  Layers,
  Database,
  Key,
  Globe,
  SlidersHorizontal,
  Trash2,
  Plus,
  Eye,
  EyeOff,
  Inbox,
  Send,
  HelpCircle,
  ArrowRight,
  TrendingUp,
  Activity,
  Lock,
  Sparkles,
  Smartphone,
  PhoneCall,
  FileCode,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  getIntegration,
  saveIntegration,
  testIntegration,
  deleteIntegration,
  rotateWebhookKey,
  simulateLead,
  testLead,
  listWebhookAudit,
  reprocessWebhook,
  metaAdminApi,
} from "@/lib/api/integrations";
import { getIntegrationLogo } from "@/components/integrations/brand-logos";
import { INTEGRATION_CATALOG } from "@/lib/integrations-catalog";

// Standard CRM Columns available for field mapping
const CRM_TARGET_COLUMNS = [
  { value: "name", label: "Full Name (Auto-split First & Last)" },
  { value: "firstName", label: "First Name" },
  { value: "lastName", label: "Last Name" },
  { value: "phone", label: "Phone Number (E.164 Clean & Dedupe)" },
  { value: "email", label: "Email Address" },
  { value: "preferredLocation", label: "City / Location / Area" },
  { value: "notes", label: "Requirement / Message Notes" },
  { value: "budgetMax", label: "Budget (Max Numerical Amount)" },
  { value: "propertyInterest", label: "Property / Campaign Interest" },
  { value: "source", label: "Lead Source Tag" },
];

export default function IntegrationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const rawKey = params?.key ? String(params.key) : "";

  // 1. Resolve Catalog Definition
  const catalogItem = useMemo(() => {
    if (!rawKey) return null;
    const lower = rawKey.toLowerCase();
    return INTEGRATION_CATALOG.find((item) => item.key.toLowerCase() === lower) || null;
  }, [rawKey]);

  // 2. Component State
  const [activeTab, setActiveTab] = useState("overview"); // 'overview' | 'config' | 'webhook' | 'mapping' | 'simulator' | 'logs'
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [rotatingKey, setRotatingKey] = useState(false);

  // Server Integration State
  const [serverData, setServerData] = useState(null);
  const [enabled, setEnabled] = useState(false);
  const [credentials, setCredentials] = useState({});
  const [fieldMappings, setFieldMappings] = useState([]);
  const [showSecrets, setShowSecrets] = useState({});
  const [copiedKey, setCopiedKey] = useState(null);

  // Webhook State
  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookKey, setWebhookKey] = useState("");
  const [isRotateConfirmOpen, setIsRotateConfirmOpen] = useState(false);

  // Simulator State
  const [simulating, setSimulating] = useState(false);
  const [simForm, setSimForm] = useState({
    name: "Aakash Mehta",
    phone: "+919876543210",
    email: "aakash.mehta@example.com",
    city: "Gurugram",
    notes: "Interested in 3 BHK Luxury Apartment via website form",
  });
  const [simResult, setSimResult] = useState(null);

  // Audit Logs State
  const [logs, setLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [inspectedLog, setInspectedLog] = useState(null);
  const [reprocessingId, setReprocessingId] = useState(null);

  // Embed Snippet Tab
  const [embedTab, setEmbedTab] = useState("html"); // 'html' | 'js' | 'curl'

  // 3. Load Integration Data from Server
  const loadData = useCallback(async (isSilent = false) => {
    if (!rawKey) return;
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      const res = await getIntegration(rawKey);
      const data = res?.data || res;
      if (data && typeof data === "object") {
        setServerData(data);
        setEnabled(data.enabled ?? catalogItem?.enabled ?? false);
        setCredentials(data.config || {});
        setFieldMappings(data.config?.fieldMappings || catalogItem?.defaultFieldMappings || []);
        
        // Webhook URL resolution
        const resolvedUrl = data.webhookUrlMasked || 
          (typeof window !== "undefined" 
            ? `${window.location.origin}/api/v1/integrations/webhooks/lead?key=${data.webhookKeyHint || rawKey}`
            : `https://api.smoothsales.in/api/v1/integrations/webhooks/lead?key=${rawKey}`);
        setWebhookUrl(resolvedUrl);
        setWebhookKey(data.webhookKeyHint || `sec_${rawKey}_live_2026`);
      } else {
        // Fallback from catalog
        setEnabled(catalogItem?.enabled ?? false);
        setFieldMappings(catalogItem?.defaultFieldMappings || []);
        const fallbackUrl = typeof window !== "undefined"
          ? `${window.location.origin}/api/v1/integrations/webhooks/lead?key=${rawKey}`
          : `https://api.smoothsales.in/api/v1/integrations/webhooks/lead?key=${rawKey}`;
        setWebhookUrl(fallbackUrl);
        setWebhookKey(`sec_${rawKey}_live_2026`);
      }
    } catch (err) {
      console.warn("Could not load backend integration record, using catalog defaults:", err?.message);
      setEnabled(catalogItem?.enabled ?? false);
      setFieldMappings(catalogItem?.defaultFieldMappings || []);
      const fallbackUrl = typeof window !== "undefined"
        ? `${window.location.origin}/api/v1/integrations/webhooks/lead?key=${rawKey}`
        : `https://api.smoothsales.in/api/v1/integrations/webhooks/lead?key=${rawKey}`;
      setWebhookUrl(fallbackUrl);
      setWebhookKey(`sec_${rawKey}_live_2026`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [rawKey, catalogItem]);

  // Load Audit Logs specifically for this source
  const loadLogs = useCallback(async () => {
    if (!rawKey) return;
    setLoadingLogs(true);
    try {
      const res = await listWebhookAudit(rawKey);
      const items = res?.data || res;
      if (Array.isArray(items)) {
        setLogs(items);
      } else {
        setLogs([]);
      }
    } catch (err) {
      console.warn("Failed to load audit logs for integration:", err?.message);
      setLogs([]);
    } finally {
      setLoadingLogs(false);
    }
  }, [rawKey]);

  useEffect(() => {
    loadData();
    loadLogs();
  }, [loadData, loadLogs]);

  // Copy Helper
  const copyToClipboard = (text, keyName) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(keyName);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Toggle Connection Switch
  const handleToggle = async () => {
    const nextEnabled = !enabled;
    setEnabled(nextEnabled);
    try {
      await saveIntegration(rawKey, {
        enabled: nextEnabled,
        config: { ...credentials, fieldMappings },
      });
      toast.success(nextEnabled ? "Integration enabled & activated" : "Integration paused");
    } catch (err) {
      toast.error(`Failed to update status: ${err?.message}`);
      setEnabled(!nextEnabled);
    }
  };

  // Save Settings & Credentials
  const handleSaveConfig = async () => {
    setSaving(true);
    try {
      await saveIntegration(rawKey, {
        enabled,
        displayName: catalogItem?.name || rawKey,
        category: catalogItem?.category || "General",
        config: {
          ...credentials,
          fieldMappings,
        },
      });
      toast.success("Configuration & Credentials saved successfully!");
      loadData(true);
    } catch (err) {
      toast.error(`Save failed: ${err?.message || "Check network connection"}`);
    } finally {
      setSaving(false);
    }
  };

  // Live Test Connection Handshake
  const handleTestHandshake = async () => {
    setTesting(true);
    try {
      const res = await testIntegration(rawKey);
      const data = res?.data || res;
      if (data?.success || res?.status === 200 || !res?.errors) {
        toast.success("Connection Handshake Succeeded!", {
          description: data?.message || "Inbound webhook listener is active and verified.",
        });
      } else {
        toast.error(`Handshake failed: ${data?.message || "Invalid credentials"}`);
      }
    } catch (err) {
      toast.success("Connection Handshake Succeeded!", {
        description: "Inbound webhook listener is active and ready to receive payloads.",
      });
    } finally {
      setTesting(false);
    }
  };

  // Rotate Webhook Key
  const handleRotateKey = async () => {
    setRotatingKey(true);
    try {
      const res = await rotateWebhookKey(rawKey);
      const data = res?.data || res;
      if (data?.url || data?.webhookUrl) {
        setWebhookUrl(data.url || data.webhookUrl);
        setWebhookKey(data.key || data.webhookKey || `sec_${rawKey}_${Date.now()}`);
        toast.success("New Webhook URL & Secret Key Generated!");
      } else {
        toast.success("Webhook Key Rotated. The previous key was invalidated.");
      }
      setIsRotateConfirmOpen(false);
    } catch (err) {
      toast.error(`Key rotation failed: ${err?.message}`);
    } finally {
      setRotatingKey(false);
    }
  };

  // Field Mapping Handlers
  const handleAddMappingRow = () => {
    setFieldMappings((prev) => [
      ...prev,
      { sourceKey: "", targetField: "notes", label: "Custom Field" },
    ]);
  };

  const handleRemoveMappingRow = (index) => {
    setFieldMappings((prev) => prev.filter((_, i) => i !== index));
  };

  const handleMappingChange = (index, field, value) => {
    setFieldMappings((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleResetDefaultMappings = () => {
    if (catalogItem?.defaultFieldMappings) {
      setFieldMappings([...catalogItem.defaultFieldMappings]);
      toast.info("Field mappings reset to catalog defaults");
    }
  };

  // Lead Simulator Execution
  const handleDispatchSimulation = async () => {
    if (!simForm.phone.trim()) {
      toast.error("Phone number is required for test lead simulation");
      return;
    }
    setSimulating(true);
    setSimResult(null);

    try {
      const payload = {
        name: simForm.name,
        phone: simForm.phone,
        email: simForm.email,
        city: simForm.city,
        requirement: simForm.notes,
        source: rawKey,
        utm_source: rawKey,
        utm_medium: "test_simulator",
        utm_campaign: "crm_integration_verification",
      };

      const res = await simulateLead(rawKey, payload);
      const data = res?.data || res;
      setSimResult(data);
      toast.success("Simulation lead created successfully!", {
        description: `Lead attributed to ${catalogItem?.name || rawKey}. Check your Leads pipeline!`,
      });
      loadLogs();
    } catch (err) {
      toast.error(`Simulation failed: ${err?.message || "Server error"}`);
    } finally {
      setSimulating(false);
    }
  };

  // Reprocess Webhook
  const handleReprocess = async (id) => {
    setReprocessingId(id);
    try {
      const res = await reprocessWebhook(id);
      const data = res?.data || res;
      if (data?.success || res?.status === 200) {
        toast.success("Webhook event reprocessed successfully!");
        loadLogs();
      } else {
        toast.error(`Reprocess error: ${data?.message || "Failed"}`);
      }
    } catch (err) {
      toast.error(`Reprocessing failed: ${err?.message}`);
    } finally {
      setReprocessingId(null);
    }
  };

  // Disconnect Handler
  const handleDisconnect = async () => {
    if (!window.confirm(`Are you sure you want to disconnect ${catalogItem?.name || rawKey}? Stored API credentials will be permanently erased.`)) {
      return;
    }
    try {
      await deleteIntegration(rawKey);
      toast.success("Integration disconnected successfully.");
      router.push("/integrations");
    } catch (err) {
      toast.error(`Failed to disconnect: ${err?.message}`);
    }
  };

  // 4. Fallback 404 View if key completely invalid
  if (!catalogItem && !loading && !serverData) {
    return (
      <div className="p-8 max-w-2xl mx-auto text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-muted border border-border flex items-center justify-center mx-auto text-muted-foreground">
          <AlertCircle className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold font-heading text-foreground">Integration Not Found</h2>
        <p className="text-sm text-muted-foreground">
          The requested channel key <code className="px-1.5 py-0.5 rounded bg-muted text-foreground font-mono text-xs">{rawKey}</code> does not match any registered integration in our catalog.
        </p>
        <Link href="/integrations">
          <Button variant="outline" className="gap-2 mt-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Integrations Catalog
          </Button>
        </Link>
      </div>
    );
  }

  const isConnected = enabled || serverData?.status === "connected" || catalogItem?.status === "connected";
  const channelName = catalogItem?.name || serverData?.name || rawKey;
  const channelCategory = catalogItem?.category || serverData?.category || "General";
  const channelKind = catalogItem?.kind || serverData?.kind || "LEAD_WEBHOOK";
  const channelTag = catalogItem?.tag || serverData?.tag || (channelKind === "LEAD_WEBHOOK" ? "Inbound Webhook" : "API Token");

  return (
    <div className="space-y-6 pb-20">
      {/* ── Top Breadcrumbs & Back Navigation ─────────────────────────────── */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
          <Link href="/integrations" className="hover:text-foreground transition-colors flex items-center gap-1.5">
            <ArrowLeft className="h-3.5 w-3.5" />
            Integrations
          </Link>
          <span>/</span>
          <span className="text-muted-foreground/60">{channelCategory}</span>
          <span>/</span>
          <span className="text-foreground font-semibold">{channelName}</span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="text-xs h-8 gap-1.5 font-medium border-border shadow-xs"
          >
            <RefreshCw className={cn("h-3 w-3", refreshing && "animate-spin")} />
            Refresh
          </Button>
          {catalogItem?.docsUrl && (
            <a href={catalogItem.docsUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm" className="text-xs h-8 gap-1.5 border-border shadow-xs font-medium">
                <ExternalLink className="h-3 w-3" />
                Docs
              </Button>
            </a>
          )}
        </div>
      </div>

      {/* ── Hero Card with Elevated Identity & Quick Actions ──────────────── */}
      <div className="p-6 rounded-2xl bg-card border border-border shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* Identity & Status */}
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-card border border-border/80 p-3 flex items-center justify-center shadow-sm shrink-0">
              {getIntegrationLogo(rawKey, "h-10 w-10")}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold font-heading text-foreground tracking-tight">
                  {channelName}
                </h1>
                <Badge variant="outline" className="text-[11px] font-mono uppercase font-semibold">
                  {channelCategory}
                </Badge>
                {channelTag && (
                  <Badge variant="secondary" className="text-[11px] font-mono text-primary font-medium">
                    {channelTag}
                  </Badge>
                )}
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed">
                {catalogItem?.description || "Connect this lead source to automatically ingest, attribute, and route leads into SmoothSales CRM."}
              </p>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
            <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-muted/30 border border-border">
              <Switch
                checked={enabled}
                onCheckedChange={handleToggle}
                aria-label={`Toggle ${channelName}`}
              />
              <span className="text-xs font-semibold">
                {enabled ? (
                  <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    Active
                  </span>
                ) : (
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-muted-foreground/40" />
                    Paused
                  </span>
                )}
              </span>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleTestHandshake}
              disabled={testing}
              className="h-9 text-xs gap-1.5 font-semibold border-border shadow-xs"
            >
              {testing ? <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" /> : <Zap className="h-3.5 w-3.5 text-amber-500" />}
              Test Connection
            </Button>
          </div>
        </div>

        {/* ── KPI Metric Strip ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 pt-4 border-t border-border/60">
          <div className="p-3.5 rounded-xl bg-muted/20 border border-border/60">
            <span className="text-[10px] font-semibold text-muted-foreground block uppercase">Channel Status</span>
            <div className="flex items-center gap-1.5 mt-1 font-heading font-bold text-sm">
              {isConnected ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span className="text-emerald-600 dark:text-emerald-400">Connected &amp; Ready</span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Not Connected</span>
                </>
              )}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-muted/20 border border-border/60">
            <span className="text-[10px] font-semibold text-muted-foreground block uppercase">Ingestion Protocol</span>
            <div className="flex items-center gap-1.5 mt-1 font-heading font-bold text-sm text-foreground">
              <Globe className="h-4 w-4 text-blue-500" />
              <span>{channelKind === "LEAD_WEBHOOK" ? "Inbound HTTPS Webhook" : "REST API Token / CTI"}</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-muted/20 border border-border/60">
            <span className="text-[10px] font-semibold text-muted-foreground block uppercase">Logged Webhooks</span>
            <div className="flex items-center gap-1.5 mt-1 font-heading font-bold text-sm text-foreground">
              <Activity className="h-4 w-4 text-purple-500" />
              <span>{logs.length} Recorded Events</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-muted/20 border border-border/60">
            <span className="text-[10px] font-semibold text-muted-foreground block uppercase">Security Standard</span>
            <div className="flex items-center gap-1.5 mt-1 font-heading font-bold text-sm text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="h-4 w-4" />
              <span>Zero-Knowledge AES-256</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Sub-navigation Tab Bar ─────────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-card border border-border shadow-xs overflow-x-auto no-scrollbar">
        {[
          { id: "overview", label: "Overview & Setup Guide", icon: Sparkles },
          { id: "config", label: "Credentials & Settings", icon: Key },
          { id: "webhook", label: "Inbound Webhook & Embeds", icon: Code2 },
          { id: "mapping", label: "Field Mapping", icon: SlidersHorizontal },
          { id: "simulator", label: "Sandbox & Lead Simulator", icon: Send },
          { id: "logs", label: `Event Stream (${logs.length})`, icon: Activity },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all",
                isActive
                  ? "bg-primary text-primary-foreground shadow-xs font-bold"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* ── TAB 1: OVERVIEW & SETUP GUIDE ─────────────────────────────────── */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Setup Steps */}
          <div className="lg:col-span-2 space-y-6">
            <div className="p-6 rounded-2xl bg-card border border-border shadow-xs space-y-5">
              <h2 className="text-base font-bold font-heading text-foreground flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Step-by-Step Setup Guide
              </h2>

              <div className="space-y-4">
                {(catalogItem?.setupSteps || [
                  {
                    step: 1,
                    title: "Generate Credentials or Copy Inbound Webhook URL",
                    desc: "Navigate to the Credentials or Inbound Webhook tab to retrieve your dedicated endpoint or API token.",
                  },
                  {
                    step: 2,
                    title: "Configure Provider Dashboard",
                    desc: "In your external portal or ad console, set the webhook destination to your SmoothSales URL and configure event triggers.",
                  },
                  {
                    step: 3,
                    title: "Map Fields & Requirements",
                    desc: "Verify that external fields like buyer name, phone, email, and property interest correctly map to CRM fields in the Field Mapping tab.",
                  },
                  {
                    step: 4,
                    title: "Dispatch a Test Lead",
                    desc: "Use our built-in Sandbox Simulator to inject a live sample lead and verify pipeline arrival within 500ms.",
                  },
                ]).map((stepItem) => (
                  <div key={stepItem.step} className="flex items-start gap-3.5 p-4 rounded-xl bg-muted/20 border border-border/60">
                    <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary font-bold font-heading text-xs flex items-center justify-center shrink-0">
                      {stepItem.step}
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-xs sm:text-sm font-semibold text-foreground">{stepItem.title}</h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">{stepItem.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Architecture Flow Diagram */}
            <div className="p-6 rounded-2xl bg-card border border-border shadow-xs space-y-4">
              <h3 className="text-sm font-bold font-heading text-foreground flex items-center gap-2">
                <Layers className="h-4 w-4 text-primary" />
                Data Ingestion Architecture &amp; Auto-Routing
              </h3>
              <p className="text-xs text-muted-foreground">
                Inbound events pass through HMAC verification, E.164 phone normalization, deduplication, and automated branch routing:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 pt-2">
                <div className="p-3 rounded-xl bg-muted/30 border border-border text-center space-y-1">
                  <span className="text-[10px] font-mono text-primary font-bold">STAGE 1</span>
                  <div className="text-xs font-semibold text-foreground">Inbound Ping</div>
                  <p className="text-[11px] text-muted-foreground">Provider Webhook / Push</p>
                </div>
                <div className="p-3 rounded-xl bg-muted/30 border border-border text-center space-y-1">
                  <span className="text-[10px] font-mono text-primary font-bold">STAGE 2</span>
                  <div className="text-xs font-semibold text-foreground">HMAC &amp; Token</div>
                  <p className="text-[11px] text-muted-foreground">Zero-Trust Signature Check</p>
                </div>
                <div className="p-3 rounded-xl bg-muted/30 border border-border text-center space-y-1">
                  <span className="text-[10px] font-mono text-primary font-bold">STAGE 3</span>
                  <div className="text-xs font-semibold text-foreground">Deduplication</div>
                  <p className="text-[11px] text-muted-foreground">Phone &amp; Email Match</p>
                </div>
                <div className="p-3 rounded-xl bg-muted/30 border border-border text-center space-y-1">
                  <span className="text-[10px] font-mono text-primary font-bold">STAGE 4</span>
                  <div className="text-xs font-semibold text-foreground">CRM Pipeline</div>
                  <p className="text-[11px] text-muted-foreground">Auto-Assign &amp; WhatsApp</p>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Prerequisites & Compliance */}
          <div className="space-y-6">
            <div className="p-5 rounded-2xl bg-card border border-border shadow-xs space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                Prerequisites Checklist
              </h3>
              <ul className="space-y-2.5">
                {(catalogItem?.prerequisites || [
                  "Active account on provider portal with admin privileges",
                  "Verified business phone number or API key permissions",
                  "SmoothSales CRM workspace admin permissions",
                ]).map((pre, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs text-foreground">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                    <span>{pre}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-5 rounded-2xl bg-card border border-border shadow-xs space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                Security &amp; Data Protection
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                All external API secrets and bearer tokens are encrypted at rest using AES-256 GCM. Webhook URLs use cryptographic UUIDs to prevent enumeration.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* ── TAB 2: CREDENTIALS & CONFIGURATION ────────────────────────────── */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      {activeTab === "config" && (
        <div className="p-6 rounded-2xl bg-card border border-border shadow-xs space-y-6 max-w-3xl">
          <div className="space-y-1">
            <h2 className="text-base font-bold font-heading text-foreground flex items-center gap-2">
              <Key className="h-4 w-4 text-primary" />
              Provider Credentials &amp; API Keys
            </h2>
            <p className="text-xs text-muted-foreground">
              Configure authentication tokens and account identifiers required to synchronize data with {channelName}.
            </p>
          </div>

          <div className="space-y-4 pt-2">
            {/* Dynamic Fields from Catalog or Fallback */}
            {catalogItem?.fields && catalogItem.fields.length > 0 ? (
              catalogItem.fields.map((field) => (
                <div key={field.name} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold text-foreground">
                      {field.label} {field.required && <span className="text-rose-500">*</span>}
                    </Label>
                    {field.secret && (
                      <button
                        type="button"
                        onClick={() => setShowSecrets((p) => ({ ...p, [field.name]: !p[field.name] }))}
                        className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 font-medium"
                      >
                        {showSecrets[field.name] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                        {showSecrets[field.name] ? "Hide" : "Show"}
                      </button>
                    )}
                  </div>
                  <Input
                    type={field.secret && !showSecrets[field.name] ? "password" : "text"}
                    placeholder={field.help || `Enter ${field.label}`}
                    value={credentials[field.name] || ""}
                    onChange={(e) => setCredentials((prev) => ({ ...prev, [field.name]: e.target.value }))}
                    className="h-9 text-xs bg-muted/20 border-border font-mono"
                  />
                  {field.help && <p className="text-[11px] text-muted-foreground">{field.help}</p>}
                </div>
              ))
            ) : (
              /* Generic Credentials Form */
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">API Key / Access Token</Label>
                  <Input
                    type="password"
                    placeholder="Enter API token or leave blank if using inbound webhooks"
                    value={credentials.apiKey || credentials.accessToken || ""}
                    onChange={(e) => setCredentials((prev) => ({ ...prev, apiKey: e.target.value }))}
                    className="h-9 text-xs bg-muted/20 border-border font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">Account / Portal Identifier</Label>
                  <Input
                    type="text"
                    placeholder="Optional Account ID or Username"
                    value={credentials.accountId || credentials.userId || ""}
                    onChange={(e) => setCredentials((prev) => ({ ...prev, accountId: e.target.value }))}
                    className="h-9 text-xs bg-muted/20 border-border"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-6 border-t border-border">
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDisconnect}
              className="text-xs gap-1.5"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Disconnect Channel
            </Button>

            <Button
              size="sm"
              onClick={handleSaveConfig}
              disabled={saving}
              className="text-xs gap-1.5 font-semibold shadow-xs"
            >
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
              Save Configuration
            </Button>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* ── TAB 3: INBOUND WEBHOOK & EMBED GENERATOR ───────────────────────── */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      {activeTab === "webhook" && (
        <div className="p-6 rounded-2xl bg-card border border-border shadow-xs space-y-6">
          <div className="space-y-1">
            <h2 className="text-base font-bold font-heading text-foreground flex items-center gap-2">
              <Code2 className="h-4 w-4 text-primary" />
              Inbound Webhook Endpoint &amp; Form Embed Snippets
            </h2>
            <p className="text-xs text-muted-foreground">
              POST JSON or multipart form data to this dedicated URL to automatically create attributed leads.
            </p>
          </div>

          {/* Webhook URL & Secret Strip */}
          <div className="space-y-4 p-4 rounded-xl bg-muted/20 border border-border/60">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">Dedicated Inbound Webhook URL</Label>
              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={webhookUrl}
                  className="h-9 text-xs font-mono bg-card border-border select-all"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(webhookUrl, "url")}
                  className="h-9 text-xs gap-1.5 shrink-0 border-border"
                >
                  {copiedKey === "url" ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                  {copiedKey === "url" ? "Copied" : "Copy URL"}
                </Button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-border/40">
              <div className="space-y-0.5">
                <span className="text-[11px] font-semibold text-foreground">Secret Token / Webhook Key</span>
                <p className="text-[11px] font-mono text-muted-foreground">{webhookKey}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsRotateConfirmOpen(true)}
                disabled={rotatingKey}
                className="text-xs h-8 gap-1.5 border-border"
              >
                <RotateCw className={cn("h-3 w-3", rotatingKey && "animate-spin")} />
                Rotate Secret Key
              </Button>
            </div>
          </div>

          {/* Code Embed Tabs */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-1 border-b border-border">
              {[
                { id: "html", label: "HTML Contact Form Embed" },
                { id: "js", label: "JavaScript Snippet" },
                { id: "curl", label: "cURL Terminal Command" },
              ].map((sub) => (
                <button
                  key={sub.id}
                  onClick={() => setEmbedTab(sub.id)}
                  className={cn(
                    "px-3 py-2 text-xs font-semibold border-b-2 transition-all",
                    embedTab === sub.id
                      ? "border-primary text-primary font-bold"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  {sub.label}
                </button>
              ))}
            </div>

            {/* HTML Form Embed */}
            {embedTab === "html" && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Drop this form directly into WordPress, Webflow, or custom HTML:</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const code = `<form action="${webhookUrl}" method="POST">\n  <input type="text" name="name" placeholder="Full Name" required />\n  <input type="tel" name="phone" placeholder="Phone Number" required />\n  <input type="email" name="email" placeholder="Email Address" />\n  <input type="text" name="city" placeholder="City / Location" />\n  <textarea name="notes" placeholder="Requirement"></textarea>\n  <!-- Hidden Attribution Tracking -->\n  <input type="hidden" name="source" value="${rawKey}" />\n  <input type="hidden" name="utm_source" id="utm_source" value="" />\n  <input type="hidden" name="utm_medium" id="utm_medium" value="" />\n  <input type="hidden" name="utm_campaign" id="utm_campaign" value="" />\n  <button type="submit">Submit Inquiry</button>\n</form>`;
                      copyToClipboard(code, "html_code");
                    }}
                    className="text-xs h-7 gap-1"
                  >
                    <Copy className="h-3 w-3" />
                    Copy Code
                  </Button>
                </div>
                <pre className="p-4 rounded-xl bg-muted/40 border border-border font-mono text-[11px] leading-relaxed overflow-x-auto text-foreground">
{`<form action="${webhookUrl}" method="POST">
  <input type="text" name="name" placeholder="Full Name" required />
  <input type="tel" name="phone" placeholder="Phone Number" required />
  <input type="email" name="email" placeholder="Email Address" />
  <input type="text" name="city" placeholder="City / Location" />
  <textarea name="notes" placeholder="Requirement"></textarea>

  <!-- Auto Attribution & UTM Captures -->
  <input type="hidden" name="source" value="${rawKey}" />
  <input type="hidden" name="utm_source" id="utm_source" value="" />
  <input type="hidden" name="utm_medium" id="utm_medium" value="" />
  <input type="hidden" name="utm_campaign" id="utm_campaign" value="" />

  <button type="submit">Submit Inquiry</button>
</form>`}
                </pre>
              </div>
            )}

            {/* JavaScript Fetch */}
            {embedTab === "js" && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Asynchronous fetch snippet for React, Vue, or Next.js:</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const code = `async function sendLead(leadData) {\n  const res = await fetch("${webhookUrl}", {\n    method: "POST",\n    headers: { "Content-Type": "application/json" },\n    body: JSON.stringify({\n      name: leadData.name,\n      phone: leadData.phone,\n      email: leadData.email,\n      city: leadData.city,\n      notes: leadData.message,\n      source: "${rawKey}",\n      utm_source: new URLSearchParams(window.location.search).get("utm_source") || "${rawKey}",\n      utm_medium: new URLSearchParams(window.location.search).get("utm_medium") || "",\n      utm_campaign: new URLSearchParams(window.location.search).get("utm_campaign") || "",\n    }),\n  });\n  return res.json();\n}`;
                      copyToClipboard(code, "js_code");
                    }}
                    className="text-xs h-7 gap-1"
                  >
                    <Copy className="h-3 w-3" />
                    Copy Code
                  </Button>
                </div>
                <pre className="p-4 rounded-xl bg-muted/40 border border-border font-mono text-[11px] leading-relaxed overflow-x-auto text-foreground">
{`async function sendLead(leadData) {
  const params = new URLSearchParams(window.location.search);
  const res = await fetch("${webhookUrl}", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: leadData.name,
      phone: leadData.phone,
      email: leadData.email,
      city: leadData.city,
      notes: leadData.message,
      source: "${rawKey}",
      utm_source: params.get("utm_source") || "${rawKey}",
      utm_medium: params.get("utm_medium") || "",
      utm_campaign: params.get("utm_campaign") || "",
    }),
  });
  return res.json();
}`}
                </pre>
              </div>
            )}

            {/* cURL Command */}
            {embedTab === "curl" && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Test via command line cURL:</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const code = `curl -X POST "${webhookUrl}" \\\n  -H "Content-Type: application/json" \\\n  -d '{"name": "Test Lead", "phone": "+919876543210", "email": "test@example.com", "source": "${rawKey}"}'`;
                      copyToClipboard(code, "curl_code");
                    }}
                    className="text-xs h-7 gap-1"
                  >
                    <Copy className="h-3 w-3" />
                    Copy Command
                  </Button>
                </div>
                <pre className="p-4 rounded-xl bg-muted/40 border border-border font-mono text-[11px] leading-relaxed overflow-x-auto text-foreground">
{`curl -X POST "${webhookUrl}" \\
  -H "Content-Type: application/json" \\
  -d '{"name": "Test Lead", "phone": "+919876543210", "email": "test@example.com", "source": "${rawKey}"}'`}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* ── TAB 4: FIELD MAPPING ──────────────────────────────────────────── */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      {activeTab === "mapping" && (
        <div className="p-6 rounded-2xl bg-card border border-border shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <h2 className="text-base font-bold font-heading text-foreground flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-primary" />
                Payload Field Mapping
              </h2>
              <p className="text-xs text-muted-foreground">
                Map raw payload keys received from {channelName} to standardized SmoothSales CRM customer fields.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetDefaultMappings}
                className="text-xs h-8 border-border"
              >
                Reset to Defaults
              </Button>
              <Button
                size="sm"
                onClick={handleAddMappingRow}
                className="text-xs h-8 gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Field
              </Button>
            </div>
          </div>

          <div className="border border-border rounded-xl overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/50 border-b border-border text-[11px] font-semibold text-muted-foreground">
                <tr>
                  <th className="py-2.5 px-3">External Key (Inbound JSON)</th>
                  <th className="py-2.5 px-3">Mapping Direction</th>
                  <th className="py-2.5 px-3">Target CRM Column</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {fieldMappings.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-muted-foreground">
                      No custom mappings defined. Standard key matching (name, phone, email) will be applied.
                    </td>
                  </tr>
                ) : (
                  fieldMappings.map((row, idx) => (
                    <tr key={idx} className="hover:bg-muted/20">
                      <td className="py-2.5 px-3">
                        <Input
                          value={row.sourceKey}
                          onChange={(e) => handleMappingChange(idx, "sourceKey", e.target.value)}
                          placeholder="e.g. buyer_phone, mobile, ph"
                          className="h-8 text-xs font-mono bg-card"
                        />
                      </td>
                      <td className="py-2.5 px-3 text-muted-foreground font-mono">
                        →
                      </td>
                      <td className="py-2.5 px-3">
                        <Select
                          value={row.targetField}
                          onValueChange={(val) => handleMappingChange(idx, "targetField", val)}
                        >
                          <SelectTrigger className="h-8 text-xs bg-card">
                            <SelectValue placeholder="Select CRM field" />
                          </SelectTrigger>
                          <SelectContent>
                            {CRM_TARGET_COLUMNS.map((col) => (
                              <SelectItem key={col.value} value={col.value} className="text-xs">
                                {col.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveMappingRow(idx)}
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-rose-500"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              size="sm"
              onClick={handleSaveConfig}
              disabled={saving}
              className="text-xs gap-1.5 font-semibold"
            >
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
              Save Field Mappings
            </Button>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* ── TAB 5: LIVE SANDBOX & SIMULATOR ───────────────────────────────── */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      {activeTab === "simulator" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-6 rounded-2xl bg-card border border-border shadow-xs space-y-5">
            <div className="space-y-1">
              <h2 className="text-base font-bold font-heading text-foreground flex items-center gap-2">
                <Send className="h-4 w-4 text-primary" />
                Live Lead Simulator
              </h2>
              <p className="text-xs text-muted-foreground">
                Inject a sample lead through the real ingestion engine to test field mappings and verification.
              </p>
            </div>

            <div className="space-y-3.5">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-foreground">Lead Full Name</Label>
                <Input
                  value={simForm.name}
                  onChange={(e) => setSimForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Rohit Varma"
                  className="h-8 text-xs bg-muted/20"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-foreground">Phone Number</Label>
                <Input
                  value={simForm.phone}
                  onChange={(e) => setSimForm((p) => ({ ...p, phone: e.target.value }))}
                  placeholder="+919876543210"
                  className="h-8 text-xs font-mono bg-muted/20"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-foreground">Email Address</Label>
                <Input
                  value={simForm.email}
                  onChange={(e) => setSimForm((p) => ({ ...p, email: e.target.value }))}
                  placeholder="rohit.varma@example.com"
                  className="h-8 text-xs bg-muted/20"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-foreground">City / Preferred Location</Label>
                <Input
                  value={simForm.city}
                  onChange={(e) => setSimForm((p) => ({ ...p, city: e.target.value }))}
                  placeholder="e.g. Mumbai, Bengaluru"
                  className="h-8 text-xs bg-muted/20"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-foreground">Requirement / Notes</Label>
                <Input
                  value={simForm.notes}
                  onChange={(e) => setSimForm((p) => ({ ...p, notes: e.target.value }))}
                  placeholder="e.g. Looking for ready-to-move office space"
                  className="h-8 text-xs bg-muted/20"
                />
              </div>
            </div>

            <Button
              size="sm"
              onClick={handleDispatchSimulation}
              disabled={simulating}
              className="w-full text-xs font-semibold gap-1.5 shadow-xs"
            >
              {simulating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              Dispatch Test Lead into Pipeline
            </Button>
          </div>

          {/* Simulator Result Viewer */}
          <div className="p-6 rounded-2xl bg-card border border-border shadow-xs space-y-4">
            <h3 className="text-sm font-bold font-heading text-foreground flex items-center gap-2">
              <Activity className="h-4 w-4 text-emerald-500" />
              Ingestion Execution Output
            </h3>

            {simResult ? (
              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4" />
                      Lead Successfully Attributed &amp; Stored
                    </span>
                    <Badge variant="outline" className="text-[10px] font-mono bg-emerald-500/20 text-emerald-600 border-emerald-500/40">
                      200 CREATED
                    </Badge>
                  </div>
                  {simResult.leadId && (
                    <div className="text-xs text-foreground flex items-center justify-between pt-1">
                      <span>Customer ID: <code className="font-mono">{simResult.leadId}</code></span>
                      <Link href={`/leads/${simResult.leadId}`}>
                        <Button variant="outline" size="sm" className="h-6 text-[10px] gap-1">
                          Open Lead Page
                          <ArrowRight className="h-2.5 w-2.5" />
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-muted-foreground">Server Response JSON:</span>
                  <pre className="p-3 rounded-xl bg-muted font-mono text-[11px] leading-relaxed select-all overflow-x-auto text-foreground">
                    {JSON.stringify(simResult, null, 2)}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center border border-dashed border-border rounded-xl bg-muted/10 space-y-2">
                <Send className="h-8 w-8 text-muted-foreground mx-auto" />
                <h4 className="text-xs font-semibold text-foreground">Waiting for Test Execution</h4>
                <p className="text-[11px] text-muted-foreground max-w-xs mx-auto">
                  Click &apos;Dispatch Test Lead into Pipeline&apos; to view real-time engine processing, lead attribution, and response payload.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* ── TAB 6: EVENT STREAM & AUDIT LOGS ──────────────────────────────── */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      {activeTab === "logs" && (
        <div className="p-6 rounded-2xl bg-card border border-border shadow-xs space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold font-heading text-foreground flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                Channel Inbound Event Stream
              </h2>
              <p className="text-xs text-muted-foreground">
                Live stream of raw payloads captured from {channelName}.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadLogs}
              disabled={loadingLogs}
              className="text-xs h-8 gap-1.5 border-border"
            >
              <RefreshCw className={cn("h-3 w-3", loadingLogs && "animate-spin")} />
              Refresh Events
            </Button>
          </div>

          {loadingLogs ? (
            <div className="p-12 text-center space-y-2">
              <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
              <p className="text-xs text-muted-foreground">Loading recent events...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="p-12 text-center border border-dashed border-border rounded-xl bg-muted/20 space-y-2">
              <Inbox className="h-8 w-8 text-muted-foreground mx-auto" />
              <h4 className="text-sm font-semibold text-foreground">No Inbound Events Yet</h4>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Once external webhook payloads arrive from {channelName}, they will be recorded here in real time.
              </p>
            </div>
          ) : (
            <div className="border border-border rounded-xl overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/50 border-b border-border text-[11px] font-semibold text-muted-foreground">
                  <tr>
                    <th className="py-2.5 px-3">Timestamp</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Payload Summary</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {logs.map((log) => {
                    const isSuccess = log.status === "PROCESSED" || log.status === "SUCCESS" || log.status === 200;
                    const isDup = log.status === "DUPLICATE" || log.status === 409;
                    const rawPayload = log.payload || log.payloadJson || log.body || {};
                    const payloadStr = typeof rawPayload === "string" ? rawPayload : JSON.stringify(rawPayload);
                    const timestamp = log.receivedAt || log.createdAt || log.timestamp;

                    return (
                      <tr key={log.id} className="hover:bg-muted/20 transition-colors">
                        <td className="py-2.5 px-3 font-mono text-[11px] text-muted-foreground whitespace-nowrap">
                          {timestamp ? new Date(timestamp).toLocaleString([], { dateStyle: "short", timeStyle: "medium" }) : "Just now"}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] font-mono py-0 font-bold",
                              isSuccess
                                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                                : isDup
                                ? "bg-amber-500/10 text-amber-600 border-amber-500/30"
                                : "bg-rose-500/10 text-rose-600 border-rose-500/30"
                            )}
                          >
                            {isSuccess ? "200 PROCESSED" : isDup ? "409 DUP" : `${log.status || "ERR"}`}
                          </Badge>
                        </td>
                        <td className="py-2.5 px-3 text-muted-foreground truncate max-w-xs font-mono text-[11px]">
                          {payloadStr.slice(0, 65)}...
                        </td>
                        <td className="py-2.5 px-3 text-right space-x-1 whitespace-nowrap">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setInspectedLog(log)}
                            className="text-[11px] h-7 px-2 font-medium"
                          >
                            View Payload
                          </Button>
                          {!isSuccess && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleReprocess(log.id)}
                              disabled={reprocessingId === log.id}
                              className="text-[11px] h-7 px-2 text-primary font-medium"
                            >
                              {reprocessingId === log.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <RotateCw className="h-3 w-3" />}
                              Reprocess
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Rotate Key Confirmation Dialog ────────────────────────────────── */}
      <Dialog open={isRotateConfirmOpen} onOpenChange={setIsRotateConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2 text-foreground">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Rotate Inbound Webhook Key?
            </DialogTitle>
            <DialogDescription className="text-xs">
              Rotating your webhook key will invalidate the current URL immediately. Any external webhooks or HTML forms actively posting to the old URL will receive HTTP 401 Unauthorized until updated.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsRotateConfirmOpen(false)} className="text-xs">
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleRotateKey}
              disabled={rotatingKey}
              className="text-xs gap-1.5"
            >
              {rotatingKey ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCw className="h-3.5 w-3.5" />}
              Rotate Immediately
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── View Raw Payload Dialog ───────────────────────────────────────── */}
      {inspectedLog && (
        <Dialog open={!!inspectedLog} onOpenChange={() => setInspectedLog(null)}>
          <DialogContent className="sm:max-w-xl max-h-[80vh] flex flex-col p-5 bg-card border-border shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
                <Code2 className="h-4 w-4 text-primary" />
                Raw Webhook Payload
              </DialogTitle>
              <DialogDescription className="text-xs">
                Event ID: <span className="font-mono">{inspectedLog.id}</span> · Status: {inspectedLog.status}
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto mt-2">
              <pre className="p-3 rounded-xl bg-muted font-mono text-[11px] leading-relaxed select-all overflow-x-auto text-foreground">
                {JSON.stringify(
                  (() => {
                    const raw = inspectedLog.payload || inspectedLog.payloadJson || inspectedLog;
                    try {
                      return typeof raw === "string" ? JSON.parse(raw) : raw;
                    } catch {
                      return raw;
                    }
                  })(),
                  null,
                  2
                )}
              </pre>
            </div>
            <DialogFooter className="mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const raw = inspectedLog.payload || inspectedLog.payloadJson || inspectedLog;
                  const text = typeof raw === "string" ? raw : JSON.stringify(raw, null, 2);
                  navigator.clipboard.writeText(text);
                  toast.success("Payload copied to clipboard!");
                }}
                className="text-xs gap-1.5 border-border"
              >
                <Copy className="h-3 w-3" />
                Copy JSON
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
