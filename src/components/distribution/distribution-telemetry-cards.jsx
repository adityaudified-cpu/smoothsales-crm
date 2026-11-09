"use client";

import React from "react";
import { Users, UserCheck, AlertTriangle, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

export function DistributionTelemetryCards({
  leads = [],
  reps = [],
  activeFilter = "all",
  onSelectFilter = () => {},
  unassignedCount = 0,
  assignedCount = 0,
  activeRulesCount = 3,
}) {
  const totalLeads = leads.length;
  const assignedPct = totalLeads > 0 ? Math.round((assignedCount / totalLeads) * 100) : 0;
  const availableReps = reps.filter((r) => r.availability === "Available").length;
  const avgPerRep = reps.length > 0 ? (assignedCount / reps.length).toFixed(1) : "0";

  const cards = [
    {
      id: "all",
      label: "Total Leads",
      value: totalLeads,
      sub: `${reps.length} reps registered`,
      icon: Users,
      activeRing: "ring-primary/20 border-primary/40",
      activeIcon: "bg-primary/10 text-primary",
      activeBg: "bg-primary/5",
      defaultIcon: "bg-muted text-muted-foreground",
      valueColor: "text-foreground",
      badge: "100% Pipeline",
      badgeClass: "bg-muted text-muted-foreground",
    },
    {
      id: "assigned",
      label: "Assigned",
      value: assignedCount,
      sub: `Avg ${avgPerRep} leads / rep`,
      icon: UserCheck,
      activeRing: "ring-emerald-500/20 border-emerald-500/40",
      activeIcon: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
      activeBg: "bg-emerald-50/50 dark:bg-emerald-950/20",
      defaultIcon: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
      valueColor: "text-emerald-700 dark:text-emerald-400",
      badge: `${assignedPct}% allocated`,
      badgeClass: "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300",
    },
    {
      id: "unassigned",
      label: "Unassigned",
      value: unassignedCount,
      sub: unassignedCount > 0 ? "SLA: dispatch within 5 mins" : "Queue clear",
      icon: AlertTriangle,
      activeRing: "ring-amber-500/20 border-amber-500/40",
      activeIcon: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
      activeBg: "bg-amber-50/50 dark:bg-amber-950/20",
      defaultIcon: unassignedCount > 0 ? "bg-amber-500/10 text-amber-600 dark:text-amber-400" : "bg-muted text-muted-foreground",
      valueColor: unassignedCount > 0 ? "text-amber-700 dark:text-amber-400" : "text-foreground",
      badge: unassignedCount > 0 ? "Needs triage" : "Queue empty",
      badgeClass: unassignedCount > 0
        ? "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300"
        : "bg-muted text-muted-foreground",
      pulse: unassignedCount > 0,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const isActive = activeFilter === card.id;
        const Icon = card.icon;
        return (
          <button
            key={card.id}
            type="button"
            onClick={() => onSelectFilter(activeFilter === card.id && card.id !== "all" ? "all" : card.id)}
            className={cn(
              "group relative flex flex-col justify-between rounded-xl border p-4 text-left transition-all duration-150 cursor-pointer select-none ring-2",
              isActive
                ? `${card.activeRing} ${card.activeBg} shadow-sm`
                : "border-border bg-card ring-transparent hover:border-border/80 hover:bg-muted/20"
            )}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {card.label}
              </span>
              <div className="relative">
                <div className={cn("flex h-7 w-7 items-center justify-center rounded-lg", isActive ? card.activeIcon : card.defaultIcon)}>
                  <Icon className="h-3.5 w-3.5" />
                </div>
                {card.pulse && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-baseline justify-between gap-2">
              <span className={cn("text-2xl font-bold tracking-tight tabular-nums", card.valueColor)}>
                {card.value}
              </span>
              <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold", card.badgeClass)}>
                {card.badge}
              </span>
            </div>

            <p className="mt-1.5 text-[11px] text-muted-foreground">{card.sub}</p>
          </button>
        );
      })}

      {/* Engine Health card — not clickable */}
      <div className="relative flex flex-col justify-between rounded-xl border border-border bg-card p-4 select-none">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Engine & Squad
          </span>
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <Zap className="h-3.5 w-3.5" />
          </div>
        </div>

        <div className="flex items-baseline justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <span className="text-base font-bold text-foreground">Round Robin</span>
          </div>
          <span className="rounded-full bg-blue-100 dark:bg-blue-950/60 px-2 py-0.5 text-[10px] font-semibold text-blue-700 dark:text-blue-300">
            ⚡ 0.8s SLA
          </span>
        </div>

        <div className="mt-1.5 flex items-center justify-between text-[11px] text-muted-foreground">
          <span>{availableReps}/{reps.length} reps available</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{activeRulesCount} rules live</span>
        </div>
      </div>
    </div>
  );
}
