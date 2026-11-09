"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  GitBranch,
  Plus,
  Trash2,
  ArrowRight,
  ArrowLeft,
  GripVertical,
  CheckCircle2,
  XCircle,
  Sparkles,
  Zap,
} from "lucide-react";
import { useOnboarding } from "@/lib/onboarding-context";
import { AiRegenerateBox } from "@/components/onboarding/ai-regenerate-box";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

/**
 * NOTE: This step reuses the exact pipeline stage schema from Prompt #3:
 * (isConversion, isPrimaryConversion, triggerCapi, sortOrder).
 * This onboarding wizard UI and the Prompt #3 Pipeline Builder are two views
 * over the same underlying data architecture, ensuring full data compatibility.
 */
const INITIAL_STAGES = [
  {
    id: "stg_1",
    name: "Requirement",
    description: "Initial client brief, architectural style & floorplan gathered",
    stageGroup: "Inquiry",
    isConversion: false,
    isPrimaryConversion: false,
    triggerCapi: false,
    sortOrder: 1,
    isWon: false,
    isLost: false,
    enabled: true,
  },
  {
    id: "stg_2",
    name: "Site Visit Scheduled",
    description: "Physical inspection of apartment/office space with measurements",
    stageGroup: "Qualification",
    isConversion: true,
    isPrimaryConversion: true,
    triggerCapi: true,
    sortOrder: 2,
    isWon: false,
    isLost: false,
    enabled: true,
  },
  {
    id: "stg_3",
    name: "Design & Quotation",
    description: "3D renderings and itemized commercial proposal prepared",
    stageGroup: "Proposal",
    isConversion: false,
    isPrimaryConversion: false,
    triggerCapi: false,
    sortOrder: 3,
    isWon: false,
    isLost: false,
    enabled: true,
  },
  {
    id: "stg_4",
    name: "Negotiation",
    description: "Scope finalization, material selections, and payment milestones",
    stageGroup: "Closing",
    isConversion: false,
    isPrimaryConversion: false,
    triggerCapi: false,
    sortOrder: 4,
    isWon: false,
    isLost: false,
    enabled: true,
  },
  {
    id: "stg_5",
    name: "Deal Won",
    description: "Contract signed, booking token advance received",
    stageGroup: "Won",
    isConversion: true,
    isPrimaryConversion: false,
    triggerCapi: true,
    sortOrder: 5,
    isWon: true,
    isLost: false,
    enabled: true,
  },
  {
    id: "stg_6",
    name: "Deal Lost",
    description: "Client chose competitor, postponed timeline, or budget mismatch",
    stageGroup: "Lost",
    isConversion: false,
    isPrimaryConversion: false,
    triggerCapi: false,
    sortOrder: 6,
    isWon: false,
    isLost: true,
    enabled: true,
  },
];

export default function DealStagesStepPage() {
  const router = useRouter();
  const { dealStages, updateOnboarding } = useOnboarding();

  const [stages, setStages] = useState(() => {
    return dealStages && dealStages.length > 0
      ? dealStages
      : JSON.parse(JSON.stringify(INITIAL_STAGES));
  });

  const [newStageName, setNewStageName] = useState("");
  const [newStageDesc, setNewStageDesc] = useState("");

  const handleToggleEnable = (id) => {
    setStages(
      stages.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s))
    );
  };

  const handleNameChange = (id, val) => {
    setStages(
      stages.map((s) => (s.id === id ? { ...s, name: val } : s))
    );
  };

  const handleDescChange = (id, val) => {
    setStages(
      stages.map((s) => (s.id === id ? { ...s, description: val } : s))
    );
  };

  const handleToggleConversion = (id) => {
    setStages(
      stages.map((s) =>
        s.id === id
          ? {
              ...s,
              isConversion: !s.isConversion,
              isPrimaryConversion: !s.isConversion,
              triggerCapi: !s.isConversion,
            }
          : s
      )
    );
  };

  const handleDeleteStage = (id) => {
    setStages(stages.filter((s) => s.id !== id));
  };

  const handleAddStage = (e) => {
    e.preventDefault();
    if (!newStageName.trim()) return;

    const newStage = {
      id: `stg_custom_${Date.now()}`,
      name: newStageName.trim(),
      description: newStageDesc.trim() || "Custom stage step",
      stageGroup: "Custom",
      isConversion: false,
      isPrimaryConversion: false,
      triggerCapi: false,
      sortOrder: stages.length + 1,
      isWon: false,
      isLost: false,
      enabled: true,
    };

    setStages([...stages, newStage]);
    setNewStageName("");
    setNewStageDesc("");
  };

  const handleAiRegenerate = (customPrompt) => {
    const extraStage = {
      id: `stg_ai_${Date.now()}`,
      name: customPrompt.trim()
        ? `Review Milestone (${customPrompt.slice(0, 18)}...)`
        : "Technical Feasibility Assessment",
      description: "AI-suggested qualification milestone tailored to your sales process",
      stageGroup: "Evaluation",
      isConversion: false,
      isPrimaryConversion: false,
      triggerCapi: false,
      sortOrder: stages.length + 1,
      isWon: false,
      isLost: false,
      enabled: true,
    };
    setStages([...stages, extraStage]);
  };

  const handleSaveAndContinue = () => {
    updateOnboarding({ dealStages: stages });
    router.push("/setup/products-services");
  };

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
          <GitBranch className="h-3.5 w-3.5" />
          <span>Step 4 of 7</span>
        </div>
        <h1 className="font-heading text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
          Deal Stages
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          When a lead is qualified, a deal is created. It moves through these stages until it closes as Won or Lost. You can reorder, rename, or add stages.
        </p>
      </div>

      {/* Stage Cards List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-foreground font-heading">
            Pipeline Sequence ({stages.filter((s) => s.enabled).length} active stages)
          </h2>
          <span className="text-xs text-muted-foreground">
            Compatible with Meta CAPI &amp; analytics
          </span>
        </div>

        <div className="space-y-3">
          {stages.map((stage, idx) => (
            <Card
              key={stage.id}
              className={`p-4 rounded-xl border border-border bg-card shadow-2xs space-y-2.5 transition-all ${
                !stage.enabled ? "opacity-50" : ""
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <GripVertical className="h-4 w-4 text-muted-foreground/40 cursor-grab shrink-0" />
                  <Checkbox
                    checked={stage.enabled}
                    onCheckedChange={() => handleToggleEnable(stage.id)}
                    className="data-[state=checked]:bg-primary"
                  />
                  <span className="text-xs font-bold text-muted-foreground w-5 text-center shrink-0">
                    {idx + 1}.
                  </span>
                  <Input
                    value={stage.name}
                    onChange={(e) => handleNameChange(stage.id, e.target.value)}
                    disabled={!stage.enabled}
                    className="h-8 text-xs sm:text-sm font-bold border-transparent hover:border-border focus:border-primary bg-transparent flex-1"
                  />
                </div>

                {/* Right Badges & Controls */}
                <div className="flex items-center gap-2 shrink-0">
                  {stage.isWon && (
                    <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px] font-bold">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Won Stage
                    </Badge>
                  )}

                  {stage.isLost && (
                    <Badge className="bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30 text-[10px] font-bold">
                      <XCircle className="h-3 w-3 mr-1" />
                      Lost Stage
                    </Badge>
                  )}

                  {!stage.isWon && !stage.isLost && (
                    <button
                      type="button"
                      onClick={() => handleToggleConversion(stage.id)}
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border transition-colors flex items-center gap-1 ${
                        stage.isConversion
                          ? "border-primary text-primary bg-primary/10"
                          : "border-border text-muted-foreground hover:border-primary/40"
                      }`}
                      title="Triggers Meta Conversion API (CAPI) & Ad Attribution"
                    >
                      <Zap className="h-2.5 w-2.5" />
                      {stage.isConversion ? "Conversion Goal" : "+ Mark Conversion"}
                    </button>
                  )}

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteStage(stage.id)}
                    className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              {/* Stage Description Beneath */}
              <div className="pl-9 pr-2">
                <Input
                  value={stage.description}
                  onChange={(e) => handleDescChange(stage.id, e.target.value)}
                  disabled={!stage.enabled}
                  placeholder="Stage milestone description..."
                  className="h-7 text-xs text-muted-foreground bg-muted/15 border-transparent hover:border-border focus:border-primary"
                />
              </div>
            </Card>
          ))}
        </div>

        {/* Add New Stage Row */}
        <Card className="p-4 rounded-xl border border-dashed border-border bg-muted/20">
          <form onSubmit={handleAddStage} className="space-y-2">
            <div className="flex items-center gap-2">
              <Input
                value={newStageName}
                onChange={(e) => setNewStageName(e.target.value)}
                placeholder="Stage name (e.g. Design Presentation, Sample Approval)"
                className="h-9 text-xs bg-background flex-1"
              />
              <Button
                type="submit"
                size="sm"
                disabled={!newStageName.trim()}
                className="gap-1 text-xs font-semibold h-9 px-4 shrink-0 bg-primary text-primary-foreground"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Stage
              </Button>
            </div>
            <Input
              value={newStageDesc}
              onChange={(e) => setNewStageDesc(e.target.value)}
              placeholder="Short description of what happens at this stage..."
              className="h-8 text-xs bg-background text-muted-foreground"
            />
          </form>
        </Card>
      </div>

      {/* AI Regenerate Box at Bottom */}
      <AiRegenerateBox
        title="Want custom stages? Describe your sales cycle:"
        placeholder="e.g. We have a 4-step consultation process with site measurements, quotation revision, and agreement signing."
        buttonLabel="Regenerate Deal Stages"
        onRegenerate={handleAiRegenerate}
      />

      {/* Footer Navigation */}
      <div className="pt-4 flex items-center justify-between border-t border-border">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/setup/qualification-form")}
          className="gap-2 text-xs font-medium"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back
        </Button>

        <Button
          onClick={handleSaveAndContinue}
          className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 text-xs sm:text-sm font-semibold font-heading h-10 px-6 shadow-xs"
        >
          <span>Save &amp; Continue</span>
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
