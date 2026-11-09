"use client";

import React, { useMemo, useState } from "react";
import { CheckCheck, MessageCircle, Send } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { WHATSAPP_TEMPLATES, fillTemplate, whatsappLink } from "@/lib/leads-workspace";
import { cn } from "@/lib/utils";

// Without a WhatsApp Business API, each message opens wa.me for the rep to send; sent rows are ticked off.
export function WhatsAppBroadcastDialog({ open, onOpenChange, leads = [], title = "WhatsApp broadcast", onSent }) {
  const [templateId, setTemplateId] = useState(WHATSAPP_TEMPLATES[0].id);
  const [body, setBody] = useState(WHATSAPP_TEMPLATES[0].body);
  const [sent, setSent] = useState(() => new Set());
  const reachable = useMemo(() => leads.filter((lead) => String(lead.mobile_number || lead.phone || "").replace(/\D/g, "").length >= 10), [leads]);
  const nextLead = reachable.find((lead) => !sent.has(lead.id));

  const chooseTemplate = (id) => {
    setTemplateId(id);
    setBody(WHATSAPP_TEMPLATES.find((template) => template.id === id)?.body || "");
  };

  const send = (lead) => {
    window.open(whatsappLink(lead.mobile_number || lead.phone, fillTemplate(body, lead)), "_blank", "noopener,noreferrer");
    setSent((current) => new Set(current).add(lead.id));
    onSent?.(lead, templateId);
  };

  return (
    <Dialog open={open} onOpenChange={(value) => { if (!value) setSent(new Set()); onOpenChange(value); }}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm font-bold"><MessageCircle className="h-4 w-4 text-emerald-600" />{title}</DialogTitle>
          <DialogDescription className="text-[11px]">{reachable.length} of {leads.length} leads have a valid mobile number. Variables: {"{{lead_name}}"}, {"{{city}}"}, {"{{business}}"}.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-2">
            <label className="flex flex-col gap-1 text-xs font-medium">Template
              <select value={templateId} onChange={(event) => chooseTemplate(event.target.value)} className="h-8 rounded-md border border-input bg-background px-2 text-xs">{WHATSAPP_TEMPLATES.map((template) => <option key={template.id} value={template.id}>{template.name}</option>)}</select>
            </label>
            <textarea rows={5} value={body} onChange={(event) => setBody(event.target.value)} className="w-full rounded-md border border-input bg-background p-2 text-xs" aria-label="Message body" />
            {reachable[0] && <div className="rounded-lg bg-[#e7f8e9] p-2.5 text-[11.5px] leading-snug text-emerald-950 dark:bg-emerald-950/40 dark:text-emerald-100"><p className="mb-1 text-[10px] font-semibold uppercase opacity-70">Preview · {reachable[0].lead_name}</p>{fillTemplate(body, reachable[0])}</div>}
          </div>
          <div className="max-h-[300px] divide-y divide-border/70 overflow-y-auto rounded-lg border border-border">
            {reachable.length ? reachable.map((lead) => {
              const done = sent.has(lead.id);
              return (
                <div key={lead.id} className={cn("flex items-center justify-between gap-2 px-3 py-1.5", done && "bg-emerald-500/5")}>
                  <div className="min-w-0"><p className="truncate text-xs font-medium">{lead.lead_name || lead.name}</p><p className="font-mono text-[10.5px] text-muted-foreground">{lead.mobile_number || lead.phone}</p></div>
                  <Button type="button" size="sm" variant={done ? "ghost" : "outline"} className="h-7 gap-1 text-[11px]" onClick={() => send(lead)}>{done ? <><CheckCheck className="h-3 w-3 text-emerald-600" />Sent</> : <><Send className="h-3 w-3" />Send</>}</Button>
                </div>
              );
            }) : <p className="p-6 text-center text-xs text-muted-foreground">No leads in this list have a mobile number.</p>}
          </div>
        </div>
        <DialogFooter className="items-center gap-2 sm:justify-between">
          <span className="text-[11px] text-muted-foreground">{sent.size} / {reachable.length} sent</span>
          <Button type="button" size="sm" className="h-8 gap-1.5 bg-emerald-600 text-xs text-white hover:bg-emerald-700" disabled={!nextLead || !body.trim()} onClick={() => nextLead && send(nextLead)}><Send className="h-3.5 w-3.5" />{nextLead ? `Send next: ${nextLead.lead_name || nextLead.name}` : "All sent"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
