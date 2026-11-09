"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, ArrowLeft, ArrowRight, CheckCircle2, Download, FileSpreadsheet, Info, UploadCloud, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { getRotationReps, recordImportBatch } from "@/lib/leads-workspace";
import { useTeamMembers } from "@/lib/hooks/use-team-members";

const TEMPLATE_COLUMNS = ["lead_name", "mobile_number", "email", "city", "lead_source", "lead_stage", "lead_priority", "business", "notes", "tags"];
const CRM_FIELDS = [
  { key: "lead_name", label: "Lead name", required: true },
  { key: "mobile_number", label: "Mobile number" },
  { key: "email", label: "Email" },
  { key: "city", label: "City" },
  { key: "state", label: "State" },
  { key: "address", label: "Address" },
  { key: "business", label: "Business / Company" },
  { key: "designation", label: "Designation" },
  { key: "lead_source", label: "Lead source" },
  { key: "lead_stage", label: "Lead stage" },
  { key: "lead_priority", label: "Priority (1-5)" },
  { key: "budget_range", label: "Budget range" },
  { key: "notes", label: "Notes / remark" },
  { key: "tags", label: "Tags" },
];
const CRM_KEYS = new Set(CRM_FIELDS.map((field) => field.key));
const HEADER_ALIASES = {
  name: "lead_name", full_name: "lead_name", contact_name: "lead_name", customer_name: "lead_name",
  phone: "mobile_number", mobile: "mobile_number", phone_number: "mobile_number", contact_number: "mobile_number",
  company: "business", company_name: "business", organization: "business", source: "lead_source", stage: "lead_stage",
  priority: "lead_priority", remark: "notes", note: "notes", budget: "budget_range", title: "designation",
};
const STEPS = ["Upload", "Map columns", "Review"];

function normalizeHeader(value) {
  const key = String(value || "").replace(/^﻿/, "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
  return HEADER_ALIASES[key] || key;
}

const phoneDigits = (value) => String(value || "").replace(/\D/g, "").slice(-10);
const emailKey = (value) => String(value || "").trim().toLowerCase();
const ROUND_ROBIN = "__round_robin__";

function downloadCsvTemplate() {
  const csv = TEMPLATE_COLUMNS.map((value) => `"${value}"`).join(",");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "smoothsales_leads_template.csv";
  anchor.click();
  URL.revokeObjectURL(url);
}

function downloadExcelTemplate() {
  const sheet = XLSX.utils.aoa_to_sheet([TEMPLATE_COLUMNS]);
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, "Leads");
  XLSX.writeFile(book, "smoothsales_leads_template.xlsx");
}

// Returns the raw header row and data rows; column mapping happens in step 2.
function readSpreadsheet(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("The selected file could not be read."));
    reader.onload = () => {
      try {
        const isCsv = file.name.toLowerCase().endsWith(".csv");
        const workbook = XLSX.read(reader.result, { type: isCsv ? "string" : "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        if (!sheet) throw new Error("The workbook does not contain a readable sheet.");
        const matrix = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "", raw: false });
        const headers = (matrix.shift() || []).map((header) => String(header || "").replace(/^﻿/, "").trim());
        const rows = matrix.filter((values) => values.some((value) => String(value ?? "").trim()));
        if (!headers.length) throw new Error("The first row must contain column headers.");
        resolve({ headers, rows });
      } catch (error) {
        reject(error);
      }
    };
    if (file.name.toLowerCase().endsWith(".csv")) reader.readAsText(file);
    else reader.readAsArrayBuffer(file);
  });
}

function autoMapping(headers) {
  const used = new Set();
  return headers.map((header) => {
    const key = normalizeHeader(header);
    if (CRM_KEYS.has(key) && !used.has(key)) { used.add(key); return key; }
    return "";
  });
}

export function ExcelUploadModal({ open, onOpenChange, onLeadsImported, initialFile = null, existingLeads = [] }) {
  const { reps } = useTeamMembers();
  const [step, setStep] = useState(0);
  const [file, setFile] = useState(null);
  const [sheet, setSheet] = useState(null);
  const [readError, setReadError] = useState("");
  const [mapping, setMapping] = useState([]);
  const [duplicateMode, setDuplicateMode] = useState("skip");
  const [assignTo, setAssignTo] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const inputRef = useRef(null);

  const reset = () => {
    setStep(0); setFile(null); setSheet(null); setReadError(""); setMapping([]); setDuplicateMode("skip"); setAssignTo("");
    setDragOver(false); setUploading(false); setProgress(0); setResult(null);
  };
  const close = () => { reset(); onOpenChange(false); };

  const processFile = useCallback(async (selectedFile) => {
    if (!selectedFile) return;
    if (selectedFile.size > 10 * 1024 * 1024) {
      toast.error("File is too large", { description: "Please upload a file smaller than 10MB." });
      return;
    }
    if (!/\.(csv|xlsx|xls)$/i.test(selectedFile.name)) {
      toast.error("Unsupported file type", { description: "Choose a .csv, .xlsx, or .xls file." });
      return;
    }
    setFile(selectedFile);
    setReadError("");
    try {
      const parsed = await readSpreadsheet(selectedFile);
      setSheet(parsed);
      setMapping(autoMapping(parsed.headers));
    } catch (error) {
      setSheet(null);
      setReadError(error.message || "The spreadsheet could not be read.");
    }
  }, []);

  useEffect(() => {
    if (open && initialFile) processFile(initialFile);
  }, [open, initialFile, processFile]);

  const hasNameColumn = mapping.includes("lead_name");

  const review = useMemo(() => {
    if (!sheet) return null;
    const existingKeys = new Set(existingLeads.flatMap((lead) => [phoneDigits(lead.mobile_number || lead.phone), emailKey(lead.email)]).filter((key) => key.length >= 5));
    const seenInFile = new Set();
    const rows = [];
    const errors = [];
    let duplicatesExisting = 0;
    let duplicatesInFile = 0;
    sheet.rows.forEach((values, index) => {
      const row = {};
      mapping.forEach((key, column) => { if (key) row[key] = String(values[column] ?? "").trim(); });
      if (!row.lead_name) { errors.push(`Row ${index + 2}: lead name is missing.`); return; }
      const keys = [phoneDigits(row.mobile_number), emailKey(row.email)].filter((key) => key.length >= 5);
      let duplicate = null;
      if (keys.some((key) => seenInFile.has(key))) { duplicatesInFile += 1; duplicate = "file"; }
      else if (keys.some((key) => existingKeys.has(key))) { duplicatesExisting += 1; duplicate = "existing"; }
      keys.forEach((key) => seenInFile.add(key));
      rows.push({ ...row, _duplicate: duplicate });
    });
    return { rows, errors, duplicatesExisting, duplicatesInFile };
  }, [sheet, mapping, existingLeads]);

  const importRows = async () => {
    if (!review?.rows.length) return;
    setUploading(true);
    setProgress(0);
    for (let value = 20; value <= 100; value += 20) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      setProgress(value);
    }
    const timestamp = Date.now();
    const rotation = assignTo === ROUND_ROBIN ? getRotationReps() : [];
    if (assignTo === ROUND_ROBIN && !rotation.length) toast.warning("No reps are available for round robin; leads were left unassigned.");
    const ownerFor = (index) => {
      if (assignTo === ROUND_ROBIN) return rotation.length ? rotation[index % rotation.length] : null;
      return reps.find((rep) => rep.name === assignTo) || null;
    };
    const leads = review.rows.filter((row) => row._duplicate !== "file").map(({ _duplicate, ...row }, index) => ({
      ...row,
      id: `imported_${timestamp}_${index}`,
      lead_name: row.lead_name,
      name: row.lead_name,
      mobile_number: row.mobile_number || "",
      phone: row.mobile_number || "",
      email: row.email || "",
      city: row.city || "",
      lead_source: row.lead_source || "CSV Upload",
      lead_stage: row.lead_stage || "New",
      lead_priority: Math.min(5, Math.max(1, Number.parseInt(row.lead_priority, 10) || 3)),
      business: row.business || "",
      notes: row.notes || "",
      last_user_remark: row.notes || "",
      tags: row.tags ? row.tags.split(/[;,]/).map((tag) => tag.trim()).filter(Boolean) : [],
      awaiting_first_touch: "YES",
      attempts: 0,
      lead_owner: ownerFor(index),
      next_followup: null,
      created_at: new Date().toISOString(),
    }));
    const updateExisting = duplicateMode === "update";
    const count = onLeadsImported ? onLeadsImported(leads, { updateExisting }) : leads.length;
    const added = Number.isFinite(count) ? count : leads.length;
    const updated = updateExisting ? review.duplicatesExisting : 0;
    const skipped = review.rows.length - added - updated;
    recordImportBatch({ filename: file?.name || "Spreadsheet", totalRows: sheet.rows.length, added, updated, skipped, invalid: review.errors.length });
    setResult({ added, updated, skipped });
    setUploading(false);
    toast.success(`${added} leads imported successfully`, {
      description: [updated && `${updated} existing updated`, skipped && `${skipped} duplicate${skipped === 1 ? "" : "s"} skipped`].filter(Boolean).join(" · ") || "Leads were added to Active Leads.",
    });
  };

  const canContinue = step === 0 ? Boolean(sheet) : step === 1 ? hasNameColumn : Boolean(review?.rows.length);

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => { if (!nextOpen) close(); }}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[620px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-heading text-base font-extrabold">
            <FileSpreadsheet className="h-5 w-5 text-primary" /> Bulk Import Leads via Excel / CSV
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Upload a .csv or Excel file up to 10MB, match its columns to lead fields, then review duplicates before importing.
          </DialogDescription>
        </DialogHeader>

        {result ? (
          <div className="flex flex-col items-center justify-center space-y-3 py-8 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600"><CheckCircle2 className="h-7 w-7" /></div>
            <div>
              <h3 className="font-heading text-base font-bold">Import complete</h3>
              <p className="mt-1 text-xs text-muted-foreground">{result.added} added · {result.updated} updated · {result.skipped} skipped</p>
            </div>
            <Button size="sm" className="h-8 gap-1.5 text-xs" onClick={close}><ArrowRight className="h-3.5 w-3.5" />Done</Button>
          </div>
        ) : (
          <div className="space-y-4 py-1">
            <ol className="flex items-center gap-2 text-[11px]">
              {STEPS.map((label, index) => (
                <li key={label} className="flex items-center gap-2">
                  <span className={cn("flex h-5 w-5 items-center justify-center rounded-full border text-[10px] font-bold", index < step ? "border-emerald-500 bg-emerald-500 text-white" : index === step ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground")}>{index < step ? "✓" : index + 1}</span>
                  <span className={cn("font-medium", index === step ? "text-foreground" : "text-muted-foreground")}>{label}</span>
                  {index < STEPS.length - 1 && <span className="h-px w-6 bg-border" />}
                </li>
              ))}
            </ol>

            {step === 0 && (
              <>
                <section className="rounded-lg border border-border bg-accent/50 p-3">
                  <p className="text-xs font-semibold">Start from a template (optional)</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" className="h-7 gap-1.5 text-xs" onClick={downloadCsvTemplate}><Download className="h-3.5 w-3.5" />CSV Template</Button>
                    <Button variant="outline" size="sm" className="h-7 gap-1.5 text-xs" onClick={downloadExcelTemplate}><Download className="h-3.5 w-3.5" />Excel Template</Button>
                  </div>
                </section>
                {!file ? (
                  <div
                    onDragOver={(event) => { event.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={(event) => { event.preventDefault(); setDragOver(false); processFile(event.dataTransfer.files[0]); }}
                    onClick={() => inputRef.current?.click()}
                    className={cn("cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors", dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50")}
                  >
                    <UploadCloud className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">Drag and drop a .csv, .xlsx, or .xls file, or <span className="font-semibold text-primary">browse</span></p>
                    <input ref={inputRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={(event) => { processFile(event.target.files?.[0]); event.target.value = ""; }} />
                  </div>
                ) : (
                  <div className="flex items-center gap-2 rounded-lg border border-border bg-card p-2.5">
                    <FileSpreadsheet className="h-5 w-5 shrink-0 text-primary" />
                    <div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold">{file.name}</p><p className="text-[11px] text-muted-foreground">{(file.size / 1024).toFixed(1)} KB{sheet ? ` · ${sheet.rows.length} data rows · ${sheet.headers.length} columns` : ""}</p></div>
                    <Button variant="ghost" size="icon" aria-label="Remove file" className="h-7 w-7" onClick={() => { setFile(null); setSheet(null); setReadError(""); }}><X className="h-4 w-4" /></Button>
                  </div>
                )}
                {readError && <div className="flex items-center gap-1.5 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive"><AlertTriangle className="h-3.5 w-3.5" />{readError}</div>}
              </>
            )}

            {step === 1 && sheet && (
              <section className="overflow-hidden rounded-lg border border-border">
                <div className="grid grid-cols-[1fr_1fr] gap-2 border-b border-border bg-muted/40 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground"><span>Spreadsheet column</span><span>CRM field</span></div>
                <div className="max-h-[320px] divide-y divide-border/70 overflow-y-auto">
                  {sheet.headers.map((header, column) => (
                    <div key={`${header}-${column}`} className="grid grid-cols-[1fr_1fr] items-center gap-2 px-3 py-1.5">
                      <div className="min-w-0"><p className="truncate text-xs font-medium">{header || `Column ${column + 1}`}</p><p className="truncate text-[10.5px] text-muted-foreground">e.g. {String(sheet.rows[0]?.[column] ?? "—") || "—"}</p></div>
                      <select
                        aria-label={`CRM field for ${header}`}
                        value={mapping[column] || ""}
                        onChange={(event) => {
                          const value = event.target.value;
                          setMapping((current) => current.map((key, index) => (index === column ? value : key === value && value ? "" : key)));
                        }}
                        className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                      >
                        <option value="">Don’t import</option>
                        {CRM_FIELDS.map((field) => <option key={field.key} value={field.key}>{field.label}{field.required ? " *" : ""}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
                {!hasNameColumn && <p className="flex items-center gap-1.5 border-t border-border bg-destructive/10 px-3 py-2 text-[11px] text-destructive"><AlertTriangle className="h-3.5 w-3.5" />Map one column to “Lead name” to continue.</p>}
              </section>
            )}

            {step === 2 && review && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {[
                    ["Valid rows", review.rows.length, "text-emerald-600"],
                    ["Already in CRM", review.duplicatesExisting, "text-amber-600"],
                    ["Repeated in file", review.duplicatesInFile, "text-amber-600"],
                    ["Invalid rows", review.errors.length, "text-rose-600"],
                  ].map(([label, value, tone]) => (
                    <div key={label} className="rounded-lg border border-border bg-card p-2.5"><p className="text-[10.5px] text-muted-foreground">{label}</p><p className={cn("text-lg font-bold", tone)}>{value}</p></div>
                  ))}
                </div>
                <label className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border p-3 text-xs">
                  <span><span className="font-semibold">Assign imported leads</span><span className="block text-[11px] text-muted-foreground">Requires admin or manager role once roles are connected.</span></span>
                  <select value={assignTo} onChange={(event) => setAssignTo(event.target.value)} className="h-8 min-w-[220px] rounded-md border border-input bg-background px-2 text-xs">
                    <option value="">Leave unassigned (triage in Distributions)</option>
                    <option value={ROUND_ROBIN}>Round robin across available reps</option>
                    {reps.map((rep) => <option key={rep.name} value={rep.name}>Assign all to {rep.name}</option>)}
                  </select>
                </label>
                {review.duplicatesExisting > 0 && (
                  <fieldset className="space-y-1.5 rounded-lg border border-border p-3">
                    <legend className="px-1 text-xs font-semibold">Rows whose phone number or email already exists</legend>
                    {[["skip", "Skip duplicates (recommended)", "Existing leads stay untouched."], ["update", "Update existing leads", "Fill the existing lead with the non-empty values from this file."]].map(([value, label, hint]) => (
                      <label key={value} className="flex cursor-pointer items-start gap-2 text-xs">
                        <input type="radio" name="duplicate-mode" value={value} checked={duplicateMode === value} onChange={() => setDuplicateMode(value)} className="mt-0.5" />
                        <span><span className="font-medium">{label}</span><span className="block text-[11px] text-muted-foreground">{hint}</span></span>
                      </label>
                    ))}
                  </fieldset>
                )}
                <div className="overflow-hidden rounded-lg border border-border">
                  <div className="max-h-[200px] overflow-auto">
                    <table className="w-full text-left text-[11px]">
                      <thead className="sticky top-0 bg-muted/60 text-[10px] uppercase text-muted-foreground"><tr><th className="px-2 py-1.5">Lead</th><th className="px-2 py-1.5">Mobile</th><th className="px-2 py-1.5">City</th><th className="px-2 py-1.5">Status</th></tr></thead>
                      <tbody className="divide-y divide-border/60">
                        {review.rows.slice(0, 50).map((row, index) => (
                          <tr key={index}>
                            <td className="px-2 py-1 font-medium">{row.lead_name}</td>
                            <td className="px-2 py-1 font-mono">{row.mobile_number || "—"}</td>
                            <td className="px-2 py-1">{row.city || "—"}</td>
                            <td className="px-2 py-1">{row._duplicate === "existing" ? <span className="text-amber-600">{duplicateMode === "update" ? "Will update" : "Will skip"}</span> : row._duplicate === "file" ? <span className="text-amber-600">Repeated · skip</span> : <span className="text-emerald-600">New</span>}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {review.rows.length > 50 && <p className="border-t border-border px-2 py-1 text-center text-[10.5px] text-muted-foreground">Showing 50 of {review.rows.length} rows</p>}
                </div>
                {review.errors.length > 0 && <div className="space-y-1 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive"><div className="flex items-center gap-1.5 font-semibold"><AlertTriangle className="h-3.5 w-3.5" />{review.errors.length} row(s) will be ignored</div>{review.errors.slice(0, 4).map((error, index) => <p key={index} className="pl-5 text-[11px]">{error}</p>)}</div>}
                {uploading && <div className="space-y-1.5"><div className="flex justify-between text-xs"><span className="text-muted-foreground">Importing leads…</span><span className="font-mono font-semibold text-primary">{progress}%</span></div><Progress value={progress} className="h-2" /></div>}
              </div>
            )}

            <div className="flex items-start gap-2 text-[11px] text-muted-foreground"><Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" /><span>Duplicates are matched on phone number or email. Imported records are marked as awaiting first touch.</span></div>
          </div>
        )}

        {!result && (
          <DialogFooter className="gap-2">
            {step > 0 ? <Button variant="outline" size="sm" className="h-8 gap-1 text-xs" disabled={uploading} onClick={() => setStep(step - 1)}><ArrowLeft className="h-3.5 w-3.5" />Back</Button> : <Button variant="outline" size="sm" className="h-8 text-xs" onClick={close}>Cancel</Button>}
            {step < 2
              ? <Button size="sm" className="h-8 gap-1.5 text-xs" disabled={!canContinue} onClick={() => setStep(step + 1)}>Continue<ArrowRight className="h-3.5 w-3.5" /></Button>
              : <Button size="sm" className="h-8 gap-1.5 text-xs" disabled={!canContinue || uploading} onClick={importRows}><UploadCloud className="h-3.5 w-3.5" />{uploading ? "Importing…" : `Import ${review?.rows.length ?? 0} rows`}</Button>}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
