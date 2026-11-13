"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
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
  Briefcase,
  Globe,
  CheckCircle2,
  Settings2,
  Plus,
  Sparkles,
  RefreshCw,
  RotateCw,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Zap,
  Send,
  Activity,
  Terminal,
  Code2,
  Sliders,
  Database,
  Search,
  ArrowUpRight,
  FileJson,
  Layers,
  Radio,
  Eye,
  EyeOff,
  Play,
  CheckCircle,
  Clock,
  ArrowRight,
  Lock,
  Loader2,
  SlidersHorizontal,
  Workflow,
  Share2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  listIntegrations,
  saveIntegration,
  testIntegration,
  simulateLead,
  listWebhookAudit,
  reprocessWebhook,
  sendMetaCapiConversion,
  sendGoogleOciConversion,
} from "@/lib/api/integrations";

// ── Default Catalog Metadata ──────────────────────────────────────────────────

const INTEGRATION_CATALOG = [
  {
    key: "meta_ads",
    displayName: "Meta Ads & Lead Capture",
    category: "Advertising",
    iconLetter: "M",
    iconBg: "bg-blue-600 text-white",
    description: "Real-time sync of Facebook & Instagram Lead Ads with sub-60s ingestion into CRM.",
    badges: ["Instant Lead Ads", "HMAC Signature", "Graph API v19.0"],
    docsUrl: "https://developers.facebook.com/docs/marketing-api/guides/lead-ads",
  },
  {
    key: "meta_capi",
    displayName: "Meta Conversions API (CAPI)",
    category: "Advertising",
    iconLetter: "M",
    iconBg: "bg-indigo-600 text-white",
    description: "Server-side event dispatching for lead qualifications and deal completions with SHA-256 PII hashing.",
    badges: ["Server-Side CAPI", "SHA-256 Hashed", "ROAS Optimization"],
    docsUrl: "https://developers.facebook.com/docs/marketing-api/conversions-api",
  },
  {
    key: "google_ads",
    displayName: "Google Ads Lead Form Extensions",
    category: "Advertising",
    iconLetter: "G",
    iconBg: "bg-red-600 text-white",
    description: "Capture search, YouTube, and Discovery lead form submissions directly with GCLID attribution.",
    badges: ["Google Key Auth", "GCLID Tracking", "Lead Extensions"],
    docsUrl: "https://support.google.com/google-ads/answer/9463428",
  },
  {
    key: "google_oci",
    displayName: "Google Offline Conversion Import (OCI)",
    category: "Advertising",
    iconLetter: "G",
    iconBg: "bg-amber-600 text-white",
    description: "Push closed deal and site-visit milestones back to Google Ads for Smart Bidding optimization.",
    badges: ["Smart Bidding", "Offline Conversions", "GCLID Match"],
    docsUrl: "https://support.google.com/google-ads/answer/2998031",
  },
  {
    key: "website_webhook",
    displayName: "Website Inbound Webhook & Form Builder",
    category: "Web",
    iconLetter: "W",
    iconBg: "bg-emerald-600 text-white",
    description: "Universal token-authenticated REST webhook and embeddable forms for WordPress, Webflow, and custom sites.",
    badges: ["Embed Generator", "CORS Ready", "Field Mapping"],
    docsUrl: "#",
  },
  {
    key: "indiamart",
    displayName: "IndiaMART Webhook Lead Manager",
    category: "Listing Portals",
    iconLetter: "I",
    iconBg: "bg-orange-600 text-white",
    description: "Instant push notification of B2B buyer inquiries with product requirement tags and CRM push key.",
    badges: ["Push API", "GLUSR_CRM_KEY", "B2B Enquiries"],
    docsUrl: "https://help.indiamart.com/lead-manager-api",
  },
  {
    key: "99acres",
    displayName: "99acres Property Portal",
    category: "Listing Portals",
    iconLetter: "9",
    iconBg: "bg-sky-700 text-white",
    description: "Automatic lead sync from builder project listings, buyer callbacks, and verified inquiries.",
    badges: ["Real Estate Feed", "Project Tagging", "Auto-Routing"],
    docsUrl: "https://www.99acres.com",
  },
  {
    key: "magicbricks",
    displayName: "MagicBricks Real Estate Gateway",
    category: "Listing Portals",
    iconLetter: "M",
    iconBg: "bg-rose-600 text-white",
    description: "Direct webhook pipeline for property seeker inquiries and virtual tour booking requests.",
    badges: ["Buyer Gateway", "Callback Webhook", "Instant Sync"],
    docsUrl: "https://www.magicbricks.com",
  },
];

// ── Zod Validation Schemas ────────────────────────────────────────────────────

const configValidationSchema = z.object({
  displayName: z.string().min(2, "Name must be at least 2 characters"),
  category: z.string().min(1, "Category is required"),
  enabled: z.boolean(),
});

// ── Main Page Component ───────────────────────────────────────────────────────

export default function IntegrationsPage() {
  const [activeTab, setActiveTab] = useState("catalog");
  const [integrations, setIntegrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Selected Integration for Edit / Manage Modal
  const [editingIntegration, setEditingIntegration] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [testingKey, setTestingKey] = useState(null);
  const [savingKey, setSavingKey] = useState(false);

  // Copied states for tooltips
  const [copiedKey, setCopiedKey] = useState(null);

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState([]);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [selectedAuditPayload, setSelectedAuditPayload] = useState(null);
  const [reprocessingId, setReprocessingId] = useState(null);

  // Live Simulator State
  const [simulatorSource, setSimulatorSource] = useState("website");
  const [simulatorFields, setSimulatorFields] = useState({
    name: "Vikram Singhania",
    phone: "+919876501234",
    email: "vikram.singhania@example.com",
    city: "Gurugram, Cyber City",
    notes: "High intent: looking for 3BHK high-rise apartment near golf course road",
  });
  const [simulating, setSimulating] = useState(false);

  // Meta CAPI Test State
  const [capiData, setCapiData] = useState({
    eventName: "QualifiedLead",
    phone: "+919876543210",
    email: "rohan.sharma@example.com",
    value: 50000,
    currency: "INR",
  });
  const [sendingCapi, setSendingCapi] = useState(false);
  const [capiResult, setCapiResult] = useState(null);

  // Google OCI Test State
  const [ociData, setOciData] = useState({
    conversionAction: "CRM Qualified Lead",
    gclid: "EAIaIQobChMI_test_gclid_9941829",
    conversionValue: 25000,
    currency: "INR",
  });
  const [sendingOci, setSendingOci] = useState(false);
  const [ociResult, setOciResult] = useState(null);

  // Embed Snippet Tab
  const [embedTab, setEmbedTab] = useState("html");

  // ── Load Integration Data ───────────────────────────────────────────────────

  const loadData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      const data = await listIntegrations();
      if (Array.isArray(data)) {
        setIntegrations(data);
      }
    } catch (err) {
      console.error("Failed to load integrations:", err);
      toast.error("Failed to fetch integration configurations from backend");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const loadAuditData = useCallback(async () => {
    setLoadingAudit(true);
    try {
      const data = await listWebhookAudit();
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

  // ── Merge Server Data with Catalog ──────────────────────────────────────────

  const mergedCatalog = useMemo(() => {
    const configMap = new Map();
    integrations.forEach((item) => {
      configMap.set(item.integrationKey, item);
    });

    return INTEGRATION_CATALOG.map((cat) => {
      const serverItem = configMap.get(cat.key);
      let parsedConfig = {};
      if (serverItem?.configJson) {
        try {
          parsedConfig = typeof serverItem.configJson === "string"
            ? JSON.parse(serverItem.configJson)
            : serverItem.configJson;
        } catch {
          parsedConfig = {};
        }
      }

      return {
        ...cat,
        id: serverItem?.id || cat.key,
        enabled: serverItem ? serverItem.enabled : false,
        lastTestedAt: serverItem?.lastTestedAt || null,
        lastTestStatus: serverItem?.lastTestStatus || null,
        lastTestMessage: serverItem?.lastTestMessage || null,
        config: parsedConfig,
      };
    });
  }, [integrations]);

  // ── Actions ─────────────────────────────────────────────────────────────────

  const copyToClipboard = (text, key) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleToggle = async (key, currentStatus) => {
    const nextStatus = !currentStatus;
    const item = mergedCatalog.find((i) => i.key === key);
    if (!item) return;

    try {
      await saveIntegration(key, {
        displayName: item.displayName,
        category: item.category,
        enabled: nextStatus,
        config: item.config,
      });
      toast.success(`${item.displayName} is now ${nextStatus ? "Enabled" : "Disabled"}`);
      loadData(true);
    } catch (err) {
      toast.error(`Failed to update ${item.displayName}: ${err.message}`);
    }
  };

  const handleTestConnection = async (key) => {
    setTestingKey(key);
    try {
      const res = await testIntegration(key);
      if (res?.success) {
        toast.success(`Connection Verified for ${key}`, {
          description: res?.message || "Endpoint handshake successful.",
        });
      } else {
        toast.warning(`Test Warning: ${res?.message || "Check credentials"}`);
      }
      loadData(true);
    } catch (err) {
      toast.error(`Connection Test Failed: ${err.message}`);
    } finally {
      setTestingKey(null);
    }
  };

  const handleOpenEdit = (item) => {
    setEditingIntegration(item);
    setEditFormData({
      displayName: item.displayName,
      category: item.category,
      enabled: item.enabled,
      ...item.config,
    });
  };

  const handleSaveEdit = async () => {
    if (!editingIntegration) return;
    setSavingKey(true);

    try {
      const { displayName, category, enabled, ...restConfig } = editFormData;
      configValidationSchema.parse({ displayName, category, enabled });

      await saveIntegration(editingIntegration.key, {
        displayName,
        category,
        enabled,
        config: restConfig,
      });

      toast.success(`${displayName} configuration saved successfully`);
      setEditingIntegration(null);
      loadData(true);
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast.error(err.errors[0]?.message || "Validation error");
      } else {
        toast.error(`Save failed: ${err.message}`);
      }
    } finally {
      setSavingKey(false);
    }
  };

  // ── Simulator Submission ───────────────────────────────────────────────────

  const handleSimulateLead = async (e) => {
    e?.preventDefault();
    setSimulating(true);

    try {
      const res = await simulateLead(simulatorSource, simulatorFields);
      toast.success("Lead Ingested & Captured!", {
        description: `Lead "${res.name}" created with ID: ${res.leadId} via ${res.source}. Visible in Active Leads table.`,
      });
      if (activeTab === "audit") {
        loadAuditData();
      }
    } catch (err) {
      toast.error(`Simulation Failed: ${err.message}`);
    } finally {
      setSimulating(false);
    }
  };

  // ── Meta CAPI Test ──────────────────────────────────────────────────────────

  const handleSendMetaCapi = async () => {
    setSendingCapi(true);
    setCapiResult(null);

    try {
      const res = await sendMetaCapiConversion(capiData);
      setCapiResult(res);
      toast.success("Meta CAPI Event Dispatched!", {
        description: `Event ID: ${res.eventId} · SHA-256 Hashed: ${res.hashedPhone}`,
      });
    } catch (err) {
      toast.error(`Meta CAPI Dispatch Failed: ${err.message}`);
    } finally {
      setSendingCapi(false);
    }
  };

  // ── Google OCI Test ─────────────────────────────────────────────────────────

  const handleSendGoogleOci = async () => {
    setSendingOci(true);
    setOciResult(null);

    try {
      const res = await sendGoogleOciConversion(ociData);
      setOciResult(res);
      toast.success("Google Offline Conversion Uploaded!", {
        description: `GCLID: ${res.gclid} · Status: ${res.status}`,
      });
    } catch (err) {
      toast.error(`Google OCI Upload Failed: ${err.message}`);
    } finally {
      setSendingOci(false);
    }
  };

  // ── Reprocess Audit Event ───────────────────────────────────────────────────

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

  // ── Filter Catalog ──────────────────────────────────────────────────────────

  const filteredItems = useMemo(() => {
    return mergedCatalog.filter((item) => {
      const matchesSearch =
        item.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.key.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCat =
        categoryFilter === "all" ||
        item.category.toLowerCase().replace(/\s+/g, "_") === categoryFilter.toLowerCase().replace(/\s+/g, "_");

      return matchesSearch && matchesCat;
    });
  }, [mergedCatalog, searchQuery, categoryFilter]);

  const activeCount = mergedCatalog.filter((i) => i.enabled).length;

  return (
    <div className="space-y-8 pb-16">
      {/* ── Top Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border/70">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold font-heading text-foreground tracking-tight">
              Integrations & Lead Ingestion Hub
            </h1>
            <Badge variant="outline" className="text-xs bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800 font-semibold gap-1.5 py-0.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              {activeCount} of {mergedCatalog.length} Active
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1 max-w-2xl">
            Seamlessly connect Meta Lead Ads, Google Ads Webhooks, Conversions APIs (CAPI/OCI), Website Form Builders, and Indian Real Estate portals (IndiaMART, 99acres, MagicBricks) with real-time lead capture into SmoothSales CRM.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="text-xs h-9 gap-1.5 border-border"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={() => setActiveTab("website")}
            className="text-xs h-9 gap-1.5 bg-primary text-primary-foreground font-semibold shadow-xs"
          >
            <Code2 className="h-3.5 w-3.5" />
            Website Embed Code
          </Button>
        </div>
      </div>

      {/* ── Tab Navigation ──────────────────────────────────────────────────── */}
      <div className="border-b border-border/80">
        <nav className="flex space-x-6 overflow-x-auto no-scrollbar" aria-label="Tabs">
          {[
            { id: "catalog", label: "All Integrations", icon: Layers, count: mergedCatalog.length },
            { id: "meta", label: "Meta Ads & CAPI", icon: Megaphone, count: "v19.0" },
            { id: "google", label: "Google Ads Suite", icon: Globe, count: "GCLID" },
            { id: "website", label: "Website Webhooks & Embed", icon: Code2, count: "Form API" },
            { id: "portals", label: "IndiaMART & Portals", icon: Building, count: "3 Feeds" },
            { id: "audit", label: "Inbound Audit & Logs", icon: Activity, count: auditLogs.length > 0 ? `${auditLogs.length}` : "Live" },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 py-3 px-1 border-b-2 font-medium text-xs whitespace-nowrap transition-colors",
                  isActive
                    ? "border-primary text-primary font-semibold"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                )}
              >
                <Icon className={cn("h-4 w-4", isActive ? "text-primary" : "text-muted-foreground")} />
                <span>{tab.label}</span>
                {tab.count && (
                  <span
                    className={cn(
                      "px-1.5 py-0.5 rounded-full text-[10px] font-mono",
                      isActive
                        ? "bg-primary/10 text-primary font-bold"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* ── TAB 1: ALL INTEGRATIONS CATALOG ─────────────────────────────────── */}
      {activeTab === "catalog" && (
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-muted/30 p-3 rounded-xl border border-border/70">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {["all", "Advertising", "Listing Portals", "Web"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                    categoryFilter === cat
                      ? "bg-card text-foreground shadow-xs border border-border/80 font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {cat === "all" ? "All Channels" : cat}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search integrations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-8 text-xs bg-card border-border"
              />
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredItems.map((item) => (
              <div
                key={item.key}
                className={cn(
                  "p-5 rounded-xl flex flex-col justify-between border bg-card transition-all relative overflow-hidden shadow-xs hover:border-border/90",
                  item.enabled ? "border-emerald-300 dark:border-emerald-800/80" : "border-border"
                )}
              >
                {/* Top Badge Strip */}
                <div className="space-y-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center font-heading font-extrabold text-sm shadow-xs shrink-0",
                          item.iconBg
                        )}
                      >
                        {item.iconLetter}
                      </div>
                      <div>
                        <h3 className="font-heading font-bold text-sm text-foreground leading-tight">
                          {item.displayName}
                        </h3>
                        <span className="text-[11px] text-muted-foreground font-mono">
                          {item.category}
                        </span>
                      </div>
                    </div>

                    <Switch
                      checked={item.enabled}
                      onCheckedChange={() => handleToggle(item.key, item.enabled)}
                    />
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                    {item.description}
                  </p>

                  {/* Feature Badges */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {item.badges.map((b) => (
                      <span
                        key={b}
                        className="px-2 py-0.5 rounded text-[10px] font-medium bg-muted/80 text-muted-foreground border border-border/50"
                      >
                        {b}
                      </span>
                    ))}
                  </div>

                  {/* Last Test Status */}
                  <div className="pt-2 text-[11px] flex items-center gap-1.5 text-muted-foreground border-t border-border/40">
                    {item.lastTestedAt ? (
                      <>
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        <span className="truncate">
                          Tested: {new Date(item.lastTestedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                        <span>Ready to test</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="pt-4 mt-3 border-t border-border/60 flex items-center justify-between gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTestConnection(item.key)}
                    disabled={testingKey === item.key}
                    className="h-8 text-xs gap-1 border-border font-medium hover:bg-muted"
                  >
                    {testingKey === item.key ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Zap className="h-3 w-3 text-amber-500" />
                    )}
                    Test Ping
                  </Button>

                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleOpenEdit(item)}
                    className="h-8 text-xs gap-1 font-semibold"
                  >
                    <Settings2 className="h-3.5 w-3.5" />
                    Configure
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB 2: META ADS & CAPI SUITE ────────────────────────────────────── */}
      {activeTab === "meta" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Meta Lead Ads Inbound Card */}
            <div className="p-6 rounded-xl border border-border bg-card shadow-xs space-y-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center font-heading font-extrabold text-sm">
                    M
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-base text-foreground">
                      Meta Lead Ads Webhook Integration
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Graph API v19.0 · Instant Sub-60s Ingestion · Lead Ads
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-300">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Active
                </Badge>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                Connect your Meta Developer App and Facebook Business Pages. When a user completes a Lead Form on Facebook or Instagram, Meta sends an encrypted webhook payload verified via HMAC-SHA256, instantly creating a CRM lead.
              </p>

              {/* Endpoint URLs */}
              <div className="space-y-3 pt-2">
                <div>
                  <Label className="text-xs font-semibold text-muted-foreground">
                    Inbound Callback URL (Paste in Meta Developer App)
                  </Label>
                  <div className="mt-1.5 flex items-center gap-2">
                    <Input
                      readOnly
                      value="http://103.180.110.190/api/webhooks/meta"
                      className="text-xs font-mono bg-muted/40 border-border"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard("http://103.180.110.190/api/webhooks/meta", "meta_webhook")}
                      className="h-9 px-3 shrink-0"
                    >
                      {copiedKey === "meta_webhook" ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div>
                  <Label className="text-xs font-semibold text-muted-foreground">
                    Webhook Verify Token
                  </Label>
                  <div className="mt-1.5 flex items-center gap-2">
                    <Input
                      readOnly
                      value="smoothsales-meta-verify-token"
                      className="text-xs font-mono bg-muted/40 border-border"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard("smoothsales-meta-verify-token", "meta_token")}
                      className="h-9 px-3 shrink-0"
                    >
                      {copiedKey === "meta_token" ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-muted/30 border border-border/70 text-xs space-y-1.5">
                  <div className="font-semibold text-foreground flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
                    Required Meta Permissions:
                  </div>
                  <div className="text-[11px] text-muted-foreground space-y-1 font-mono">
                    <div>✓ `leads_retrieval` (Access raw leadgen form submissions)</div>
                    <div>✓ `pages_manage_ads` (Link ad campaigns to CRM customer records)</div>
                    <div>✓ `pages_read_engagement` (Verify real-time lead webhook subscriptions)</div>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-border/60">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleTestConnection("meta_ads")}
                  disabled={testingKey === "meta_ads"}
                  className="text-xs h-9 gap-1.5"
                >
                  {testingKey === "meta_ads" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Zap className="h-3.5 w-3.5 text-amber-500" />}
                  Verify Meta Webhook
                </Button>

                <Button
                  size="sm"
                  onClick={() => {
                    const item = mergedCatalog.find((i) => i.key === "meta_ads");
                    if (item) handleOpenEdit(item);
                  }}
                  className="text-xs h-9 gap-1.5"
                >
                  <Settings2 className="h-3.5 w-3.5" />
                  Edit App ID & Token
                </Button>
              </div>
            </div>

            {/* Meta Conversions API (CAPI) Card */}
            <div className="p-6 rounded-xl border border-border bg-card shadow-xs space-y-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-heading font-extrabold text-sm">
                    C
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-base text-foreground">
                      Meta Conversions API (CAPI)
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Server-Side Lead Scoring · SHA-256 PII Hashed Feedback
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400 border-indigo-300">
                  CAPI Active
                </Badge>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                Send server-side qualification events back to Meta when sales reps update CRM lead stages (e.g. Lead Qualified, Site Visit Booked, Deal Closed). Bypasses iOS ad blockers and trains Meta AI to deliver higher-quality buyers.
              </p>

              {/* Interactive CAPI Test Widget */}
              <div className="p-4 rounded-xl bg-muted/40 border border-border/80 space-y-3.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Terminal className="h-3.5 w-3.5 text-indigo-600" />
                    Test CAPI Server Event Dispatcher
                  </Label>
                  <span className="text-[10px] font-mono text-muted-foreground">
                    Pixel: 984120394819203
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <Label className="text-[11px] text-muted-foreground">Event Name</Label>
                    <Select
                      value={capiData.eventName}
                      onValueChange={(val) => setCapiData({ ...capiData, eventName: val })}
                    >
                      <SelectTrigger className="h-8 text-xs bg-card">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Lead">Lead (Form Ingestion)</SelectItem>
                        <SelectItem value="QualifiedLead">QualifiedLead (Rep Approved)</SelectItem>
                        <SelectItem value="Schedule">Schedule (Site Visit Set)</SelectItem>
                        <SelectItem value="Purchase">Purchase (Deal Won / Token)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-[11px] text-muted-foreground">Deal Value (INR)</Label>
                    <Input
                      type="number"
                      value={capiData.value}
                      onChange={(e) => setCapiData({ ...capiData, value: Number(e.target.value) })}
                      className="h-8 text-xs bg-card"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <Label className="text-[11px] text-muted-foreground">Prospect Phone</Label>
                    <Input
                      value={capiData.phone}
                      onChange={(e) => setCapiData({ ...capiData, phone: e.target.value })}
                      className="h-8 text-xs bg-card font-mono"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px] text-muted-foreground">Prospect Email</Label>
                    <Input
                      value={capiData.email}
                      onChange={(e) => setCapiData({ ...capiData, email: e.target.value })}
                      className="h-8 text-xs bg-card font-mono"
                    />
                  </div>
                </div>

                <Button
                  size="sm"
                  onClick={handleSendMetaCapi}
                  disabled={sendingCapi}
                  className="w-full h-8 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-semibold gap-1.5 shadow-xs"
                >
                  {sendingCapi ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                  Dispatch Test CAPI Event (SHA-256 Hashed)
                </Button>

                {capiResult && (
                  <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-[11px] space-y-1 font-mono text-emerald-800 dark:text-emerald-300">
                    <div className="font-bold flex items-center gap-1">
                      <CheckCircle className="h-3.5 w-3.5" />
                      Status: {capiResult.status} (Event ID: {capiResult.eventId})
                    </div>
                    <div>Hashed Phone: {capiResult.hashedPhone}</div>
                    <div>Hashed Email: {capiResult.hashedEmail}</div>
                    <div>Dispatched At: {new Date(capiResult.timestamp).toLocaleTimeString()}</div>
                  </div>
                )}
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-border/60">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleTestConnection("meta_capi")}
                  disabled={testingKey === "meta_capi"}
                  className="text-xs h-9 gap-1.5"
                >
                  {testingKey === "meta_capi" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Zap className="h-3.5 w-3.5 text-amber-500" />}
                  Verify CAPI Dataset
                </Button>

                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    const item = mergedCatalog.find((i) => i.key === "meta_capi");
                    if (item) handleOpenEdit(item);
                  }}
                  className="text-xs h-9 gap-1.5"
                >
                  <Settings2 className="h-3.5 w-3.5" />
                  Configure Pixel & Rules
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: GOOGLE ADS SUITE ─────────────────────────────────────────── */}
      {activeTab === "google" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Google Ads Lead Form Extension Card */}
            <div className="p-6 rounded-xl border border-border bg-card shadow-xs space-y-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-red-600 text-white flex items-center justify-center font-heading font-extrabold text-sm">
                    G
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-base text-foreground">
                      Google Ads Lead Form Extensions
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Search & YouTube Lead Ingestion · GCLID Tracking
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-300">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Active
                </Badge>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                Capture high-intent search prospects directly from Google Search and YouTube lead forms. SmoothSales automatically parses user column data, extracts campaign IDs, and associates the Google Click ID (GCLID) with the customer profile.
              </p>

              <div className="space-y-3 pt-2">
                <div>
                  <Label className="text-xs font-semibold text-muted-foreground">
                    Google Ads Webhook URL (Tools & Settings → Extensions → Webhook)
                  </Label>
                  <div className="mt-1.5 flex items-center gap-2">
                    <Input
                      readOnly
                      value="http://103.180.110.190/api/webhooks/google-ads"
                      className="text-xs font-mono bg-muted/40 border-border"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard("http://103.180.110.190/api/webhooks/google-ads", "google_webhook")}
                      className="h-9 px-3 shrink-0"
                    >
                      {copiedKey === "google_webhook" ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div>
                  <Label className="text-xs font-semibold text-muted-foreground">
                    Google Key (Webhook Secret Key)
                  </Label>
                  <div className="mt-1.5 flex items-center gap-2">
                    <Input
                      readOnly
                      value="gkey_sec_893041_ss_crm"
                      className="text-xs font-mono bg-muted/40 border-border"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard("gkey_sec_893041_ss_crm", "google_key")}
                      className="h-9 px-3 shrink-0"
                    >
                      {copiedKey === "google_key" ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-muted/30 border border-border/70 text-xs space-y-1">
                  <span className="font-semibold text-foreground">Standard Field Normalization:</span>
                  <p className="text-[11px] text-muted-foreground">
                    Automatically maps <code className="font-mono bg-card px-1 rounded">FULL_NAME</code>, <code className="font-mono bg-card px-1 rounded">PHONE_NUMBER</code>, <code className="font-mono bg-card px-1 rounded">EMAIL</code>, and <code className="font-mono bg-card px-1 rounded">CITY</code> into CRM customer columns.
                  </p>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-border/60">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleTestConnection("google_ads")}
                  disabled={testingKey === "google_ads"}
                  className="text-xs h-9 gap-1.5"
                >
                  {testingKey === "google_ads" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Zap className="h-3.5 w-3.5 text-amber-500" />}
                  Test Google Webhook Key
                </Button>

                <Button
                  size="sm"
                  onClick={() => {
                    const item = mergedCatalog.find((i) => i.key === "google_ads");
                    if (item) handleOpenEdit(item);
                  }}
                  className="text-xs h-9 gap-1.5"
                >
                  <Settings2 className="h-3.5 w-3.5" />
                  Edit Configuration
                </Button>
              </div>
            </div>

            {/* Google Offline Conversion Import (OCI) Card */}
            <div className="p-6 rounded-xl border border-border bg-card shadow-xs space-y-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-600 text-white flex items-center justify-center font-heading font-extrabold text-sm">
                    O
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-base text-foreground">
                      Google Offline Conversion Import (OCI)
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Closed-Loop Attribution · Smart Bidding Value Feedback
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-300">
                  OCI Enabled
                </Badge>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                Connect CRM deal milestones to Google Ads smart bidding algorithms. Whenever a lead generated from Google Ads reaches a qualified milestone, SmoothSales uploads the conversion using their captured GCLID.
              </p>

              {/* Interactive OCI Upload Test */}
              <div className="p-4 rounded-xl bg-muted/40 border border-border/80 space-y-3.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Terminal className="h-3.5 w-3.5 text-amber-600" />
                    Offline Conversion Upload Simulator
                  </Label>
                  <span className="text-[10px] font-mono text-muted-foreground">
                    Action: CRM Qualified Lead
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <Label className="text-[11px] text-muted-foreground">Conversion Action</Label>
                    <Select
                      value={ociData.conversionAction}
                      onValueChange={(val) => setOciData({ ...ociData, conversionAction: val })}
                    >
                      <SelectTrigger className="h-8 text-xs bg-card">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CRM Qualified Lead">CRM Qualified Lead</SelectItem>
                        <SelectItem value="Site Visit Completed">Site Visit Completed</SelectItem>
                        <SelectItem value="Deal Won / Token Received">Deal Won / Token Received</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-[11px] text-muted-foreground">Conversion Value (INR)</Label>
                    <Input
                      type="number"
                      value={ociData.conversionValue}
                      onChange={(e) => setOciData({ ...ociData, conversionValue: Number(e.target.value) })}
                      className="h-8 text-xs bg-card"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-[11px] text-muted-foreground">GCLID (Google Click Identifier)</Label>
                  <Input
                    value={ociData.gclid}
                    onChange={(e) => setOciData({ ...ociData, gclid: e.target.value })}
                    className="h-8 text-xs bg-card font-mono"
                  />
                </div>

                <Button
                  size="sm"
                  onClick={handleSendGoogleOci}
                  disabled={sendingOci}
                  className="w-full h-8 text-xs bg-amber-600 hover:bg-amber-700 text-white font-semibold gap-1.5 shadow-xs"
                >
                  {sendingOci ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                  Upload Offline Conversion via GCLID
                </Button>

                {ociResult && (
                  <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-[11px] space-y-1 font-mono text-emerald-800 dark:text-emerald-300">
                    <div className="font-bold flex items-center gap-1">
                      <CheckCircle className="h-3.5 w-3.5" />
                      Status: {ociResult.status} (Action: {ociResult.conversionAction})
                    </div>
                    <div>GCLID: {ociResult.gclid}</div>
                    <div>Value: ₹{ociResult.value.toLocaleString()}</div>
                    <div>Uploaded At: {new Date(ociResult.conversionTime).toLocaleTimeString()}</div>
                  </div>
                )}
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-border/60">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleTestConnection("google_oci")}
                  disabled={testingKey === "google_oci"}
                  className="text-xs h-9 gap-1.5"
                >
                  {testingKey === "google_oci" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Zap className="h-3.5 w-3.5 text-amber-500" />}
                  Verify OCI Pipeline
                </Button>

                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    const item = mergedCatalog.find((i) => i.key === "google_oci");
                    if (item) handleOpenEdit(item);
                  }}
                  className="text-xs h-9 gap-1.5"
                >
                  <Settings2 className="h-3.5 w-3.5" />
                  Manage Conversion Rules
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 4: WEBSITE WEBHOOKS & EMBED BUILDER ─────────────────────────── */}
      {activeTab === "website" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left 7 Cols: Endpoints & Embed Snippets */}
            <div className="lg:col-span-7 space-y-6">
              {/* Endpoint Card */}
              <div className="p-6 rounded-xl border border-border bg-card shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-heading font-bold text-base text-foreground">
                      Inbound Website Lead Webhook
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Public REST Endpoint · CORS Enabled · Token Authentication
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-300">
                    Live & Accepting
                  </Badge>
                </div>

                <div className="space-y-3">
                  <div>
                    <Label className="text-xs font-semibold text-muted-foreground">
                      Webhook Submission Endpoint URL
                    </Label>
                    <div className="mt-1 flex items-center gap-2">
                      <Input
                        readOnly
                        value="http://103.180.110.190/api/webhooks/website"
                        className="text-xs font-mono bg-muted/40 border-border"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard("http://103.180.110.190/api/webhooks/website", "web_url")}
                        className="h-9 px-3 shrink-0"
                      >
                        {copiedKey === "web_url" ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs font-semibold text-muted-foreground">
                      API Authorization Key (<code className="font-mono">X-API-Key</code> or <code className="font-mono">?api_key=</code>)
                    </Label>
                    <div className="mt-1 flex items-center gap-2">
                      <Input
                        readOnly
                        value="ss_live_webhook_7f8a9e2b1c"
                        className="text-xs font-mono bg-muted/40 border-border"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard("ss_live_webhook_7f8a9e2b1c", "web_apikey")}
                        className="h-9 px-3 shrink-0"
                      >
                        {copiedKey === "web_apikey" ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Embed Code Snippet Generator */}
              <div className="p-6 rounded-xl border border-border bg-card shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Code2 className="h-5 w-5 text-primary" />
                    <div>
                      <h3 className="font-heading font-bold text-sm text-foreground">
                        Website Form Embed Snippets
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Copy and paste into your website landing pages
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 bg-muted p-1 rounded-lg">
                    {["html", "react", "curl"].map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setEmbedTab(tab)}
                        className={cn(
                          "px-2.5 py-1 rounded text-[11px] font-semibold transition-all",
                          embedTab === tab
                            ? "bg-card text-foreground shadow-xs font-bold"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {tab.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Snippet Display */}
                <div className="relative">
                  <pre className="p-4 rounded-xl bg-slate-950 text-slate-100 text-[11px] font-mono overflow-x-auto leading-relaxed border border-slate-800">
                    {embedTab === "html" &&
`<!-- SmoothSales CRM Inbound Lead Form Embed -->
<form action="http://103.180.110.190/api/webhooks/website" method="POST">
  <input type="hidden" name="api_key" value="ss_live_webhook_7f8a9e2b1c" />
  
  <input type="text" name="name" placeholder="Full Name" required />
  <input type="tel" name="phone" placeholder="Phone Number" required />
  <input type="email" name="email" placeholder="Email Address" />
  <input type="text" name="city" placeholder="City / Location" />
  <textarea name="notes" placeholder="Requirement Details"></textarea>
  
  <button type="submit">Submit Enquiry</button>
</form>`}

                    {embedTab === "react" &&
`// SmoothSales CRM Inbound Lead Submission Hook (Next.js / React)
async function submitLead(formData) {
  const response = await fetch("http://103.180.110.190/api/webhooks/website", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": "ss_live_webhook_7f8a9e2b1c",
    },
    body: JSON.stringify({
      name: formData.name,
      phone: formData.phone,
      email: formData.email,
      city: formData.city,
      notes: formData.requirement,
    }),
  });
  return response.json();
}`}

                    {embedTab === "curl" &&
`# Test Inbound Lead Webhook via cURL
curl -X POST http://103.180.110.190/api/webhooks/website \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: ss_live_webhook_7f8a9e2b1c" \\
  -d '{
    "name": "Ananya Roy",
    "phone": "+919811223344",
    "email": "ananya@example.com",
    "city": "Mumbai",
    "notes": "Looking for commercial office space in BKC"
  }'`}
                  </pre>

                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      const snippet =
                        embedTab === "html"
                          ? `<form action="http://103.180.110.190/api/webhooks/website" method="POST">\n  <input type="hidden" name="api_key" value="ss_live_webhook_7f8a9e2b1c" />\n  <input type="text" name="name" placeholder="Full Name" required />\n  <input type="tel" name="phone" placeholder="Phone Number" required />\n  <input type="email" name="email" placeholder="Email Address" />\n  <textarea name="notes" placeholder="Requirement Details"></textarea>\n  <button type="submit">Submit Enquiry</button>\n</form>`
                          : embedTab === "react"
                          ? `async function submitLead(data) {\n  return fetch("http://103.180.110.190/api/webhooks/website", {\n    method: "POST",\n    headers: { "Content-Type": "application/json", "X-API-Key": "ss_live_webhook_7f8a9e2b1c" },\n    body: JSON.stringify(data)\n  }).then(r => r.json());\n}`
                          : `curl -X POST http://103.180.110.190/api/webhooks/website -H "Content-Type: application/json" -H "X-API-Key: ss_live_webhook_7f8a9e2b1c" -d '{"name":"Test","phone":"+919876543210"}'`;
                      copyToClipboard(snippet, "code_snippet");
                    }}
                    className="absolute top-3 right-3 h-7 text-xs gap-1 font-medium bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700"
                  >
                    {copiedKey === "code_snippet" ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    Copy Code
                  </Button>
                </div>
              </div>
            </div>

            {/* Right 5 Cols: Live Interactive Payload Simulator */}
            <div className="lg:col-span-5">
              <div className="p-6 rounded-xl border border-emerald-300 dark:border-emerald-800/80 bg-card shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                      <Play className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="font-heading font-bold text-sm text-foreground">
                        Live Webhook Simulator
                      </h3>
                      <p className="text-[11px] text-muted-foreground">
                        Test end-to-end ingestion directly into CRM
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[10px] font-mono bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 border-emerald-300">
                    Real Ingestion
                  </Badge>
                </div>

                <form onSubmit={handleSimulateLead} className="space-y-3.5">
                  <div>
                    <Label className="text-xs font-semibold text-muted-foreground">Source Channel</Label>
                    <Select
                      value={simulatorSource}
                      onValueChange={setSimulatorSource}
                    >
                      <SelectTrigger className="h-9 text-xs mt-1 bg-card">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="website">Website Webhook Form</SelectItem>
                        <SelectItem value="google_ads">Google Ads Lead Form</SelectItem>
                        <SelectItem value="indiamart">IndiaMART Buyer Inquiry</SelectItem>
                        <SelectItem value="99acres">99acres Real Estate Lead</SelectItem>
                        <SelectItem value="magicbricks">MagicBricks Buyer Callback</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-xs font-semibold text-muted-foreground">Prospect Full Name</Label>
                    <Input
                      required
                      value={simulatorFields.name}
                      onChange={(e) => setSimulatorFields({ ...simulatorFields, name: e.target.value })}
                      placeholder="e.g. Rahul Verma"
                      className="h-9 text-xs mt-1 bg-card"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <Label className="text-xs font-semibold text-muted-foreground">Phone Number</Label>
                      <Input
                        required
                        value={simulatorFields.phone}
                        onChange={(e) => setSimulatorFields({ ...simulatorFields, phone: e.target.value })}
                        placeholder="+91..."
                        className="h-9 text-xs mt-1 bg-card font-mono"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold text-muted-foreground">Email</Label>
                      <Input
                        type="email"
                        value={simulatorFields.email}
                        onChange={(e) => setSimulatorFields({ ...simulatorFields, email: e.target.value })}
                        placeholder="prospect@..."
                        className="h-9 text-xs mt-1 bg-card font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs font-semibold text-muted-foreground">City / Preferred Location</Label>
                    <Input
                      value={simulatorFields.city}
                      onChange={(e) => setSimulatorFields({ ...simulatorFields, city: e.target.value })}
                      placeholder="e.g. Golf Course Extension Road, Gurugram"
                      className="h-9 text-xs mt-1 bg-card"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-semibold text-muted-foreground">Requirement / Notes</Label>
                    <Textarea
                      rows={3}
                      value={simulatorFields.notes}
                      onChange={(e) => setSimulatorFields({ ...simulatorFields, notes: e.target.value })}
                      placeholder="Requirements..."
                      className="text-xs mt-1 bg-card resize-none"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={simulating}
                    className="w-full h-9 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-1.5 shadow-xs"
                  >
                    {simulating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
                    Simulate Ingestion & Create CRM Lead
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 5: INDIAN REAL ESTATE & B2B PORTALS ─────────────────────────── */}
      {activeTab === "portals" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* IndiaMART */}
            <div className="p-6 rounded-xl border border-border bg-card shadow-xs space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-lg bg-orange-600 text-white flex items-center justify-center font-heading font-extrabold text-sm">
                    I
                  </div>
                  <Badge variant="outline" className="text-xs bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-400 border-orange-300">
                    Push API Active
                  </Badge>
                </div>

                <div>
                  <h3 className="font-heading font-bold text-base text-foreground">
                    IndiaMART Webhook Lead Manager
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Direct push notifications for buyer RFQs, catalog inquiries, and verified MCAT categories.
                  </p>
                </div>

                <div className="space-y-2 pt-2 text-xs">
                  <div>
                    <span className="text-muted-foreground font-semibold">Push Callback URL:</span>
                    <div className="mt-1 flex items-center gap-1.5">
                      <Input
                        readOnly
                        value="http://103.180.110.190/api/webhooks/leads/indiamart"
                        className="text-[11px] font-mono bg-muted/40 h-8"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard("http://103.180.110.190/api/webhooks/leads/indiamart", "im_url")}
                        className="h-8 px-2"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  <div>
                    <span className="text-muted-foreground font-semibold">GLUSR_CRM_KEY:</span>
                    <Input
                      readOnly
                      value="m_crm_key_991823714"
                      className="text-[11px] font-mono bg-muted/40 h-8 mt-1"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-border/60 flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleTestConnection("indiamart")}
                  disabled={testingKey === "indiamart"}
                  className="text-xs h-8 gap-1"
                >
                  <Zap className="h-3 w-3 text-amber-500" />
                  Test Push
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    const item = mergedCatalog.find((i) => i.key === "indiamart");
                    if (item) handleOpenEdit(item);
                  }}
                  className="text-xs h-8 gap-1"
                >
                  <Settings2 className="h-3 w-3" />
                  Configure
                </Button>
              </div>
            </div>

            {/* 99acres */}
            <div className="p-6 rounded-xl border border-border bg-card shadow-xs space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-lg bg-sky-700 text-white flex items-center justify-center font-heading font-extrabold text-sm">
                    9
                  </div>
                  <Badge variant="outline" className="text-xs bg-sky-50 dark:bg-sky-950/30 text-sky-700 dark:text-sky-400 border-sky-300">
                    Feed Active
                  </Badge>
                </div>

                <div>
                  <h3 className="font-heading font-bold text-base text-foreground">
                    99acres Property Portal
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Auto-ingest buyer leads from premium project listings, property alerts, and direct developer callbacks.
                  </p>
                </div>

                <div className="space-y-2 pt-2 text-xs">
                  <div>
                    <span className="text-muted-foreground font-semibold">Feed Webhook URL:</span>
                    <div className="mt-1 flex items-center gap-1.5">
                      <Input
                        readOnly
                        value="http://103.180.110.190/api/webhooks/leads/99acres"
                        className="text-[11px] font-mono bg-muted/40 h-8"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard("http://103.180.110.190/api/webhooks/leads/99acres", "99_url")}
                        className="h-8 px-2"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  <div>
                    <span className="text-muted-foreground font-semibold">Project Listing ID:</span>
                    <Input
                      readOnly
                      value="PROP_99A_55219"
                      className="text-[11px] font-mono bg-muted/40 h-8 mt-1"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-border/60 flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleTestConnection("99acres")}
                  disabled={testingKey === "99acres"}
                  className="text-xs h-8 gap-1"
                >
                  <Zap className="h-3 w-3 text-amber-500" />
                  Test Feed
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    const item = mergedCatalog.find((i) => i.key === "99acres");
                    if (item) handleOpenEdit(item);
                  }}
                  className="text-xs h-8 gap-1"
                >
                  <Settings2 className="h-3 w-3" />
                  Configure
                </Button>
              </div>
            </div>

            {/* MagicBricks */}
            <div className="p-6 rounded-xl border border-border bg-card shadow-xs space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-lg bg-rose-600 text-white flex items-center justify-center font-heading font-extrabold text-sm">
                    M
                  </div>
                  <Badge variant="outline" className="text-xs bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border-rose-300">
                    Gateway Ready
                  </Badge>
                </div>

                <div>
                  <h3 className="font-heading font-bold text-base text-foreground">
                    MagicBricks Real Estate Gateway
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Real-time webhook sync for buyer callback requests, virtual tour bookings, and residential enquiries.
                  </p>
                </div>

                <div className="space-y-2 pt-2 text-xs">
                  <div>
                    <span className="text-muted-foreground font-semibold">Callback Webhook URL:</span>
                    <div className="mt-1 flex items-center gap-1.5">
                      <Input
                        readOnly
                        value="http://103.180.110.190/api/webhooks/leads/magicbricks"
                        className="text-[11px] font-mono bg-muted/40 h-8"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard("http://103.180.110.190/api/webhooks/leads/magicbricks", "mb_url")}
                        className="h-8 px-2"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  <div>
                    <span className="text-muted-foreground font-semibold">Account ID:</span>
                    <Input
                      readOnly
                      value="MB_ACC_774910"
                      className="text-[11px] font-mono bg-muted/40 h-8 mt-1"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-border/60 flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleTestConnection("magicbricks")}
                  disabled={testingKey === "magicbricks"}
                  className="text-xs h-8 gap-1"
                >
                  <Zap className="h-3 w-3 text-amber-500" />
                  Test Gateway
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    const item = mergedCatalog.find((i) => i.key === "magicbricks");
                    if (item) handleOpenEdit(item);
                  }}
                  className="text-xs h-8 gap-1"
                >
                  <Settings2 className="h-3 w-3" />
                  Configure
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 6: INBOUND AUDIT & LOGS ─────────────────────────────────────── */}
      {activeTab === "audit" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-heading font-bold text-base text-foreground">
                Inbound Webhook Audit & Raw Event Stream
              </h3>
              <p className="text-xs text-muted-foreground">
                Inspecting raw payloads received from Meta Lead Ads, Google Ads, IndiaMART, 99acres, and Website webhooks
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={loadAuditData}
              disabled={loadingAudit}
              className="text-xs h-8 gap-1.5"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", loadingAudit && "animate-spin")} />
              Refresh Events
            </Button>
          </div>

          <div className="border border-border rounded-xl overflow-hidden bg-card shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/50 border-b border-border text-muted-foreground font-semibold">
                  <tr>
                    <th className="py-3 px-4">Source</th>
                    <th className="py-3 px-4">Event ID</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Received Time</th>
                    <th className="py-3 px-4">Payload Preview</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-muted-foreground">
                        {loadingAudit ? "Loading webhook event stream..." : "No inbound webhook events recorded yet. Try running the simulator!"}
                      </td>
                    </tr>
                  ) : (
                    auditLogs.map((logItem) => (
                      <tr key={logItem.id} className="hover:bg-muted/20 transition-colors">
                        <td className="py-3 px-4 font-semibold text-foreground">
                          <span
                            className={cn(
                              "px-2 py-0.5 rounded text-[10px] font-mono font-bold",
                              logItem.source?.includes("META") && "bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-300",
                              logItem.source?.includes("GOOGLE") && "bg-red-500/10 text-red-700 dark:text-red-400 border border-red-300",
                              logItem.source?.includes("WEBSITE") && "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-300",
                              logItem.source?.includes("INDIAMART") && "bg-orange-500/10 text-orange-700 dark:text-orange-400 border border-orange-300",
                              logItem.source?.includes("99ACRES") && "bg-sky-500/10 text-sky-700 dark:text-sky-400 border border-sky-300",
                              logItem.source?.includes("MAGICBRICKS") && "bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-300"
                            )}
                          >
                            {logItem.source}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-muted-foreground">
                          {logItem.id.slice(0, 8)}...
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold",
                              logItem.status === "PROCESSED" && "bg-emerald-500/10 text-emerald-600 border border-emerald-500/30",
                              logItem.status === "PROCESSING" && "bg-sky-500/10 text-sky-600 border border-sky-500/30",
                              logItem.status === "FAILED" && "bg-rose-500/10 text-rose-600 border border-rose-500/30",
                              logItem.status === "RECEIVED" && "bg-amber-500/10 text-amber-600 border border-amber-500/30"
                            )}
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-current" />
                            {logItem.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground font-mono text-[11px]">
                          {logItem.receivedAt ? new Date(logItem.receivedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "-"}
                        </td>
                        <td className="py-3 px-4 max-w-[200px] truncate font-mono text-[11px] text-muted-foreground">
                          {logItem.payload}
                        </td>
                        <td className="py-3 px-4 text-right space-x-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedAuditPayload(logItem)}
                            className="h-7 text-[11px] px-2 font-medium"
                          >
                            <FileJson className="h-3 w-3 mr-1" />
                            Inspect
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleReprocessEvent(logItem.id)}
                            disabled={reprocessingId === logItem.id}
                            className="h-7 text-[11px] px-2"
                          >
                            <RotateCw className={cn("h-3 w-3", reprocessingId === logItem.id && "animate-spin")} />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── Universal Configuration Dialog ───────────────────────────────────── */}
      {editingIntegration && (
        <Dialog open={Boolean(editingIntegration)} onOpenChange={() => setEditingIntegration(null)}>
          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base font-bold font-heading">
                <Settings2 className="h-4 w-4 text-primary" />
                Configure {editingIntegration.displayName}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Update credentials, API tokens, webhook subscriptions, and active routing status.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto pr-1">
              {/* Enabled Switch */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40 border border-border">
                <div>
                  <Label className="text-xs font-semibold text-foreground">Channel Status</Label>
                  <p className="text-[11px] text-muted-foreground">
                    Enable or pause inbound webhook processing for this channel
                  </p>
                </div>
                <Switch
                  checked={editFormData.enabled}
                  onCheckedChange={(checked) => setEditFormData({ ...editFormData, enabled: checked })}
                />
              </div>

              <div>
                <Label className="text-xs font-semibold">Display Name</Label>
                <Input
                  value={editFormData.displayName || ""}
                  onChange={(e) => setEditFormData({ ...editFormData, displayName: e.target.value })}
                  className="h-9 text-xs mt-1"
                />
              </div>

              {/* Dynamic Credential Inputs */}
              {Object.keys(editFormData)
                .filter((key) => !["displayName", "category", "enabled"].includes(key))
                .map((key) => {
                  const val = editFormData[key];
                  const isObject = typeof val === "object" && val !== null;
                  return (
                    <div key={key}>
                      <Label className="text-xs font-mono font-semibold text-muted-foreground">
                        {key}
                      </Label>
                      {isObject ? (
                        <Textarea
                          rows={3}
                          value={JSON.stringify(val, null, 2)}
                          onChange={(e) => {
                            try {
                              const parsed = JSON.parse(e.target.value);
                              setEditFormData({ ...editFormData, [key]: parsed });
                            } catch {}
                          }}
                          className="text-xs font-mono mt-1"
                        />
                      ) : (
                        <Input
                          value={val !== undefined && val !== null ? String(val) : ""}
                          onChange={(e) => setEditFormData({ ...editFormData, [key]: e.target.value })}
                          className="h-9 text-xs mt-1 font-mono"
                        />
                      )}
                    </div>
                  );
                })}
            </div>

            <DialogFooter className="flex items-center justify-between sm:justify-between pt-3 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleTestConnection(editingIntegration.key)}
                disabled={testingKey === editingIntegration.key}
                className="text-xs h-9 gap-1.5"
              >
                {testingKey === editingIntegration.key ? <Loader2 className="h-3 w-3 animate-spin" /> : <Zap className="h-3.5 w-3.5 text-amber-500" />}
                Test Connection
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingIntegration(null)}
                  className="text-xs h-9"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveEdit}
                  disabled={savingKey}
                  className="text-xs h-9 gap-1.5 font-semibold"
                >
                  {savingKey && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Save Configuration
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* ── Payload Inspection Modal ─────────────────────────────────────────── */}
      {selectedAuditPayload && (
        <Dialog open={Boolean(selectedAuditPayload)} onOpenChange={() => setSelectedAuditPayload(null)}>
          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-sm font-bold font-heading">
                <FileJson className="h-4 w-4 text-primary" />
                Raw Webhook Payload ({selectedAuditPayload.source})
              </DialogTitle>
              <DialogDescription className="text-xs font-mono text-muted-foreground">
                Event ID: {selectedAuditPayload.id} · Status: {selectedAuditPayload.status}
              </DialogDescription>
            </DialogHeader>

            <div className="py-2">
              <pre className="p-4 rounded-xl bg-slate-950 text-slate-100 text-xs font-mono max-h-96 overflow-y-auto leading-relaxed border border-slate-800">
                {(() => {
                  try {
                    return JSON.stringify(JSON.parse(selectedAuditPayload.payload), null, 2);
                  } catch {
                    return selectedAuditPayload.payload;
                  }
                })()}
              </pre>
            </div>

            <DialogFooter>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setSelectedAuditPayload(null)}
                className="text-xs"
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
