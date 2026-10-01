"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthSplitLayout } from "@/components/auth/auth-split-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("+91 ");
  const [password, setPassword] = useState("");
  const [agreed, setAgreed] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    router.push("/welcome");
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
            Start your free trial
          </h2>
          <p className="text-xs text-muted-foreground">
            14 days full access. No credit card required.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div className="space-y-1">
            <Label htmlFor="full-name" className="text-xs font-semibold">
              Full Name
            </Label>
            <Input
              id="full-name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Aarav Sharma"
              required
              className="h-8 text-xs bg-background"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="business-name" className="text-xs font-semibold">
              Business Name
            </Label>
            <Input
              id="business-name"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="e.g. Jaipur Interiors Pvt Ltd"
              required
              className="h-8 text-xs bg-background"
            />
          </div>

          <div className="space-y-1">
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
              className="h-8 text-xs bg-background"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="phone" className="text-xs font-semibold">
              Mobile Number (+91)
            </Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
              required
              className="h-8 text-xs bg-background font-mono tabular-nums"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="password" className="text-xs font-semibold">
              Create Password
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              required
              className="h-8 text-xs bg-background"
            />
          </div>

          {/* Terms Checkbox */}
          <div className="flex items-start space-x-2 pt-1">
            <Checkbox
              id="terms"
              checked={agreed}
              onCheckedChange={setAgreed}
              className="mt-0.5"
            />
            <Label
              htmlFor="terms"
              className="text-[11px] text-muted-foreground leading-tight cursor-pointer font-normal"
            >
              I agree to the Terms of Service and Privacy Policy.
            </Label>
          </div>

          <Button
            type="submit"
            className="w-full h-9 text-xs bg-primary text-primary-foreground hover:bg-primary/90 font-medium mt-2"
          >
            Start Free Trial
          </Button>
        </form>

        {/* Bottom Line */}
        <div className="text-center text-xs text-muted-foreground pt-1">
          Already have an account?{" "}
          <Link href="/login" className="text-primary font-bold hover:underline">
            Log in
          </Link>
        </div>
      </div>
    </AuthSplitLayout>
  );
}
