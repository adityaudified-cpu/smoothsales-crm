"use client";

import React from "react";
import Link from "next/link";
import { CheckCircle2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function WorkedLeadsPage() {
  return (
    <div className="space-y-4 pb-20 w-full">
      {/* Empty State placeholder per Prompt #15 Part A3 */}
      <div className="rounded-xl border border-dashed border-border bg-card/60 p-12 text-center flex flex-col items-center justify-center space-y-3 min-h-[380px]">
        <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <div className="space-y-1.5 max-w-sm">
          <h2 className="font-heading font-bold text-base text-foreground">
            Worked Leads
          </h2>
          <p className="text-xs text-muted-foreground">
            Leads that have at least one logged call touchpoint, completed disposition, or active task will appear here once archived from the active intake queue.
          </p>
        </div>
        <Button asChild variant="outline" size="sm" className="h-8 text-xs gap-1.5 mt-2">
          <Link href="/leads/active">
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Go to Active Leads</span>
          </Link>
        </Button>
      </div>
    </div>
  );
}
