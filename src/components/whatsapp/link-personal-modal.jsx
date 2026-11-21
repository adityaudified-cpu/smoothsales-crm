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
  QrCode,
  KeyRound,
  Terminal,
  Loader2,
  RefreshCw,
  Copy,
  CheckCircle2,
  AlertCircle,
  Clock,
  ExternalLink,
  Zap,
} from "lucide-react";
import { waBridgeApi } from "@/lib/api/whatsapp";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const pairingPhoneSchema = z.object({
  phone: z
    .string()
    .trim()
    .regex(
      /^\+[1-9]\d{9,14}$/,
      "Enter a valid WhatsApp phone number starting with + and country code (e.g. +91 98201 55432)"
    ),
});

export function LinkPersonalModal({
  open,
  onOpenChange,
  bridgeStatus,
  onBridgeStatusRefresh,
}) {
  const [activeTab, setActiveTab] = useState("qr_scan"); // "qr_scan" | "pairing_code" | "architecture"
  const [bridgeQr, setBridgeQr] = useState(null);
  const [loadingQr, setLoadingQr] = useState(false);
  const [pairingCode, setPairingCode] = useState("");
  const [codeCountdown, setCodeCountdown] = useState(0);
  const [generatingCode, setGeneratingCode] = useState(false);

  const form = useForm({
    resolver: zodResolver(pairingPhoneSchema),
    defaultValues: {
      phone: "",
    },
    mode: "onChange",
  });

  // Fetch live QR code when modal opens on qr_scan tab
  const fetchQr = useCallback(async () => {
    if (bridgeStatus.connected) return;
    setLoadingQr(true);
    try {
      const res = await waBridgeApi.getQr();
      if (res?.success && res?.data?.qr) {
        setBridgeQr(res.data.qr);
      }
    } catch {
    } finally {
      setLoadingQr(false);
    }
  }, [bridgeStatus.connected]);

  useEffect(() => {
    if (!open || activeTab !== "qr_scan" || bridgeStatus.connected) return;
    fetchQr();
    const interval = setInterval(fetchQr, 6000);
    return () => clearInterval(interval);
  }, [open, activeTab, bridgeStatus.connected, fetchQr]);

  // Countdown timer for pairing code
  useEffect(() => {
    if (!open || activeTab !== "pairing_code" || !pairingCode || codeCountdown <= 0) return;
    const timer = setInterval(() => {
      setCodeCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [open, activeTab, pairingCode, codeCountdown]);

  // Handle pairing code request with react-hook-form
  const handleGeneratePairingCode = async (values) => {
    setGeneratingCode(true);
    try {
      const cleanPhone = values.phone.trim();
      const res = await waBridgeApi.requestPairingCode(cleanPhone);
      if (res?.success && res?.code) {
        setPairingCode(res.code);
        setCodeCountdown(120);
        toast.success(`8-digit pairing code: ${res.code}. Check phone notification.`);
      } else {
        toast.error(res?.message || "Failed to generate pairing code. Please retry.");
      }
    } catch (e) {
      toast.error(e?.message || "Error generating pairing code from bridge.");
    } finally {
      setGeneratingCode(false);
    }
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] p-0 overflow-hidden rounded-2xl border-border bg-card shadow-xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent p-6 border-b border-border/80">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/30 shadow-xs">
              <Smartphone className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
                Link Personal WhatsApp
                <Badge variant="outline" className="text-[10px] font-mono border-emerald-500/30 text-emerald-600">
                  Phone Multi-Device
                </Badge>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Connect a sales rep&apos;s physical phone or WhatsApp Web multi-device session for 1-on-1 customer chat logging.
              </DialogDescription>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="px-6 pt-3 pb-0 border-b border-border bg-muted/20">
          <div className="flex items-center gap-2">
            {[
              { id: "qr_scan", label: "Scan QR Code", icon: QrCode },
              { id: "pairing_code", label: "8-Digit Pairing Code", icon: KeyRound },
              { id: "architecture", label: "Architecture Guide", icon: Terminal },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold border-b-2 transition-all",
                    isActive
                      ? "border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-card rounded-t-lg shadow-2xs"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* ── TAB 1: SCAN QR CODE ── */}
          {activeTab === "qr_scan" && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-muted/30 border border-border/80">
                <p className="text-xs font-semibold text-foreground mb-1.5">How to scan with your phone:</p>
                <ol className="list-decimal pl-4 space-y-1 text-[11px] text-muted-foreground">
                  <li>Open <strong>WhatsApp</strong> on your mobile phone</li>
                  <li>
                    Tap <strong>Settings</strong> (iPhone) or <strong>Three dots ⋮</strong> (Android)
                  </li>
                  <li>
                    Tap <strong>Linked Devices</strong> &rarr; <strong>Link a Device</strong>
                  </li>
                  <li>Point your camera at this QR code to log in</li>
                </ol>
              </div>

              <div className="flex flex-col items-center justify-center p-6 bg-muted/20 rounded-2xl border border-border min-h-[280px]">
                {bridgeQr ? (
                  <div className="flex flex-col items-center space-y-3">
                    <div className="p-3.5 bg-white rounded-2xl shadow-md border border-border/80 inline-block">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={bridgeQr}
                        alt="WhatsApp Web QR Code"
                        className="w-56 h-56 object-contain rounded-lg"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                        <RefreshCw className="h-3 w-3 animate-spin text-emerald-600" />
                        Live QR stream refreshes automatically
                      </p>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={fetchQr}
                        className="h-6 text-[11px] px-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/10"
                      >
                        Refresh Now
                      </Button>
                    </div>
                  </div>
                ) : loadingQr ? (
                  <div className="flex flex-col items-center gap-2.5 py-10 text-muted-foreground">
                    <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                    <p className="text-xs font-medium">Generating WhatsApp Web QR stream...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3 py-10 text-center max-w-xs">
                    <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground">
                      <Smartphone className="h-5 w-5" />
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      QR stream not currently active or device is already linked. Click below to request a fresh QR code.
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={fetchQr}
                      className="h-8 text-xs gap-1.5 rounded-xl border-border"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      Request New QR
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── TAB 2: 8-DIGIT PAIRING CODE ── */}
          {activeTab === "pairing_code" && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-900 dark:text-blue-300">
                <p className="text-xs font-semibold flex items-center gap-1.5 mb-1">
                  <KeyRound className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                  Pair without Scanning (8-Digit Code)
                </p>
                <p className="text-[11px] text-blue-800 dark:text-blue-300/80 leading-relaxed">
                  Enter your phone number below to generate an 8-digit alphanumeric pairing code. Then open WhatsApp &rarr;
                  Linked Devices &rarr; <strong>Link with phone number instead</strong>.
                </p>
              </div>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleGeneratePairingCode)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold text-foreground">
                          Your WhatsApp Phone Number <span className="text-destructive">*</span>
                        </FormLabel>
                        <div className="flex items-center gap-2">
                          <FormControl>
                            <Input
                              placeholder="+91 96805 52526"
                              className="h-10 text-xs font-mono rounded-xl border-border bg-background flex-1 focus-visible:ring-emerald-500"
                              {...field}
                            />
                          </FormControl>
                          <Button
                            type="submit"
                            disabled={generatingCode}
                            className="h-10 px-4 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs shrink-0 gap-1.5"
                          >
                            {generatingCode ? (
                              <>
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                Generating...
                              </>
                            ) : (
                              <>
                                <Zap className="h-3.5 w-3.5" />
                                Generate Code
                              </>
                            )}
                          </Button>
                        </div>
                        <FormDescription className="text-[11px] text-muted-foreground">
                          Format with international country code (e.g. +91 98201 55432 or +1 415 555 2671).
                        </FormDescription>
                        <FormMessage className="text-[11px]" />
                      </FormItem>
                    )}
                  />
                </form>
              </Form>

              {pairingCode && (
                <div className="p-5 rounded-2xl bg-card border-2 border-emerald-500/30 text-center space-y-3 shadow-xs">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Enter this code on your mobile phone:
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    <span className="font-mono text-2xl font-black tracking-widest text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-4 py-2 rounded-xl border border-emerald-500/20">
                      {pairingCode.length === 8
                        ? `${pairingCode.slice(0, 4)} - ${pairingCode.slice(4)}`
                        : pairingCode}
                    </span>
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-10 w-10 rounded-xl"
                      onClick={() => copyToClipboard(pairingCode, "Pairing code")}
                      title="Copy Pairing Code"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="h-3.5 w-3.5 text-amber-500" />
                    <span>
                      Expires in: <strong className="text-foreground">{codeCountdown}s</strong>
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── TAB 3: ARCHITECTURE GUIDE ── */}
          {activeTab === "architecture" && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-muted/40 border border-border/80 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Terminal className="h-3.5 w-3.5 text-emerald-600" />
                    Hybrid WhatsApp Architecture
                  </h4>
                  <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                    Live In Production
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  SmoothSales CRM uses a <strong>Hybrid Architecture</strong>: Channel 1 runs via official{" "}
                  <strong>Meta Cloud API v19.0</strong> for high-volume verified broadcast campaigns. Channel 2 runs
                  via <strong>Baileys Web Bridge</strong> on port 5050 for sales reps&apos; 1-on-1 chats and timeline logging.
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-bold text-foreground">Active Server Endpoints:</p>
                <div className="rounded-xl border border-border bg-card overflow-hidden divide-y divide-border text-xs font-mono">
                  {[
                    { method: "GET", path: "/api/wa-bridge/status", desc: "Socket connectivity state" },
                    { method: "GET", path: "/api/wa-bridge/qr", desc: "Live Base64 QR code image" },
                    { method: "POST", path: "/api/wa-bridge/pair", desc: "Request 8-digit mobile pairing code" },
                    { method: "POST", path: "/api/wa-bridge/send", desc: "Send 1-on-1 socket message" },
                    { method: "POST", path: "/api/wa-bridge/logout", desc: "Disconnect session & wipe keys" },
                  ].map((ep) => (
                    <div key={ep.path} className="flex items-center justify-between px-3.5 py-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "px-1.5 py-0.5 rounded text-[10px] font-bold",
                            ep.method === "GET"
                              ? "bg-blue-500/10 text-blue-600"
                              : "bg-emerald-500/10 text-emerald-600"
                          )}
                        >
                          {ep.method}
                        </span>
                        <span className="text-foreground">{ep.path}</span>
                      </div>
                      <span className="text-[11px] text-muted-foreground font-sans">{ep.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="px-6 py-3.5 border-t border-border bg-muted/20 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span
              className={cn(
                "h-2 w-2 rounded-full",
                bridgeStatus.connected ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
              )}
            />
            <span>
              {bridgeStatus.connected
                ? `Connected: +${bridgeStatus.phone || ""}`
                : "Waiting for device pairing..."}
            </span>
          </div>
          <Button
            type="button"
            variant="outline"
            className="h-8 px-4 text-xs font-medium rounded-xl"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
