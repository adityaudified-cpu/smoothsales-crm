"use client";

import React from "react";
import { pipelineStages, MOCK_DEALS } from "@/lib/mock-data/deals";
import { KanbanColumn } from "./kanban-column";

export function KanbanBoard() {
  {/* TODO: drag-and-drop reordering in a later pass */}

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 pb-6 overflow-x-auto select-none">
      {pipelineStages.map((stage) => {
        const stageDeals = MOCK_DEALS.filter((d) => d.stageId === stage.id);
        return (
          <KanbanColumn
            key={stage.id}
            title={stage.label}
            count={stageDeals.length}
            deals={stageDeals}
          />
        );
      })}
    </div>
  );
}
