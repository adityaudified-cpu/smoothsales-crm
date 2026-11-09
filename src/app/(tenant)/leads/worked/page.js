"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Phone,
  PhoneCall,
  PhoneIncoming,
  PhoneOutgoing,
  MessageCircle,
  Search,
  Download,
  TrendingUp,
  RotateCcw,
  X,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetClose,
} from "@/components/ui/sheet";
import { useLeads } from "@/lib/hooks/use-leads";
import { formatDistanceToNowStrict, format, isToday, isThisWeek } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { formatCellValue, parseValidDate } from "@/lib/format-cell-value";
import { WorkedInsights } from "@/components/leads/worked-insights";
import { encodeLeadId } from "@/lib/lead-id-codec";

export default function WorkedLeadsPage() {
  const { data: leads, isLoading } = useLeads();
  const [selectedRep, setSelectedRep] = useState("all");
  const [outcomeFilter, setOutcomeFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLeadForAudit, setSelectedLeadForAudit] = useState(null);

  // Filter worked leads (has attempts or last_worked or last_user_remark)
  const allWorkedLeads = useMemo(() => {
    return leads.filter(
      (lead) =>
        Boolean(lead.last_worked || lead.last_user_remark || Number(lead.attempts) > 0 || Number(lead.unanswered_calls) > 0)
    );
  }, [leads]);

  // Telemetry Calculations
  const telemetry = useMemo(() => {
    const total = allWorkedLeads.length;
    if (total === 0) return { total: 0, connectedRate: 0, avgAttempts: 0, recoveryRate: 0 };

    const connectedCount = allWorkedLeads.filter((l) =>
      String(l.lead_disposition || l.last_call_outcome || "").toLowerCase().includes("connect")
    ).length;

    const totalAttempts = allWorkedLeads.reduce((acc, l) => acc + (Number(l.attempts) || 1), 0);
    const avgAttempts = (totalAttempts / total).toFixed(1);

    const recoveredCount = allWorkedLeads.filter(
      (l) => Number(l.answered_after_missed) > 0 || Number(l.times_re_engaged) > 0
    ).length;
    const recoveryRate = Math.round((recoveredCount / total) * 100);
    const connectedRate = Math.round((connectedCount / total) * 100);

    return { total, connectedRate, avgAttempts, recoveryRate };
  }, [allWorkedLeads]);

  // Unique Reps for filter
  const uniqueReps = useMemo(() => {
    const reps = new Set();
    allWorkedLeads.forEach((l) => {
      if (l.lead_owner?.name) reps.add(l.lead_owner.name);
    });
    return Array.from(reps);
  }, [allWorkedLeads]);

  // Filtered worked leads
  const filteredWorkedLeads = useMemo(() => {
    return allWorkedLeads.filter((lead) => {
      if (selectedRep !== "all" && lead.lead_owner?.name !== selectedRep) return false;

      if (outcomeFilter !== "all") {
        const disp = String(lead.lead_disposition || lead.last_call_outcome || "").toLowerCase();
        if (outcomeFilter === "connected" && !disp.includes("connect")) return false;
        if (outcomeFilter === "interested" && !disp.includes("interest")) return false;
        if (outcomeFilter === "unanswered" && !disp.includes("rnr") && !disp.includes("busy")) return false;
      }

      if (dateFilter !== "all" && lead.last_worked) {
        const workedDate = new Date(lead.last_worked);
        if (dateFilter === "today" && !isToday(workedDate)) return false;
        if (dateFilter === "this_week" && !isThisWeek(workedDate)) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const str = `${lead.lead_name || lead.name || ""} ${lead.mobile_number || lead.phone || ""} ${lead.city || ""} ${lead.business || ""} ${lead.lead_owner?.name || ""}`.toLowerCase();
        if (!str.includes(q)) return false;
      }

      return true;
    });
  }, [allWorkedLeads, selectedRep, outcomeFilter, dateFilter, searchQuery]);

  // Quick Action Handlers
  const handleCall = (e, lead) => {
    e.stopPropagation();
    const phone = String(lead.mobile_number || lead.phone || "").trim();
    if (!phone) return toast.error("This lead has no phone number");
    toast.success(`Dialing ${lead.lead_name || lead.name}...`);
    window.location.assign(`tel:${phone.replace(/[^\d+]/g, "")}`);
  };

  const handleWhatsApp = (e, lead) => {
    e.stopPropagation();
    const phone = String(lead.mobile_number || lead.phone || "").replace(/\D/g, "");
    if (!phone) return toast.error("This lead has no phone number");
    const name = lead.lead_name || lead.name || "there";
    const text = encodeURIComponent(`Hi ${name}, following up on our earlier conversation from SmoothSales.`);
    window.open(`https://wa.me/${phone}?text=${text}`, "_blank", "noopener,noreferrer");
  };

  const handleCopy = (e, text) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const exportWorkedCSV = () => {
    const headers = ["Lead Name", "Phone", "Rep", "Attempts", "Last Disposition", "Call Nature", "Last Worked", "Remarks"];
    const rows = filteredWorkedLeads.map((l) => [
      `"${l.lead_name || l.name || ""}"`,
      `"${l.mobile_number || l.phone || ""}"`,
      `"${l.lead_owner?.name || "Unassigned"}"`,
      l.attempts || 1,
      `"${l.lead_disposition || l.last_call_outcome || ""}"`,
      `"${l.last_call_nature || ""}"`,
      `"${l.last_worked ? format(new Date(l.last_worked), "yyyy-MM-dd HH:mm") : ""}"`,
      `"${(l.last_user_remark || "").replace(/"/g, '""')}"`,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `worked_leads_audit_${format(new Date(), "yyyyMMdd")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Worked leads audit CSV exported");
  };

  return (
    <div className="flex w-full flex-col gap-2.5 pb-12">
      {/* 1. Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/80 bg-card px-3.5 py-2 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-4 w-4" />
          </div>
          <div>
            <h1 className="font-heading text-sm font-bold text-foreground tracking-tight">
              Worked Leads Audit Ledger
            </h1>
            <p className="text-[11px] text-muted-foreground">
              Audit trail of leads contacted, attempted, or remarked · {allWorkedLeads.length} total worked records
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={exportWorkedCSV}
            className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground"
          >
            <Download className="h-3 w-3" />
            <span>Export Audit CSV</span>
          </Button>
          <Button asChild size="sm" className="h-7 gap-1 text-xs bg-primary text-primary-foreground font-semibold rounded-lg shadow-2xs">
            <Link href="/leads/active">
              <ArrowLeft className="h-3 w-3" />
              <span>Active Leads</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* 2. Calling Performance Telemetry Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        <div className="flex items-center gap-2.5 p-2.5 rounded-xl border border-border/70 bg-card">
          <div className="h-7 w-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <PhoneCall className="h-3.5 w-3.5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[10px] text-muted-foreground font-semibold uppercase leading-none mb-1">
              Worked Leads
            </div>
            <div className="text-lg font-bold font-mono leading-none text-foreground">
              {telemetry.total}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 p-2.5 rounded-xl border border-emerald-500/25 bg-emerald-500/5">
          <div className="h-7 w-7 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="h-3.5 w-3.5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[10px] text-emerald-700 dark:text-emerald-300 font-semibold uppercase leading-none mb-1">
              Connected Rate
            </div>
            <div className="text-lg font-bold font-mono leading-none text-emerald-600 dark:text-emerald-400">
              {telemetry.connectedRate}%
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 p-2.5 rounded-xl border border-amber-500/25 bg-amber-500/5">
          <div className="h-7 w-7 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <RotateCcw className="h-3.5 w-3.5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[10px] text-amber-700 dark:text-amber-300 font-semibold uppercase leading-none mb-1">
              Avg Dials / Lead
            </div>
            <div className="text-lg font-bold font-mono leading-none text-amber-600 dark:text-amber-400">
              {telemetry.avgAttempts}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 p-2.5 rounded-xl border border-sky-500/25 bg-sky-500/5">
          <div className="h-7 w-7 rounded-lg bg-sky-500/15 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
            <TrendingUp className="h-3.5 w-3.5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[10px] text-sky-700 dark:text-sky-300 font-semibold uppercase leading-none mb-1">
              Recovery Rate
            </div>
            <div className="text-lg font-bold font-mono leading-none text-sky-600 dark:text-sky-400">
              {telemetry.recoveryRate}%
            </div>
          </div>
        </div>
      </div>

      {/* 3. Filter & Search Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-xl border border-border/80 bg-card">
        <div className="flex flex-wrap items-center gap-1.5">
          {/* Rep Filter */}
          <select
            value={selectedRep}
            onChange={(e) => setSelectedRep(e.target.value)}
            className="h-7 text-xs rounded-lg border border-input bg-background px-2 font-medium"
          >
            <option value="all">All Telecallers</option>
            {uniqueReps.map((rep) => (
              <option key={rep} value={rep}>
                {rep}
              </option>
            ))}
          </select>

          {/* Outcome Filter */}
          <div className="flex items-center gap-0.5 bg-muted/60 p-0.5 rounded-lg border border-border/60 text-xs">
            {[
              { id: "all", label: "All Outcomes" },
              { id: "connected", label: "Connected" },
              { id: "interested", label: "Interested" },
              { id: "unanswered", label: "RNR / Busy" },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setOutcomeFilter(f.id)}
                className={cn(
                  "px-2 py-0.5 rounded text-[11px] font-semibold transition-colors",
                  outcomeFilter === f.id
                    ? "bg-background text-foreground shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Date Filter */}
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="h-7 text-xs rounded-lg border border-input bg-background px-2 font-medium"
          >
            <option value="all">All Dates</option>
            <option value="today">Worked Today</option>
            <option value="this_week">Worked This Week</option>
          </select>
        </div>

        {/* Search Input */}
        <div className="relative min-w-[200px] flex-1 sm:flex-initial">
          <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search worked leads..."
            className="h-7 pl-8 text-xs bg-background"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1.5 p-0.5 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 4. High-Density Worked Leads Audit Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border/80 bg-muted/40 text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">
                <th className="py-2.5 px-3">Lead &amp; Contact</th>
                <th className="py-2.5 px-3">Rep</th>
                <th className="py-2.5 px-2 text-center">Dials</th>
                <th className="py-2.5 px-3">Last Disposition</th>
                <th className="py-2.5 px-3">Direction &amp; Nature</th>
                <th className="py-2.5 px-3">Last Worked</th>
                <th className="py-2.5 px-3">Telecaller Remark</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredWorkedLeads.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-xs text-muted-foreground">
                    No worked leads match your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredWorkedLeads.map((lead) => {
                  const name = lead.lead_name || lead.name || "Unnamed Lead";
                  const phone = lead.mobile_number || lead.phone || "";
                  const attempts = Number(lead.attempts) || 1;
                  const repName = lead.lead_owner?.name || "Unassigned";
                  const disp = lead.lead_disposition || lead.last_call_outcome || "—";
                  const isConnected = disp.toLowerCase().includes("connect") || disp.toLowerCase().includes("interest");
                  const isOutbound = lead.last_call_direction !== "inbound";
                  const callNature = lead.last_call_nature || "—";
                  const remark = lead.last_user_remark || "—";
                  const workedDate = parseValidDate(lead.last_worked);

                  return (
                    <tr
                      key={lead.id}
                      onClick={() => setSelectedLeadForAudit(lead)}
                      className="hover:bg-muted/40 transition-colors cursor-pointer group"
                    >
                      {/* Lead & Contact */}
                      <td className="py-2 px-3">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6 text-[9.5px] font-bold border border-border">
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {name.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <Link
                              href={`/leads/active/${encodeLeadId(lead.id)}`}
                              onClick={(e) => e.stopPropagation()}
                              className="font-bold text-foreground hover:text-primary hover:underline text-xs truncate block"
                            >
                              {name}
                            </Link>
                            <span className="font-mono text-[10.5px] text-muted-foreground">
                              {phone || lead.city}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Rep */}
                      <td className="py-2 px-3 whitespace-nowrap">
                        <span className="text-xs font-medium text-foreground">{repName}</span>
                      </td>

                      {/* Dials Badge */}
                      <td className="py-2 px-2 text-center">
                        <span
                          className={cn(
                            "inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full text-[10.5px] font-bold font-mono border",
                            attempts >= 3
                              ? "bg-amber-500/10 text-amber-600 border-amber-500/30"
                              : "bg-muted text-muted-foreground border-border"
                          )}
                        >
                          {attempts}
                        </span>
                      </td>

                      {/* Disposition */}
                      <td className="py-2 px-3 whitespace-nowrap">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border",
                            isConnected
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25"
                              : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25"
                          )}
                        >
                          <span
                            className={cn(
                              "h-1.5 w-1.5 rounded-full",
                              isConnected ? "bg-emerald-500" : "bg-rose-500"
                            )}
                          />
                          <span>{disp}</span>
                        </span>
                      </td>

                      {/* Direction & Nature */}
                      <td className="py-2 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-xs text-foreground">
                          {isOutbound ? (
                            <PhoneOutgoing className="h-3 w-3 text-emerald-500 shrink-0" />
                          ) : (
                            <PhoneIncoming className="h-3 w-3 text-sky-500 shrink-0" />
                          )}
                          <span className="truncate max-w-[140px] text-[11.5px]">{callNature}</span>
                        </div>
                      </td>

                      {/* Last Worked */}
                      <td className="py-2 px-3 whitespace-nowrap text-muted-foreground text-[11px]">
                        {workedDate ? (
                          <span title={format(workedDate, "dd MMM yyyy, hh:mm a")}>
                            {formatDistanceToNowStrict(workedDate)} ago
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>

                      {/* Remark */}
                      <td className="py-2 px-3 max-w-[200px]">
                        <p className="truncate text-[11.5px] text-foreground italic">
                          {remark !== "—" ? <>&ldquo;{remark}&rdquo;</> : <span className="text-muted-foreground">—</span>}
                        </p>
                      </td>

                      {/* Actions */}
                      <td className="py-2 px-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={(e) => handleCall(e, lead)}
                            title="Call Lead"
                            className="p-1.5 rounded text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                          >
                            <Phone className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleWhatsApp(e, lead)}
                            title="WhatsApp"
                            className="p-1.5 rounded text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                          >
                            <MessageCircle className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedLeadForAudit(lead);
                            }}
                            title="Audit Call History"
                            className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Salesperson breakdown & recent activities */}
      <WorkedInsights leads={filteredWorkedLeads} allLeads={leads} />

      {/* 6. Call History & Touch Audit Slide-over Sheet */}
      <Sheet open={Boolean(selectedLeadForAudit)} onOpenChange={(open) => !open && setSelectedLeadForAudit(null)}>
        <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col bg-card border-l border-border">
          {selectedLeadForAudit && (
            <>
              <SheetHeader className="p-4 border-b border-border bg-muted/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Avatar className="h-8 w-8 text-xs font-bold border border-border">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {(selectedLeadForAudit.lead_name || selectedLeadForAudit.name || "LD")
                          .slice(0, 2)
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <SheetTitle className="text-sm font-bold text-foreground">
                        {selectedLeadForAudit.lead_name || selectedLeadForAudit.name}
                      </SheetTitle>
                      <SheetDescription className="text-[11px] text-muted-foreground">
                        {selectedLeadForAudit.mobile_number || selectedLeadForAudit.phone} · Assigned:{" "}
                        {selectedLeadForAudit.lead_owner?.name || "Unassigned"}
                      </SheetDescription>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[10px] font-mono">
                    {selectedLeadForAudit.id}
                  </Badge>
                </div>
              </SheetHeader>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
                {/* Calling Audit Details */}
                <div className="p-3 rounded-xl bg-muted/30 border border-border space-y-2">
                  <div className="text-[10.5px] font-bold uppercase tracking-wider text-muted-foreground">
                    Telemetry Execution Audit
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between py-1 border-b border-border/40">
                      <span className="text-muted-foreground">Attempts Count:</span>
                      <span className="font-mono font-bold text-foreground">
                        {selectedLeadForAudit.attempts || 1} dials
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-border/40">
                      <span className="text-muted-foreground">Speed to 1st Call:</span>
                      <span className="font-mono font-bold text-emerald-600">
                        {selectedLeadForAudit.speed_to_first_call || "—"}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-border/40">
                      <span className="text-muted-foreground">Last Disposition:</span>
                      <span className="font-semibold text-foreground">
                        {selectedLeadForAudit.lead_disposition || selectedLeadForAudit.last_call_outcome || "—"}
                      </span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-muted-foreground">Last Telecaller Remark:</span>
                      <span className="font-medium text-foreground text-right italic max-w-[200px]">
                        {selectedLeadForAudit.last_user_remark ? <>&ldquo;{selectedLeadForAudit.last_user_remark}&rdquo;</> : "—"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-3 border-t border-border bg-muted/20 flex items-center justify-between">
                <Button
                  asChild
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs font-semibold gap-1"
                >
                  <Link href={`/leads/active/${encodeLeadId(selectedLeadForAudit.id)}`}>
                    <span>Open Lead 360</span>
                  </Link>
                </Button>
                <SheetClose asChild>
                  <Button size="sm" className="h-8 text-xs bg-primary text-primary-foreground font-semibold">
                    Close Audit
                  </Button>
                </SheetClose>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
