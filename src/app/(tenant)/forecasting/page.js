"use client";

import React, { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  LineChart,
  Line,
  ReferenceLine,
} from "recharts";
import {
  TrendingUp,
  Target,
  IndianRupee,
  Calendar,
  Download,
  ArrowUp,
  ArrowDown,
} from "lucide-react";

const MONTHLY_FORECAST = [
  { month: "Apr", actual: 1820000, forecast: 1900000, quota: 2000000 },
  { month: "May", actual: 2150000, forecast: 2200000, quota: 2000000 },
  { month: "Jun", actual: 1750000, forecast: 1800000, quota: 2000000 },
  { month: "Jul", actual: 2400000, forecast: 2450000, quota: 2200000 },
  { month: "Aug", actual: 2100000, forecast: 2150000, quota: 2200000 },
  { month: "Sep", actual: null, forecast: 2600000, quota: 2200000 },
  { month: "Oct", actual: null, forecast: 2800000, quota: 2500000 },
];

const REP_QUOTAS = [
  { name: "Aarav Sharma", role: "Senior Sales Rep", quota: 800000, achieved: 680000, deals: 8, initials: "AS" },
  { name: "Pooja Deshmukh", role: "Sales Rep", quota: 600000, achieved: 590000, deals: 6, initials: "PD" },
  { name: "Vikram Singhania", role: "Sales Rep", quota: 600000, achieved: 420000, deals: 5, initials: "VS" },
  { name: "Rohit Verma", role: "Junior Sales Rep", quota: 400000, achieved: 310000, deals: 4, initials: "RV" },
];

const PIPELINE_STAGES = [
  { stage: "New / Unqualified", count: 48, value: 4800000, probability: 10 },
  { stage: "Qualified", count: 31, value: 6200000, probability: 25 },
  { stage: "Proposal Sent", count: 18, value: 5400000, probability: 50 },
  { stage: "Negotiation", count: 9, value: 3600000, probability: 75 },
  { stage: "Closed Won", count: 12, value: 4200000, probability: 100 },
];

const formatINR = (val) =>
  val >= 100000
    ? `₹${(val / 100000).toFixed(1)}L`
    : `₹${Math.round(val).toLocaleString("en-IN")}`;

export default function ForecastingPage() {
  const [period, setPeriod] = useState("quarterly");

  const totalPipelineValue = PIPELINE_STAGES.reduce((s, st) => s + st.value, 0);
  const weightedValue = PIPELINE_STAGES.reduce((s, st) => s + (st.value * st.probability) / 100, 0);
  const totalQuota = REP_QUOTAS.reduce((s, r) => s + r.quota, 0);
  const totalAchieved = REP_QUOTAS.reduce((s, r) => s + r.achieved, 0);
  const quotaPercent = Math.round((totalAchieved / totalQuota) * 100);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Forecasting"
        subtitle="Revenue forecast, quota attainment, and pipeline value by stage."
        actions={
          <div className="flex items-center gap-2">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="h-8 w-36 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">This Month</SelectItem>
                <SelectItem value="quarterly">This Quarter</SelectItem>
                <SelectItem value="yearly">This Year</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              <Download className="h-3.5 w-3.5" />
              Export
            </Button>
          </div>
        }
      />

      {/* Top KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 border-border bg-card shadow-none space-y-1">
          <p className="text-xs text-muted-foreground">Total Pipeline Value</p>
          <p className="text-2xl font-extrabold font-heading text-foreground">{formatINR(totalPipelineValue)}</p>
          <div className="flex items-center gap-1 text-xs text-emerald-600">
            <ArrowUp className="h-3 w-3" />
            <span>+18% vs last quarter</span>
          </div>
        </Card>
        <Card className="p-4 border-border bg-card shadow-none space-y-1">
          <p className="text-xs text-muted-foreground">Weighted Forecast</p>
          <p className="text-2xl font-extrabold font-heading text-foreground">{formatINR(weightedValue)}</p>
          <p className="text-xs text-muted-foreground">Probability-adjusted</p>
        </Card>
        <Card className="p-4 border-border bg-card shadow-none space-y-1">
          <p className="text-xs text-muted-foreground">Quota Attainment</p>
          <p className="text-2xl font-extrabold font-heading text-foreground">{quotaPercent}%</p>
          <Progress value={quotaPercent} className="h-1.5 mt-1" />
        </Card>
        <Card className="p-4 border-border bg-card shadow-none space-y-1">
          <p className="text-xs text-muted-foreground">Revenue Achieved</p>
          <p className="text-2xl font-extrabold font-heading text-foreground">{formatINR(totalAchieved)}</p>
          <p className="text-xs text-muted-foreground">of {formatINR(totalQuota)} target</p>
        </Card>
      </div>

      {/* Revenue Forecast Chart */}
      <Card className="p-5 border-border bg-card shadow-none">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <h3 className="font-heading font-extrabold text-sm text-foreground">Monthly Revenue vs Forecast vs Quota</h3>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1"><span className="w-3 h-1 bg-primary rounded inline-block" /> Actual</span>
            <span className="flex items-center gap-1"><span className="w-3 h-1 bg-blue-400 rounded inline-block" /> Forecast</span>
            <span className="flex items-center gap-1"><span className="w-3 h-1 bg-amber-400 rounded inline-block" /> Quota</span>
          </div>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={MONTHLY_FORECAST} margin={{ top: 5, right: 20, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="month" fontSize={11} tickLine={false} stroke="hsl(var(--muted-foreground))" />
              <YAxis fontSize={11} tickLine={false} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => formatINR(v)} />
              <RechartsTooltip
                formatter={(val, name) => [formatINR(val), name]}
                contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", borderRadius: "6px", fontSize: "12px" }}
              />
              <Bar dataKey="actual" name="Actual" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
              <Bar dataKey="forecast" name="Forecast" fill="hsl(210 80% 65%)" radius={[3, 3, 0, 0]} opacity={0.7} />
              <ReferenceLine y={2000000} stroke="hsl(45 90% 55%)" strokeDasharray="4 4" label={{ value: "Quota", fontSize: 10, fill: "hsl(45 90% 55%)" }} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pipeline by Stage */}
        <Card className="p-5 border-border bg-card shadow-none">
          <div className="flex items-center gap-2 pb-3 mb-3 border-b border-border">
            <Target className="h-4 w-4 text-primary" />
            <h3 className="font-heading font-extrabold text-sm text-foreground">Pipeline by Stage</h3>
          </div>
          <div className="space-y-3">
            {PIPELINE_STAGES.map((stage) => (
              <div key={stage.stage} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-foreground">{stage.stage}</span>
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <span className="font-mono">{stage.count} deals</span>
                    <span className="font-semibold text-foreground">{formatINR(stage.value)}</span>
                    <Badge variant="outline" className="text-[10px] px-1.5 h-4">{stage.probability}%</Badge>
                  </div>
                </div>
                <Progress value={(stage.value / totalPipelineValue) * 100} className="h-1.5" />
              </div>
            ))}
          </div>
        </Card>

        {/* Rep Quota Attainment */}
        <Card className="p-5 border-border bg-card shadow-none">
          <div className="flex items-center gap-2 pb-3 mb-3 border-b border-border">
            <IndianRupee className="h-4 w-4 text-primary" />
            <h3 className="font-heading font-extrabold text-sm text-foreground">Rep Quota Attainment</h3>
          </div>
          <div className="space-y-4">
            {REP_QUOTAS.map((rep) => {
              const pct = Math.round((rep.achieved / rep.quota) * 100);
              const isOnTrack = pct >= 80;
              return (
                <div key={rep.name} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center shrink-0">
                        {rep.initials}
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{rep.name}</p>
                        <p className="text-[11px] text-muted-foreground">{rep.role}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-mono font-bold text-foreground">{pct}%</p>
                      <p className="text-[11px] text-muted-foreground">{formatINR(rep.achieved)} / {formatINR(rep.quota)}</p>
                    </div>
                  </div>
                  <Progress
                    value={pct}
                    className={`h-1.5 ${isOnTrack ? "" : "[&>div]:bg-amber-500"}`}
                  />
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}
