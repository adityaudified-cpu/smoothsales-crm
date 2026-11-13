"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Settings2, Plus, AlertCircle } from "lucide-react";
import Image from "next/image";

export function IntegrationCard({ integration, onToggle, onConfigure }) {
  const { id, name, description, connected, color, letter, logoSrc, lastTestStatus } = integration;

  return (
    <Card
      className={`p-5 rounded-xl flex flex-col justify-between border transition-all ${
        connected
          ? "border-success/40 bg-card shadow-xs"
          : "border-border bg-card hover:border-border/80"
      }`}
    >
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          {/* Logo / Letter Avatar */}
          <div className="shrink-0">
            {logoSrc ? (
              <div className="w-10 h-10 rounded-lg overflow-hidden border border-border bg-white flex items-center justify-center">
                <Image src={logoSrc} alt={name} width={32} height={32} className="object-contain" />
              </div>
            ) : (
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-heading font-extrabold text-sm shadow-xs ${color || "bg-primary text-primary-foreground"}`}>
                {letter || name.slice(0, 1)}
              </div>
            )}
          </div>

          {/* Status Badge */}
          <div className="flex flex-col items-end gap-1">
            {connected ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border border-emerald-300 dark:border-emerald-800">
                <CheckCircle2 className="h-3 w-3" /> Connected
              </span>
            ) : (
              <span className="text-[11px] text-muted-foreground font-medium">Not Connected</span>
            )}
            {connected && lastTestStatus === "FAILED" && (
              <span className="inline-flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400">
                <AlertCircle className="h-2.5 w-2.5" /> Check config
              </span>
            )}
          </div>
        </div>

        <div>
          <h3 className="font-heading font-bold text-sm text-foreground">{name}</h3>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed line-clamp-2">{description}</p>
        </div>
      </div>

      <div className="pt-4 mt-3 border-t border-border/60 flex items-center justify-between">
        {connected ? (
          <>
            <button
              type="button"
              onClick={() => onToggle?.(id)}
              className="text-xs text-muted-foreground hover:text-destructive transition-colors font-medium"
            >
              Disconnect
            </button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs gap-1 border-border font-medium"
              onClick={() => onConfigure?.(id)}
            >
              <Settings2 className="h-3.5 w-3.5" />
              Configure
            </Button>
          </>
        ) : (
          <>
            <span className="text-[11px] text-muted-foreground">Official API</span>
            <Button
              size="sm"
              onClick={() => onConfigure?.(id)}
              className="h-8 text-xs gap-1 font-semibold"
            >
              <Plus className="h-3.5 w-3.5" />
              Connect
            </Button>
          </>
        )}
      </div>
    </Card>
  );
}
