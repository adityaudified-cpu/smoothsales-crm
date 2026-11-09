"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Building, ChevronRight, Crown, FileText, Globe, IndianRupee, Mail, MapPin, Pencil, Phone, Plus, Search, Star, Trash2, Unlink, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useLeads } from "@/lib/hooks/use-leads";
import { usePersistedState } from "@/lib/hooks/use-persisted-state";
import { listLeadDocuments, formatFileSize } from "@/lib/document-store";
import { estimateDealValue } from "@/lib/leads-workspace";
import { formatINR } from "@/lib/format-cell-value";
import { DocumentPreviewDialog } from "@/components/leads/document-preview-dialog";
import { toast } from "sonner";
import { LeadsPageHeader } from "@/components/leads/leads-page-header";
import { BusinessFormDialog } from "@/components/leads/business-form-dialog";

const STORAGE_KEY = "smoothsales_lead_business_accounts_v1";
const NEW_BUSINESS = "__new__";

export default function BusinessesPage() {
  const { data: leads, batchUpdateLeads } = useLeads();
  const [savedAccounts, setSavedAccounts] = usePersistedState(STORAGE_KEY, []);
  const [formState, setFormState] = useState(null); // { mode: "add" } | { mode: "edit", account }
  const [query, setQuery] = useState("");
  const [openAccountName, setOpenAccountName] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [previewDocument, setPreviewDocument] = useState(null);
  const [attachLeadId, setAttachLeadId] = useState("");
  const savedList = Array.isArray(savedAccounts) ? savedAccounts : [];

  useEffect(() => { listLeadDocuments().then((items) => setDocuments(items || [])).catch(() => setDocuments([])); }, []);

  const accounts = useMemo(() => {
    const names = new Map(savedList.map((account) => [account.name.toLowerCase(), account.name]));
    leads.forEach((lead) => { const name = lead.business?.trim(); if (name && !names.has(name.toLowerCase())) names.set(name.toLowerCase(), name); });
    return [...names.values()].sort((a, b) => a.localeCompare(b)).map((name) => {
      const meta = savedList.find((account) => account.name.toLowerCase() === name.toLowerCase()) || {};
      const associated = leads.filter((lead) => lead.business?.trim().toLowerCase() === name.toLowerCase());
      const primary = associated.find((lead) => String(lead.id) === String(meta.primaryLeadId)) || [...associated].sort((a, b) => (b.lead_priority || 0) - (a.lead_priority || 0))[0];
      return {
        name,
        meta,
        leads: associated,
        primary,
        dealValue: associated.reduce((sum, lead) => sum + estimateDealValue(lead), 0),
        collected: associated.reduce((sum, lead) => sum + (Number(lead.total_payment) || 0), 0),
        cities: [...new Set([meta.city, ...associated.map((lead) => lead.city)].filter(Boolean))],
      };
    });
  }, [leads, savedList]);

  const visibleAccounts = accounts.filter((account) => `${account.name} ${account.cities.join(" ")} ${account.leads.map((lead) => lead.lead_name).join(" ")}`.toLowerCase().includes(query.toLowerCase().trim()));
  const unlinkedLeads = leads.filter((lead) => !lead.business?.trim());
  const openAccount = accounts.find((account) => account.name === openAccountName) || null;
  const accountDocuments = openAccount ? documents.filter((document) => openAccount.leads.some((lead) => String(lead.id) === String(document.leadId))) : [];

  const upsertMeta = (name, patch) => setSavedAccounts((current) => {
    const list = Array.isArray(current) ? current : [];
    const exists = list.some((account) => account.name.toLowerCase() === name.toLowerCase());
    return exists ? list.map((account) => (account.name.toLowerCase() === name.toLowerCase() ? { ...account, ...patch } : account)) : [...list, { id: `business_${Date.now()}`, name, ...patch }];
  });

  const submitBusiness = (values) => {
    if (formState?.mode === "edit") {
      const previousName = formState.account.name;
      setSavedAccounts((current) => {
        const list = Array.isArray(current) ? current : [];
        const exists = list.some((account) => account.name.toLowerCase() === previousName.toLowerCase());
        const patch = (account) => ({ ...account, ...values });
        return exists ? list.map((account) => (account.name.toLowerCase() === previousName.toLowerCase() ? patch(account) : account)) : [...list, { id: `business_${Date.now()}`, ...values }];
      });
      // Renaming carries the linked leads over to the new name.
      if (values.name !== previousName && formState.account.leads.length) batchUpdateLeads(formState.account.leads.map((lead) => lead.id), { business: values.name });
      if (openAccountName === previousName) setOpenAccountName(values.name);
      toast.success("Business updated");
    } else {
      setSavedAccounts((current) => [...(Array.isArray(current) ? current : []), { id: `business_${Date.now()}`, ...values }]);
      if (formState?.linkLeadId) assignLead(formState.linkLeadId, values.name);
      else toast.success("Business added", { description: values.name });
    }
    setFormState(null);
  };

  const assignLead = (leadId, business) => {
    batchUpdateLeads([leadId], { business });
    toast.success(business ? `Lead linked to ${business}` : "Business link removed");
  };

  const linkToNewBusiness = (leadId) => setFormState({ mode: "add", linkLeadId: leadId });

  const removeEmptyAccount = (accountName) => {
    setSavedAccounts((current) => (Array.isArray(current) ? current.filter((account) => account.name !== accountName) : []));
    toast.success("Empty business account removed");
  };

  const totalPotential = accounts.reduce((sum, account) => sum + account.dealValue, 0);

  return (
    <div className="flex w-full flex-col gap-4 pb-10">
      <LeadsPageHeader icon={Building} title="Businesses & Parent Accounts" subtitle="Group every stakeholder of a company or project under one account.">
        <Button size="sm" className="h-8 gap-1.5 text-xs" onClick={() => setFormState({ mode: "add" })}><Plus className="h-3.5 w-3.5" />Add Business</Button>
      </LeadsPageHeader>

      <div className="grid gap-3 sm:grid-cols-4">
        {[["Accounts", accounts.length], ["Linked leads", accounts.reduce((sum, account) => sum + account.leads.length, 0)], ["Unlinked leads", unlinkedLeads.length], ["Combined potential", formatINR(totalPotential)]].map(([label, value]) => (
          <div key={label} className="rounded-xl border border-border bg-card p-3"><p className="text-[11px] text-muted-foreground">{label}</p><p className="mt-1 text-lg font-bold">{value}</p></div>
        ))}
      </div>


      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
          <h2 className="text-xs font-semibold">Business accounts <span className="font-normal text-muted-foreground">· {visibleAccounts.length}</span></h2>
          <div className="relative w-full max-w-xs"><Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search business, city or contact" className="h-8 w-full rounded-md border border-input bg-background pl-8 pr-2 text-xs" /></div>
        </div>
        {visibleAccounts.length ? <div className="divide-y divide-border/70">{visibleAccounts.map((account) => <section key={account.name} className="grid gap-3 px-4 py-3 md:grid-cols-[minmax(180px,1fr)_minmax(220px,1.4fr)_auto] md:items-center">
          <button type="button" className="min-w-0 text-left" onClick={() => setOpenAccountName(account.name)}>
            <p className="truncate text-sm font-semibold hover:text-primary">{account.name}</p>
            <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground"><MapPin className="h-3 w-3" />{account.cities.length ? account.cities.join(", ") : "No location recorded"}</p>
          </button>
          <div className="flex flex-wrap items-center gap-1.5">{account.leads.length ? account.leads.slice(0, 5).map((lead) => <Link key={lead.id} className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/40 px-2 py-1 text-[11px] hover:border-primary/40" href={`/leads/active/${lead.id}`}>{account.primary?.id === lead.id && <Crown className="h-3 w-3 text-amber-500" />}{lead.lead_name || lead.name}</Link>) : <span className="text-[11px] text-muted-foreground">No leads linked</span>}{account.leads.length > 5 && <span className="text-[11px] text-muted-foreground">+{account.leads.length - 5} more</span>}</div>
          <div className="flex items-center justify-between gap-3 md:justify-end">
            <span className="font-mono text-xs font-semibold text-emerald-700 dark:text-emerald-400" title="Estimated from linked leads’ budget">{formatINR(account.dealValue)}</span>
            <span className="inline-flex items-center gap-1 text-xs font-medium"><Users className="h-3.5 w-3.5 text-muted-foreground" />{account.leads.length}</span>
            {!account.leads.length && <Button variant="ghost" size="icon" aria-label={`Remove ${account.name}`} className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => removeEmptyAccount(account.name)}><Trash2 className="h-3.5 w-3.5" /></Button>}
            <Button variant="ghost" size="sm" className="h-7 gap-0.5 px-2 text-[11px]" onClick={() => setOpenAccountName(account.name)}>360<ChevronRight className="h-3 w-3" /></Button>
          </div>
        </section>)}</div> : <div className="p-10 text-center text-xs text-muted-foreground">{query ? "No businesses match that search." : "No businesses yet. Add an account above or import a lead with a company name."}</div>}
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="border-b border-border px-4 py-3"><h2 className="text-xs font-semibold">Unlinked leads <span className="font-normal text-muted-foreground">· {unlinkedLeads.length}</span></h2><p className="mt-0.5 text-[11px] text-muted-foreground">Attach each lead to an existing account, or create a new one from here.</p></div>
        {unlinkedLeads.length ? <div className="divide-y divide-border/70">{unlinkedLeads.map((lead) => <div key={lead.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5"><Link href={`/leads/active/${lead.id}`} className="text-xs font-medium hover:text-primary">{lead.lead_name || lead.name}<span className="ml-2 font-normal text-muted-foreground">{lead.city}</span></Link><select aria-label={`Link ${lead.lead_name || lead.name} to a business`} className="h-8 min-w-[220px] rounded-md border border-input bg-background px-2 text-xs" value="" onChange={(event) => { const value = event.target.value; if (value === NEW_BUSINESS) linkToNewBusiness(lead.id); else if (value) assignLead(lead.id, value); }}><option value="">Select business…</option>{accounts.map((account) => <option key={account.name} value={account.name}>{account.name}</option>)}<option value={NEW_BUSINESS}>+ Create new business…</option></select></div>)}</div> : <div className="p-8 text-center text-xs text-muted-foreground">Every lead is linked to a business.</div>}
      </div>

      <Sheet open={Boolean(openAccount)} onOpenChange={(open) => { if (!open) { setOpenAccountName(null); setAttachLeadId(""); } }}>
        <SheetContent side="right" className="flex w-full flex-col gap-0 overflow-y-auto p-0 sm:max-w-md">
          {openAccount && <>
            <SheetHeader className="border-b border-border p-4 text-left">
              <SheetTitle className="flex items-center gap-2 text-base"><Building className="h-4 w-4 text-primary" />{openAccount.name}</SheetTitle>
              <SheetDescription className="text-[11px]">{[openAccount.meta.industry, openAccount.cities.join(", ") || "No location"].filter(Boolean).join(" · ")} · {openAccount.leads.length} contact{openAccount.leads.length === 1 ? "" : "s"}</SheetDescription>
              <Button size="sm" variant="outline" className="mt-1 h-7 w-fit gap-1 text-[11px]" onClick={() => setFormState({ mode: "edit", account: openAccount })}><Pencil className="h-3 w-3" />Edit details</Button>
            </SheetHeader>
            <div className="space-y-4 p-4">
              {(openAccount.meta.phone || openAccount.meta.email || openAccount.meta.website || openAccount.meta.address || openAccount.meta.notes) && (
                <div className="space-y-1 rounded-lg border border-border p-3 text-[11.5px]">
                  {openAccount.meta.phone && <a href={`tel:${openAccount.meta.phone.replace(/[^\d+]/g, "")}`} className="flex items-center gap-1.5 font-mono hover:text-primary"><Phone className="h-3 w-3 text-muted-foreground" />{openAccount.meta.phone}</a>}
                  {openAccount.meta.email && <a href={`mailto:${openAccount.meta.email}`} className="flex items-center gap-1.5 hover:text-primary"><Mail className="h-3 w-3 text-muted-foreground" />{openAccount.meta.email}</a>}
                  {openAccount.meta.website && <a href={/^https?:/i.test(openAccount.meta.website) ? openAccount.meta.website : `https://${openAccount.meta.website}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-primary"><Globe className="h-3 w-3 text-muted-foreground" />{openAccount.meta.website}</a>}
                  {openAccount.meta.address && <p className="flex items-center gap-1.5"><MapPin className="h-3 w-3 text-muted-foreground" />{openAccount.meta.address}</p>}
                  {openAccount.meta.notes && <p className="border-t border-border pt-1.5 text-muted-foreground">{openAccount.meta.notes}</p>}
                </div>
              )}
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-2.5"><p className="flex items-center gap-1 text-[10px] font-bold uppercase text-emerald-800 dark:text-emerald-300"><IndianRupee className="h-3 w-3" />Combined potential</p><p className="font-mono text-base font-extrabold text-emerald-700 dark:text-emerald-300">{formatINR(openAccount.dealValue)}</p></div>
                <div className="rounded-lg border border-border p-2.5"><p className="text-[10px] font-bold uppercase text-muted-foreground">Collected</p><p className="font-mono text-base font-extrabold">{formatINR(openAccount.collected)}</p></div>
              </div>

              {openAccount.primary && <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
                <p className="mb-1 flex items-center gap-1 text-[10px] font-bold uppercase text-amber-700 dark:text-amber-300"><Crown className="h-3 w-3" />Primary contact</p>
                <p className="text-sm font-semibold">{openAccount.primary.lead_name}</p>
                <p className="text-[11px] text-muted-foreground">{openAccount.primary.designation || "—"} · {openAccount.primary.lead_owner?.name || "Unassigned"}</p>
                {openAccount.primary.mobile_number && <a href={`tel:${openAccount.primary.mobile_number.replace(/[^\d+]/g, "")}`} className="mt-1 inline-flex items-center gap-1 font-mono text-xs text-emerald-700 hover:underline dark:text-emerald-400"><Phone className="h-3 w-3" />{openAccount.primary.mobile_number}</a>}
              </div>}

              <section>
                <h3 className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Stakeholders</h3>
                <div className="divide-y divide-border/70 rounded-lg border border-border">
                  {openAccount.leads.map((lead) => (
                    <div key={lead.id} className="flex items-center gap-2 px-3 py-2">
                      <Link href={`/leads/active/${lead.id}`} className="min-w-0 flex-1"><p className="truncate text-xs font-semibold hover:text-primary">{lead.lead_name}</p><p className="truncate text-[10.5px] text-muted-foreground">{lead.designation || "—"} · {lead.lead_stage} · {formatINR(estimateDealValue(lead))}</p></Link>
                      <Button variant="ghost" size="icon" className="h-7 w-7" title="Make primary contact" aria-label={`Make ${lead.lead_name} primary contact`} onClick={() => { upsertMeta(openAccount.name, { primaryLeadId: lead.id }); toast.success(`${lead.lead_name} is now the primary contact`); }}><Star className={openAccount.primary?.id === lead.id ? "h-3.5 w-3.5 fill-amber-400 text-amber-500" : "h-3.5 w-3.5 text-muted-foreground"} /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" title="Unlink from business" aria-label={`Unlink ${lead.lead_name}`} onClick={() => assignLead(lead.id, "")}><Unlink className="h-3.5 w-3.5" /></Button>
                    </div>
                  ))}
                  {!openAccount.leads.length && <p className="p-4 text-center text-[11px] text-muted-foreground">No contacts linked yet.</p>}
                </div>
                {unlinkedLeads.length > 0 && <div className="mt-2 flex gap-2"><select aria-label="Add stakeholder" value={attachLeadId} onChange={(event) => setAttachLeadId(event.target.value)} className="h-8 flex-1 rounded-md border border-input bg-background px-2 text-xs"><option value="">Add an unlinked lead…</option>{unlinkedLeads.map((lead) => <option key={lead.id} value={lead.id}>{lead.lead_name}</option>)}</select><Button size="sm" className="h-8 text-xs" disabled={!attachLeadId} onClick={() => { assignLead(attachLeadId, openAccount.name); setAttachLeadId(""); }}>Add</Button></div>}
              </section>

              <section>
                <h3 className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Shared documents · {accountDocuments.length}</h3>
                {accountDocuments.length ? <div className="space-y-1">{accountDocuments.map((document) => <button key={document.id} type="button" onClick={() => setPreviewDocument(document)} className="flex w-full items-center gap-2 rounded-md border border-border bg-muted/30 p-2 text-left hover:bg-muted/60"><FileText className="h-3.5 w-3.5 shrink-0 text-primary" /><span className="min-w-0 flex-1"><span className="block truncate text-[11px] font-semibold">{document.filename}</span><span className="text-[10px] text-muted-foreground">{document.leadName} · {document.category || "Other"} · {formatFileSize(document.size)}</span></span></button>)}</div> : <p className="text-[11px] text-muted-foreground">No documents uploaded for these contacts. <Link href="/leads/documents" className="text-primary hover:underline">Upload in Documents</Link></p>}
              </section>
            </div>
          </>}
        </SheetContent>
      </Sheet>
      {formState && (
        <BusinessFormDialog
          key={formState.mode === "edit" ? formState.account.name : "add"}
          open
          onOpenChange={(open) => !open && setFormState(null)}
          initial={formState.mode === "edit" ? { ...formState.account.meta, name: formState.account.name, city: formState.account.meta.city || formState.account.cities[0] || "" } : null}
          existingNames={accounts.map((account) => account.name)}
          onSubmit={submitBusiness}
        />
      )}
      <DocumentPreviewDialog document={previewDocument} onOpenChange={(open) => !open && setPreviewDocument(null)} />
    </div>
  );
}
