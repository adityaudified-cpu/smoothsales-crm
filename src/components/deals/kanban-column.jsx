import React from "react";
import { DealCard } from "./deal-card";

export function KanbanColumn({ title, count, deals = [] }) {
  return (
    <div className="bg-muted/50 rounded-lg p-3 flex flex-col gap-3 min-w-[220px] border border-border/50">
      {/* Header Row: Stage Name + Count Pill */}
      <div className="flex items-center justify-between px-1">
        <h3 className="font-heading font-extrabold text-xs text-foreground uppercase tracking-wide">
          {title}
        </h3>
        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-background border border-border text-muted-foreground tabular-nums">
          {count}
        </span>
      </div>

      {/* Stacked Deal Cards */}
      <div className="space-y-2 flex-1 overflow-y-auto">
        {deals.map((deal) => (
          <DealCard key={deal.id} deal={deal} />
        ))}
        {deals.length === 0 && (
          <div className="py-8 text-center text-xs text-muted-foreground border border-dashed border-border rounded-md">
            No deals in stage
          </div>
        )}
      </div>
    </div>
  );
}
