"use client";

import React, { useState, useMemo, useRef } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Columns3, Search, RotateCcw, CheckCheck, XSquare, GripVertical } from "lucide-react";
import { COLUMN_GROUPS } from "@/lib/leads-columns.config";
import { cn } from "@/lib/utils";

export const LOCAL_STORAGE_COLUMNS_KEY = "smoothsales-leads-columns-salesmax-v6";

export function ColumnChooser({
  columns = [],
  visibleColumnIds = [],
  onToggleColumn,
  onResetColumns,
  onSelectAllColumns,
  onClearAllColumns,
  onReorderColumns,
}) {
  const [search, setSearch] = useState("");
  const dragItem = useRef(null);
  const dragOverItem = useRef(null);

  const filteredColumns = useMemo(() => {
    if (!search.trim()) return columns;
    const q = search.toLowerCase().trim();
    return columns.filter((col) => col.header.toLowerCase().includes(q));
  }, [columns, search]);

  const columnsByGroup = useMemo(() => {
    const grouped = {};
    COLUMN_GROUPS.forEach((g) => { grouped[g] = []; });
    filteredColumns.forEach((col) => {
      const g = col.group || "Other";
      if (!grouped[g]) grouped[g] = [];
      grouped[g].push(col);
    });
    return grouped;
  }, [filteredColumns]);

  const handleDragStart = (colId) => { dragItem.current = colId; };
  const handleDragEnter = (colId) => { dragOverItem.current = colId; };
  const handleDragEnd = () => {
    if (!dragItem.current || !dragOverItem.current || dragItem.current === dragOverItem.current) {
      dragItem.current = null;
      dragOverItem.current = null;
      return;
    }
    if (onReorderColumns) {
      onReorderColumns(dragItem.current, dragOverItem.current);
    }
    dragItem.current = null;
    dragOverItem.current = null;
  };

  const visibleCount = visibleColumnIds.length;
  const totalCount = columns.length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-xs gap-1.5 border-border bg-background hover:bg-secondary/60 text-muted-foreground hover:text-foreground font-medium"
        >
          <Columns3 className="h-3.5 w-3.5" />
          <span>Columns</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-secondary text-secondary-foreground font-semibold">
            {visibleCount}/{totalCount}
          </span>
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-80 p-0 text-xs shadow-lg border-border bg-popover">
        <div className="p-3 border-b border-border space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-foreground text-xs">Toggle & Reorder Columns</span>
            <span className="text-[11px] text-muted-foreground font-mono">{visibleCount}/{totalCount}</span>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter columns..."
              className="h-8 pl-8 text-xs bg-background"
            />
          </div>
          {!search && (
            <p className="text-[10px] text-muted-foreground flex items-center gap-1">
              <GripVertical className="h-3 w-3" />
              Drag rows to reorder columns
            </p>
          )}
        </div>

        <div className="max-h-72 overflow-y-auto p-2 space-y-3">
          {COLUMN_GROUPS.map((group) => {
            const cols = columnsByGroup[group] || [];
            if (cols.length === 0) return null;
            return (
              <div key={group} className="space-y-1">
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-2 py-0.5 bg-muted/40 rounded">
                  {group}
                </div>
                <div className="space-y-0.5">
                  {cols.map((col) => {
                    const isChecked = visibleColumnIds.includes(col.id);
                    const isLocked = !!col.alwaysVisible;
                    return (
                      <div
                        key={col.id}
                        draggable={!isLocked && !search}
                        onDragStart={() => handleDragStart(col.id)}
                        onDragEnter={() => handleDragEnter(col.id)}
                        onDragEnd={handleDragEnd}
                        onDragOver={(e) => e.preventDefault()}
                        className={cn(
                          "flex items-center justify-between px-2 py-1 rounded text-xs transition-colors select-none",
                          isLocked ? "opacity-60 cursor-not-allowed bg-muted/20" : "hover:bg-muted/50 cursor-pointer",
                          !isLocked && !search && "group"
                        )}
                      >
                        <label className={cn("flex items-center gap-2 flex-1", isLocked ? "cursor-not-allowed" : "cursor-pointer")}>
                          {!isLocked && !search && (
                            <GripVertical className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-muted-foreground shrink-0 cursor-grab active:cursor-grabbing" />
                          )}
                          <Checkbox
                            checked={isChecked}
                            disabled={isLocked}
                            onCheckedChange={() => onToggleColumn(col.id)}
                            className="h-3.5 w-3.5 rounded"
                          />
                          <span className={cn(isChecked ? "text-foreground font-medium" : "text-muted-foreground")}>
                            {col.header}
                          </span>
                        </label>
                        {isLocked && (
                          <span className="text-[9.5px] text-muted-foreground uppercase font-semibold">Fixed</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-2 border-t border-border flex items-center justify-between bg-muted/20">
          <Button type="button" variant="ghost" size="sm" onClick={onResetColumns} className="h-7 px-2 text-[11px] gap-1 text-muted-foreground hover:text-foreground">
            <RotateCcw className="h-3 w-3" />
            <span>Reset</span>
          </Button>
          <div className="flex items-center gap-1">
            <Button type="button" variant="ghost" size="sm" onClick={onSelectAllColumns} className="h-7 px-2 text-[11px] gap-1 text-muted-foreground hover:text-foreground">
              <CheckCheck className="h-3 w-3" />
              <span>All</span>
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={onClearAllColumns} className="h-7 px-2 text-[11px] gap-1 text-muted-foreground hover:text-foreground">
              <XSquare className="h-3 w-3" />
              <span>Clear</span>
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
