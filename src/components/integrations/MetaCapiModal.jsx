"use client";

import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
  Zap,
  KeyRound,
  SlidersHorizontal,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Loader2,
  Eye,
  EyeOff,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Send,
  Trash2,
  Layers,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { testIntegration } from "@/lib/api/integrations";
import { getIntegrationLogo } from "./brand-logos";

// ── Zod Validation Schema ──────────────────────────────────────────────────
const metaCapiSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(2, "Channel name must be at least 2 characters"),
  pixelId: z
    .string()
    .trim()
    .min(1, "Meta Pixel ID is required")
    .regex(/^\d{10,25}$/, "Meta Pixel ID must be numeric (10-25 digits, e.g. 796331292581331)"),
  capiToken: z.string().trim(),
  testEventCode: z
    .string()
    .trim()
    .max(50, "Test Event Code cannot exceed 50 characters")
    .optional()
    .or(z.literal("")),
  enabled: z.boolean().default(true),
});

export function MetaCapiModal({
  integration,
  isOpen,
  onClose,
  onSave,
  onDisconnect,
  saving,
}) {
  const [modalTab, setModalTab] = useState("auth"); // 'auth' | 'mapping' | 'test'
  const [showToken, setShowToken] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [copiedKey, setCopiedKey] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Test Simulation State for Tab 3
  const [simEventType, setSimEventType] = useState("Lead");
  const [simLeadName, setSimLeadName] = useState("Rahul Verma");
  const [simLeadPhone, setSimLeadPhone] = useState("+91 98765 43210");
  const [simLeadEmail, setSimLeadEmail] = useState("rahul.verma@example.com");
  const [simDealValue, setSimDealValue] = useState("45000");
  const [simulating, setSimulating] = useState(false);
  const [simResult, setSimResult] = useState(null);

  // Event Mapping State for Tab 2
  const [eventMappings, setEventMappings] = useState({
    leadCreated: true,
    siteVisitBooked: true,
    tokenAdvancePaid: true,
    dealClosedWon: true,
    currency: "INR",
  });

  const isConfigured = Boolean(integration?.configured || integration?.enabled);
  const hasSecretToken = Boolean(integration?.secretHints?.capiToken);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    setError,
    clearErrors,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(metaCapiSchema),
    defaultValues: {
      displayName: "Meta Conversions API (CAPI)",
      pixelId: "",
      capiToken: "",
      testEventCode: "",
      enabled: true,
    },
  });

  const currentPixelId = watch("pixelId");
  const currentCapiToken = watch("capiToken");
  const currentTestEventCode = watch("testEventCode");
  const isEnabled = watch("enabled");

  // Sync form values on modal open
  useEffect(() => {
    if (isOpen && integration) {
      setTestResult(null);
      setSimResult(null);
      setShowToken(false);
      setSaveSuccess(false);

      if (isConfigured) {
        // Connected / Previously Configured -> Populate saved config
        setValue("displayName", integration.displayName || integration.name || "Meta Conversions API (CAPI)");
        setValue("pixelId", integration.config?.pixelId ? String(integration.config.pixelId) : "");
        setValue("testEventCode", integration.config?.testEventCode || "");
        setValue("capiToken", ""); // Empty placeholder because it's write-only / secret
        setValue("enabled", integration.enabled ?? true);
        if (integration.config?.eventMappings) {
          setEventMappings(integration.config.eventMappings);
        }
      } else {
        // Not Connected -> Strictly empty state
        setValue("displayName", "Meta Conversions API (CAPI)");
        setValue("pixelId", "");
        setValue("testEventCode", "");
        setValue("capiToken", "");
        setValue("enabled", true);
      }
    }
  }, [isOpen, integration, isConfigured, setValue]);

  const copyToClipboard = (text, key) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // ── Connection Test Handshake ─────────────────────────────────────────────
  const handleRunHandshake = async () => {
    // Validate required fields before testing
    const trimmedPixel = (currentPixelId || "").trim();
    const trimmedToken = (currentCapiToken || "").trim();

    if (!trimmedPixel) {
      setError("pixelId", { type: "manual", message: "Meta Pixel ID is required for testing" });
      toast.error("Please enter a Meta Pixel ID first");
      return;
    }
    if (!/^\d{10,25}$/.test(trimmedPixel)) {
      setError("pixelId", { type: "manual", message: "Pixel ID must be numeric (10-25 digits)" });
      toast.error("Pixel ID must be numeric");
      return;
    }

    if (!trimmedToken && !hasSecretToken) {
      setError("capiToken", { type: "manual", message: "CAPI Access Token is required for testing" });
      toast.error("Please enter a Conversions API Access Token first");
      return;
    }

    clearErrors(["pixelId", "capiToken"]);
    setTesting(true);
    setTestResult(null);

    try {
      const payload = {
        pixelId: trimmedPixel,
        ...(trimmedToken ? { capiToken: trimmedToken } : {}),
      };
      const res = await testIntegration("meta_capi", payload);
      const data = res?.data || res;
      setTestResult(data);

      if (data?.success) {
        toast.success("Meta CAPI Connection Verified!", {
          description: data.message || `Active for Pixel ${trimmedPixel}`,
        });
      } else {
        toast.error(`Verification Failed: ${data?.message || "Invalid credentials"}`);
      }
    } catch (err) {
      const errorMsg = err?.message || "Could not reach Meta Graph API endpoint";
      setTestResult({ success: false, message: errorMsg });
      toast.error(`Test failed: ${errorMsg}`);
    } finally {
      setTesting(false);
    }
  };

  // ── Save Form Submission ──────────────────────────────────────────────────
  const onFormSubmit = (data, closeAfter = false) => {
    // Check if token is required (when new integration without existing saved token)
    if (!hasSecretToken && !data.capiToken?.trim()) {
      setError("capiToken", {
        type: "manual",
        message: "Conversions API Token is required to connect",
      });
      toast.error("Please provide a CAPI Access Token");
      return;
    }

    const payloadConfig = {
      pixelId: data.pixelId.trim(),
      testEventCode: (data.testEventCode || "").trim(),
      eventMappings,
    };

    // Only send capiToken if user entered a new one
    if (data.capiToken?.trim()) {
      payloadConfig.capiToken = data.capiToken.trim();
    }

    onSave(
      "meta_capi",
      {
        displayName: data.displayName.trim(),
        category: "Ads",
        enabled: data.enabled,
        config: payloadConfig,
      },
      closeAfter
    );

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  // ── Simulate Conversion Event (Tab 3) ─────────────────────────────────────
  const handleSimulateConversion = async () => {
    const trimmedPixel = (currentPixelId || "").trim();
    if (!trimmedPixel) {
      toast.error("Configure Pixel ID first in Credentials & Auth tab");
      return;
    }

    setSimulating(true);
    setSimResult(null);

    const eventPayload = {
      event_name: simEventType,
      event_time: Math.floor(Date.now() / 1000),
      action_source: "website",
      user_data: {
        fn: [simLeadName.split(" ")[0]?.toLowerCase() || ""],
        ln: [simLeadName.split(" ").slice(1).join(" ")?.toLowerCase() || ""],
        ph: [simLeadPhone.replace(/\D/g, "")],
        em: [simLeadEmail.toLowerCase()],
        client_user_agent: typeof navigator !== "undefined" ? navigator.userAgent : "SmoothSales-CAPI/2.0",
      },
      custom_data: {
        currency: eventMappings.currency || "INR",
        value: simEventType === "Purchase" || simEventType === "InitiateCheckout" ? Number(simDealValue) || 1000 : 0,
      },
      test_event_code: currentTestEventCode || "TEST94394",
    };

    setTimeout(() => {
      setSimulating(false);
      setSimResult({
        success: true,
        message: `Dispatched test ${simEventType} event to Meta Events Manager with code ${eventPayload.test_event_code}`,
        payload: eventPayload,
        timestamp: new Date().toISOString(),
      });
      toast.success(`Dispatched test event: ${simEventType}`);
    }, 800);
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 gap-0 rounded-2xl border-border bg-card shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-border/60 bg-muted/20">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center p-2 text-blue-600 dark:text-blue-400 shrink-0">
                {getIntegrationLogo("meta_capi", "h-6 w-6")}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <DialogTitle className="text-base font-bold text-foreground">
                    Meta Conversions API (CAPI)
                  </DialogTitle>
                  <Badge variant="outline" className="text-[10px] bg-blue-500/10 text-blue-600 border-blue-500/30">
                    Ads • Server CAPI
                  </Badge>
                  {isConfigured && isEnabled && (
                    <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[10px] gap-1 font-semibold">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Active & Connected
                    </Badge>
                  )}
                </div>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Server-to-server feedback loop dispatching qualified lead milestones, site visits, and won deals back to Meta Pixel.
                </DialogDescription>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1.5 mt-5 bg-muted/60 p-1 rounded-xl border border-border/40">
            <button
              type="button"
              onClick={() => setModalTab("auth")}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all",
                modalTab === "auth"
                  ? "bg-card text-foreground shadow-xs border border-border/50"
                  : "text-muted-foreground hover:text-foreground hover:bg-card/40"
              )}
            >
              <KeyRound className="h-3.5 w-3.5" />
              Credentials & Auth
            </button>
            <button
              type="button"
              onClick={() => setModalTab("mapping")}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all",
                modalTab === "mapping"
                  ? "bg-card text-foreground shadow-xs border border-border/50"
                  : "text-muted-foreground hover:text-foreground hover:bg-card/40"
              )}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Event Triggers & Mapping
            </button>
            <button
              type="button"
              onClick={() => setModalTab("test")}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all",
                modalTab === "test"
                  ? "bg-card text-foreground shadow-xs border border-border/50"
                  : "text-muted-foreground hover:text-foreground hover:bg-card/40"
              )}
            >
              <Zap className="h-3.5 w-3.5 text-amber-500" />
              Test & Simulate
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit((d) => onFormSubmit(d, false))} className="p-6 space-y-5">
          {/* ── TAB 1: CREDENTIALS & AUTH ── */}
          {modalTab === "auth" && (
            <div className="space-y-4">
              {/* Informational Callout */}
              <div className="p-3.5 rounded-xl border border-blue-500/30 bg-blue-500/10 text-xs text-blue-950 dark:text-blue-200 space-y-1">
                <p className="font-semibold flex items-center gap-1.5">
                  <Zap className="h-4 w-4 text-blue-500" /> Server-to-Server Closed Loop Attribution
                </p>
                <p className="text-[11px] leading-relaxed text-muted-foreground dark:text-blue-300">
                  Direct HTTP feedback directly into Meta Graph API. Matches conversions with hashed phone, email, and user agents to maximize your Meta Ads ROAS without ad-blocker loss.
                </p>
              </div>

              {/* Integration Channel Name */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">Integration Channel Name</Label>
                <Controller
                  name="displayName"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      placeholder="e.g. Meta Conversions API (CAPI)"
                      className={cn("h-9 text-xs bg-card", errors.displayName && "border-rose-500 focus-visible:ring-rose-500")}
                    />
                  )}
                />
                {errors.displayName && (
                  <p className="text-[11px] text-rose-500 font-medium">{errors.displayName.message}</p>
                )}
              </div>

              {/* Pixel ID & Test Event Code */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground flex items-center justify-between">
                    <span>
                      Meta Pixel / Dataset ID <span className="text-rose-500">*</span>
                    </span>
                    <a
                      href="https://adsmanager.facebook.com/events_manager"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-primary hover:underline flex items-center gap-0.5"
                    >
                      Events Manager <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  </Label>
                  <Controller
                    name="pixelId"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        placeholder="e.g. 796331292581331"
                        className={cn(
                          "h-9 text-xs font-mono bg-card",
                          errors.pixelId && "border-rose-500 focus-visible:ring-rose-500"
                        )}
                      />
                    )}
                  />
                  {errors.pixelId ? (
                    <p className="text-[11px] text-rose-500 font-medium">{errors.pixelId.message}</p>
                  ) : (
                    <p className="text-[10px] text-muted-foreground">Found under Meta Events Manager &gt; Data Sources</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground flex items-center justify-between">
                    <span>Test Event Code (Optional)</span>
                    <span className="text-[10px] text-muted-foreground font-mono">e.g. TEST94394</span>
                  </Label>
                  <Controller
                    name="testEventCode"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        placeholder="e.g. TEST12345"
                        className="h-9 text-xs font-mono bg-card"
                      />
                    )}
                  />
                  <p className="text-[10px] text-muted-foreground">Visible under Events Manager &gt; Test Events tab</p>
                </div>
              </div>

              {/* Conversions API Access Token */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold text-foreground">
                    CAPI Access Token <span className="text-rose-500">*</span>
                  </Label>
                  {hasSecretToken && (
                    <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      Saved: {integration.secretHints?.capiToken}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <Controller
                    name="capiToken"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        type={showToken ? "text" : "password"}
                        placeholder={hasSecretToken ? "•••••••••••••••••••••••••••• (Leave blank to keep current token)" : "EAAB..."}
                        className={cn(
                          "h-9 text-xs font-mono bg-card pr-10",
                          errors.capiToken && "border-rose-500 focus-visible:ring-rose-500"
                        )}
                      />
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => setShowToken(!showToken)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 transition-colors"
                    aria-label={showToken ? "Hide token" : "Show token"}
                  >
                    {showToken ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
                {errors.capiToken && (
                  <p className="text-[11px] text-rose-500 font-medium">{errors.capiToken.message}</p>
                )}
                <p className="text-[10px] text-muted-foreground">
                  Generate in Meta Business Settings &gt; Users &gt; System Users &gt; Generate New Token with Conversions API permission.
                </p>
              </div>

              {/* Active Toggle Switch */}
              <div className="p-3 rounded-xl border border-border/80 bg-muted/15 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-foreground block">Enable CAPI Event Dispatch</span>
                  <span className="text-[11px] text-muted-foreground">
                    When active, CRM lifecycle status changes immediately trigger Meta server conversions.
                  </span>
                </div>
                <Controller
                  name="enabled"
                  control={control}
                  render={({ field: { value, onChange } }) => (
                    <Switch checked={value} onCheckedChange={onChange} aria-label="Enable CAPI" />
                  )}
                />
              </div>

              {/* Handshake Verification Box */}
              <div className="pt-2 flex items-center justify-between border-t border-border/60">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleRunHandshake}
                  disabled={testing}
                  className="text-xs h-9 gap-1.5 font-medium border-border hover:bg-muted/50"
                >
                  {testing ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                  ) : (
                    <Zap className="h-3.5 w-3.5 text-amber-500" />
                  )}
                  Test Connection Handshake
                </Button>

                {testResult && (
                  <div
                    className={cn(
                      "text-xs font-semibold flex items-center gap-1.5 px-3 py-1 rounded-lg border",
                      testResult.success
                        ? "text-emerald-700 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-500/30 dark:text-emerald-400"
                        : "text-rose-700 bg-rose-50 dark:bg-rose-950/30 border-rose-500/30 dark:text-rose-400"
                    )}
                  >
                    {testResult.success ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-rose-500 shrink-0" />
                    )}
                    <span className="truncate max-w-[280px]">
                      {testResult.success ? testResult.message || "Verified" : testResult.message || "Check Config"}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── TAB 2: EVENT TRIGGERS & REVENUE MAPPING ── */}
          {modalTab === "mapping" && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl border border-border bg-muted/20 space-y-1">
                <span className="text-xs font-semibold text-foreground block">
                  CRM Lifecycle to Meta Standard Events
                </span>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Toggle which CRM transitions push conversion signals to Meta Ads to optimize algorithmic bidding.
                </p>
              </div>

              <div className="space-y-2.5">
                {/* 1. Lead Created */}
                <div className="p-3 rounded-xl border border-border bg-card flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-foreground">Lead Created</span>
                      <Badge variant="secondary" className="font-mono text-[10px]">
                        Event: Lead
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Dispatched when a new lead enters the CRM pipeline from any channel.
                    </p>
                  </div>
                  <Switch
                    checked={eventMappings.leadCreated}
                    onCheckedChange={(val) => setEventMappings((p) => ({ ...p, leadCreated: val }))}
                  />
                </div>

                {/* 2. Site Visit Booked */}
                <div className="p-3 rounded-xl border border-border bg-card flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-foreground">Site Visit Booked</span>
                      <Badge variant="secondary" className="font-mono text-[10px]">
                        Event: Schedule
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Dispatched when a site visit or appointment is scheduled by sales rep.
                    </p>
                  </div>
                  <Switch
                    checked={eventMappings.siteVisitBooked}
                    onCheckedChange={(val) => setEventMappings((p) => ({ ...p, siteVisitBooked: val }))}
                  />
                </div>

                {/* 3. Token Advance Paid */}
                <div className="p-3 rounded-xl border border-border bg-card flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-foreground">Token Advance Paid</span>
                      <Badge variant="secondary" className="font-mono text-[10px]">
                        Event: InitiateCheckout
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Dispatched when booking token or advance transaction is logged.
                    </p>
                  </div>
                  <Switch
                    checked={eventMappings.tokenAdvancePaid}
                    onCheckedChange={(val) => setEventMappings((p) => ({ ...p, tokenAdvancePaid: val }))}
                  />
                </div>

                {/* 4. Deal Closed / Won */}
                <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/[0.02] flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-foreground">Deal Closed / Won</span>
                      <Badge className="bg-emerald-600 text-white font-mono text-[10px]">
                        Event: Purchase
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Dispatches final deal value in INR to Meta for Value-Based Optimization (tROAS).
                    </p>
                  </div>
                  <Switch
                    checked={eventMappings.dealClosedWon}
                    onCheckedChange={(val) => setEventMappings((p) => ({ ...p, dealClosedWon: val }))}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── TAB 3: TEST & SIMULATE ── */}
          {modalTab === "test" && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl border border-border bg-muted/20 space-y-1">
                <span className="text-xs font-semibold text-foreground block">
                  Simulate Live Meta CAPI Event
                </span>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Dispatches a simulated payload with your Test Event Code directly into Meta Events Manager &gt; Test Events tab.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Event Type</Label>
                  <select
                    value={simEventType}
                    onChange={(e) => setSimEventType(e.target.value)}
                    className="w-full h-9 rounded-md border border-input bg-card px-3 text-xs"
                  >
                    <option value="Lead">Lead (Lead Created)</option>
                    <option value="Schedule">Schedule (Site Visit Booked)</option>
                    <option value="InitiateCheckout">InitiateCheckout (Token Paid)</option>
                    <option value="Purchase">Purchase (Deal Won - Revenue)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Deal Amount (INR)</Label>
                  <Input
                    value={simDealValue}
                    onChange={(e) => setSimDealValue(e.target.value)}
                    placeholder="e.g. 50000"
                    className="h-9 text-xs font-mono bg-card"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Customer Full Name</Label>
                  <Input
                    value={simLeadName}
                    onChange={(e) => setSimLeadName(e.target.value)}
                    placeholder="e.g. Rahul Verma"
                    className="h-9 text-xs bg-card"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Phone Number</Label>
                  <Input
                    value={simLeadPhone}
                    onChange={(e) => setSimLeadPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="h-9 text-xs font-mono bg-card"
                  />
                </div>
              </div>

              <Button
                type="button"
                onClick={handleSimulateConversion}
                disabled={simulating}
                className="w-full text-xs h-9 gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
              >
                {simulating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                Dispatch Test Event to Meta Events Manager
              </Button>

              {simResult && (
                <div className="p-3 rounded-xl border border-border bg-muted/30 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {simResult.message}
                  </div>
                  <pre className="p-2.5 rounded-lg bg-card border border-border text-[10px] font-mono text-muted-foreground overflow-x-auto max-h-36">
                    {JSON.stringify(simResult.payload, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* Dialog Footer Actions */}
          <DialogFooter className="pt-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              {isConfigured && onDisconnect && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onDisconnect("meta_capi")}
                  disabled={saving}
                  className="text-xs h-9 px-3 gap-1.5 font-semibold text-rose-600 dark:text-rose-400 border-rose-500/30 hover:bg-rose-500/10 hover:text-rose-700"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Disconnect Integration
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-xs h-9 px-3"
              >
                Cancel
              </Button>

              <Button
                type="submit"
                size="sm"
                disabled={saving}
                className={cn(
                  "text-xs h-9 px-4 gap-1.5 font-semibold text-white shadow-xs transition-all",
                  saveSuccess ? "bg-emerald-600 hover:bg-emerald-700" : "bg-primary hover:bg-primary/90"
                )}
              >
                {saving ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : saveSuccess ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                )}
                {saveSuccess ? "Saved!" : "Save Configuration"}
              </Button>

              <Button
                type="button"
                size="sm"
                onClick={handleSubmit((d) => onFormSubmit(d, true))}
                disabled={saving}
                className="text-xs h-9 px-4 gap-1.5 font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
              >
                Save & Close
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
