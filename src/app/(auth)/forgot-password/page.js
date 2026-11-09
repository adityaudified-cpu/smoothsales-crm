"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthSplitLayout } from "@/components/auth/auth-split-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { CheckCircle2, ArrowLeft, KeyRound, ShieldCheck, Eye, EyeOff } from "lucide-react";
import { authApi } from "@/lib/api/auth";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleRequestReset = async (e) => {
    e.preventDefault();
    if (!email) return;
    setIsLoading(true);
    try {
      await authApi.forgotPassword(email);
      setStep(2);
      toast.success("Reset link sent!", {
        description: `If ${email} exists, a password reset link has been sent.`,
      });
    } catch (err) {
      // Backend always returns success to prevent user enumeration
      setStep(2);
      toast.success("Reset link sent!", {
        description: `If ${email} exists, a password reset link has been sent.`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!resetToken.trim()) {
      toast.error("Please enter the reset token from your email.");
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
    try {
      await authApi.resetPassword(resetToken.trim(), newPassword);
      setStep(3);
      toast.success("Password reset successfully!");
    } catch (err) {
      toast.error(err.message || "Invalid or expired reset token. Please try again.");
    } finally {
      setIsLoading(false);
    }
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
                Enter your company email to receive a password reset link.
              </p>
            </div>

            <form onSubmit={handleRequestReset} className="space-y-4 text-xs">
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
                  autoComplete="email"
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading || !email}
                className="w-full h-9 text-xs bg-primary text-primary-foreground hover:bg-primary/90 font-semibold shadow-xs mt-1"
              >
                {isLoading ? "Sending..." : "Send Reset Link"}
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

        {/* Step 2: Enter Token & New Password */}
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
                Check your email for the reset link. Copy the token from the link and paste it below.
              </p>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-3.5 text-xs">
              <div className="space-y-1.5">
                <Label htmlFor="token" className="text-xs font-semibold">
                  Reset Token (from email link)
                </Label>
                <Input
                  id="token"
                  value={resetToken}
                  onChange={(e) => setResetToken(e.target.value)}
                  placeholder="Paste token from reset email"
                  required
                  className="h-9 text-xs bg-background font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="newPassword" className="text-xs font-semibold">
                  New Password
                </Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    required
                    className="h-9 text-xs bg-background pr-9"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
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
                disabled={isLoading || !resetToken || !newPassword || !confirmPassword}
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

        {/* Step 3: Success */}
        {step === 3 && (
          <div className="space-y-4 text-center py-4">
            <div className="h-14 w-14 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center mx-auto shadow-xs border border-green-200">
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
