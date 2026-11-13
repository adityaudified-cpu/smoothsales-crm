"use client";

import React, { useState, useEffect } from "react";
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
import { Textarea } from "@/components/ui/textarea";
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
  Workflow,
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
  Loader2,
  ArrowRight,
  Send,
  Building2,
  Settings2,
  Sparkles,
  Lock,
  Radio,
  FileCode,
  Share2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { testIntegration, simulateLead } from "@/lib/api/integrations";
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
];

export function UniversalConfigModal({
  integration,
  isOpen,
  onClose,
  onSave,
  saving,
}) {
  const [modalTab, setModalTab] = useState("auth"); // 'auth' | 'webhook' | 'mapping' | 'routing' | 'test'
  const [showSecrets, setShowSecrets] = useState({});
  const [copiedKey, setCopiedKey] = useState(null);

  // Form State
  const [enabled, setEnabled] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [credentials, setCredentials] = useState({});
  const [fieldMappings, setFieldMappings] = useState([]);
  const [routing, setRouting] = useState({
    assignMode: "ROUND_ROBIN",
    distributionPool: "Inbound Real Estate Closers",
    autoTag: "Online_Lead",
    triggerWhatsAppWelcome: true,
    welcomeTemplate: "lead_welcome_intro",
    priority: "HIGH",
  });

  // Test & Simulation State
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [simulating, setSimulating] = useState(false);
  const [samplePayload, setSamplePayload] = useState({
    name: "Rohit Malhotra",
    phone: "+919876543210",
    email: "rohit.malhotra@buyer.in",
    city: "Gurugram, Cyber Hub",
    notes: "Interested in 3 BHK high-rise with immediate possession",
  });

  // Sync state when integration prop changes
  useEffect(() => {
    if (integration) {
      setEnabled(integration.enabled || false);
      setDisplayName(integration.displayName || integration.key);
      const cfg = integration.config || {};

      // Extract credentials (excluding fieldMappings and routing)
      const creds = { ...cfg };
      delete creds.fieldMappings;
      delete creds.routing;
      setCredentials(creds);

      // Extract field mappings or set defaults
      if (Array.isArray(cfg.fieldMappings) && cfg.fieldMappings.length > 0) {
        setFieldMappings(cfg.fieldMappings);
      } else {
        // Smart defaults based on integration key
        if (integration.key === "indiamart") {
          setFieldMappings([
            { sourceKey: "SENDER_NAME", targetField: "name", fallback: "IndiaMART Buyer" },
            { sourceKey: "SENDER_MOBILE", targetField: "phone", fallback: "" },
            { sourceKey: "SENDER_EMAIL", targetField: "email", fallback: "" },
            { sourceKey: "SENDER_CITY", targetField: "preferredLocation", fallback: "Delhi NCR" },
            { sourceKey: "QUERY_MESSAGE", targetField: "notes", fallback: "Inbound B2B inquiry" },
          ]);
        } else if (integration.key === "google_ads") {
          setFieldMappings([
            { sourceKey: "FULL_NAME", targetField: "name", fallback: "Google Lead" },
            { sourceKey: "PHONE_NUMBER", targetField: "phone", fallback: "" },
            { sourceKey: "EMAIL", targetField: "email", fallback: "" },
            { sourceKey: "CITY", targetField: "preferredLocation", fallback: "" },
          ]);
        } else {
          setFieldMappings([
            { sourceKey: "name", targetField: "name", fallback: "Online Lead" },
            { sourceKey: "phone", targetField: "phone", fallback: "" },
            { sourceKey: "email", targetField: "email", fallback: "" },
            { sourceKey: "city", targetField: "preferredLocation", fallback: "" },
            { sourceKey: "notes", targetField: "notes", fallback: "Website inquiry" },
          ]);
        }
      }

      // Extract routing
      if (cfg.routing) {
        setRouting({ ...routing, ...cfg.routing });
      }

      setTestResult(null);
      setModalTab("auth");
    }
  }, [integration]);

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
  };

  // Field Mapping CRUD
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

  // Save handler
  const handleSave = () => {
    const fullConfig = {
      ...credentials,
      fieldMappings,
      routing,
    };

    onSave(integration.key, {
      displayName,
      category: integration.category,
      enabled,
      config: fullConfig,
    });
  };

  // Connection Test
  const handleRunTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await testIntegration(integration.key);
      setTestResult(res);
      if (res?.success) {
        toast.success(`Handshake verified for ${integration.displayName}`, {
          description: res.message,
        });
      } else {
        toast.warning(res?.message || "Check provided credentials");
      }
    } catch (err) {
      toast.error(`Connection test failed: ${err.message}`);
      setTestResult({ success: false, message: err.message });
    } finally {
      setTesting(false);
    }
  };

  // Live Simulation
  const handleSimulate = async () => {
    setSimulating(true);
    try {
      const res = await simulateLead(integration.key, samplePayload);
      toast.success("Sample Lead Successfully Ingested!", {
        description: `Lead "${res.name}" (ID: ${res.leadId}) created via ${res.source}. Verified in CRM database.`,
      });
    } catch (err) {
      toast.error(`Simulation failed: ${err.message}`);
    } finally {
      setSimulating(false);
    }
  };

  // Determine Webhook URL for this integration
  const webhookUrl =
    credentials.webhookUrl ||
    (integration.key === "meta_ads"
      ? "http://103.180.110.190/api/webhooks/meta"
      : integration.key === "google_ads"
      ? "http://103.180.110.190/api/webhooks/google-ads"
      : integration.key === "website_webhook"
      ? "http://103.180.110.190/api/webhooks/website"
      : `http://103.180.110.190/api/webhooks/leads/${integration.key}`);

  // ── Render Tailored Bespoke Credentials View ────────────────────────────────
  const renderBespokeCredentials = () => {
    const key = integration.key.toLowerCase();

    if (key === "meta_ads") {
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-semibold text-foreground">Meta App ID</Label>
              <Input
                value={credentials.appId || ""}
                onChange={(e) => handleCredentialChange("appId", e.target.value)}
                placeholder="e.g. 1197546510113741"
                className="h-9 text-xs font-mono bg-card mt-1"
              />
              <span className="text-[10px] text-muted-foreground mt-0.5 block">
                Found in Meta Developer Console under App Settings → Basic
              </span>
            </div>
            <div>
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-foreground">Meta App Secret</Label>
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
                placeholder="••••••••••••••••••••••••"
                className="h-9 text-xs font-mono bg-card mt-1"
              />
              <span className="text-[10px] text-muted-foreground mt-0.5 block">
                Used for HMAC-SHA256 signature verification
              </span>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold text-foreground">
                System User Permanent Access Token
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
              placeholder="EAA..."
              className="h-9 text-xs font-mono bg-card mt-1"
            />
            <span className="text-[10px] text-muted-foreground mt-0.5 block">
              Generate in Meta Business Settings → System Users with `leads_retrieval` permission
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-semibold text-foreground">Facebook Page ID</Label>
              <Input
                value={credentials.pageId || ""}
                onChange={(e) => handleCredentialChange("pageId", e.target.value)}
                placeholder="e.g. 4424288871221076"
                className="h-9 text-xs font-mono bg-card mt-1"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold text-foreground">Page Display Name</Label>
              <Input
                value={credentials.pageName || ""}
                onChange={(e) => handleCredentialChange("pageName", e.target.value)}
                placeholder="e.g. SmoothSales Realty"
                className="h-9 text-xs bg-card mt-1"
              />
            </div>
          </div>
        </div>
      );
    }

    if (key === "meta_capi") {
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-semibold text-foreground">Meta Pixel / Dataset ID</Label>
              <Input
                value={credentials.pixelId || ""}
                onChange={(e) => handleCredentialChange("pixelId", e.target.value)}
                placeholder="e.g. 984120394819203"
                className="h-9 text-xs font-mono bg-card mt-1"
              />
              <span className="text-[10px] text-muted-foreground mt-0.5 block">
                Found in Meta Events Manager under Datasets
              </span>
            </div>
            <div>
              <Label className="text-xs font-semibold text-foreground">Test Event Code (Optional)</Label>
              <Input
                value={credentials.testEventCode || ""}
                onChange={(e) => handleCredentialChange("testEventCode", e.target.value)}
                placeholder="e.g. TEST78912"
                className="h-9 text-xs font-mono bg-card mt-1"
              />
              <span className="text-[10px] text-muted-foreground mt-0.5 block">
                Used to verify server events live inside Meta Events Manager
              </span>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold text-foreground">CAPI Access Token</Label>
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
              placeholder="EAA..."
              className="h-9 text-xs font-mono bg-card mt-1"
            />
          </div>

          <div className="p-3.5 rounded-xl bg-muted/40 border border-border/80 flex items-center justify-between">
            <div>
              <Label className="text-xs font-semibold text-foreground">Automatic SHA-256 PII Hashing</Label>
              <p className="text-[11px] text-muted-foreground">
                Customer email and phone numbers are irreversibly hashed before transmission
              </p>
            </div>
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-xs">
              Enforced
            </Badge>
          </div>
        </div>
      );
    }

    if (key === "google_ads") {
      return (
        <div className="space-y-4">
          <div>
            <Label className="text-xs font-semibold text-foreground">
              Google Ads Webhook Key (Secret)
            </Label>
            <Input
              value={credentials.googleKey || ""}
              onChange={(e) => handleCredentialChange("googleKey", e.target.value)}
              placeholder="e.g. gkey_sec_893041_ss_crm"
              className="h-9 text-xs font-mono bg-card mt-1"
            />
            <span className="text-[10px] text-muted-foreground mt-0.5 block">
              Enter this in Google Ads Lead Form extension configuration under &quot;Google key&quot;
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-semibold text-foreground">Google Ads Customer ID</Label>
              <Input
                value={credentials.customerId || ""}
                onChange={(e) => handleCredentialChange("customerId", e.target.value)}
                placeholder="123-456-7890"
                className="h-9 text-xs font-mono bg-card mt-1"
              />
            </div>
            <div className="flex flex-col justify-end">
              <div className="p-2.5 rounded-lg bg-muted/30 border border-border flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-foreground">GCLID Capture</div>
                  <div className="text-[10px] text-muted-foreground">Auto-link Click ID</div>
                </div>
                <Switch
                  checked={credentials.captureGclid !== false}
                  onCheckedChange={(val) => handleCredentialChange("captureGclid", val)}
                />
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (key === "indiamart") {
      return (
        <div className="space-y-4">
          <div>
            <Label className="text-xs font-semibold text-foreground">GLUSR_CRM_KEY</Label>
            <Input
              value={credentials.glusrCrmKey || ""}
              onChange={(e) => handleCredentialChange("glusrCrmKey", e.target.value)}
              placeholder="e.g. m_crm_key_991823714"
              className="h-9 text-xs font-mono bg-card mt-1"
            />
            <span className="text-[10px] text-muted-foreground mt-0.5 block">
              Generated from IndiaMART Seller Panel under Lead Manager API Settings
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-semibold text-foreground">Seller Mobile Number</Label>
              <Input
                value={credentials.sellerMobile || ""}
                onChange={(e) => handleCredentialChange("sellerMobile", e.target.value)}
                placeholder="+91..."
                className="h-9 text-xs font-mono bg-card mt-1"
              />
            </div>
            <div className="flex flex-col justify-end">
              <div className="p-2.5 rounded-lg bg-muted/30 border border-border flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-foreground">Spam Filter</div>
                  <div className="text-[10px] text-muted-foreground">Ignore bulk promotional RFQs</div>
                </div>
                <Switch
                  checked={credentials.filterSpam !== false}
                  onCheckedChange={(val) => handleCredentialChange("filterSpam", val)}
                />
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (key === "whatsapp") {
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-semibold text-foreground">Phone Number ID</Label>
              <Input
                value={credentials.phoneId || ""}
                onChange={(e) => handleCredentialChange("phoneId", e.target.value)}
                placeholder="e.g. 1197546510113741"
                className="h-9 text-xs font-mono bg-card mt-1"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold text-foreground">WABA ID</Label>
              <Input
                value={credentials.wabaId || ""}
                onChange={(e) => handleCredentialChange("wabaId", e.target.value)}
                placeholder="e.g. 4424288871221076"
                className="h-9 text-xs font-mono bg-card mt-1"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold text-foreground">Permanent Bearer Token</Label>
              <button
                type="button"
                onClick={() => toggleSecret("bearerToken")}
                className="text-[10px] text-primary hover:underline flex items-center gap-1"
              >
                {showSecrets.bearerToken ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                {showSecrets.bearerToken ? "Hide" : "Show"}
              </button>
            </div>
            <Input
              type={showSecrets.bearerToken ? "text" : "password"}
              value={credentials.bearerToken || credentials.accessToken || ""}
              onChange={(e) => handleCredentialChange("bearerToken", e.target.value)}
              placeholder="EAA..."
              className="h-9 text-xs font-mono bg-card mt-1"
            />
          </div>
        </div>
      );
    }

    if (key === "openai") {
      return (
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold text-foreground">OpenAI API Key</Label>
              <button
                type="button"
                onClick={() => toggleSecret("apiKey")}
                className="text-[10px] text-primary hover:underline flex items-center gap-1"
              >
                {showSecrets.apiKey ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                {showSecrets.apiKey ? "Hide" : "Show"}
              </button>
            </div>
            <Input
              type={showSecrets.apiKey ? "text" : "password"}
              value={credentials.apiKey || ""}
              onChange={(e) => handleCredentialChange("apiKey", e.target.value)}
              placeholder="sk-proj-..."
              className="h-9 text-xs font-mono bg-card mt-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-semibold text-foreground">Model Engine</Label>
              <Select
                value={credentials.model || "gpt-4o"}
                onValueChange={(val) => handleCredentialChange("model", val)}
              >
                <SelectTrigger className="h-9 text-xs mt-1 bg-card">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gpt-4o">GPT-4o (High Speed & Intelligence)</SelectItem>
                  <SelectItem value="gpt-4o-mini">GPT-4o Mini (Cost Optimized)</SelectItem>
                  <SelectItem value="o1-mini">o1 Mini (Deep Reasoning)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-semibold text-foreground">Temperature (Creativity)</Label>
              <Input
                type="number"
                step="0.1"
                min="0"
                max="1"
                value={credentials.temperature !== undefined ? credentials.temperature : 0.3}
                onChange={(e) => handleCredentialChange("temperature", Number(e.target.value))}
                className="h-9 text-xs font-mono bg-card mt-1"
              />
            </div>
          </div>
        </div>
      );
    }

    // Default Fallback for other integrations (Clean Form Grid)
    return (
      <div className="space-y-3.5">
        {Object.keys(credentials).map((fieldKey) => {
          const val = credentials[fieldKey];
          if (typeof val === "object" && val !== null) return null;

          const isSecret =
            fieldKey.toLowerCase().includes("secret") ||
            fieldKey.toLowerCase().includes("token") ||
            fieldKey.toLowerCase().includes("key") ||
            fieldKey.toLowerCase().includes("password");

          // Convert camelCase to Human Label (e.g. projectListingId -> Project Listing ID)
          const humanLabel = fieldKey
            .replace(/([A-Z])/g, " $1")
            .replace(/^./, (str) => str.toUpperCase());

          return (
            <div key={fieldKey} className="space-y-1">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-foreground">{humanLabel}</Label>
                {isSecret && (
                  <button
                    type="button"
                    onClick={() => toggleSecret(fieldKey)}
                    className="text-[10px] text-primary hover:underline flex items-center gap-1"
                  >
                    {showSecrets[fieldKey] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                    {showSecrets[fieldKey] ? "Hide" : "Show"}
                  </button>
                )}
              </div>

              <Input
                type={isSecret && !showSecrets[fieldKey] ? "password" : "text"}
                value={val !== undefined && val !== null ? String(val) : ""}
                onChange={(e) => handleCredentialChange(fieldKey, e.target.value)}
                className="h-9 text-xs font-mono bg-card"
              />
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col p-0 overflow-hidden shadow-2xl border-border/80">
        {/* Header */}
        <div className="p-6 border-b border-border bg-gradient-to-r from-muted/30 via-background to-muted/20">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center p-2.5 bg-card border border-border shadow-xs shrink-0">
                {getIntegrationLogo(integration.key, "h-7 w-7")}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <DialogTitle className="text-lg font-bold font-heading text-foreground">
                    {integration.displayName}
                  </DialogTitle>
                  <Badge variant="outline" className="text-[10px] font-mono py-0 text-muted-foreground border-border">
                    {integration.category}
                  </Badge>
                </div>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                  {integration.description}
                </DialogDescription>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground">
                {enabled ? "Active" : "Disabled"}
              </span>
              <Switch checked={enabled} onCheckedChange={setEnabled} />
            </div>
          </div>

          {/* Modal Tab Navigation (Executive Segmented Bar) */}
          <div className="flex space-x-1 mt-6 p-1 rounded-xl bg-muted/60 border border-border/60">
            {[
              { id: "auth", label: "Credentials & Auth", icon: KeyRound },
              { id: "webhook", label: "Webhooks & Security", icon: Webhook },
              { id: "mapping", label: "Column Mapping", icon: SlidersHorizontal },
              { id: "routing", label: "Lead Routing", icon: Workflow },
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
                    "flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all",
                    isActive
                      ? "bg-card text-foreground shadow-xs border border-border/80 font-bold"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Modal Body (Scrollable) */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* ── TAB 1: BESPOKE CREDENTIALS & AUTH ── */}
          {modalTab === "auth" && (
            <div className="space-y-5">
              <div>
                <Label className="text-xs font-semibold text-foreground">Integration Channel Name</Label>
                <Input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="h-9 text-xs mt-1 bg-card"
                />
              </div>

              {renderBespokeCredentials()}

              <div className="p-3.5 rounded-xl bg-blue-500/5 border border-blue-500/20 text-xs text-muted-foreground space-y-1">
                <div className="font-semibold text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4" />
                  Enterprise Credential Security
                </div>
                <p className="text-[11px] leading-relaxed">
                  Credentials are encrypted at rest using AES-256 before storage in MySQL. Secrets are never persisted in client state or transmitted over unencrypted protocols.
                </p>
              </div>
            </div>
          )}

          {/* ── TAB 2: WEBHOOKS & SECURITY ── */}
          {modalTab === "webhook" && (
            <div className="space-y-5">
              <div>
                <Label className="text-xs font-semibold text-foreground">
                  Inbound Webhook Delivery URL
                </Label>
                <p className="text-[11px] text-muted-foreground mb-1.5">
                  Paste this exact endpoint into your provider&apos;s webhook configuration console
                </p>
                <div className="flex items-center gap-2">
                  <Input
                    readOnly
                    value={webhookUrl}
                    className="text-xs font-mono bg-muted/40 h-9"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(webhookUrl, "wh_url")}
                    className="h-9 px-3 shrink-0"
                  >
                    {copiedKey === "wh_url" ? (
                      <Check className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div>
                <Label className="text-xs font-semibold text-foreground">
                  Verification Token / API Secret Key
                </Label>
                <p className="text-[11px] text-muted-foreground mb-1.5">
                  Used by the provider to verify webhook authenticity (e.g. Meta Challenge or X-API-Key)
                </p>
                <div className="flex items-center gap-2">
                  <Input
                    readOnly
                    value={
                      credentials.verifyToken ||
                      credentials.googleKey ||
                      credentials.glusrCrmKey ||
                      credentials.apiKey ||
                      "smoothsales_token_sec_994182"
                    }
                    className="text-xs font-mono bg-muted/40 h-9"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      copyToClipboard(
                        credentials.verifyToken ||
                          credentials.googleKey ||
                          credentials.glusrCrmKey ||
                          credentials.apiKey ||
                          "smoothsales_token_sec_994182",
                        "sec_key"
                      )
                    }
                    className="h-9 px-3 shrink-0"
                  >
                    {copiedKey === "sec_key" ? (
                      <Check className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-muted/30 border border-border/80 space-y-2 text-xs">
                <span className="font-semibold text-foreground">Security & Ingestion Safeguards:</span>
                <div className="text-[11px] text-muted-foreground space-y-1 font-mono">
                  <div>✓ Sub-60s async processing with immediate HTTP 200 acknowledgment</div>
                  <div>✓ HMAC-SHA256 signature verification & payload size protection (1 MB limit)</div>
                  <div>✓ Automatic deduplication by phone number to prevent duplicate CRM entries</div>
                  <div>✓ Full raw event logging in WebhookEventRaw audit ledger</div>
                </div>
              </div>
            </div>
          )}

          {/* ── TAB 3: VISUAL FIELD / COLUMN MAPPING BUILDER ── */}
          {modalTab === "mapping" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-foreground font-heading">
                    Dynamic Field / Column Mapping
                  </h4>
                  <p className="text-[11px] text-muted-foreground">
                    Map keys from the third-party webhook payload to typed SmoothSales CRM customer columns
                  </p>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddMappingRow}
                  className="h-8 text-xs gap-1.5"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Field Mapping
                </Button>
              </div>

              <div className="border border-border rounded-xl overflow-hidden bg-card">
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted/40 border-b border-border text-muted-foreground font-semibold">
                    <tr>
                      <th className="py-2.5 px-3">Inbound Payload Key</th>
                      <th className="py-2.5 px-3 w-8 text-center"></th>
                      <th className="py-2.5 px-3">Target CRM Column</th>
                      <th className="py-2.5 px-3">Default Fallback</th>
                      <th className="py-2.5 px-3 w-10 text-right"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {fieldMappings.map((row, idx) => (
                      <tr key={idx} className="hover:bg-muted/10">
                        <td className="py-2 px-3">
                          <Input
                            value={row.sourceKey}
                            onChange={(e) =>
                              handleUpdateMappingRow(idx, "sourceKey", e.target.value)
                            }
                            placeholder="e.g. SENDER_MOBILE"
                            className="h-8 text-xs font-mono bg-card"
                          />
                        </td>
                        <td className="py-2 px-3 text-center text-muted-foreground">
                          <ArrowRight className="h-3.5 w-3.5 mx-auto" />
                        </td>
                        <td className="py-2 px-3">
                          <Select
                            value={row.targetField}
                            onValueChange={(val) =>
                              handleUpdateMappingRow(idx, "targetField", val)
                            }
                          >
                            <SelectTrigger className="h-8 text-xs bg-card">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {CRM_TARGET_COLUMNS.map((col) => (
                                <SelectItem key={col.value} value={col.value}>
                                  {col.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="py-2 px-3">
                          <Input
                            value={row.fallback || ""}
                            onChange={(e) =>
                              handleUpdateMappingRow(idx, "fallback", e.target.value)
                            }
                            placeholder="Optional default"
                            className="h-8 text-xs bg-card"
                          />
                        </td>
                        <td className="py-2 px-3 text-right">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveMappingRow(idx)}
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── TAB 4: ROUTING & AUTOMATION RULES ── */}
          {modalTab === "routing" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-semibold text-foreground">
                    Lead Distribution Mode
                  </Label>
                  <Select
                    value={routing.assignMode}
                    onValueChange={(val) => setRouting({ ...routing, assignMode: val })}
                  >
                    <SelectTrigger className="h-9 text-xs mt-1 bg-card">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ROUND_ROBIN">Round-Robin Team Pool</SelectItem>
                      <SelectItem value="STICKY_AGENT">Sticky Lead Owner (Previous Rep)</SelectItem>
                      <SelectItem value="UNASSIGNED">Leave in Fresh Leads Pool</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs font-semibold text-foreground">
                    Distribution Pool
                  </Label>
                  <Select
                    value={routing.distributionPool}
                    onValueChange={(val) =>
                      setRouting({ ...routing, distributionPool: val })
                    }
                  >
                    <SelectTrigger className="h-9 text-xs mt-1 bg-card">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Inbound Real Estate Closers">
                        Inbound Real Estate Closers
                      </SelectItem>
                      <SelectItem value="Luxury Villa Specialists">
                        Luxury Villa Specialists
                      </SelectItem>
                      <SelectItem value="B2B Key Accounts">B2B Key Accounts</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-semibold text-foreground">
                    Automatic Lead Tags
                  </Label>
                  <Input
                    value={routing.autoTag}
                    onChange={(e) => setRouting({ ...routing, autoTag: e.target.value })}
                    placeholder="e.g. IndiaMART, High_Ticket"
                    className="h-9 text-xs mt-1 bg-card"
                  />
                </div>

                <div>
                  <Label className="text-xs font-semibold text-foreground">
                    Initial Lead Priority
                  </Label>
                  <Select
                    value={routing.priority}
                    onValueChange={(val) => setRouting({ ...routing, priority: val })}
                  >
                    <SelectTrigger className="h-9 text-xs mt-1 bg-card">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="URGENT">Urgent (Immediate Outreach)</SelectItem>
                      <SelectItem value="HIGH">High (Within 15 mins)</SelectItem>
                      <SelectItem value="MEDIUM">Medium (Standard)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-border bg-muted/30 flex items-center justify-between">
                <div>
                  <Label className="text-xs font-semibold text-foreground">
                    Sub-60s WhatsApp Welcome Template
                  </Label>
                  <p className="text-[11px] text-muted-foreground">
                    Automatically send an official WhatsApp welcome template upon lead ingestion
                  </p>
                </div>
                <Switch
                  checked={routing.triggerWhatsAppWelcome}
                  onCheckedChange={(checked) =>
                    setRouting({ ...routing, triggerWhatsAppWelcome: checked })
                  }
                />
              </div>
            </div>
          )}

          {/* ── TAB 5: TEST & SIMULATE ── */}
          {modalTab === "test" && (
            <div className="space-y-5">
              {/* Connection Test */}
              <div className="p-4 rounded-xl border border-border bg-card space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-foreground font-heading">
                      API Connectivity & Handshake Test
                    </h4>
                    <p className="text-[11px] text-muted-foreground">
                      Verify that SmoothSales backend can communicate with {integration.displayName}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleRunTest}
                    disabled={testing}
                    className="text-xs h-8 gap-1.5"
                  >
                    {testing ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Zap className="h-3.5 w-3.5 text-amber-500" />
                    )}
                    Verify Handshake
                  </Button>
                </div>

                {testResult && (
                  <div
                    className={cn(
                      "p-3 rounded-lg text-xs font-mono space-y-1",
                      testResult.success
                        ? "bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30"
                        : "bg-rose-500/10 text-rose-800 dark:text-rose-300 border border-rose-500/30"
                    )}
                  >
                    <div className="font-bold flex items-center gap-1.5">
                      {testResult.success ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                      ) : (
                        <AlertCircle className="h-3.5 w-3.5 text-rose-600" />
                      )}
                      Status: {testResult.success ? "CONNECTION_OK" : "CONNECTION_FAILED"}
                    </div>
                    <div className="text-[11px]">{testResult.message}</div>
                  </div>
                )}
              </div>

              {/* Sample Payload Simulator */}
              <div className="p-4 rounded-xl border border-emerald-300 dark:border-emerald-800/80 bg-card space-y-3">
                <div>
                  <h4 className="text-xs font-bold text-foreground font-heading">
                    Simulate Inbound Lead Ingestion
                  </h4>
                  <p className="text-[11px] text-muted-foreground">
                    Fire a live simulated payload through this integration pipeline into CRM database
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-[11px] text-muted-foreground">Prospect Name</Label>
                    <Input
                      value={samplePayload.name}
                      onChange={(e) =>
                        setSamplePayload({ ...samplePayload, name: e.target.value })
                      }
                      className="h-8 text-xs bg-card mt-0.5"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px] text-muted-foreground">Prospect Phone</Label>
                    <Input
                      value={samplePayload.phone}
                      onChange={(e) =>
                        setSamplePayload({ ...samplePayload, phone: e.target.value })
                      }
                      className="h-8 text-xs bg-card mt-0.5 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-[11px] text-muted-foreground">Prospect Email</Label>
                    <Input
                      value={samplePayload.email}
                      onChange={(e) =>
                        setSamplePayload({ ...samplePayload, email: e.target.value })
                      }
                      className="h-8 text-xs bg-card mt-0.5 font-mono"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px] text-muted-foreground">Location</Label>
                    <Input
                      value={samplePayload.city}
                      onChange={(e) =>
                        setSamplePayload({ ...samplePayload, city: e.target.value })
                      }
                      className="h-8 text-xs bg-card mt-0.5"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-[11px] text-muted-foreground">Requirement / Notes</Label>
                  <Input
                    value={samplePayload.notes}
                    onChange={(e) =>
                      setSamplePayload({ ...samplePayload, notes: e.target.value })
                    }
                    className="h-8 text-xs bg-card mt-0.5"
                  />
                </div>

                <Button
                  type="button"
                  size="sm"
                  onClick={handleSimulate}
                  disabled={simulating}
                  className="w-full h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-1.5 shadow-xs"
                >
                  {simulating ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Send className="h-3 w-3" />
                  )}
                  Ingest Test Lead into CRM
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="p-4 border-t border-border bg-muted/20 flex items-center justify-between sm:justify-between">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleRunTest}
            disabled={testing}
            className="text-xs h-9 gap-1.5"
          >
            {testing ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Zap className="h-3.5 w-3.5 text-amber-500" />
            )}
            Quick Test
          </Button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-xs h-9"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSave}
              disabled={saving}
              className="text-xs h-9 gap-1.5 font-semibold"
            >
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Save All Changes
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
