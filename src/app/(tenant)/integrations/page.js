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
  PhoneCall,
  Bot,
  Calendar,
  Video,
  FileSpreadsheet,
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
import { UniversalConfigModal } from "@/components/integrations/universal-config-modal";

// ── Master 20-Channel Integration Catalog ─────────────────────────────────────

const MASTER_INTEGRATIONS_CATALOG = [
  // 1. Advertising & Social Capture
  {
    key: "meta_ads",
    displayName: "Meta Ads & Lead Capture",
    category: "Advertising",
    iconLetter: "M",
    iconBg: "bg-blue-600 text-white",
    description: "Instant sub-60s sync of Facebook & Instagram Lead Ads directly into CRM with HMAC verification.",
    badges: ["Instant Lead Ads", "HMAC-SHA256", "Graph API v19.0"],
  },
  {
    key: "meta_capi",
    displayName: "Meta Conversions API (CAPI)",
    category: "Advertising",
    iconLetter: "C",
    iconBg: "bg-indigo-600 text-white",
    description: "Server-side feedback loop sending qualified lead milestones back to Meta Ads with SHA-256 PII hashing.",
    badges: ["Server-Side CAPI", "SHA-256 Hashed", "ROAS Optimization"],
  },
  {
    key: "google_ads",
    displayName: "Google Ads Lead Form Extensions",
    category: "Advertising",
    iconLetter: "G",
    iconBg: "bg-red-600 text-white",
    description: "Capture search, YouTube, and Discovery lead form submissions directly with GCLID attribution.",
    badges: ["Google Key Auth", "GCLID Tracking", "Search & YouTube"],
  },
  {
    key: "google_oci",
    displayName: "Google Offline Conversion Import (OCI)",
    category: "Advertising",
    iconLetter: "O",
    iconBg: "bg-amber-600 text-white",
    description: "Push closed deal and site-visit milestones back to Google Ads for Smart Bidding optimization.",
    badges: ["Smart Bidding", "Offline Conversions", "GCLID Match"],
  },
  {
    key: "instagram_ads",
    displayName: "Instagram Ads & Direct Message Capture",
    category: "Advertising",
    iconLetter: "I",
    iconBg: "bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white",
    description: "Direct social lead capture from Instagram Story ads, reels lead forms, and automated DM routing.",
    badges: ["Story Ads", "DM Routing", "Social Leads"],
  },

  // 2. Listing Portals (Real Estate & B2B)
  {
    key: "indiamart",
    displayName: "IndiaMART Webhook Lead Manager",
    category: "Listing Portals",
    iconLetter: "I",
    iconBg: "bg-orange-600 text-white",
    description: "Instant push notification of B2B buyer inquiries with product requirement tags and GLUSR CRM key.",
    badges: ["Push API", "GLUSR_CRM_KEY", "B2B Enquiries"],
  },
  {
    key: "99acres",
    displayName: "99acres Property Portal",
    category: "Listing Portals",
    iconLetter: "9",
    iconBg: "bg-sky-700 text-white",
    description: "Automatic lead sync from builder project listings, buyer callbacks, and verified inquiries.",
    badges: ["Real Estate Feed", "Project Tagging", "Auto-Routing"],
  },
  {
    key: "magicbricks",
    displayName: "MagicBricks Real Estate Gateway",
    category: "Listing Portals",
    iconLetter: "M",
    iconBg: "bg-rose-600 text-white",
    description: "Direct webhook pipeline for property seeker inquiries and virtual tour booking requests.",
    badges: ["Buyer Gateway", "Callback Webhook", "Instant Sync"],
  },
  {
    key: "justdial",
    displayName: "Justdial Lead Webhook",
    category: "Listing Portals",
    iconLetter: "J",
    iconBg: "bg-amber-500 text-slate-900",
    description: "Local buyer triggers and automated category dispatch from Justdial verified listings.",
    badges: ["Local Leads", "Category Match", "Instant Webhook"],
  },

  // 3. Messaging & AI
  {
    key: "whatsapp",
    displayName: "WhatsApp Business Cloud API",
    category: "Messaging",
    iconLetter: "W",
    iconBg: "bg-emerald-600 text-white",
    description: "Official Meta Cloud API integration for instant sub-60s auto-replies and template broadcasts.",
    badges: ["Official WABA", "Sub-60s SLA", "Meta Verified"],
  },
  {
    key: "openai",
    displayName: "OpenAI / ChatGPT GPT-4o Engine",
    category: "Messaging",
    iconLetter: "AI",
    iconBg: "bg-teal-600 text-white",
    description: "Automated AI lead scoring, budget parsing, conversation qualification, and closing scripts.",
    badges: ["GPT-4o Engine", "Lead Scoring", "Auto-Qualification"],
  },
  {
    key: "exotel",
    displayName: "Exotel Cloud Telephony & IVR",
    category: "Messaging",
    iconLetter: "E",
    iconBg: "bg-indigo-700 text-white",
    description: "Click-to-call, automated call recording sync, virtual number routing, and multi-agent IVR greeting.",
    badges: ["Click-to-Call", "Cloud Calling", "IVR Bridge"],
  },

  // 4. Web Capture & Form Builders
  {
    key: "website_webhook",
    displayName: "Website Inbound Webhook & Form Builder",
    category: "Web",
    iconLetter: "W",
    iconBg: "bg-emerald-700 text-white",
    description: "Universal token-authenticated REST webhook and embeddable forms for WordPress, Webflow, and custom landing pages.",
    badges: ["Embed Generator", "CORS Ready", "Field Mapping"],
  },
  {
    key: "google_forms",
    displayName: "Google Forms Instant Ingestion",
    category: "Web",
    iconLetter: "F",
    iconBg: "bg-purple-600 text-white",
    description: "Capture survey responses and internal lead registration forms without manual data entry.",
    badges: ["Instant Ingest", "Survey Intake", "Zero Manual Entry"],
  },
  {
    key: "jotform",
    displayName: "Jotform REST Webhook",
    category: "Web",
    iconLetter: "J",
    iconBg: "bg-orange-500 text-white",
    description: "REST webhook receiver for multi-page custom web capture and client registration forms.",
    badges: ["REST Webhook", "Custom Forms", "File Uploads"],
  },

  // 5. Payments & Productivity
  {
    key: "razorpay",
    displayName: "Razorpay Subscriptions & Smart Collect",
    category: "Payments",
    iconLetter: "R",
    iconBg: "bg-sky-600 text-white",
    description: "Automated booking token collection, UPI recurring autopay, and instant TDS commission payouts.",
    badges: ["UPI Smart Collect", "TDS Ledger", "Token Booking"],
  },
  {
    key: "cashfree",
    displayName: "Cashfree Payment Gateway & Partner Split",
    category: "Payments",
    iconLetter: "C",
    iconBg: "bg-cyan-700 text-white",
    description: "Instant vendor disbursements and payment split settlements with automated receipting.",
    badges: ["Direct Bank Split", "Instant Payouts", "Partner Commission"],
  },
  {
    key: "google_sheets",
    displayName: "Google Sheets Two-Way Live Sync",
    category: "Productivity",
    iconLetter: "S",
    iconBg: "bg-green-600 text-white",
    description: "Continuous real-time export and backup of leads, deals, and commission ledger records.",
    badges: ["Continuous Sync", "Two-Way Live", "Realtime Backup"],
  },
  {
    key: "calendly",
    displayName: "Calendly Site Visit Scheduler",
    category: "Productivity",
    iconLetter: "C",
    iconBg: "bg-blue-500 text-white",
    description: "Automated calendar event creation and WhatsApp appointment reminders for client site visits.",
    badges: ["Site Visit Scheduler", "Calendar Sync", "WhatsApp Reminder"],
  },
  {
    key: "google_meet",
    displayName: "Google Meet Auto Video Discovery",
    category: "Productivity",
    iconLetter: "M",
    iconBg: "bg-yellow-600 text-white",
    description: "Automatic video consultation link generation and calendar sync on demo bookings.",
    badges: ["Auto Link Gen", "Video Discovery", "Demo Scheduler"],
  },
];

export default function IntegrationsPage() {
  const [activeTab, setActiveTab] = useState("catalog");
  const [integrations, setIntegrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Selected Integration for Universal Config Modal
  const [selectedIntegration, setSelectedIntegration] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [savingKey, setSavingKey] = useState(false);
  const [testingKey, setTestingKey] = useState(null);

  // Copied states for tooltips
  const [copiedKey, setCopiedKey] = useState(null);

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState([]);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [selectedAuditPayload, setSelectedAuditPayload] = useState(null);
  const [reprocessingId, setReprocessingId] = useState(null);

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

    return MASTER_INTEGRATIONS_CATALOG.map((cat) => {
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
      toast.success(`${item.displayName} is now ${nextStatus ? "Active" : "Disabled"}`);
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

  const handleOpenConfigModal = (item) => {
    setSelectedIntegration(item);
    setIsModalOpen(true);
  };

  const handleSaveConfig = async (key, payload) => {
    setSavingKey(true);
    try {
      await saveIntegration(key, payload);
      toast.success(`${payload.displayName} configuration saved successfully`);
      setIsModalOpen(false);
      loadData(true);
    } catch (err) {
      toast.error(`Save failed: ${err.message}`);
    } finally {
      setSavingKey(false);
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
        item.category.toLowerCase().replace(/\s+/g, "_") ===
          categoryFilter.toLowerCase().replace(/\s+/g, "_");

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
              Enterprise Integrations Marketplace
            </h1>
            <Badge
              variant="outline"
              className="text-xs bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800 font-semibold gap-1.5 py-0.5"
            >
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              {activeCount} of {mergedCatalog.length} Active Channels
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1 max-w-2xl">
            Configure Meta Lead Ads, Google Ads Webhooks, Conversions APIs (CAPI/OCI), IndiaMART, 99acres, MagicBricks, Justdial, WhatsApp Cloud API, OpenAI GPT-4o, and Payment Gateways in under two clicks.
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
            onClick={() => {
              const item = mergedCatalog.find((i) => i.key === "website_webhook");
              if (item) handleOpenConfigModal(item);
            }}
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
            { id: "catalog", label: "All Integrations", icon: Layers, count: `${mergedCatalog.length}` },
            { id: "meta", label: "Meta Suite", icon: Megaphone, count: "Lead Ads & CAPI" },
            { id: "google", label: "Google Ads Suite", icon: Globe, count: "Forms & OCI" },
            { id: "portals", label: "Portals & Webhooks", icon: Building, count: "IndiaMART, 99acres" },
            { id: "messaging", label: "Messaging & AI", icon: MessageSquare, count: "WhatsApp & GPT-4o" },
            { id: "productivity", label: "Payments & Productivity", icon: CreditCard, count: "Razorpay, Sheets" },
            { id: "audit", label: "Inbound Audit & Stream", icon: Activity, count: auditLogs.length > 0 ? `${auditLogs.length}` : "Live" },
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

      {/* ── TAB 1: ALL INTEGRATIONS CATALOG (BENTO GRID) ────────────────────── */}
      {activeTab === "catalog" && (
        <div className="space-y-6">
          {/* Category Filter Pills & Search */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-muted/30 p-3 rounded-xl border border-border/70">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar w-full sm:w-auto">
              {[
                { id: "all", label: "All (20)" },
                { id: "Advertising", label: "Advertising (5)" },
                { id: "Listing Portals", label: "Portals (4)" },
                { id: "Messaging", label: "Messaging & AI (3)" },
                { id: "Web", label: "Web & Forms (3)" },
                { id: "Payments", label: "Payments (2)" },
                { id: "Productivity", label: "Productivity (3)" },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategoryFilter(cat.id)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all",
                    categoryFilter === cat.id
                      ? "bg-card text-foreground shadow-xs border border-border/80 font-bold"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search integrations, keys, webhooks..."
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
                  "p-5 rounded-xl flex flex-col justify-between border bg-card transition-all relative overflow-hidden shadow-xs hover:border-border/90 hover:shadow-sm",
                  item.enabled ? "border-emerald-300 dark:border-emerald-800/80" : "border-border"
                )}
              >
                <div className="space-y-3.5">
                  {/* Top Bar with Icon, Name, Category & Switch */}
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

                  {/* Health Dot */}
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
                        <span>Ready to configure & test</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Footer Buttons */}
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
                    onClick={() => handleOpenConfigModal(item)}
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

      {/* ── TAB 2: META SUITE (LEAD ADS + CAPI) ─────────────────────────────── */}
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
                Connect Facebook Business Pages & Lead Ads forms. Webhooks verified with HMAC-SHA256 automatically ingest prospect details into the active leads pipeline.
              </p>

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
                    if (item) handleOpenConfigModal(item);
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
                Send server-side qualification events back to Meta when sales reps update CRM lead stages. Bypasses browser ad blockers to train Meta AI to target genuine buyers.
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
                    if (item) handleOpenConfigModal(item);
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
                Capture high-intent search prospects directly from Google Search and YouTube lead forms. SmoothSales automatically parses user column data and captures GCLID for closed-loop attribution.
              </p>

              <div className="space-y-3 pt-2">
                <div>
                  <Label className="text-xs font-semibold text-muted-foreground">
                    Google Ads Webhook URL
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
                    if (item) handleOpenConfigModal(item);
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
                Connect CRM deal milestones to Google Ads smart bidding algorithms. Whenever a lead reaches a qualified milestone, SmoothSales uploads the conversion using their captured GCLID.
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
                    if (item) handleOpenConfigModal(item);
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

      {/* ── TAB 4: PORTALS & CUSTOM WEBHOOKS ────────────────────────────────── */}
      {activeTab === "portals" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {mergedCatalog
              .filter((i) => i.category === "Listing Portals")
              .map((portal) => (
                <div
                  key={portal.key}
                  className="p-5 rounded-xl border border-border bg-card shadow-xs flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div
                        className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center font-heading font-extrabold text-sm text-white",
                          portal.iconBg
                        )}
                      >
                        {portal.iconLetter}
                      </div>
                      <Badge variant="outline" className="text-xs bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-300">
                        {portal.enabled ? "Active" : "Inactive"}
                      </Badge>
                    </div>

                    <div>
                      <h3 className="font-heading font-bold text-sm text-foreground">
                        {portal.displayName}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {portal.description}
                      </p>
                    </div>

                    <div className="space-y-2 pt-1 text-xs">
                      <div>
                        <span className="text-[11px] font-semibold text-muted-foreground">
                          Inbound Webhook:
                        </span>
                        <div className="mt-1 flex items-center gap-1">
                          <Input
                            readOnly
                            value={`http://103.180.110.190/api/webhooks/leads/${portal.key}`}
                            className="text-[10px] font-mono bg-muted/40 h-8"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              copyToClipboard(
                                `http://103.180.110.190/api/webhooks/leads/${portal.key}`,
                                portal.key
                              )
                            }
                            className="h-8 px-2"
                          >
                            {copiedKey === portal.key ? (
                              <Check className="h-3 w-3 text-emerald-500" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-border/60 flex items-center justify-between">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTestConnection(portal.key)}
                      disabled={testingKey === portal.key}
                      className="text-xs h-8 gap-1"
                    >
                      <Zap className="h-3 w-3 text-amber-500" />
                      Test
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleOpenConfigModal(portal)}
                      className="text-xs h-8 gap-1 font-semibold"
                    >
                      <Settings2 className="h-3 w-3" />
                      Configure
                    </Button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ── TAB 5: MESSAGING & AI ───────────────────────────────────────────── */}
      {activeTab === "messaging" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {mergedCatalog
              .filter((i) => i.category === "Messaging")
              .map((item) => (
                <div
                  key={item.key}
                  className="p-6 rounded-xl border border-border bg-card shadow-xs flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div
                        className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center font-heading font-extrabold text-sm text-white",
                          item.iconBg
                        )}
                      >
                        {item.iconLetter}
                      </div>
                      <Badge variant="outline" className="text-xs bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-300">
                        {item.enabled ? "Active" : "Disabled"}
                      </Badge>
                    </div>

                    <div>
                      <h3 className="font-heading font-bold text-base text-foreground">
                        {item.displayName}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        {item.description}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {item.badges.map((b) => (
                        <span
                          key={b}
                          className="px-2 py-0.5 rounded text-[10px] font-medium bg-muted/80 text-muted-foreground border border-border/50"
                        >
                          {b}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-border/60 flex items-center justify-between">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTestConnection(item.key)}
                      disabled={testingKey === item.key}
                      className="text-xs h-8 gap-1"
                    >
                      <Zap className="h-3 w-3 text-amber-500" />
                      Test Ping
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleOpenConfigModal(item)}
                      className="text-xs h-8 gap-1 font-semibold"
                    >
                      <Settings2 className="h-3 w-3" />
                      Configure
                    </Button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ── TAB 6: PAYMENTS & PRODUCTIVITY ──────────────────────────────────── */}
      {activeTab === "productivity" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {mergedCatalog
              .filter((i) => i.category === "Payments" || i.category === "Productivity")
              .map((item) => (
                <div
                  key={item.key}
                  className="p-5 rounded-xl border border-border bg-card shadow-xs flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div
                        className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center font-heading font-extrabold text-sm text-white",
                          item.iconBg
                        )}
                      >
                        {item.iconLetter}
                      </div>
                      <Badge variant="outline" className="text-xs bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-300">
                        {item.enabled ? "Active" : "Disabled"}
                      </Badge>
                    </div>

                    <div>
                      <h3 className="font-heading font-bold text-sm text-foreground">
                        {item.displayName}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {item.description}
                      </p>
                    </div>

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
                  </div>

                  <div className="pt-3 border-t border-border/60 flex items-center justify-between">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTestConnection(item.key)}
                      disabled={testingKey === item.key}
                      className="text-xs h-8 gap-1"
                    >
                      <Zap className="h-3 w-3 text-amber-500" />
                      Test
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleOpenConfigModal(item)}
                      className="text-xs h-8 gap-1 font-semibold"
                    >
                      <Settings2 className="h-3 w-3" />
                      Configure
                    </Button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ── TAB 7: INBOUND AUDIT & LIVE STREAM ──────────────────────────────── */}
      {activeTab === "audit" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-heading font-bold text-base text-foreground">
                Inbound Webhook Audit & Raw Event Ledger
              </h3>
              <p className="text-xs text-muted-foreground">
                Inspecting raw payloads from Meta, Google Ads, IndiaMART, 99acres, MagicBricks, Justdial, and Website Forms
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
                        {loadingAudit
                          ? "Loading webhook event stream..."
                          : "No inbound webhook events recorded yet. Try running a simulation!"}
                      </td>
                    </tr>
                  ) : (
                    auditLogs.map((logItem) => (
                      <tr key={logItem.id} className="hover:bg-muted/20 transition-colors">
                        <td className="py-3 px-4 font-semibold text-foreground">
                          <span
                            className={cn(
                              "px-2 py-0.5 rounded text-[10px] font-mono font-bold",
                              logItem.source?.includes("META") &&
                                "bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-300",
                              logItem.source?.includes("GOOGLE") &&
                                "bg-red-500/10 text-red-700 dark:text-red-400 border border-red-300",
                              logItem.source?.includes("WEBSITE") &&
                                "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-300",
                              logItem.source?.includes("INDIAMART") &&
                                "bg-orange-500/10 text-orange-700 dark:text-orange-400 border border-orange-300",
                              logItem.source?.includes("99ACRES") &&
                                "bg-sky-500/10 text-sky-700 dark:text-sky-400 border border-sky-300",
                              logItem.source?.includes("MAGICBRICKS") &&
                                "bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-300"
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
                              logItem.status === "PROCESSED" &&
                                "bg-emerald-500/10 text-emerald-600 border border-emerald-500/30",
                              logItem.status === "PROCESSING" &&
                                "bg-sky-500/10 text-sky-600 border border-sky-500/30",
                              logItem.status === "FAILED" &&
                                "bg-rose-500/10 text-rose-600 border border-rose-500/30",
                              logItem.status === "RECEIVED" &&
                                "bg-amber-500/10 text-amber-600 border border-amber-500/30"
                            )}
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-current" />
                            {logItem.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground font-mono text-[11px]">
                          {logItem.receivedAt
                            ? new Date(logItem.receivedAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                                second: "2-digit",
                              })
                            : "-"}
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
                            <RotateCw
                              className={cn(
                                "h-3 w-3",
                                reprocessingId === logItem.id && "animate-spin"
                              )}
                            />
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

      {/* ── Universal 5-Tab Enterprise Configuration Modal ───────────────────── */}
      <UniversalConfigModal
        integration={selectedIntegration}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveConfig}
        saving={savingKey}
      />

      {/* ── Payload Inspection Modal ─────────────────────────────────────────── */}
      {selectedAuditPayload && (
        <Dialog
          open={Boolean(selectedAuditPayload)}
          onOpenChange={() => setSelectedAuditPayload(null)}
        >
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
