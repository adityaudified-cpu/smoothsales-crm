"use client";

import React from "react";
import { XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

// NEXT_PUBLIC_* vars are inlined at build time. In API mode this will be "api".
const DATA_SOURCE = process.env.NEXT_PUBLIC_LEADS_DATA_SOURCE;

export function SampleDataBanner({ isSampleData, onExit }) {
  // Never show in API mode — all data comes from the backend
  if (DATA_SOURCE === "api" || !isSampleData) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 rounded-xl text-xs">
      <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
        <span className="font-medium">Demo mode — sample leads shown. Connect your backend to see live data.</span>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={onExit}
        className="h-6 px-2 text-[11px] text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40 font-medium gap-1"
      >
        <XCircle className="h-3 w-3" />
        <span>Dismiss</span>
      </Button>
    </div>
  );
}
