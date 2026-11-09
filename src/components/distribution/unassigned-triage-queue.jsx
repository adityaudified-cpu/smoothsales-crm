"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Zap,
  UserCheck,
  CheckCircle2,
  Clock,
  Search,
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

export function UnassignedTriageQueue({
  leads = [],
  reps = [],
  onDistributeRoundRobin = () => {},
  onAssignToRep = () => {},
  isDistributing = false,
}) {
  const [selectedIds, setSelectedIds] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  const unassignedLeads = leads.filter((l) => !l.lead_owner || !l.lead_owner.name);
  const filteredUnassigned = unassignedLeads.filter((lead) => {
    const text = `${lead.lead_name || lead.name || ""} ${lead.lead_source || ""} ${lead.city || ""} ${lead.phone || lead.mobile_number || ""}`.toLowerCase();
    return text.includes(searchQuery.toLowerCase().trim());
  });

  const allSelected = filteredUnassigned.length > 0 && filteredUnassigned.every((l) => selectedIds.includes(l.id));

  const toggleSelectAll = () => {
    setSelectedIds(allSelected ? [] : filteredUnassigned.map((l) => l.id));
  };
  const toggleSelectLead = (id) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const handleBulkDistribute = () => {
    const targetIds = selectedIds.length > 0 ? selectedIds : unassignedLeads.map((l) => l.id);
    onDistributeRoundRobin(targetIds);
    setSelectedIds([]);
  };

  const handleBulkAssign = (rep) => {
    if (selectedIds.length > 0) {
      onAssignToRep(selectedIds, rep);
      setSelectedIds([]);
    }
  };

  if (unassignedLeads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-emerald-300 dark:border-emerald-800/60 bg-emerald-50/30 dark:bg-emerald-950/10 py-12 text-center">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 mb-3">
          <CheckCircle2 className="h-5 w-5" />
        </div>
        <p className="text-sm font-bold text-foreground">Triage Queue Empty</p>
        <p className="mt-1 text-xs text-muted-foreground max-w-xs">
          All leads have been allocated to active telecalling reps.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-amber-300 dark:border-amber-900/60 bg-card">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-200 dark:border-amber-900/40 bg-amber-50/40 dark:bg-amber-950/20 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <AlertTriangle className="h-4 w-4" />
            <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-bold text-amber-950 dark:text-amber-100">Unassigned Triage Queue</h2>
              <span className="rounded-full bg-amber-100 dark:bg-amber-900/60 px-2 py-0 text-[10px] font-bold text-amber-800 dark:text-amber-200">
                {unassignedLeads.length} awaiting
              </span>
            </div>
            <p className="text-[11px] text-amber-800/70 dark:text-amber-300/70">
              Conversion drops 80% if unassigned &gt; 5 mins.
            </p>
          </div>
        </div>
        <Button
          size="sm"
          onClick={handleBulkDistribute}
          disabled={isDistributing}
          className="h-8 gap-1.5 text-xs bg-amber-600 hover:bg-amber-700 text-white font-semibold shadow-sm"
        >
          <Zap className={cn("h-3.5 w-3.5", isDistributing && "animate-spin")} />
          {isDistributing ? "Distributing…" : selectedIds.length > 0
            ? `Distribute (${selectedIds.length})`
            : `Auto-Distribute All (${unassignedLeads.length})`}
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-muted/10 px-4 py-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Checkbox
              id="select-all-unassigned"
              checked={allSelected}
              onCheckedChange={toggleSelectAll}
            />
            <label htmlFor="select-all-unassigned" className="text-xs font-medium text-foreground cursor-pointer select-none">
              {selectedIds.length > 0
                ? `${selectedIds.length} of ${filteredUnassigned.length} selected`
                : `Select All (${filteredUnassigned.length})`}
            </label>
          </div>

          {selectedIds.length > 0 && (
            <div className="flex items-center gap-2 pl-2 border-l border-border">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="outline" className="h-7 text-[11px] gap-1">
                    <UserCheck className="h-3 w-3" />
                    Assign to Rep…
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-52 text-xs">
                  {reps.map((rep) => (
                    <DropdownMenuItem
                      key={rep.id}
                      onClick={() => handleBulkAssign(rep)}
                      className="flex items-center justify-between py-1.5"
                    >
                      <div className="flex items-center gap-2">
                        <span className={cn("flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold", rep.avatarColor || "bg-primary/10 text-primary")}>
                          {rep.initials || rep.name.slice(0, 2)}
                        </span>
                        <span className="font-medium truncate">{rep.name}</span>
                      </div>
                      <span className={cn("text-[10px]", rep.availability === "Available" ? "text-emerald-600" : "text-muted-foreground")}>
                        {rep.availability}
                      </span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <Button size="sm" variant="ghost" onClick={() => setSelectedIds([])} className="h-7 px-2 text-[11px] text-muted-foreground hover:text-foreground">
                Clear
              </Button>
            </div>
          )}
        </div>

        <div className="relative w-full max-w-xs">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search unassigned leads…"
            className="h-7 w-full rounded-md border border-input bg-background pl-8 pr-3 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-border bg-muted/30 text-[11px] font-semibold text-muted-foreground">
              <th className="w-10 px-4 py-2" />
              <th className="px-3 py-2">Lead & Contact</th>
              <th className="px-3 py-2">Source</th>
              <th className="px-3 py-2">Location</th>
              <th className="px-3 py-2">Queue Age</th>
              <th className="px-4 py-2 text-right">Assign</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {filteredUnassigned.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-xs text-muted-foreground">
                  No leads match your search.{" "}
                  <button type="button" onClick={() => setSearchQuery("")} className="text-primary hover:underline font-medium">
                    Clear search
                  </button>
                </td>
              </tr>
            )}
            {filteredUnassigned.map((lead) => {
              const isSelected = selectedIds.includes(lead.id);
              const createdAt = lead.created_at ? new Date(lead.created_at) : null;
              const ageMins = createdAt ? Math.max(1, Math.round((Date.now() - createdAt.getTime()) / 60000)) : null;
              const isUrgent = ageMins !== null && ageMins > 10;

              return (
                <tr
                  key={lead.id}
                  className={cn("transition-colors hover:bg-muted/20", isSelected && "bg-amber-50/40 dark:bg-amber-950/20")}
                >
                  <td className="px-4 py-2.5">
                    <Checkbox checked={isSelected} onCheckedChange={() => toggleSelectLead(lead.id)} />
                  </td>
                  <td className="px-3 py-2.5">
                    <Link href={`/leads/active/${lead.id}`} className="font-semibold text-foreground hover:text-primary transition-colors hover:underline">
                      {lead.lead_name || lead.name}
                    </Link>
                    {lead.business && <span className="text-[10px] text-muted-foreground ml-1">({lead.business})</span>}
                    <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
                      {lead.mobile_number || lead.phone || "+91 98XXX XXXXX"}
                    </p>
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    <Badge variant="outline" className="text-[10px] font-medium bg-muted/40">
                      {lead.lead_source || "Website Form"}
                    </Badge>
                  </td>
                  <td className="px-3 py-2.5 text-[11px] text-muted-foreground whitespace-nowrap">
                    <p className="font-medium text-foreground">{lead.city || "—"}</p>
                    <p className="text-[10px]">{lead.requirements?.budget || lead.budget || "—"}</p>
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    {ageMins !== null ? (
                      <div className="flex items-center gap-1.5">
                        <Clock className={cn("h-3 w-3", isUrgent ? "text-rose-500 animate-pulse" : "text-amber-500")} />
                        <span className={cn("text-[10px] font-semibold", isUrgent ? "text-rose-600 dark:text-rose-400" : "text-amber-600 dark:text-amber-400")}>
                          {ageMins}m
                        </span>
                      </div>
                    ) : (
                      <span className="text-[10px] text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-right whitespace-nowrap">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2.5 text-[11px] gap-1 font-medium border-amber-300 dark:border-amber-800 hover:bg-amber-50 dark:hover:bg-amber-950/40"
                        >
                          <UserCheck className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                          Assign
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-52 text-xs">
                        <div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                          Select Telecaller
                        </div>
                        {reps.map((rep) => (
                          <DropdownMenuItem
                            key={rep.id}
                            onClick={() => onAssignToRep([lead.id], rep)}
                            className="flex items-center justify-between py-1.5"
                          >
                            <div className="flex items-center gap-2">
                              <span className={cn("flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold", rep.avatarColor || "bg-primary/10 text-primary")}>
                                {rep.initials || rep.name.slice(0, 2)}
                              </span>
                              <span className="font-medium truncate">{rep.name}</span>
                            </div>
                            <span className={cn("text-[10px]", rep.availability === "Available" ? "text-emerald-600" : "text-muted-foreground")}>
                              {rep.availability}
                            </span>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
