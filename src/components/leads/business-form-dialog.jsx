"use client";

import React, { useState } from "react";
import { Building } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const BUSINESS_INDUSTRIES = ["Real Estate", "Interior Design", "Architecture", "Construction", "Education", "Solar / Energy", "Manufacturing", "Retail", "IT / Services", "Healthcare", "Other"];
const EMPTY = { name: "", industry: "", phone: "", email: "", city: "", address: "", website: "", notes: "" };

// Add / edit a business account. `initial` switches it to edit mode; the dialog remounts per open via `key`.
export function BusinessFormDialog({ open, onOpenChange, initial = null, existingNames = [], onSubmit }) {
  const [form, setForm] = useState(() => ({ ...EMPTY, ...(initial || {}) }));
  const [error, setError] = useState("");
  const set = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));

  const submit = (event) => {
    event.preventDefault();
    const name = form.name.trim();
    if (!name) return setError("Business name is required");
    const clash = existingNames.some((existing) => existing.toLowerCase() === name.toLowerCase() && existing.toLowerCase() !== (initial?.name || "").toLowerCase());
    if (clash) return setError("A business with that name already exists");
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email.trim())) return setError("Enter a valid email");
    onSubmit(Object.fromEntries(Object.entries(form).map(([key, value]) => [key, typeof value === "string" ? value.trim() : value])));
  };

  const field = (key, label, props = {}) => (
    <label className="flex flex-col gap-1 text-xs font-medium">{label}<Input value={form[key] || ""} onChange={set(key)} className="h-9 text-xs" {...props} /></label>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <form onSubmit={submit} className="space-y-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm font-bold"><Building className="h-4 w-4 text-primary" />{initial ? "Edit business" : "Add business"}</DialogTitle>
            <DialogDescription className="text-[11px]">A business groups every contact from the same company or project so the whole team sees one account.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">{field("name", "Business name *", { placeholder: "e.g. Apex Tech Pvt Ltd", maxLength: 120, autoFocus: true })}</div>
            <label className="flex flex-col gap-1 text-xs font-medium">Industry
              <select value={form.industry} onChange={set("industry")} className="h-9 rounded-md border border-input bg-background px-2 text-xs">
                <option value="">Select industry…</option>
                {BUSINESS_INDUSTRIES.map((value) => <option key={value}>{value}</option>)}
              </select>
            </label>
            {field("city", "City", { placeholder: "e.g. Pune", maxLength: 60 })}
            {field("phone", "Phone", { placeholder: "+91 98765 43210", inputMode: "tel", maxLength: 20 })}
            {field("email", "Email", { placeholder: "accounts@company.com", type: "email", maxLength: 120 })}
            <div className="sm:col-span-2">{field("address", "Address", { placeholder: "Street, area", maxLength: 200 })}</div>
            <div className="sm:col-span-2">{field("website", "Website", { placeholder: "company.com", maxLength: 120 })}</div>
            <label className="flex flex-col gap-1 text-xs font-medium sm:col-span-2">Notes
              <textarea value={form.notes} onChange={set("notes")} rows={2} maxLength={500} className="rounded-md border border-input bg-background p-2 text-xs" placeholder="Decision process, key stakeholders, project scope…" />
            </label>
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" size="sm" className="h-8 text-xs" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" size="sm" className="h-8 text-xs">{initial ? "Save changes" : "Submit"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
