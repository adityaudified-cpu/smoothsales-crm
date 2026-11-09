"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { UserCheck, ArrowRight, AlertTriangle, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const REASSIGN_REASONS = [
  "Workload Balancing (Quota Equalization)",
  "Language / Regional Alignment",
  "Senior Closer Escalation",
  "Agent on Leave / Scheduled Off",
  "Customer Preference / Follow-up",
];

export function ReassignModal({
  open = false,
  onOpenChange = () => {},
  sourceRep = null,
  leadIds = [],
  leads = [],
  reps = [],
  onConfirmReassignment = () => {},
}) {
  const [selectedRepId, setSelectedRepId] = useState("");
  const [reason, setReason] = useState(REASSIGN_REASONS[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Leads to be transferred
  const targetLeads = leads.filter((l) => leadIds.includes(l.id));

  // Eligible target reps (excluding source rep if defined)
  const eligibleReps = reps.filter((r) => !sourceRep || r.id !== sourceRep.id);

  const selectedTargetRep = reps.find((r) => r.id === selectedRepId);

  const handleSubmit = () => {
    if (!selectedTargetRep) return;
    setIsSubmitting(true);
    setTimeout(() => {
      onConfirmReassignment(leadIds, selectedTargetRep, reason);
      setIsSubmitting(false);
      onOpenChange(false);
      setSelectedRepId("");
    }, 300);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <UserCheck className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle className="text-sm font-bold text-foreground">
                Reassign Lead Portfolio
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Transfer ownership of {targetLeads.length} lead{targetLeads.length === 1 ? "" : "s"} to another telecaller.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Source Info */}
          {sourceRep && (
            <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-2.5 text-xs">
              <span className="text-muted-foreground">Current Owner:</span>
              <div className="flex items-center gap-1.5 font-semibold text-foreground">
                <span className={cn(
                  "flex h-5 w-5 items-center justify-center rounded-full text-[10px]",
                  sourceRep.avatarColor || "bg-primary/10 text-primary"
                )}>
                  {sourceRep.initials || sourceRep.name.slice(0, 2)}
                </span>
                <span>{sourceRep.name}</span>
              </div>
            </div>
          )}

          {/* Leads Preview */}
          <div className="rounded-lg border border-border bg-card p-2.5">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
              Leads Being Transferred ({targetLeads.length})
            </span>
            <div className="max-h-28 overflow-y-auto space-y-1 pr-1">
              {targetLeads.slice(0, 8).map((lead) => (
                <div
                  key={lead.id}
                  className="flex items-center justify-between text-xs py-0.5 border-b border-border/40 last:border-0"
                >
                  <span className="font-medium text-foreground truncate max-w-[200px]">
                    {lead.lead_name || lead.name}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {lead.lead_source || "Website"}
                  </span>
                </div>
              ))}
              {targetLeads.length > 8 && (
                <p className="text-[10px] text-muted-foreground text-center pt-1">
                  + {targetLeads.length - 8} more leads
                </p>
              )}
            </div>
          </div>

          {/* Target Rep Picker */}
          <div>
            <label className="text-xs font-semibold text-foreground block mb-1.5">
              Select Destination Telecaller
            </label>
            <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
              {eligibleReps.map((rep) => {
                const repLeadCount = leads.filter(
                  (l) => l.lead_owner?.name?.toLowerCase() === rep.name.toLowerCase()
                ).length;
                const isSelected = selectedRepId === rep.id;
                const isNearCapacity = repLeadCount >= (rep.maxActiveLeads || 25);

                return (
                  <div
                    key={rep.id}
                    onClick={() => setSelectedRepId(rep.id)}
                    className={cn(
                      "flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer transition-all",
                      isSelected
                        ? "border-primary bg-primary/5 shadow-xs"
                        : "border-border hover:bg-muted/40",
                      isNearCapacity && "opacity-80"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold",
                        rep.avatarColor || "bg-primary/10 text-primary"
                      )}>
                        {rep.initials || rep.name.slice(0, 2)}
                      </span>
                      <div>
                        <p className="font-medium text-foreground">{rep.name}</p>
                        <p className="text-[10px] text-muted-foreground">{rep.role}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] font-semibold text-muted-foreground block">
                        {repLeadCount} / {rep.maxActiveLeads || 25} leads
                      </span>
                      <span className={cn(
                        "text-[9px] font-bold uppercase",
                        rep.availability === "Available" ? "text-emerald-600" : "text-amber-600"
                      )}>
                        {rep.availability}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Reason Selector */}
          <div>
            <label className="text-xs font-semibold text-foreground block mb-1">
              Reason for Transfer
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full h-8 rounded-md border border-input bg-background px-2.5 text-xs text-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-primary"
            >
              {REASSIGN_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-8 text-xs"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!selectedRepId || isSubmitting}
            className="h-8 text-xs bg-primary text-primary-foreground font-medium"
          >
            {isSubmitting ? "Transferring..." : `Confirm Transfer (${targetLeads.length})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
