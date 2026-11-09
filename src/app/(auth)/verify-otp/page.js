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

  const userEmail = pendingOtpUser?.email || "";
  const userRole = pendingOtpUser?.role || "Sales User";
  const canResend = timer === 0;

  useEffect(() => {
    if (timer <= 0) return;
    const interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").trim();
    if (/^\d{6}$/.test(pasted)) {
      setOtp(pasted.split(""));
      inputRefs.current[5]?.focus();
      toast.success("Verification code pasted!");
    }
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
        description: `Welcome back, ${pendingOtpUser?.name || "User"}!`,
      });
      router.push("/dashboard");
    } catch (err) {
      toast.error(err.message || "Invalid OTP code. Please try again.");
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    try {
      await resendOtp();
      setTimer(45);
      toast.success("New OTP sent to your work email!");
    } catch {
      toast.error("Failed to resend OTP. Please try again.");
    }
  };

  return (
    <AuthSplitLayout>
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-1">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <h2 className="font-heading text-2xl font-extrabold text-foreground tracking-tight">
            Verify your identity
          </h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            We sent a 6-digit verification code to{" "}
            <strong className="text-foreground">{userEmail || "your email"}</strong>
          </p>
          <div className="flex items-center gap-2 pt-1">
            <span className="text-[10.5px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
              Role: {userRole}
            </span>
            <Link href="/login" className="text-[11px] text-muted-foreground hover:text-foreground font-medium underline">
              Change email
            </Link>
          </div>
        </div>

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
                onKeyDown={(e) => handleKeyDown(index, e)}
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
        </div>

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
