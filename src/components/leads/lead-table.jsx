"use client";

import React, { useMemo, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  Pencil,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Rows3,
  RotateCcw,
  GripVertical,
  Copy,
  Zap,
  CheckCircle2,
  UserCheck,
  AlertTriangle,
  Trash2,
  MoreHorizontal,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDistanceToNowStrict, format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { formatCellValue, formatINR, parseValidDate } from "@/lib/format-cell-value";
import { LEADS_COLUMNS_CONFIG } from "@/lib/leads-columns.config";
import { encodeLeadId } from "@/lib/lead-id-codec";

export function LeadTable({
  data = [],
  columnsConfig = LEADS_COLUMNS_CONFIG,
  visibleColumnIds = [],
  columnOrder = [],
  columnSizing = {},
  onColumnSizingChange,
  onReorderColumns,
  rowSelection = {},
  onRowSelectionChange,
  isLoading = false,
  onResetFilters,
  onEditLead,
  onDeleteLead,
}) {
  const router = useRouter();
  const [sorting, setSorting] = useState([{ id: "last_worked", desc: true }]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [density, setDensity] = useState("normal");
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 15 });
  const [internalColumnSizing, setInternalColumnSizing] = useState({});
  const resolvedColumnSizing = onColumnSizingChange ? columnSizing : internalColumnSizing;

  // Column drag-to-reorder state
  const dragColId = useRef(null);
  const dragOverColId = useRef(null);
  const [draggingColId, setDraggingColId] = useState(null);

  const handleColDragStart = (colId) => {
    dragColId.current = colId;
    setDraggingColId(colId);
  };
  const handleColDragEnter = (colId) => { dragOverColId.current = colId; };
  const handleColDragEnd = () => {
    if (dragColId.current && dragOverColId.current && dragColId.current !== dragOverColId.current && onReorderColumns) {
      onReorderColumns(dragColId.current, dragOverColId.current);
    }
    dragColId.current = null;
    dragOverColId.current = null;
    setDraggingColId(null);
  };

  // Quick Action Handlers
  const handleCall = (e, lead) => {
    e.stopPropagation();
    const phone = String(lead.mobile_number || lead.phone || "").trim();
    if (!phone) return toast.error("This lead has no phone number");
    toast.success(`Dialing ${lead.lead_name || lead.name || phone}...`);
    window.location.href = `tel:${phone.replace(/[^\d+]/g, "")}`;
  };

  const handleWhatsApp = (e, lead) => {
    e.stopPropagation();
    const phone = String(lead.mobile_number || lead.phone || "").replace(/\D/g, "");
    if (!phone) return toast.error("This lead has no phone number");
    const name = lead.lead_name || lead.name || "there";
    const text = encodeURIComponent(`Hi ${name}, reaching out from SmoothSales regarding your inquiry. When would be a good time to connect?`);
    window.open(`https://wa.me/${phone}?text=${text}`, "_blank", "noopener,noreferrer");
  };

  const handleCopyPhone = (e, lead) => {
    e.stopPropagation();
    const phone = lead.mobile_number || lead.phone || "";
    if (phone) {
      navigator.clipboard.writeText(phone).then(() => toast.success("Phone copied"));
    }
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

    // S.No column — derives the true sequential number from the SORTED+FILTERED row model.
    // This is the only correct approach: find this row's position in the full sorted+filtered
    // list (before pagination slicing), so the number never resets on filter/sort change.
    const snoCol = {
      id: "sno",
      header: () => <span className="text-[11px] font-semibold text-muted-foreground">#</span>,
      cell: ({ row, table }) => {
        // getSortedRowModel gives all rows after sort+filter, before pagination.
        // Find this row's index in that full list for a stable global sequence number.
        const allSortedRows = table.getSortedRowModel().rows;
        const globalIndex = allSortedRows.findIndex((r) => r.id === row.id) + 1;
        return (
          <span className="font-mono text-[11px] text-muted-foreground select-none tabular-nums">
            {globalIndex > 0 ? globalIndex : row.index + 1}
          </span>
        );
      },
      enableSorting: false,
      enableResizing: false,
      size: 48,
    };

    const orderedColumns = columnOrder.length
      ? [
          ...columnOrder.map((id) => columnsConfig.find((col) => col.id === id)).filter(Boolean),
          ...columnsConfig.filter((col) => !columnOrder.includes(col.id)),
        ]
      : columnsConfig;

    const dataCols = orderedColumns.map((col) => {
      const colSize = col.width || (col.id === "lead_name" ? 280 : col.id === "last_user_remark" ? 220 : 160);
      return {
        id: col.id,
        accessorKey: col.accessorKey,
        size: colSize,
        minSize: col.minWidth || 100,
        maxSize: col.maxWidth || 500,
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
              const phone = lead.mobile_number || lead.phone || "";
              const city = lead.city || "";
              const initials = name
                .split(" ")
                .map((n) => n[0])
                .slice(0, 2)
                .join("")
                .toUpperCase();

              return (
                <div className="relative flex items-center justify-between min-w-[220px] group/name py-0.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Avatar className="h-7 w-7 text-[10px] font-bold border border-border shrink-0">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {initials}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex flex-col min-w-0 gap-0.5">
                      {/* Row 1: Name + source badge */}
                      <div className="flex items-center gap-1.5">
                        <Link
                          href={`/leads/active/${encodeLeadId(lead.id)}`}
                          className="font-bold text-foreground hover:text-primary hover:underline truncate text-[13px] leading-tight"
                        >
                          {name}
                        </Link>
                        {source === "IndiaMART" && (
                          <span className="px-1 rounded text-[9px] font-bold bg-orange-500/10 text-orange-600 border border-orange-500/20 shrink-0">
                            IM
                          </span>
                        )}
                        {source === "Meta Ads" && (
                          <span className="px-1 rounded text-[9px] font-bold bg-blue-500/10 text-blue-600 border border-blue-500/20 shrink-0">
                            META
                          </span>
                        )}
                        {isUnassigned && (
                          <span className="text-[9px] font-bold text-destructive bg-destructive/10 px-1 rounded border border-destructive/20 shrink-0">
                            Unassigned
                          </span>
                        )}
                      </div>
                      {/* Row 2: Phone + City */}
                      <div className="flex items-center gap-2 text-[10.5px] text-muted-foreground">
                        {phone && (
                          <span className="font-mono tracking-tight">{phone}</span>
                        )}
                        {phone && city && <span className="text-border">·</span>}
                        {city && (
                          <span className="truncate">{city}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Inline quick actions on row hover */}
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 opacity-0 group-hover/row:opacity-100 transition-all duration-150 bg-card/95 backdrop-blur-md border border-border shadow-md rounded-lg p-0.5 flex items-center gap-0.5 z-20">
                    <button
                      type="button"
                      onClick={(e) => handleCall(e, lead)}
                      title="Call Lead"
                      className="p-1.5 rounded-md text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
                    >
                      <Phone className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleWhatsApp(e, lead)}
                      title="1-Click WhatsApp"
                      className="p-1.5 rounded-md text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleCopyPhone(e, lead)}
                      title="Copy phone"
                      className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                    <Link
                      href={`/leads/active/${encodeLeadId(lead.id)}`}
                      title="View Details"
                      className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
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
              const stageStyles = {
                "New Lead": "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
                "Contacted": "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20",
                "Qualified": "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
                "Meeting Scheduled": "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
                "Proposal Sent": "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
                "Deal Won": "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
                "Disqualified": "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
              };
              const dotStyles = {
                "New Lead": "bg-blue-500",
                "Contacted": "bg-sky-500",
                "Qualified": "bg-emerald-500",
                "Meeting Scheduled": "bg-purple-500",
                "Proposal Sent": "bg-amber-500",
                "Deal Won": "bg-green-500",
                "Disqualified": "bg-rose-500",
              };
              const stageClass = stageStyles[stageName] || "bg-secondary text-secondary-foreground border-border/60";
              const dotClass = dotStyles[stageName] || "bg-primary";
              return (
                <span className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium border", stageClass)}>
                  <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", dotClass)} />
                  <span className="whitespace-nowrap">{stageName}</span>
                </span>
              );
            }

            case "awaiting_first_touch": {
              const isAwaiting = rawVal === "YES" || rawVal === true || rawVal === 1;
              return isAwaiting ? (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 shadow-2xs">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                  </span>
                  <span>Awaiting Touch</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  <span>Touched</span>
                </span>
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
              const seconds = Number(rawVal);
              if (!rawVal || isNaN(seconds)) return <span className="text-muted-foreground">—</span>;
              // Format: <60s show seconds, else show minutes
              const display = seconds < 60 ? `${seconds}s` : `${Math.round(seconds / 60)}m`;
              const isFast = seconds <= 300;    // ≤5 min = green
              const isDelayed = seconds <= 1800; // 5–30 min = amber, >30 min = rose

              return (
                <span
                  className={cn(
                    "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border",
                    isFast
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                      : isDelayed
                      ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
                      : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30"
                  )}
                >
                  {isFast && <Zap className="h-3 w-3 shrink-0 text-emerald-500 fill-emerald-500" />}
                  <span>{display}</span>
                </span>
              );
            }

            case "next_followup": {
              const d = parseValidDate(rawVal);
              if (!d) return <span className="text-muted-foreground">—</span>;
              const now = new Date();
              const isOverdue = d < now;
              const isToday = !isOverdue && d.toDateString() === now.toDateString();
              const dist = formatDistanceToNowStrict(d);

              return (
                <TooltipProvider delayDuration={150}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border transition-all shadow-2xs",
                          isOverdue
                            ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30 animate-pulse font-bold"
                            : isToday
                            ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
                            : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                        )}
                      >
                        {isOverdue ? (
                          <AlertTriangle className="h-3 w-3 shrink-0 text-rose-500" />
                        ) : (
                          <Clock className="h-3 w-3 shrink-0" />
                        )}
                        <span>
                          {isOverdue ? `${dist} overdue` : isToday ? `Today (${dist})` : `in ${dist}`}
                        </span>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent className="text-xs bg-popover text-popover-foreground border shadow-md">
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
              const progress = Number(stageData.progress) || 1;
              const stages = [
                "Discovery",
                "Requirements",
                "Proposal",
                "Negotiation",
                "Documentation",
                "Closed Won",
              ];
              const stageLabel = stageData.stage || stages[progress - 1] || `Stage ${progress}`;

              return (
                <div className="flex flex-col gap-1 min-w-[125px]">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5, 6].map((step) => (
                      <div
                        key={step}
                        className={cn(
                          "h-1.5 flex-1 rounded-full transition-all",
                          step <= progress
                            ? "bg-gradient-to-r from-emerald-500 to-teal-500 shadow-2xs"
                            : "bg-muted/60"
                        )}
                        title={stages[step - 1]}
                      />
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-medium text-muted-foreground">
                    <span className="truncate text-foreground font-semibold">{stageLabel}</span>
                    <span className="font-mono text-[9px] text-muted-foreground/80">{progress}/6</span>
                  </div>
                </div>
              );
            }

            case "lead_disposition": {
              const disp = formatCellValue(rawVal);
              if (disp === "—") return <span className="text-muted-foreground">—</span>;
              const dispStyles = {
                "Connected - Interested": "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/25",
                "Connected - Callback Requested": "bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/25",
                "RNR": "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/25",
                "Busy": "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/25",
                "Not Reachable": "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/25",
                "Not Interested": "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/25",
                "Invalid Number": "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/25",
              };
              const cls = dispStyles[disp] || "bg-secondary text-secondary-foreground border-border";
              return (
                <span className={cn("px-2 py-0.5 rounded text-[11px] font-medium border whitespace-nowrap", cls)}>
                  {disp}
                </span>
              );
            }

            case "priority_stars": {
              const count = Number(rawVal) || 0;
              return (
                <div
                  className={cn(
                    "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs select-none border transition-colors group/stars",
                    count >= 4
                      ? "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400 font-semibold shadow-2xs"
                      : "bg-muted/40 border-border/60 text-muted-foreground hover:bg-muted"
                  )}
                >
                  <div className="flex items-center gap-0.5 text-amber-500">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        type="button"
                        title={`Set priority to ${s} star${s > 1 ? "s" : ""}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          toast.success(`Priority set to ${s} star${s > 1 ? "s" : ""} for ${lead.lead_name || lead.name}`);
                        }}
                        className="p-0.5 hover:scale-125 transition-transform"
                      >
                        <Star
                          className={cn(
                            "h-3 w-3 transition-colors",
                            s <= count ? "fill-amber-400 text-amber-500" : "text-muted-foreground/30 hover:text-amber-400"
                          )}
                        />
                      </button>
                    ))}
                  </div>
                  {count > 0 && (
                    <span className="text-[10px] font-mono font-bold leading-none ml-0.5">
                      {count}★
                    </span>
                  )}
                </div>
              );
            }

            case "lead_source": {
              const src = formatCellValue(rawVal);
              if (src === "—") return <span className="text-muted-foreground">—</span>;

              if (src.includes("IndiaMART")) {
                return (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/25">
                    <span className="font-black text-[9px] px-1 py-0.2 rounded bg-orange-500 text-white leading-none">IM</span>
                    <span>IndiaMART</span>
                  </span>
                );
              }
              if (src.includes("Meta") || src.includes("Facebook") || src.includes("Instagram")) {
                return (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/25">
                    <Share2 className="h-3 w-3 text-blue-500 shrink-0" />
                    <span>Meta Ads</span>
                  </span>
                );
              }
              if (src.includes("Google")) {
                return (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/25">
                    <span className="font-bold text-[9px] px-1 py-0.2 rounded bg-red-500 text-white leading-none">G</span>
                    <span>Google Ads</span>
                  </span>
                );
              }
              if (src.includes("JustDial")) {
                return (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/25">
                    <span className="font-black text-[9px] px-1 py-0.2 rounded bg-amber-500 text-black leading-none">JD</span>
                    <span>JustDial</span>
                  </span>
                );
              }
              if (src.includes("Referral")) {
                return (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/25">
                    <UserCheck className="h-3 w-3 text-purple-500 shrink-0" />
                    <span>Referral</span>
                  </span>
                );
              }
              if (src.includes("CSV") || src.includes("Excel") || src.includes("Upload")) {
                return (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/25">
                    <FileSpreadsheet className="h-3 w-3 text-slate-500 shrink-0" />
                    <span>CSV Import</span>
                  </span>
                );
              }

              return (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-secondary text-secondary-foreground border border-border">
                  <Globe className="h-3 w-3 text-primary shrink-0" />
                  <span className="truncate">{src}</span>
                </span>
              );
            }

            case "payment_status": {
              if (!rawVal) return <span className="text-muted-foreground">—</span>;
              const isPaid = rawVal === "Paid";
              return (
                <span
                  className={cn(
                    "inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border",
                    isPaid
                      ? "bg-success/10 text-success border-success/20"
                      : "bg-warning/10 text-warning border-warning/30"
                  )}
                >
                  {rawVal}
                </span>
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
              const isRemark = col.id === "last_user_remark";
              if (text === "—") {
                if (isRemark) {
                  return (
                    <Popover>
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          onClick={(e) => e.stopPropagation()}
                          className="text-[11px] text-muted-foreground/60 hover:text-primary flex items-center gap-1 italic group/addrem"
                        >
                          <Pencil className="h-2.5 w-2.5 opacity-60 group-hover/addrem:opacity-100" />
                          <span>+ Add remark</span>
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-64 p-3 shadow-lg" align="start" onClick={(e) => e.stopPropagation()}>
                        <div className="space-y-2">
                          <span className="font-semibold text-xs text-foreground">Add Remark</span>
                          <Input
                            placeholder="Type note or call remark..."
                            className="h-8 text-xs"
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && e.target.value.trim()) {
                                toast.success(`Remark added: "${e.target.value}"`);
                                e.target.value = "";
                              }
                            }}
                          />
                          <span className="text-[10px] text-muted-foreground block">Press Enter to save</span>
                        </div>
                      </PopoverContent>
                    </Popover>
                  );
                }
                return <span className="text-muted-foreground">—</span>;
              }
              return (
                <div className="flex items-center gap-1.5 group/remcell">
                  <TooltipProvider delayDuration={200}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="truncate max-w-[200px] block cursor-help text-xs text-foreground font-medium">
                          {text}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs text-xs">
                        {text}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  {isRemark && (
                    <Popover>
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          onClick={(e) => e.stopPropagation()}
                          title="Quick edit remark"
                          className="opacity-0 group-hover/remcell:opacity-100 p-0.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-opacity"
                        >
                          <Pencil className="h-3 w-3" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-64 p-3 shadow-lg" align="start" onClick={(e) => e.stopPropagation()}>
                        <div className="space-y-2">
                          <span className="font-semibold text-xs text-foreground">Update Remark</span>
                          <Input
                            defaultValue={text}
                            placeholder="Type note..."
                            className="h-8 text-xs"
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && e.target.value.trim()) {
                                toast.success(`Remark updated: "${e.target.value}"`);
                              }
                            }}
                          />
                          <span className="text-[10px] text-muted-foreground block">Press Enter to save</span>
                        </div>
                      </PopoverContent>
                    </Popover>
                  )}
                </div>
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

    // Actions column — compact: View button + More dropdown
    const actionsCol = {
      id: "actions",
      header: () => null,
      cell: ({ row }) => {
        const lead = row.original;
        return (
          <div className="flex items-center justify-end gap-1 pr-1">
            <Link
              href={`/leads/active/${encodeLeadId(lead.id)}`}
              onClick={(e) => e.stopPropagation()}
              title="View lead details"
              className="inline-flex items-center gap-1 h-7 px-2.5 rounded-md text-[11px] font-semibold text-primary bg-primary/8 hover:bg-primary/15 border border-primary/20 transition-all"
            >
              <Eye className="h-3 w-3" />
              <span>View</span>
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center justify-center h-7 w-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted border border-border/60 hover:border-border transition-all"
                  title="More actions"
                >
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44 text-xs shadow-lg">
                {onEditLead && (
                  <DropdownMenuItem
                    onClick={(e) => { e.stopPropagation(); onEditLead(lead); }}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <Pencil className="h-3.5 w-3.5" />Edit Lead
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={(e) => { e.stopPropagation(); handleCall(e, lead); }}
                  className="flex items-center gap-2 cursor-pointer text-emerald-600 focus:text-emerald-600"
                >
                  <Phone className="h-3.5 w-3.5" />Call Now
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => { e.stopPropagation(); handleWhatsApp(e, lead); }}
                  className="flex items-center gap-2 cursor-pointer text-emerald-600 focus:text-emerald-600"
                >
                  <MessageCircle className="h-3.5 w-3.5" />WhatsApp
                </DropdownMenuItem>
                {onDeleteLead && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={(e) => { e.stopPropagation(); onDeleteLead(lead); }}
                      className="flex items-center gap-2 cursor-pointer text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />Delete
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
      enableSorting: false,
      enableResizing: false,
      size: 120,
    };

    return [selectCol, snoCol, ...dataCols, actionsCol];
  }, [columnsConfig, columnOrder]);

  // Visibility map
  const columnVisibility = useMemo(() => {
    const visibility = { select: true, sno: true, lead_name: true, actions: true };
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
      columnSizing: resolvedColumnSizing,
    },
    enableRowSelection: true,
    onRowSelectionChange,
    onPaginationChange: setPagination,
    onColumnSizingChange: onColumnSizingChange || setInternalColumnSizing,
    columnResizeMode: "onChange",
    enableColumnResizing: true,
    getRowId: (row) => String(row.id),
    onSortingChange: (updater) => { setSorting(updater); setPagination((p) => ({ ...p, pageIndex: 0 })); },
    onColumnFiltersChange: (updater) => { setColumnFilters(updater); setPagination((p) => ({ ...p, pageIndex: 0 })); },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const pageIndex = table.getState().pagination.pageIndex;
  const pageSize = table.getState().pagination.pageSize;
  const totalFilteredRows = table.getFilteredRowModel().rows.length;
  const pageCount = table.getPageCount();

  const startRecord = totalFilteredRows === 0 ? 0 : pageIndex * pageSize + 1;
  const endRecord = Math.min((pageIndex + 1) * pageSize, totalFilteredRows);
  const selectedCount = Object.keys(rowSelection).length;

  return (
    <div className="w-full bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
      {/* Scrollable Table Area with unified single scroll container */}
      <div className="relative overflow-auto max-h-[calc(100vh-320px)] min-h-[300px] leads-table-scroll">
        <table
          className="w-full border-collapse text-[13px] text-left caption-bottom"
          style={{ width: table.getTotalSize(), minWidth: table.getTotalSize(), tableLayout: "fixed" }}
        >
          <thead className="sticky top-0 z-30 shadow-xs border-b border-border bg-muted/95 backdrop-blur-xs">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b border-border bg-muted/95">
                {headerGroup.headers.map((header) => {
                  const isSelect = header.id === "select";
                  const isSno = header.id === "sno";
                  const isLeadName = header.id === "lead_name";
                  const isFixed = isSelect || isSno || isLeadName;
                  const isDragging = draggingColId === header.id;
                  return (
                    <th
                      key={header.id}
                      style={{ width: header.getSize(), minWidth: header.getSize() }}
                      draggable={!isFixed}
                      onDragStart={(event) => {
                        if (event.target.closest("button")) { event.preventDefault(); return; }
                        if (!isFixed) handleColDragStart(header.id);
                      }}
                      onDragEnter={() => !isFixed && handleColDragEnter(header.id)}
                      onDragEnd={handleColDragEnd}
                      onDragOver={(e) => e.preventDefault()}
                      className={cn(
                        "h-10 px-3 text-[11px] font-semibold text-muted-foreground border-r border-border/40 whitespace-nowrap uppercase tracking-wider bg-muted/95 transition-colors select-none",
                        !isFixed && "cursor-grab active:cursor-grabbing hover:bg-muted",
                        isDragging && "opacity-40 bg-primary/10",
                        isSelect && "w-[44px] min-w-[44px] max-w-[44px] px-2 sticky left-0 top-0 z-40 bg-muted border-r border-border/60 text-center",
                        isSno && "w-[48px] min-w-[48px] max-w-[48px] px-2 sticky left-[44px] top-0 z-40 bg-muted border-r border-border/40 text-center",
                        isLeadName && "w-[280px] min-w-[280px] max-w-[280px] sticky left-[92px] top-0 z-40 bg-muted border-r-2 border-border shadow-[2px_0_8px_rgba(0,0,0,0.06)]"
                      )}
                    >
                      {header.isPlaceholder ? null : (
                        <div className="relative flex items-center gap-1.5 pr-2">
                          {!isFixed && (
                            <GripVertical className="h-3 w-3 text-muted-foreground/30 shrink-0" />
                          )}
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {header.column.getCanResize() && (
                            <button
                              type="button"
                              aria-label={`Resize ${header.column.id} column`}
                              onMouseDown={(event) => { event.stopPropagation(); header.getResizeHandler()(event); }}
                              onTouchStart={(event) => { event.stopPropagation(); header.getResizeHandler()(event); }}
                              onClick={(event) => event.stopPropagation()}
                              className="absolute right-0 top-0 h-full w-2 cursor-col-resize touch-none after:absolute after:right-0.5 after:top-1/2 after:h-4 after:w-px after:-translate-y-1/2 after:bg-border hover:after:bg-primary"
                            />
                          )}
                        </div>
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>

          {/* Body */}
          <tbody className="divide-y divide-border/40 bg-card">
            {isLoading ? (
              <tr>
                <td
                  colSpan={columnsConfig.length + 1}
                  className="h-48 text-center text-xs text-muted-foreground"
                >
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <span>Loading pipeline leads...</span>
                  </div>
                </td>
              </tr>
            ) : table.getRowModel().rows.length === 0 ? (
              <tr>
                <td
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
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => {
                const isSelected = row.getIsSelected();
                const nextFollowupDate = parseValidDate(row.original.next_followup);
                const isOverdue = nextFollowupDate && nextFollowupDate < new Date();

                return (
                  <tr
                    key={row.id}
                    data-state={isSelected ? "selected" : undefined}
                    onClick={(event) => {
                      if (event.target.closest("a,button,input,[role='checkbox']")) return;
                      router.push(`/leads/active/${encodeLeadId(row.original.id)}`);
                    }}
                    className={cn(
                      "hover:bg-muted/40 transition-colors group/row cursor-pointer relative",
                      isSelected && "bg-primary/5 hover:bg-primary/8",
                      isOverdue && "border-l-4 border-l-rose-500 bg-rose-500/[0.02]"
                    )}
                  >
                    {row.getVisibleCells().map((cell) => {
                      const isSelect = cell.column.id === "select";
                      const isSno = cell.column.id === "sno";
                      const isLeadName = cell.column.id === "lead_name";

                      return (
                        <td
                          key={cell.id}
                          style={{ width: cell.column.getSize(), minWidth: cell.column.getSize() }}
                          className={cn(
                            "border-r border-border/30 whitespace-nowrap transition-colors",
                            density === "compact" ? "py-1.5 px-2.5 text-xs" : "py-2.5 px-3 text-[13px]",
                            isSelect &&
                              "w-[44px] min-w-[44px] max-w-[44px] px-2 sticky left-0 z-20 bg-[hsl(var(--card))] group-hover/row:bg-[hsl(var(--muted))] group-data-[state=selected]/row:bg-primary/10 border-r border-border/60 text-center",
                            isSno &&
                              "w-[48px] min-w-[48px] max-w-[48px] px-2 sticky left-[44px] z-20 bg-[hsl(var(--card))] group-hover/row:bg-[hsl(var(--muted))] group-data-[state=selected]/row:bg-primary/10 border-r border-border/40 text-center",
                            isLeadName &&
                              "w-[280px] min-w-[280px] max-w-[280px] sticky left-[92px] z-20 bg-[hsl(var(--card))] group-hover/row:bg-[hsl(var(--muted))] group-data-[state=selected]/row:bg-primary/10 border-r-2 border-border shadow-[2px_0_8px_rgba(0,0,0,0.06)]"
                          )}
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination & Density Footer */}
      <div className="px-4 py-2.5 bg-muted/10 border-t border-border flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground select-none">
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
