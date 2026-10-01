"use client";

import React from "react";
import {
  Search,
  Filter,
  RotateCw,
  ChevronDown,
  Check,
  Bookmark,
  X,
  Download,
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

export const SAVED_VIEWS = [
  { id: "all_active", label: "All Active", count: 24 },
  { id: "my_leads", label: "My Leads", count: 8 },
  { id: "unassigned", label: "Unassigned Pool", count: 1 },
  { id: "high_intent", label: "High Intent / VIP", count: 9 },
  { id: "tat_overdue", label: "Follow-up Overdue", count: 4 },
  { id: "proposal_sent", label: "Proposal Sent", count: 3 },
];

export function LeadsToolbar({
  // Selection
  isAllSelected,
  isIndeterminate,
  onSelectAll,
  // My / All Toggle
  ownershipView = "all", // "my" | "all"
  onOwnershipChange,
  // Saved View / Filters
  currentSavedView = "all_active",
  onSavedViewChange,
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
}) {
  const selectedSavedViewObj =
    SAVED_VIEWS.find((v) => v.id === currentSavedView) || SAVED_VIEWS[0];

  return (
    <div className="flex flex-wrap items-center justify-between gap-2.5 p-2 bg-card border border-border rounded-lg shadow-2xs text-xs">
      {/* Left toolbar cluster: Select-all, My / All toggle, Filter button, Saved View */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Select All Checkbox */}
        <div className="flex items-center justify-center pl-1 pr-1.5 py-1">
          <Checkbox
            checked={isAllSelected || (isIndeterminate ? "indeterminate" : false)}
            onCheckedChange={onSelectAll}
            aria-label="Select all rows"
            className="data-[state=checked]:bg-primary h-4 w-4 rounded"
          />
        </div>

        {/* My | All Segmented Toggle - using our design system tokens */}
        <div className="inline-flex items-center p-0.5 rounded-md bg-muted border border-border select-none">
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
            "h-8 text-xs gap-1.5 border-border bg-background hover:bg-secondary/60 text-foreground relative",
            activeFilterCount > 0 && "border-primary text-primary font-semibold"
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
              className="h-8 text-xs gap-1.5 border-border bg-background hover:bg-secondary/60 text-foreground font-medium"
            >
              <Bookmark className="h-3.5 w-3.5 text-muted-foreground" />
              <span>{selectedSavedViewObj.label}</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-secondary text-secondary-foreground font-semibold">
                {selectedSavedViewObj.count}
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
                  <div className="flex items-center gap-2">
                    <span className={cn(isSelected && "font-semibold text-primary")}>
                      {view.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] px-1.5 py-0.2 bg-muted rounded-full text-muted-foreground font-mono">
                      {view.count}
                    </span>
                    {isSelected && <Check className="h-3.5 w-3.5 text-primary" />}
                  </div>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Right toolbar cluster: Search, Export, ColumnChooser, Refresh */}
      <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search name, phone, email, city..."
            className="pl-8 pr-7 h-8 text-xs bg-background border-border focus-visible:ring-1 focus-visible:ring-primary rounded-md"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              title="Clear search"
              className="absolute right-2 top-2 p-0.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

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

        {/* Column Chooser Component (Prompt #15 Part C2) */}
        <ColumnChooser
          columns={columns}
          visibleColumnIds={visibleColumnIds}
          onToggleColumn={onToggleColumn}
          onResetColumns={onResetColumns}
          onSelectAllColumns={onSelectAllColumns}
          onClearAllColumns={onClearAllColumns}
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
