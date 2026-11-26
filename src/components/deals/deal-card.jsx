"use client";

import React from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Phone, ExternalLink } from "lucide-react";
import { formatDistanceToNowStrict } from "date-fns";
import { cn } from "@/lib/utils";
import { formatINR } from "@/lib/format-cell-value";
import { encodeLeadId } from "@/lib/lead-id-codec";
import { useCallOutcome } from "@/lib/call-outcome-context";

const STAGE_OPTIONS = [
  { value: "NEEDS_ASSESSMENT", label: "Needs Assessment" },
  { value: "PROPOSAL_SENT", label: "Proposal Sent" },
  { value: "TERMS_DISCUSSION", label: "Terms Discussion" },
  { value: "DEAL_WON", label: "Deal Won" },
  { value: "DEAL_LOST", label: "Deal Lost" },
];

export function DealCard({ deal, onStageChange, onDragStart }) {
  const { openCallOutcomeDrawer } = useCallOutcome();
  const formattedValue = deal.dealValue > 0 ? formatINR(deal.dealValue) : "₹0";
  const ageText = deal.updatedAt
    ? formatDistanceToNowStrict(new Date(deal.updatedAt), { addSuffix: true })
    : "just now";

  return (
    <Card
      draggable
      onDragStart={(e) => {
        if (onDragStart) onDragStart(deal.id);
        e.dataTransfer.effectAllowed = "move";
      }}
      className={cn(
        "p-3 bg-card border border-border shadow-none rounded-lg space-y-2 transition-colors cursor-grab active:cursor-grabbing hover:border-primary/40"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h4 className="font-heading font-semibold text-xs text-foreground leading-snug truncate">
            {deal.customerName || deal.title}
          </h4>
          {deal.customerCompany && (
            <p className="text-[11px] text-muted-foreground truncate">{deal.customerCompany}</p>
          )}
        </div>
        {deal.customerId && (
          <Link
            href={`/leads/active/${encodeLeadId(deal.customerId)}`}
            title="Open Lead"
            className="p-1 rounded text-muted-foreground hover:text-primary hover:bg-muted shrink-0"
          >
            <ExternalLink className="h-3 w-3" />
          </Link>
        )}
      </div>

      <div className="text-emerald-600 dark:text-emerald-400 font-bold text-xs font-mono tabular-nums">
        {formattedValue}
      </div>

      <div className="text-[11px] text-muted-foreground truncate">
        {deal.ownerName || "Unassigned"} {deal.customerCity ? `· ${deal.customerCity}` : ""}
      </div>

      <div className="pt-1.5 border-t border-border/60 flex items-center justify-between gap-1.5">
        {deal.customerId && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              openCallOutcomeDrawer(
                {
                  id: deal.customerId,
                  lead_name: deal.customerName || deal.title,
                  mobile_number: deal.customerPhone || "",
                  city: deal.customerCity || "",
                  dealValueINR: deal.dealValue,
                },
                { dial: true, sourceLabel: "Deal follow-up call" }
              );
            }}
            title="Call & Log Outcome"
            className="p-1 rounded text-emerald-600 hover:bg-emerald-500/10"
          >
            <Phone className="h-3.5 w-3.5" />
          </button>
        )}
        <select
          aria-label={`Move ${deal.customerName || deal.title} stage`}
          value={deal.stage}
          onChange={(e) => onStageChange && onStageChange(deal.id, e.target.value)}
          className="h-6 min-w-0 flex-1 rounded border border-input bg-background px-1.5 text-[10.5px] text-foreground"
        >
          {STAGE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="text-[10px] text-muted-foreground">Updated {ageText}</div>
    </Card>
  );
}
