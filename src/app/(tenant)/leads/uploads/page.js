"use client";

import React, { useEffect, useState } from "react";
import { UploadCloud, FileSpreadsheet, ArrowUpRight, History, Trash2 } from "lucide-react";
import { formatDistanceToNowStrict } from "date-fns";
import { Button } from "@/components/ui/button";
import { ExcelUploadModal } from "@/components/leads/excel-upload-modal";
import { downloadCSV } from "@/lib/export-utils";
import { useLeads } from "@/lib/hooks/use-leads";
import { getImportHistory, IMPORT_HISTORY_STORAGE_KEY } from "@/lib/leads-workspace";
import { toast } from "sonner";
import { LeadsPageHeader } from "@/components/leads/leads-page-header";


const TEMPLATE = "lead_name,mobile_number,email,city,lead_source,lead_stage,lead_priority,business,notes,tags";

export default function LeadUploadsPage() {
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [initialFile, setInitialFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [history, setHistory] = useState([]);
  const { data: leads, addLeads } = useLeads();

  useEffect(() => { setHistory(getImportHistory()); }, []);

  const openUpload = (file = null) => {
    setInitialFile(file);
    setIsUploadOpen(true);
  };

  const clearHistory = () => {
    if (!window.confirm("Clear the import history log? Imported leads are not affected.")) return;
    try { localStorage.removeItem(IMPORT_HISTORY_STORAGE_KEY); } catch {}
    setHistory([]);
    toast.success("Import history cleared");
  };

  const totals = history.reduce((sum, batch) => ({ added: sum.added + (batch.added || 0), skipped: sum.skipped + (batch.skipped || 0) }), { added: 0, skipped: 0 });

  return (
    <div className="flex w-full flex-col gap-4 pb-20">
      <LeadsPageHeader icon={UploadCloud} title="CSV & Bulk Lead Uploads" subtitle="Import CSV or Excel, map columns, handle duplicates, and assign the batch." />

      <div
        onDragOver={(event) => { event.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(event) => { event.preventDefault(); setDragOver(false); openUpload(event.dataTransfer.files?.[0] || null); }}
        className={`rounded-xl border-2 border-dashed bg-card/60 p-12 text-center flex flex-col items-center justify-center space-y-3 min-h-[280px] transition-colors ${dragOver ? "border-primary bg-primary/5" : "border-border"}`}
      >
        <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
          <FileSpreadsheet className="h-6 w-6" />
        </div>
        <div className="space-y-1 max-w-sm">
          <h3 className="font-heading font-bold text-base text-foreground">
            Bulk Ingest Leads from CSV or Excel
          </h3>
          <p className="text-xs text-muted-foreground">
            Drag and drop a CSV or Excel spreadsheet here, or browse for a file. You can match columns and choose how duplicates are handled before importing.
          </p>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <Button size="sm" onClick={() => openUpload()} className="h-8 text-xs bg-primary text-primary-foreground font-semibold gap-1.5">
            <UploadCloud className="h-3.5 w-3.5" />
            <span>Upload Excel / CSV</span>
          </Button>
          <Button variant="outline" size="sm" onClick={() => downloadCSV(TEMPLATE, "smoothsales_leads_template.csv")} className="h-8 text-xs gap-1 border-border">
            <span>Download CSV Template</span>
            <ArrowUpRight className="h-3 w-3" />
          </Button>
        </div>
      </div>

      <section className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
          <div>
            <h2 className="inline-flex items-center gap-1.5 text-xs font-semibold"><History className="h-3.5 w-3.5 text-primary" />Recent import batches</h2>
            <p className="mt-0.5 text-[11px] text-muted-foreground">{history.length} batch{history.length === 1 ? "" : "es"} · {totals.added} leads added · {totals.skipped} duplicates skipped</p>
          </div>
          {history.length > 0 && <Button variant="ghost" size="sm" className="h-7 gap-1 text-[11px] text-muted-foreground hover:text-destructive" onClick={clearHistory}><Trash2 className="h-3 w-3" />Clear log</Button>}
        </div>
        {history.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-xs">
              <thead className="bg-muted/40 text-[10px] uppercase tracking-wider text-muted-foreground">
                <tr><th className="px-4 py-2">File</th><th className="px-3 py-2">Imported</th><th className="px-3 py-2 text-right">Rows</th><th className="px-3 py-2 text-right">Added</th><th className="px-3 py-2 text-right">Updated</th><th className="px-3 py-2 text-right">Skipped</th><th className="px-3 py-2 text-right">Invalid</th><th className="px-4 py-2">By</th></tr>
              </thead>
              <tbody className="divide-y divide-border/70">
                {history.map((batch) => (
                  <tr key={batch.id} className="hover:bg-muted/30">
                    <td className="px-4 py-2"><span className="inline-flex items-center gap-1.5 font-medium"><FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />{batch.filename}</span></td>
                    <td className="px-3 py-2 text-muted-foreground" title={new Date(batch.importedAt).toLocaleString()}>{formatDistanceToNowStrict(new Date(batch.importedAt), { addSuffix: true })}</td>
                    <td className="px-3 py-2 text-right font-mono">{batch.totalRows ?? "—"}</td>
                    <td className="px-3 py-2 text-right font-mono font-semibold text-emerald-600">{batch.added ?? 0}</td>
                    <td className="px-3 py-2 text-right font-mono text-sky-600">{batch.updated ?? 0}</td>
                    <td className="px-3 py-2 text-right font-mono text-amber-600">{batch.skipped ?? 0}</td>
                    <td className="px-3 py-2 text-right font-mono text-rose-600">{batch.invalid ?? 0}</td>
                    <td className="px-4 py-2 text-muted-foreground">{batch.importedBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="p-8 text-center text-xs text-muted-foreground">No imports yet. Each spreadsheet you import is logged here with its added, updated and skipped counts.</p>
        )}
      </section>

      <ExcelUploadModal
        open={isUploadOpen}
        onOpenChange={(open) => { setIsUploadOpen(open); if (!open) { setInitialFile(null); setHistory(getImportHistory()); } }}
        onLeadsImported={addLeads}
        existingLeads={leads}
        initialFile={initialFile}
      />
    </div>
  );
}
