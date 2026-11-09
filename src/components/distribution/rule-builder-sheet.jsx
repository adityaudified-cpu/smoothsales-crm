"use client";

import React, { useEffect, useState } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import { RuleConditionRow, LogicToggle } from "./rule-condition-row";
import { allocationMethodOptions } from "@/lib/mock-data/distribution-rules";
import { MOCK_TEAMS } from "@/lib/mock-data/teams";
import { MOCK_USERS } from "@/lib/mock-data/users";
import { cn } from "@/lib/utils";

export function RuleBuilderSheet({
  open,
  onOpenChange,
  initialRule,
  defaultPriority = 1,
  onSaveRule,
}) {
  const [logic, setLogic] = useState("AND");

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
  } = useForm({
    defaultValues: {
      name: "",
      targetType: "team",
      targetId: "team-jaipur",
      allocationMethod: "round_robin",
      priority: defaultPriority,
      conditions: [{ field: "Source", operator: "equals", value: "" }],
    },
  });

  const { fields, append, remove, update } = useFieldArray({
    control,
    name: "conditions",
  });

  const targetType = watch("targetType");
  const allocationMethod = watch("allocationMethod");

  useEffect(() => {
    if (!open) return; // only reset when sheet opens
    if (initialRule) {
      reset({
        name: initialRule.name || "",
        targetType: initialRule.target?.type || "team",
        targetId: initialRule.target?.id || "team-jaipur",
        allocationMethod: initialRule.allocationMethod || "round_robin",
        priority: initialRule.priority || defaultPriority,
        conditions: initialRule.conditions?.length
          ? initialRule.conditions.map((c) => ({
              field: c.field || "Source",
              operator: "equals",
              value: c.value || "",
            }))
          : [{ field: "Source", operator: "equals", value: "" }],
      });
      setLogic(initialRule.logic || "AND");
    } else {
      reset({
        name: "",
        targetType: "team",
        targetId: "team-jaipur",
        allocationMethod: "round_robin",
        priority: defaultPriority,
        conditions: [{ field: "Source", operator: "equals", value: "" }],
      });
      setLogic("AND");
    }
  }, [open, initialRule, defaultPriority, reset]);

  const handleAddCondition = () => {
    if (fields.length < 5) {
      append({ field: "Source", operator: "equals", value: "" });
    }
  };

  const onSubmit = (data) => {
    let targetLabel = "Lead Pool";
    if (data.targetType === "team") {
      const team = MOCK_TEAMS.find((t) => t.id === data.targetId);
      targetLabel = team ? team.name : "Team";
    } else if (data.targetType === "user") {
      const user = MOCK_USERS.find((u) => u.id === data.targetId);
      targetLabel = user ? user.name : "User";
    }

    const ruleData = {
      id: initialRule ? initialRule.id : `rule-${Date.now()}`,
      name: data.name,
      active: initialRule ? initialRule.active : true,
      priority: Number(data.priority),
      conditions: data.conditions,
      logic,
      target: {
        type: data.targetType,
        id: data.targetType === "pool" ? null : data.targetId,
        label: targetLabel,
      },
      allocationMethod: data.allocationMethod,
    };

    onSaveRule(ruleData);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl p-0 flex flex-col h-full bg-card"
      >
        {/* Header */}
        <SheetHeader className="p-6 border-b border-border text-left">
          <SheetTitle className="font-heading font-extrabold text-lg text-foreground">
            {initialRule ? "Edit Distribution Rule" : "Create New Distribution Rule"}
          </SheetTitle>
          <SheetDescription className="text-xs text-muted-foreground">
            Define match conditions, target team or user, and lead allocation method.
          </SheetDescription>
        </SheetHeader>

        {/* Scrollable Form Body */}
        <form
          id="rule-builder-form"
          onSubmit={handleSubmit(onSubmit)}
          className="flex-1 overflow-y-auto p-6 space-y-6 text-xs"
        >
          {/* 1. Rule Name */}
          <div className="space-y-1.5">
            <Label htmlFor="rule-name" className="text-xs font-semibold text-foreground">
              Rule Name
            </Label>
            <Input
              id="rule-name"
              {...register("name", { required: true })}
              placeholder="e.g. Jaipur Meta Leads → Jaipur Team"
              className="h-8 text-xs bg-background"
            />
          </div>

          {/* 2. Condition Builder */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold text-foreground">
                Conditions (Hierarchy Rules)
              </Label>
              <span className="text-[11px] text-muted-foreground">
                {fields.length} of 5 layers used
              </span>
            </div>

            <div className="space-y-2">
              {fields.map((field, index) => (
                <React.Fragment key={field.id}>
                  <RuleConditionRow
                    index={index}
                    condition={field}
                    onChangeField={(val) =>
                      update(index, { ...field, field: val })
                    }
                    onChangeValue={(val) =>
                      update(index, { ...field, value: val })
                    }
                    onRemove={() => remove(index)}
                    canRemove={fields.length > 1}
                  />

                  {/* Segmented AND / OR Toggle between consecutive rows */}
                  {index < fields.length - 1 && (
                    <LogicToggle logic={logic} onToggle={setLogic} />
                  )}
                </React.Fragment>
              ))}
            </div>

            <div className="pt-1 flex items-center justify-between">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddCondition}
                disabled={fields.length >= 5}
                className="h-7 text-xs gap-1"
              >
                <Plus className="h-3 w-3" />
                <span>Add Condition</span>
              </Button>
              <span className="text-[11px] text-muted-foreground italic">
                Up to 5 conditions (matches the platform&apos;s 5-layer rule hierarchy)
              </span>
            </div>
          </div>

          {/* 3. Target */}
          <div className="space-y-3 pt-2">
            <Label className="text-xs font-semibold text-foreground">
              Routing Target
            </Label>
            <Controller
              name="targetType"
              control={control}
              render={({ field }) => (
                <RadioGroup
                  value={field.value}
                  onValueChange={field.onChange}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="team" id="target-team" />
                    <Label htmlFor="target-team" className="text-xs font-normal cursor-pointer">
                      Team
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="user" id="target-user" />
                    <Label htmlFor="target-user" className="text-xs font-normal cursor-pointer">
                      Specific User
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="pool" id="target-pool" />
                    <Label htmlFor="target-pool" className="text-xs font-normal cursor-pointer">
                      Lead Pool
                    </Label>
                  </div>
                </RadioGroup>
              )}
            />

            {/* Target Select Dropdown */}
            {targetType === "team" && (
              <div className="space-y-1 pt-1">
                <Label className="text-[11px] text-muted-foreground">Select Target Team</Label>
                <Controller
                  name="targetId"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="h-8 text-xs bg-background">
                        <SelectValue placeholder="Select Team" />
                      </SelectTrigger>
                      <SelectContent>
                        {MOCK_TEAMS.map((t) => (
                          <SelectItem key={t.id} value={t.id} className="text-xs">
                            {t.name} ({t.memberCount} members)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            )}

            {targetType === "user" && (
              <div className="space-y-1 pt-1">
                <Label className="text-[11px] text-muted-foreground">Select Specific User</Label>
                <Controller
                  name="targetId"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="h-8 text-xs bg-background">
                        <SelectValue placeholder="Select User" />
                      </SelectTrigger>
                      <SelectContent>
                        {MOCK_USERS.map((u) => (
                          <SelectItem key={u.id} value={u.id} className="text-xs">
                            {u.name} ({u.role})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            )}
          </div>

          {/* 4. Allocation Method */}
          <div className="space-y-2.5 pt-2">
            <Label className="text-xs font-semibold text-foreground">
              Allocation Method
            </Label>
            <div className="space-y-2">
              {allocationMethodOptions.map((opt) => {
                const isSelected = allocationMethod === opt.value;
                return (
                  <div
                    key={opt.value}
                    onClick={() => setValue("allocationMethod", opt.value)}
                    className={cn(
                      "p-3 rounded-md border text-xs cursor-pointer transition-colors space-y-0.5",
                      isSelected
                        ? "border-primary bg-accent"
                        : "border-border bg-card hover:bg-muted/40"
                    )}
                  >
                    <div className="font-medium text-foreground">{opt.label}</div>
                    <div className="text-xs text-muted-foreground leading-tight">
                      {opt.description}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 5. Priority */}
          <div className="space-y-1.5 pt-2">
            <Label htmlFor="rule-priority" className="text-xs font-semibold text-foreground">
              Priority Rank (1 = Evaluated First)
            </Label>
            <Input
              id="rule-priority"
              type="number"
              min={1}
              {...register("priority", { required: true })}
              className="h-8 text-xs bg-background w-32 font-mono"
            />
          </div>
        </form>

        {/* 6. Sticky Footer */}
        <div className="p-4 border-t border-border bg-card flex items-center justify-end gap-2 shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="h-8 text-xs"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="rule-builder-form"
            size="sm"
            className="h-8 text-xs bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
          >
            Save Rule
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
