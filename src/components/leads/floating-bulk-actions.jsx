"use client";

import React, { useState } from "react";
import {
  UserCheck,
  MessageCircle,
  Download,
  Trash2,
  X,
  Layers,
  AlertTriangle,
  Check,
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
import { useTeamMembers } from "@/lib/hooks/use-team-members";

export function FloatingBulkActions({
  selectedCount,
  onClearSelection,
  onBatchUpdate,
  onBatchDelete,
  selectedLeadIds = [],
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { reps } = useTeamMembers();

  if (selectedCount === 0) return null;

  const handleAssignOwner = (rep) => {
    onBatchUpdate(selectedLeadIds, {
      lead_owner: rep ? { id: rep.id, name: rep.name, initials: rep.initials } : null,
    });
    toast.success(rep ? `Assigned ${selectedCount} lead(s) to ${rep.name}` : `Unassigned ${selectedCount} lead(s)`);
    onClearSelection();
  };

  const handleUpdateStage = (stageName) => {
    onBatchUpdate(selectedLeadIds, { lead_stage: stageName });
    toast.success(`Updated ${selectedCount} lead(s) to "${stageName}"`);
    onClearSelection();
  };

  const handleDelete = () => {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    onBatchDelete(selectedLeadIds);
    toast.success(`Deleted ${selectedCount} lead(s)`);
    onClearSelection();
    setConfirmDelete(false);
  };

  const handleCancelDelete = (e) => { e.stopPropagation(); setConfirmDelete(false); };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900 dark:bg-slate-950 text-white px-4 py-2.5 rounded-2xl shadow-2xl border border-slate-700/60 flex items-center gap-3 text-xs animate-in fade-in slide-in-from-bottom-5 duration-200 backdrop-blur-sm">
      {/* Selected counter pill */}
      <div className="flex items-center gap-2 pr-2 border-r border-slate-700">
        <span className="h-5 min-w-5 px-1.5 rounded-full bg-primary text-primary-foreground font-bold flex items-center justify-center text-[11px]">
          {selectedCount}
        </span>
        <span className="font-semibold text-slate-200">
          lead{selectedCount > 1 ? "s" : ""} selected
        </span>
      </div>

      <div className="flex items-center gap-1.5">
        {/* Assign Owner */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="ghost" className="h-7 text-xs text-slate-200 hover:text-white hover:bg-slate-800 gap-1.5">
              <UserCheck className="h-3.5 w-3.5 text-primary" />
              <span>Assign</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" className="text-xs max-h-56 overflow-y-auto">
            {reps.map((rep) => (
              <DropdownMenuItem key={rep.id || rep.name} onClick={() => handleAssignOwner(rep)}>
                {rep.name}
                {rep.role && <span className="ml-1.5 text-muted-foreground text-[10px]">· {rep.role}</span>}
              </DropdownMenuItem>
            ))}
            <DropdownMenuItem onClick={() => handleAssignOwner(null)} className="text-muted-foreground">
              Unassign
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Change Stage */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="ghost" className="h-7 text-xs text-slate-200 hover:text-white hover:bg-slate-800 gap-1.5">
              <Layers className="h-3.5 w-3.5 text-amber-400" />
              <span>Stage</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" className="text-xs max-h-56 overflow-y-auto">
            {DEFAULT_PIPELINE_STAGES.map((st) => (
              <DropdownMenuItem key={st.id} onClick={() => handleUpdateStage(st.name)}>
                {st.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* WhatsApp */}
        <Button size="sm" variant="ghost" onClick={() => toast.info(`Preparing bulk WhatsApp for ${selectedCount} lead(s)…`)} className="h-7 text-xs text-emerald-400 hover:text-emerald-300 hover:bg-slate-800 gap-1.5">
          <MessageCircle className="h-3.5 w-3.5" />
          <span>WhatsApp</span>
        </Button>

        {/* Export */}
        <Button size="sm" variant="ghost" onClick={() => toast.success(`Exporting ${selectedCount} lead(s)…`)} className="h-7 text-xs text-slate-200 hover:text-white hover:bg-slate-800 gap-1.5">
          <Download className="h-3.5 w-3.5" />
          <span>Export</span>
        </Button>

        {/* Delete */}
        {confirmDelete ? (
          <div className="flex items-center gap-1 pl-1 border-l border-slate-700">
            <span className="text-[11px] text-rose-300 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Delete {selectedCount}?
            </span>
            <Button size="sm" variant="ghost" onClick={handleDelete} className="h-7 px-2 text-xs text-rose-300 hover:text-white hover:bg-rose-900/60 gap-1">
              <Check className="h-3.5 w-3.5" />Yes
            </Button>
            <Button size="sm" variant="ghost" onClick={handleCancelDelete} className="h-7 px-2 text-xs text-slate-400 hover:text-white hover:bg-slate-800">
              No
            </Button>
          </div>
        ) : (
          <Button size="sm" variant="ghost" onClick={handleDelete} className="h-7 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 gap-1.5">
            <Trash2 className="h-3.5 w-3.5" />
            <span>Delete</span>
          </Button>
        )}
      </div>

      <button
        onClick={() => { setConfirmDelete(false); onClearSelection(); }}
        className="ml-1 p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        title="Deselect all"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
