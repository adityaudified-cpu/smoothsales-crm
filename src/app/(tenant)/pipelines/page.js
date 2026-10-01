"use client";

import React, { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  ArrowUp,
  ArrowDown,
  Trash2,
  Info,
  SlidersHorizontal,
} from "lucide-react";
import { MOCK_PIPELINES } from "@/lib/mock-data/pipelines";

export default function PipelineAndStageBuilderPage() {
  const [pipeline] = useState(MOCK_PIPELINES[0]);
  const [stages, setStages] = useState(MOCK_PIPELINES[0].stages);

  const moveStage = (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= stages.length) return;

    const updated = [...stages];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;

    // Recalculate sortOrder
    const reordered = updated.map((stg, i) => ({
      ...stg,
      sortOrder: i + 1,
    }));
    setStages(reordered);
  };

  const handleUpdateStage = (id, field, value) => {
    setStages((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          const updated = { ...s, [field]: value };
          // If isConversion turned off, turn off dependent toggles
          if (field === "isConversion" && !value) {
            updated.isPrimaryConversion = false;
            updated.triggerCapi = false;
          }
          return updated;
        }
        return s;
      })
    );
  };

  const handleDeleteStage = (id) => {
    setStages((prev) =>
      prev.filter((s) => s.id !== id).map((s, i) => ({ ...s, sortOrder: i + 1 }))
    );
  };

  const handleAddStage = () => {
    const newStage = {
      id: `stg_${Date.now()}`,
      name: "",
      stageGroup: "Inquiry",
      isConversion: false,
      isPrimaryConversion: false,
      triggerCapi: false,
      sortOrder: stages.length + 1,
    };
    setStages([...stages, newStage]);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pipeline & Stage Builder"
        subtitle="Configure the sales stages for each business vertical"
      />

      {/* Top Vertical Switcher */}
      <div className="flex items-center justify-between bg-card p-3 border border-border rounded-md">
        <div className="flex items-center gap-3">
          <SlidersHorizontal className="h-4 w-4 text-primary shrink-0" />
          <div>
            <span className="text-xs font-semibold text-foreground">Sales Vertical Pipeline</span>
            <p className="text-[11px] text-muted-foreground">Select industry blueprint to configure</p>
          </div>
        </div>

        <div className="w-56">
          <Select defaultValue={pipeline.id} disabled>
            <SelectTrigger className="h-8 text-xs bg-background">
              <SelectValue placeholder="Select Vertical" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={pipeline.id} className="text-xs">
                {pipeline.verticalName} Vertical
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Callout Distinction Note */}
      <div className="border-l-4 border-primary bg-accent/50 p-3.5 text-xs rounded-r-md leading-relaxed text-foreground flex items-start gap-2.5">
        <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
        <div>
          <strong className="font-semibold text-foreground">Core Principle: </strong>
          Conversion = a business milestone reached (e.g., Site Visit Done). Deal Won is tracked separately as the final commercial outcome — these are intentionally different concepts.
        </div>
      </div>

      {/* Editable Stage Rows in Order */}
      <div className="space-y-3">
        {stages.map((stage, index) => (
          <Card
            key={stage.id}
            className="p-4 bg-card border border-border shadow-none rounded-md hover:border-primary/40 transition-colors"
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 text-xs">
              {/* Left: Up/Down Buttons + Sort Order + Name & Group Inputs */}
              <div className="flex items-center gap-3 flex-1">
                {/* Reorder Buttons */}
                <div className="flex flex-col gap-0.5 shrink-0">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={index === 0}
                    onClick={() => moveStage(index, -1)}
                    className="h-5 w-5 text-muted-foreground hover:text-foreground disabled:opacity-25"
                  >
                    <ArrowUp className="h-3 w-3" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={index === stages.length - 1}
                    onClick={() => moveStage(index, 1)}
                    className="h-5 w-5 text-muted-foreground hover:text-foreground disabled:opacity-25"
                  >
                    <ArrowDown className="h-3 w-3" />
                  </Button>
                </div>

                {/* Sort Order Badge */}
                <span className="h-6 w-6 rounded bg-muted text-muted-foreground flex items-center justify-center font-bold text-xs shrink-0 tabular-nums">
                  #{stage.sortOrder}
                </span>

                {/* Inline Stage Name */}
                <div className="space-y-1 flex-1">
                  <Label className="text-[10px] text-muted-foreground uppercase font-semibold">
                    Stage Name
                  </Label>
                  <Input
                    value={stage.name}
                    onChange={(e) => handleUpdateStage(stage.id, "name", e.target.value)}
                    placeholder="e.g. Site Visit"
                    className="h-8 text-xs bg-background font-medium"
                  />
                </div>

                {/* Inline Stage Group */}
                <div className="space-y-1 w-44 shrink-0">
                  <Label className="text-[10px] text-muted-foreground uppercase font-semibold">
                    Stage Group
                  </Label>
                  <Input
                    value={stage.stageGroup}
                    onChange={(e) => handleUpdateStage(stage.id, "stageGroup", e.target.value)}
                    placeholder="e.g. Qualification"
                    className="h-8 text-xs bg-background"
                  />
                </div>
              </div>

              {/* Right: Conversion Toggles & Delete */}
              <div className="flex items-center gap-5 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-border">
                {/* Is Conversion? */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-foreground font-medium">Is Conversion?</span>
                  <Switch
                    checked={stage.isConversion}
                    onCheckedChange={(val) => handleUpdateStage(stage.id, "isConversion", val)}
                  />
                </div>

                {/* Primary Conversion? (Only enabled/visible if isConversion is on) */}
                {stage.isConversion && (
                  <div className="flex items-center gap-2 animate-in fade-in">
                    <span className="text-xs text-foreground font-medium">Primary Conversion?</span>
                    <Switch
                      checked={stage.isPrimaryConversion}
                      onCheckedChange={(val) =>
                        handleUpdateStage(stage.id, "isPrimaryConversion", val)
                      }
                    />
                  </div>
                )}

                {/* Trigger CAPI? (Only enabled/visible if isConversion is on) */}
                {stage.isConversion && (
                  <div className="flex items-center gap-2 animate-in fade-in">
                    <span className="text-xs text-foreground font-medium">Trigger CAPI?</span>
                    <Switch
                      checked={stage.triggerCapi}
                      onCheckedChange={(val) => handleUpdateStage(stage.id, "triggerCapi", val)}
                    />
                  </div>
                )}

                {/* Delete Button */}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeleteStage(stage.id)}
                  className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Add Stage Button */}
      <div className="pt-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddStage}
          className="h-8 text-xs gap-1.5 font-medium"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Add Stage</span>
        </Button>
      </div>
    </div>
  );
}
