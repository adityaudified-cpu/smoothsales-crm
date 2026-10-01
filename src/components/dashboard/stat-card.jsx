import React from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatCard({ label, value, deltaText, deltaTone = "success", className }) {
  return (
    <Card className={cn("p-4 bg-card border border-border shadow-none rounded-md", className)}>
      {/* Small muted label on top */}
      <span className="text-xs text-muted-foreground font-medium block">
        {label}
      </span>

      {/* Large value below */}
      <div className="mt-1.5 text-2xl font-heading font-extrabold text-foreground tabular-nums">
        {value}
      </div>

      {/* Small delta line underneath */}
      {deltaText && (
        <div
          className={cn(
            "text-xs mt-1 font-medium tabular-nums",
            deltaTone === "success" ? "text-success" : "text-warning"
          )}
        >
          {deltaText}
        </div>
      )}
    </Card>
  );
}
