"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth/auth-context";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AccessDenied({ targetRoute }) {
  const { user } = useAuth();

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
          <p className="text-[11px] text-muted-foreground">
            Contact your organization administrator to request access.
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
        </div>
      </div>
    </div>
  );
}
