"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  ShieldCheck,
  Lock,
  CheckCircle2,
  Phone,
  User,
  FileText,
  RotateCcw,
  Sparkles,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

export function LogLeadWithOtpDialog({ open, onOpenChange, onLeadLogged }) {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Form State
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("+91 ");
  const [requirementNotes, setRequirementNotes] = useState("");

  // 4-box OTP State
  const [otp, setOtp] = useState(["", "", "", ""]);
  const inputRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];

  const handleModalClose = (val) => {
    if (!val) {
      setStep(1);
      setIsLoading(false);
      setOtp(["", "", "", ""]);
    }
    onOpenChange(val);
  };

  // Handle Send OTP (Step 1 -> Step 2)
  const handleSendOtp = (e) => {
    e.preventDefault();
    if (!clientName.trim() || clientPhone.length < 10) {
      toast.error("Please provide client name and a valid 10-digit mobile number.");
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setStep(2);
      toast.info(`4-digit security code dispatched to ${clientPhone}`);
      // Focus first OTP box
      setTimeout(() => inputRefs[0]?.current?.focus(), 100);
    }, 600);
  };

  // Handle OTP inputs with auto-advancing focus
  const handleOtpChange = (index, value) => {
    // Only accept numeric digit
    const cleaned = value.replace(/\D/g, "");
    if (!cleaned && value !== "") return;

    const char = cleaned.slice(-1); // last entered char
    const newOtp = [...otp];
    newOtp[index] = char;
    setOtp(newOtp);

    // Auto advance if digit entered and not last box
    if (char && index < 3) {
      inputRefs[index + 1]?.current?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    // On Backspace, if current is empty, focus previous box
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs[index - 1]?.current?.focus();
    }
  };

  const isOtpComplete = otp.every((d) => d.length === 1);

  // Handle Verify & Lock Lead (Step 2 -> Step 3)
  const handleVerifyOtp = () => {
    if (!isOtpComplete) return;

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setStep(3);
      toast.success("Lead verified & locked to your partner account!");
    }, 600);
  };

  const handleDone = () => {
    if (onLeadLogged) {
      onLeadLogged({
        id: `flead_${Date.now()}`,
        name: clientName,
        phone: clientPhone,
        propertyInterest: requirementNotes || "Commercial / Luxury Residential",
        status: "Attribution Locked",
        dealValue: "₹2.20 Cr",
        expectedCommission: "₹22,000",
        lastActivity: "Just now",
        attributedPartnerName: "Rajesh Sharma (Partner)",
        attributionLockedUntil: "30 days",
      });
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleModalClose}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        {/* Step 1: Input Client Information */}
        {step === 1 && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <DialogHeader>
              <div className="flex items-center gap-2 text-primary text-xs font-semibold uppercase tracking-wider mb-1">
                <ShieldCheck className="h-4 w-4" />
                <span>Fraud-Proof Lead Attribution</span>
              </div>
              <DialogTitle className="font-heading font-extrabold text-lg text-foreground">
                Log New Lead with Client OTP
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
                SmoothSales dispatches a one-time passcode to the client&apos;s phone. This eliminates fake meeting logs, prevents proxy sales, and locks 100% of your commission rights.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 pt-2">
              <div className="space-y-1.5">
                <Label htmlFor="cName" className="text-xs font-semibold">
                  Client Full Name
                </Label>
                <div className="relative">
                  <User className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="cName"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="e.g. Vikramaditya Singhania"
                    required
                    className="pl-9 h-9 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cPhone" className="text-xs font-semibold">
                  Client Mobile Number (OTP recipient)
                </Label>
                <div className="relative">
                  <Phone className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="cPhone"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    placeholder="+91 98200 12345"
                    required
                    className="pl-9 h-9 text-xs font-mono"
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  The client must give you this code to establish tamper-proof attribution.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cNotes" className="text-xs font-semibold">
                  Requirement Notes & Project Scope
                </Label>
                <Textarea
                  id="cNotes"
                  value={requirementNotes}
                  onChange={(e) => setRequirementNotes(e.target.value)}
                  placeholder="e.g. Looking for 3 BHK high-rise in Malabar Hill or modern turnkey interior architecture."
                  rows={2}
                  className="text-xs"
                />
              </div>
            </div>

            <DialogFooter className="pt-2 gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="h-8 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="h-8 text-xs gap-1.5 bg-primary text-primary-foreground font-semibold"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Dispatching OTP...</span>
                  </>
                ) : (
                  <>
                    <span>Send OTP to Client</span>
                    <Lock className="h-3.5 w-3.5" />
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        )}

        {/* Step 2: 4-Box OTP Entry with Auto-Advance */}
        {step === 2 && (
          <div className="space-y-4">
            <DialogHeader>
              <div className="flex items-center gap-2 text-primary text-xs font-semibold uppercase tracking-wider mb-1">
                <Lock className="h-4 w-4" />
                <span>Verification in Progress</span>
              </div>
              <DialogTitle className="font-heading font-extrabold text-lg text-foreground">
                Enter Client Verification Code
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
                We&apos;ve sent a 4-digit code to <strong className="text-foreground">{clientPhone}</strong>. Ask the client for the code to lock lead attribution.
              </DialogDescription>
            </DialogHeader>

            <div className="py-4 space-y-4">
              {/* 4 Single-Character Boxes */}
              <div className="flex items-center justify-center gap-3">
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={inputRefs[idx]}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    className="h-12 w-12 text-center text-xl font-bold font-mono rounded-lg border-2 border-border bg-background focus:border-primary focus:outline-none transition-all shadow-xs"
                  />
                ))}
              </div>

              {/* Fraud prevention trust notice */}
              <div className="p-2.5 rounded bg-muted/40 border border-border flex items-start gap-2 text-[11px] text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  Anti-fraud guarantee: Submitting this OTP guarantees you are exclusively tagged for all commissions on this client for the next 30 days.
                </span>
              </div>

              {/* Resend Link */}
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setOtp(["", "", "", ""]);
                    toast.info("A new OTP has been sent to client.");
                    inputRefs[0]?.current?.focus();
                  }}
                  className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors"
                >
                  <RotateCcw className="h-3 w-3" />
                  <span>Didn&apos;t receive code? Resend OTP</span>
                </button>
              </div>
            </div>

            <DialogFooter className="pt-2 gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => setStep(1)}
                className="h-8 text-xs"
              >
                Back
              </Button>
              <Button
                onClick={handleVerifyOtp}
                disabled={!isOtpComplete || isLoading}
                className="h-8 text-xs gap-1.5 bg-primary text-primary-foreground font-semibold"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <Lock className="h-3.5 w-3.5" />
                    <span>Verify &amp; Lock Lead</span>
                  </>
                )}
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* Step 3: Success State */}
        {step === 3 && (
          <div className="py-6 text-center space-y-4">
            <div className="mx-auto h-14 w-14 rounded-full bg-emerald-500/15 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-8 w-8" />
            </div>

            <div className="space-y-1">
              <h3 className="font-heading font-extrabold text-lg text-foreground">
                Lead Successfully Verified!
              </h3>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                Lead locked to your account for 30 days
              </p>
              <p className="text-xs text-muted-foreground pt-1 max-w-xs mx-auto">
                <strong className="text-foreground">{clientName}</strong> ({clientPhone}) has been authenticated. Any site visit or deal conversion will automatically route full commission to you.
              </p>
            </div>

            <div className="pt-3">
              <Button
                onClick={handleDone}
                className="h-9 px-6 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
              >
                Done
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
