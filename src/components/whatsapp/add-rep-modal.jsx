"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Smartphone,
  KeyRound,
  QrCode,
  Radio,
  UserCheck,
  Check,
  Loader2,
  Copy,
  Clock,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { waBridgeApi } from "@/lib/api/whatsapp";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const addRepSchema = z.object({
  repLabel: z
    .string()
    .trim()
    .min(2, "Rep label or role must be at least 2 characters (e.g. Rahul Sharma - Sales Lead)")
    .max(60, "Label cannot exceed 60 characters"),
  phone: z
    .string()
    .trim()
    .regex(
      /^\+?[1-9]\d{9,14}$/,
      "Must be a valid phone number with country code (e.g. +919876543210 or 919876543210)"
    ),
  agentName: z
    .string()
    .trim()
    .min(2, "Assigned agent / team member name is required")
    .max(50, "Agent name cannot exceed 50 characters"),
});

export function AddRepModal({ open, onOpenChange, onAddAccount }) {
  const [method, setMethod] = useState("pair_code"); // "pair_code" | "qr_scan" | "sim_logger"
  const [submitting, setSubmitting] = useState(false);
  const [generatedCode, setGeneratedCode] = useState("");
  const [codeCountdown, setCodeCountdown] = useState(0);

  // QR Scan State
  const [qrDataUrl, setQrDataUrl] = useState(null);
  const [loadingQr, setLoadingQr] = useState(false);
  const [isQrConnected, setIsQrConnected] = useState(false);

  const form = useForm({
    resolver: zodResolver(addRepSchema),
    defaultValues: {
      repLabel: "",
      phone: "",
      agentName: "",
    },
    mode: "onChange",
  });

  // Fetch Live QR Code from Baileys Bridge
  const fetchLiveQr = useCallback(async () => {
    setLoadingQr(true);
    try {
      const res = await waBridgeApi.getQr();
      if (res?.success && res?.data?.qr) {
        setQrDataUrl(res.data.qr);
        if (res.data.connected) {
          setIsQrConnected(true);
        }
      }
    } catch {
    } finally {
      setLoadingQr(false);
    }
  }, []);

  // Poll QR code when QR tab is active and modal is open
  useEffect(() => {
    if (!open || method !== "qr_scan") return;
    fetchLiveQr();
    const interval = setInterval(fetchLiveQr, 5000);
    return () => clearInterval(interval);
  }, [open, method, fetchLiveQr]);

  // Pairing code countdown
  useEffect(() => {
    if (!open || method !== "pair_code" || !generatedCode || codeCountdown <= 0) return;
    const timer = setInterval(() => {
      setCodeCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [open, method, generatedCode, codeCountdown]);

  const handleSubmit = async (values) => {
    setSubmitting(true);
    try {
      const cleanPhone = values.phone.replace(/[^0-9]/g, "");

      if (method === "pair_code") {
        // Request pairing code from Baileys bridge
        const bridgeRes = await waBridgeApi.requestPairingCode(cleanPhone);
        if (bridgeRes?.success && bridgeRes?.code) {
          setGeneratedCode(bridgeRes.code);
          setCodeCountdown(120);
          toast.success("Pairing code generated! Enter it in WhatsApp on your mobile phone.");
        } else {
          toast.error(bridgeRes?.message || "Could not generate pairing code.");
        }
      }

      // Register the rep account in the CRM workspace
      if (onAddAccount) {
        await onAddAccount({
          id: `rep_${Date.now()}`,
          type: "personal",
          label: values.repLabel.trim(),
          number: values.phone.startsWith("+") ? values.phone.trim() : `+${cleanPhone}`,
          phone: values.phone.startsWith("+") ? values.phone.trim() : `+${cleanPhone}`,
          agentName: values.agentName.trim(),
          device: method === "sim_logger" ? "Physical SIM Logger" : "WhatsApp Web Multi-Device",
          method: method === "pair_code" ? "8-Digit Pairing Code" : method === "qr_scan" ? "QR Code Scan" : "SIM Logger",
          connectedAt: new Date().toISOString().slice(0, 10),
        });
      }

      toast.success(`Sales Rep ${values.agentName} registered for WhatsApp sync!`);
      if (method !== "pair_code") {
        onOpenChange(false);
        form.reset();
      }
    } catch (err) {
      toast.error(err?.message || "Failed to register sales rep account.");
    } finally {
      setSubmitting(false);
    }
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden rounded-2xl border-border bg-card shadow-xl">
        <div className="bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent p-5 border-b border-border/80">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/30 shrink-0">
              <Smartphone className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-foreground">
                Add Sales Rep WhatsApp Account
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Link an individual sales agent&apos;s phone session for 1-on-1 CRM timeline logging.
              </DialogDescription>
            </div>
          </div>
        </div>

        {/* Method Switcher Tabs */}
        <div className="px-5 pt-3 pb-0 bg-muted/20 border-b border-border">
          <div className="grid grid-cols-3 gap-1 bg-muted/60 p-1 rounded-xl">
            {[
              { id: "pair_code", label: "8-Digit Code", icon: KeyRound },
              { id: "qr_scan", label: "Scan QR Code", icon: QrCode },
              { id: "sim_logger", label: "SIM Logger", icon: Radio },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = method === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setMethod(tab.id);
                    setGeneratedCode("");
                  }}
                  className={cn(
                    "flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-lg transition-all",
                    isActive
                      ? "bg-card text-foreground shadow-2xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className="h-3 w-3" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* CONTENT AREA */}
        {method === "qr_scan" ? (
          /* ── METHOD 2: SCAN QR CODE VIEW ── */
          <div className="p-5 space-y-4">
            <div className="rounded-xl border border-border/70 bg-muted/20 p-3.5 space-y-1.5 text-xs">
              <div className="font-semibold text-foreground flex items-center gap-1.5">
                <QrCode className="h-3.5 w-3.5 text-emerald-600" />
                How to link with WhatsApp Web QR Code:
              </div>
              <ol className="list-decimal list-inside text-muted-foreground space-y-1 text-[11px] leading-relaxed">
                <li>Open WhatsApp on the sales rep&apos;s mobile phone</li>
                <li>Tap <strong>Settings</strong> (iOS) or <strong>Three dots &rarr; Linked Devices</strong> (Android)</li>
                <li>Tap <strong>Link a Device</strong> and point camera at the QR code below</li>
              </ol>
            </div>

            {/* QR Image Container */}
            <div className="flex flex-col items-center justify-center p-4 bg-muted/30 border border-border rounded-xl min-h-[220px]">
              {loadingQr && !qrDataUrl ? (
                <div className="flex flex-col items-center gap-2 text-muted-foreground py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                  <span className="text-xs font-medium">Generating real-time QR code...</span>
                </div>
              ) : qrDataUrl ? (
                <div className="relative group p-2 bg-white rounded-xl shadow-xs border border-border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={qrDataUrl}
                    alt="WhatsApp QR Code"
                    className="w-48 h-48 object-contain"
                  />
                  <div className="text-center mt-2">
                    <span className="text-[10px] text-muted-foreground font-mono">
                      Real-time Baileys Bridge QR · Auto-refreshes
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground text-xs space-y-2">
                  <p>QR code stream temporarily unavailable.</p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs rounded-lg gap-1.5"
                    onClick={fetchLiveQr}
                  >
                    <RefreshCw className="h-3.5 w-3.5" /> Retry Fetch QR
                  </Button>
                </div>
              )}
            </div>

            {/* Optional Agent Metadata to register when scanned */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-[11px] font-semibold text-foreground block mb-1">
                  Agent Name
                </label>
                <Input
                  placeholder="e.g. Priya Sharma"
                  className="h-8 text-xs rounded-lg border-border"
                  onChange={(e) => form.setValue("agentName", e.target.value)}
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-foreground block mb-1">
                  Rep Label / Department
                </label>
                <Input
                  placeholder="e.g. Inbound Sales"
                  className="h-8 text-xs rounded-lg border-border"
                  onChange={(e) => form.setValue("repLabel", e.target.value)}
                />
              </div>
            </div>

            <div className="pt-2 border-t border-border flex items-center justify-between">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 text-xs rounded-lg gap-1.5"
                onClick={fetchLiveQr}
                disabled={loadingQr}
              >
                <RefreshCw className={cn("h-3 w-3", loadingQr && "animate-spin")} />
                Refresh QR
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 text-xs rounded-lg"
                onClick={() => onOpenChange(false)}
              >
                Close
              </Button>
            </div>
          </div>
        ) : (
          /* ── METHOD 1 & 3: FORM VIEW (8-DIGIT PAIRING CODE OR SIM LOGGER) ── */
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="p-5 space-y-3.5">
              <FormField
                control={form.control}
                name="repLabel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold text-foreground">
                      Rep Label / Department <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. Rahul Sharma (Senior Executive)"
                        className="h-9 text-xs rounded-lg border-border bg-background focus-visible:ring-emerald-500"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-[10px]" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold text-foreground">
                      WhatsApp Number (with Country Code) <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. +919876543210 or 919876543210"
                        className="h-9 text-xs font-mono rounded-lg border-border bg-background focus-visible:ring-emerald-500"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription className="text-[10.5px] text-muted-foreground">
                      Format with international country code (e.g. +91 98201 55432)
                    </FormDescription>
                    <FormMessage className="text-[10px]" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="agentName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold text-foreground">
                      Assigned Agent Name <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. Rahul Sharma"
                        className="h-9 text-xs rounded-lg border-border bg-background focus-visible:ring-emerald-500"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-[10px]" />
                  </FormItem>
                )}
              />

              {/* Pairing Code Display Box */}
              {generatedCode && (
                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-2">
                  <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                    Enter this 8-digit code in WhatsApp on your phone:
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    <span className="font-mono text-xl font-bold tracking-widest text-emerald-700 dark:text-emerald-400 bg-card px-4 py-1.5 rounded-lg border border-emerald-500/20 shadow-2xs">
                      {generatedCode.length === 8
                        ? `${generatedCode.slice(0, 4)} - ${generatedCode.slice(4)}`
                        : generatedCode}
                    </span>
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      className="h-8 w-8 rounded-lg"
                      onClick={() => copyToClipboard(generatedCode, "Pairing code")}
                      title="Copy code"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-center gap-1.5 text-[10.5px] text-muted-foreground">
                    <Clock className="h-3 w-3 text-amber-500" />
                    <span>Expires in {codeCountdown}s · WhatsApp &rarr; Linked Devices &rarr; Link with phone number instead</span>
                  </div>
                </div>
              )}

              <DialogFooter className="pt-3 border-t border-border flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="h-8 px-3 text-xs font-medium rounded-lg"
                  onClick={() => onOpenChange(false)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="h-8 px-4 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-2xs gap-1.5"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Processing...
                    </>
                  ) : method === "pair_code" ? (
                    <>
                      <KeyRound className="h-3.5 w-3.5" />
                      Generate Pairing Code
                    </>
                  ) : (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      Register Rep Account
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
