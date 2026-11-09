"use client";

import React from "react";
import {
  Users,
  CheckCircle2,
  AlertCircle,
  ArrowRightLeft,
  ChevronDown,
  Filter,
  Flame,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const AVAILABILITY_STATUSES = [
  { value: "Available", label: "Available", dot: "bg-emerald-500", text: "text-emerald-700 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800" },
  { value: "Busy", label: "On Call", dot: "bg-amber-500", text: "text-amber-700 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800" },
  { value: "Break", label: "On Break", dot: "bg-orange-500", text: "text-orange-700 dark:text-orange-400", bg: "bg-orange-50 dark:bg-orange-950/40 border-orange-200 dark:border-orange-800" },
  { value: "Offline", label: "Offline", dot: "bg-slate-400", text: "text-muted-foreground", bg: "bg-muted border-border" },
];

export function RepWorkloadTable({
  reps = [],
  leads = [],
  onUpdateRep = () => {},
  onOpenReassignFromRep = () => {},
  onFilterByRep = () => {},
  selectedRepFilter = null,
}) {
  const now = new Date();

  const repStats = reps.map((rep) => {
    const assignedLeads = leads.filter(
      (l) => l.lead_owner?.name?.toLowerCase() === rep.name.toLowerCase()
    );
    const overdueCount = assignedLeads.filter(
      (l) => l.next_followup && new Date(l.next_followup) < now
    ).length;
    const highPriorityCount = assignedLeads.filter(
      (l) => (l.lead_priority || l.priority || 0) >= 4
    ).length;
    const maxLeads = rep.maxActiveLeads || 25;
    const activeCount = assignedLeads.length;
    const utilization = Math.min(Math.round((activeCount / maxLeads) * 100), 100);
    return { ...rep, activeCount, maxLeads, utilization, overdueCount, highPriorityCount };
  });

  const availableCount = repStats.filter((r) => r.availability === "Available").length;

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-muted/20 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Users className="h-3.5 w-3.5" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-foreground">Telecaller Squad & Workload</h2>
            <p className="text-[11px] text-muted-foreground">
              Live status, quota ceilings, and capacity utilization.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
          {[
            { dot: "bg-emerald-500", label: "Available" },
            { dot: "bg-amber-500", label: "On Call" },
            { dot: "bg-orange-500", label: "On Break" },
            { dot: "bg-slate-400", label: "Offline" },
          ].map((s) => (
            <span key={s.label} className="flex items-center gap-1.5">
              <span className={cn("h-2 w-2 rounded-full", s.dot)} />
              {s.label}
            </span>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-border bg-muted/30 text-[11px] font-semibold text-muted-foreground">
              <th className="px-4 py-2.5">Representative</th>
              <th className="px-3 py-2.5">Role & Team</th>
              <th className="px-3 py-2.5">Status</th>
              <th className="px-3 py-2.5 text-center">Auto-Route</th>
              <th className="px-4 py-2.5 min-w-[180px]">Quota</th>
              <th className="px-3 py-2.5 text-center">Overdue</th>
              <th className="px-3 py-2.5 text-center">High Intent</th>
              <th className="px-4 py-2.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {repStats.map((rep) => {
              const statusCfg = AVAILABILITY_STATUSES.find((s) => s.value === rep.availability) || AVAILABILITY_STATUSES[0];
              const isAtCap = rep.activeCount >= rep.maxLeads;
              const isNearCap = rep.utilization >= 80;
              const isFiltered = selectedRepFilter === rep.name;

              return (
                <tr
                  key={rep.id}
                  className={cn(
                    "transition-colors hover:bg-muted/20",
                    isFiltered && "bg-primary/5 dark:bg-primary/10"
                  )}
                >
                  {/* Identity */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
                        rep.avatarColor || "bg-primary/10 text-primary"
                      )}>
                        {rep.initials || rep.name?.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-foreground truncate">{rep.name}</span>
                          {rep.isTeamLeader && (
                            <span className="rounded bg-primary/10 px-1 py-0 text-[9px] font-bold text-primary uppercase">TL</span>
                          )}
                        </div>
                        <span className="text-[10px] text-muted-foreground truncate block">{rep.email}</span>
                      </div>
                    </div>
                  </td>

                  {/* Role */}
                  <td className="px-3 py-3">
                    <p className="font-medium text-foreground text-[11px]">{rep.role}</p>
                    <p className="text-[10px] text-muted-foreground capitalize">
                      {rep.primaryTeamId ? rep.primaryTeamId.replace("team-", "").replace(/-/g, " ") : "General"}
                    </p>
                  </td>

                  {/* Status dropdown */}
                  <td className="px-3 py-3 whitespace-nowrap">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          suppressHydrationWarning
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-all hover:opacity-90",
                            statusCfg.bg, statusCfg.text
                          )}
                        >
                          <span className={cn("h-1.5 w-1.5 rounded-full", statusCfg.dot)} />
                          {statusCfg.label}
                          <ChevronDown className="h-3 w-3 opacity-50" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-36 text-xs">
                        {AVAILABILITY_STATUSES.map((s) => (
                          <DropdownMenuItem
                            key={s.value}
                            onClick={() => onUpdateRep(rep.id, { availability: s.value })}
                            className="flex items-center gap-2 text-xs"
                          >
                            <span className={cn("h-2 w-2 rounded-full", s.dot)} />
                            {s.label}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>

                  {/* Auto-route toggle */}
                  <td className="px-3 py-3 text-center">
                    <div className="flex justify-center">
                      <Switch
                        checked={rep.autoLeadDistribution}
                        onCheckedChange={(checked) => onUpdateRep(rep.id, { autoLeadDistribution: checked })}
                        aria-label={`Toggle auto-distribution for ${rep.name}`}
                        suppressHydrationWarning
                      />
                    </div>
                  </td>

                  {/* Quota bar */}
                  <td className="px-4 py-3 min-w-[180px]">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-medium text-foreground tabular-nums">
                          {rep.activeCount}
                          <span className="text-muted-foreground font-normal"> / {rep.maxLeads}</span>
                        </span>
                        <span className={cn(
                          "text-[10px] font-bold tabular-nums",
                          isAtCap ? "text-rose-600 dark:text-rose-400"
                            : isNearCap ? "text-amber-600 dark:text-amber-400"
                            : "text-emerald-600 dark:text-emerald-400"
                        )}>
                          {rep.utilization}%
                        </span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all duration-500",
                            isAtCap ? "bg-rose-500" : isNearCap ? "bg-amber-500" : "bg-emerald-500"
                          )}
                          style={{ width: `${rep.utilization}%` }}
                        />
                      </div>
                    </div>
                  </td>

                  {/* Overdue */}
                  <td className="px-3 py-3 text-center whitespace-nowrap">
                    {rep.overdueCount > 0 ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 px-2 py-0.5 text-[10px] font-bold text-rose-700 dark:text-rose-300">
                        <AlertCircle className="h-3 w-3" />
                        {rep.overdueCount}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                        <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                        0
                      </span>
                    )}
                  </td>

                  {/* High intent */}
                  <td className="px-3 py-3 text-center whitespace-nowrap">
                    {rep.highPriorityCount > 0 ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-300">
                        <Flame className="h-3 w-3 text-amber-500 fill-amber-500" />
                        {rep.highPriorityCount}
                      </span>
                    ) : (
                      <span className="text-[11px] text-muted-foreground">—</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        size="sm"
                        variant={isFiltered ? "default" : "outline"}
                        onClick={() => onFilterByRep(rep.name)}
                        className="h-7 px-2.5 text-[10px] gap-1"
                      >
                        <Filter className="h-3 w-3" />
                        {isFiltered ? "Showing" : "Filter"}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onOpenReassignFromRep(rep)}
                        disabled={rep.activeCount === 0}
                        className="h-7 px-2.5 text-[10px] gap-1 text-muted-foreground hover:text-foreground"
                      >
                        <ArrowRightLeft className="h-3 w-3" />
                        Reassign
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer summary */}
      <div className="flex items-center justify-between border-t border-border bg-muted/10 px-4 py-2 text-[11px] text-muted-foreground">
        <span>
          {availableCount} of {repStats.length} reps available
          {repStats.filter((r) => r.autoLeadDistribution).length > 0 && (
            <span className="ml-2 text-emerald-600 dark:text-emerald-400 font-medium">
              · {repStats.filter((r) => r.autoLeadDistribution).length} in auto-rotation
            </span>
          )}
        </span>
        <span>Toggle Auto-Route to include/exclude reps from round-robin.</span>
      </div>
    </div>
  );
}
