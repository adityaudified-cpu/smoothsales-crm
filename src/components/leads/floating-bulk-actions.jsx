"use client";

import React from "react";
import {
  UserCheck,
  Tag,
  MessageCircle,
  Download,
  Trash2,
  X,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { DEFAULT_PIPELINE_STAGES } from "@/lib/tenant-config";

export function FloatingBulkActions({
  selectedCount,
  onClearSelection,
  onBatchUpdate,
  onBatchDelete,
  selectedLeadIds = [],
}) {
  if (selectedCount === 0) return null;

  const handleAssignOwner = (ownerName) => {
    onBatchUpdate(selectedLeadIds, {
      lead_owner: { name: ownerName, initials: ownerName.split(" ").map(n => n[0]).join("") },
    });
    toast.success(`Assigned ${selectedCount} lead(s) to ${ownerName}`);
    onClearSelection();
  };

  const handleUpdateStage = (stageName) => {
    onBatchUpdate(selectedLeadIds, { lead_stage: stageName });
    toast.success(`Updated ${selectedCount} lead(s) to "${stageName}"`);
    onClearSelection();
  };

  const handleSendWhatsApp = () => {
    toast.info(`Preparing bulk WhatsApp campaign for ${selectedCount} lead(s)...`, {
      description: "Official WhatsApp Cloud API template modal ready.",
    });
  };

  const handleExport = () => {
    toast.success(`Exporting ${selectedCount} lead(s) as CSV...`);
  };

  const handleDelete = () => {
    if (confirm(`Are you sure you want to delete ${selectedCount} selected lead(s)?`)) {
      onBatchDelete(selectedLeadIds);
      toast.success(`Deleted ${selectedCount} lead(s)`);
      onClearSelection();
    }
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900 dark:bg-slate-950 text-white px-4 py-2.5 rounded-xl shadow-2xl border border-slate-700/80 flex items-center gap-3 text-xs animate-in fade-in slide-in-from-bottom-5 duration-200">
      {/* Selected counter pill */}
      <div className="flex items-center gap-2 pr-2 border-r border-slate-700">
        <span className="h-5 min-w-5 px-1.5 rounded-full bg-primary text-primary-foreground font-bold flex items-center justify-center text-[11px]">
          {selectedCount}
        </span>
        <span className="font-semibold text-slate-200">
          lead{selectedCount > 1 ? "s" : ""} selected
        </span>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-1.5">
        {/* Assign Owner Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs text-slate-200 hover:text-white hover:bg-slate-800 gap-1.5"
            >
              <UserCheck className="h-3.5 w-3.5 text-primary" />
              <span>Assign</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" className="text-xs">
            <DropdownMenuItem onClick={() => handleAssignOwner("Aarav Sharma")}>
              Aarav Sharma
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleAssignOwner("Rohan Varma")}>
              Rohan Varma
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleAssignOwner("Sneha Roy")}>
              Sneha Roy
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Change Stage Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs text-slate-200 hover:text-white hover:bg-slate-800 gap-1.5"
            >
              <Layers className="h-3.5 w-3.5 text-amber-400" />
              <span>Stage</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" className="text-xs max-h-56 overflow-y-auto">
            {DEFAULT_PIPELINE_STAGES.map((st) => (
              <DropdownMenuItem
                key={st.id}
                onClick={() => handleUpdateStage(st.name)}
              >
                {st.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* WhatsApp */}
        <Button
          size="sm"
          variant="ghost"
          onClick={handleSendWhatsApp}
          className="h-7 text-xs text-emerald-400 hover:text-emerald-300 hover:bg-slate-800 gap-1.5"
        >
          <MessageCircle className="h-3.5 w-3.5" />
          <span>WhatsApp</span>
        </Button>

        {/* Export */}
        <Button
          size="sm"
          variant="ghost"
          onClick={handleExport}
          className="h-7 text-xs text-slate-200 hover:text-white hover:bg-slate-800 gap-1.5"
        >
          <Download className="h-3.5 w-3.5" />
          <span>Export</span>
        </Button>

        {/* Delete */}
        <Button
          size="sm"
          variant="ghost"
          onClick={handleDelete}
          className="h-7 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 gap-1.5"
        >
          <Trash2 className="h-3.5 w-3.5" />
          <span>Delete</span>
        </Button>
      </div>

      {/* Clear selection close button */}
      <button
        onClick={onClearSelection}
        className="ml-1 p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        title="Deselect all"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
