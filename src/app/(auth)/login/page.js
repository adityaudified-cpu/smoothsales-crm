"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthSplitLayout } from "@/components/auth/auth-split-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth/auth-context";
import { toast } from "sonner";
import { ArrowRight, Building2, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;
    setIsLoading(true);
    try {
      const result = await login(email, password);
      if (result.requireOtp) {
        toast.info("Verification code sent!", { description: "Check your email for the 6-digit OTP." });
        router.push("/verify-otp");
      } else {
        toast.success("Logged in successfully!");
        router.push("/dashboard");
      }
    } catch (err) {
      toast.error(err.message || "Invalid email or password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthSplitLayout>
      <div className="space-y-6">
        <div className="space-y-2">
          {/* Mobile brand header */}
          <div className="flex items-center gap-2.5 lg:hidden mb-2">
            <div className="w-8 h-8 rounded-lg overflow-hidden border border-border shadow-xs shrink-0">
              <img
                src="/images/smoothsales-logo.jpg"
                alt="SmoothSales Logo"
                className="w-full h-full object-cover"
              />
            </div>
            <span className="font-heading font-extrabold text-base tracking-tight text-foreground">
              SmoothSales<span className="text-primary font-normal">.ai</span>
            </span>
          </div>

          <h2 className="font-heading text-2xl font-extrabold text-foreground tracking-tight">
            Log in to SmoothSales
          </h2>
          <p className="text-xs text-muted-foreground">
            Enter your work email and password to access your CRM workspace.
          </p>
        </div>

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
              autoComplete="email"
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
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-9 text-xs bg-background pr-9"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-2 text-muted-foreground hover:text-foreground cursor-pointer"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            disabled={isLoading || !email || !password}
            className="w-full h-9 text-xs bg-primary text-primary-foreground hover:bg-primary/90 font-semibold shadow-xs flex items-center justify-center gap-1.5 mt-2 cursor-pointer"
          >
            <span>{isLoading ? "Signing in..." : "Continue"}</span>
            {!isLoading && <ArrowRight className="h-3.5 w-3.5" />}
          </Button>
        </form>

        {/* Enterprise Provisioning Notice */}
        <div className="p-3.5 rounded-xl bg-muted/40 border border-border/60 text-[11.5px] text-muted-foreground leading-relaxed space-y-1">
          <div className="font-semibold text-foreground flex items-center gap-1.5">
            <Building2 className="h-3.5 w-3.5 text-primary" />
            <span>Need an Account?</span>
          </div>
          <p>
            Accounts are provisioned by your company Administrator. Contact your manager if you don&apos;t have credentials.
          </p>
          <div className="pt-1">
            New workspace?{" "}
            <Link href="/signup" className="text-primary font-bold hover:underline">
              Start 14-Day Free Trial
            </Link>
          </div>
        </div>
      </div>
    </AuthSplitLayout>
  );
}
