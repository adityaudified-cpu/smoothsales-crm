"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2 } from "lucide-react";
import { conditionFieldOptions } from "@/lib/mock-data/distribution-rules";

export function RuleConditionRow({
  index,
  condition,
  onChangeField,
  onChangeValue,
  onRemove,
  canRemove,
}) {
  /* operator is fixed to equals in this pass */
  return (
    <div className="flex items-center gap-2">
      {/* Field Selector */}
      <div className="w-40 shrink-0">
        <Select
          value={condition.field || "Source"}
          onValueChange={(val) => onChangeField(val)}
        >
          <SelectTrigger className="h-8 text-xs bg-background">
            <SelectValue placeholder="Select Field" />
          </SelectTrigger>
          <SelectContent>
            {conditionFieldOptions.map((opt) => (
              <SelectItem key={opt} value={opt} className="text-xs">
                {opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Fixed Operator Label */}
      <span className="text-xs text-muted-foreground font-mono px-1 shrink-0 select-none">
        equals
      </span>

      {/* Value Input */}
      <Input
        value={condition.value || ""}
        onChange={(e) => onChangeValue(e.target.value)}
        placeholder="Enter criteria value..."
        className="h-8 text-xs bg-background flex-1"
      />

      {/* Trash button */}
      {canRemove && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onRemove}
          className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
}

export function LogicToggle({ logic, onToggle }) {
  return (
    <div className="flex items-center justify-center my-2">
      <div className="inline-flex rounded-md p-0.5 bg-muted border border-border">
        <button
          type="button"
          onClick={() => onToggle("AND")}
          className={`px-2.5 py-0.5 text-[11px] font-semibold rounded transition-colors ${
            logic === "AND"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          AND
        </button>
        <button
          type="button"
          onClick={() => onToggle("OR")}
          className={`px-2.5 py-0.5 text-[11px] font-semibold rounded transition-colors ${
            logic === "OR"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          OR
        </button>
      </div>
    </div>
  );
}
