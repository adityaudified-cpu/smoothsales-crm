import React from "react";
import { PageHeader } from "@/components/layout/page-header";
import { KanbanBoard } from "@/components/deals/kanban-board";

export const metadata = {
  title: "Deals & Pipeline — SmoothSales.ai",
  description: "Visual Kanban pipeline for the Interior Design vertical",
};

export default function DealsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Deals & Pipeline"
        subtitle="Interior Design Vertical"
      />

      <KanbanBoard />
    </div>
  );
}
