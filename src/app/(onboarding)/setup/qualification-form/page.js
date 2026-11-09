"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  Plus,
  Trash2,
  ArrowRight,
  ArrowLeft,
  GripVertical,
  CheckSquare,
  Sparkles,
  Layers,
} from "lucide-react";
import { useOnboarding } from "@/lib/onboarding-context";
import { getQualificationFields } from "@/lib/mock-data/onboarding-qualification-fields";
import { AiRegenerateBox } from "@/components/onboarding/ai-regenerate-box";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function QualificationFormStepPage() {
  const router = useRouter();
  const {
    qualificationFields,
    businessDescription,
    vertical,
    updateOnboarding,
  } = useOnboarding();

  // Initialize fields using context or vertical-aware generator
  const [fields, setFields] = useState(() => {
    if (qualificationFields && qualificationFields.length > 0) {
      return qualificationFields;
    }
    return getQualificationFields(vertical || businessDescription);
  });

  // Edit field label
  const handleLabelChange = (id, newLabel) => {
    setFields(
      fields.map((f) => (f.id === id ? { ...f, label: newLabel } : f))
    );
  };

  // Edit field type
  const handleTypeChange = (id, newType) => {
    setFields(
      fields.map((f) =>
        f.id === id
          ? {
              ...f,
              type: newType,
              options: newType === "option" && f.options.length === 0 ? ["Option 1", "Option 2"] : f.options,
            }
          : f
      )
    );
  };

  // Edit comma-separated options for option-type fields
  const handleOptionsChange = (id, rawText) => {
    const splitOptions = rawText.split(",").map((o) => o.trim());
    setFields(
      fields.map((f) => (f.id === id ? { ...f, options: splitOptions } : f))
    );
  };

  // Toggle required
  const handleToggleRequired = (id) => {
    setFields(
      fields.map((f) => (f.id === id ? { ...f, required: !f.required } : f))
    );
  };

  // Delete field
  const handleDeleteField = (id) => {
    setFields(fields.filter((f) => f.id !== id));
  };

  // Add new blank field
  const handleAddField = () => {
    const newField = {
      id: `qf_custom_${Date.now()}`,
      label: "New Qualification Question",
      type: "text",
      options: [],
      required: false,
    };
    setFields([...fields, newField]);
  };

  // AI Regenerate fields
  const handleAiRegenerate = (customPrompt) => {
    // Tailor based on custom prompt keyword
    const refreshed = getQualificationFields(customPrompt || businessDescription);
    // Add one tailored custom item based on prompt
    if (customPrompt.trim()) {
      refreshed.push({
        id: `qf_ai_${Date.now()}`,
        label: `Client Preference (${customPrompt.slice(0, 24)}...)`,
        type: "option",
        options: ["Priority High", "Standard", "Flexible"],
        required: true,
      });
    }
    setFields(refreshed);
  };

  const handleSaveAndContinue = () => {
    updateOnboarding({ qualificationFields: fields });
    router.push("/setup/deal-stages");
  };

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
          <FileText className="h-3.5 w-3.5" />
          <span>Step 3 of 7</span>
        </div>
        <h1 className="font-heading text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
          Qualification Form
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          When a lead is marked Qualified, this form appears to capture important details. These fields are AI-generated based on your business — edit as needed.
        </p>
      </div>

      {/* C5 Spec: AI Regenerate Box at the TOP for this step */}
      <AiRegenerateBox
        title="Describe what your salespeople ask when a lead is interested, and AI will refine the form:"
        placeholder="e.g. Ask for their square footage, interior style preference (Modern vs Traditional), move-in date, and whether they need financing."
        buttonLabel="Regenerate Form with AI"
        onRegenerate={handleAiRegenerate}
      />

      {/* Fields List */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-foreground font-heading flex items-center gap-2">
            <span>Generated Form Fields</span>
            <Badge variant="outline" className="text-[11px] font-semibold text-primary border-primary/30">
              {fields.length} Fields
            </Badge>
          </h2>
          <span className="text-xs text-muted-foreground">
            Customizable for your sales reps
          </span>
        </div>

        <div className="space-y-3">
          {fields.map((field, idx) => (
            <Card
              key={field.id}
              className="p-4 rounded-xl border border-border bg-card shadow-2xs space-y-3 transition-colors hover:border-border/80"
            >
              {/* Field Top Row */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <GripVertical className="h-4 w-4 text-muted-foreground/40 cursor-grab shrink-0" />
                  <span className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground shrink-0">
                    {idx + 1}
                  </span>
                  <Input
                    value={field.label}
                    onChange={(e) => handleLabelChange(field.id, e.target.value)}
                    className="h-8 text-xs sm:text-sm font-semibold border-transparent hover:border-border focus:border-primary bg-transparent flex-1"
                  />
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  {/* Field Type Select */}
                  <Select
                    value={field.type}
                    onValueChange={(val) => handleTypeChange(field.id, val)}
                  >
                    <SelectTrigger className="h-8 w-24 text-[11px] font-medium bg-background">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="option">Option</SelectItem>
                      <SelectItem value="text">Text</SelectItem>
                      <SelectItem value="number">Number</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Required Toggle */}
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground pl-1">
                    <Checkbox
                      id={`req-${field.id}`}
                      checked={field.required}
                      onCheckedChange={() => handleToggleRequired(field.id)}
                      className="data-[state=checked]:bg-primary"
                    />
                    <label
                      htmlFor={`req-${field.id}`}
                      className="text-[11px] font-medium text-muted-foreground cursor-pointer select-none"
                    >
                      Required
                    </label>
                  </div>

                  {/* Delete */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteField(field.id)}
                    className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              {/* If option type, render editable comma-separated options */}
              {field.type === "option" && (
                <div className="pl-10 pr-2 pt-1">
                  <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                    Choices (comma separated):
                  </div>
                  <Input
                    value={field.options.join(", ")}
                    onChange={(e) => handleOptionsChange(field.id, e.target.value)}
                    placeholder="e.g. Budget A, Budget B, Budget C"
                    className="h-7 text-xs bg-muted/20 border-border/70"
                  />
                </div>
              )}
            </Card>
          ))}
        </div>

        {/* Add custom field button */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddField}
          className="gap-2 text-xs font-semibold text-primary border-primary/30 hover:bg-primary/5 w-full py-2.5"
        >
          <Plus className="h-4 w-4" />
          Add custom qualification field
        </Button>
      </div>

      {/* Footer Navigation */}
      <div className="pt-4 flex items-center justify-between border-t border-border">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/setup/visit-outcomes")}
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
