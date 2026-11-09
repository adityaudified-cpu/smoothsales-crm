"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowDownToLine, Eye, FileAudio, FileImage, FileSpreadsheet, FileText, HardDrive, Search, Trash2, UploadCloud, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLeads } from "@/lib/hooks/use-leads";
import { addLeadDocument, deleteLeadDocument, documentKind, downloadLeadDocument, formatFileSize, listLeadDocuments } from "@/lib/document-store";
import { DOCUMENT_CATEGORIES } from "@/lib/leads-workspace";
import { DocumentPreviewDialog } from "@/components/leads/document-preview-dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { LeadsPageHeader } from "@/components/leads/leads-page-header";


const MAX_SIZE = 25 * 1024 * 1024;
const ACCEPT = ".pdf,.dwg,.dxf,.png,.jpg,.jpeg,.webp,.xlsx,.xls,.csv,.docx,.doc,.pptx,.txt,.zip,.webm,.mp3,.m4a,.wav";
const SORTS = { newest: "Newest first", oldest: "Oldest first", name: "Name A–Z", size: "Largest first" };

const CATEGORY_STYLES = {
  Quotation: "bg-amber-500/10 text-amber-700 border-amber-500/20 dark:text-amber-300",
  Floorplan: "bg-indigo-500/10 text-indigo-700 border-indigo-500/20 dark:text-indigo-300",
  KYC: "bg-rose-500/10 text-rose-700 border-rose-500/20 dark:text-rose-300",
  Receipt: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:text-emerald-300",
  Agreement: "bg-sky-500/10 text-sky-700 border-sky-500/20 dark:text-sky-300",
  "Voice Note": "bg-purple-500/10 text-purple-700 border-purple-500/20 dark:text-purple-300",
  Other: "bg-muted text-muted-foreground border-border",
};

function FileIcon({ document }) {
  const kind = documentKind(document);
  if (kind === "image") return <FileImage className="h-4 w-4 shrink-0 text-indigo-500" />;
  if (kind === "audio") return <FileAudio className="h-4 w-4 shrink-0 text-purple-500" />;
  if (/\.(xlsx?|csv)$/i.test(document.filename)) return <FileSpreadsheet className="h-4 w-4 shrink-0 text-emerald-600" />;
  return <FileText className="h-4 w-4 shrink-0 text-primary" />;
}

export default function LeadDocumentsPage() {
  const { data: leads } = useLeads();
  const [documents, setDocuments] = useState([]);
  const [leadId, setLeadId] = useState("");
  const [leadQuery, setLeadQuery] = useState("");
  const [category, setCategory] = useState("Quotation");
  const [pendingFiles, setPendingFiles] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [sort, setSort] = useState("newest");
  const [previewDocument, setPreviewDocument] = useState(null);
  const inputRef = useRef(null);
  const leadMap = useMemo(() => new Map(leads.map((lead) => [String(lead.id), lead])), [leads]);

  const leadOptions = useMemo(() => {
    const q = leadQuery.toLowerCase().trim();
    return leads.filter((lead) => !q || `${lead.lead_name || lead.name} ${lead.mobile_number || ""} ${lead.business || ""}`.toLowerCase().includes(q)).slice(0, 200);
  }, [leads, leadQuery]);

  const loadDocuments = useCallback(async () => {
    try {
      setDocuments((await listLeadDocuments()) || []);
    } catch (error) {
      toast.error("Could not load documents", { description: error.message });
    }
  }, []);
  useEffect(() => { loadDocuments(); }, [loadDocuments]);

  const queueFiles = (fileList) => {
    const files = [...(fileList || [])];
    const tooLarge = files.filter((file) => file.size > MAX_SIZE);
    if (tooLarge.length) toast.error(`${tooLarge.length} file(s) skipped`, { description: "Maximum file size is 25MB." });
    setPendingFiles((current) => [...current, ...files.filter((file) => file.size <= MAX_SIZE)]);
  };

  const upload = async () => {
    if (!leadId) return toast.error("Choose a lead to link these documents to");
    if (!pendingFiles.length) return toast.error("Add at least one file");
    setBusy(true);
    const lead = leadMap.get(String(leadId));
    try {
      for (const file of pendingFiles) {
        await addLeadDocument({
          id: `doc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          leadId: String(leadId),
          leadName: lead?.lead_name || lead?.name || "Unknown lead",
          category,
          filename: file.name,
          mimeType: file.type || "application/octet-stream",
          size: file.size,
          uploadedAt: new Date().toISOString(),
          blob: file,
        });
      }
      toast.success(`${pendingFiles.length} document${pendingFiles.length === 1 ? "" : "s"} linked to ${lead?.lead_name || "lead"}`);
      setPendingFiles([]);
      await loadDocuments();
    } catch (error) {
      toast.error("Document could not be saved", { description: error.message });
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const remove = async (document) => {
    if (!window.confirm(`Delete “${document.filename}”?`)) return;
    try {
      await deleteLeadDocument(document.id);
      setDocuments((current) => current.filter((item) => item.id !== document.id));
      toast.success("Document deleted");
    } catch (error) {
      toast.error("Could not delete document", { description: error.message });
    }
  };

  const download = (document) => { if (!downloadLeadDocument(document)) toast.error("This saved document has no file data"); };

  const categoryCounts = useMemo(() => documents.reduce((counts, document) => {
    const key = document.category || "Other";
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {}), [documents]);

  const visibleDocuments = useMemo(() => {
    const q = query.toLowerCase().trim();
    const list = documents.filter((document) => (categoryFilter === "All" || (document.category || "Other") === categoryFilter) && `${document.filename} ${document.leadName}`.toLowerCase().includes(q));
    const sorters = {
      newest: (a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt),
      oldest: (a, b) => new Date(a.uploadedAt) - new Date(b.uploadedAt),
      name: (a, b) => a.filename.localeCompare(b.filename),
      size: (a, b) => b.size - a.size,
    };
    return list.sort(sorters[sort]);
  }, [documents, query, categoryFilter, sort]);

  const totalSize = documents.reduce((sum, document) => sum + (document.size || 0), 0);

  return (
    <div className="flex w-full flex-col gap-4 pb-10">
      <LeadsPageHeader icon={FileText} title="Lead Documents & Attachments" subtitle="Floorplans, quotations, KYC and receipts linked to each lead.">
        <span className="inline-flex items-center gap-1.5 rounded-md border border-border px-2 py-1 text-[11px] text-muted-foreground"><HardDrive className="h-3.5 w-3.5" />{documents.length} files · {formatFileSize(totalSize)}</span>
      </LeadsPageHeader>

      <section className="grid gap-3 rounded-xl border border-border bg-card p-4 lg:grid-cols-[minmax(240px,1fr)_minmax(280px,1.4fr)]">
        <div className="space-y-3">
          <label className="flex flex-col gap-1 text-xs font-medium">Attach to lead
            <div className="relative"><Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" /><input value={leadQuery} onChange={(event) => setLeadQuery(event.target.value)} placeholder="Search lead name, phone or company" className="h-9 w-full rounded-md border border-input bg-background pl-8 pr-2 text-xs" /></div>
            <select className="h-9 rounded-md border border-input bg-background px-2 text-xs" value={leadId} onChange={(event) => setLeadId(event.target.value)}><option value="">Choose a lead… ({leadOptions.length})</option>{leadOptions.map((lead) => <option key={lead.id} value={lead.id}>{lead.lead_name || lead.name}{lead.mobile_number ? ` · ${lead.mobile_number}` : ""}</option>)}</select>
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium">Category
            <select className="h-9 rounded-md border border-input bg-background px-2 text-xs" value={category} onChange={(event) => setCategory(event.target.value)}>{DOCUMENT_CATEGORIES.map((value) => <option key={value}>{value}</option>)}</select>
          </label>
        </div>
        <div className="flex flex-col gap-2">
          <div
            role="button"
            tabIndex={0}
            onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") inputRef.current?.click(); }}
            onClick={() => inputRef.current?.click()}
            onDragOver={(event) => { event.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(event) => { event.preventDefault(); setDragOver(false); queueFiles(event.dataTransfer.files); }}
            className={cn("flex min-h-[110px] flex-1 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-4 text-center transition-colors", dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50")}
          >
            <UploadCloud className="mb-1 h-6 w-6 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Drop files here or <span className="font-semibold text-primary">browse</span></p>
            <p className="text-[10.5px] text-muted-foreground">PDF, DWG, images, Office files, audio · up to 25MB each</p>
            <input ref={inputRef} type="file" multiple accept={ACCEPT} className="hidden" onChange={(event) => { queueFiles(event.target.files); event.target.value = ""; }} />
          </div>
          {pendingFiles.length > 0 && <div className="flex flex-wrap gap-1.5">{pendingFiles.map((file, index) => <span key={`${file.name}-${index}`} className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/40 px-2 py-0.5 text-[11px]">{file.name}<span className="text-muted-foreground">{formatFileSize(file.size)}</span><button type="button" aria-label={`Remove ${file.name}`} onClick={() => setPendingFiles((current) => current.filter((_, i) => i !== index))} className="text-muted-foreground hover:text-foreground"><X className="h-3 w-3" /></button></span>)}</div>}
          <Button type="button" size="sm" className="h-9 gap-1.5 self-end text-xs" disabled={busy || !leadId || !pendingFiles.length} onClick={upload}><UploadCloud className="h-3.5 w-3.5" />{busy ? "Uploading…" : `Upload ${pendingFiles.length || ""} Document${pendingFiles.length === 1 ? "" : "s"}`}</Button>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-3">
          <div className="flex flex-wrap gap-1.5">
            {["All", ...DOCUMENT_CATEGORIES].map((value) => {
              const count = value === "All" ? documents.length : categoryCounts[value] || 0;
              if (value !== "All" && !count && categoryFilter !== value) return null;
              return <button key={value} type="button" onClick={() => setCategoryFilter(value)} className={cn("rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors", categoryFilter === value ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-muted")}>{value} <span className="opacity-70">{count}</span></button>;
            })}
          </div>
          <div className="flex w-full items-center gap-2 sm:w-auto">
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search file or lead" className="h-8 w-full rounded-md border border-input bg-background px-2.5 text-xs sm:w-56" />
            <select aria-label="Sort documents" value={sort} onChange={(event) => setSort(event.target.value)} className="h-8 rounded-md border border-input bg-background px-2 text-xs">{Object.entries(SORTS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
          </div>
        </div>
        {visibleDocuments.length ? <div className="divide-y divide-border/70">{visibleDocuments.map((document) => (
          <div key={document.id} className="flex flex-wrap items-center gap-3 px-4 py-2.5 hover:bg-muted/20">
            <FileIcon document={document} />
            <button type="button" className="min-w-[180px] flex-1 text-left" onClick={() => setPreviewDocument(document)}>
              <p className="truncate text-xs font-semibold hover:text-primary">{document.filename}</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">{formatFileSize(document.size)} · {new Date(document.uploadedAt).toLocaleDateString()}</p>
            </button>
            <Link href={`/leads/active/${document.leadId}`} className="rounded-full border border-border bg-muted/40 px-2 py-0.5 text-[11px] hover:border-primary/40">{document.leadName}</Link>
            <span className={cn("rounded-full border px-2 py-0.5 text-[10.5px] font-semibold", CATEGORY_STYLES[document.category || "Other"] || CATEGORY_STYLES.Other)}>{document.category || "Other"}</span>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={`Preview ${document.filename}`} onClick={() => setPreviewDocument(document)}><Eye className="h-3.5 w-3.5" /></Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={`Download ${document.filename}`} onClick={() => download(document)}><ArrowDownToLine className="h-3.5 w-3.5" /></Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" aria-label={`Delete ${document.filename}`} onClick={() => remove(document)}><Trash2 className="h-3.5 w-3.5" /></Button>
            </div>
          </div>
        ))}</div> : <div className="p-10 text-center text-xs text-muted-foreground">{query || categoryFilter !== "All" ? "No documents match these filters." : "No documents uploaded yet. Choose a lead and upload a file above."}</div>}
      </section>
      <DocumentPreviewDialog document={previewDocument} onOpenChange={(open) => !open && setPreviewDocument(null)} />
    </div>
  );
}
