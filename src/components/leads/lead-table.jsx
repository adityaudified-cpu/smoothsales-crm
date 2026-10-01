"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
} from "@tanstack/react-table";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import {
  Phone,
  MessageCircle,
  Eye,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Filter,
  Clock,
  Building2,
  Globe,
  Share2,
  FileSpreadsheet,
  Star,
  PhoneIncoming,
  PhoneOutgoing,
  AlertCircle,
  HelpCircle,
  Pencil,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Rows3,
  RotateCcw,
} from "lucide-react";
import { formatDistanceToNowStrict, format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { formatCellValue, formatINR, parseValidDate } from "@/lib/format-cell-value";
import { LEADS_COLUMNS_CONFIG } from "@/lib/leads-columns.config";

export function LeadTable({
  data = [],
  columnsConfig = LEADS_COLUMNS_CONFIG,
  visibleColumnIds = [],
  rowSelection = {},
  onRowSelectionChange,
  isLoading = false,
  onResetFilters,
}) {
  const [sorting, setSorting] = useState([{ id: "last_worked", desc: true }]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [density, setDensity] = useState("normal"); // "normal" | "compact"
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 15,
  });

  // Quick Action Handlers
  const handleCall = (e, lead) => {
    e.stopPropagation();
    toast.success(`Calling ${lead.lead_name || lead.name} (${lead.mobile_number || lead.phone})`);
  };

  const handleWhatsApp = (e, lead) => {
    e.stopPropagation();
    toast.info(`Opening WhatsApp for ${lead.lead_name || lead.name}`);
  };

  // Convert columnsConfig into TanStack table columns
  const tableColumns = useMemo(() => {
    // Selection column
    const selectCol = {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
          className="data-[state=checked]:bg-primary h-4 w-4 rounded translate-y-[2px]"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
          className="data-[state=checked]:bg-primary h-4 w-4 rounded translate-y-[2px]"
        />
      ),
      enableSorting: false,
      enableResizing: false,
      size: 44,
    };

    const dataCols = columnsConfig.map((col) => {
      return {
        id: col.id,
        accessorKey: col.accessorKey,
        header: ({ column }) => {
          const isSorted = column.getIsSorted();
          const filterValue = column.getFilterValue();

          return (
            <div className="flex items-center gap-1.5 select-none font-semibold text-muted-foreground hover:text-foreground text-[12px] group">
              <button
                type="button"
                onClick={() => column.toggleSorting(isSorted === "asc")}
                className="flex items-center gap-1 hover:text-foreground text-left"
              >
                <span>{col.header}</span>
                {isSorted === "asc" ? (
                  <ArrowUp className="h-3 w-3 text-primary font-bold" />
                ) : isSorted === "desc" ? (
                  <ArrowDown className="h-3 w-3 text-primary font-bold" />
                ) : (
                  <ArrowUpDown className="h-3 w-3 opacity-0 group-hover:opacity-60" />
                )}
              </button>

              {/* Only filterable columns get a filter Popover */}
              {col.filterable && (
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className={cn(
                        "p-0.5 rounded hover:bg-muted text-muted-foreground",
                        filterValue && "text-primary bg-primary/10 font-bold"
                      )}
                      title={`Filter ${col.header}`}
                    >
                      <Filter className="h-3 w-3" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-56 p-2.5 text-xs shadow-md" align="start">
                    <div className="space-y-2">
                      <div className="font-semibold text-xs text-foreground">
                        Filter by {col.header}
                      </div>
                      <Input
                        value={filterValue || ""}
                        onChange={(e) => column.setFilterValue(e.target.value)}
                        placeholder={`Search ${col.header}...`}
                        className="h-7 text-xs"
                      />
                      {filterValue && (
                        <button
                          type="button"
                          onClick={() => column.setFilterValue(undefined)}
                          className="text-[11px] text-primary hover:underline font-medium"
                        >
                          Clear filter
                        </button>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              )}
            </div>
          );
        },
        cell: ({ row }) => {
          const lead = row.original;
          const rawVal = row.getValue(col.id);

          switch (col.cellType) {
            case "lead_name": {
              const name = rawVal || lead.name || "Unnamed Lead";
              const isUnassigned = !lead.lead_owner;
              const source = lead.lead_source || lead.source || "";
              const initials = name
                .split(" ")
                .map((n) => n[0])
                .slice(0, 2)
                .join("")
                .toUpperCase();

              return (
                <div className="relative flex items-center justify-between min-w-[210px] group/name py-0.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Avatar className="h-7 w-7 text-[10px] font-bold border border-border shrink-0">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {initials}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-1.5">
                        <Link
                          href={`/leads/active/${lead.id}`}
                          className="font-bold text-foreground hover:text-primary hover:underline truncate text-[13px]"
                        >
                          {name}
                        </Link>
                        {source === "IndiaMART" && (
                          <span
                            className="px-1 py-0.2 rounded text-[9px] font-bold bg-muted text-muted-foreground border border-border shrink-0"
                            title="IndiaMART Ingestion"
                          >
                            IM
                          </span>
                        )}
                      </div>
                      {isUnassigned && (
                        <span className="inline-flex items-center gap-0.5 text-[9.5px] font-bold text-destructive bg-destructive/10 px-1 py-0.2 rounded border border-destructive/20 w-max mt-0.5">
                          Unassigned
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Inline quick actions on row hover */}
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 opacity-0 group-hover/name:opacity-100 transition-opacity bg-card/95 backdrop-blur-sm border border-border shadow-sm rounded p-0.5 flex items-center gap-0.5 z-20">
                    <button
                      type="button"
                      onClick={(e) => handleCall(e, lead)}
                      title="Call Lead"
                      className="p-1 rounded text-success hover:bg-success/10 transition-colors"
                    >
                      <Phone className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleWhatsApp(e, lead)}
                      title="WhatsApp Chat"
                      className="p-1 rounded text-success hover:bg-success/10 transition-colors"
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                    </button>
                    <Link
                      href={`/leads/active/${lead.id}`}
                      title="View Lead Details"
                      className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              );
            }

            case "lead_owner": {
              if (!rawVal || !rawVal.name) {
                return (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold text-destructive bg-destructive/10 border border-destructive/20">
                    Unassigned
                  </span>
                );
              }
              return (
                <div className="flex items-center gap-1.5 truncate">
                  <Avatar className="h-5 w-5 text-[9px] font-bold border border-border shrink-0">
                    <AvatarFallback className="bg-secondary text-secondary-foreground">
                      {rawVal.initials || rawVal.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="truncate text-xs text-foreground font-medium">
                    {rawVal.name}
                  </span>
                </div>
              );
            }

            case "lead_stage": {
              const stageName = formatCellValue(rawVal);
              if (stageName === "—") return <span className="text-muted-foreground">—</span>;
              return (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-secondary text-secondary-foreground border border-border/60">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  <span>{stageName}</span>
                </span>
              );
            }

            case "awaiting_first_touch": {
              const isAwaiting = rawVal === "YES" || rawVal === true;
              return isAwaiting ? (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10.5px] font-bold bg-warning/10 text-warning border border-warning/30">
                  YES
                </span>
              ) : (
                <span className="text-muted-foreground text-xs font-mono">NO</span>
              );
            }

            case "attempts": {
              const count = Number(rawVal) || 0;
              const isHigh = count >= 3;
              return (
                <span
                  className={cn(
                    "inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full text-[11px] font-bold border",
                    isHigh
                      ? "bg-warning/10 text-warning border-warning/30"
                      : "bg-muted text-neutral-status border-border"
                  )}
                >
                  {count}
                </span>
              );
            }

            case "speed_to_first_call": {
              const formatted = formatCellValue(rawVal);
              if (formatted === "—") return <span className="text-muted-foreground">—</span>;
              return (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-success/10 text-success border border-success/20">
                  {formatted}
                </span>
              );
            }

            case "next_followup": {
              const d = parseValidDate(rawVal);
              if (!d) return <span className="text-muted-foreground">—</span>;
              const isOverdue = d < new Date();
              const dist = formatDistanceToNowStrict(d);

              return (
                <TooltipProvider delayDuration={150}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border",
                          isOverdue
                            ? "bg-destructive/10 text-destructive border-destructive/20"
                            : "bg-warning/10 text-warning border-warning/30"
                        )}
                      >
                        <Clock className="h-3 w-3" />
                        <span>{isOverdue ? `${dist} overdue` : `in ${dist}`}</span>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent className="text-xs">
                      {format(d, "dd MMM yyyy, hh:mm a")}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              );
            }

            case "tags": {
              const tags = Array.isArray(rawVal) ? rawVal : [];
              if (tags.length === 0) return <span className="text-muted-foreground">—</span>;
              const visibleTags = tags.slice(0, 2);
              const overflow = tags.length - 2;

              return (
                <div className="flex items-center gap-1 flex-wrap group/tags">
                  {visibleTags.map((tag) => (
                    <span
                      key={tag}
                      className="px-1.5 py-0.2 rounded text-[10.5px] bg-secondary text-secondary-foreground border border-border/80 font-medium whitespace-nowrap"
                    >
                      {tag}
                    </span>
                  ))}
                  {overflow > 0 && (
                    <span className="px-1 py-0.2 rounded text-[10px] bg-muted text-muted-foreground font-semibold">
                      +{overflow}
                    </span>
                  )}
                  <button
                    type="button"
                    title="Edit tags"
                    className="opacity-0 group-hover/tags:opacity-100 p-0.5 text-muted-foreground hover:text-foreground transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      toast.info(`Edit tags for ${lead.lead_name || lead.name}`);
                    }}
                  >
                    <Pencil className="h-3 w-3" />
                  </button>
                </div>
              );
            }

            case "deal_stage": {
              const stageData = rawVal || { stage: "Discovery", progress: 1 };
              const progress = stageData.progress || 1;
              return (
                <div className="flex flex-col gap-1 min-w-[120px]">
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5, 6].map((step) => (
                      <span
                        key={step}
                        className={cn(
                          "h-1.5 flex-1 rounded-full",
                          step <= progress ? "bg-primary" : "bg-muted"
                        )}
                      />
                    ))}
                  </div>
                  <span className="text-[10px] text-muted-foreground font-medium truncate">
                    {stageData.stage || "Stage 1"}
                  </span>
                </div>
              );
            }

            case "lead_disposition": {
              const disp = formatCellValue(rawVal);
              if (disp === "—") return <span className="text-muted-foreground">—</span>;
              return (
                <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-secondary text-secondary-foreground border border-border whitespace-nowrap">
                  {disp}
                </span>
              );
            }

            case "priority_stars": {
              const count = Number(rawVal) || 0;
              return (
                <div
                  className={cn(
                    "inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs select-none",
                    count >= 4
                      ? "bg-warning/10 border border-warning/30 text-warning font-semibold"
                      : "text-muted-foreground"
                  )}
                >
                  <div className="flex items-center gap-0.5 text-warning">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={cn(
                          "h-3 w-3",
                          s <= count ? "fill-warning text-warning" : "text-muted-foreground/30"
                        )}
                      />
                    ))}
                  </div>
                  {count > 0 && (
                    <span className="text-[10px] font-mono font-bold leading-none">
                      {count}★
                    </span>
                  )}
                </div>
              );
            }

            case "lead_source": {
              const src = formatCellValue(rawVal);
              if (src === "—") return <span className="text-muted-foreground">—</span>;
              let Icon = Globe;
              if (src.includes("IndiaMART")) Icon = Building2;
              if (src.includes("Meta")) Icon = Share2;
              if (src.includes("Referral")) Icon = HelpCircle;
              if (src.includes("CSV")) Icon = FileSpreadsheet;

              return (
                <div className="flex items-center gap-1.5 truncate">
                  <Icon className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span className="truncate text-xs font-medium">{src}</span>
                </div>
              );
            }

            case "currency_inr": {
              const formatted = formatINR(rawVal);
              if (formatted === "—") return <span className="text-muted-foreground">—</span>;
              return (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-semibold bg-success/10 text-success border border-success/20">
                  {formatted}
                </span>
              );
            }

            case "call_direction": {
              if (!rawVal) return <span className="text-muted-foreground">—</span>;
              return rawVal === "inbound" ? (
                <span className="inline-flex items-center gap-1 text-[11px] text-primary font-medium">
                  <PhoneIncoming className="h-3 w-3" />
                  <span>In</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] text-success font-medium">
                  <PhoneOutgoing className="h-3 w-3" />
                  <span>Out</span>
                </span>
              );
            }

            case "boolean_badge": {
              return rawVal ? (
                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-warning/10 text-warning border border-warning/30">
                  Yes
                </span>
              ) : (
                <span className="text-muted-foreground text-xs font-mono">No</span>
              );
            }

            case "relative_time": {
              const d = parseValidDate(rawVal);
              if (!d) return <span className="text-muted-foreground">—</span>;
              return (
                <TooltipProvider delayDuration={150}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-muted-foreground text-xs whitespace-nowrap cursor-help hover:text-foreground">
                        {formatDistanceToNowStrict(d)} ago
                      </span>
                    </TooltipTrigger>
                    <TooltipContent className="text-xs">
                      {format(d, "dd MMM yyyy, hh:mm a")}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              );
            }

            case "tooltip_text": {
              const text = formatCellValue(rawVal);
              if (text === "—") return <span className="text-muted-foreground">—</span>;
              return (
                <TooltipProvider delayDuration={200}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="truncate max-w-[200px] block cursor-help text-xs text-foreground">
                        {text}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs text-xs">
                      {text}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              );
            }

            case "phone": {
              const phone = formatCellValue(rawVal);
              if (phone === "—") return <span className="text-muted-foreground">—</span>;
              return (
                <span className="font-mono text-xs text-foreground whitespace-nowrap">
                  {phone}
                </span>
              );
            }

            case "number": {
              return (
                <span className="font-mono text-xs text-foreground whitespace-nowrap">
                  {formatCellValue(rawVal)}
                </span>
              );
            }

            default: {
              return (
                <span className="text-xs text-foreground whitespace-nowrap">
                  {formatCellValue(rawVal)}
                </span>
              );
            }
          }
        },
      };
    });

    return [selectCol, ...dataCols];
  }, [columnsConfig]);

  // Visibility map
  const columnVisibility = useMemo(() => {
    const visibility = { select: true, lead_name: true };
    columnsConfig.forEach((c) => {
      visibility[c.id] = visibleColumnIds.length === 0 ? !!c.defaultVisible : visibleColumnIds.includes(c.id);
    });
    return visibility;
  }, [columnsConfig, visibleColumnIds]);

  const table = useReactTable({
    data,
    columns: tableColumns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      pagination,
    },
    enableRowSelection: true,
    onRowSelectionChange,
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  // Category Bands computation for 2-tier organized table header across 63 columns
  const categoryBands = useMemo(() => {
    const leafCols = table.getVisibleLeafColumns();
    const bands = [];
    let currentKey = null;
    let currentSpan = 0;

    leafCols.forEach((col) => {
      let key = "Core";
      if (col.id === "select") key = "__select__";
      else if (col.id === "lead_name") key = "__lead_name__";
      else {
        const found = columnsConfig.find((c) => c.id === col.id);
        key = found?.group || "Core";
      }

      if (key === currentKey) {
        currentSpan++;
      } else {
        if (currentKey !== null) {
          bands.push({ group: currentKey, span: currentSpan });
        }
        currentKey = key;
        currentSpan = 1;
      }
    });

    if (currentKey !== null) {
      bands.push({ group: currentKey, span: currentSpan });
    }

    return bands;
  }, [table, columnsConfig]);

  const pageIndex = table.getState().pagination.pageIndex;
  const pageSize = table.getState().pagination.pageSize;
  const totalFilteredRows = table.getFilteredRowModel().rows.length;
  const pageCount = table.getPageCount();

  const startRecord = totalFilteredRows === 0 ? 0 : pageIndex * pageSize + 1;
  const endRecord = Math.min((pageIndex + 1) * pageSize, totalFilteredRows);
  const selectedCount = Object.keys(rowSelection).length;

  return (
    <div className="w-full bg-card border border-border rounded-lg shadow-2xs overflow-hidden flex flex-col">
      {/* Scrollable Table Area */}
      <div className="relative overflow-x-auto max-h-[calc(100vh-270px)] leads-table-scroll">
        <Table className="w-full border-collapse text-[13px]">
          {/* 2-Tier Header: Category Group Band + Column Headers */}
          <TableHeader className="sticky top-0 z-30 shadow-2xs backdrop-blur-md">
            {/* Tier 1: Category Header Band */}
            <TableRow className="border-b border-border/80 bg-muted/70 hover:bg-muted/70 text-[10px] select-none">
              {categoryBands.map((band, idx) => {
                if (band.group === "__select__") {
                  return (
                    <TableHead
                      key={`cat-select-${idx}`}
                      colSpan={1}
                      className="h-6 w-[44px] min-w-[44px] max-w-[44px] px-2 sticky left-0 z-40 bg-card border-r border-border/70"
                    />
                  );
                }
                if (band.group === "__lead_name__") {
                  return (
                    <TableHead
                      key={`cat-lead-${idx}`}
                      colSpan={1}
                      className="h-6 sticky left-[44px] z-40 bg-card border-r-2 border-border shadow-[4px_0_12px_rgba(0,0,0,0.08)] min-w-[240px] max-w-[280px] px-3 font-bold text-muted-foreground uppercase tracking-wider text-[9.5px]"
                    >
                      Lead Identity
                    </TableHead>
                  );
                }

                const labels = {
                  Core: "Core Pipeline & Activity",
                  "Contact & Location": "Contact Details & Geography",
                  "Classification & Source": "Classification & Attribution",
                  Payments: "Payments & Financials",
                  "Calls & Visits": "Calls & Visits Tracking",
                  Meta: "System & Flags",
                  "Custom Fields": "Tenant Custom Fields",
                };

                return (
                  <TableHead
                    key={`cat-${band.group}-${idx}`}
                    colSpan={band.span}
                    className="h-6 px-3 text-center border-r-2 border-border/80 uppercase tracking-wider font-bold text-foreground bg-muted/60"
                  >
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-background/90 text-foreground border border-border shadow-2xs">
                      <span>{labels[band.group] || band.group}</span>
                      <span className="text-[9px] px-1 py-0.1 rounded-full bg-muted text-muted-foreground font-mono font-semibold">
                        {band.span} cols
                      </span>
                    </span>
                  </TableHead>
                );
              })}
            </TableRow>

            {/* Tier 2: Individual Column Headers */}
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-b border-border/80 bg-muted/40 hover:bg-muted/50">
                {headerGroup.headers.map((header) => {
                  const isSelect = header.id === "select";
                  const isLeadName = header.id === "lead_name";

                  return (
                    <TableHead
                      key={header.id}
                      className={cn(
                        "h-9 px-3 text-xs font-bold text-foreground border-r border-border/30 whitespace-nowrap",
                        isSelect &&
                          "w-[44px] min-w-[44px] max-w-[44px] px-2 sticky left-0 z-40 bg-card border-r border-border/70 text-center shadow-2xs",
                        isLeadName &&
                          "sticky left-[44px] z-40 bg-card border-r-2 border-border shadow-[4px_0_12px_rgba(0,0,0,0.08)] min-w-[240px] max-w-[280px]"
                      )}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>

          {/* Body */}
          <TableBody className="divide-y divide-border/40">
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={columnsConfig.length + 1}
                  className="h-48 text-center text-xs text-muted-foreground"
                >
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <span>Loading pipeline leads...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columnsConfig.length + 1}
                  className="h-56 text-center text-xs text-muted-foreground"
                >
                  <div className="flex flex-col items-center justify-center gap-2.5 max-w-sm mx-auto p-4">
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                      <AlertCircle className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground text-sm">
                        No leads match your active filters or search
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Try clearing or loosening your filter criteria.
                      </p>
                    </div>
                    {onResetFilters && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={onResetFilters}
                        className="mt-1 h-8 text-xs gap-1.5 font-semibold text-primary border-primary/30 hover:bg-primary/5"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        <span>Reset all filters</span>
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => {
                const isSelected = row.getIsSelected();

                return (
                  <TableRow
                    key={row.id}
                    data-state={isSelected ? "selected" : undefined}
                    className={cn(
                      "hover:bg-muted/40 transition-colors group/row",
                      isSelected && "bg-primary/5"
                    )}
                  >
                    {row.getVisibleCells().map((cell) => {
                      const isSelect = cell.column.id === "select";
                      const isLeadName = cell.column.id === "lead_name";

                      return (
                        <TableCell
                          key={cell.id}
                          className={cn(
                            "border-r border-border/30 whitespace-nowrap transition-colors",
                            density === "compact" ? "py-1.5 px-2.5 text-xs" : "py-2.5 px-3 text-[13px]",
                            isSelect &&
                              "w-[44px] min-w-[44px] max-w-[44px] px-2 sticky left-0 z-20 bg-card group-hover/row:bg-muted/70 group-data-[state=selected]/row:bg-primary/10 border-r border-border/60 text-center",
                            isLeadName &&
                              "sticky left-[44px] z-20 bg-card group-hover/row:bg-muted/70 group-data-[state=selected]/row:bg-primary/10 border-r-2 border-border shadow-[4px_0_12px_rgba(0,0,0,0.08)] min-w-[240px] max-w-[280px]"
                          )}
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination & Density Footer */}
      <div className="px-4 py-2.5 bg-muted/20 border-t border-border flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground select-none">
        <div className="flex items-center gap-3">
          {selectedCount > 0 ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-primary/10 text-primary border border-primary/20">
              {selectedCount} row{selectedCount > 1 ? "s" : ""} selected
            </span>
          ) : (
            <span className="font-medium text-foreground text-xs">
              Showing {startRecord}–{endRecord} of {totalFilteredRows} leads
            </span>
          )}

          <div className="flex items-center gap-1.5 pl-2 border-l border-border">
            <span className="text-[11px] text-muted-foreground">Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => table.setPageSize(Number(e.target.value))}
              className="h-7 text-xs rounded border border-input bg-background px-2 py-0.5 font-medium text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary cursor-pointer"
            >
              {[10, 15, 25, 50, 100].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setDensity(density === "normal" ? "compact" : "normal")}
            title={`Toggle row density (Currently: ${density})`}
            className="h-7 px-2 text-[11px] gap-1 text-muted-foreground hover:text-foreground border border-border/60 hover:bg-muted"
          >
            <Rows3 className="h-3 w-3" />
            <span className="capitalize">{density}</span>
          </Button>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-muted-foreground mr-1">
            Page <span className="font-semibold text-foreground">{pageIndex + 1}</span> of{" "}
            <span className="font-semibold text-foreground">{pageCount || 1}</span>
          </span>

          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
            title="First page"
            className="h-7 w-7 border-border hover:bg-secondary disabled:opacity-40"
          >
            <ChevronsLeft className="h-3.5 w-3.5" />
          </Button>

          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            title="Previous page"
            className="h-7 w-7 border-border hover:bg-secondary disabled:opacity-40"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>

          <div className="flex items-center gap-1">
            {Array.from({ length: pageCount || 1 }, (_, i) => i)
              .filter((p) => Math.abs(p - pageIndex) <= 1 || p === 0 || p === (pageCount - 1))
              .map((p, idx, arr) => {
                const prev = arr[idx - 1];
                const showEllipsis = prev !== undefined && p - prev > 1;

                return (
                  <React.Fragment key={p}>
                    {showEllipsis && (
                      <span className="px-1 text-[11px] text-muted-foreground">…</span>
                    )}
                    <button
                      type="button"
                      onClick={() => table.setPageIndex(p)}
                      className={cn(
                        "h-7 min-w-7 px-2 text-xs font-semibold rounded transition-colors",
                        pageIndex === p
                          ? "bg-primary text-primary-foreground shadow-2xs"
                          : "hover:bg-muted text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {p + 1}
                    </button>
                  </React.Fragment>
                );
              })}
          </div>

          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            title="Next page"
            className="h-7 w-7 border-border hover:bg-secondary disabled:opacity-40"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>

          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => table.setPageIndex((pageCount || 1) - 1)}
            disabled={!table.getCanNextPage()}
            title="Last page"
            className="h-7 w-7 border-border hover:bg-secondary disabled:opacity-40"
          >
            <ChevronsRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// Re-export as LeadsTable for backward compatibility
export { LeadTable as LeadsTable };
