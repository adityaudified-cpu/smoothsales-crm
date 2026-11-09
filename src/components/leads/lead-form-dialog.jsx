"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, UserPlus, UserRoundPen } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DEFAULT_PIPELINE_STAGES } from "@/lib/tenant-config";
import { LEAD_SOURCE_OPTIONS } from "@/lib/api/mappers";
import { useTeamMembers } from "@/lib/hooks/use-team-members";

const BUDGET_BANDS = ["< ₹10 Lakhs", "₹10L - ₹25L", "₹25L - ₹50L", "₹50L - ₹1 Crore", "> ₹1 Crore"];
const digits = (value) => String(value || "").replace(/\D/g, "");
const toLocalInput = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

function initialForm(lead) {
  return {
    lead_name: lead?.lead_name || "",
    mobile_number: lead?.mobile_number || "",
    alternate_phone: lead?.alternate_phone || "",
    email: lead?.email || "",
    business: lead?.business || "",
    designation: lead?.designation || "",
    city: lead?.city || "",
    lead_source: lead?.lead_source || "Manual",
    lead_stage: lead?.lead_stage || "New Lead",
    owner: lead?.lead_owner?.name || "",
    lead_priority: String(lead?.lead_priority || 3),
    budget_range: lead?.budget_range || "",
    preferred_service: lead?.preferred_service || "",
    next_followup: toLocalInput(lead?.next_followup),
    last_user_remark: lead?.last_user_remark || "",
    whatsapp_consent: lead ? lead.whatsapp_consent !== false : true,
    call_consent: lead ? lead.call_consent !== false : true,
  };
}

// Create (no `lead`) or edit (`lead` given). Remount with a `key` per lead so the form resets.
export function LeadFormDialog({ open, onOpenChange, lead = null, existingLeads = [], onSubmit }) {
  const editing = Boolean(lead);
  const { reps } = useTeamMembers();
  const [form, setForm] = useState(() => initialForm(lead));
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const set = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.type === "checkbox" ? event.target.checked : event.target.value }));

  // Live duplicate check on phone (last 10 digits) and email, ignoring the lead being edited.
  const duplicate = useMemo(() => {
    const phone = digits(form.mobile_number).slice(-10);
    const email = form.email.trim().toLowerCase();
    return existingLeads.find((item) => item.id !== lead?.id && (
      (phone.length >= 10 && digits(item.mobile_number || item.phone).slice(-10) === phone) ||
      (email && String(item.email || "").toLowerCase() === email)
    ));
  }, [form.mobile_number, form.email, existingLeads, lead]);

  const submit = async (event) => {
    event.preventDefault();
    const name = form.lead_name.trim();
    if (name.length < 2) return setError("Enter the lead’s name");
    if (digits(form.mobile_number).length < 10) return setError("Enter a valid 10-digit mobile number");
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email.trim())) return setError("Enter a valid email");
    if (duplicate) return setError(`This ${digits(duplicate.mobile_number).slice(-10) === digits(form.mobile_number).slice(-10) ? "phone number" : "email"} already belongs to ${duplicate.lead_name}`);
    const followup = form.next_followup ? new Date(form.next_followup) : null;
    const rep = reps.find((item) => item.name === form.owner);
    const values = {
      lead_name: name,
      name,
      mobile_number: form.mobile_number.trim(),
      phone: form.mobile_number.trim(),
      alternate_phone: form.alternate_phone.trim(),
      email: form.email.trim(),
      business: form.business.trim(),
      designation: form.designation.trim(),
      city: form.city.trim(),
      lead_source: form.lead_source,
      lead_stage: form.lead_stage,
      lead_owner: rep ? { id: rep.id, name: rep.name, initials: rep.initials } : lead?.lead_owner && lead.lead_owner.name === form.owner ? lead.lead_owner : null,
      lead_priority: Number(form.lead_priority),
      budget_range: form.budget_range,
      preferred_service: form.preferred_service.trim(),
      next_followup: followup && !Number.isNaN(followup.getTime()) ? followup.toISOString() : null,
      last_user_remark: form.last_user_remark.trim(),
      whatsapp_consent: form.whatsapp_consent,
      call_consent: form.call_consent,
    };
    setSaving(true);
    setError("");
    try {
      await onSubmit(values);
    } catch (submitError) {
      setError(submitError.message || "Could not save the lead");
    } finally {
      setSaving(false);
    }
  };

  const field = (key, label, props = {}) => (
    <label className="flex flex-col gap-1 text-xs font-medium">{label}<Input value={form[key]} onChange={set(key)} className="h-9 text-xs" {...props} /></label>
  );
  const select = (key, label, options) => (
    <label className="flex flex-col gap-1 text-xs font-medium">{label}
      <select value={form[key]} onChange={set(key)} className="h-9 rounded-md border border-input bg-background px-2 text-xs">
        {options.map((option) => (typeof option === "string" ? <option key={option} value={option}>{option}</option> : <option key={option.value} value={option.value}>{option.label}</option>))}
      </select>
    </label>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        <form onSubmit={submit} className="space-y-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm font-bold">
              {editing ? <UserRoundPen className="h-4 w-4 text-primary" /> : <UserPlus className="h-4 w-4 text-primary" />}
              {editing ? `Edit ${lead.lead_name}` : "Add lead"}
            </DialogTitle>
            <DialogDescription className="text-[11px]">Name and mobile are required. Duplicates are checked on phone number and email.</DialogDescription>
          </DialogHeader>

          <section className="space-y-2">
            <h3 className="text-[10.5px] font-bold uppercase tracking-wider text-muted-foreground">Contact</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {field("lead_name", "Full name *", { placeholder: "e.g. Rahul Sharma", maxLength: 120, autoFocus: !editing })}
              {field("mobile_number", "Mobile *", { placeholder: "+91 98765 43210", inputMode: "tel", maxLength: 20 })}
              {field("email", "Email", { placeholder: "rahul@company.com", type: "email", maxLength: 150 })}
              {field("alternate_phone", "Alternate phone", { inputMode: "tel", maxLength: 20 })}
              {field("business", "Company / Business", { placeholder: "e.g. Apex Tech Pvt Ltd", maxLength: 200 })}
              {field("designation", "Designation", { placeholder: "e.g. Director", maxLength: 80 })}
              {field("city", "City / Location", { placeholder: "e.g. Jaipur", maxLength: 100 })}
              {select("lead_source", "Source", LEAD_SOURCE_OPTIONS.includes(form.lead_source) ? LEAD_SOURCE_OPTIONS : [form.lead_source, ...LEAD_SOURCE_OPTIONS])}
            </div>
            {duplicate && (
              <p className="flex items-center gap-1.5 rounded-md border border-amber-500/30 bg-amber-500/10 px-2.5 py-1.5 text-[11px] text-amber-800 dark:text-amber-300">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                Possible duplicate: <Link href={`/leads/active/${duplicate.id}`} className="font-semibold underline" target="_blank">{duplicate.lead_name}</Link> · {duplicate.mobile_number}
              </p>
            )}
          </section>

          <section className="space-y-2">
            <h3 className="text-[10.5px] font-bold uppercase tracking-wider text-muted-foreground">Qualification</h3>
            <div className="grid gap-3 sm:grid-cols-3">
              {select("lead_stage", "Stage", DEFAULT_PIPELINE_STAGES.map((stage) => stage.name))}
              {select("owner", "Owner", [{ value: "", label: "Unassigned" }, ...reps.map((rep) => ({ value: rep.name, label: rep.name })), ...(lead?.lead_owner && !reps.some((rep) => rep.name === lead.lead_owner.name) ? [{ value: lead.lead_owner.name, label: lead.lead_owner.name }] : [])])}
              {select("lead_priority", "Priority", [5, 4, 3, 2, 1].map((value) => ({ value: String(value), label: `${"★".repeat(value)} (${value})` })))}
              {select("budget_range", "Budget", [{ value: "", label: "Not known" }, ...BUDGET_BANDS])}
              {field("preferred_service", "Interested in", { placeholder: "e.g. Modular kitchen", maxLength: 200 })}
              <label className="flex flex-col gap-1 text-xs font-medium">Next follow-up<input type="datetime-local" value={form.next_followup} onChange={set("next_followup")} className="h-9 rounded-md border border-input bg-background px-2 text-xs" /></label>
            </div>
            <label className="flex flex-col gap-1 text-xs font-medium">Notes
              <textarea value={form.last_user_remark} onChange={set("last_user_remark")} rows={2} maxLength={500} className="rounded-md border border-input bg-background p-2 text-xs" placeholder="Requirement, timeline, who referred them…" />
            </label>
          </section>

          <section className="flex flex-wrap gap-4 rounded-md border border-border px-3 py-2 text-xs">
            <span className="font-semibold text-muted-foreground">Consent</span>
            <label className="flex items-center gap-1.5"><input type="checkbox" checked={form.call_consent} onChange={set("call_consent")} className="h-3.5 w-3.5 accent-primary" />OK to call</label>
            <label className="flex items-center gap-1.5"><input type="checkbox" checked={form.whatsapp_consent} onChange={set("whatsapp_consent")} className="h-3.5 w-3.5 accent-primary" />OK to WhatsApp</label>
          </section>

          {error && <p className="text-xs text-destructive">{error}</p>}
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" size="sm" className="h-8 text-xs" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" size="sm" className="h-8 text-xs" disabled={saving}>{saving ? "Saving…" : editing ? "Save changes" : "Add lead"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
