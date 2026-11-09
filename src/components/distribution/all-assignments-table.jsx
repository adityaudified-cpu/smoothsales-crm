"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Users,
  Search,
  Filter,
  UserCheck,
  UserX,
  Phone,
  MessageSquare,
  Star,
  ExternalLink,
  ChevronDown,
  ArrowUpDown,
  Download,
  CheckCircle2,
  Clock,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const STAGE_COLORS = {
  New: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-800",
  Contacted: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800",
  Qualified: "bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200 dark:border-purple-800",
  "Proposal Sent": "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800",
  Won: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
  Lost: "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200 dark:border-rose-800",
};

export function AllAssignmentsTable({
  leads = [],
  reps = [],
  onReassignLead = () => {},
  onBatchReassign = () => {},
  onBatchUnassign = () => {},
  onUpdatePriority = () => {},
  selectedRepFilter = null,
  onClearRepFilter = () => {},
  telemetryFilter = "all",
}) {
  const [activeTab, setActiveTab] = useState("all"); // 'all' | 'assigned' | 'unassigned' | 'high_priority'

  // Sync activeTab when telemetryFilter changes from KPI cards
  React.useEffect(() => {
    if (telemetryFilter === "assigned") setActiveTab("assigned");
    else if (telemetryFilter === "unassigned") setActiveTab("unassigned");
    else setActiveTab("all");
  }, [telemetryFilter]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [ownerFilter, setOwnerFilter] = useState(selectedRepFilter || "all");
  const [selectedIds, setSelectedIds] = useState([]);

  // Sync ownerFilter when selectedRepFilter changes from parent (including clear)
  React.useEffect(() => {
    setOwnerFilter(selectedRepFilter || "all");
  }, [selectedRepFilter]);

  // Distinct sources
  const sources = useMemo(() => {
    const set = new Set();
    for (const lead of leads) {
      if (lead.lead_source) set.add(lead.lead_source);
    }
    return Array.from(set);
  }, [leads]);

  // Counts
  const assignedCount = leads.filter((l) => l.lead_owner && l.lead_owner.name).length;
  const unassignedCount = leads.length - assignedCount;
  const highPriorityCount = leads.filter((l) => (l.lead_priority || l.priority || 0) >= 4).length;

  // Filtered leads
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      // Tab filter
      if (activeTab === "assigned" && (!lead.lead_owner || !lead.lead_owner.name)) return false;
      if (activeTab === "unassigned" && lead.lead_owner && lead.lead_owner.name) return false;
      if (activeTab === "high_priority" && (lead.lead_priority || lead.priority || 0) < 4) return false;

      // Owner filter
      if (ownerFilter !== "all") {
        if (ownerFilter === "unassigned") {
          if (lead.lead_owner && lead.lead_owner.name) return false;
        } else {
          if (lead.lead_owner?.name?.toLowerCase() !== ownerFilter.toLowerCase()) return false;
        }
      }

      // Source filter
      if (sourceFilter !== "all" && lead.lead_source !== sourceFilter) return false;

      // Text search
      if (searchQuery.trim()) {
        const text = `${lead.lead_name || lead.name || ""} ${lead.lead_owner?.name || "Unassigned"} ${lead.lead_source || ""} ${lead.city || ""} ${lead.mobile_number || lead.phone || ""}`.toLowerCase();
        if (!text.includes(searchQuery.toLowerCase().trim())) return false;
      }

      return true;
    });
  }, [leads, activeTab, ownerFilter, sourceFilter, searchQuery]);

  const allSelected =
    filteredLeads.length > 0 &&
    filteredLeads.every((l) => selectedIds.includes(l.id));

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredLeads.map((l) => l.id));
    }
  };

  const toggleSelectLead = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleExportCSV = () => {
    const leadsToExport =
      selectedIds.length > 0
        ? leads.filter((l) => selectedIds.includes(l.id))
        : filteredLeads;

    const headers = ["Lead Name", "Owner", "Source", "Stage", "Priority", "City", "Phone"];
    const rows = leadsToExport.map((l) => [
      `"${l.lead_name || l.name || ""}"`,
      `"${l.lead_owner?.name || "Unassigned"}"`,
      `"${l.lead_source || ""}"`,
      `"${l.lead_stage || l.stage || ""}"`,
      `"${l.lead_priority || l.priority || 3}"`,
      `"${l.city || ""}"`,
      `"${l.mobile_number || l.phone || ""}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `smoothsales_lead_assignments_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
      {/* Tab Filter Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-muted/20 px-4 py-2.5">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={cn(
              "px-3 py-1 rounded-md text-xs font-semibold transition-all select-none",
              activeTab === "all"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            All Leads ({leads.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("assigned")}
            className={cn(
              "px-3 py-1 rounded-md text-xs font-semibold transition-all select-none",
              activeTab === "assigned"
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            Assigned ({assignedCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("unassigned")}
            className={cn(
              "px-3 py-1 rounded-md text-xs font-semibold transition-all select-none",
              activeTab === "unassigned"
                ? "bg-amber-600 text-white shadow-xs"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            Unassigned ({unassignedCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("high_priority")}
            className={cn(
              "px-3 py-1 rounded-md text-xs font-semibold transition-all select-none",
              activeTab === "high_priority"
                ? "bg-purple-600 text-white shadow-xs"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            High Intent ≥4★ ({highPriorityCount})
          </button>
        </div>

        <div className="flex items-center gap-2">
          {selectedRepFilter && (
            <div className="flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-medium text-primary">
              <span>Filtered by: {selectedRepFilter}</span>
              <button
                type="button"
                onClick={onClearRepFilter}
                className="hover:opacity-80 font-bold"
              >
                ×
              </button>
            </div>
          )}

          <Button
            size="sm"
            variant="outline"
            onClick={handleExportCSV}
            className="h-7 text-[11px] gap-1 text-muted-foreground hover:text-foreground"
          >
            <Download className="h-3 w-3" />
            <span>Export CSV</span>
          </Button>
        </div>
      </div>

      {/* Search and Dropdowns Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search lead, owner, phone, city..."
              className="h-8 w-full rounded-md border border-input bg-background pl-8 pr-3 text-xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-primary"
            />
          </div>

          {/* Filter by Owner */}
          <select
            value={ownerFilter}
            onChange={(e) => setOwnerFilter(e.target.value)}
            className="h-8 rounded-md border border-input bg-background px-2.5 text-xs text-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-primary"
          >
            <option value="all">All Lead Owners</option>
            <option value="unassigned">Unassigned Only</option>
            {reps.map((rep) => (
              <option key={rep.id} value={rep.name}>
                {rep.name}
              </option>
            ))}
          </select>

          {/* Filter by Source */}
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="h-8 rounded-md border border-input bg-background px-2.5 text-xs text-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-primary"
          >
            <option value="all">All Sources</option>
            {sources.map((src) => (
              <option key={src} value={src}>
                {src}
              </option>
            ))}
          </select>
        </div>

        {/* Bulk Action Controls */}
        {selectedIds.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium text-muted-foreground">
              {selectedIds.length} selected
            </span>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5 font-medium">
                  <UserCheck className="h-3.5 w-3.5" />
                  <span>Reassign Selected...</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52 text-xs">
                <div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Transfer To Telecaller
                </div>
                {reps.map((rep) => (
                  <DropdownMenuItem
                    key={rep.id}
                    onClick={() => {
                      onBatchReassign(selectedIds, rep);
                      setSelectedIds([]);
                    }}
                    className="flex items-center justify-between py-1.5"
                  >
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold",
                        rep.avatarColor || "bg-primary/10 text-primary"
                      )}>
                        {rep.initials || rep.name.slice(0, 2)}
                      </span>
                      <span className="font-medium truncate">{rep.name}</span>
                    </div>
                    <span className={cn(
                      "text-[10px]",
                      rep.availability === "Available" ? "text-emerald-600" : "text-muted-foreground"
                    )}>
                      {rep.availability}
                    </span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                onBatchUnassign(selectedIds);
                setSelectedIds([]);
              }}
              className="h-8 text-xs gap-1 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900 hover:bg-rose-50"
            >
              <UserX className="h-3 w-3" />
              <span>Unassign</span>
            </Button>

            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSelectedIds([])}
              className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
            >
              Clear
            </Button>
          </div>
        )}
      </div>

      {/* Main Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-[11px] font-semibold text-muted-foreground">
              <th className="w-10 px-4 py-2.5">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={toggleSelectAll}
                  aria-label="Select all rows"
                />
              </th>
              <th className="px-3 py-2.5">Lead Name &amp; Contact</th>
              <th className="px-3 py-2.5">Assigned Telecaller</th>
              <th className="px-3 py-2.5">Pipeline Stage</th>
              <th className="px-3 py-2.5 text-center">Priority</th>
              <th className="px-3 py-2.5">Inbound Source</th>
              <th className="px-3 py-2.5">Location</th>
              <th className="px-3 py-2.5">Follow-up SLA</th>
              <th className="px-4 py-2.5 text-right">Outreach</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {filteredLeads.map((lead) => {
              const isSelected = selectedIds.includes(lead.id);
              const ownerName = lead.lead_owner?.name || null;
              const priority = lead.lead_priority || lead.priority || 3;
              const stage = lead.lead_stage || lead.stage || "New";

              return (
                <tr
                  key={lead.id}
                  className={cn(
                    "transition-colors hover:bg-muted/30",
                    isSelected && "bg-primary/5 dark:bg-primary/10"
                  )}
                >
                  {/* Select */}
                  <td className="px-4 py-2.5">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleSelectLead(lead.id)}
                      aria-label={`Select lead ${lead.lead_name || lead.name}`}
                    />
                  </td>

                  {/* Lead Name & Phone */}
                  <td className="px-3 py-2.5">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5">
                        <Link
                          href={`/leads/active/${lead.id}`}
                          className="font-semibold text-foreground hover:text-primary transition-colors hover:underline"
                        >
                          {lead.lead_name || lead.name}
                        </Link>
                        {lead.business && (
                          <span className="text-[10px] text-muted-foreground truncate max-w-[120px]">
                            · {lead.business}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {lead.mobile_number || lead.phone || "+91 98XXX XXXXX"}
                      </span>
                    </div>
                  </td>

                  {/* Assigned Owner Dropdown (Inline Reassign) */}
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-all hover:opacity-90 select-none",
                            ownerName
                              ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
                              : "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800"
                          )}
                        >
                          <span
                            className={cn(
                              "h-1.5 w-1.5 rounded-full",
                              ownerName ? "bg-emerald-500" : "bg-amber-500 animate-pulse"
                            )}
                          ></span>
                          <span>{ownerName || "Unassigned"}</span>
                          <ChevronDown className="h-3 w-3 opacity-60" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-52 text-xs">
                        <div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                          Assign Lead To
                        </div>
                        {ownerName && (
                          <DropdownMenuItem
                            onClick={() => onBatchUnassign([lead.id])}
                            className="flex items-center gap-2 text-rose-600 dark:text-rose-400 py-1.5"
                          >
                            <UserX className="h-3.5 w-3.5" />
                            <span>Mark as Unassigned</span>
                          </DropdownMenuItem>
                        )}
                        {reps.map((rep) => (
                          <DropdownMenuItem
                            key={rep.id}
                            onClick={() => onReassignLead(lead.id, rep)}
                            className="flex items-center justify-between py-1.5"
                          >
                            <div className="flex items-center gap-2">
                              <span
                                className={cn(
                                  "flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold",
                                  rep.avatarColor || "bg-primary/10 text-primary"
                                )}
                              >
                                {rep.initials || rep.name.slice(0, 2)}
                              </span>
                              <span className="font-medium truncate">{rep.name}</span>
                            </div>
                            <span
                              className={cn(
                                "text-[10px]",
                                rep.availability === "Available"
                                  ? "text-emerald-600"
                                  : "text-muted-foreground"
                              )}
                            >
                              {rep.availability}
                            </span>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>

                  {/* Stage */}
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium",
                        STAGE_COLORS[stage] || "bg-muted text-muted-foreground border-border"
                      )}
                    >
                      {stage}
                    </span>
                  </td>

                  {/* Priority Rating Stars */}
                  <td className="px-3 py-2.5 text-center whitespace-nowrap">
                    <div className="inline-flex items-center justify-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => onUpdatePriority(lead.id, star)}
                          className="hover:scale-110 transition-transform"
                          title={`Set priority ${star} stars`}
                        >
                          <Star
                            className={cn(
                              "h-3 w-3",
                              star <= priority
                                ? "text-amber-500 fill-amber-500"
                                : "text-muted/40"
                            )}
                          />
                        </button>
                      ))}
                    </div>
                  </td>

                  {/* Source */}
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    <Badge variant="outline" className="text-[10px] font-medium bg-muted/40">
                      {lead.lead_source || "Website Form"}
                    </Badge>
                  </td>

                  {/* Location */}
                  <td className="px-3 py-2.5 text-[11px] text-muted-foreground whitespace-nowrap">
                    {lead.city || "Mumbai, MH"}
                  </td>

                  {/* SLA / Last Worked */}
                  <td className="px-3 py-2.5 text-[10px] text-muted-foreground whitespace-nowrap">
                    {lead.next_followup ? (() => {
                      const isOverdue = new Date(lead.next_followup) < new Date();
                      return (
                        <span className={cn(
                          "font-medium",
                          isOverdue ? "text-rose-600 dark:text-rose-400 font-bold" : "text-foreground"
                        )}>
                          {isOverdue ? "⚠ Overdue" : lead.next_followup}
                        </span>
                      );
                    })() : (
                      <span>Not scheduled</span>
                    )}
                  </td>

                  {/* Quick Action Outreaches */}
                  <td className="px-4 py-2.5 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      {lead.mobile_number || lead.phone ? (
                        <>
                          <a
                            href={`tel:${lead.mobile_number || lead.phone}`}
                            className="flex h-6 w-6 items-center justify-center rounded-md border border-border text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
                            title="Call Lead"
                          >
                            <Phone className="h-3 w-3" />
                          </a>
                          <a
                            href={`https://wa.me/${String(lead.mobile_number || lead.phone).replace(/\D/g, "")}`}
                            target="_blank"
                            rel="noreferrer"
                            className="flex h-6 w-6 items-center justify-center rounded-md border border-border text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
                            title="WhatsApp Lead"
                          >
                            <MessageSquare className="h-3 w-3" />
                          </a>
                        </>
                      ) : null}

                      <Link
                        href={`/leads/active/${lead.id}`}
                        className="flex h-6 w-6 items-center justify-center rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        title="Open Lead Cockpit"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}

            {filteredLeads.length === 0 && (
              <tr>
                <td colSpan={9} className="p-8 text-center text-xs text-muted-foreground">
                  No leads found matching your search or filter criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Info */}
      <div className="flex items-center justify-between border-t border-border bg-muted/10 px-4 py-2 text-[11px] text-muted-foreground">
        <span>
          Showing {filteredLeads.length} of {leads.length} total lead records
        </span>
        <span>
          1-click owner changes update local state and telecaller quota counters in real time.
        </span>
      </div>
    </div>
  );
}
