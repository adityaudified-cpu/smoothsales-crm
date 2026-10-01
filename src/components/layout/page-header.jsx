import React from "react";
import { cn } from "@/lib/utils";

export function PageHeader({ title, subtitle, actions, children, className }) {
  const rightSlot = actions || children;

  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border mb-6",
        className
      )}
    >
      <div>
        <h1 className="font-heading text-xl font-extrabold tracking-tight text-foreground">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
        )}
      </div>
      {rightSlot && <div className="flex items-center gap-2 shrink-0">{rightSlot}</div>}
    </div>
  );
}
