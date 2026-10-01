"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Settings2, Plus, Sparkles } from "lucide-react";

export function IntegrationCard({ integration, onToggle }) {
  const { id, name, description, connected, color, letter } = integration;

  return (
    <Card
      className={`p-5 rounded-xl flex flex-col justify-between border transition-all ${
        connected
          ? "border-success/40 bg-card shadow-xs"
          : "border-border bg-card hover:border-border/80"
      }`}
    >
      <div className="space-y-3">
        {/* Top Header with Icon & Status */}
        <div className="flex items-start justify-between gap-3">
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center font-heading font-extrabold text-sm shadow-xs shrink-0 ${
              color || "bg-primary text-primary-foreground"
            }`}
          >
            {letter || name.slice(0, 1)}
          </div>

          <div>
            {connected ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border border-emerald-300 dark:border-emerald-800">
                <CheckCircle2 className="h-3 w-3" />
                Connected
              </span>
            ) : (
              <span className="text-[11px] text-muted-foreground font-medium">
                Not Connected
              </span>
            )}
          </div>
        </div>

        {/* Name & Description */}
        <div>
          <h3 className="font-heading font-bold text-sm text-foreground">
            {name}
          </h3>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed line-clamp-2">
            {description}
          </p>
        </div>
      </div>

      {/* Action Footer */}
      <div className="pt-4 mt-3 border-t border-border/60 flex items-center justify-between">
        {connected ? (
          <>
            <button
              type="button"
              onClick={() => onToggle(id)}
              className="text-xs text-muted-foreground hover:text-destructive transition-colors font-medium"
            >
              Disconnect
            </button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs gap-1 border-border font-medium"
            >
              <Settings2 className="h-3.5 w-3.5" />
              Manage
            </Button>
          </>
        ) : (
          <>
            <span className="text-[11px] text-muted-foreground">
              Official API
            </span>
            <Button
              size="sm"
              onClick={() => onToggle(id)}
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
