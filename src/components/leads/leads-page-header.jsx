"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

// Shared header for Leads sub-pages so every page has the same height, padding and action placement.
export function LeadsPageHeader({ icon: Icon, title, subtitle, children, backHref = "/leads/active", backLabel = "Active Leads" }) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3">
      <div className="flex min-w-0 items-center gap-2.5">
        {Icon && <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary"><Icon className="h-4 w-4" /></div>}
        <div className="min-w-0">
          <h1 className="truncate text-sm font-bold text-foreground">{title}</h1>
          {subtitle && <p className="truncate text-[11px] text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {children}
        {backHref && (
          <Button asChild size="sm" variant="ghost" className="h-8 gap-1.5 text-xs">
            <Link href={backHref}><ArrowLeft className="h-3.5 w-3.5" />{backLabel}</Link>
          </Button>
        )}
      </div>
    </header>
  );
}
