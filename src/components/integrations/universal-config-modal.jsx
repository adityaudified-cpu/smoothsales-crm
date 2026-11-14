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
  Loader2,
  RefreshCw,
  Send,
  Sparkles,
  Lock,
  Code2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { testIntegration, simulateLead, rotateWebhookKey } from "@/lib/api/integrations";
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
  const [modalTab, setModalTab] = useState("auth"); // 'auth' | 'webhook' | 'mapping' | 'test'
  const [showSecrets, setShowSecrets] = useState({});
  const [copiedKey, setCopiedKey] = useState(null);

  // Form State
  const [enabled, setEnabled] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [credentials, setCredentials] = useState({});
  const [fieldMappings, setFieldMappings] = useState([]);
  const [activeWebhookUrl, setActiveWebhookUrl] = useState("");
  const [activeWebhookKey, setActiveWebhookKey] = useState("");

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

  // Determine if this integration uses webhooks
  const isWebhookIntegration =
    integration?.kind === "LEAD_WEBHOOK" ||
    integration?.webhookUrlMasked ||
    ["google_ads", "indiamart", "justdial", "99acres", "magicbricks", "housing", "website", "google_forms", "jotform"].includes(integration?.key);

  // Sync state when integration prop changes
  useEffect(() => {
    if (integration) {
      setEnabled(integration.enabled || false);
      setDisplayName(integration.displayName || integration.name || integration.key);
      const cfg = integration.config || {};

      // Extract credentials
      const creds = { ...cfg };
      delete creds.fieldMappings;
      delete creds.routing;
      setCredentials(creds);

      // Webhook URLs
      setActiveWebhookUrl(integration.webhookUrlMasked || "");
      setActiveWebhookKey("");

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
            { sourceKey: "SENDER_CITY", targetField: "preferredLocation", fallback: "" },
            { sourceKey: "QUERY_MESSAGE", targetField: "notes", fallback: "" },
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
            { sourceKey: "name", targetField: "name", fallback: "Inbound Lead" },
            { sourceKey: "phone", targetField: "phone", fallback: "" },
            { sourceKey: "email", targetField: "email", fallback: "" },
            { sourceKey: "city", targetField: "preferredLocation", fallback: "" },
            { sourceKey: "notes", targetField: "notes", fallback: "" },
          ]);
        }
      }

      setTestResult(null);
      setSimulatedLead(null);
      setSimulationPayload({
        name: "",
        phone: "",
        email: "",
        city: "",
        notes: "",
      });

      // Default tab: if it's webhook-only, open webhook; otherwise auth
      if (integration.kind === "LEAD_WEBHOOK" && !integration.fields?.length) {
        setModalTab("webhook");
      } else {
        setModalTab("auth");
      }
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

  // Rotate Webhook Key
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
      const data = res?.data || res;
      setTestResult(data);
      if (data?.success) {
        toast.success(`Handshake verified for ${integration.name || integration.displayName}`, {
          description: data.message,
        });
      } else {
        toast.warning(data?.message || "Check provided credentials");
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
    if (!simulationPayload.phone && !simulationPayload.email) {
      return toast.error("Please enter at least a phone number or email for simulation");
    }
    setSimulating(true);
    setSimulatedLead(null);
    try {
      const res = await simulateLead(integration.key, simulationPayload);
      const data = res?.data || res;
      setSimulatedLead(data);
      toast.success("Test Lead Ingested Successfully!", {
        description: `Lead created with ID: ${data?.leadId}. Visible immediately in Leads pipeline.`,
      });
    } catch (err) {
      toast.error(`Simulation failed: ${err.message}`);
    } finally {
      setSimulating(false);
    }
  };

  // Render Credentials Form
  const renderCredentials = () => {
    const key = integration.key.toLowerCase();
    const secretHints = integration.secretHints || {};

    if (key === "meta_ads") {
      return (
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold text-foreground">
                System User Permanent Access Token <span className="text-rose-500">*</span>
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
              placeholder={secretHints.accessToken ? `Configured (${secretHints.accessToken}) — enter new to replace` : "EAAB..."}
              className="h-9 text-xs font-mono bg-card mt-1"
            />
            <span className="text-[10px] text-muted-foreground mt-0.5 block">
              Generate in Meta Business Suite → Settings → System Users with <code className="font-mono text-foreground font-semibold">leads_retrieval</code> permission.
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-semibold text-foreground">Business ID (Optional)</Label>
              <Input
                value={credentials.businessId || ""}
                onChange={(e) => handleCredentialChange("businessId", e.target.value)}
                placeholder="Enter Business ID"
                className="h-9 text-xs font-mono bg-card mt-1"
              />
              <span className="text-[10px] text-muted-foreground mt-0.5 block">
                Found in Meta Business Info
              </span>
            </div>
            <div>
              <Label className="text-xs font-semibold text-foreground">Page ID (Optional)</Label>
              <Input
                value={credentials.pageId || ""}
                onChange={(e) => handleCredentialChange("pageId", e.target.value)}
                placeholder="Enter Page ID"
                className="h-9 text-xs font-mono bg-card mt-1"
              />
              <span className="text-[10px] text-muted-foreground mt-0.5 block">
                Filter leads by Facebook Page
              </span>
            </div>
          </div>
        </div>
      );
    }

    if (key === "indiamart") {
      return (
        <div className="space-y-4">
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
              placeholder={secretHints.glusrCrmKey ? `Configured (${secretHints.glusrCrmKey}) — enter new to replace` : "Enter GLUSR_CRM_KEY"}
              className="h-9 text-xs font-mono bg-card mt-1"
            />
            <span className="text-[10px] text-muted-foreground mt-0.5 block">
              Generate from IndiaMART Seller Panel under Lead Manager API Settings.
            </span>
          </div>

          <div>
            <Label className="text-xs font-semibold text-foreground">Registered Seller Mobile</Label>
            <Input
              value={credentials.sellerMobile || ""}
              onChange={(e) => handleCredentialChange("sellerMobile", e.target.value)}
              placeholder="Enter 10-digit mobile number"
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
              <Label className="text-xs font-semibold text-foreground">
                OpenAI API Key <span className="text-rose-500">*</span>
              </Label>
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
              placeholder={secretHints.apiKey ? `Configured (${secretHints.apiKey}) — enter new to replace` : "sk-..."}
              className="h-9 text-xs font-mono bg-card mt-1"
            />
            <span className="text-[10px] text-muted-foreground mt-0.5 block">
              Starts with <code className="font-mono text-foreground font-semibold">sk-</code> from platform.openai.com.
            </span>
          </div>

          <div>
            <Label className="text-xs font-semibold text-foreground">AI Model</Label>
            <Select
              value={credentials.model || "gpt-4o-mini"}
              onValueChange={(val) => handleCredentialChange("model", val)}
            >
              <SelectTrigger className="h-9 text-xs bg-card mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gpt-4o-mini">GPT-4o Mini (Fast &amp; Cost-Effective)</SelectItem>
                <SelectItem value="gpt-4o">GPT-4o (High Accuracy Qualification)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      );
    }

    if (key === "exotel") {
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-semibold text-foreground">Account SID</Label>
              <Input
                value={credentials.accountSid || ""}
                onChange={(e) => handleCredentialChange("accountSid", e.target.value)}
                placeholder="Enter Account SID"
                className="h-9 text-xs font-mono bg-card mt-1"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold text-foreground">Caller ID (ExoPhone)</Label>
              <Input
                value={credentials.callerId || ""}
                onChange={(e) => handleCredentialChange("callerId", e.target.value)}
                placeholder="Enter Caller ID (+91...)"
                className="h-9 text-xs font-mono bg-card mt-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-semibold text-foreground">API Key</Label>
              <Input
                value={credentials.apiKey || ""}
                onChange={(e) => handleCredentialChange("apiKey", e.target.value)}
                placeholder="Enter API Key"
                className="h-9 text-xs font-mono bg-card mt-1"
              />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-foreground">API Token</Label>
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
                placeholder={secretHints.apiToken ? `Configured (${secretHints.apiToken}) — enter new to replace` : "Enter API token"}
                className="h-9 text-xs font-mono bg-card mt-1"
              />
            </div>
          </div>
        </div>
      );
    }

    // Default view for Webhook-first integrations
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

    // Generic fallback for any other integration
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[88vh] flex flex-col p-0 overflow-hidden shadow-2xl border-border/80">
        {/* Header */}
        <div className="p-5 border-b border-border bg-card">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center p-2 bg-muted/40 border border-border/80 shrink-0">
                {getIntegrationLogo(integration.key, "h-6 w-6")}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <DialogTitle className="text-base font-bold font-heading text-foreground truncate">
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

            <div className="flex items-center gap-2.5 shrink-0">
              <span className={cn("text-xs font-semibold", enabled ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground")}>
                {enabled ? "Active" : "Disabled"}
              </span>
              <Switch checked={enabled} onCheckedChange={setEnabled} />
            </div>
          </div>

          {/* Segmented Navigation Bar */}
          <div className="flex space-x-1 mt-4 p-1 rounded-xl bg-muted/50 border border-border/60">
            {[
              { id: "auth", label: "Credentials & Auth", icon: KeyRound },
              ...(isWebhookIntegration ? [{ id: "webhook", label: "Webhook & Security", icon: Webhook }] : []),
              { id: "mapping", label: "Column Mapping", icon: SlidersHorizontal },
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
        <div className="p-6 overflow-y-auto space-y-5 flex-1 bg-background/50">
          {/* ── TAB 1: CREDENTIALS & AUTH ── */}
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

              {renderCredentials()}

              {/* Handshake test button inside auth tab */}
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

          {/* ── TAB 2: WEBHOOK & SECURITY ── */}
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
                    {copiedKey === "webhook_url" ? (
                      <Check className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                {activeWebhookKey && (
                  <div className="mt-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300 space-y-1">
                    <p className="font-semibold flex items-center gap-1">
                      <Lock className="h-3.5 w-3.5" /> New Plaintext Key Generated:
                    </p>
                    <p className="font-mono text-[11px] select-all break-all">{activeWebhookKey}</p>
                    <p className="text-[10px] text-amber-700/80">Copy this URL now. For security, secret keys are never displayed in full again.</p>
                  </div>
                )}
              </div>

              {/* cURL Snippet */}
              <div className="p-4 rounded-xl border border-border bg-card space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Code2 className="h-3.5 w-3.5 text-primary" /> cURL Test Snippet
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      copyToClipboard(
                        `curl -X POST "${activeWebhookUrl || "https://your-crm/api/webhooks/..."}" \\\n  -H "Content-Type: application/json" \\\n  -d '{"name": "Test Prospect", "phone": "+919876543210", "notes": "Inbound inquiry"}'`,
                        "curl_code"
                      )
                    }
                    className="text-[11px] text-primary hover:underline flex items-center gap-1"
                  >
                    {copiedKey === "curl_code" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    Copy cURL
                  </button>
                </div>
                <pre className="text-[11px] font-mono bg-muted/50 p-2.5 rounded-lg overflow-x-auto text-muted-foreground select-all">
{`curl -X POST "${activeWebhookUrl || "https://your-crm/api/webhooks/..."}" \\
  -H "Content-Type: application/json" \\
  -d '{"name": "Test Prospect", "phone": "+919876543210", "notes": "Inbound inquiry"}'`}
                </pre>
              </div>

              <div className="p-3.5 rounded-xl bg-blue-500/5 border border-blue-500/20 text-xs text-muted-foreground space-y-1">
                <div className="font-semibold text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4" /> Multi-Tenant Security &amp; Dedup
                </div>
                <p className="text-[11px] leading-relaxed">
                  Every webhook URL contains a cryptographic 32-byte workspace key. Inbound leads are parsed, cleaned to E.164 phone format, and deduplicated per workspace with zero cross-tenant contamination.
                </p>
              </div>
            </div>
          )}

          {/* ── TAB 3: COLUMN MAPPING ── */}
          {modalTab === "mapping" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-foreground">Inbound Column Mapper</h4>
                  <p className="text-[11px] text-muted-foreground">
                    Map incoming webhook JSON keys directly to your CRM prospect fields.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddMappingRow}
                  className="text-xs h-8 gap-1"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Mapping
                </Button>
              </div>

              <div className="space-y-2">
                {fieldMappings.map((row, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2 rounded-xl bg-card border border-border">
                    <div className="flex-1">
                      <Input
                        placeholder="Inbound Key (e.g. phone)"
                        value={row.sourceKey}
                        onChange={(e) => handleUpdateMappingRow(idx, "sourceKey", e.target.value)}
                        className="h-8 text-xs font-mono"
                      />
                    </div>
                    <span className="text-xs text-muted-foreground font-bold">→</span>
                    <div className="flex-1">
                      <Select
                        value={row.targetField}
                        onValueChange={(val) => handleUpdateMappingRow(idx, "targetField", val)}
                      >
                        <SelectTrigger className="h-8 text-xs">
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
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveMappingRow(idx)}
                      className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── TAB 4: TEST & SIMULATE ── */}
          {modalTab === "test" && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-border bg-card space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Zap className="h-3.5 w-3.5 text-amber-500" /> Simulate Real Inbound Lead
                  </h4>
                  <Badge variant="outline" className="text-[10px]">
                    Creates Real Lead Record
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Send a sample payload through the full ingestion pipeline to test your field mapping, deduplication, and lead attribution.
                </p>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <Label className="text-[11px] text-muted-foreground">Prospect Name</Label>
                    <Input
                      value={simulationPayload.name}
                      onChange={(e) => setSimulationPayload({ ...simulationPayload, name: e.target.value })}
                      placeholder="e.g. Rohan Sharma"
                      className="h-8 text-xs bg-muted/30 mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px] text-muted-foreground">Prospect Phone (Required)</Label>
                    <Input
                      value={simulationPayload.phone}
                      onChange={(e) => setSimulationPayload({ ...simulationPayload, phone: e.target.value })}
                      placeholder="+91 98765 43210"
                      className="h-8 text-xs font-mono bg-muted/30 mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-[11px] text-muted-foreground">Prospect Email</Label>
                    <Input
                      value={simulationPayload.email}
                      onChange={(e) => setSimulationPayload({ ...simulationPayload, email: e.target.value })}
                      placeholder="rohan@example.com"
                      className="h-8 text-xs bg-muted/30 mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px] text-muted-foreground">City / Location</Label>
                    <Input
                      value={simulationPayload.city}
                      onChange={(e) => setSimulationPayload({ ...simulationPayload, city: e.target.value })}
                      placeholder="e.g. Mumbai"
                      className="h-8 text-xs bg-muted/30 mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-[11px] text-muted-foreground">Notes / Requirement</Label>
                  <Input
                    value={simulationPayload.notes}
                    onChange={(e) => setSimulationPayload({ ...simulationPayload, notes: e.target.value })}
                    placeholder="e.g. Inbound inquiry from test simulation"
                    className="h-8 text-xs bg-muted/30 mt-1"
                  />
                </div>

                <Button
                  type="button"
                  size="sm"
                  onClick={handleSimulate}
                  disabled={simulating}
                  className="w-full text-xs h-8 gap-1.5 font-semibold bg-primary text-primary-foreground"
                >
                  {simulating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                  Trigger Inbound Lead Ingestion
                </Button>

                {simulatedLead && (
                  <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-800 dark:text-emerald-300 space-y-1">
                    <p className="font-semibold flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Ingestion Successful!
                    </p>
                    <p className="font-mono text-[11px]">
                      Lead ID: {simulatedLead.leadId} · Source: {simulatedLead.source} · Name: {simulatedLead.name}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="p-4 border-t border-border bg-card flex items-center justify-between sm:justify-between">
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
            className="text-xs h-9 gap-1.5 font-semibold bg-primary text-primary-foreground shadow-xs"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
            Save Configuration
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
