"use client";

import React, { useState } from "react";
import { DealCard } from "./deal-card";
import { cn } from "@/lib/utils";
import { formatINR } from "@/lib/format-cell-value";

export function KanbanColumn({ stageId, title, count, deals = [], onDropDeal, onStageChange, onDragStart }) {
  const [isOver, setIsOver] = useState(false);
  const totalValue = deals.reduce((sum, d) => sum + (Number(d.dealValue) || 0), 0);

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsOver(true);
      }}
      onDragLeave={() => setIsOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsOver(false);
        if (onDropDeal) onDropDeal(stageId);
      }}
      className={cn(
        "bg-muted/40 rounded-xl p-3 flex flex-col gap-3 min-w-[230px] border transition-colors",
        isOver ? "border-primary bg-primary/5" : "border-border/60"
      )}
    >
      <div className="space-y-0.5 px-1">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-heading font-extrabold text-xs text-foreground uppercase tracking-wide truncate">
            {title}
          </h3>
          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-background border border-border text-muted-foreground tabular-nums">
            {count}
          </span>
        </div>
        {totalValue > 0 && (
          <div className="text-[11px] font-mono font-semibold text-emerald-600 dark:text-emerald-400">
            {formatINR(totalValue)}
          </div>
        )}
      </div>

      <div className="space-y-2 flex-1 overflow-y-auto max-h-[68vh] min-h-[140px]">
        {deals.map((deal) => (
          <DealCard
            key={deal.id}
            deal={deal}
            onStageChange={onStageChange}
            onDragStart={onDragStart}
          />
        ))}
        {deals.length === 0 && (
          <div className="py-10 text-center text-xs text-muted-foreground border border-dashed border-border rounded-lg">
            No deals in stage
          </div>
        )}
      </div>
    </div>
  );
}
