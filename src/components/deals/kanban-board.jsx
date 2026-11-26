"use client";

import React, { useCallback, useEffect, useState } from "react";
import { KanbanColumn } from "./kanban-column";
import { dealsApi } from "@/lib/api/deals";
import { toast } from "sonner";
import { Loader2, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";

const DEAL_STAGES = [
  { id: "NEEDS_ASSESSMENT", label: "Needs Assessment" },
  { id: "PROPOSAL_SENT", label: "Proposal Sent" },
  { id: "TERMS_DISCUSSION", label: "Terms Discussion" },
  { id: "DEAL_WON", label: "Deal Won" },
  { id: "DEAL_LOST", label: "Deal Lost" },
];

export function KanbanBoard() {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dragDealId, setDragDealId] = useState(null);

  const loadDeals = useCallback(async () => {
    setLoading(true);
    try {
      const { items } = await dealsApi.list();
      setDeals(items || []);
    } catch (err) {
      toast.error("Failed to load deals", { description: err?.message });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDeals();
  }, [loadDeals]);

  useEffect(() => {
    const onUpdated = () => loadDeals();
    window.addEventListener("smoothsales:lead-updated", onUpdated);
    return () => window.removeEventListener("smoothsales:lead-updated", onUpdated);
  }, [loadDeals]);

  const handleStageChange = async (dealId, targetStage) => {
    const existing = deals.find((d) => d.id === dealId);
    if (!existing || existing.stage === targetStage) return;

    setDeals((prev) =>
      prev.map((d) => (d.id === dealId ? { ...d, stage: targetStage } : d))
    );
    try {
      await dealsApi.updateStage(dealId, targetStage);
      toast.success("Deal stage updated");
    } catch (err) {
      toast.error("Could not update deal stage", { description: err?.message });
      loadDeals();
    }
  };

  const handleDropDeal = (targetStage) => {
    if (dragDealId) {
      handleStageChange(dragDealId, targetStage);
      setDragDealId(null);
    }
  };

  if (loading) {
    return (
      <div className="py-16 flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Loading deals pipeline...</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {deals.length} active deal{deals.length === 1 ? "" : "s"} · created automatically when logging &ldquo;Interested&rdquo; calls
        </span>
        <Button variant="outline" size="sm" onClick={loadDeals} className="h-7 text-xs gap-1.5">
          <RotateCw className="h-3 w-3" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 pb-6 overflow-x-auto select-none">
        {DEAL_STAGES.map((stage) => {
          const stageDeals = deals.filter((d) => d.stage === stage.id);
          return (
            <KanbanColumn
              key={stage.id}
              stageId={stage.id}
              title={stage.label}
              count={stageDeals.length}
              deals={stageDeals}
              onDragStart={setDragDealId}
              onDropDeal={handleDropDeal}
              onStageChange={handleStageChange}
            />
          );
        })}
      </div>
    </div>
  );
}
