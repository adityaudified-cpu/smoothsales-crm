"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useLeads } from "@/lib/hooks/use-leads";
import { buildLeadsColumns, LEADS_COLUMNS_CONFIG } from "@/lib/leads-columns.config";
import { getTenantCustomFields } from "@/lib/mock-data/tenant-custom-fields";
import { SampleDataBanner } from "@/components/leads/sample-data-banner";
import { LeadsToolbar } from "@/components/leads/leads-toolbar";
import { LeadTable } from "@/components/leads/lead-table";
import { LeadsFilterDrawer } from "@/components/leads/leads-filter-drawer";
import { FloatingBulkActions } from "@/components/leads/floating-bulk-actions";
import { exportLeadsToCSV } from "@/lib/export-utils";
import { LOCAL_STORAGE_COLUMNS_KEY } from "@/components/leads/column-chooser";
import { Users, Clock, Star, AlertTriangle } from "lucide-react";

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
  } = useLeads();

  // Multi-tenant custom fields (Part B2)
  const tenantCustomFields = useMemo(() => getTenantCustomFields("real_estate"), []);
  const fullColumnsConfig = useMemo(() => buildLeadsColumns(tenantCustomFields), [tenantCustomFields]);

  // All 63 columns visible by default
  const allColumnIds = useMemo(() => {
    return fullColumnsConfig.map((c) => c.id);
  }, [fullColumnsConfig]);

  // Column Visibility state persisted to localStorage (defaults to ALL 63 columns)
  const [visibleColumnIds, setVisibleColumnIds] = useState(() => allColumnIds);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_COLUMNS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Only use saved if it contains the full modern 63-column set, otherwise show all 63
        if (Array.isArray(parsed) && parsed.length >= 50) {
          setVisibleColumnIds(parsed);
          return;
        }
      }
      setVisibleColumnIds(allColumnIds);
    } catch {
      setVisibleColumnIds(allColumnIds);
    }
  }, [allColumnIds]);

  const handleToggleColumn = useCallback((colId) => {
    if (colId === "lead_name") return; // cannot be hidden
    setVisibleColumnIds((prev) => {
      const next = prev.includes(colId)
        ? prev.filter((id) => id !== colId)
        : [...prev, colId];
      try {
        localStorage.setItem(LOCAL_STORAGE_COLUMNS_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  const handleResetColumns = useCallback(() => {
    setVisibleColumnIds(allColumnIds);
    try {
      localStorage.setItem(LOCAL_STORAGE_COLUMNS_KEY, JSON.stringify(allColumnIds));
    } catch {}
  }, [allColumnIds]);

  const handleSelectAllColumns = useCallback(() => {
    const allIds = fullColumnsConfig.map((c) => c.id);
    setVisibleColumnIds(allIds);
    try {
      localStorage.setItem(LOCAL_STORAGE_COLUMNS_KEY, JSON.stringify(allIds));
    } catch {}
  }, [fullColumnsConfig]);

  const handleClearAllColumns = useCallback(() => {
    setVisibleColumnIds(["lead_name"]);
    try {
      localStorage.setItem(LOCAL_STORAGE_COLUMNS_KEY, JSON.stringify(["lead_name"]));
    } catch {}
  }, []);

  // Toolbar & Filtering States
  const [ownershipView, setOwnershipView] = useState("all"); // "my" | "all"
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

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleResetFilters = () => {
    setFilters({
      stages: [],
      owner: "all",
      sources: [],
      priority: null,
      cities: [],
      awaitingTouch: "all",
    });
  };

  // Row selection state
  const [rowSelection, setRowSelection] = useState({});

  // Filtered leads computation
  const filteredLeads = useMemo(() => {
    return allLeads.filter((lead) => {
      // 1. Ownership toggle: "My" filters to leads owned by mock user "Aarav Sharma"
      if (ownershipView === "my") {
        if (lead.lead_owner?.name !== "Aarav Sharma") return false;
      }

      // 2. Saved views preset filter
      if (currentSavedView === "my_leads") {
        if (lead.lead_owner?.name !== "Aarav Sharma") return false;
      } else if (currentSavedView === "unassigned") {
        if (lead.lead_owner !== null && lead.lead_owner !== undefined) return false;
      } else if (currentSavedView === "high_intent") {
        if (lead.lead_priority < 5 && !(lead.tags || []).includes("High Intent")) {
          return false;
        }
      } else if (currentSavedView === "tat_overdue") {
        if (!lead.next_followup) return false;
        const d = new Date(lead.next_followup);
        if (d >= new Date()) return false;
      } else if (currentSavedView === "proposal_sent") {
        if (lead.lead_stage !== "Proposal Sent") return false;
      }

      // 3. Search query across multiple fields
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = (lead.lead_name || lead.name || "").toLowerCase().includes(q);
        const matchesPhone = (lead.mobile_number || lead.phone || "").toLowerCase().includes(q);
        const matchesBusiness = (lead.business || "").toLowerCase().includes(q);
        const matchesEmail = (lead.email || "").toLowerCase().includes(q);
        const matchesCity = (lead.city || "").toLowerCase().includes(q);
        const matchesOwner = (lead.lead_owner?.name || "").toLowerCase().includes(q);
        const matchesTags = (lead.tags || []).some((t) => t.toLowerCase().includes(q));

        if (
          !matchesName &&
          !matchesPhone &&
          !matchesBusiness &&
          !matchesEmail &&
          !matchesCity &&
          !matchesOwner &&
          !matchesTags
        ) {
          return false;
        }
      }

      // 4. Drawer filters
      if (filters.stages.length > 0 && !filters.stages.includes(lead.lead_stage)) {
        return false;
      }
      if (filters.owner !== "all") {
        if (filters.owner === "unassigned") {
          if (lead.lead_owner !== null && lead.lead_owner !== undefined) return false;
        } else if (lead.lead_owner?.name !== filters.owner) {
          return false;
        }
      }
      if (filters.sources.length > 0 && !filters.sources.includes(lead.lead_source)) {
        return false;
      }
      if (filters.priority && lead.lead_priority !== filters.priority) {
        return false;
      }
      if (filters.cities.length > 0 && !filters.cities.includes(lead.city)) {
        return false;
      }
      if (filters.awaitingTouch !== "all") {
        if (lead.awaiting_first_touch !== filters.awaitingTouch) return false;
      }

      return true;
    });
  }, [allLeads, ownershipView, currentSavedView, searchQuery, filters]);

  // Selection helpers
  const selectedRowKeys = Object.keys(rowSelection);
  const selectedCount = selectedRowKeys.length;
  const isAllSelected =
    filteredLeads.length > 0 && selectedCount === filteredLeads.length;
  const isIndeterminate =
    selectedCount > 0 && selectedCount < filteredLeads.length;

  const handleSelectAll = (checked) => {
    if (checked) {
      const allSelectedMap = {};
      filteredLeads.forEach((_, idx) => {
        allSelectedMap[idx] = true;
      });
      setRowSelection(allSelectedMap);
    } else {
      setRowSelection({});
    }
  };

  const selectedLeadIds = useMemo(() => {
    return selectedRowKeys.map((idx) => filteredLeads[idx]?.id).filter(Boolean);
  }, [selectedRowKeys, filteredLeads]);

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

  // Quick Pipeline Intelligence Metrics
  const pipelineStats = useMemo(() => {
    const total = allLeads.length;
    const awaitingTouch = allLeads.filter(
      (l) => l.awaiting_first_touch === "YES" || l.awaiting_first_touch === true
    ).length;
    const highIntent = allLeads.filter(
      (l) => l.lead_priority >= 4 || (l.tags || []).includes("High Intent")
    ).length;
    const overdueFollowups = allLeads.filter((l) => {
      if (!l.next_followup) return false;
      const d = new Date(l.next_followup);
      return d < new Date();
    }).length;

    return { total, awaitingTouch, highIntent, overdueFollowups };
  }, [allLeads]);

  return (
    <div className="space-y-3 pb-20 w-full">
      {/* Sample Data Banner */}
      <SampleDataBanner
        isSampleData={isSampleData}
        onExit={dismissSampleData}
        onRestore={restoreSampleData}
      />

      {/* Pipeline Intelligence Metric Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="flex items-center gap-3 p-2.5 px-3 bg-card border border-border rounded-lg shadow-2xs">
          <div className="h-8 w-8 rounded-md bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0">
            <Users className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] text-muted-foreground font-medium truncate">Total Leads</div>
            <div className="text-base font-bold text-foreground font-mono leading-tight">{pipelineStats.total}</div>
          </div>
        </div>

        <div className="flex items-center gap-3 p-2.5 px-3 bg-card border border-border rounded-lg shadow-2xs">
          <div className="h-8 w-8 rounded-md bg-warning/10 text-warning flex items-center justify-center font-bold shrink-0">
            <Clock className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] text-muted-foreground font-medium truncate">Awaiting Touch</div>
            <div className="text-base font-bold text-warning font-mono leading-tight">{pipelineStats.awaitingTouch}</div>
          </div>
        </div>

        <div className="flex items-center gap-3 p-2.5 px-3 bg-card border border-border rounded-lg shadow-2xs">
          <div className="h-8 w-8 rounded-md bg-success/10 text-success flex items-center justify-center font-bold shrink-0">
            <Star className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] text-muted-foreground font-medium truncate">High Intent VIP</div>
            <div className="text-base font-bold text-success font-mono leading-tight">{pipelineStats.highIntent}</div>
          </div>
        </div>

        <div className="flex items-center gap-3 p-2.5 px-3 bg-card border border-border rounded-lg shadow-2xs">
          <div className="h-8 w-8 rounded-md bg-destructive/10 text-destructive flex items-center justify-center font-bold shrink-0">
            <AlertTriangle className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] text-muted-foreground font-medium truncate">Overdue Follow-ups</div>
            <div className="text-base font-bold text-destructive font-mono leading-tight">{pipelineStats.overdueFollowups}</div>
          </div>
        </div>
      </div>

      {/* Toolbar: My/All toggle, ColumnChooser, Search, Filters, Export */}
      <LeadsToolbar
        isAllSelected={isAllSelected}
        isIndeterminate={isIndeterminate}
        onSelectAll={handleSelectAll}
        ownershipView={ownershipView}
        onOwnershipChange={setOwnershipView}
        currentSavedView={currentSavedView}
        onSavedViewChange={setCurrentSavedView}
        onOpenFilterDrawer={() => setIsFilterDrawerOpen(true)}
        activeFilterCount={activeDrawerFilterCount}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        isRefreshing={isLoading}
        onRefresh={refreshData}
        onExportAll={() =>
          exportLeadsToCSV(filteredLeads, fullColumnsConfig, "smoothsales_active_leads.csv")
        }
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
      />

      {/* Leads Table Component with Sticky lead_name and 60+ Data Columns */}
      <LeadTable
        data={filteredLeads}
        columnsConfig={fullColumnsConfig}
        visibleColumnIds={visibleColumnIds}
        rowSelection={rowSelection}
        onRowSelectionChange={setRowSelection}
        isLoading={isLoading}
        onResetFilters={handleResetFilters}
      />

      {/* Slide-out Filter Drawer */}
      <LeadsFilterDrawer
        isOpen={isFilterDrawerOpen}
        onClose={setIsFilterDrawerOpen}
        filters={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
        totalResultsCount={filteredLeads.length}
      />

      {/* Floating Bulk Action Bar */}
      <FloatingBulkActions
        selectedCount={selectedCount}
        selectedLeadIds={selectedLeadIds}
        onClearSelection={() => setRowSelection({})}
        onBatchUpdate={batchUpdateLeads}
        onBatchDelete={batchDeleteLeads}
      />
    </div>
  );
}
