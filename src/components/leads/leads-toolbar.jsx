"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import {
  Search,
  Filter,
  RotateCw,
  ChevronDown,
  Check,
  Bookmark,
  X,
  Download,
  Loader2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ColumnChooser } from "./column-chooser";
import { cn } from "@/lib/utils";
import { customersApi } from "@/lib/api/customers";
import { isApiMode } from "@/lib/api/client";
import { customerToLead } from "@/lib/api/mappers";
import { useRouter } from "next/navigation";
import { encodeLeadId } from "@/lib/lead-id-codec";

export const SAVED_VIEWS = [
  { id: "all_active", label: "All Active" },
  { id: "my_leads", label: "My Leads" },
  { id: "unassigned", label: "Unassigned Pool" },
  { id: "high_intent", label: "High Intent / VIP" },
  { id: "tat_overdue", label: "Follow-up Overdue" },
  { id: "proposal_sent", label: "Proposal Sent" },
];

// Global search dropdown result item
function SearchResultItem({ lead, onSelect }) {
  const name = lead.lead_name || lead.name || "Unnamed";
  const phone = lead.mobile_number || lead.phone || "";
  const stage = lead.lead_stage || "";
  const initials = name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();

  return (
    <button
      type="button"
      onClick={() => onSelect(lead)}
      className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-muted/60 transition-colors text-left group"
    >
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-[10px] font-bold">
        {initials}
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-xs font-semibold text-foreground truncate">{name}</div>
        <div className="flex items-center gap-1.5 text-[10.5px] text-muted-foreground">
          {phone && <span className="font-mono">{phone}</span>}
          {phone && stage && <span>·</span>}
          {stage && <span>{stage}</span>}
        </div>
      </div>
    </button>
  );
}

export function LeadsToolbar({
  // Selection
  isAllSelected,
  isIndeterminate,
  onSelectAll,
  // My / All Toggle
  ownershipView = "all",
  onOwnershipChange,
  // Saved View / Filters
  currentSavedView = "all_active",
  onSavedViewChange,
  savedViewCounts = {},
  onOpenFilterDrawer,
  activeFilterCount = 0,
  // Search
  searchQuery = "",
  onSearchChange,
  // Refresh
  isRefreshing,
  onRefresh,
  // Export
  onExportAll,
  onExportSelected,
  selectedCount = 0,
  // Columns
  columns = [],
  visibleColumnIds = [],
  onToggleColumn,
  onResetColumns,
  onSelectAllColumns,
  onClearAllColumns,
  onReorderColumns,
}) {
  const router = useRouter();
  const apiMode = isApiMode();
  const selectedSavedViewObj =
    SAVED_VIEWS.find((v) => v.id === currentSavedView) || SAVED_VIEWS[0];

  // Global search state (API mode only)
  const [apiResults, setApiResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef(null);
  const dropdownRef = useRef(null);
  const debounceRef = useRef(null);

  const handleSearchInput = useCallback(
    (value) => {
      onSearchChange(value);
      if (!apiMode) return;

      clearTimeout(debounceRef.current);
      if (!value.trim() || value.trim().length < 2) {
        setApiResults([]);
        setShowDropdown(false);
        return;
      }

      setIsSearching(true);
      setShowDropdown(true);
      debounceRef.current = setTimeout(async () => {
        try {
          const result = await customersApi.search(value.trim(), { page: 0, size: 8 });
          const leads = (result.items || []).map(customerToLead);
          setApiResults(leads);
        } catch {
          setApiResults([]);
        } finally {
          setIsSearching(false);
        }
      }, 300);
    },
    [apiMode, onSearchChange]
  );

  const handleSelectResult = useCallback(
    (lead) => {
      setShowDropdown(false);
      onSearchChange("");
      router.push(`/leads/active/${encodeLeadId(lead.id)}`);
    },
    [router, onSearchChange]
  );

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(e.target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="flex flex-wrap items-center justify-between gap-2.5 p-2 bg-card border border-border rounded-xl shadow-sm text-xs">
      {/* LEFT: Checkbox first, then Search, then filters */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Select All Checkbox — leftmost */}
        <div className="flex items-center justify-center px-1 py-1">
          <Checkbox
            checked={isAllSelected || (isIndeterminate ? "indeterminate" : false)}
            onCheckedChange={onSelectAll}
            aria-label="Select all rows"
            className="data-[state=checked]:bg-primary h-4 w-4 rounded"
          />
        </div>

        {/* Search Input */}
        <div className="relative" ref={searchRef}>
          <div className="relative w-56 sm:w-64">
            {isSearching ? (
              <Loader2 className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground animate-spin" />
            ) : (
              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
            )}
            <Input
              value={searchQuery}
              onChange={(e) => handleSearchInput(e.target.value)}
              onFocus={() => {
                if (apiMode && apiResults.length > 0) setShowDropdown(true);
              }}
              data-leads-search
              aria-keyshortcuts="/ Control+K"
              title="Search leads (press / or Ctrl+K)"
              placeholder="Search leads…  ( / )"
              className="pl-8 pr-7 h-8 text-xs bg-background border-border focus-visible:ring-1 focus-visible:ring-primary rounded-lg"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  onSearchChange("");
                  setApiResults([]);
                  setShowDropdown(false);
                }}
                title="Clear search"
                className="absolute right-2 top-2 p-0.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Global search dropdown (API mode) */}
          {apiMode && showDropdown && (
            <div
              ref={dropdownRef}
              className="absolute top-full left-0 mt-1 w-72 bg-popover border border-border rounded-xl shadow-lg z-50 overflow-hidden"
            >
              {isSearching ? (
                <div className="flex items-center gap-2 px-3 py-3 text-xs text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Searching…</span>
                </div>
              ) : apiResults.length > 0 ? (
                <div className="py-1">
                  <div className="px-3 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider border-b border-border/60">
                    Results
                  </div>
                  {apiResults.map((lead) => (
                    <SearchResultItem key={lead.id} lead={lead} onSelect={handleSelectResult} />
                  ))}
                </div>
              ) : searchQuery.trim().length >= 2 ? (
                <div className="px-3 py-3 text-xs text-muted-foreground">
                  No leads found for &ldquo;{searchQuery}&rdquo;
                </div>
              ) : null}
            </div>
          )}
        </div>

        {/* My | All Segmented Toggle */}
        <div className="inline-flex items-center p-0.5 rounded-lg bg-muted border border-border select-none">
          <button
            type="button"
            onClick={() => onOwnershipChange("my")}
            className={cn(
              "px-3 py-1 text-xs font-medium rounded transition-all",
              ownershipView === "my"
                ? "bg-background text-foreground shadow-2xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            My
          </button>
          <button
            type="button"
            onClick={() => onOwnershipChange("all")}
            className={cn(
              "px-3 py-1 text-xs font-medium rounded transition-all",
              ownershipView === "all"
                ? "bg-background text-foreground shadow-2xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            All
          </button>
        </div>

        {/* Filter Drawer Trigger */}
        <Button
          variant="outline"
          size="sm"
          onClick={onOpenFilterDrawer}
          className={cn(
            "h-8 text-xs gap-1.5 border-border bg-background hover:bg-muted text-foreground relative rounded-lg",
            activeFilterCount > 0 && "border-primary/60 text-primary font-semibold bg-primary/5"
          )}
        >
          <Filter className="h-3.5 w-3.5" />
          <span>Filters</span>
          {activeFilterCount > 0 && (
            <span className="h-4 min-w-4 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </Button>

        {/* Saved View Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs gap-1.5 border-border bg-background hover:bg-muted text-foreground font-medium rounded-lg"
            >
              <Bookmark className="h-3.5 w-3.5 text-muted-foreground" />
              <span>{selectedSavedViewObj.label}</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-secondary text-secondary-foreground font-semibold">
                {savedViewCounts[currentSavedView] ?? 0}
              </span>
              <ChevronDown className="h-3 w-3 text-muted-foreground opacity-70" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56 text-xs shadow-md border-border bg-popover">
            <DropdownMenuLabel className="text-[11px] font-semibold text-muted-foreground">
              Saved Views
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {SAVED_VIEWS.map((view) => {
              const isSelected = currentSavedView === view.id;
              return (
                <DropdownMenuItem
                  key={view.id}
                  onClick={() => onSavedViewChange(view.id)}
                  className="flex items-center justify-between cursor-pointer py-1.5 text-xs"
                >
                  <span className={cn(isSelected && "font-semibold text-primary")}>
                    {view.label}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] px-1.5 py-0.2 bg-muted rounded-full text-muted-foreground font-mono">
                      {savedViewCounts[view.id] ?? 0}
                    </span>
                    {isSelected && <Check className="h-3.5 w-3.5 text-primary" />}
                  </div>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* RIGHT: Export, Columns, Refresh */}
      <div className="flex items-center gap-2">
        {/* Export to CSV Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs gap-1.5 border-border bg-background hover:bg-secondary/60 text-muted-foreground hover:text-foreground font-medium"
              title="Export leads data"
            >
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Export</span>
              <ChevronDown className="h-3 w-3 opacity-60" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52 text-xs shadow-md border-border bg-popover">
            <DropdownMenuLabel className="text-[11px] text-muted-foreground">
              Export Options
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={onExportAll}
              className="cursor-pointer py-1.5 flex items-center justify-between text-xs"
            >
              <span>Export Visible Leads</span>
              <span className="text-[10px] text-muted-foreground">CSV</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={onExportSelected}
              disabled={selectedCount === 0}
              className="cursor-pointer py-1.5 flex items-center justify-between text-xs disabled:opacity-50"
            >
              <span>Export Selected ({selectedCount})</span>
              <span className="text-[10px] text-muted-foreground">CSV</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Column Chooser */}
        <ColumnChooser
          columns={columns}
          visibleColumnIds={visibleColumnIds}
          onToggleColumn={onToggleColumn}
          onResetColumns={onResetColumns}
          onSelectAllColumns={onSelectAllColumns}
          onClearAllColumns={onClearAllColumns}
          onReorderColumns={onReorderColumns}
        />

        {/* Refresh Icon Button */}
        <Button
          variant="outline"
          size="icon"
          onClick={onRefresh}
          disabled={isRefreshing}
          title="Refresh leads"
          className="h-8 w-8 border-border bg-background hover:bg-secondary/60 text-muted-foreground hover:text-foreground shrink-0"
        >
          <RotateCw className={cn("h-3.5 w-3.5", isRefreshing && "animate-spin text-primary")} />
        </Button>
      </div>
    </div>
  );
}
