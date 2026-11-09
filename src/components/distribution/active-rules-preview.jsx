"use client";

import React, { useState } from "react";
import Link from "next/link";
import { GitBranch, ChevronDown, ChevronUp, ArrowRight, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const METHOD_LABELS = {
  round_robin: "Round Robin",
  fixed: "Fixed User",
  workload: "Workload-Based",
  capacity: "Capacity Limits",
  pool: "Lead Pool",
};

const METHOD_COLORS = {
  round_robin: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800",
  fixed: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800",
  workload: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
  capacity: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
  pool: "bg-muted text-muted-foreground border-border",
};

export function ActiveRulesPreview({ rules = [] }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const activeRules = rules.filter((r) => r.active !== false);

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-border bg-muted/20">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <GitBranch className="h-3.5 w-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-bold text-foreground">Active Routing Rules</h2>
              <span className={cn(
                "rounded-full border px-2 py-0 text-[10px] font-bold",
                activeRules.length > 0
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800"
                  : "bg-muted text-muted-foreground border-border"
              )}>
                {activeRules.length} active
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Rules evaluated on every inbound lead arrival.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <Button asChild size="sm" variant="outline" className="h-7 text-[11px] gap-1 font-medium">
            <Link href="/distribution-rules">
              <ExternalLink className="h-3 w-3" />
              Manage Rules
            </Link>
          </Button>
          {activeRules.length > 0 && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-7 px-2 text-[11px] gap-1 text-muted-foreground hover:text-foreground"
            >
              {isExpanded ? (
                <><ChevronUp className="h-3 w-3" /> Collapse</>
              ) : (
                <><ChevronDown className="h-3 w-3" /> Preview</>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Collapsed summary strip */}
      {!isExpanded && activeRules.length > 0 && (
        <div className="flex items-center gap-2 px-4 py-2.5 overflow-x-auto no-scrollbar">
          {activeRules.map((rule, idx) => (
            <React.Fragment key={rule.id}>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-2.5 py-1 text-[11px] font-medium text-foreground whitespace-nowrap">
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary/10 text-primary text-[9px] font-bold shrink-0">
                  {rule.priority}
                </span>
                {rule.name}
                {rule.target?.label && (
                  <span className="text-muted-foreground font-normal">→ {rule.target.label}</span>
                )}
              </span>
              {idx < activeRules.length - 1 && (
                <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
              )}
            </React.Fragment>
          ))}
        </div>
      )}

      {/* Expanded rule cards */}
      {isExpanded && (
        <div className="divide-y divide-border/60">
          {activeRules.map((rule) => (
            <div key={rule.id} className="flex items-start gap-3 px-4 py-3 hover:bg-muted/20 transition-colors">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-[10px] font-bold mt-0.5">
                {rule.priority}
              </span>
              <div className="flex-1 min-w-0 space-y-1.5">
                <p className="text-xs font-semibold text-foreground leading-tight">{rule.name}</p>
                <div className="flex flex-wrap items-center gap-1.5">
                  {rule.conditions?.map((c, i) => (
                    <span key={i} className="rounded bg-muted border border-border px-1.5 py-0.5 text-[10px] font-medium text-foreground">
                      {c.field} = {c.value || "(any)"}
                    </span>
                  )) || <span className="text-[11px] italic text-muted-foreground">Always match</span>}
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="rounded-full border px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 whitespace-nowrap">
                  → {rule.target?.label || "Lead Pool"}
                </span>
                <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-medium whitespace-nowrap", METHOD_COLORS[rule.allocationMethod] || METHOD_COLORS.pool)}>
                  {METHOD_LABELS[rule.allocationMethod] || rule.allocationMethod}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeRules.length === 0 && (
        <div className="px-4 py-5 text-center text-xs text-muted-foreground">
          No active routing rules. Leads will fall back to the unassigned triage queue.
        </div>
      )}
    </div>
  );
}
