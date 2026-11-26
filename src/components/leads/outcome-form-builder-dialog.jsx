"use client";

import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
import { Plus, Trash2, ArrowUp, ArrowDown, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { callsApi } from "@/lib/api/customers";

const FIELD_TYPES = [
  { value: "text", label: "Text Input" },
  { value: "number", label: "Number" },
  { value: "pills", label: "Choice Pills" },
  { value: "select", label: "Dropdown Select" },
  { value: "date", label: "Date Picker" },
  { value: "textarea", label: "Long Text" },
];

function slugKey(label) {
  return (
    String(label || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "") || `field_${Date.now()}`
  );
}

export function OutcomeFormBuilderDialog({
  open,
  onOpenChange,
  outcomeConfig,
  onSaved,
}) {
  const [fields, setFields] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open && outcomeConfig) {
      const existing = Array.isArray(outcomeConfig.formFields) ? outcomeConfig.formFields : [];
      setFields(
        existing.map((f, idx) => ({
          id: f.id || `fld_${idx}_${Date.now()}`,
          key: f.key || slugKey(f.label),
          label: f.label || "",
          type: f.type || "text",
          optionsText: Array.isArray(f.options) ? f.options.join(", ") : "",
          placeholder: f.placeholder || f.label || "",
          required: Boolean(f.required),
        }))
      );
    }
  }, [open, outcomeConfig]);

  const handleAddField = () => {
    setFields((prev) => [
      ...prev,
      {
        id: `fld_${Date.now()}`,
        key: `custom_field_${prev.length + 1}`,
        label: "",
        type: "text",
        optionsText: "",
        placeholder: "",
        required: false,
      },
    ]);
  };

  const handleUpdate = (id, patch) => {
    setFields((prev) =>
      prev.map((f) => {
        if (f.id !== id) return f;
        const next = { ...f, ...patch };
        if ("label" in patch && (!f.key || f.key.startsWith("custom_field_"))) {
          next.key = slugKey(patch.label);
        }
        return next;
      })
    );
  };

  const handleMove = (index, dir) => {
    const target = index + dir;
    if (target < 0 || target >= fields.length) return;
    const copy = [...fields];
    const [item] = copy.splice(index, 1);
    copy.splice(target, 0, item);
    setFields(copy);
  };

  const handleSave = async () => {
    if (!outcomeConfig?.outcomeCode) return;
    const cleaned = fields
      .filter((f) => f.label.trim())
      .map((f) => ({
        id: f.id,
        key: f.key ? slugKey(f.key) : slugKey(f.label),
        label: f.label.trim(),
        type: f.type || "text",
        options:
          f.type === "pills" || f.type === "select"
            ? f.optionsText
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean)
            : [],
        placeholder: f.placeholder?.trim() || f.label.trim(),
        required: Boolean(f.required),
      }));

    setIsSaving(true);
    try {
      const updated = await callsApi.saveOutcomeForm(outcomeConfig.outcomeCode, {
        formFields: cleaned,
      });
      toast.success(`Saved custom form for "${outcomeConfig.label}"`);
      if (onSaved) onSaved(updated);
      onOpenChange(false);
    } catch (err) {
      toast.error("Could not save form", { description: err?.message });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-base font-bold flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span>Custom Form for &ldquo;{outcomeConfig?.label}&rdquo;</span>
          </DialogTitle>
          <DialogDescription className="text-xs">
            Configure structured fields that appear automatically whenever a rep selects this call outcome.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-3 py-2 pr-1">
          {fields.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-6 text-center space-y-2 bg-muted/20">
              <p className="text-xs text-muted-foreground">
                No structured fields configured for this outcome yet.
              </p>
              <Button type="button" size="sm" variant="outline" onClick={handleAddField} className="h-8 text-xs gap-1.5">
                <Plus className="h-3.5 w-3.5" />
                Add First Field
              </Button>
            </div>
          ) : (
            fields.map((field, index) => (
              <div key={field.id} className="rounded-lg border border-border bg-card p-3 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-semibold text-muted-foreground">
                    Field #{index + 1}
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      disabled={index === 0}
                      onClick={() => handleMove(index, -1)}
                    >
                      <ArrowUp className="h-3 w-3" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      disabled={index === fields.length - 1}
                      onClick={() => handleMove(index, 1)}
                    >
                      <ArrowDown className="h-3 w-3" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-destructive hover:text-destructive"
                      onClick={() => setFields((prev) => prev.filter((f) => f.id !== field.id))}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground">Field Label</Label>
                    <Input
                      value={field.label}
                      onChange={(e) => handleUpdate(field.id, { label: e.target.value })}
                      placeholder="e.g. Site Visit Date, Budget, Requirement"
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground">Input Type</Label>
                    <Select
                      value={field.type}
                      onValueChange={(val) => handleUpdate(field.id, { type: val })}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FIELD_TYPES.map((t) => (
                          <SelectItem key={t.value} value={t.value} className="text-xs">
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {(field.type === "pills" || field.type === "select") && (
                  <div className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground">
                      Options (comma separated)
                    </Label>
                    <Input
                      value={field.optionsText}
                      onChange={(e) => handleUpdate(field.id, { optionsText: e.target.value })}
                      placeholder="Option 1, Option 2, Option 3"
                      className="h-8 text-xs"
                    />
                  </div>
                )}

                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={field.required}
                      onCheckedChange={(checked) => handleUpdate(field.id, { required: checked })}
                      id={`req_${field.id}`}
                    />
                    <Label htmlFor={`req_${field.id}`} className="text-[11px] text-muted-foreground cursor-pointer">
                      Required field
                    </Label>
                  </div>
                </div>
              </div>
            ))
          )}

          {fields.length > 0 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddField}
              className="w-full h-8 text-xs gap-1.5 border-dashed"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Another Field
            </Button>
          )}
        </div>

        <DialogFooter className="border-t border-border pt-3">
          <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)} className="h-8 text-xs">
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleSave}
            disabled={isSaving}
            className="h-8 text-xs bg-primary text-primary-foreground"
          >
            {isSaving && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
            Save Form
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
