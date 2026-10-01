"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  GripVertical,
  Plus,
  Trash2,
  AlertCircle,
  PhoneCall,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ShieldAlert,
} from "lucide-react";
import { useOnboarding } from "@/lib/onboarding-context";
import { INITIAL_CALL_OUTCOMES } from "@/lib/mock-data/onboarding-call-outcomes";
import { AiRegenerateBox } from "@/components/onboarding/ai-regenerate-box";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";

export default function CallOutcomesStepPage() {
  const router = useRouter();
  const { callOutcomes, updateOnboarding } = useOnboarding();

  // Local editable state initialized with context or mock data
  const [outcomes, setOutcomes] = useState(() => {
    return callOutcomes || JSON.parse(JSON.stringify(INITIAL_CALL_OUTCOMES));
  });

  // State for adding a new custom outcome
  const [newLabel, setNewLabel] = useState("");
  const [newSentiment, setNewSentiment] = useState("positive");

  // Show/collapse standard not-connected outcomes
  const [showStandardOutcomes, setShowStandardOutcomes] = useState(false);

  // Toggle enabled
  const handleToggleEnable = (bucket, id) => {
    setOutcomes((prev) => ({
      ...prev,
      [bucket]: prev[bucket].map((item) =>
        item.id === id ? { ...item, enabled: !item.enabled } : item
      ),
    }));
  };

  // Update label
  const handleLabelChange = (bucket, id, val) => {
    setOutcomes((prev) => ({
      ...prev,
      [bucket]: prev[bucket].map((item) =>
        item.id === id ? { ...item, label: val } : item
      ),
    }));
  };

  // Toggle autoCreateDeal for positive outcomes
  const handleToggleAutoCreateDeal = (id) => {
    setOutcomes((prev) => ({
      ...prev,
      positive: prev.positive.map((item) =>
        item.id === id ? { ...item, autoCreateDeal: !item.autoCreateDeal } : item
      ),
    }));
  };

  // Delete an outcome
  const handleDelete = (bucket, id) => {
    setOutcomes((prev) => ({
      ...prev,
      [bucket]: prev[bucket].filter((item) => item.id !== id),
    }));
  };

  // Add new outcome
  const handleAddOutcome = (e) => {
    e.preventDefault();
    if (!newLabel.trim()) return;

    const mapsTo =
      newSentiment === "positive"
        ? "Qualified"
        : newSentiment === "neutral"
        ? "Connected"
        : "Not Interested";

    const newItem = {
      id: `custom_${Date.now()}`,
      label: newLabel.trim(),
      mapsToStatus: mapsTo,
      autoCreateDeal: newSentiment === "positive",
      autoCloseLead: newSentiment === "negative",
      enabled: true,
    };

    setOutcomes((prev) => ({
      ...prev,
      [newSentiment]: [...prev[newSentiment], newItem],
    }));

    setNewLabel("");
  };

  // AI Regenerate handler
  const handleAiRegenerate = (customPrompt) => {
    // Inject a customized outcome based on prompt or enrich
    const extraPositive = {
      id: `ai_${Date.now()}`,
      label: customPrompt.trim()
        ? `VIP Consultation Booked (${customPrompt.slice(0, 20)}...)`
        : "Architectural Consultation Booked",
      mapsToStatus: "Qualified",
      autoCreateDeal: true,
      enabled: true,
    };

    setOutcomes((prev) => ({
      ...prev,
      positive: [...prev.positive, extraPositive],
    }));
  };

  // Save & Continue
  const handleSaveAndContinue = () => {
    updateOnboarding({ callOutcomes: outcomes });
    router.push("/onboarding/setup/visit-outcomes");
  };

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
          <PhoneCall className="h-3.5 w-3.5" />
          <span>Step 1 of 7</span>
        </div>
        <h1 className="font-heading text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
          Call Outcomes
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          When your team calls leads, they choose an outcome after each connected call. These are AI-suggested based on your business — you can add, remove, or edit them.
        </p>
      </div>

      {/* Bucket 1: Positive Outcomes */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            <h2 className="text-sm font-bold text-foreground font-heading">
              Positive Outcomes
            </h2>
            <Badge variant="outline" className="text-[10px] text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/5 font-semibold">
              Maps to: Qualified
            </Badge>
          </div>
          <span className="text-xs text-muted-foreground">
            {outcomes.positive.filter((o) => o.enabled).length} active
          </span>
        </div>

        <div className="space-y-2.5">
          {outcomes.positive.map((item) => (
            <Card
              key={item.id}
              className={`p-3.5 rounded-xl border border-border border-l-4 border-l-emerald-500 bg-card transition-all ${
                !item.enabled ? "opacity-50" : ""
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <GripVertical className="h-4 w-4 text-muted-foreground/40 cursor-grab shrink-0" />
                  <Checkbox
                    checked={item.enabled}
                    onCheckedChange={() => handleToggleEnable("positive", item.id)}
                    className="data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                  />
                  <Input
                    value={item.label}
                    onChange={(e) => handleLabelChange("positive", item.id, e.target.value)}
                    disabled={!item.enabled}
                    className="h-8 text-xs sm:text-sm font-semibold border-transparent hover:border-border focus:border-primary bg-transparent"
                  />
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 pl-8 sm:pl-0">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="text-[11px]">Auto-create deal</span>
                    <Switch
                      checked={item.autoCreateDeal}
                      onCheckedChange={() => handleToggleAutoCreateDeal(item.id)}
                      disabled={!item.enabled}
                      className="data-[state=checked]:bg-emerald-600 scale-90"
                    />
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete("positive", item.id)}
                    className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Bucket 2: Neutral Outcomes */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
            <h2 className="text-sm font-bold text-foreground font-heading">
              Neutral Outcomes
            </h2>
            <Badge variant="outline" className="text-[10px] text-amber-600 dark:text-amber-400 border-amber-500/30 bg-amber-500/5 font-semibold">
              Maps to: Connected
            </Badge>
          </div>
          <span className="text-xs text-muted-foreground">
            {outcomes.neutral.filter((o) => o.enabled).length} active
          </span>
        </div>

        <div className="space-y-2.5">
          {outcomes.neutral.map((item) => (
            <Card
              key={item.id}
              className={`p-3.5 rounded-xl border border-border border-l-4 border-l-amber-500 bg-card transition-all ${
                !item.enabled ? "opacity-50" : ""
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <GripVertical className="h-4 w-4 text-muted-foreground/40 cursor-grab shrink-0" />
                  <Checkbox
                    checked={item.enabled}
                    onCheckedChange={() => handleToggleEnable("neutral", item.id)}
                    className="data-[state=checked]:bg-amber-600 data-[state=checked]:border-amber-600"
                  />
                  <Input
                    value={item.label}
                    onChange={(e) => handleLabelChange("neutral", item.id, e.target.value)}
                    disabled={!item.enabled}
                    className="h-8 text-xs sm:text-sm font-semibold border-transparent hover:border-border focus:border-primary bg-transparent"
                  />
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete("neutral", item.id)}
                  className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Bucket 3: Negative Outcomes */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
            <h2 className="text-sm font-bold text-foreground font-heading">
              Negative Outcomes
            </h2>
            <Badge variant="outline" className="text-[10px] text-rose-600 dark:text-rose-400 border-rose-500/30 bg-rose-500/5 font-semibold">
              Maps to: Not Interested / Junk
            </Badge>
          </div>
          <span className="text-xs text-muted-foreground">
            {outcomes.negative.filter((o) => o.enabled).length} active
          </span>
        </div>

        <div className="space-y-2.5">
          {outcomes.negative.map((item) => (
            <Card
              key={item.id}
              className={`p-3.5 rounded-xl border border-border border-l-4 border-l-rose-500 bg-card transition-all ${
                !item.enabled ? "opacity-50" : ""
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <GripVertical className="h-4 w-4 text-muted-foreground/40 cursor-grab shrink-0" />
                  <Checkbox
                    checked={item.enabled}
                    onCheckedChange={() => handleToggleEnable("negative", item.id)}
                    className="data-[state=checked]:bg-rose-600 data-[state=checked]:border-rose-600"
                  />
                  <Input
                    value={item.label}
                    onChange={(e) => handleLabelChange("negative", item.id, e.target.value)}
                    disabled={!item.enabled}
                    className="h-8 text-xs sm:text-sm font-semibold border-transparent hover:border-border focus:border-primary bg-transparent"
                  />
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 pl-8 sm:pl-0">
                  {/* Fixed non-toggleable warning note */}
                  <div className="flex items-center gap-1.5 text-[11px] text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-md font-medium">
                    <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
                    <span>Lead will be marked {item.mapsToStatus} automatically</span>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete("negative", item.id)}
                    className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Add New Outcome Form Row */}
      <Card className="p-4 rounded-xl border border-dashed border-border bg-muted/20">
        <form onSubmit={handleAddOutcome} className="flex flex-col sm:flex-row items-center gap-3">
          <Input
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder="Add new outcome name..."
            className="h-9 text-xs bg-background flex-1"
          />

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Select value={newSentiment} onValueChange={setNewSentiment}>
              <SelectTrigger className="h-9 w-32 text-xs bg-background">
                <SelectValue placeholder="Sentiment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="positive">Positive</SelectItem>
                <SelectItem value="neutral">Neutral</SelectItem>
                <SelectItem value="negative">Negative</SelectItem>
              </SelectContent>
            </Select>

            <Button
              type="submit"
              size="sm"
              disabled={!newLabel.trim()}
              className="gap-1.5 text-xs font-semibold h-9 px-4 shrink-0 bg-primary text-primary-foreground"
            >
              <Plus className="h-3.5 w-3.5" />
              Add
            </Button>
          </div>
        </form>
      </Card>

      {/* Bucket 4: Collapsible Standard Not-Connected Reference */}
      <div className="rounded-xl border border-border bg-muted/15 overflow-hidden">
        <button
          type="button"
          onClick={() => setShowStandardOutcomes(!showStandardOutcomes)}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-muted/30 transition-colors"
        >
          <div className="space-y-0.5">
            <div className="text-xs font-bold text-foreground">
              Standard call-attempt outcomes (always included)
            </div>
            <p className="text-[11px] text-muted-foreground">
              Non-connected attempts are platform-standard and mapped automatically to Not Connected.
            </p>
          </div>
          <div className="p-1 rounded-md text-muted-foreground">
            {showStandardOutcomes ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </div>
        </button>

        {showStandardOutcomes && (
          <div className="p-4 pt-0 border-t border-border/60">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-3">
              {outcomes.notConnected.map((st) => (
                <div
                  key={st.id}
                  className="rounded-lg border border-border/80 bg-background/60 p-2.5 text-xs flex items-center justify-between"
                >
                  <span className="font-medium text-foreground">{st.label}</span>
                  <Badge variant="secondary" className="text-[10px]">
                    Fixed
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* AI Regenerate Block at Bottom */}
      <AiRegenerateBox
        title="Want different outcomes? Describe what you need:"
        placeholder="e.g. We sell B2B software and need demo booked, pricing proposal sent, and competitor renewal call later."
        buttonLabel="Regenerate with AI"
        onRegenerate={handleAiRegenerate}
      />

      {/* Footer Actions */}
      <div className="pt-4 flex items-center justify-end border-t border-border">
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
