import React from "react";
import { Card } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export function DealCard({ deal }) {
  const isStale = Boolean(deal.isStale);
  const daysInStage = deal.daysInStage ?? 0;

  return (
    <Card
      className={cn(
        "p-3 bg-card border shadow-none rounded-md space-y-1.5 transition-colors",
        isStale
          ? "border-warning bg-warning/5 hover:border-warning/80"
          : "border-border hover:border-primary/40"
      )}
    >
      {/* Lead/Deal Name */}
      <h4 className="font-heading font-semibold text-sm text-foreground leading-snug">
        {deal.leadName}
      </h4>

      {/* Value in text-success font-semibold text-sm */}
      <div className="text-success font-semibold text-sm tabular-nums">
        {deal.value}
      </div>

      {/* Owner + Team */}
      <div className="text-xs text-muted-foreground truncate">
        {deal.ownerName} • {deal.teamName}
      </div>

      {/* Days in Stage & Stage-Stuck Alert */}
      <div
        className={cn(
          "text-[11px] pt-1 border-t flex items-center gap-1.5 font-medium tabular-nums",
          isStale
            ? "text-warning border-warning/20 font-semibold"
            : "text-muted-foreground border-border/60"
        )}
      >
        {isStale && (
          <AlertTriangle
            className="h-3 w-3 shrink-0 text-warning fill-warning/15"
            title="Stale deal: Stuck in current stage beyond SLA threshold"
          />
        )}
        <span>
          {daysInStage} {daysInStage === 1 ? "day" : "days"} in stage
        </span>
        {isStale && (
          <span className="text-[10px] px-1 py-0.2 rounded bg-warning/20 text-warning font-mono ml-auto">
            STUCK
          </span>
        )}
      </div>
    </Card>
  );
}
