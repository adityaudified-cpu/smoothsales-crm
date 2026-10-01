"use client";

import React from "react";
import { Info, Sparkles, XCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SampleDataBanner({ isSampleData, onExit, onRestore }) {
  if (!isSampleData) {
    return (
      <div className="flex items-center justify-between px-4 py-2.5 bg-muted/60 border border-border rounded-lg text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4 text-primary shrink-0" />
          <span>Real data view active. Currently displaying your tenant&apos;s live database records.</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onRestore}
          className="h-7 text-xs gap-1.5 border-dashed border-primary/40 text-primary hover:bg-primary/5"
        >
          <RotateCcw className="h-3 w-3" />
          <span>Reload Sample Leads (24)</span>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-lg text-xs shadow-2xs">
      <div className="flex items-center gap-2.5 text-emerald-900 dark:text-emerald-200">
        <div className="h-5 w-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
          <Sparkles className="h-3 w-3" />
        </div>
        <div>
          <span className="font-semibold">Sample leads</span>
          <span className="text-emerald-700 dark:text-emerald-300"> — locally generated records shown in your Leads table</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onExit}
          className="h-7 px-2.5 text-xs text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 font-medium gap-1"
        >
          <XCircle className="h-3.5 w-3.5" />
          <span>Exit sample data</span>
        </Button>
      </div>
    </div>
  );
}
