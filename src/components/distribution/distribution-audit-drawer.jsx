"use client";

import React, { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { History, Zap, CheckCircle2, Clock, ShieldCheck, Filter, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function DistributionAuditDrawer({
  open = false,
  onOpenChange = () => {},
  auditLogs = [],
}) {
  const [filterSource, setFilterSource] = useState("all");

  const sources = Array.from(new Set(auditLogs.map((l) => l.triggerSource).filter(Boolean)));

  const filteredLogs = auditLogs.filter((log) => {
    if (filterSource !== "all" && log.triggerSource !== filterSource) return false;
    return true;
  });

  const handleExportLogs = () => {
    const headers = ["Timestamp", "Lead Name", "Matched Rule", "Assigned To", "Decision Latency (ms)", "Trigger Source"];
    const rows = filteredLogs.map((l) => [
      `"${l.timestamp || ""}"`,
      `"${l.leadName || ""}"`,
      `"${l.matchedRuleName || ""}"`,
      `"${l.assignedTo || ""}"`,
      `"${l.decisionTimeMs || 800}"`,
      `"${l.triggerSource || ""}"`,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `smoothsales_distribution_audit_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg p-0 flex flex-col">
        <SheetHeader className="p-4 border-b border-border bg-muted/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <History className="h-4 w-4" />
              </div>
              <div>
                <SheetTitle className="text-sm font-bold text-foreground">
                  Distribution Audit Ledger
                </SheetTitle>
                <SheetDescription className="text-[11px] text-muted-foreground">
                  Live record of automated round-robin &amp; rule allocations.
                </SheetDescription>
              </div>
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={handleExportLogs}
              className="h-7 text-[10px] gap-1"
            >
              <Download className="h-3 w-3" />
              <span>Export</span>
            </Button>
          </div>

          <div className="mt-3 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setFilterSource("all")}
              className={cn(
                "px-2.5 py-0.5 rounded-full text-[10px] font-medium border transition-colors",
                filterSource === "all"
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-muted-foreground border-border hover:bg-muted"
              )}
            >
              All Events ({auditLogs.length})
            </button>
            {sources.map((src) => (
              <button
                key={src}
                type="button"
                onClick={() => setFilterSource(src)}
                className={cn(
                  "px-2.5 py-0.5 rounded-full text-[10px] font-medium border transition-colors whitespace-nowrap",
                  filterSource === src
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-muted-foreground border-border hover:bg-muted"
                )}
              >
                {src}
              </button>
            ))}
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredLogs.map((log) => (
            <div
              key={log.id}
              className="flex flex-col gap-1.5 rounded-xl border border-border bg-card p-3 shadow-2xs hover:border-border/80 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="text-xs font-bold text-foreground">
                    {log.leadName}
                  </h4>
                  <p className="text-[11px] text-muted-foreground">
                    Matched Rule: <span className="font-medium text-foreground">{log.matchedRuleName}</span>
                  </p>
                </div>
                <span className="text-[10px] text-muted-foreground whitespace-nowrap flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {log.timestamp}
                </span>
              </div>

              <div className="mt-1 flex flex-wrap items-center justify-between gap-2 border-t border-border/50 pt-2 text-[11px]">
                <div className="flex items-center gap-1.5">
                  <span className="text-muted-foreground">Assigned to:</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    {log.assignedTo}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
                    {log.decisionTimeMs > 0 ? `⚡ ${(log.decisionTimeMs / 1000).toFixed(2)}s SLA` : "📝 Manual"}
                  </span>
                  <span className="rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 px-2 py-0.2 text-[10px] font-medium text-blue-700 dark:text-blue-300">
                    {log.triggerSource || "Round Robin"}
                  </span>
                </div>
              </div>
            </div>
          ))}

          {filteredLogs.length === 0 && (
            <div className="p-8 text-center text-xs text-muted-foreground">
              No audit log entries found for this filter.
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
