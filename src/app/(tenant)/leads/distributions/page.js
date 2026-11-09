"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { GitBranch, History, Share2, SortAsc } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLeads } from "@/lib/hooks/use-leads";
import { usePersistedState } from "@/lib/hooks/use-persisted-state";
import {
  DEFAULT_DAILY_CAPACITY,
  REP_ROSTER_STORAGE_KEY,
  getRoundRobinCursor,
  setRoundRobinCursor,
} from "@/lib/leads-workspace";
import { useTeamMembers } from "@/lib/hooks/use-team-members";
import { toast } from "sonner";
import { LeadsPageHeader } from "@/components/leads/leads-page-header";
import { DistributionTelemetryCards } from "@/components/distribution/distribution-telemetry-cards";
import { ActiveRulesPreview } from "@/components/distribution/active-rules-preview";
import { RepWorkloadTable } from "@/components/distribution/rep-workload-table";
import { UnassignedTriageQueue } from "@/components/distribution/unassigned-triage-queue";
import { AllAssignmentsTable } from "@/components/distribution/all-assignments-table";
import { DistributionAuditDrawer } from "@/components/distribution/distribution-audit-drawer";
import { ReassignModal } from "@/components/distribution/reassign-modal";
const LOG_STORAGE_KEY = "smoothsales_distribution_log_v1";

const initialsOf = (name) =>
  name
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const isOpenLead = (lead) =>
  !/won|lost|disqualif|closed/i.test(lead.lead_stage || "");

// Map roster status → RepWorkloadTable availability values
const STATUS_TO_AVAILABILITY = {
  Available: "Available",
  "On Break": "Break",
  Offline: "Offline",
};
const AVAILABILITY_TO_STATUS = {
  Available: "Available",
  Break: "On Break",
  Busy: "Available", // treat "On Call" as still available for roster
  Offline: "Offline",
};

export default function LeadDistributionsPage() {
  const { data: leads, batchUpdateLeads } = useLeads();
  const { reps: apiReps } = useTeamMembers();
  const [roster, setRoster] = usePersistedState(REP_ROSTER_STORAGE_KEY, {});
  const [log, setLog] = usePersistedState(LOG_STORAGE_KEY, []);
  const [auditDrawerOpen, setAuditDrawerOpen] = useState(false);
  const [reassignModal, setReassignModal] = useState({ open: false, sourceRep: null, leadIds: [] });
  const [repFilter, setRepFilter] = useState(null);

  const rosterConfig = roster && typeof roster === "object" ? roster : {};

  // Build unified rep list with all stats
  const reps = useMemo(() => {
    // Start from API reps, then add any owners found in leads not in the API list
    const byName = new Map(apiReps.map((rep) => [rep.name, rep]));
    leads.forEach((lead) => {
      if (lead.lead_owner?.name && !byName.has(lead.lead_owner.name))
        byName.set(lead.lead_owner.name, {
          id: lead.lead_owner.id || `rep_${lead.lead_owner.name.replace(/\s/g, "_")}`,
          name: lead.lead_owner.name,
          initials: lead.lead_owner.initials || initialsOf(lead.lead_owner.name),
          role: "Sales Rep",
          email: "",
        });
    });
    const now = new Date();
    return [...byName.values()]
      .map((rep) => {
        const config = {
          status: "Available",
          capacity: DEFAULT_DAILY_CAPACITY,
          inRotation: true,
          ...(rosterConfig[rep.name] || {}),
        };
        const owned = leads.filter((l) => l.lead_owner?.name === rep.name);
        const open = owned.filter(isOpenLead);
        const contacted = owned.filter(
          (l) => Number(l.attempts) > 0 || l.awaiting_first_touch === "NO"
        ).length;
        const overdue = owned.filter(
          (l) => l.next_followup && new Date(l.next_followup) < now
        ).length;
        const highPriority = owned.filter((l) => Number(l.lead_priority) >= 4).length;
        return {
          ...rep,
          id: rep.id || `rep_${rep.name.replace(/\s/g, "_")}`,
          initials: rep.initials || initialsOf(rep.name),
          role: rep.role || "Sales Rep",
          email: rep.email || "",
          avatarColor: rep.avatarColor || "bg-primary/10 text-primary",
          // RepWorkloadTable expects these fields:
          availability: STATUS_TO_AVAILABILITY[config.status] || "Available",
          autoLeadDistribution: config.inRotation,
          maxActiveLeads: config.capacity,
          primaryTeamId: rep.primaryTeamId || null,
          isTeamLeader: rep.isTeamLeader || false,
          // Extra stats for internal use:
          status: config.status,
          inRotation: config.inRotation,
          capacity: config.capacity,
          total: owned.length,
          open: open.length,
          contacted,
          overdue,
          highPriority,
          contactedPct: owned.length
            ? Math.round((contacted / owned.length) * 100)
            : 0,
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [leads, rosterConfig]);

  const repByName = useMemo(() => new Map(reps.map((r) => [r.name, r])), [reps]);
  const repById = useMemo(() => new Map(reps.map((r) => [r.id, r])), [reps]);

  const unassigned = leads.filter((l) => !l.lead_owner);
  const assignedCount = leads.length - unassigned.length;
  const eligibleReps = reps.filter(
    (r) => r.status === "Available" && r.inRotation && r.open < r.capacity
  );

  // Persisted distribution rules (same key as distribution-rules page)
  const [rules] = usePersistedState(
    "smoothsales_distribution_rules_v1",
    []
  );
  const activeRules = (rules || []).filter((r) => r.active);

  // ── Helpers ──────────────────────────────────────────────────────────────
  const ownerPayload = (rep) => ({
    name: rep.name,
    initials: rep.initials || initialsOf(rep.name),
    role: rep.role || "Sales Rep",
  });

  const addLog = (message) =>
    setLog((cur) =>
      [
        { id: `log_${Date.now()}`, at: new Date().toISOString(), message },
        ...(Array.isArray(cur) ? cur : []),
      ].slice(0, 50)
    );

  // ── Assignment actions ────────────────────────────────────────────────────
  const assignLeads = (leadIds, rep) => {
    if (!leadIds.length) return;
    batchUpdateLeads(leadIds, {
      lead_owner: rep ? ownerPayload(rep) : null,
      last_updated: new Date().toISOString(),
    });
    addLog(
      rep
        ? `${leadIds.length} lead${leadIds.length === 1 ? "" : "s"} assigned to ${rep.name}`
        : `${leadIds.length} lead${leadIds.length === 1 ? "" : "s"} moved to unassigned`
    );
    toast.success(rep ? `Assigned ${leadIds.length} to ${rep.name}` : "Moved to unassigned");
  };

  // Round-robin distribution
  const autoDistribute = (leadPool) => {
    if (!leadPool.length) return toast.info("No leads to distribute");
    if (!eligibleReps.length)
      return toast.error("No available reps with spare capacity", {
        description: "Set a rep to Available, add them to rotation, or raise their capacity.",
      });
    const load = new Map(eligibleReps.map((r) => [r.name, r.open]));
    const buckets = new Map();
    let cursor = getRoundRobinCursor();
    let leftover = 0;
    for (const lead of leadPool) {
      let placed = false;
      for (let tries = 0; tries < eligibleReps.length; tries += 1) {
        const rep = eligibleReps[cursor % eligibleReps.length];
        cursor += 1;
        if (load.get(rep.name) < rep.capacity) {
          load.set(rep.name, load.get(rep.name) + 1);
          buckets.set(rep.name, [...(buckets.get(rep.name) || []), lead.id]);
          placed = true;
          break;
        }
      }
      if (!placed) leftover += 1;
    }
    setRoundRobinCursor(cursor % Math.max(1, eligibleReps.length));
    buckets.forEach((ids, name) =>
      batchUpdateLeads(ids, {
        lead_owner: ownerPayload(repByName.get(name)),
        last_updated: new Date().toISOString(),
      })
    );
    const summary = [...buckets.entries()]
      .map(([name, ids]) => `${name.split(" ")[0]} ${ids.length}`)
      .join(", ");
    const distributed = leadPool.length - leftover;
    addLog(`Round robin: ${distributed} lead${distributed === 1 ? "" : "s"} distributed (${summary})`);
    toast.success(`Distributed ${distributed} leads`, {
      description: leftover
        ? `${leftover} left unassigned — every rep is at capacity.`
        : summary,
    });
  };

  // FIFO distribution — oldest unassigned leads first, fills reps by capacity order
  const distributeFIFO = (leadPool) => {
    if (!leadPool.length) return toast.info("No leads to distribute");
    if (!eligibleReps.length)
      return toast.error("No available reps with spare capacity");
    // Sort leads oldest-first (by id as proxy if no created_at)
    const sorted = [...leadPool].sort(
      (a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0)
    );
    const load = new Map(eligibleReps.map((r) => [r.name, r.open]));
    const buckets = new Map();
    let leftover = 0;
    for (const lead of sorted) {
      // Pick rep with most remaining capacity
      const best = eligibleReps
        .filter((r) => load.get(r.name) < r.capacity)
        .sort((a, b) => (load.get(a.name) - a.capacity) - (load.get(b.name) - b.capacity))[0];
      if (best) {
        load.set(best.name, load.get(best.name) + 1);
        buckets.set(best.name, [...(buckets.get(best.name) || []), lead.id]);
      } else {
        leftover += 1;
      }
    }
    buckets.forEach((ids, name) =>
      batchUpdateLeads(ids, {
        lead_owner: ownerPayload(repByName.get(name)),
        last_updated: new Date().toISOString(),
      })
    );
    const distributed = leadPool.length - leftover;
    addLog(`FIFO: ${distributed} lead${distributed === 1 ? "" : "s"} distributed (oldest-first)`);
    toast.success(`FIFO distributed ${distributed} leads`, {
      description: leftover ? `${leftover} left — every rep is at capacity.` : "Oldest leads assigned first.",
    });
  };

  // ── RepWorkloadTable callbacks ────────────────────────────────────────────
  const handleUpdateRep = (repId, patch) => {
    const rep = repById.get(repId);
    if (!rep) return;
    const rosterPatch = {};
    if ("availability" in patch) {
      rosterPatch.status = AVAILABILITY_TO_STATUS[patch.availability] || patch.availability;
      addLog(`${rep.name} set to ${rosterPatch.status}`);
    }
    if ("autoLeadDistribution" in patch) {
      rosterPatch.inRotation = patch.autoLeadDistribution;
    }
    if ("maxActiveLeads" in patch) {
      rosterPatch.capacity = patch.maxActiveLeads;
    }
    setRoster((cur) => ({
      ...(cur && typeof cur === "object" ? cur : {}),
      [rep.name]: { ...((cur || {})[rep.name] || {}), ...rosterPatch },
    }));
  };

  const handleOpenReassignFromRep = (rep) => {
    const repLeadIds = leads
      .filter((l) => l.lead_owner?.name === rep.name)
      .map((l) => l.id);
    setReassignModal({ open: true, sourceRep: rep, leadIds: repLeadIds });
  };

  const handleConfirmReassignment = (leadIds, targetRep, reason) => {
    assignLeads(leadIds, targetRep);
    addLog(`${leadIds.length} lead${leadIds.length === 1 ? "" : "s"} reassigned from ${reassignModal.sourceRep?.name || "rep"} to ${targetRep.name} — ${reason}`);
  };

  // ── AllAssignmentsTable callbacks ─────────────────────────────────────────
  const handleReassignLead = (leadId, rep) => assignLeads([leadId], rep);
  const handleBatchReassign = (leadIds, rep) => assignLeads(leadIds, rep);
  const handleBatchUnassign = (leadIds) => assignLeads(leadIds, null);
  const handleUpdatePriority = (leadId, priority) => {
    batchUpdateLeads([leadId], { lead_priority: priority });
  };

  // ── UnassignedTriageQueue callbacks ───────────────────────────────────────
  const handleDistributeRoundRobin = (leadIds) => {
    const pool = leads.filter((l) => leadIds.includes(l.id));
    autoDistribute(pool);
  };
  const handleAssignToRep = (leadIds, rep) => assignLeads(leadIds, rep);

  // ── Telemetry card filter ─────────────────────────────────────────────────
  const [telemetryFilter, setTelemetryFilter] = useState("all");

  // Build audit log from real persisted activity log only (no mock data)
  const combinedAuditLog = useMemo(() => {
    return (Array.isArray(log) ? log : []).map((entry) => ({
      id: entry.id,
      leadName: "—",
      matchedRuleName: entry.message,
      assignedTo: "Manual",
      decisionTimeMs: 0,
      timestamp: entry.at
        ? new Date(entry.at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
        : "",
      triggerSource: "Manual Action",
    }));
  }, [log]);

  return (
    <div className="flex w-full flex-col gap-5 pb-10">
      <LeadsPageHeader
        icon={Share2}
        title="Lead Ownership & Distribution"
        subtitle="Balance rep workload, manage availability, and clear the unassigned queue."
      >
        <Button
          size="sm"
          variant="outline"
          className="h-8 gap-1.5 text-xs font-medium"
          onClick={() => setAuditDrawerOpen(true)}
        >
          <History className="h-3.5 w-3.5" />
          Audit Log
          {Array.isArray(log) && log.length > 0 && (
            <span className="ml-0.5 rounded-full bg-primary/10 text-primary px-1.5 text-[10px] font-bold">
              {log.length}
            </span>
          )}
        </Button>
        <Button asChild size="sm" variant="outline" className="h-8 gap-1.5 text-xs font-medium">
          <Link href="/distribution-rules">
            <GitBranch className="h-3.5 w-3.5" />
            Routing Rules
            {activeRules.length > 0 && (
              <span className="ml-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 px-1.5 text-[10px] font-bold">
                {activeRules.length}
              </span>
            )}
          </Link>
        </Button>
      </LeadsPageHeader>

      {/* KPI Telemetry Cards */}
      <DistributionTelemetryCards
        leads={leads}
        reps={reps}
        activeFilter={telemetryFilter}
        onSelectFilter={setTelemetryFilter}
        unassignedCount={unassigned.length}
        assignedCount={assignedCount}
        activeRulesCount={activeRules.length}
      />

      {/* Active Routing Rules Preview */}
      <ActiveRulesPreview rules={rules || []} />

      {/* Rep Workload & Capacity */}
      <RepWorkloadTable
        reps={reps}
        leads={leads}
        onUpdateRep={handleUpdateRep}
        onOpenReassignFromRep={handleOpenReassignFromRep}
        onFilterByRep={(name) => setRepFilter(repFilter === name ? null : name)}
        selectedRepFilter={repFilter}
      />

      {/* Unassigned Triage Queue */}
      <UnassignedTriageQueue
        leads={leads}
        reps={reps}
        onDistributeRoundRobin={handleDistributeRoundRobin}
        onAssignToRep={handleAssignToRep}
      />

      {/* FIFO Distribution — inline with unassigned queue */}
      {unassigned.length > 0 && eligibleReps.length > 0 && (
        <div className="flex items-center gap-4 rounded-xl border border-border bg-card px-5 py-3.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <SortAsc className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-foreground">FIFO Distribution</p>
            <p className="text-[11px] text-muted-foreground">
              Assign oldest {unassigned.length} unassigned lead{unassigned.length !== 1 ? "s" : ""} first — fills reps with most remaining capacity.
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="h-8 gap-1.5 text-xs font-medium shrink-0"
            onClick={() => distributeFIFO(unassigned)}
          >
            <SortAsc className="h-3.5 w-3.5" />
            Distribute (FIFO)
          </Button>
        </div>
      )}

      {/* All Assignments Table */}
      <AllAssignmentsTable
        leads={leads}
        reps={reps}
        onReassignLead={handleReassignLead}
        onBatchReassign={handleBatchReassign}
        onBatchUnassign={handleBatchUnassign}
        onUpdatePriority={handleUpdatePriority}
        selectedRepFilter={repFilter}
        onClearRepFilter={() => setRepFilter(null)}
        telemetryFilter={telemetryFilter}
      />

      {/* Audit Drawer */}
      <DistributionAuditDrawer
        open={auditDrawerOpen}
        onOpenChange={setAuditDrawerOpen}
        auditLogs={combinedAuditLog}
      />

      {/* Reassign Modal */}
      <ReassignModal
        open={reassignModal.open}
        onOpenChange={(open) => setReassignModal((s) => ({ ...s, open }))}
        sourceRep={reassignModal.sourceRep}
        leadIds={reassignModal.leadIds}
        leads={leads}
        reps={reps}
        onConfirmReassignment={handleConfirmReassignment}
      />
    </div>
  );
}
