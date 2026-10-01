"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthSplitLayout } from "@/components/auth/auth-split-layout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/auth-context";
import { toast } from "sonner";
import { ShieldCheck, ArrowLeft, RefreshCw, KeyRound, CheckCircle2 } from "lucide-react";

export default function VerifyOtpPage() {
  const router = useRouter();
  const { pendingOtpUser, verifyOtp, resendOtp } = useAuth();

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [timer, setTimer] = useState(45);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRefs = useRef([]);

  const userEmail = pendingOtpUser?.email || "aarav.sharma@smoothsales.ai";
  const userRole = pendingOtpUser?.role || "Sales User";
  const canResend = timer === 0;

  // Countdown timer for OTP resend
  useEffect(() => {
    if (timer <= 0) return;
    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timer]);

  // Handle individual digit input
  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return; // Digits only

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1); // Take last character
    setOtp(newOtp);

    // Auto-advance to next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle backspace navigation
  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Handle paste full OTP
  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").trim();
    if (/^\d{6}$/.test(pastedData)) {
      const digits = pastedData.split("");
      setOtp(digits);
      inputRefs.current[5]?.focus();
      toast.success("Verification code pasted!");
    }
  };

  const handleQuickFill = () => {
    const demoDigits = ["1", "2", "3", "4", "5", "6"];
    setOtp(demoDigits);
    inputRefs.current[5]?.focus();
    toast.info("Demo OTP 123456 filled!");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const otpString = otp.join("");
    if (otpString.length !== 6) {
      toast.error("Please enter the complete 6-digit code.");
      return;
    }

    setIsSubmitting(true);
    try {
      await verifyOtp(otpString);
      toast.success("Identity verified successfully!", {
        description: `Logged in as ${pendingOtpUser?.name || "User"} (${userRole})`,
      });
      router.push("/dashboard");
    } catch (err) {
      toast.error(err.message || "Invalid OTP code. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    await resendOtp();
    setTimer(45);
    setCanResend(false);
    toast.success("New OTP sent to your work email!");
  };

  return (
    <AuthSplitLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-1">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <h2 className="font-heading text-2xl font-extrabold text-foreground tracking-tight">
            Verify your identity
          </h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            We sent a 6-digit verification code to{" "}
            <strong className="text-foreground">{userEmail}</strong>
          </p>
          <div className="flex items-center gap-2 pt-1">
            <span className="text-[10.5px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
              Role: {userRole}
            </span>
            <Link
              href="/login"
              className="text-[11px] text-muted-foreground hover:text-foreground font-medium underline"
            >
              Change email
            </Link>
          </div>
        </div>

        {/* 6-box OTP Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="flex items-center justify-between gap-2" onPaste={handlePaste}>
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e.key)}
                className="w-11 h-12 text-center text-lg font-bold rounded-xl border border-border bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all tabular-nums text-foreground shadow-2xs"
                autoFocus={index === 0}
              />
            ))}
          </div>

          <Button
            type="submit"
            disabled={isSubmitting || otp.join("").length !== 6}
            className="w-full h-9 text-xs bg-primary text-primary-foreground hover:bg-primary/90 font-semibold shadow-xs"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                Verifying...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Verify & Enter Dashboard
              </span>
            )}
          </Button>
        </form>

        {/* Resend & Demo helper */}
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Didn&apos;t receive the code?</span>
            {canResend ? (
              <button
                type="button"
                onClick={handleResend}
                className="text-primary font-bold hover:underline cursor-pointer flex items-center gap-1"
              >
                <RefreshCw className="h-3 w-3" /> Resend Code
              </button>
            ) : (
              <span className="text-muted-foreground/80 font-mono text-[11px]">
                Resend in {timer}s
              </span>
            )}
          </div>

          {/* Quick Fill Button for developer / demo testing */}
          <div className="p-3 rounded-xl bg-secondary/50 border border-border/80 space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <KeyRound className="h-3.5 w-3.5 text-primary" />
                Demo Testing Code:
              </span>
              <code className="bg-background px-1.5 py-0.5 rounded font-mono font-bold text-primary border border-border">
                123456
              </code>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleQuickFill}
              className="w-full h-7 text-[11px] font-semibold border-primary/25 text-primary hover:bg-primary/10"
            >
              Quick Fill Demo OTP
            </Button>
          </div>
        </div>

        {/* Back to Login link */}
        <div className="text-center pt-2">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-medium"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Login</span>
          </Link>
        </div>
      </div>
    </AuthSplitLayout>
  );
}
