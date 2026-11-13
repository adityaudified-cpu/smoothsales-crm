"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
import { useLeads } from "@/lib/hooks/use-leads";
import { useAuth } from "@/lib/auth/auth-context";
import { buildLeadsColumns, DEFAULT_VISIBLE_COLUMN_IDS } from "@/lib/leads-columns.config";
import { getTenantCustomFields } from "@/lib/mock-data/tenant-custom-fields";
import { SampleDataBanner } from "@/components/leads/sample-data-banner";
import { LeadsToolbar } from "@/components/leads/leads-toolbar";
import { LeadTable } from "@/components/leads/lead-table";
import { LeadsFilterDrawer } from "@/components/leads/leads-filter-drawer";
import { FloatingBulkActions } from "@/components/leads/floating-bulk-actions";
import { ExcelUploadModal } from "@/components/leads/excel-upload-modal";
import { exportLeadsToCSV } from "@/lib/export-utils";
import { Kanban, Rows3, UploadCloud, UserPlus, X, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { LeadFormDialog } from "@/components/leads/lead-form-dialog";
import { LeadsKanban } from "@/components/leads/leads-kanban";
import { PermissionGate } from "@/components/auth/permission-gate";
import { useTeamMembers } from "@/lib/hooks/use-team-members";
import { encodeLeadId } from "@/lib/lead-id-codec";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";


import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LOCAL_STORAGE_COLUMNS_KEY } from "@/components/leads/column-chooser";
import { ATTENTION_QUEUES, matchesAttentionQueue } from "@/lib/leads-workspace";

export default function ActiveLeadsPage() {
  const {
    data: allLeads,
    isLoading,
    isSampleData,
    dismissSampleData,
    restoreSampleData,
    refreshData,
    batchDeleteLeads,
    batchUpdateLeads,
    addLeads,
    createLead,
  } = useLeads();
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditLead, setIsEditLead] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [viewMode, setViewMode] = useState("table");
  const router = useRouter();
  const { user } = useAuth();
  const myName = user?.name || "";
  const { reps: teamReps } = useTeamMembers();

  const availableCities = useMemo(() => [...new Set(allLeads.map((l) => l.city).filter(Boolean))].sort(), [allLeads]);
  const availableReps = useMemo(() => {
    // Merge API reps with any owners found in leads (covers leads assigned before rep was in API)
    const repMap = new Map(teamReps.map((r) => [r.name, r]));
    allLeads.forEach((l) => { if (l.lead_owner?.name && !repMap.has(l.lead_owner.name)) repMap.set(l.lead_owner.name, { id: l.lead_owner.id || l.lead_owner.name, name: l.lead_owner.name, initials: l.lead_owner.initials || l.lead_owner.name.slice(0, 2).toUpperCase() }); });
    return [...repMap.values()];
  }, [allLeads, teamReps]);

  const tenantCustomFields = useMemo(() => [], []);
  const fullColumnsConfig = useMemo(() => buildLeadsColumns([]), []);

  const [visibleColumnIds, setVisibleColumnIds] = useState(DEFAULT_VISIBLE_COLUMN_IDS);
  const [columnOrder, setColumnOrder] = useState([]);
  const [columnSizing, setColumnSizing] = useState({});
  const [hasLoadedColumnPreferences, setHasLoadedColumnPreferences] = useState(false);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(LOCAL_STORAGE_COLUMNS_KEY) || "null");
      if (
        Array.isArray(stored?.visibleColumnIds) &&
        stored.visibleColumnIds.length >= 8 &&
        stored.visibleColumnIds.includes("lead_name")
      ) {
        setVisibleColumnIds(stored.visibleColumnIds);
      } else {
        setVisibleColumnIds(DEFAULT_VISIBLE_COLUMN_IDS);
      }
      if (Array.isArray(stored?.columnOrder)) setColumnOrder(stored.columnOrder);
      if (stored?.columnSizing && typeof stored.columnSizing === "object") setColumnSizing(stored.columnSizing);
    } catch {
      setVisibleColumnIds(DEFAULT_VISIBLE_COLUMN_IDS);
    } finally {
      setHasLoadedColumnPreferences(true);
    }
  }, []);

  useEffect(() => {
    if (!hasLoadedColumnPreferences) return;
    localStorage.setItem(
      LOCAL_STORAGE_COLUMNS_KEY,
      JSON.stringify({ visibleColumnIds, columnOrder, columnSizing })
    );
  }, [visibleColumnIds, columnOrder, columnSizing, hasLoadedColumnPreferences]);

  const handleReorderColumns = (fromId, toId) => {
    const ordered = columnOrder.length ? [...columnOrder] : fullColumnsConfig.map((c) => c.id);
    const fromIdx = ordered.indexOf(fromId);
    const toIdx = ordered.indexOf(toId);
    if (fromIdx === -1 || toIdx === -1) return;
    const next = [...ordered];
    next.splice(fromIdx, 1);
    next.splice(toIdx, 0, fromId);
    setColumnOrder(next);
  };

  const handleToggleColumn = useCallback((colId) => {
    const col = fullColumnsConfig.find((c) => c.id === colId);
    if (col?.alwaysVisible) return;
    setVisibleColumnIds((prev) =>
      prev.includes(colId) ? prev.filter((id) => id !== colId) : [...prev, colId]
    );
  }, [fullColumnsConfig]);

  const handleResetColumns = useCallback(() => {
    setVisibleColumnIds(DEFAULT_VISIBLE_COLUMN_IDS);
    setColumnOrder([]);
    setColumnSizing({});
  }, []);

  const handleSelectAllColumns = useCallback(
    () => setVisibleColumnIds(fullColumnsConfig.map((c) => c.id)),
    [fullColumnsConfig]
  );

  const handleClearAllColumns = useCallback(() => {
    const locked = fullColumnsConfig.filter((c) => c.alwaysVisible).map((c) => c.id);
    setVisibleColumnIds(locked.length ? locked : ["lead_name"]);
  }, [fullColumnsConfig]);

  const [ownershipView, setOwnershipView] = useState("all");
  const [currentSavedView, setCurrentSavedView] = useState("all_active");
  const [searchQuery, setSearchQuery] = useState("");
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [filters, setFilters] = useState({
    stages: [],
    owner: "all",
    sources: [],
    priority: null,
    cities: [],
    awaitingTouch: "all",
  });
  const [rowSelection, setRowSelection] = useState({});
  const [attentionQueue, setAttentionQueue] = useState(null);

  const handleFilterChange = (key, value) => setFilters((prev) => ({ ...prev, [key]: value }));
  const handleResetFilters = () => {
    setFilters({ stages: [], owner: "all", sources: [], priority: null, cities: [], awaitingTouch: "all" });
    setCurrentSavedView("all_active");
    setOwnershipView("all");
    setSearchQuery("");
    setAttentionQueue(null);
  };

  const filteredLeads = useMemo(() => {
    const now = new Date();
    return allLeads.filter((lead) => {
      if (attentionQueue && !matchesAttentionQueue(lead, attentionQueue, now)) return false;
      if (ownershipView === "my" && lead.lead_owner?.name !== myName) return false;
      if (currentSavedView === "my_leads" && lead.lead_owner?.name !== myName) return false;
      else if (currentSavedView === "unassigned" && lead.lead_owner != null) return false;
      else if (currentSavedView === "high_intent") {
        if (lead.lead_priority < 4 && !(lead.tags || []).includes("High Intent")) return false;
      } else if (currentSavedView === "tat_overdue") {
        if (!lead.next_followup || new Date(lead.next_followup) >= new Date()) return false;
      } else if (currentSavedView === "proposal_sent" && lead.lead_stage !== "Proposal Sent") return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const fields = [
          lead.lead_name,
          lead.name,
          lead.mobile_number,
          lead.phone,
          lead.business,
          lead.email,
          lead.city,
          lead.lead_owner?.name,
        ];
        const tagMatch = (lead.tags || []).some((t) => t.toLowerCase().includes(q));
        if (!fields.some((f) => (f || "").toLowerCase().includes(q)) && !tagMatch) return false;
      }

      if (filters.stages.length > 0 && !filters.stages.includes(lead.lead_stage)) return false;
      if (filters.owner !== "all") {
        if (filters.owner === "unassigned") {
          if (lead.lead_owner != null) return false;
        } else if (lead.lead_owner?.name !== filters.owner) return false;
      }
      if (filters.sources.length > 0 && !filters.sources.includes(lead.lead_source)) return false;
      if (filters.priority && lead.lead_priority < filters.priority) return false;
      if (filters.cities.length > 0 && !filters.cities.includes(lead.city)) return false;
      if (filters.awaitingTouch !== "all" && lead.awaiting_first_touch !== filters.awaitingTouch) return false;
      return true;
    });
  }, [allLeads, ownershipView, currentSavedView, searchQuery, filters, attentionQueue, myName]);

  const selectedRowKeys = Object.keys(rowSelection);
  const selectedCount = selectedRowKeys.length;
  const isAllSelected = filteredLeads.length > 0 && selectedCount === filteredLeads.length;
  const isIndeterminate = selectedCount > 0 && selectedCount < filteredLeads.length;

  const handleSelectAll = (checked) => {
    if (checked) {
      const map = {};
      filteredLeads.forEach((lead) => { map[lead.id] = true; });
      setRowSelection(map);
    } else {
      setRowSelection({});
    }
  };

  const selectedLeadIds = useMemo(() => selectedRowKeys, [selectedRowKeys]);

  // Telecaller keyboard shortcuts: "/" or Ctrl+K focuses search, Ctrl+Shift+A selects visible rows, Esc clears selection.
  useEffect(() => {
    const onKeyDown = (event) => {
      const target = event.target;
      const typing = target instanceof HTMLElement && (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));
      const mod = event.ctrlKey || event.metaKey;
      if ((event.key === "/" && !typing) || (mod && event.key.toLowerCase() === "k")) {
        event.preventDefault();
        document.querySelector("[data-leads-search]")?.focus();
      } else if (mod && event.shiftKey && event.key.toLowerCase() === "a" && !typing) {
        event.preventDefault();
        const map = {};
        filteredLeads.forEach((lead) => { map[lead.id] = true; });
        setRowSelection(map);
      } else if (event.key === "Escape" && !typing && Object.keys(rowSelection).length) {
        setRowSelection({});
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [filteredLeads, rowSelection]);

  const activeDrawerFilterCount = useMemo(() => {
    let count = 0;
    if (filters.stages.length > 0) count++;
    if (filters.owner !== "all") count++;
    if (filters.sources.length > 0) count++;
    if (filters.priority) count++;
    if (filters.cities.length > 0) count++;
    if (filters.awaitingTouch !== "all") count++;
    return count;
  }, [filters]);

  const savedViewCounts = useMemo(() => {
    const now = new Date();
    return {
      all_active: allLeads.length,
      my_leads: allLeads.filter((l) => l.lead_owner?.name === myName).length,
      unassigned: allLeads.filter((l) => !l.lead_owner).length,
      high_intent: allLeads.filter((l) => l.lead_priority >= 4 || (l.tags || []).includes("High Intent")).length,
      tat_overdue: allLeads.filter((l) => l.next_followup && new Date(l.next_followup) < now).length,
      proposal_sent: allLeads.filter((l) => l.lead_stage === "Proposal Sent").length,
    };
  }, [allLeads, myName]);

  const attentionCounts = useMemo(() => {
    const now = new Date();
    return Object.fromEntries(ATTENTION_QUEUES.map((queue) => [queue.id, allLeads.filter((lead) => queue.test(lead, now)).length]));
  }, [allLeads]);

  return (
    <div className="flex flex-col gap-2.5 pb-10 w-full" suppressHydrationWarning>
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold text-foreground tracking-tight">Active Leads</h1>
          <p className="text-[11px] text-muted-foreground">
            {allLeads.length} total leads in pipeline
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="flex items-center rounded-lg border border-border bg-muted/40 p-0.5" role="group" aria-label="View">
            {[["table", Rows3, "Table"], ["board", Kanban, "Board"]].map(([mode, Icon, label]) => (
              <button
                key={mode}
                type="button"
                aria-pressed={viewMode === mode}
                onClick={() => setViewMode(mode)}
                className={cn("flex h-6 items-center gap-1 rounded-md px-2 text-[11px] font-semibold", viewMode === mode ? "bg-card text-foreground shadow-2xs" : "text-muted-foreground hover:text-foreground")}
              >
                <Icon className="h-3 w-3" />{label}
              </button>
            ))}
          </div>
          <PermissionGate action="create" resource="leads">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsUploadOpen(true)}
              className="h-7 text-xs px-2.5 gap-1.5 font-semibold rounded-lg"
            >
              <UploadCloud className="h-3 w-3" />
              <span>Import</span>
            </Button>
          </PermissionGate>
          <PermissionGate action="create" resource="leads">
            <Button
              size="sm"
              onClick={() => setIsAddOpen(true)}
              className="h-7 text-xs px-2.5 gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-2xs rounded-lg"
            >
              <UserPlus className="h-3 w-3" />
              <span>Add Lead</span>
            </Button>
          </PermissionGate>
        </div>
      </div>

      <SampleDataBanner
        isSampleData={isSampleData}
        onExit={dismissSampleData}
      />

      {/* Attention queues */}
      <div className="grid grid-cols-2 gap-1.5 md:grid-cols-3 xl:grid-cols-6">
        {ATTENTION_QUEUES.map((queue) => {
          const isActive = attentionQueue === queue.id;
          const count = attentionCounts[queue.id] || 0;
          return (
            <button
              key={queue.id}
              type="button"
              onClick={() => { setAttentionQueue(isActive ? null : queue.id); setRowSelection({}); }}
              title={queue.hint}
              aria-pressed={isActive}
              className="relative flex items-center gap-2.5 rounded-lg border border-border bg-white dark:bg-card px-3 py-2.5 text-left w-full hover:border-border"
            >
              <div className="text-sm font-bold leading-none tabular-nums shrink-0 min-w-[1.5rem] text-right text-foreground">
                {count}
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <div className="text-[11px] font-semibold leading-tight truncate text-foreground">
                  {queue.label}
                </div>
                <div className="text-[10px] leading-tight truncate text-muted-foreground mt-0.5">
                  {queue.hint}
                </div>
              </div>
              {isActive && (
                <X className="h-2.5 w-2.5 shrink-0 text-muted-foreground" />
              )}
            </button>
          );
        })}
      </div>

      {attentionQueue && (
        <div className="-mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
          <span>Showing <b className="text-foreground">{ATTENTION_QUEUES.find((q) => q.id === attentionQueue)?.label}</b> · {filteredLeads.length} lead{filteredLeads.length === 1 ? "" : "s"}</span>
          <button type="button" onClick={() => setAttentionQueue(null)} className="text-primary hover:underline">Clear</button>
        </div>
      )}

      {/* Toolbar */}
      <LeadsToolbar
        isAllSelected={isAllSelected}
        isIndeterminate={isIndeterminate}
        onSelectAll={handleSelectAll}
        ownershipView={ownershipView}
        onOwnershipChange={setOwnershipView}
        currentSavedView={currentSavedView}
        onSavedViewChange={setCurrentSavedView}
        savedViewCounts={savedViewCounts}
        onOpenFilterDrawer={() => setIsFilterDrawerOpen(true)}
        activeFilterCount={activeDrawerFilterCount}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        isRefreshing={isLoading}
        onRefresh={refreshData}
        onExportAll={() => exportLeadsToCSV(filteredLeads, fullColumnsConfig, "smoothsales_active_leads.csv")}
        onExportSelected={() => {
          const selectedRows = filteredLeads.filter((l) => selectedLeadIds.includes(l.id));
          exportLeadsToCSV(selectedRows, fullColumnsConfig, "smoothsales_selected_leads.csv");
        }}
        selectedCount={selectedCount}
        columns={fullColumnsConfig}
        visibleColumnIds={visibleColumnIds}
        onToggleColumn={handleToggleColumn}
        onResetColumns={handleResetColumns}
        onSelectAllColumns={handleSelectAllColumns}
        onClearAllColumns={handleClearAllColumns}
        onReorderColumns={handleReorderColumns}
      />

      {/* Board view (stage Kanban) or Table */}
      {viewMode === "board" ? (
        <LeadsKanban
          leads={filteredLeads}
          onStageChange={(leadId, stage) => {
            batchUpdateLeads([leadId], { lead_stage: stage, last_updated: new Date().toISOString() });
            toast.success(`Moved to ${stage}`);
          }}
        />
      ) : (
      <LeadTable
        data={filteredLeads}
        columnsConfig={fullColumnsConfig}
        visibleColumnIds={visibleColumnIds}
        columnOrder={columnOrder}
        columnSizing={columnSizing}
        onColumnSizingChange={setColumnSizing}
        onReorderColumns={handleReorderColumns}
        rowSelection={rowSelection}
        onRowSelectionChange={setRowSelection}
        isLoading={isLoading}
        onResetFilters={handleResetFilters}
        onEditLead={(lead) => setIsEditLead(lead)}
        onDeleteLead={(lead) => setDeleteTarget(lead)}
      />
      )}

      <LeadsFilterDrawer
        isOpen={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        filters={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
        totalResultsCount={filteredLeads.length}
        availableReps={availableReps}
        availableCities={availableCities}
      />

      <FloatingBulkActions
        selectedCount={selectedCount}
        selectedLeadIds={selectedLeadIds}
        onClearSelection={() => setRowSelection({})}
        onBatchUpdate={batchUpdateLeads}
        onBatchDelete={batchDeleteLeads}
      />

      <ExcelUploadModal
        open={isUploadOpen}
        onOpenChange={setIsUploadOpen}
        onLeadsImported={addLeads}
        existingLeads={allLeads}
      />

      {isAddOpen && (
        <LeadFormDialog
          open
          onOpenChange={setIsAddOpen}
          existingLeads={allLeads}
          onSubmit={async (values) => {
            const saved = await createLead({
              ...values,
              id: `manual_${Date.now()}`,
              attempts: 0,
              awaiting_first_touch: "YES",
              created_at: new Date().toISOString(),
              started_work_on: new Date().toISOString(),
              tags: [],
            });
            setIsAddOpen(false);
            toast.success(`${saved.lead_name} added`, { action: { label: "Open", onClick: () => router.push(`/leads/active/${encodeLeadId(saved.id)}`) } });
          }}
        />
      )}

      {isEditLead && (
        <LeadFormDialog
          key={isEditLead.id}
          open
          lead={isEditLead}
          onOpenChange={(open) => { if (!open) setIsEditLead(null); }}
          existingLeads={allLeads}
          onSubmit={async (values) => {
            batchUpdateLeads([isEditLead.id], { ...values, last_updated: new Date().toISOString() });
            setIsEditLead(null);
            toast.success(`${values.lead_name} updated`);
          }}
        />
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteTarget?.lead_name || deleteTarget?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the lead. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (!deleteTarget) return;
                batchDeleteLeads([deleteTarget.id]);
                toast.success(`${deleteTarget.lead_name || deleteTarget.name} deleted`);
                setDeleteTarget(null);
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" />Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
