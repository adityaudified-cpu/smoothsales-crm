"use client";

import React, { useState } from "react";
import Link from "next/link";
import { formatDistanceToNowStrict } from "date-fns";
import { Clock, Phone } from "lucide-react";
import { DEFAULT_PIPELINE_STAGES } from "@/lib/tenant-config";
import { estimateDealValue } from "@/lib/leads-workspace";
import { formatINR } from "@/lib/format-cell-value";
import { cn } from "@/lib/utils";
import { encodeLeadId } from "@/lib/lead-id-codec";

const CARD_LIMIT = 50;

// Stage board: drag a card to another column, or use the card's stage menu (keyboard friendly).
export function LeadsKanban({ leads = [], onStageChange }) {
  const [dragId, setDragId] = useState(null);
  const [overStage, setOverStage] = useState(null);
  const knownStages = new Set(DEFAULT_PIPELINE_STAGES.map((stage) => stage.name));
  const columns = [
    ...DEFAULT_PIPELINE_STAGES,
    ...[...new Set(leads.map((lead) => lead.lead_stage).filter((name) => name && !knownStages.has(name)))].map((name) => ({ id: name, name, dotColor: "bg-muted-foreground" })),
  ];
  const now = new Date();

  const drop = (stageName) => {
    const lead = leads.find((item) => item.id === dragId);
    if (lead && lead.lead_stage !== stageName) onStageChange(lead.id, stageName);
    setDragId(null);
    setOverStage(null);
  };

  return (
    <div className="flex gap-2.5 overflow-x-auto pb-2">
      {columns.map((stage) => {
        const items = leads.filter((lead) => (lead.lead_stage || "New Lead") === stage.name || (stage.name === "New Lead" && lead.lead_stage === "New"));
        const value = items.reduce((sum, lead) => sum + estimateDealValue(lead), 0);
        return (
          <section
            key={stage.id}
            aria-label={`${stage.name} column`}
            onDragOver={(event) => { event.preventDefault(); setOverStage(stage.name); }}
            onDragLeave={() => setOverStage((current) => (current === stage.name ? null : current))}
            onDrop={(event) => { event.preventDefault(); drop(stage.name); }}
            className={cn("flex w-[260px] shrink-0 flex-col rounded-xl border bg-muted/30", overStage === stage.name ? "border-primary bg-primary/5" : "border-border")}
          >
            <header className="flex items-center justify-between gap-2 border-b border-border px-3 py-2">
              <span className="flex min-w-0 items-center gap-1.5 text-xs font-semibold"><span className={cn("h-2 w-2 shrink-0 rounded-full", stage.dotColor)} /><span className="truncate">{stage.name}</span><span className="rounded-full bg-background px-1.5 text-[10px] text-muted-foreground">{items.length}</span></span>
              <span className="font-mono text-[10px] text-muted-foreground">{value ? formatINR(value) : ""}</span>
            </header>
            <div className="flex max-h-[62vh] min-h-[120px] flex-col gap-1.5 overflow-y-auto p-2">
              {items.slice(0, CARD_LIMIT).map((lead) => {
                const due = lead.next_followup ? new Date(lead.next_followup) : null;
                const overdue = due && due < now;
                return (
                  <article
                    key={lead.id}
                    draggable
                    onDragStart={(event) => { setDragId(lead.id); event.dataTransfer.effectAllowed = "move"; }}
                    onDragEnd={() => { setDragId(null); setOverStage(null); }}
                    className={cn("cursor-grab rounded-lg border bg-card p-2 shadow-2xs active:cursor-grabbing", overdue ? "border-l-4 border-l-rose-500 border-border" : "border-border", dragId === lead.id && "opacity-50")}
                  >
                    <div className="flex items-start justify-between gap-1">
                      <Link href={`/leads/active/${encodeLeadId(lead.id)}`} className="min-w-0 truncate text-xs font-semibold hover:text-primary">{lead.lead_name || lead.name}</Link>
                      <span className="shrink-0 text-[10px] text-amber-500">{"★".repeat(Number(lead.lead_priority) || 0)}</span>
                    </div>
                    <p className="truncate text-[10.5px] text-muted-foreground">{[lead.business, lead.city].filter(Boolean).join(" · ") || "—"}</p>
                    <div className="mt-1.5 flex items-center justify-between gap-1 text-[10px] text-muted-foreground">
                      <span className="truncate">{lead.lead_owner?.name || "Unassigned"}</span>
                      {due && <span className={cn("flex shrink-0 items-center gap-0.5", overdue && "font-semibold text-rose-600")}><Clock className="h-2.5 w-2.5" />{overdue ? `${formatDistanceToNowStrict(due)} late` : formatDistanceToNowStrict(due)}</span>}
                    </div>
                    <div className="mt-1.5 flex items-center gap-1">
                      {lead.mobile_number && <a href={`tel:${lead.mobile_number.replace(/[^\d+]/g, "")}`} aria-label={`Call ${lead.lead_name}`} className="rounded p-1 text-emerald-600 hover:bg-emerald-500/10"><Phone className="h-3 w-3" /></a>}
                      <select
                        aria-label={`Move ${lead.lead_name} to stage`}
                        value={lead.lead_stage || "New Lead"}
                        onChange={(event) => onStageChange(lead.id, event.target.value)}
                        className="h-6 min-w-0 flex-1 rounded border border-input bg-background px-1 text-[10px]"
                      >
                        {columns.map((option) => <option key={option.id} value={option.name}>{option.name}</option>)}
                      </select>
                    </div>
                  </article>
                );
              })}
              {items.length > CARD_LIMIT && <p className="py-1 text-center text-[10px] text-muted-foreground">+{items.length - CARD_LIMIT} more · use filters to narrow</p>}
              {!items.length && <p className="py-6 text-center text-[10.5px] text-muted-foreground">Drop leads here</p>}
            </div>
          </section>
        );
      })}
    </div>
  );
}
