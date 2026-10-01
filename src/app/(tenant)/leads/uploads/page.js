"use client";

import React from "react";
import Link from "next/link";
import { UploadCloud, FileSpreadsheet, ArrowLeft, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LeadUploadsPage() {
  return (
    <div className="space-y-4 pb-20 w-full">
      <div className="flex items-center justify-between p-3 bg-card border border-border rounded-lg shadow-2xs">
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-md bg-primary/10 text-primary flex items-center justify-center font-bold">
            <UploadCloud className="h-4 w-4" />
          </div>
          <div>
            <h1 className="font-heading font-bold text-sm text-foreground">
              CSV &amp; Bulk Lead Uploads
            </h1>
            <p className="text-[11px] text-muted-foreground">
              Ingest offline exhibition leads, external spreadsheets, and batch agency lists with automatic deduplication.
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

      {/* Upload Dropzone & History */}
      <div className="rounded-xl border border-dashed border-border bg-card/60 p-12 text-center flex flex-col items-center justify-center space-y-3 min-h-[360px]">
        <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
          <FileSpreadsheet className="h-6 w-6" />
        </div>
        <div className="space-y-1 max-w-sm">
          <h3 className="font-heading font-bold text-base text-foreground">
            Bulk Ingest Leads from CSV or Excel
          </h3>
          <p className="text-xs text-muted-foreground">
            Drag and drop your spreadsheet here (.csv, .xlsx). Map custom columns to tenant fields and assign round-robin distribution on upload.
          </p>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <Button size="sm" className="h-8 text-xs bg-primary text-primary-foreground font-semibold gap-1.5">
            <UploadCloud className="h-3.5 w-3.5" />
            <span>Choose CSV File</span>
          </Button>
          <Button variant="outline" size="sm" className="h-8 text-xs gap-1 border-border">
            <span>Download CSV Template</span>
            <ArrowUpRight className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}
