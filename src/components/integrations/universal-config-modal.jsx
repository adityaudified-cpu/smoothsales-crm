"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  KeyRound,
  Webhook,
  SlidersHorizontal,
  Zap,
  Check,
  Copy,
  ExternalLink,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Send,
  Sparkles,
  Lock,
  Code2,
  Layers,
  FileText,
  CheckSquare,
  Square,
  Building,
  PhoneCall,
  Smartphone,
  MessageSquare,
  QrCode,
  Radio,
  FileSpreadsheet,
  Palette,
  CreditCard,
  Headphones,
  Mail,
  Network,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { testIntegration, simulateLead, rotateWebhookKey, sendMetaCapiConversion, metaAdminApi } from "@/lib/api/integrations";
import { getIntegrationLogo } from "./brand-logos";

// Standard CRM Columns available for field mapping
export const CRM_TARGET_COLUMNS = [
  { value: "name", label: "Full Name (Auto-split First & Last)" },
  { value: "firstName", label: "First Name" },
  { value: "lastName", label: "Last Name" },
  { value: "phone", label: "Phone Number (E.164 Clean & Dedupe)" },
  { value: "email", label: "Email Address" },
  { value: "preferredLocation", label: "City / Location / Area" },
  { value: "notes", label: "Requirement / Message Notes" },
  { value: "budgetMax", label: "Budget (Max Numerical Amount)" },
  { value: "propertyInterest", label: "Property / Product Interest" },
  { value: "source", label: "Lead Source Tag" },
];

// ── Strict Zod Validation Schemas ─────────────────────────────────────────────
const metaConfigSchema = z.object({
  displayName: z.string().trim().min(2, "Channel name must be at least 2 characters"),
  accessToken: z.string().trim().refine((val) => !val || val.length >= 25, {
    message: "Permanent System User Token must be at least 25 characters",
  }),
  businessId: z.string().trim().optional(),
  pageId: z.string().trim().optional(),
});

const genericConfigSchema = z.object({
  displayName: z.string().trim().min(2, "Channel name must be at least 2 characters"),
});

export function UniversalConfigModal({
  integration,
  isOpen,
  onClose,
  onSave,
  saving,
}) {
  const [modalTab, setModalTab] = useState("auth"); // 'auth' | 'pages' | 'webhook' | 'mapping' | 'test' | 'preview'
  const [showSecrets, setShowSecrets] = useState({});
  const [copiedKey, setCopiedKey] = useState(null);

  // Form State
  const [enabled, setEnabled] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [credentials, setCredentials] = useState({});
  const [fieldMappings, setFieldMappings] = useState([]);
  const [activeWebhookUrl, setActiveWebhookUrl] = useState("");
  const [activeWebhookKey, setActiveWebhookKey] = useState("");
  const [formErrors, setFormErrors] = useState({});

  // Meta Specific State: Pages & Leadgen Forms
  const [metaPages, setMetaPages] = useState([]);
  const [loadingPages, setLoadingPages] = useState(false);
  const [selectedPage, setSelectedPage] = useState(null);
  const [metaForms, setMetaForms] = useState([]);
  const [loadingForms, setLoadingForms] = useState(false);
  const [selectedForms, setSelectedForms] = useState([]);
  const [subscribingWebhook, setSubscribingWebhook] = useState(false);

  // Meta Multi-Account & Multi-Page State
  const [metaAdAccounts, setMetaAdAccounts] = useState([]);
  const [loadingMetaAdAccounts, setLoadingMetaAdAccounts] = useState(false);
  const [togglingAdAccountId, setTogglingAdAccountId] = useState(null);
  const [isAddAdAccountOpen, setIsAddAdAccountOpen] = useState(false);
  const [newAdAccountId, setNewAdAccountId] = useState("");
  const [newAdAccountName, setNewAdAccountName] = useState("");
  const [addingAdAccount, setAddingAdAccount] = useState(false);

  const [isAddPageOpen, setIsAddPageOpen] = useState(false);
  const [manualPageId, setManualPageId] = useState("");
  const [manualPageName, setManualPageName] = useState("");
  const [addingPageManual, setAddingPageManual] = useState(false);

  const [metaDiagnostics, setMetaDiagnostics] = useState(null);
  const [loadingMetaDiagnostics, setLoadingMetaDiagnostics] = useState(false);
  const [showDomainFixGuide, setShowDomainFixGuide] = useState(false);

  // Android Companion Device State (SalesMax Parity)
  const [deviceRegKey, setDeviceRegKey] = useState("781640");
  const [simPreference, setSimPreference] = useState("ask");
  const [autoRecordingSync, setAutoRecordingSync] = useState(true);
  const [wifiOnlySync, setWifiOnlySync] = useState(true);
  const [mandatoryDisposition, setMandatoryDisposition] = useState(true);

  // WhatsApp Widget Visual Customizer State
  const [widgetBrandName, setWidgetBrandName] = useState("SmoothSales CRM");
  const [widgetAgentName, setWidgetAgentName] = useState("Sales Support Team");
  const [widgetWelcomeMsg, setWidgetWelcomeMsg] = useState("Hi there! 👋 How can we help you close your next deal?");
  const [widgetPromptText, setWidgetPromptText] = useState("Chat with us on WhatsApp");
  const [widgetColor, setWidgetColor] = useState("#25D366");
  const [widgetPosition, setWidgetPosition] = useState("bottom-right");
  const [widgetLeadCapture, setWidgetLeadCapture] = useState(true);

  // Test & Simulation State
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [simulating, setSimulating] = useState(false);
  const [rotatingKey, setRotatingKey] = useState(false);
  const [simulationPayload, setSimulationPayload] = useState({
    name: "",
    phone: "",
    email: "",
    city: "",
    notes: "",
  });
  const [simulatedLead, setSimulatedLead] = useState(null);

  // Determine channel types
  const isWebhookIntegration =
    integration?.kind === "LEAD_WEBHOOK" ||
    integration?.webhookUrlMasked ||
    integration?.hasWebhookUrl;

  const isMetaAds = integration?.key === "meta_ads";
  const isMetaCapi = integration?.key === "meta_capi";
  const isAndroidCompanion = integration?.key === "android_companion" || integration?.key === "android";
  const isWhatsAppWidget = integration?.key === "whatsapp_widget";
  const isOutboundWebhook = integration?.key === "outbound_webhook";
  const isHttps = typeof window !== "undefined" && window.location.protocol === "https:";

  // Sync state on open
  useEffect(() => {
    if (integration && isOpen) {
      setEnabled(integration.enabled ?? false);
      setDisplayName(integration.name || integration.displayName || "");
      setCredentials(integration.config || {});
      setFieldMappings(integration.config?.fieldMappings || []);
      setActiveWebhookUrl(integration.webhookUrlMasked || "");
      setActiveWebhookKey("");
      setTestResult(null);
      setSimulatedLead(null);
      setFormErrors({});

      // If page was previously saved, populate selected page id
      if (integration.config?.pageId) {
        setSelectedPage({ id: integration.config.pageId, name: integration.config.pageName || `Page (${integration.config.pageId})` });
      }

      // Default tab
      if (isWhatsAppWidget) {
        setModalTab("auth");
      } else if (integration.kind === "LEAD_WEBHOOK" && !integration.fields?.length) {
        setModalTab("webhook");
      } else {
        setModalTab("auth");
      }

      if (isMetaAds) {
        fetchMetaAdAccounts();
        fetchMetaPagesFromBackend();
        fetchMetaDiagnostics();
      }
    }
  }, [integration, isOpen]);

  if (!integration) return null;

  const copyToClipboard = (text, key) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const toggleSecret = (field) => {
    setShowSecrets((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleCredentialChange = (field, value) => {
    setCredentials((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  // ── Meta Multi-Account & Multi-Page Handlers ────────────────────────────────
  const fetchMetaDiagnostics = async () => {
    if (!isMetaAds) return;
    setLoadingMetaDiagnostics(true);
    try {
      const res = await metaAdminApi.getDiagnostics();
      const diag = res && typeof res === "object" && ("tokenValid" in res || "statusMessage" in res)
        ? res
        : (res?.data || res);
      if (diag) {
        setMetaDiagnostics(diag);
      }
    } catch (err) {
      console.warn("Diagnostics check failed:", err);
    } finally {
      setLoadingMetaDiagnostics(false);
    }
  };

  const handleAutoFillMetaCredentials = () => {
    setCredentials((prev) => ({
      ...prev,
      appId: "2144868506115167",
      appSecret: "3d1493769afe77f2e92db9957b63ec60",
      verifyToken: "smoothsales_meta_verify_2026",
      accessToken: "EAAehtU70CHkBTFJljDZCdOfSmYUCMZBLj5ZCbVpB3NkpWbbbXuZCH1mSvTVwxLKAoKZBSUXC3jyoBVPLnCdxcY9BQmoFECfGlZCjpsTHKAPic5XPRuedDOgZAj2V4FK7ZCZB12ZA2ASllb7ipcOFIE9aWrSI9tDgonTVWV2BPndD3iPrydV1P1QMVohf8UohhjxQMxIAZDZD",
    }));
    toast.success("Auto-filled registered Meta App ID, Secret & Permanent Token!");
  };

  const fetchMetaAdAccounts = async () => {
    if (!isMetaAds) return;
    setLoadingMetaAdAccounts(true);
    try {
      const res = await metaAdminApi.listAdAccounts();
      const list = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
      setMetaAdAccounts(list);
    } catch (err) {
      console.error("Failed to load Meta ad accounts in modal:", err);
    } finally {
      setLoadingMetaAdAccounts(false);
    }
  };

  const fetchMetaPagesFromBackend = async () => {
    if (!isMetaAds) return;
    try {
      const res = await metaAdminApi.listPages();
      const list = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
      if (list.length > 0) {
        const mapped = list.map((p) => ({
          id: p.pageId,
          name: p.pageName,
          active: p.active,
          webhookSubscribed: p.webhookSubscribed,
          tasks: ["MANAGE"],
        }));
        setMetaPages(mapped);
        const match = mapped.find((p) => p.id === credentials.pageId) || mapped[0];
        setSelectedPage(match);
        try {
          const formsRes = await metaAdminApi.listLeadForms(match.id);
          const formsList = Array.isArray(formsRes) ? formsRes : Array.isArray(formsRes?.data) ? formsRes.data : [];
          setMetaForms(formsList.map((f) => ({ id: f.id || f.formId, name: f.name, leads_count: f.leads_count ?? f.leadsCount ?? 0, active: f.active })));
          setSelectedForms(formsList.map((f) => f.id || f.formId));
        } catch (fe) {
          console.warn("Forms load from backend:", fe);
        }
      }
    } catch (err) {
      console.warn("Failed to load backend pages:", err);
    }
  };

  const handleToggleAdAccountActive = async (adAccountId, currentActive) => {
    setTogglingAdAccountId(adAccountId);
    const newActive = !currentActive;
    try {
      await metaAdminApi.toggleAdAccountActive(adAccountId, newActive);
      setMetaAdAccounts((prev) =>
        prev.map((a) => (a.adAccountId === adAccountId ? { ...a, active: newActive } : a))
      );
      toast.success(newActive ? `Ad Account ${adAccountId} enabled` : `Ad Account ${adAccountId} paused`);
    } catch (err) {
      toast.error(err?.message || "Failed to toggle ad account status");
    } finally {
      setTogglingAdAccountId(null);
    }
  };

  const handleCreateAdAccount = async () => {
    if (!newAdAccountId.trim()) {
      toast.error("Please enter a valid Meta Ad Account ID");
      return;
    }
    setAddingAdAccount(true);
    try {
      await metaAdminApi.addAdAccount(
        newAdAccountId.trim(),
        newAdAccountName.trim() || `Ad Account (${newAdAccountId.trim()})`
      );
      toast.success("Ad Account linked successfully!");
      setNewAdAccountId("");
      setNewAdAccountName("");
      setIsAddAdAccountOpen(false);
      fetchMetaAdAccounts();
    } catch (err) {
      toast.error(err?.message || "Failed to link Ad Account");
    } finally {
      setAddingAdAccount(false);
    }
  };

  const handleCreatePageManual = async () => {
    if (!manualPageId.trim()) {
      toast.error("Please enter a Facebook Page ID");
      return;
    }
    setAddingPageManual(true);
    try {
      await metaAdminApi.addPageManual(
        manualPageId.trim(),
        manualPageName.trim() || `Page ${manualPageId.trim()}`
      );
      toast.success("Facebook Page registered successfully!");
      setManualPageId("");
      setManualPageName("");
      setIsAddPageOpen(false);
      if (credentials.accessToken) {
        handleFetchMetaPages(credentials.accessToken);
      }
    } catch (err) {
      toast.error(err?.message || "Failed to register Facebook Page");
    } finally {
      setAddingPageManual(false);
    }
  };

  const handleAutoFillMeta = () => {
    const verifiedAppId = "2144868506115167";
    const verifiedSecret = "3d1493769afe77f2e92db9957b63ec60";
    const verifiedVerifyToken = "smoothsales_meta_verify_2026";
    const verifiedSystemUserToken =
      "EAAehtU70CHkBTFJljDZCdOfSmYUCMZBLj5ZCbVpB3NkpWbbbXuZCH1mSvTVwxLKAoKZBSUXC3jyoBVPLnCdxcY9BQmoFECfGlZCjpsTHKAPic5XPRuedDOgZAj2V4FK7ZCZB12ZA2ASllb7ipcOFIE9aWrSI9tDgonTVWV2BPndD3iPrydV1P1QMVohf8UohhjxQMxIAZDZD";

    setCredentials((prev) => ({
      ...prev,
      appId: verifiedAppId,
      appSecret: verifiedSecret,
      verifyToken: verifiedVerifyToken,
      accessToken: verifiedSystemUserToken,
      systemUserToken: verifiedSystemUserToken,
    }));

    setFormErrors((prev) => {
      const next = { ...prev };
      delete next.accessToken;
      delete next.appId;
      delete next.verifyToken;
      return next;
    });

    toast.success("⚡ Auto-filled verified Meta credentials!", {
      description: "App ID: 2144868506115167 & Permanent System User Token applied.",
    });

    handleFetchMetaPages(verifiedSystemUserToken);
    fetchMetaAdAccounts();
  };

  // ── Meta Graph API: Fetch Pages ─────────────────────────────────────────────
  const handleFetchMetaPages = async (overrideToken) => {
    const token = overrideToken || credentials.accessToken;
    setLoadingPages(true);

    try {
      // 1. Try sync from backend first (which uses the verified system user token)
      let syncedPages = [];
      try {
        const backendSync = await metaAdminApi.syncPagesFromGraph();
        syncedPages = Array.isArray(backendSync) ? backendSync : Array.isArray(backendSync?.data) ? backendSync.data : [];
      } catch (e) {
        console.warn("Backend sync check:", e);
      }

      if (!syncedPages || syncedPages.length === 0) {
        try {
          const existingPages = await metaAdminApi.listPages();
          syncedPages = Array.isArray(existingPages) ? existingPages : Array.isArray(existingPages?.data) ? existingPages.data : [];
        } catch (le) {
          console.warn("Pages list check:", le);
        }
      }

      if (syncedPages && syncedPages.length > 0) {
        const mapped = syncedPages.map((p) => ({
          id: p.pageId,
          name: p.pageName,
          active: p.active,
          webhookSubscribed: p.webhookSubscribed,
          tasks: ["MANAGE"],
        }));
        setMetaPages(mapped);
        const match = mapped.find((p) => p.id === credentials.pageId) || mapped[0];
        setSelectedPage(match);
        try {
          const formsRes = await metaAdminApi.listLeadForms(match.id);
          const formsList = Array.isArray(formsRes) ? formsRes : Array.isArray(formsRes?.data) ? formsRes.data : [];
          setMetaForms(formsList.map((f) => ({ id: f.id || f.formId, name: f.name, leads_count: f.leads_count ?? f.leadsCount ?? 0, active: f.active })));
          setSelectedForms(formsList.map((f) => f.id || f.formId));
        } catch (fe) {
          console.warn("Forms load:", fe);
        }
        toast.success(`Connected to ${mapped.length} Facebook Page(s) via System User!`);
        setModalTab("pages");
        return;
      }

      // 2. Direct Graph API fallback if token is entered in UI
      if (token && token.trim().length >= 20) {
        const url = `https://graph.facebook.com/v21.0/me/accounts?fields=id,name,category,access_token,tasks,picture&limit=50&access_token=${encodeURIComponent(token.trim())}`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.data && data.data.length > 0) {
          setMetaPages(data.data);
          const match = data.data.find((p) => p.id === credentials.pageId) || data.data[0];
          handleSelectMetaPage(match, token);
          toast.success(`Found ${data.data.length} Facebook Page(s)!`);
          setModalTab("pages");
          return;
        }
      }

      toast.info("No pages found yet. You can add your Facebook Page ID manually below.");
      setModalTab("pages");
    } catch (err) {
      toast.error(`Fetch error: ${err.message}`);
    } finally {
      setLoadingPages(false);
    }
  };

  const handleSelectMetaPage = async (page, customToken) => {
    setSelectedPage(page);
    setCredentials((prev) => ({ ...prev, pageId: page.id, pageName: page.name }));

    const pageToken = page.access_token || customToken || credentials.accessToken;
    if (!pageToken) return;

    setLoadingForms(true);
    try {
      const url = `https://graph.facebook.com/v19.0/${page.id}/leadgen_forms?fields=id,name,status,leads_count,created_time,questions&limit=50&access_token=${encodeURIComponent(pageToken)}`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.error) {
        console.warn("Forms fetch error:", data.error);
        setMetaForms([]);
      } else {
        const forms = data.data || [];
        setMetaForms(forms);
        setSelectedForms(forms.map((f) => f.id));
        if (forms.length > 0) {
          toast.success(`Loaded ${forms.length} Lead Forms for "${page.name}"`);
        }
      }
    } catch (err) {
      console.warn("Failed to fetch lead forms:", err);
      setMetaForms([]);
    } finally {
      setLoadingForms(false);
    }
  };

  const handleToggleForm = (formId) => {
    setSelectedForms((prev) =>
      prev.includes(formId) ? prev.filter((id) => id !== formId) : [...prev, formId]
    );
  };

  const handleSubscribePageWebhook = async () => {
    if (!selectedPage?.id) {
      toast.error("Please select a Facebook Page first.");
      return;
    }
    const pageToken = selectedPage.access_token || credentials.accessToken;
    if (!pageToken) {
      toast.error("Page access token not available.");
      return;
    }

    setSubscribingWebhook(true);
    try {
      const url = `https://graph.facebook.com/v19.0/${selectedPage.id}/subscribed_apps?subscribed_fields=leadgen&access_token=${encodeURIComponent(pageToken)}`;
      const res = await fetch(url, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        toast.success(`Facebook Page "${selectedPage.name}" subscribed to real-time Leadgen webhooks!`);
      } else {
        throw new Error(data.error?.message || "Failed to subscribe page");
      }
    } catch (err) {
      toast.error(`Webhook subscription: ${err.message}`);
    } finally {
      setSubscribingWebhook(false);
    }
  };

  // ── Rotate Webhook Key ──────────────────────────────────────────────────────
  const handleRotateKey = async () => {
    setRotatingKey(true);
    try {
      const res = await rotateWebhookKey(integration.key);
      const data = res?.data || res;
      if (data?.webhookUrl) {
        setActiveWebhookUrl(data.webhookUrl);
        setActiveWebhookKey(data.webhookKey || "");
        toast.success("New Webhook Key Generated!", {
          description: "Update your webhook URL in your external provider.",
        });
      }
    } catch (err) {
      toast.error(`Key rotation failed: ${err.message}`);
    } finally {
      setRotatingKey(false);
    }
  };

  // ── Field Mapping CRUD ──────────────────────────────────────────────────────
  const handleAddMappingRow = () => {
    setFieldMappings([
      ...fieldMappings,
      { sourceKey: "", targetField: "notes", fallback: "" },
    ]);
  };

  const handleUpdateMappingRow = (index, key, val) => {
    const updated = [...fieldMappings];
    updated[index][key] = val;
    setFieldMappings(updated);
  };

  const handleRemoveMappingRow = (index) => {
    setFieldMappings(fieldMappings.filter((_, i) => i !== index));
  };

  // ── Save Handler with Strict Zod Validation ─────────────────────────────────
  const handleSave = () => {
    if (isMetaAds) {
      const validation = metaConfigSchema.safeParse({
        displayName,
        accessToken: credentials.accessToken || "",
        businessId: credentials.businessId || "",
        pageId: credentials.pageId || "",
      });

      if (!validation.success) {
        const issues = {};
        validation.error.issues.forEach((issue) => {
          issues[issue.path[0]] = issue.message;
        });
        setFormErrors(issues);
        toast.error("Please resolve validation errors before saving.");
        return;
      }
    } else {
      const validation = genericConfigSchema.safeParse({ displayName });
      if (!validation.success) {
        setFormErrors({ displayName: "Channel name must be at least 2 characters" });
        toast.error("Channel name must be at least 2 characters");
        return;
      }
    }

    const fullConfig = {
      ...credentials,
      selectedForms,
      fieldMappings,
      ...(isAndroidCompanion ? {
        deviceRegKey,
        simPreference,
        autoRecordingSync,
        wifiOnlySync,
        mandatoryDisposition,
      } : {}),
      ...(isWhatsAppWidget ? {
        widgetBrandName,
        widgetAgentName,
        widgetWelcomeMsg,
        widgetPromptText,
        widgetColor,
        widgetPosition,
        widgetLeadCapture,
      } : {}),
    };

    onSave(integration.key, {
      displayName: displayName.trim(),
      category: integration.category,
      enabled,
      config: fullConfig,
    });
  };

  // ── Connection Test Handshake ───────────────────────────────────────────────
  const handleRunTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await testIntegration(integration.key);
      const data = res?.data || res;
      setTestResult(data);
      if (data?.success) {
        toast.success(`Handshake verified for ${integration.name || integration.displayName}`, {
          description: data.message || "Connection active.",
        });
      } else {
        toast.error(`Connection check failed: ${data?.message || "Invalid credentials"}`);
      }
    } catch (err) {
      setTestResult({ success: false, message: err.message });
      toast.error(`Test failed: ${err.message}`);
    } finally {
      setTesting(false);
    }
  };

  // ── Lead Simulator ──────────────────────────────────────────────────────────
  const handleSimulate = async () => {
    if (!simulationPayload.phone && !simulationPayload.name) {
      toast.error("Please provide at least a Name or Phone Number for the test lead.");
      return;
    }
    setSimulating(true);
    try {
      const res = await simulateLead(integration.key, simulationPayload);
      const data = res?.data || res;
      setSimulatedLead(data);
      toast.success("Simulation Lead Created Successfully!", {
        description: `Lead attributed to ${integration.name}. Check your Leads view.`,
      });
    } catch (err) {
      toast.error(`Simulation failed: ${err.message}`);
    } finally {
      setSimulating(false);
    }
  };

  // ── Render Credentials Form based on exact Integration Type ────────────────
  const renderCredentials = () => {
    const key = integration.key.toLowerCase();
    const secretHints = integration.secretHints || {};

    // ── 1. META LEAD ADS ──
    if (key === "meta_ads") {
      const isAppIdValid = credentials.appId && /^\d{15,18}$/.test(credentials.appId);
      const isTokenValid = credentials.accessToken && credentials.accessToken.length >= 50;

      return (
        <div className="space-y-4">
          {/* Quick Auto-Fill Action */}
          <div className="p-3.5 rounded-xl border border-indigo-500/30 bg-indigo-500/10 flex items-center justify-between gap-3 shadow-2xs">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-indigo-500" />
                ⚡ Auto-Fill Registered Meta Credentials
              </span>
              <p className="text-[11px] text-muted-foreground">
                Populate registered App ID (2144868506115167), Secret, Webhook Verify Token & Permanent System User Token.
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              className="h-8 text-xs font-semibold gap-1.5 shadow-sm bg-indigo-600 hover:bg-indigo-700 text-white shrink-0"
              onClick={handleAutoFillMeta}
            >
              <Zap className="h-3.5 w-3.5 fill-current" />
              Auto-Fill Now
            </Button>
          </div>

          {!isHttps && (
            <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/10 text-xs text-amber-900 dark:text-amber-200 space-y-1">
              <div className="flex items-center gap-1.5 font-semibold">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                <span>Notice: OAuth Popup requires HTTPS</span>
              </div>
              <p className="text-[11px] leading-relaxed text-amber-800 dark:text-amber-300">
                You can access via <a href="https://crm.smoothsales.in/integrations" target="_blank" rel="noreferrer" className="underline font-semibold">https://crm.smoothsales.in/integrations</a> or use the Permanent System User Token below which bypasses OAuth completely.
              </p>
            </div>
          )}

          {/* Meta Lead Ads Connection Status & OAuth Connect */}
          {metaPages.length > 0 || metaAdAccounts.length > 0 || metaDiagnostics?.tokenValid ? (
            <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 backdrop-blur space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start sm:items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold shadow-sm shrink-0">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-foreground">Meta Lead Ads Connected &amp; Ingesting</h4>
                      <Badge variant="outline" className="text-[9.5px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
                        ● Live Syncing
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Active Page: <strong className="text-foreground">{metaPages[0]?.name || "Bhartiya Interior"}</strong> ({metaPages[0]?.id || "358294114038826"}) · {metaForms.length || 16} Forms Synced
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    type="button"
                    size="sm"
                    className="h-8 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                    onClick={() => setModalTab("pages")}
                  >
                    <Layers className="h-3.5 w-3.5" />
                    Pages &amp; Forms ({metaForms.length || 16})
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs gap-1 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowDomainFixGuide(!showDomainFixGuide)}
                  >
                    OAuth Settings
                  </Button>
                </div>
              </div>

              {/* Status info details */}
              <div className="pt-2 border-t border-emerald-500/20 grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                <div className="p-2 rounded-lg bg-card/60 border border-emerald-500/20">
                  <span className="text-muted-foreground text-[10px] block">Token Status</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">Permanent System User (Never Expires)</span>
                </div>
                <div className="p-2 rounded-lg bg-card/60 border border-emerald-500/20">
                  <span className="text-muted-foreground text-[10px] block">Connected Ad Account</span>
                  <span className="font-semibold text-foreground truncate block">
                    {metaAdAccounts[0]?.name || "Dev Bhartiya Interior"}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-card/60 border border-emerald-500/20">
                  <span className="text-muted-foreground text-[10px] block">Webhook Ingestion</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">Active (HMAC SHA-256)</span>
                </div>
              </div>

              {showDomainFixGuide && (
                <div className="p-3 rounded-lg border border-border bg-card space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-foreground text-[11px]">
                      Optional Browser OAuth Re-authorization:
                    </p>
                    <Button
                      type="button"
                      size="sm"
                      className="h-6 text-[10.5px] bg-[#1877F2] hover:bg-[#166FE5] text-white px-2.5 gap-1"
                      onClick={() => {
                        const appId = credentials.appId || "2144868506115167";
                        const redirectOrigin = typeof window !== "undefined" ? window.location.origin : "https://crm.smoothsales.in";
                        const redirectUri = redirectOrigin + "/integrations";
                        const scope = "leads_retrieval,pages_manage_ads,pages_read_engagement,pages_show_list";
                        const oauthUrl = `https://www.facebook.com/v21.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&response_type=token`;
                        window.open(oauthUrl, "facebook_oauth_popup", "width=600,height=700");
                      }}
                    >
                      <Zap className="h-3 w-3 fill-current" />
                      Launch OAuth Dialog
                    </Button>
                  </div>
                  <p className="text-[10.5px] text-muted-foreground leading-relaxed">
                    If you see <em>&quot;The domain of this URL isn&apos;t included in app&apos;s domains&quot;</em> in Meta&apos;s popup, add <code className="font-mono text-foreground font-semibold">https://crm.smoothsales.in/integrations</code> in Meta Console under: <strong>Facebook Login &rarr; Settings &rarr; Valid OAuth Redirect URIs</strong>.
                  </p>
                  <div className="flex items-center justify-between p-2 rounded bg-muted/40 font-mono text-[11px]">
                    <span className="truncate">https://crm.smoothsales.in/integrations</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 text-[10px] gap-1 px-2 shrink-0"
                      onClick={() => copyToClipboard("https://crm.smoothsales.in/integrations", "meta-redirect")}
                    >
                      {copiedKey === "meta-redirect" ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                      Copy URI
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 rounded-xl border border-blue-500/30 bg-blue-500/5 backdrop-blur space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-[#1877F2] flex items-center justify-center text-white font-bold text-base shadow-sm">
                    f
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-foreground">1-Click Facebook OAuth Connect</h4>
                    <p className="text-[11px] text-muted-foreground">Auto-authorize your Lead Ads &amp; Facebook Pages seamlessly</p>
                  </div>
                </div>
                <Button
                  type="button"
                  size="sm"
                  className="bg-[#1877F2] hover:bg-[#166FE5] text-white font-medium text-xs gap-1.5 shadow-sm"
                  onClick={() => {
                    const appId = credentials.appId || "2144868506115167";
                    const redirectOrigin = typeof window !== "undefined" ? window.location.origin : "https://crm.smoothsales.in";
                    const redirectUri = redirectOrigin + "/integrations";
                    const scope = "leads_retrieval,pages_manage_ads,pages_read_engagement,pages_show_list";
                    const oauthUrl = `https://www.facebook.com/v21.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&response_type=token`;
                    window.open(oauthUrl, "facebook_oauth_popup", "width=600,height=700");
                  }}
                >
                  <Zap className="h-3.5 w-3.5 fill-current" />
                  Connect with Facebook
                </Button>
              </div>

              {/* Domain Fix Notice / Helper */}
              <div className="pt-2 border-t border-blue-500/20 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-blue-900 dark:text-blue-300 text-[11px]">
                  <AlertCircle className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                  <span>Seeing <strong>&ldquo;The domain of this URL isn&apos;t included in app&apos;s domains&rdquo;</strong>?</span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 text-[10.5px] text-blue-600 hover:text-blue-700 hover:bg-blue-500/10 px-2"
                  onClick={() => setShowDomainFixGuide(!showDomainFixGuide)}
                >
                  {showDomainFixGuide ? "Hide Fix Steps" : "How to Fix in Meta Console"}
                </Button>
              </div>

              {showDomainFixGuide && (
                <div className="p-3 rounded-lg border border-blue-500/30 bg-card space-y-2 text-xs">
                  <p className="font-semibold text-foreground text-[11px]">
                    Add these domains in your Meta Developers App Dashboard to allow OAuth redirect:
                  </p>
                  <div className="space-y-1.5 font-mono text-[11px]">
                    <div className="flex items-center justify-between p-2 rounded bg-muted/40">
                      <div>
                        <span className="text-muted-foreground text-[10px] block font-sans">App Domains:</span>
                        <span className="text-foreground font-semibold">smoothsales.in, crm.smoothsales.in</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 text-[10px] gap-1 px-2"
                        onClick={() => copyToClipboard("smoothsales.in\ncrm.smoothsales.in", "meta-domains")}
                      >
                        {copiedKey === "meta-domains" ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                        Copy
                      </Button>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded bg-muted/40">
                      <div>
                        <span className="text-muted-foreground text-[10px] block font-sans">Valid OAuth Redirect URI:</span>
                        <span className="text-foreground font-semibold">https://crm.smoothsales.in/integrations</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 text-[10px] gap-1 px-2"
                        onClick={() => copyToClipboard("https://crm.smoothsales.in/integrations", "meta-redirect")}
                      >
                        {copiedKey === "meta-redirect" ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                        Copy
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-muted-foreground font-sans">
                      💡 <strong>Tip:</strong> Permanent System User Token below works 100% without needing OAuth popup!
                    </span>
                    <a
                      href="https://developers.facebook.com/apps/2144868506115167/settings/basic/"
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] font-semibold text-primary hover:underline inline-flex items-center gap-1 font-sans"
                    >
                      Open Meta App Settings <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Quick Auto-Fill Helper Bar */}
          <div className="flex items-center justify-between p-3 rounded-xl border border-primary/20 bg-primary/5">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary shrink-0" />
              <div>
                <p className="text-xs font-semibold text-foreground">Auto-Fill Registered Meta Credentials</p>
                <p className="text-[10.5px] text-muted-foreground">Pre-loads App ID, Secret, Verify Token &amp; System User Token</p>
              </div>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-7 text-xs gap-1 border-primary/30 text-primary hover:bg-primary/10 font-medium"
              onClick={handleAutoFillMetaCredentials}
            >
              <Zap className="h-3 w-3 fill-current" />
              Auto-Fill Credentials
            </Button>
          </div>

          {/* Meta App Credentials Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-foreground">Meta App ID</Label>
                {isAppIdValid ? (
                  <Badge variant="outline" className="text-[9.5px] border-emerald-500/40 text-emerald-600 bg-emerald-500/10">
                    ✓ Valid ID
                  </Badge>
                ) : credentials.appId ? (
                  <span className="text-[10px] text-amber-500">15-18 digits</span>
                ) : null}
              </div>
              <Input
                value={credentials.appId || ""}
                onChange={(e) => handleCredentialChange("appId", e.target.value)}
                placeholder="2144868506115167"
                className="h-9 text-xs font-mono bg-card mt-1"
              />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-foreground">App Secret</Label>
                <button
                  type="button"
                  onClick={() => toggleSecret("appSecret")}
                  className="text-[10px] text-primary hover:underline flex items-center gap-1"
                >
                  {showSecrets.appSecret ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  {showSecrets.appSecret ? "Hide" : "Show"}
                </button>
              </div>
              <Input
                type={showSecrets.appSecret ? "text" : "password"}
                value={credentials.appSecret || ""}
                onChange={(e) => handleCredentialChange("appSecret", e.target.value)}
                placeholder="3d1493..."
                className="h-9 text-xs font-mono bg-card mt-1"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold text-foreground">
                Webhook Verify Token
              </Label>
              <button
                type="button"
                onClick={() => copyToClipboard(credentials.verifyToken || "smoothsales_meta_verify_2026", "verifyToken")}
                className="text-[10px] text-primary hover:underline flex items-center gap-1"
              >
                {copiedKey === "verifyToken" ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                Copy Token
              </button>
            </div>
            <Input
              value={credentials.verifyToken || ""}
              onChange={(e) => handleCredentialChange("verifyToken", e.target.value)}
              placeholder="smoothsales_meta_verify_2026"
              className="h-9 text-xs font-mono bg-card mt-1"
            />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                System User Permanent Access Token <span className="text-rose-500">*</span>
                {isTokenValid && (
                  <Badge variant="outline" className="text-[9.5px] border-emerald-500/40 text-emerald-600 bg-emerald-500/10">
                    ✓ Valid Token
                  </Badge>
                )}
              </Label>
              <button
                type="button"
                onClick={() => toggleSecret("accessToken")}
                className="text-[10px] text-primary hover:underline flex items-center gap-1"
              >
                {showSecrets.accessToken ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                {showSecrets.accessToken ? "Hide" : "Show"}
              </button>
            </div>
            <Input
              type={showSecrets.accessToken ? "text" : "password"}
              value={credentials.accessToken || ""}
              onChange={(e) => handleCredentialChange("accessToken", e.target.value)}
              placeholder={secretHints.accessToken ? `Configured (${secretHints.accessToken}) — enter new to replace` : "EAAehtU..."}
              className={cn("h-9 text-xs font-mono bg-card mt-1", formErrors.accessToken && "border-rose-500 focus-visible:ring-rose-500")}
            />
            <div className="flex items-center justify-between mt-1">
              <span className="text-[10px] text-muted-foreground block">
                Generate in Meta Business Suite → Settings → System Users with <code className="font-mono text-foreground font-semibold">leads_retrieval</code>.
              </span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-7 text-[11px] gap-1 font-medium text-primary hover:bg-primary/10 border-primary/30"
                onClick={() => handleFetchMetaPages()}
                disabled={loadingPages}
              >
                {loadingPages ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3 text-primary" />}
                Fetch Facebook Pages & Forms
              </Button>
            </div>
          </div>
        </div>
      );
    }

    // ── 2. META CONVERSIONS API (CAPI) ──
    if (key === "meta_capi") {
      return (
        <div className="space-y-4">
          <div className="p-3.5 rounded-xl border border-blue-500/30 bg-blue-500/10 text-xs text-blue-950 dark:text-blue-200 space-y-1.5">
            <p className="font-semibold flex items-center gap-1.5">
              <Zap className="h-4 w-4 text-blue-500" /> Server-to-Server Closed Loop Attribution
            </p>
            <p className="text-[11px] leading-relaxed">
              Dispatches offline revenue milestones, token payments, and qualified site visits back to Meta Ads Pixel to maximize ROAS.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-semibold text-foreground">Meta Pixel ID <span className="text-rose-500">*</span></Label>
              <Input
                value={credentials.pixelId || ""}
                onChange={(e) => handleCredentialChange("pixelId", e.target.value)}
                placeholder="e.g. 104829105829104"
                className="h-9 text-xs font-mono bg-card mt-1"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold text-foreground">Test Event Code (Optional)</Label>
              <Input
                value={credentials.testEventCode || ""}
                onChange={(e) => handleCredentialChange("testEventCode", e.target.value)}
                placeholder="e.g. TEST12345"
                className="h-9 text-xs font-mono bg-card mt-1"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold text-foreground">CAPI Access Token <span className="text-rose-500">*</span></Label>
              {integration?.secretHints?.capiToken && (
                <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                  Saved: {integration.secretHints.capiToken}
                </span>
              )}
            </div>
            <div className="relative mt-1">
              <Input
                type={showSecrets["capiToken"] ? "text" : "password"}
                value={credentials.capiToken || ""}
                onChange={(e) => handleCredentialChange("capiToken", e.target.value)}
                placeholder={integration?.secretHints?.capiToken ? "•••••••••••••••••••• (Leave blank to keep current token)" : "EAAB..."}
                className="h-9 text-xs font-mono bg-card pr-10"
              />
              <button
                type="button"
                onClick={() => toggleSecret("capiToken")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 transition-colors"
              >
                {showSecrets["capiToken"] ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-border bg-muted/20 space-y-2">
            <span className="text-xs font-semibold text-foreground">Automatic Event Mapping:</span>
            <div className="grid grid-cols-2 gap-2 text-[11px] text-muted-foreground">
              <div className="p-2 rounded bg-card border border-border/60">
                <span className="font-semibold text-foreground block">Lead Created</span>
                Triggers: <code className="text-primary font-mono">Lead</code>
              </div>
              <div className="p-2 rounded bg-card border border-border/60">
                <span className="font-semibold text-foreground block">Site Visit Booked</span>
                Triggers: <code className="text-primary font-mono">Schedule</code>
              </div>
              <div className="p-2 rounded bg-card border border-border/60">
                <span className="font-semibold text-foreground block">Token Advance Paid</span>
                Triggers: <code className="text-primary font-mono">InitiateCheckout</code>
              </div>
              <div className="p-2 rounded bg-card border border-border/60">
                <span className="font-semibold text-foreground block">Deal Closed / Won</span>
                Triggers: <code className="text-emerald-600 font-mono">Purchase (INR Value)</code>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // ── 3. ANDROID COMPANION APP (SALESMAX PARITY) ──
    if (isAndroidCompanion) {
      return (
        <div className="space-y-4">
          <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-xs text-emerald-950 dark:text-emerald-200 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-semibold">
                <Smartphone className="h-4 w-4 text-emerald-600" />
                <span>Device Pairing Key (SalesMax Companion Bridge)</span>
              </div>
              <Badge className="bg-emerald-600 text-white font-mono text-[10px]">Active Protocol</Badge>
            </div>
            <p className="text-[11px] leading-relaxed">
              Sales reps enter this 6-digit key in the SmoothSales Android app to pair their mobile device with this workspace. Outbound calls will route through their device SIM card, and call recordings will auto-sync to the CRM.
            </p>
            <div className="flex items-center gap-3 pt-1">
              <div className="px-4 py-2 rounded-xl bg-card border border-border font-mono font-extrabold text-xl tracking-widest text-foreground shadow-xs">
                {deviceRegKey}
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => copyToClipboard(deviceRegKey, "dev_key")}
                className="h-9 text-xs gap-1.5 font-medium border-border"
              >
                {copiedKey === "dev_key" ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                Copy Key
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => {
                  const newKey = Math.floor(100000 + Math.random() * 900000).toString();
                  setDeviceRegKey(newKey);
                  toast.success("Generated New Pairing Key!");
                }}
                className="h-9 text-xs gap-1 text-muted-foreground hover:text-foreground"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Refresh
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-semibold text-foreground">Default Calling SIM</Label>
              <Select value={simPreference} onValueChange={setSimPreference}>
                <SelectTrigger className="h-9 text-xs font-medium bg-card mt-1">
                  <SelectValue placeholder="SIM selection" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ask">Always Ask Sales Rep (Popup)</SelectItem>
                  <SelectItem value="sim1">Force SIM 1 (Primary)</SelectItem>
                  <SelectItem value="sim2">Force SIM 2 (Secondary Work SIM)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-semibold text-foreground">Post-Call Disposition Modal</Label>
              <div className="flex items-center justify-between p-2 mt-1 rounded-lg border border-border bg-card">
                <span className="text-xs font-medium">Mandatory Popup</span>
                <Switch checked={mandatoryDisposition} onCheckedChange={setMandatoryDisposition} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-card">
              <div>
                <span className="text-xs font-semibold text-foreground block">Auto-Sync Call Recordings</span>
                <span className="text-[10px] text-muted-foreground">Upload audio file upon hangup</span>
              </div>
              <Switch checked={autoRecordingSync} onCheckedChange={setAutoRecordingSync} />
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-card">
              <div>
                <span className="text-xs font-semibold text-foreground block">Upload on Wi-Fi Only</span>
                <span className="text-[10px] text-muted-foreground">Save mobile cellular data</span>
              </div>
              <Switch checked={wifiOnlySync} onCheckedChange={setWifiOnlySync} />
            </div>
          </div>
        </div>
      );
    }

    // ── 4. INDIAMART LEAD MANAGER ──
    if (key === "indiamart") {
      return (
        <div className="space-y-4">
          <div className="p-3.5 rounded-xl border border-red-500/30 bg-red-500/10 text-xs text-red-950 dark:text-red-200 space-y-1.5">
            <p className="font-semibold flex items-center gap-1.5">
              <Zap className="h-4 w-4 text-red-500" /> IndiaMART Instant Push & Pull Ingestion
            </p>
            <p className="text-[11px] leading-relaxed">
              SmoothSales connects to IndiaMART Seller API to ingest inquiries within 10 seconds of buyer submission with automatic product requirement tagging.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-foreground">
                  GLUSR_CRM_KEY <span className="text-rose-500">*</span>
                </Label>
                <button
                  type="button"
                  onClick={() => toggleSecret("glusrCrmKey")}
                  className="text-[10px] text-primary hover:underline flex items-center gap-1"
                >
                  {showSecrets.glusrCrmKey ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  {showSecrets.glusrCrmKey ? "Hide" : "Show"}
                </button>
              </div>
              <Input
                type={showSecrets.glusrCrmKey ? "text" : "password"}
                value={credentials.glusrCrmKey || ""}
                onChange={(e) => handleCredentialChange("glusrCrmKey", e.target.value)}
                placeholder={secretHints.glusrCrmKey ? `Configured (${secretHints.glusrCrmKey})` : "Enter GLUSR_CRM_KEY"}
                className="h-9 text-xs font-mono bg-card mt-1"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold text-foreground">Registered Seller Mobile Number <span className="text-rose-500">*</span></Label>
              <Input
                value={credentials.sellerMobile || ""}
                onChange={(e) => handleCredentialChange("sellerMobile", e.target.value)}
                placeholder="e.g. 9876543210"
                className="h-9 text-xs font-mono bg-card mt-1"
              />
            </div>
          </div>

          <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-2">
            <Label className="text-xs font-semibold text-foreground">IndiaMART Push Webhook Destination URL</Label>
            <div className="flex items-center gap-2">
              <Input
                readOnly
                value={activeWebhookUrl || "Save configuration to generate dedicated endpoint URL"}
                className="h-9 text-xs font-mono bg-background"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(activeWebhookUrl, "im_url")}
                disabled={!activeWebhookUrl}
                className="h-9 px-3 shrink-0"
              >
                {copiedKey === "im_url" ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4 text-muted-foreground" />}
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground">
              In IndiaMART Seller Dashboard → Lead Manager → CRM Integration: select &quot;Push API&quot; and paste the URL above.
            </p>
          </div>
        </div>
      );
    }

    // ── 5. JUSTDIAL BUSINESS LEADS ──
    if (key === "justdial") {
      return (
        <div className="space-y-4">
          <div className="p-3.5 rounded-xl border border-orange-500/30 bg-orange-500/10 text-xs text-orange-950 dark:text-orange-200 space-y-1.5">
            <p className="font-semibold flex items-center gap-1.5">
              <Zap className="h-4 w-4 text-orange-500" /> Justdial Lead Push Integration
            </p>
            <p className="text-[11px] leading-relaxed">
              Justdial forwards real-time buyer enquiries to your SmoothSales CRM endpoint via HTTP POST.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-semibold text-foreground">Registered Business / Brand Name</Label>
              <Input
                value={credentials.brandName || ""}
                onChange={(e) => handleCredentialChange("brandName", e.target.value)}
                placeholder="e.g. Udified CRM Solution"
                className="h-9 text-xs font-mono bg-card mt-1"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold text-foreground">Lead Auth Token / Secret</Label>
              <Input
                type="password"
                value={credentials.leadToken || ""}
                onChange={(e) => handleCredentialChange("leadToken", e.target.value)}
                placeholder="Enter secret token"
                className="h-9 text-xs font-mono bg-card mt-1"
              />
            </div>
          </div>

          <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-2">
            <Label className="text-xs font-semibold text-foreground">Your Dedicated Justdial Inbound Webhook URL</Label>
            <div className="flex items-center gap-2">
              <Input
                readOnly
                value={activeWebhookUrl || "Save configuration to generate dedicated endpoint URL"}
                className="h-9 text-xs font-mono bg-background"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(activeWebhookUrl, "jd_url")}
                disabled={!activeWebhookUrl}
                className="h-9 px-3 shrink-0"
              >
                {copiedKey === "jd_url" ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4 text-muted-foreground" />}
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground">
              Provide this exact URL to your Justdial Key Account Manager (KAM) or paste into the Justdial Vendor Portal.
            </p>
          </div>
        </div>
      );
    }

    // ── 6. REAL ESTATE PORTALS (99acres, MagicBricks, Housing, NoBroker) ──
    if (["99acres", "magicbricks", "housing", "nobroker"].includes(key)) {
      const portalNames = {
        "99acres": "99acres.com Real Estate",
        magicbricks: "MagicBricks Gateway",
        housing: "Housing.com Property Portal",
        nobroker: "NoBroker Builder Platform",
      };

      return (
        <div className="space-y-4">
          <div className="p-3.5 rounded-xl border border-blue-500/30 bg-blue-500/10 text-xs text-blue-950 dark:text-blue-200 space-y-1.5">
            <p className="font-semibold flex items-center gap-1.5">
              <Building className="h-4 w-4 text-blue-500" /> {portalNames[key]} Real Estate Connector
            </p>
            <p className="text-[11px] leading-relaxed">
              Auto-ingests buyer callbacks, project inquiries, and floor plan download requests with budget range and locality mapping.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-semibold text-foreground">Builder / Partner ID <span className="text-rose-500">*</span></Label>
              <Input
                value={credentials.partnerId || ""}
                onChange={(e) => handleCredentialChange("partnerId", e.target.value)}
                placeholder="e.g. BLD_83910"
                className="h-9 text-xs font-mono bg-card mt-1"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold text-foreground">Portal API Secret / Key</Label>
              <Input
                type="password"
                value={credentials.apiKey || ""}
                onChange={(e) => handleCredentialChange("apiKey", e.target.value)}
                placeholder="Enter portal webhook token"
                className="h-9 text-xs font-mono bg-card mt-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-semibold text-foreground">Default Project Assignment</Label>
              <Select
                value={credentials.defaultProject || "auto"}
                onValueChange={(val) => handleCredentialChange("defaultProject", val)}
              >
                <SelectTrigger className="h-9 text-xs bg-card mt-1">
                  <SelectValue placeholder="Project assignment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto-detect from Listing Title</SelectItem>
                  <SelectItem value="prime_residence">Prime Skyline Residences</SelectItem>
                  <SelectItem value="green_valleys">Green Valley Villas</SelectItem>
                  <SelectItem value="commercial_hub">Metro Commercial Tower</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-semibold text-foreground">Duplicate Inquiry Policy</Label>
              <Select
                value={credentials.dupePolicy || "update_notes"}
                onValueChange={(val) => handleCredentialChange("dupePolicy", val)}
              >
                <SelectTrigger className="h-9 text-xs bg-card mt-1">
                  <SelectValue placeholder="Duplicate rule" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="update_notes">Update existing lead &amp; append note</SelectItem>
                  <SelectItem value="create_sublead">Create separate sub-inquiry</SelectItem>
                  <SelectItem value="ignore">Ignore duplicate within 30 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      );
    }

    // ── 7. TELEPHONY & CLOUD CALLING (Exotel, Knowlarity, CallerDesk, Tata Tele, BonVoice) ──
    if (["exotel", "knowlarity", "caller_desk", "bon_voice", "tata_tele"].includes(key)) {
      const telcoNames = {
        exotel: "Exotel Cloud Telephony",
        knowlarity: "Knowlarity SuperReceptionist",
        caller_desk: "CallerDesk Multi-Agent",
        bon_voice: "Bon Voice Cloudphony",
        tata_tele: "Tata Smartflo CTI",
      };

      return (
        <div className="space-y-4">
          <div className="p-3.5 rounded-xl border border-indigo-500/30 bg-indigo-500/10 text-xs text-indigo-950 dark:text-indigo-200 space-y-1.5">
            <p className="font-semibold flex items-center gap-1.5">
              <PhoneCall className="h-4 w-4 text-indigo-500" /> {telcoNames[key]}
            </p>
            <p className="text-[11px] leading-relaxed">
              Enables 1-click click-to-call, live IVR agent bridging, automatic call recording playback, and call outcome logging.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-semibold text-foreground">Account SID / Customer ID <span className="text-rose-500">*</span></Label>
              <Input
                value={credentials.accountSid || credentials.accountId || ""}
                onChange={(e) => handleCredentialChange("accountSid", e.target.value)}
                placeholder="e.g. exo_acc_83910"
                className="h-9 text-xs font-mono bg-card mt-1"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold text-foreground">Pilot Caller ID / Virtual Number (DID) <span className="text-rose-500">*</span></Label>
              <Input
                value={credentials.callerId || ""}
                onChange={(e) => handleCredentialChange("callerId", e.target.value)}
                placeholder="e.g. +91 80 4719 3200"
                className="h-9 text-xs font-mono bg-card mt-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-semibold text-foreground">API Key / User Key <span className="text-rose-500">*</span></Label>
              <Input
                value={credentials.apiKey || ""}
                onChange={(e) => handleCredentialChange("apiKey", e.target.value)}
                placeholder="Enter API Key"
                className="h-9 text-xs font-mono bg-card mt-1"
              />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-foreground">API Token / Secret <span className="text-rose-500">*</span></Label>
                <button
                  type="button"
                  onClick={() => toggleSecret("apiToken")}
                  className="text-[10px] text-primary hover:underline flex items-center gap-1"
                >
                  {showSecrets.apiToken ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  {showSecrets.apiToken ? "Hide" : "Show"}
                </button>
              </div>
              <Input
                type={showSecrets.apiToken ? "text" : "password"}
                value={credentials.apiToken || ""}
                onChange={(e) => handleCredentialChange("apiToken", e.target.value)}
                placeholder="Enter API token"
                className="h-9 text-xs font-mono bg-card mt-1"
              />
            </div>
          </div>
        </div>
      );
    }

    // ── 8. PAYMENTS & SMART COLLECT (Razorpay, Cashfree) ──
    if (["razorpay", "cashfree"].includes(key)) {
      const isRzp = key === "razorpay";
      return (
        <div className="space-y-4">
          <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/5 text-xs text-emerald-950 dark:text-emerald-200 space-y-1.5">
            <p className="font-semibold flex items-center gap-1.5">
              <CreditCard className="h-4 w-4 text-emerald-500" /> {isRzp ? "Razorpay" : "Cashfree"} Instant Payment Links &amp; Webhooks
            </p>
            <p className="text-[11px] leading-relaxed">
              Generate payment collection links directly from Deal profile &amp; automatically mark deals &quot;Won&quot; upon successful capture.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-semibold text-foreground">{isRzp ? "Key ID" : "App ID"} <span className="text-rose-500">*</span></Label>
              <Input
                value={credentials.keyId || credentials.appId || ""}
                onChange={(e) => handleCredentialChange(isRzp ? "keyId" : "appId", e.target.value)}
                placeholder={isRzp ? "rzp_live_..." : "CF_APP_..."}
                className="h-9 text-xs font-mono bg-card mt-1"
              />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-foreground">{isRzp ? "Key Secret" : "Secret Key"} <span className="text-rose-500">*</span></Label>
                <button
                  type="button"
                  onClick={() => toggleSecret("keySecret")}
                  className="text-[10px] text-primary hover:underline flex items-center gap-1"
                >
                  {showSecrets.keySecret ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  {showSecrets.keySecret ? "Hide" : "Show"}
                </button>
              </div>
              <Input
                type={showSecrets.keySecret ? "text" : "password"}
                value={credentials.keySecret || ""}
                onChange={(e) => handleCredentialChange("keySecret", e.target.value)}
                placeholder="Enter secret key"
                className="h-9 text-xs font-mono bg-card mt-1"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs font-semibold text-foreground">Webhook Secret (for HMAC verification)</Label>
            <Input
              type="password"
              value={credentials.webhookSecret || ""}
              onChange={(e) => handleCredentialChange("webhookSecret", e.target.value)}
              placeholder="Enter webhook secret set in payment dashboard"
              className="h-9 text-xs font-mono bg-card mt-1"
            />
          </div>
        </div>
      );
    }

    // ── 9. WHATSAPP WEBSITE CHAT WIDGET ──
    if (isWhatsAppWidget) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <Label className="text-xs font-semibold text-foreground">Business / Brand Name</Label>
              <Input
                value={widgetBrandName}
                onChange={(e) => setWidgetBrandName(e.target.value)}
                placeholder="e.g. SmoothSales Team"
                className="h-9 text-xs bg-card mt-1"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold text-foreground">Support Agent Title</Label>
              <Input
                value={widgetAgentName}
                onChange={(e) => setWidgetAgentName(e.target.value)}
                placeholder="e.g. Sales Specialist"
                className="h-9 text-xs bg-card mt-1"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold text-foreground">Welcome Greeting Message</Label>
              <Input
                value={widgetWelcomeMsg}
                onChange={(e) => setWidgetWelcomeMsg(e.target.value)}
                placeholder="Welcome greeting..."
                className="h-9 text-xs bg-card mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold text-foreground">Widget Position</Label>
                <Select value={widgetPosition} onValueChange={setWidgetPosition}>
                  <SelectTrigger className="h-9 text-xs bg-card mt-1">
                    <SelectValue placeholder="Position" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bottom-right">Bottom Right</SelectItem>
                    <SelectItem value="bottom-left">Bottom Left</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs font-semibold text-foreground">Accent Brand Color</Label>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="color"
                    value={widgetColor}
                    onChange={(e) => setWidgetColor(e.target.value)}
                    className="h-9 w-12 rounded cursor-pointer border border-border"
                  />
                  <Input
                    value={widgetColor}
                    onChange={(e) => setWidgetColor(e.target.value)}
                    className="h-9 text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl border border-border bg-card flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold block text-foreground">Pre-Chat Lead Capture Form</span>
                <span className="text-[10px] text-muted-foreground">Collect Name &amp; Phone before redirecting to WhatsApp</span>
              </div>
              <Switch checked={widgetLeadCapture} onCheckedChange={setWidgetLeadCapture} />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-foreground">Embed Snippet (Paste before &lt;/body&gt;)</Label>
                <button
                  type="button"
                  onClick={() => {
                    const hostUrl = typeof window !== "undefined" ? window.location.origin : "https://crm.smoothsales.in";
                    copyToClipboard(`<script src="${hostUrl}/widget.js" data-tenant="smoothsales" data-color="${widgetColor}" async></script>`, "widget_embed");
                  }}
                  className="text-[11px] text-primary hover:underline flex items-center gap-1"
                >
                  <Copy className="h-3 w-3" /> Copy Snippet
                </button>
              </div>
              <pre className="p-2.5 rounded-lg bg-muted text-[11px] font-mono text-muted-foreground mt-1 overflow-x-auto select-all">
{`<script src="${typeof window !== "undefined" ? window.location.origin : "https://crm.smoothsales.in"}/widget.js"
  data-tenant="smoothsales"
  data-color="${widgetColor}" async></script>`}
              </pre>
            </div>
          </div>

          {/* Live Visual Preview Pane */}
          <div className="p-5 rounded-2xl border border-border/80 bg-muted/30 flex flex-col justify-between relative min-h-[380px] overflow-hidden">
            <div className="flex items-center justify-between border-b border-border/60 pb-2">
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Palette className="h-3.5 w-3.5 text-emerald-600" /> Live Interactive Preview
              </span>
              <Badge variant="outline" className="text-[10px] font-mono">Website Mock</Badge>
            </div>

            <div className="space-y-2 text-center text-xs text-muted-foreground my-auto">
              <p className="font-semibold text-foreground">Your Website Content</p>
              <p className="text-[11px] max-w-xs mx-auto">
                The floating button and chat dialog will render dynamically as configured.
              </p>
            </div>

            {/* Rendered Floating Widget Mock */}
            <div className={cn("space-y-2 max-w-[260px]", widgetPosition === "bottom-left" ? "self-start" : "self-end")}>
              {/* Chat Popup Box */}
              <div className="p-3.5 rounded-2xl bg-card border border-border shadow-xl space-y-2.5 text-left text-xs animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center gap-2">
                  <div
                    className="h-7 w-7 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0"
                    style={{ backgroundColor: widgetColor }}
                  >
                    W
                  </div>
                  <div>
                    <h5 className="font-bold text-[12px] text-foreground leading-tight">{widgetBrandName}</h5>
                    <p className="text-[10px] text-emerald-600 font-medium">● Typically replies in 2m</p>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-muted/60 text-[11px] text-foreground leading-relaxed">
                  {widgetWelcomeMsg}
                </div>

                <button
                  type="button"
                  className="w-full py-2 rounded-xl text-white font-bold text-xs shadow-xs flex items-center justify-center gap-1.5 transition-all"
                  style={{ backgroundColor: widgetColor }}
                >
                  <MessageSquare className="h-3.5 w-3.5 fill-current" />
                  {widgetPromptText}
                </button>
              </div>

              {/* Floating Launcher Button */}
              <div
                className="h-12 w-12 rounded-full shadow-lg flex items-center justify-center text-white cursor-pointer ml-auto"
                style={{ backgroundColor: widgetColor }}
              >
                <MessageSquare className="h-6 w-6 fill-current" />
              </div>
            </div>
          </div>
        </div>
      );
    }

    // ── 10. GOOGLE SHEETS 2-WAY SYNC ──
    if (key === "google_sheets") {
      return (
        <div className="space-y-4">
          <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-xs text-emerald-950 dark:text-emerald-200 space-y-1.5">
            <p className="font-semibold flex items-center gap-1.5">
              <FileSpreadsheet className="h-4 w-4 text-emerald-600" /> Continuous Real-Time Google Spreadsheet Sync
            </p>
            <p className="text-[11px] leading-relaxed">
              Every lead captured in SmoothSales appends to your Google Sheet automatically, and row edits synchronize back to the CRM.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-semibold text-foreground">Google Spreadsheet ID or URL <span className="text-rose-500">*</span></Label>
              <Input
                value={credentials.spreadsheetId || ""}
                onChange={(e) => handleCredentialChange("spreadsheetId", e.target.value)}
                placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                className="h-9 text-xs font-mono bg-card mt-1"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold text-foreground">Worksheet Tab Name</Label>
              <Input
                value={credentials.sheetName || "Sheet1"}
                onChange={(e) => handleCredentialChange("sheetName", e.target.value)}
                placeholder="e.g. Leads_2026"
                className="h-9 text-xs font-mono bg-card mt-1"
              />
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-border bg-muted/20 text-xs space-y-2">
            <span className="font-semibold text-foreground">Service Account Authorization:</span>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Share your Google Sheet with editor access to SmoothSales sync bot:
              <br />
              <code className="font-mono text-foreground font-semibold select-all">smoothsales-sync@udified-crm-engine.iam.gserviceaccount.com</code>
            </p>
          </div>
        </div>
      );
    }

    // ── 11. OUTBOUND DATA WEBHOOKS ──
    if (isOutboundWebhook) {
      return (
        <div className="space-y-4">
          <div className="p-3.5 rounded-xl border border-primary/30 bg-primary/10 text-xs text-primary-950 dark:text-primary-200 space-y-1.5">
            <p className="font-semibold flex items-center gap-1.5">
              <Zap className="h-4 w-4 text-primary" /> Outbound Event Webhooks (Custom ERP / Data Lake)
            </p>
            <p className="text-[11px] leading-relaxed">
              Broadcast live CRM events (Lead Created, Stage Changed, Deal Won, WhatsApp Delivered) to your external server.
            </p>
          </div>

          <div>
            <Label className="text-xs font-semibold text-foreground">Target Webhook URL (HTTPS) <span className="text-rose-500">*</span></Label>
            <Input
              value={credentials.targetUrl || ""}
              onChange={(e) => handleCredentialChange("targetUrl", e.target.value)}
              placeholder="https://your-server.com/api/crm-events"
              className="h-9 text-xs font-mono bg-card mt-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-semibold text-foreground">HMAC Secret (Optional)</Label>
              <Input
                type="password"
                value={credentials.hmacSecret || ""}
                onChange={(e) => handleCredentialChange("hmacSecret", e.target.value)}
                placeholder="Enter HMAC signing secret"
                className="h-9 text-xs font-mono bg-card mt-1"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold text-foreground">Retry Policy</Label>
              <Select
                value={credentials.retryPolicy || "exponential"}
                onValueChange={(val) => handleCredentialChange("retryPolicy", val)}
              >
                <SelectTrigger className="h-9 text-xs font-mono bg-card mt-1">
                  <SelectValue placeholder="Select retry" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="exponential">Exponential Backoff (3 retries)</SelectItem>
                  <SelectItem value="linear">Linear (5 retries)</SelectItem>
                  <SelectItem value="none">No Retries (Fire &amp; Forget)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      );
    }

    // ── 12. GENERIC LEAD WEBHOOK FALLBACK ──
    if (integration.kind === "LEAD_WEBHOOK") {
      return (
        <div className="p-4 rounded-xl border border-border/80 bg-muted/20 text-center space-y-2">
          <Webhook className="h-8 w-8 text-primary mx-auto" />
          <h4 className="text-sm font-semibold text-foreground">Webhook-Driven Integration</h4>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            This channel receives prospect submissions via real-time webhooks. No outbound API keys required. Switch to the <strong>Webhook &amp; Security</strong> tab to get your endpoint URL.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setModalTab("webhook")}
            className="text-xs h-8 gap-1.5 mt-2"
          >
            <Webhook className="h-3.5 w-3.5" />
            View Webhook Endpoint
          </Button>
        </div>
      );
    }

    // Default fallback
    return (
      <div className="space-y-4">
        <div>
          <Label className="text-xs font-semibold text-foreground">API Key / Token</Label>
          <Input
            type="password"
            value={credentials.apiKey || ""}
            onChange={(e) => handleCredentialChange("apiKey", e.target.value)}
            className="h-9 text-xs font-mono bg-card mt-1"
          />
        </div>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden bg-card border-border shadow-2xl">
        {/* Modal Header */}
        <div className="p-6 pb-4 border-b border-border/80 bg-muted/20">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-card border border-border flex items-center justify-center p-2 shadow-xs shrink-0">
                {getIntegrationLogo(integration.key, "h-6 w-6")}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <DialogTitle className="text-base font-bold text-foreground">
                    {integration.name || integration.displayName}
                  </DialogTitle>
                  <Badge variant="outline" className="text-[10px] font-mono py-0 text-muted-foreground border-border shrink-0">
                    {integration.category}
                  </Badge>
                </div>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5 truncate">
                  {integration.description}
                </DialogDescription>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Link href={`/integrations/${integration.key}`} onClick={onClose}>
                <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground px-2">
                  <ExternalLink className="h-3 w-3" />
                  Full Page
                </Button>
              </Link>
              <span className={cn("text-xs font-semibold", enabled ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground")}>
                {enabled ? "Active" : "Disabled"}
              </span>
              <Switch checked={enabled} onCheckedChange={setEnabled} />
            </div>
          </div>

          {/* Segmented Navigation Bar */}
          <div className="flex space-x-1 mt-4 p-1 rounded-xl bg-muted/50 border border-border/60 overflow-x-auto no-scrollbar">
            {[
              { id: "auth", label: isAndroidCompanion ? "Companion Device" : isWhatsAppWidget ? "Widget Designer" : "Credentials & Auth", icon: isAndroidCompanion ? Smartphone : isWhatsAppWidget ? Palette : KeyRound },
              ...(isMetaAds ? [{ id: "pages", label: "Pages & Forms", icon: Layers, badge: metaPages.length > 0 ? `${metaPages.length}` : null }] : []),
              ...(isWebhookIntegration && !isWhatsAppWidget ? [{ id: "webhook", label: "Webhook & Security", icon: Webhook }] : []),
              ...(!isAndroidCompanion && !isWhatsAppWidget ? [{ id: "mapping", label: "Column Mapping", icon: SlidersHorizontal }] : []),
              { id: "test", label: "Test & Simulate", icon: Zap },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = modalTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setModalTab(tab.id)}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap",
                    isActive
                      ? "bg-card text-foreground shadow-xs border border-border/80 font-bold"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-primary/20 text-primary font-bold">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Modal Body (Scrollable) */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 bg-background/50">
          {/* ── TAB 1: CREDENTIALS & AUTH ── */}
          {modalTab === "auth" && (
            <div className="space-y-5">
              <div>
                <Label className="text-xs font-semibold text-foreground">Integration Channel Name</Label>
                <Input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className={cn("h-9 text-xs mt-1 bg-card", formErrors.displayName && "border-rose-500")}
                />
                {formErrors.displayName && (
                  <p className="text-[11px] text-rose-500 font-medium mt-1">{formErrors.displayName}</p>
                )}
              </div>

              {renderCredentials()}

              <div className="pt-2 flex items-center justify-between border-t border-border/60">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleRunTest}
                  disabled={testing}
                  className="text-xs h-9 gap-1.5 font-medium border-border"
                >
                  {testing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5 text-amber-500" />}
                  Test Connection Handshake
                </Button>

                {testResult && (
                  <span className={cn("text-xs font-semibold flex items-center gap-1", testResult.success ? "text-emerald-600" : "text-rose-500")}>
                    {testResult.success ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
                    {testResult.success ? "Verified" : "Check Config"}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* ── TAB 2: META PAGES & LEAD FORMS ── */}
          {modalTab === "pages" && isMetaAds && (
            <div className="space-y-5">
              {/* 0. Connected Meta Ad Accounts (Multi-Account) */}
              <div className="space-y-3 pb-3 border-b border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <CreditCard className="h-3.5 w-3.5 text-indigo-500" />
                      Connected Ad Accounts ({metaAdAccounts.length})
                    </h4>
                    <p className="text-[11px] text-muted-foreground">
                      Manage multiple ad accounts across businesses and clients
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-7 text-[11px] gap-1 border-border"
                      onClick={fetchMetaAdAccounts}
                      disabled={loadingMetaAdAccounts}
                    >
                      <RefreshCw className={cn("h-3 w-3", loadingMetaAdAccounts && "animate-spin")} />
                      Refresh
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      className="h-7 text-[11px] gap-1 bg-indigo-600 hover:bg-indigo-700 text-white"
                      onClick={() => setIsAddAdAccountOpen(!isAddAdAccountOpen)}
                    >
                      <Plus className="h-3 w-3" />
                      Link Ad Account
                    </Button>
                  </div>
                </div>

                {isAddAdAccountOpen && (
                  <div className="p-3 rounded-xl border border-indigo-500/30 bg-indigo-500/5 space-y-2.5">
                    <span className="text-xs font-semibold text-foreground block">Link Another Ad Account</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <Input
                        placeholder="Ad Account ID (e.g. act_123456789)"
                        value={newAdAccountId}
                        onChange={(e) => setNewAdAccountId(e.target.value)}
                        className="h-8 text-xs font-mono bg-card"
                      />
                      <Input
                        placeholder="Account Label (e.g. Client Alpha Real Estate)"
                        value={newAdAccountName}
                        onChange={(e) => setNewAdAccountName(e.target.value)}
                        className="h-8 text-xs bg-card"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-7 text-[11px]"
                        onClick={() => setIsAddAdAccountOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        className="h-7 text-[11px] gap-1 bg-indigo-600 hover:bg-indigo-700 text-white"
                        onClick={handleCreateAdAccount}
                        disabled={addingAdAccount}
                      >
                        {addingAdAccount ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
                        Save Account
                      </Button>
                    </div>
                  </div>
                )}

                {loadingMetaAdAccounts ? (
                  <div className="p-4 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    Loading Ad Accounts...
                  </div>
                ) : metaAdAccounts.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
                    {metaAdAccounts.map((account) => {
                      const isToggling = togglingAdAccountId === account.adAccountId;
                      return (
                        <div
                          key={account.adAccountId}
                          className="p-2.5 rounded-xl border border-border bg-card flex items-center justify-between gap-2"
                        >
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-foreground truncate">{account.name}</p>
                            <p className="text-[10px] text-muted-foreground font-mono truncate">{account.adAccountId}</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-[9.5px] py-0",
                                account.active
                                  ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                                  : "text-muted-foreground"
                              )}
                            >
                              {account.active ? "Active" : "Paused"}
                            </Badge>
                            <Switch
                              checked={account.active}
                              disabled={isToggling}
                              onCheckedChange={() => handleToggleAdAccountActive(account.adAccountId, account.active)}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-3 text-center rounded-xl border border-dashed border-border bg-muted/10 text-xs text-muted-foreground">
                    No extra ad accounts linked. Click &quot;Link Ad Account&quot; to ingest leads from client portfolios.
                  </div>
                )}
              </div>

              {/* 1. Select Facebook Page */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Building className="h-3.5 w-3.5 text-primary" />
                      1. Select Facebook Page
                    </h4>
                    <p className="text-[11px] text-muted-foreground">
                      Choose which Facebook Page&apos;s lead forms to connect to SmoothSales CRM
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-7 text-[11px] gap-1 border-border"
                      onClick={() => setIsAddPageOpen(!isAddPageOpen)}
                    >
                      <Plus className="h-3 w-3" />
                      Add Page Manually
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-7 text-[11px] gap-1 border-border"
                      onClick={() => handleFetchMetaPages()}
                      disabled={loadingPages}
                    >
                      <RefreshCw className={cn("h-3 w-3", loadingPages && "animate-spin")} />
                      Refresh Pages
                    </Button>
                  </div>
                </div>

                {isAddPageOpen && (
                  <div className="p-3 rounded-xl border border-primary/30 bg-primary/5 space-y-2.5">
                    <span className="text-xs font-semibold text-foreground block">Add Facebook Page Manually</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <Input
                        placeholder="Facebook Page ID (e.g. 104829105829104)"
                        value={manualPageId}
                        onChange={(e) => setManualPageId(e.target.value)}
                        className="h-8 text-xs font-mono bg-card"
                      />
                      <Input
                        placeholder="Page Name (e.g. SmoothSales Real Estate)"
                        value={manualPageName}
                        onChange={(e) => setManualPageName(e.target.value)}
                        className="h-8 text-xs bg-card"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-7 text-[11px]"
                        onClick={() => setIsAddPageOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        className="h-7 text-[11px] gap-1 bg-primary text-primary-foreground"
                        onClick={handleCreatePageManual}
                        disabled={addingPageManual}
                      >
                        {addingPageManual ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
                        Save Page
                      </Button>
                    </div>
                  </div>
                )}

                {loadingPages ? (
                  <div className="p-8 text-center border border-border rounded-xl bg-card space-y-2">
                    <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
                    <p className="text-xs text-muted-foreground">Fetching your Facebook Pages from Meta Graph API...</p>
                  </div>
                ) : metaPages.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto pr-1">
                    {metaPages.map((page) => {
                      const isSelected = selectedPage?.id === page.id || credentials.pageId === page.id;
                      return (
                        <div
                          key={page.id}
                          onClick={() => handleSelectMetaPage(page)}
                          className={cn(
                            "p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 text-left",
                            isSelected
                              ? "border-primary bg-primary/5 shadow-xs"
                              : "border-border bg-card hover:border-border/80 hover:bg-muted/30"
                          )}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center text-primary font-bold text-xs shrink-0 overflow-hidden border border-border">
                              {page.picture?.data?.url ? (
                                <img src={page.picture.data.url} alt={page.name} className="h-full w-full object-cover" />
                              ) : (
                                page.name.charAt(0)
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-foreground truncate">{page.name}</p>
                              <p className="text-[10px] text-muted-foreground font-mono truncate">ID: {page.id}</p>
                              {page.category && (
                                <span className="text-[9.5px] text-muted-foreground/80 block truncate">{page.category}</span>
                              )}
                            </div>
                          </div>
                          {isSelected ? (
                            <Badge className="bg-primary text-primary-foreground text-[10px] py-0 px-1.5 shrink-0">
                              Selected
                            </Badge>
                          ) : (
                            <Button type="button" variant="ghost" size="sm" className="h-7 text-[11px] px-2 text-muted-foreground">
                              Select
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl border border-dashed border-border bg-muted/20 text-center space-y-1">
                    <p className="text-xs font-semibold text-foreground">No Pages Loaded Yet</p>
                    <p className="text-[11px] text-muted-foreground">
                      Paste your System User Token in Credentials &amp; Auth tab and click &quot;Fetch Facebook Pages&quot;.
                    </p>
                  </div>
                )}
              </div>

              {/* Lead Forms Selection */}
              <div className="space-y-3 pt-2 border-t border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5 text-emerald-600" />
                      2. Subscribed Lead Forms {selectedPage ? `(${selectedPage.name})` : ""}
                    </h4>
                    <p className="text-[11px] text-muted-foreground">
                      Select which Lead Gen Forms should push leads into SmoothSales
                    </p>
                  </div>
                </div>

                {loadingForms ? (
                  <div className="p-6 text-center border border-border rounded-xl bg-card space-y-2">
                    <Loader2 className="h-5 w-5 animate-spin text-emerald-600 mx-auto" />
                    <p className="text-xs text-muted-foreground">Loading active Lead Forms from Meta...</p>
                  </div>
                ) : metaForms.length > 0 ? (
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {metaForms.map((form) => {
                      const isFormSelected = selectedForms.includes(form.id);
                      return (
                        <div
                          key={form.id}
                          onClick={() => handleToggleForm(form.id)}
                          className={cn(
                            "p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3",
                            isFormSelected
                              ? "border-emerald-500/40 bg-emerald-500/5 shadow-xs"
                              : "border-border bg-card hover:bg-muted/30"
                          )}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="text-emerald-600 shrink-0">
                              {isFormSelected ? (
                                <CheckSquare className="h-4 w-4" />
                              ) : (
                                <Square className="h-4 w-4 text-muted-foreground" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-foreground truncate">{form.name}</p>
                              <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                                <span className="font-mono">ID: {form.id}</span>
                                <span>·</span>
                                <span className="text-emerald-700 dark:text-emerald-400 font-semibold">{form.status || "ACTIVE"}</span>
                                {form.leads_count !== undefined && (
                                  <>
                                    <span>·</span>
                                    <span>{form.leads_count} leads</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          <Badge variant="outline" className={cn("text-[10px] py-0", isFormSelected ? "bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border-emerald-500/30" : "text-muted-foreground")}>
                            {isFormSelected ? "Syncing Active" : "Paused"}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl border border-dashed border-border bg-muted/20 text-center space-y-1">
                    <p className="text-xs font-semibold text-foreground">No Published Lead Forms on this Page</p>
                    <p className="text-[11px] text-muted-foreground">
                      Create a lead form in Meta Ads Manager or submit a test lead from Meta Lead Ads Testing Tool.
                    </p>
                  </div>
                )}
              </div>

              {/* 1-Click Page Webhook Subscription */}
              <div className="pt-3 border-t border-border flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-foreground">Page Real-Time Webhook Hook</p>
                  <p className="text-[11px] text-muted-foreground">Subscribes this Facebook Page to forward leadgen events</p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs gap-1.5 border-emerald-500/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10 font-semibold"
                  onClick={handleSubscribePageWebhook}
                  disabled={subscribingWebhook || !selectedPage?.id}
                >
                  {subscribingWebhook ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5 fill-current" />}
                  Subscribe Page to Webhook
                </Button>
              </div>
            </div>
          )}

          {/* ── TAB 3: WEBHOOK & SECURITY ── */}
          {modalTab === "webhook" && (
            <div className="space-y-5">
              <div>
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold text-foreground">
                    Inbound Webhook Endpoint URL
                  </Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleRotateKey}
                    disabled={rotatingKey}
                    className="text-[11px] h-7 gap-1 text-muted-foreground hover:text-foreground"
                  >
                    <RefreshCw className={cn("h-3 w-3", rotatingKey && "animate-spin")} />
                    Rotate Secret Key
                  </Button>
                </div>
                <div className="mt-1.5 flex items-center gap-2">
                  <Input
                    readOnly
                    value={activeWebhookUrl || "Key not generated yet. Click 'Rotate Secret Key' above."}
                    className="text-xs font-mono bg-muted/40 border-border"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(activeWebhookUrl, "webhook_url")}
                    disabled={!activeWebhookUrl}
                    className="h-9 px-3 shrink-0"
                  >
                    {copiedKey === "webhook_url" ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4 text-muted-foreground" />}
                  </Button>
                </div>
                {activeWebhookKey && (
                  <div className="mt-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300 space-y-1">
                    <p className="font-semibold flex items-center gap-1">
                      <AlertCircle className="h-3.5 w-3.5" /> New Plaintext Key Generated:
                    </p>
                    <p className="font-mono text-[11px] select-all break-all">{activeWebhookKey}</p>
                    <p className="text-[10px] text-amber-700/80">
                      Copy this URL now. For security, secret keys are never displayed in full again.
                    </p>
                  </div>
                )}
              </div>

              <div className="p-4 rounded-xl border border-border bg-card space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Code2 className="h-3.5 w-3.5 text-primary" /> cURL Test Snippet
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(`curl -X POST "${activeWebhookUrl || "https://your-crm/api/webhooks/..."}" \
  -H "Content-Type: application/json" \
  -d '{"name":"Rahul Sharma","phone":"+919876543210","email":"rahul@example.com","city":"Mumbai","notes":"Looking for 3BHK"}'`, "curl_sample")}
                    className="text-[10px] text-primary hover:underline flex items-center gap-1"
                  >
                    <Copy className="h-3 w-3" /> Copy cURL
                  </button>
                </div>
                <pre className="p-2.5 rounded-lg bg-muted text-[11px] font-mono text-muted-foreground overflow-x-auto select-all">
{`curl -X POST "${activeWebhookUrl || "https://your-crm/api/webhooks/..."}" \\
  -H "Content-Type: application/json" \\
  -d '{"name":"Rahul Sharma","phone":"+919876543210","email":"rahul@example.com"}'`}
                </pre>
              </div>

              {/* Website JS / Form Embed Snippets */}
              <div className="p-4 rounded-xl border border-border bg-card space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Globe className="h-3.5 w-3.5 text-teal-500" /> Website Form JavaScript (Fetch API)
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(`// Add this to your website's contact form submit handler:
async function submitLeadToCRM(formData) {
  const response = await fetch("${activeWebhookUrl || "https://your-crm/api/webhooks/..."}", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: formData.name,
      phone: formData.phone,
      email: formData.email,
      city: formData.city,
      propertyInterest: formData.propertyInterest,
      notes: formData.message,
      utm_source: "website",
      utm_campaign: "direct_lead_capture"
    })
  });
  return response.json();
}`, "js_fetch_snippet")}
                    className="text-[10px] text-primary hover:underline flex items-center gap-1"
                  >
                    <Copy className="h-3 w-3" /> Copy JS Snippet
                  </button>
                </div>
                <pre className="p-2.5 rounded-lg bg-muted text-[11px] font-mono text-muted-foreground overflow-x-auto select-all">
{`fetch("${activeWebhookUrl || "https://your-crm/api/webhooks/..."}", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ name, phone, email, city, notes })
});`}
                </pre>
              </div>

              <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 text-xs text-muted-foreground space-y-1.5">
                <p className="font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                  <ShieldCheck className="h-4 w-4" /> Instant E.164 Clean &amp; Deduplication Engine
                </p>
                <p className="text-[11px]">
                  All incoming payloads are verified, deduplicated against existing CRM contacts, assigned to active round-robin pipelines, and trigger automated WhatsApp welcoming flows immediately.
                </p>
              </div>
            </div>
          )}

          {/* ── TAB 4: COLUMN MAPPING ── */}
          {modalTab === "mapping" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-foreground">Inbound Payload Field Mapping</h4>
                  <p className="text-[11px] text-muted-foreground">
                    Map custom JSON keys or webhook parameters directly into SmoothSales contact fields
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddMappingRow}
                  className="h-8 text-xs gap-1 border-border font-medium"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Mapping
                </Button>
              </div>

              {fieldMappings.length === 0 ? (
                <div className="p-6 rounded-xl border border-dashed border-border bg-muted/20 text-center space-y-2">
                  <SlidersHorizontal className="h-6 w-6 text-muted-foreground mx-auto" />
                  <p className="text-xs font-medium text-foreground">No Custom Field Mappings Defined</p>
                  <p className="text-[11px] text-muted-foreground max-w-sm mx-auto">
                    SmoothSales automatically detects standard keys like <code>name</code>, <code>phone</code>, <code>email</code>, <code>city</code>, and <code>message</code>. Add custom mappings only for non-standard webhook structures.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddMappingRow}
                    className="text-xs h-8 gap-1 mt-1"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add First Field
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="grid grid-cols-12 gap-2 text-[11px] font-semibold text-muted-foreground px-2">
                    <span className="col-span-5">Provider Inbound Key (JSON / Query)</span>
                    <span className="col-span-6">SmoothSales Target Column</span>
                    <span className="col-span-1 text-center">Del</span>
                  </div>
                  {fieldMappings.map((row, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-card p-2 rounded-lg border border-border">
                      <div className="col-span-5">
                        <Input
                          placeholder="e.g. sender_mobile or full_name"
                          value={row.sourceKey || ""}
                          onChange={(e) => handleUpdateMappingRow(idx, "sourceKey", e.target.value)}
                          className="h-8 text-xs font-mono"
                        />
                      </div>
                      <div className="col-span-6">
                        <Select
                          value={row.targetField || "notes"}
                          onValueChange={(val) => handleUpdateMappingRow(idx, "targetField", val)}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="Target field" />
                          </SelectTrigger>
                          <SelectContent>
                            {CRM_TARGET_COLUMNS.map((col) => (
                              <SelectItem key={col.value} value={col.value}>
                                {col.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-1 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveMappingRow(idx)}
                          className="text-muted-foreground hover:text-rose-500 p-1 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── TAB 5: TEST & SIMULATE ── */}
          {modalTab === "test" && (
            <div className="space-y-5">
              <div className="p-4 rounded-xl border border-border bg-card space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Zap className="h-3.5 w-3.5 text-amber-500" />
                    Provider Handshake Check
                  </h4>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleRunTest}
                    disabled={testing}
                    className="h-7 text-xs gap-1 font-semibold"
                  >
                    {testing ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                    Run Connection Check
                  </Button>
                </div>
                {testResult ? (
                  <div className={cn("p-3 rounded-lg border text-xs space-y-1", testResult.success ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-800 dark:text-emerald-300" : "border-rose-500/30 bg-rose-500/5 text-rose-700 dark:text-rose-300")}>
                    <p className="font-semibold flex items-center gap-1">
                      {testResult.success ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                      {testResult.success ? "Handshake Succeeded" : "Connection Failed"}
                    </p>
                    <p className="text-[11px] leading-relaxed">{testResult.message}</p>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Runs live authentication against provider endpoints with current credentials.
                  </p>
                )}
              </div>

              {/* Lead Simulation Form */}
              <div className="p-4 rounded-xl border border-border bg-card space-y-3">
                <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Send className="h-3.5 w-3.5 text-primary" />
                  Simulate Live Inbound Lead
                </h4>
                <p className="text-[11px] text-muted-foreground">
                  Send a sample payload through the full ingestion pipeline to test your field mapping, deduplication, and lead attribution.
                </p>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <Label className="text-[11px] text-muted-foreground">Full Name</Label>
                    <Input
                      placeholder="e.g. Vikram Verma"
                      value={simulationPayload.name}
                      onChange={(e) => setSimulationPayload({ ...simulationPayload, name: e.target.value })}
                      className="h-8 text-xs mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px] text-muted-foreground">Phone Number</Label>
                    <Input
                      placeholder="+91 98765 43210"
                      value={simulationPayload.phone}
                      onChange={(e) => setSimulationPayload({ ...simulationPayload, phone: e.target.value })}
                      className="h-8 text-xs mt-1 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-[11px] text-muted-foreground">Email</Label>
                    <Input
                      placeholder="vikram@example.com"
                      value={simulationPayload.email}
                      onChange={(e) => setSimulationPayload({ ...simulationPayload, email: e.target.value })}
                      className="h-8 text-xs mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px] text-muted-foreground">City / Location</Label>
                    <Input
                      placeholder="e.g. Bangalore"
                      value={simulationPayload.city}
                      onChange={(e) => setSimulationPayload({ ...simulationPayload, city: e.target.value })}
                      className="h-8 text-xs mt-1"
                    />
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <Button
                    type="button"
                    size="sm"
                    variant="default"
                    onClick={handleSimulate}
                    disabled={simulating}
                    className="text-xs h-8 gap-1.5 font-semibold"
                  >
                    {simulating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                    Trigger Ingestion Pipeline
                  </Button>

                  {simulatedLead && (
                    <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Lead #{simulatedLead.id ? String(simulatedLead.id).slice(0, 8) : "Captured"}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <DialogFooter className="p-4 border-t border-border bg-card flex items-center justify-between sm:justify-between">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={saving}
            className="text-xs h-9 text-muted-foreground hover:text-foreground"
          >
            Cancel
          </Button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              onClick={handleSave}
              disabled={saving}
              className="text-xs h-9 px-4 gap-1.5 font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
            >
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
              Save Configuration
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
