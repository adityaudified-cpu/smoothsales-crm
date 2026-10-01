"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth/auth-context";
import { ShieldAlert, ArrowLeft, KeyRound, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AccessDenied({ targetRoute }) {
  const { user, switchDemoRole } = useAuth();

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-6 bg-card border border-border p-8 rounded-2xl shadow-sm">
        {/* Icon */}
        <div className="h-16 w-16 rounded-2xl bg-destructive/10 text-destructive border border-destructive/20 flex items-center justify-center mx-auto shadow-xs">
          <ShieldAlert className="h-8 w-8" />
        </div>

        {/* Title & Description */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-destructive/10 text-destructive text-[11px] font-bold uppercase tracking-wider">
            403 • Restricted Area
          </div>
          <h1 className="font-heading text-2xl font-extrabold text-foreground tracking-tight">
            Access Denied
          </h1>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Your current assigned role (
            <span className="font-semibold text-foreground">{user?.role || "User"}</span>
            ) does not have permission to access{" "}
            {targetRoute ? <code className="text-primary font-mono text-[11px]">{targetRoute}</code> : "this resource"}.
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-3 pt-2">
          <Link href="/dashboard" className="block w-full">
            <Button className="w-full h-9 text-xs font-semibold gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
              <ArrowLeft className="h-3.5 w-3.5" />
              Return to Dashboard
            </Button>
          </Link>

          {/* Quick Demo Switcher helper */}
          <div className="p-3 rounded-xl bg-secondary/50 border border-border/80 text-left space-y-2">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-foreground">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span>Testing as Administrator?</span>
            </div>
            <p className="text-[10.5px] text-muted-foreground leading-tight">
              Switch to an Administrator account to preview this page and manage company-wide permissions.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => switchDemoRole("Admin")}
              className="w-full h-7 text-[11px] font-semibold gap-1.5 border-primary/30 text-primary hover:bg-primary/10"
            >
              <KeyRound className="h-3 w-3" />
              Switch to Admin Role
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
