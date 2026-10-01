"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MOCK_CALLER_SCORECARD } from "@/lib/mock-data/caller-scorecard";
import {
  BarChart3,
  PhoneCall,
  Calendar,
  Download,
  ArrowUpDown,
  Phone,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Flame,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function CallerScorecardPage() {
  const [sortField, setSortField] = useState("tatComplianceRate");
  const [sortAsc, setSortAsc] = useState(false);

  // Format minutes into Xh Ym
  const formatHoursMinutes = (totalMinutes) => {
    const hrs = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    if (hrs === 0) return `${mins}m`;
    return `${hrs}h ${mins}m`;
  };

  // Format seconds into Xm Ys
  const formatMinutesSeconds = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}m ${secs.toString().padStart(2, "0")}s`;
  };

  // Sorted reps list (default: TAT compliance descending)
  const sortedReps = useMemo(() => {
    return [...MOCK_CALLER_SCORECARD].sort((a, b) => {
      const valA = a[sortField];
      const valB = b[sortField];
      if (sortAsc) {
        return valA > valB ? 1 : -1;
      }
      return valA < valB ? 1 : -1;
    });
  }, [sortField, sortAsc]);

  const handleToggleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports & Analytics"
        subtitle="End-to-end attribution across marketing channels, pipeline drop-off velocity, and sales team quotas."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              <Calendar className="h-3.5 w-3.5" />
              <span>Today</span>
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              <Download className="h-3.5 w-3.5" />
              <span>Export CSV</span>
            </Button>
          </div>
        }
      />

      {/* Reports Section Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-border">
        <Link
          href="/reports"
          className="px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground flex items-center gap-2 border-b-2 border-transparent transition-colors"
        >
          <BarChart3 className="h-3.5 w-3.5" />
          <span>Analytics Overview</span>
        </Link>
        <Link
          href="/reports/caller-scorecard"
          className="px-4 py-2 text-xs font-semibold text-primary border-b-2 border-primary flex items-center gap-2 -mb-px transition-colors"
        >
          <PhoneCall className="h-3.5 w-3.5" />
          <span>Caller Scorecard</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-primary/10 text-primary">
            {MOCK_CALLER_SCORECARD.length}
          </span>
        </Link>
      </div>

      {/* Caller Scorecard Header & Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-heading font-extrabold text-foreground flex items-center gap-2">
            <Flame className="h-4 w-4 text-primary" />
            <span>Rep Caller Scorecard & SLA Leaderboard</span>
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Real-time call volume, cumulative talk duration, first-response TAT compliance, and active/idle telephony splits.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1 font-medium text-success">
            <span className="h-2 w-2 rounded-full bg-success" />
            ≥90% Compliant
          </span>
          <span>•</span>
          <span className="flex items-center gap-1 font-medium text-warning">
            <span className="h-2 w-2 rounded-full bg-warning" />
            70–89% Due Soon/Warning
          </span>
          <span>•</span>
          <span className="flex items-center gap-1 font-medium text-destructive">
            <span className="h-2 w-2 rounded-full bg-destructive" />
            &lt;70% Breached
          </span>
        </div>
      </div>

      {/* Main Table Card */}
      <Card className="border-border bg-card shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-muted-foreground font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Sales Representative</th>
                <th
                  className="py-3 px-4 cursor-pointer hover:text-foreground"
                  onClick={() => handleToggleSort("callsTotal")}
                >
                  <div className="flex items-center gap-1">
                    <span>Total Calls</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th
                  className="py-3 px-4 cursor-pointer hover:text-foreground"
                  onClick={() => handleToggleSort("talkTimeMinutes")}
                >
                  <div className="flex items-center gap-1">
                    <span>Talk Time</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th className="py-3 px-4">Avg Duration</th>
                <th
                  className="py-3 px-4 cursor-pointer hover:text-foreground"
                  onClick={() => handleToggleSort("tatComplianceRate")}
                >
                  <div className="flex items-center gap-1">
                    <span>TAT Compliance</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th className="py-3 px-4">Active vs Idle Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sortedReps.map((rep, idx) => {
                const isTop = idx === 0 && sortField === "tatComplianceRate" && !sortAsc;

                // Color tier for TAT Compliance
                let complianceTone = "success";
                let barColor = "bg-success";
                let textColor = "text-success";
                if (rep.tatComplianceRate < 70) {
                  complianceTone = "destructive";
                  barColor = "bg-destructive";
                  textColor = "text-destructive";
                } else if (rep.tatComplianceRate < 90) {
                  complianceTone = "warning";
                  barColor = "bg-warning";
                  textColor = "text-warning";
                }

                // Active vs Idle split
                const totalShiftMinutes = rep.activeTimeMinutes + rep.idleTimeMinutes;
                const activePercent = Math.round(
                  (rep.activeTimeMinutes / totalShiftMinutes) * 100
                );
                const idlePercent = 100 - activePercent;

                return (
                  <tr
                    key={rep.userId}
                    className={cn(
                      "transition-colors",
                      isTop ? "bg-accent/40 font-semibold" : "hover:bg-muted/20"
                    )}
                  >
                    {/* Rep Name & Avatar */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8 border border-border">
                          <AvatarFallback className="text-xs font-semibold bg-accent text-accent-foreground">
                            {rep.initials}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-foreground text-sm">
                              {rep.name}
                            </span>
                            {isTop && (
                              <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px] px-1.5 py-0 uppercase">
                                Top SLA Rank
                              </Badge>
                            )}
                          </div>
                          <div className="text-[11px] text-muted-foreground font-normal">
                            {rep.role} • {rep.team}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Total Calls + Incoming/Outgoing/Missed Breakdown */}
                    <td className="py-3.5 px-4">
                      <div className="font-mono font-bold text-foreground text-sm">
                        {rep.callsTotal}
                      </div>
                      <div className="text-[10px] text-muted-foreground tabular-nums flex items-center gap-1.5 mt-0.5">
                        <span className="text-success font-medium">
                          {rep.callsIncoming} in
                        </span>
                        <span>•</span>
                        <span className="text-foreground/80 font-medium">
                          {rep.callsOutgoing} out
                        </span>
                        <span>•</span>
                        <span className="text-destructive font-medium">
                          {rep.callsMissed} missed
                        </span>
                      </div>
                    </td>

                    {/* Talk Time */}
                    <td className="py-3.5 px-4 font-mono font-bold text-foreground tabular-nums">
                      {formatHoursMinutes(rep.talkTimeMinutes)}
                    </td>

                    {/* Avg Call Duration */}
                    <td className="py-3.5 px-4 font-mono text-muted-foreground tabular-nums">
                      {formatMinutesSeconds(rep.avgCallDurationSeconds)}
                    </td>

                    {/* TAT Compliance Rate with Colored Progress Bar */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-1.5 max-w-[140px]">
                        <div className="flex items-center justify-between">
                          <span
                            className={cn(
                              "font-mono text-xs font-bold tabular-nums",
                              textColor
                            )}
                          >
                            {rep.tatComplianceRate}%
                          </span>
                          <span className="text-[10px] text-muted-foreground uppercase font-medium">
                            {complianceTone === "success"
                              ? "On Track"
                              : complianceTone === "warning"
                              ? "Due Soon"
                              : "Breached"}
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                          <div
                            className={cn("h-full rounded-full transition-all", barColor)}
                            style={{ width: `${Math.min(100, rep.tatComplianceRate)}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Active vs Idle Time Split */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-1.5 max-w-[160px]">
                        <div className="flex items-center justify-between text-[11px] font-mono tabular-nums">
                          <span className="text-foreground font-medium">
                            {formatHoursMinutes(rep.activeTimeMinutes)} ({activePercent}%)
                          </span>
                          <span className="text-muted-foreground">
                            {formatHoursMinutes(rep.idleTimeMinutes)} idle
                          </span>
                        </div>
                        {/* Stacked bar */}
                        <div
                          className="w-full h-2 rounded-full bg-muted overflow-hidden flex"
                          title={`${activePercent}% active, ${idlePercent}% idle`}
                        >
                          <div
                            className="bg-primary h-full transition-all"
                            style={{ width: `${activePercent}%` }}
                          />
                          <div
                            className="bg-muted-foreground/30 h-full transition-all"
                            style={{ width: `${idlePercent}%` }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
