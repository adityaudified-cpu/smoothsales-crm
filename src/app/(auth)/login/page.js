"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthSplitLayout } from "@/components/auth/auth-split-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth, DEMO_ACCOUNTS } from "@/lib/auth/auth-context";
import { toast } from "sonner";
import { ShieldCheck, ArrowRight, UserCheck, Sparkles, Building2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("admin@smoothsales.ai");
  const [password, setPassword] = useState("password123");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login(email, password);
      toast.info("OTP verification code generated!", {
        description: "Check your email for the 6-digit code.",
      });
      router.push("/verify-otp");
    } catch {
      toast.error("Failed to initiate login. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectDemo = (account) => {
    setEmail(account.email);
    setPassword(account.password);
    toast.success(`Selected demo account: ${account.name} (${account.role})`);
  };

  return (
    <AuthSplitLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <div className="h-8 w-8 rounded bg-primary flex items-center justify-center text-primary-foreground font-heading font-extrabold text-sm shadow-sm lg:hidden">
            S
          </div>
          <h2 className="font-heading text-2xl font-extrabold text-foreground tracking-tight">
            Log in to SmoothSales
          </h2>
          <p className="text-xs text-muted-foreground">
            Enter your company email and password to receive a login verification code.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs font-semibold">
              Work Email
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

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-xs font-semibold">
                Password
              </Label>
              <Link
                href="/forgot-password"
                className="text-[11px] text-primary hover:underline font-medium"
              >
                Forgot password?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="h-9 text-xs bg-background"
            />
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-9 text-xs bg-primary text-primary-foreground hover:bg-primary/90 font-semibold shadow-xs flex items-center justify-center gap-1.5 mt-1"
          >
            <span>{isLoading ? "Signing in..." : "Continue to OTP Verification"}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </form>

        {/* Demo Roles Quick-Select Chips */}
        <div className="p-3.5 rounded-xl bg-secondary/50 border border-border/80 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-foreground flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Quick Demo Accounts:
            </span>
            <span className="text-[10px] text-muted-foreground">Click to fill</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {DEMO_ACCOUNTS.map((acc) => (
              <button
                key={acc.email}
                type="button"
                onClick={() => handleSelectDemo(acc)}
                className={`p-2 rounded-lg border text-left transition-all text-[11px] cursor-pointer ${
                  email === acc.email
                    ? "bg-primary/10 border-primary/40 text-primary font-semibold shadow-2xs"
                    : "bg-background border-border/80 hover:bg-accent text-foreground"
                }`}
              >
                <div className="font-semibold truncate">{acc.role}</div>
                <div className="text-[10px] text-muted-foreground truncate">{acc.name}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Account Provisioning Notice */}
        <div className="p-3 rounded-xl bg-muted/40 border border-border/60 text-[11.5px] text-muted-foreground leading-relaxed space-y-1">
          <div className="font-semibold text-foreground flex items-center gap-1.5">
            <Building2 className="h-3.5 w-3.5 text-primary" />
            <span>Need an Account?</span>
          </div>
          <p>
            User accounts are provisioned by your company Administrator or Channel Partner. If you don&apos;t have credentials, contact your manager.
          </p>
          <div className="pt-1">
            Looking to setup a new company workspace?{" "}
            <Link href="/signup" className="text-primary font-bold hover:underline">
              Start 14-Day Free Trial
            </Link>
          </div>
        </div>
      </div>
    </AuthSplitLayout>
  );
}
