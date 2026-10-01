"use client";

import React from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { RotateCcw, Filter, Check } from "lucide-react";
import { DEFAULT_PIPELINE_STAGES } from "@/lib/tenant-config";

export function LeadsFilterDrawer({
  isOpen,
  onClose,
  filters,
  onFilterChange,
  onResetFilters,
  totalResultsCount,
}) {
  const activeFiltersCount = Object.values(filters).filter((val) => {
    if (Array.isArray(val)) return val.length > 0;
    return val !== "all" && val !== "" && val !== null && val !== undefined;
  }).length;

  const toggleArrayFilter = (key, item) => {
    const current = filters[key] || [];
    const next = current.includes(item)
      ? current.filter((x) => x !== item)
      : [...current, item];
    onFilterChange(key, next);
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md p-0 flex flex-col bg-background border-l border-border"
      >
        <SheetHeader className="p-4 border-b border-border bg-muted/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-primary" />
              <SheetTitle className="text-sm font-bold font-heading">
                Filter Leads
              </SheetTitle>
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="text-[10px] h-5 px-1.5 font-bold bg-primary/10 text-primary">
                  {activeFiltersCount} active
                </Badge>
              )}
            </div>
            {activeFiltersCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onResetFilters}
                className="h-7 text-xs text-muted-foreground hover:text-foreground gap-1"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Reset all</span>
              </Button>
            )}
          </div>
        </SheetHeader>

        {/* Scrollable Filter Form */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5 text-xs">
          {/* Pipeline Stage */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-foreground">
              Lead Stage (Pipeline)
            </Label>
            <div className="flex flex-wrap gap-1.5">
              {DEFAULT_PIPELINE_STAGES.map((stage) => {
                const isSelected = (filters.stages || []).includes(stage.name);
                return (
                  <button
                    key={stage.id}
                    onClick={() => toggleArrayFilter("stages", stage.name)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all flex items-center gap-1.5 ${
                      isSelected
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-card text-muted-foreground border-border hover:border-foreground/30"
                    }`}
                  >
                    {isSelected && <Check className="h-3 w-3" />}
                    <span>{stage.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Lead Owner */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-foreground">
              Lead Owner
            </Label>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { id: "all", label: "Any Owner" },
                { id: "unassigned", label: "Unassigned Only" },
                { id: "Aarav Sharma", label: "Aarav Sharma" },
                { id: "Rohan Varma", label: "Rohan Varma" },
                { id: "Sneha Roy", label: "Sneha Roy" },
              ].map((owner) => {
                const isSelected = filters.owner === owner.id;
                return (
                  <button
                    key={owner.id}
                    onClick={() => onFilterChange("owner", owner.id)}
                    className={`px-2.5 py-1.5 rounded-md text-xs font-medium border text-left transition-all ${
                      isSelected
                        ? "bg-primary/10 text-primary border-primary/40 font-semibold"
                        : "bg-card text-muted-foreground border-border hover:bg-secondary/40"
                    }`}
                  >
                    {owner.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Lead Source */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-foreground">
              Lead Source
            </Label>
            <div className="flex flex-wrap gap-1.5">
              {["IndiaMART", "Meta Ads", "Website", "Referral", "CSV Import"].map((src) => {
                const isSelected = (filters.sources || []).includes(src);
                return (
                  <button
                    key={src}
                    onClick={() => toggleArrayFilter("sources", src)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-all ${
                      isSelected
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-card text-muted-foreground border-border hover:bg-secondary/40"
                    }`}
                  >
                    {src}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-foreground">
              Priority Rating
            </Label>
            <div className="flex items-center gap-1.5">
              {[5, 4, 3, 2, 1].map((stars) => {
                const isSelected = filters.priority === stars;
                return (
                  <button
                    key={stars}
                    onClick={() => onFilterChange("priority", isSelected ? null : stars)}
                    className={`px-2.5 py-1 rounded border text-xs font-semibold transition-all ${
                      isSelected
                        ? "bg-amber-500 text-white border-amber-600 shadow-2xs"
                        : "bg-card text-muted-foreground border-border hover:bg-secondary/40"
                    }`}
                  >
                    {stars} ★
                  </button>
                );
              })}
            </div>
          </div>

          {/* City */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-foreground">City</Label>
            <div className="flex flex-wrap gap-1.5">
              {["Mumbai", "Delhi", "Bengaluru", "Pune", "Hyderabad", "Ahmedabad", "Jaipur", "Kolkata", "Chennai", "Chandigarh"].map((city) => {
                const isSelected = (filters.cities || []).includes(city);
                return (
                  <button
                    key={city}
                    onClick={() => toggleArrayFilter("cities", city)}
                    className={`px-2 py-0.5 rounded text-[11.5px] border transition-all ${
                      isSelected
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-card text-muted-foreground border-border hover:bg-secondary/40"
                    }`}
                  >
                    {city}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Awaiting First Touch */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-foreground">
              Awaiting 1st Touch
            </Label>
            <div className="flex items-center gap-2">
              {[
                { id: "all", label: "All" },
                { id: "YES", label: "YES (SLA Pending)" },
                { id: "NO", label: "NO (Worked)" },
              ].map((item) => {
                const isSelected = (filters.awaitingTouch || "all") === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onFilterChange("awaitingTouch", item.id)}
                    className={`px-3 py-1 rounded text-xs border font-medium transition-all ${
                      isSelected
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-card text-muted-foreground border-border hover:bg-secondary/40"
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <SheetFooter className="p-4 border-t border-border bg-muted/20 flex flex-row items-center justify-between sm:justify-between">
          <span className="text-xs text-muted-foreground font-mono">
            {totalResultsCount} records match
          </span>
          <SheetClose asChild>
            <Button size="sm" className="bg-primary text-primary-foreground text-xs font-semibold px-4">
              Apply Filters
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
