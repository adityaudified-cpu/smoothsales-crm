"use client";

import React from "react";
import Link from "next/link";
import { FileText, UploadCloud, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LeadDocumentsPage() {
  return (
    <div className="space-y-4 pb-20 w-full">
      <div className="flex items-center justify-between p-3 bg-card border border-border rounded-lg shadow-2xs">
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-md bg-primary/10 text-primary flex items-center justify-center font-bold">
            <FileText className="h-4 w-4" />
          </div>
          <div>
            <h1 className="font-heading font-bold text-sm text-foreground">
              Lead Documents & Attachments
            </h1>
            <p className="text-[11px] text-muted-foreground">
              Centralized repository for customer floor plans, CAD drawings, agreements, and KYC papers.
            </p>
          </div>
        </div>

        <Button asChild size="sm" className="h-8 text-xs bg-primary text-primary-foreground font-semibold gap-1.5">
          <Link href="/leads/active">
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Active Leads</span>
          </Link>
        </Button>
      </div>

      {/* Empty State */}
      <div className="rounded-xl border border-dashed border-border bg-card/60 p-12 text-center flex flex-col items-center justify-center space-y-3 min-h-[360px]">
        <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
          <FileText className="h-6 w-6" />
        </div>
        <div className="space-y-1 max-w-sm">
          <h3 className="font-heading font-bold text-base text-foreground">
            No Documents Uploaded Yet
          </h3>
          <p className="text-xs text-muted-foreground">
            Upload floor plans, property layout PDFs, interior design moodboards, and contract agreements linked directly to lead profiles.
          </p>
        </div>
        <Button size="sm" className="h-8 text-xs bg-primary text-primary-foreground font-semibold gap-1.5 mt-2">
          <UploadCloud className="h-3.5 w-3.5" />
          <span>Upload Document</span>
        </Button>
      </div>
    </div>
  );
}
