import React from "react";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { ChartPanel } from "@/components/dashboard/chart-panel";
import { Card } from "@/components/ui/card";
import { DASHBOARD_STATS, RECENT_ACTIVITY_EVENTS } from "@/lib/mock-data/dashboard-stats";
import { Clock } from "lucide-react";
import { TrialRewardWidget } from "@/components/dashboard/trial-reward-widget";
import { GettingStartedChecklist } from "@/components/dashboard/getting-started-checklist";
import { TatViolationsWidget } from "@/components/dashboard/tat-violations-widget";

export const metadata = {
  title: "Dashboard — SmoothSales.ai",
  description: "Sales velocity, lead ingestion, and activity overview",
};

export default function TenantDashboardPage() {
  const { newLeadsToday, avgAssignmentTime, qualifiedThisWeek, followUpsDueToday } =
    DASHBOARD_STATS;

  return (
    <div className="space-y-6">
      {/* Header with tenant subtitle */}
      <PageHeader
        title="Dashboard"
        subtitle="Jaipur Interiors — Enterprise Sales Floor"
      />

      {/* Grid of 4 StatCards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label={newLeadsToday.label}
          value={newLeadsToday.value}
          deltaText={newLeadsToday.deltaText}
          deltaTone={newLeadsToday.deltaTone}
        />
        <StatCard
          label={avgAssignmentTime.label}
          value={avgAssignmentTime.value}
          deltaText={avgAssignmentTime.deltaText}
          deltaTone={avgAssignmentTime.deltaTone}
        />
        <StatCard
          label={qualifiedThisWeek.label}
          value={qualifiedThisWeek.value}
          deltaText={qualifiedThisWeek.deltaText}
          deltaTone={qualifiedThisWeek.deltaTone}
        />
        <StatCard
          label={followUpsDueToday.label}
          value={followUpsDueToday.value}
          deltaText={followUpsDueToday.deltaText}
          deltaTone={followUpsDueToday.deltaTone}
        />
      </div>

      {/* Prominent TAT & SLA Violations Widget */}
      <TatViolationsWidget />

      {/* ChartPanel full width */}
      <ChartPanel />

      {/* Getting Started Setup Checklist Widget */}
      <GettingStartedChecklist />

      {/* Recent Activity Card: last ~6 lead events in a simple vertical list */}
      <Card className="p-5 bg-card border border-border shadow-none rounded-md space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-border">
          <h3 className="font-heading font-extrabold text-sm text-foreground">
            Recent Activity
          </h3>
          <span className="text-xs text-muted-foreground">
            Real-time feed
          </span>
        </div>

        <div className="divide-y divide-border/60 text-xs">
          {RECENT_ACTIVITY_EVENTS.map((event) => (
            <div
              key={event.id}
              className="py-2.5 flex items-center justify-between gap-4 first:pt-0 last:pb-0 hover:bg-muted/20 transition-colors px-1 rounded"
            >
              <div className="space-y-0.5">
                <div className="font-semibold text-foreground">
                  {event.title}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  <strong className="text-foreground font-medium">{event.leadName}</strong> ({event.company}) • Logged by {event.agent}
                </div>
              </div>

              <div className="flex items-center gap-1 text-[11px] text-muted-foreground tabular-nums shrink-0">
                <Clock className="h-3 w-3" />
                <span>{event.time}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Floating Persistent Trial Reward Gamification Widget */}
      <TrialRewardWidget />
    </div>
  );
}
