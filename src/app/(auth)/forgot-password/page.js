"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthSplitLayout } from "@/components/auth/auth-split-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { CheckCircle2, ArrowLeft, KeyRound, ShieldCheck, Lock } from "lucide-react";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState(1); // 1: Email, 2: OTP + New Password, 3: Success
  const [email, setEmail] = useState("aarav.sharma@smoothsales.ai");
  const [otp, setOtp] = useState("123456");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Step 1: Request Reset OTP
  const handleRequestOtp = (e) => {
    e.preventDefault();
    if (!email) return;
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setStep(2);
      toast.success("Verification code sent!", {
        description: `6-digit reset code sent to ${email}`,
      });
    }, 400);
  };

  // Step 2: Reset Password with OTP
  const handleResetPassword = (e) => {
    e.preventDefault();
    if (otp.length !== 6) {
      toast.error("Please enter a valid 6-digit OTP code.");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setStep(3);
      toast.success("Password reset successfully!");
    }, 500);
  };

  return (
    <AuthSplitLayout>
      <div className="space-y-6">
        {/* Step 1: Enter Email */}
        {step === 1 && (
          <>
            <div className="space-y-2">
              <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-1">
                <KeyRound className="h-5 w-5" />
              </div>
              <h2 className="font-heading text-2xl font-extrabold text-foreground tracking-tight">
                Reset your password
              </h2>
              <p className="text-xs text-muted-foreground">
                Enter your company email to receive a password reset code.
              </p>
            </div>

            <form onSubmit={handleRequestOtp} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-semibold">
                  Registered Work Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  required
                  className="h-9 text-xs bg-background"
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-9 text-xs bg-primary text-primary-foreground hover:bg-primary/90 font-semibold shadow-xs mt-1"
              >
                {isLoading ? "Sending code..." : "Send Verification Code"}
              </Button>
            </form>

            <div className="text-center pt-2">
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-medium"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Back to Login</span>
              </Link>
            </div>
          </>
        )}

        {/* Step 2: Enter OTP & New Password */}
        {step === 2 && (
          <>
            <div className="space-y-2">
              <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-1">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h2 className="font-heading text-2xl font-extrabold text-foreground tracking-tight">
                Set new password
              </h2>
              <p className="text-xs text-muted-foreground">
                Enter the 6-digit code sent to <strong className="text-foreground">{email}</strong> and your new password.
              </p>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-3.5 text-xs">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="otp" className="text-xs font-semibold">
                    6-Digit Reset Code
                  </Label>
                  <span className="text-[10.5px] font-mono text-primary font-bold">Demo: 123456</span>
                </div>
                <Input
                  id="otp"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="123456"
                  required
                  className="h-9 text-xs bg-background font-mono tracking-widest text-center text-sm font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="newPassword" className="text-xs font-semibold">
                  New Password
                </Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  required
                  className="h-9 text-xs bg-background"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword" className="text-xs font-semibold">
                  Confirm Password
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  required
                  className="h-9 text-xs bg-background"
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-9 text-xs bg-primary text-primary-foreground hover:bg-primary/90 font-semibold shadow-xs mt-1"
              >
                {isLoading ? "Updating password..." : "Update Password & Continue"}
              </Button>
            </form>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-medium cursor-pointer"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Change Email</span>
              </button>
            </div>
          </>
        )}

        {/* Step 3: Success State */}
        {step === 3 && (
          <div className="space-y-4 text-center py-4">
            <div className="h-14 w-14 rounded-2xl bg-success-soft text-success flex items-center justify-center mx-auto shadow-xs border border-success/20">
              <CheckCircle2 className="h-7 w-7" />
            </div>

            <div className="space-y-1.5">
              <h2 className="font-heading text-xl font-extrabold text-foreground">
                Password successfully updated
              </h2>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-xs mx-auto">
                Your account password has been changed. You can now log in with your new credentials.
              </p>
            </div>

            <div className="pt-3">
              <Button
                onClick={() => router.push("/login")}
                className="w-full h-9 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Proceed to Login
              </Button>
            </div>
          </div>
        )}
      </div>
    </AuthSplitLayout>
  );
}

