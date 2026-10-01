import React from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MOCK_LEADS } from "@/lib/mock-data/leads";
import { MOCK_DEALS } from "@/lib/mock-data/deals";
import { AlertTriangle, Clock, ArrowRight, ShieldAlert, User } from "lucide-react";
import { differenceInMinutes, differenceInHours } from "date-fns";

/**
 * ARCHITECTURAL NOTE:
 * The `tatDeadline` and `tatStatus` fields on leads are conceptually derived from
 * the Partner Tiers & SLA Configuration engine established in Prompt #7 (business-hours
 * timers, routing multipliers, and tier breach thresholds). In production, the backend SLA
 * daemon evaluates lead ingestion timestamps against tenant-configured tier policies,
 * generating SLA breach events that populate this widget.
 */
export function TatViolationsWidget() {
  const now = new Date();

  // Find all breached leads
  const breachedLeads = MOCK_LEADS.filter((l) => l.tatStatus === "breached");
  // Find all stale deals (from Part B)
  const staleDeals = MOCK_DEALS.filter((d) => d.isStale);

  if (breachedLeads.length === 0 && staleDeals.length === 0) {
    return null;
  }

  // Display up to 3 breached leads in the banner list
  const previewLeads = breachedLeads.slice(0, 3);

  const getOverdueText = (deadline) => {
    if (!deadline) return "15m overdue";
    const d = new Date(deadline);
    if (isNaN(d.getTime())) return "overdue";
    const diffMin = Math.max(1, differenceInMinutes(now, d));
    if (diffMin < 60) return `${diffMin}m overdue`;
    const diffHrs = Math.max(1, differenceInHours(now, d));
    return `${diffHrs}h overdue`;
  };

  return (
    <Card className="p-4 bg-destructive/5 border-2 border-destructive/30 rounded-lg shadow-xs space-y-3">
      {/* Header with destructive tone & breach count */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-destructive/20">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-md bg-destructive/15 text-destructive flex items-center justify-center shrink-0">
            <ShieldAlert className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-heading font-extrabold text-sm text-destructive">
                {breachedLeads.length} TAT SLA Violations Need Immediate Attention
              </h3>
              {staleDeals.length > 0 && (
                <Badge
                  variant="outline"
                  className="bg-warning/15 text-warning border-warning/30 text-[10px] font-semibold"
                >
                  +{staleDeals.length} Stale Deals
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              First-response turnaround time exceeded tenant SLA policies. Immediate customer engagement required.
            </p>
          </div>
        </div>

        {/* View All deep link to Leads filtered tab */}
        <Link
          href="/leads?tab=tat_breached"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-destructive hover:text-destructive/80 hover:underline shrink-0 self-start sm:self-center bg-destructive/10 hover:bg-destructive/20 px-3 py-1.5 rounded transition-colors"
        >
          <span>View All Breaches</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* List of top 3 breached leads */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {previewLeads.map((lead) => (
          <div
            key={lead.id}
            className="p-2.5 rounded bg-background/80 border border-destructive/20 flex flex-col justify-between gap-2 text-xs"
          >
            <div>
              <div className="flex items-center justify-between gap-1">
                <span className="font-semibold text-foreground truncate">
                  {lead.name}
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-destructive bg-destructive/10 px-1.5 py-0.5 rounded">
                  <Clock className="h-2.5 w-2.5" />
                  {getOverdueText(lead.tatDeadline)}
                </span>
              </div>
              <div className="text-[11px] text-muted-foreground truncate mt-0.5">
                {lead.company}
              </div>
            </div>

            <div className="flex items-center justify-between pt-1.5 border-t border-border/60 text-[11px]">
              <span className="text-muted-foreground flex items-center gap-1">
                <User className="h-3 w-3" />
                {lead.ownerName || "Pool"}
              </span>
              <span className="text-primary font-medium">{lead.source}</span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
