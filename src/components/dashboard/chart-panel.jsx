"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { LEAD_VOLUME_TREND_7D } from "@/lib/mock-data/dashboard-stats";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

export function ChartPanel() {
  return (
    <Card className="p-5 bg-card border border-border shadow-none rounded-md">
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-border">
        <div>
          <h3 className="font-heading font-extrabold text-sm text-foreground">
            7-Day Inbound Lead Volume
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Daily lead ingestion velocity across all active routing queues
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <span className="h-2.5 w-2.5 rounded-sm bg-primary" />
            Total Ingested
          </span>
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <span className="h-2.5 w-2.5 rounded-sm bg-success" />
            Qualified
          </span>
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={LEAD_VOLUME_TREND_7D} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                borderColor: "hsl(var(--border))",
                borderRadius: "6px",
                fontSize: "12px",
              }}
            />
            <Bar dataKey="leads" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            <Bar dataKey="qualified" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
