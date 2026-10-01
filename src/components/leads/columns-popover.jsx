"use client";

import React, { useState, useMemo } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  SlidersHorizontal,
  Search,
  GripVertical,
  RotateCcw,
  CheckCheck,
  X,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function ColumnsPopover({
  columns = [],
  visibleColumnIds = [],
  columnOrder = [],
  onToggleColumn,
  onReorderColumns,
  onResetColumns,
  onSelectAllColumns,
  onClearAllColumns,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("All");

  const groups = useMemo(() => {
    const set = new Set();
    columns.forEach((col) => {
      if (col.group) set.add(col.group);
    });
    return ["All", ...Array.from(set)];
  }, [columns]);

  // Order columns according to columnOrder
  const orderedColumns = useMemo(() => {
    const map = new Map(columns.map((c) => [c.id, c]));
    const result = [];

    // Add ordered ones first
    columnOrder.forEach((id) => {
      if (map.has(id)) {
        result.push(map.get(id));
        map.delete(id);
      }
    });

    // Add remaining
    map.forEach((val) => {
      result.push(val);
    });

    return result;
  }, [columns, columnOrder]);

  const filteredColumns = useMemo(() => {
    return orderedColumns.filter((col) => {
      const matchesSearch =
        col.header.toLowerCase().includes(searchQuery.toLowerCase()) ||
        col.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesGroup = selectedGroup === "All" || col.group === selectedGroup;
      return matchesSearch && matchesGroup;
    });
  }, [orderedColumns, searchQuery, selectedGroup]);

  const moveColumn = (index, direction) => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= orderedColumns.length) return;

    const newOrder = [...orderedColumns.map((c) => c.id)];
    const temp = newOrder[index];
    newOrder[index] = newOrder[newIndex];
    newOrder[newIndex] = temp;

    onReorderColumns(newOrder);
  };

  const visibleCount = visibleColumnIds.length;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-xs gap-1.5 border-border bg-background hover:bg-secondary/60 font-medium"
        >
          <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
          <span>Columns</span>
          <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] bg-primary/10 text-primary font-bold">
            {visibleCount}
          </span>
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-[360px] p-0 shadow-lg border-border bg-popover text-popover-foreground flex flex-col max-h-[520px]"
      >
        {/* Header */}
        <div className="p-3 border-b border-border bg-muted/30">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="font-heading font-bold text-xs text-foreground">
                Customize Columns
              </span>
              <span className="text-[11px] text-muted-foreground">
                ({visibleCount}/{columns.length} shown)
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onResetColumns}
              className="h-6 px-1.5 text-[11px] text-primary hover:text-primary gap-1"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Reset</span>
            </Button>
          </div>

          {/* Search box */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search 63 columns..."
              className="h-8 pl-8 text-xs bg-background border-border"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Group pill filters */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pt-2">
            {groups.map((group) => (
              <button
                key={group}
                onClick={() => setSelectedGroup(group)}
                className={cn(
                  "px-2 py-0.5 rounded text-[10.5px] font-medium whitespace-nowrap transition-colors",
                  selectedGroup === group
                    ? "bg-primary text-primary-foreground font-semibold"
                    : "bg-background border border-border text-muted-foreground hover:text-foreground"
                )}
              >
                {group}
              </button>
            ))}
          </div>
        </div>

        {/* Column List with drag / order & checkbox */}
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5 divide-y divide-border/20 text-xs">
          {filteredColumns.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground">
              No matching columns found
            </div>
          ) : (
            filteredColumns.map((col, idx) => {
              const isVisible = visibleColumnIds.includes(col.id);
              const isLeadName = col.id === "lead_name";

              return (
                <div
                  key={col.id}
                  className={cn(
                    "flex items-center justify-between px-2 py-1.5 rounded hover:bg-secondary/60 transition-colors group",
                    isVisible ? "text-foreground" : "text-muted-foreground/70"
                  )}
                >
                  <label className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0 pr-2 select-none">
                    <Checkbox
                      checked={isVisible}
                      disabled={isLeadName}
                      onCheckedChange={() => onToggleColumn(col.id)}
                      className="data-[state=checked]:bg-primary"
                    />
                    <span className="truncate text-xs font-medium">
                      {col.header}
                    </span>
                    {col.filterable && (
                      <span className="text-[10px] px-1 py-0.2 rounded bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 font-mono">
                        [F]
                      </span>
                    )}
                    {col.isCustomField && (
                      <span className="text-[9.5px] px-1 py-0.2 rounded bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20">
                        Custom
                      </span>
                    )}
                  </label>

                  {/* Reorder up/down buttons */}
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => moveColumn(idx, "up")}
                      disabled={idx === 0}
                      className="p-1 rounded hover:bg-accent disabled:opacity-30 text-muted-foreground hover:text-foreground"
                      title="Move Up"
                    >
                      <ChevronUp className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => moveColumn(idx, "down")}
                      disabled={idx === filteredColumns.length - 1}
                      className="p-1 rounded hover:bg-accent disabled:opacity-30 text-muted-foreground hover:text-foreground"
                      title="Move Down"
                    >
                      <ChevronDown className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-2 border-t border-border bg-muted/20 flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-2">
            <button
              onClick={onSelectAllColumns}
              className="text-primary hover:underline font-medium"
            >
              Select All
            </button>
            <span className="text-muted-foreground">·</span>
            <button
              onClick={onClearAllColumns}
              className="text-muted-foreground hover:text-foreground"
            >
              Deselect All
            </button>
          </div>
          <span className="text-[10.5px] text-muted-foreground font-mono">
            Persisted in browser
          </span>
        </div>
      </PopoverContent>
    </Popover>
  );
}
