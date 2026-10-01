"use client";

import React from "react";
import { PageHeader } from "@/components/layout/page-header";
import {
  leadsBySource,
  conversionFunnel,
  teamLeaderboard,
} from "@/lib/mock-data/reports";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import Link from "next/link";
import {
  Trophy,
  BarChart3,
  PieChart as PieIcon,
  TrendingUp,
  Download,
  Calendar,
  PhoneCall,
} from "lucide-react";

export default function ReportsPage() {
  const formatINR = (amount) =>
    `₹${Math.round(amount || 0).toLocaleString("en-IN")}`;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports &amp; Analytics"
        subtitle="End-to-end attribution across marketing channels, pipeline drop-off velocity, and sales team quotas."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              <Calendar className="h-3.5 w-3.5" />
              Last 30 Days
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              <Download className="h-3.5 w-3.5" />
              Export PDF
            </Button>
          </div>
        }
      />

      {/* Reports Section Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-border">
        <Link
          href="/reports"
          className="px-4 py-2 text-xs font-semibold text-primary border-b-2 border-primary flex items-center gap-2 -mb-px transition-colors"
        >
          <BarChart3 className="h-3.5 w-3.5" />
          <span>Analytics Overview</span>
        </Link>
        <Link
          href="/reports/caller-scorecard"
          className="px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground flex items-center gap-2 border-b-2 border-transparent transition-colors"
        >
          <PhoneCall className="h-3.5 w-3.5" />
          <span>Caller Scorecard</span>
        </Link>
      </div>

      {/* Top Row: Donut Chart & Horizontal Conversion Funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Donut Chart: Leads by Source */}
        <Card className="p-5 border-border bg-card shadow-xs">
          <div className="flex items-center justify-between pb-3 mb-2 border-b border-border">
            <div>
              <div className="flex items-center gap-2">
                <PieIcon className="h-4 w-4 text-primary" />
                <h3 className="font-heading font-extrabold text-sm text-foreground">
                  Leads by Marketing Source
                </h3>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Channel breakdown across 1,420 incoming prospects
              </p>
            </div>
            <Badge variant="outline" className="text-xs font-mono font-medium">
              30-Day Total
            </Badge>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={leadsBySource}
                  dataKey="count"
                  nameKey="source"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                >
                  {leadsBySource.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <RechartsTooltip
                  formatter={(val, name) => [`${val} Leads`, name]}
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    borderColor: "hsl(var(--border))",
                    borderRadius: "6px",
                    fontSize: "12px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-3 border-t border-border/70 text-xs">
            {leadsBySource.map((s) => (
              <div key={s.source} className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-sm shrink-0"
                  style={{ backgroundColor: s.fill }}
                />
                <span className="text-muted-foreground truncate">{s.source}</span>
                <span className="font-mono font-bold text-foreground ml-auto">{s.count}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Horizontal Funnel Bar Chart */}
        <Card className="p-5 border-border bg-card shadow-xs">
          <div className="flex items-center justify-between pb-3 mb-2 border-b border-border">
            <div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                <h3 className="font-heading font-extrabold text-sm text-foreground">
                  Pipeline Conversion Funnel
                </h3>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Drop-off rates from first inquiry through token booking
              </p>
            </div>
            <Badge variant="outline" className="text-xs font-semibold text-emerald-600 border-emerald-300">
              10.0% Win Rate
            </Badge>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={conversionFunnel}
                layout="vertical"
                margin={{ top: 10, right: 30, left: 40, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} />
                <YAxis
                  dataKey="stage"
                  type="category"
                  stroke="hsl(var(--foreground))"
                  fontSize={11}
                  tickLine={false}
                  width={110}
                />
                <RechartsTooltip
                  formatter={(val, name, item) => [`${val} prospects (${item.payload.rate})`, "Stage Count"]}
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    borderColor: "hsl(var(--border))",
                    borderRadius: "6px",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground pt-4 border-t border-border/70">
            <span>Fastest drop-off: Connected → Qualified (45.8% drop)</span>
            <span className="font-semibold text-foreground">Target: 12% final win rate</span>
          </div>
        </Card>
      </div>

      {/* Team Leaderboard Table */}
      <Card className="border-border bg-card shadow-xs overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-amber-500" />
            <div>
              <h3 className="font-heading font-extrabold text-sm text-foreground">
                Sales Rep Leaderboard
              </h3>
              <p className="text-xs text-muted-foreground">
                Individual deal closure velocity, conversion rates, and closed revenue
              </p>
            </div>
          </div>
          <Badge variant="outline" className="text-xs font-medium">
            Ranked by Revenue
          </Badge>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-muted-foreground font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Rank &amp; Sales Representative</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Leads Worked</th>
                <th className="py-3 px-4">Converted Deals</th>
                <th className="py-3 px-4">Conversion Rate</th>
                <th className="py-3 px-4 text-right">Closed Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {teamLeaderboard.map((rep, idx) => {
                const isTop = idx === 0;

                return (
                  <tr
                    key={rep.id}
                    className={`transition-colors ${
                      isTop
                        ? "bg-accent/40 font-semibold"
                        : "hover:bg-muted/20"
                    }`}
                  >
                    {/* Rank & Name */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center font-heading font-bold text-xs ${
                            isTop
                              ? "bg-amber-500 text-white shadow-xs"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {idx + 1}
                        </div>
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-foreground">
                              {rep.name}
                            </span>
                            {isTop && (
                              <Badge className="bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-300 text-[10px] px-1.5 py-0 uppercase">
                                Top Closer
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="py-3.5 px-4 text-muted-foreground font-normal">
                      {rep.role}
                    </td>

                    {/* Leads Worked */}
                    <td className="py-3.5 px-4 font-mono font-medium text-foreground">
                      {rep.leadsWorked}
                    </td>

                    {/* Converted */}
                    <td className="py-3.5 px-4 font-mono font-semibold text-foreground">
                      {rep.converted}
                    </td>

                    {/* Conversion Rate with Inline Progress */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2 max-w-[140px]">
                        <Progress value={rep.conversionRate * 4} className="h-2 flex-1" />
                        <span className="font-mono text-xs font-bold text-foreground">
                          {rep.conversionRate}%
                        </span>
                      </div>
                    </td>

                    {/* Closed Revenue */}
                    <td className="py-3.5 px-4 text-right font-mono font-extrabold text-foreground text-sm">
                      {formatINR(rep.revenue)}
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
