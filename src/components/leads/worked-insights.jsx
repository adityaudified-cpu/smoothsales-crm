"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { formatDistanceToNowStrict } from "date-fns";
import { Activity, MapPinned, MessageCircle, Phone, StickyNote, Users } from "lucide-react";
import { collectRecentActivities } from "@/lib/leads-workspace";
import { cn } from "@/lib/utils";

const EVENT_ICONS = { call: Phone, whatsapp: MessageCircle, note: StickyNote, visit: MapPinned };
const isConnected = (lead) => lead.last_call_outcome === "Connected" || /connect/i.test(lead.lead_disposition || "");

// Call Details by salesperson + Recent activities, for the Worked Leads page.
export function WorkedInsights({ leads = [], allLeads = [] }) {
  const [activities, setActivities] = useState([]);
  useEffect(() => {
    const refresh = () => setActivities(collectRecentActivities(30));
    const timer = window.setTimeout(refresh, 0);
    window.addEventListener("focus", refresh);
    return () => { window.clearTimeout(timer); window.removeEventListener("focus", refresh); };
  }, []);

  const leadNames = useMemo(() => new Map(allLeads.map((lead) => [String(lead.id), lead.lead_name || lead.name])), [allLeads]);

  const byRep = useMemo(() => {
    const now = new Date();
    const rows = new Map();
    leads.forEach((lead) => {
      const name = lead.lead_owner?.name || lead.last_called_by || "Unassigned";
      const row = rows.get(name) || { name, worked: 0, calls: 0, connected: 0, notConnected: 0, callbacks: 0 };
      row.worked += 1;
      row.calls += Number(lead.attempts) || 1;
      if (isConnected(lead)) row.connected += 1; else row.notConnected += 1;
      if (lead.next_followup && new Date(lead.next_followup) >= now) row.callbacks += 1;
      rows.set(name, row);
    });
    return [...rows.values()].sort((a, b) => b.calls - a.calls);
  }, [leads]);

  return (
    <div className="grid gap-3 lg:grid-cols-[1.4fr_1fr]">
      <section className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="border-b border-border px-4 py-3">
          <h2 className="inline-flex items-center gap-1.5 text-xs font-semibold"><Users className="h-3.5 w-3.5 text-primary" />Activity by salesperson</h2>
          <p className="mt-0.5 text-[11px] text-muted-foreground">Calls, connects and pending callbacks per rep for the leads shown above.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-xs">
            <thead className="bg-muted/40 text-[10px] uppercase tracking-wider text-muted-foreground">
              <tr><th className="px-4 py-2">Rep</th><th className="px-3 py-2 text-right">Leads</th><th className="px-3 py-2 text-right">Calls</th><th className="px-3 py-2 text-right">Connected</th><th className="px-3 py-2">Connect rate</th><th className="px-3 py-2 text-right">Not connected</th><th className="px-4 py-2 text-right">Callbacks due</th></tr>
            </thead>
            <tbody className="divide-y divide-border/70">
              {byRep.map((row) => {
                const rate = row.worked ? Math.round((row.connected / row.worked) * 100) : 0;
                return (
                  <tr key={row.name} className="hover:bg-muted/20">
                    <td className="px-4 py-2 font-semibold">{row.name}</td>
                    <td className="px-3 py-2 text-right font-mono">{row.worked}</td>
                    <td className="px-3 py-2 text-right font-mono">{row.calls}</td>
                    <td className="px-3 py-2 text-right font-mono text-emerald-600">{row.connected}</td>
                    <td className="px-3 py-2"><div className="flex items-center gap-2"><div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted"><div className={cn("h-full rounded-full", rate >= 50 ? "bg-emerald-500" : rate >= 25 ? "bg-amber-500" : "bg-rose-500")} style={{ width: `${rate}%` }} /></div><span className="font-mono text-[10.5px]">{rate}%</span></div></td>
                    <td className="px-3 py-2 text-right font-mono text-amber-600">{row.notConnected}</td>
                    <td className="px-4 py-2 text-right font-mono">{row.callbacks}</td>
                  </tr>
                );
              })}
              {!byRep.length && <tr><td colSpan={7} className="p-6 text-center text-[11px] text-muted-foreground">No worked leads match the current filters.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="border-b border-border px-4 py-3">
          <h2 className="inline-flex items-center gap-1.5 text-xs font-semibold"><Activity className="h-3.5 w-3.5 text-primary" />Recent activities</h2>
          <p className="mt-0.5 text-[11px] text-muted-foreground">Calls, notes, visits and messages logged by the team.</p>
        </div>
        <div className="max-h-[320px] divide-y divide-border/70 overflow-y-auto">
          {activities.length ? activities.map((item) => {
            const Icon = EVENT_ICONS[item.type] || Activity;
            return (
              <Link key={`${item.leadId}-${item.id}`} href={`/leads/active/${item.leadId}`} className="flex gap-2.5 px-4 py-2 hover:bg-muted/30">
                <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[11.5px]"><span className="font-semibold">{leadNames.get(String(item.leadId)) || "Lead"}</span> · {item.title}</p>
                  {(item.snippet || item.transcript) && <p className="truncate text-[10.5px] text-muted-foreground">{item.transcript || item.snippet}</p>}
                  <p className="text-[10px] text-muted-foreground">{item.caller ? `${item.caller} · ` : ""}{item.at ? formatDistanceToNowStrict(new Date(item.at), { addSuffix: true }) : ""}</p>
                </div>
              </Link>
            );
          }) : <p className="p-6 text-center text-[11px] text-muted-foreground">Nothing logged yet. Activities saved on a lead’s page appear here.</p>}
        </div>
      </section>
    </div>
  );
}
