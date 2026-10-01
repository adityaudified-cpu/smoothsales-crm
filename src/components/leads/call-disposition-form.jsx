"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  MessageCircle,
  MessageSquare,
  Mail,
  CalendarIcon,
  CheckCircle2,
} from "lucide-react";
import { CALL_OUTCOMES } from "@/lib/mock-data/leads";
import { cn } from "@/lib/utils";

export function CallDispositionForm({ lead, onSave }) {
  const [selectedOutcome, setSelectedOutcome] = useState("Interested");
  const [quickFollowup, setQuickFollowup] = useState("Tomorrow");
  const [customDate, setCustomDate] = useState(null);
  const [clientType, setClientType] = useState("Client");
  const [selectedServices, setSelectedServices] = useState(["Full Home"]);
  const [savedNotice, setSavedNotice] = useState(false);

  const { register, handleSubmit, reset } = useForm();

  const servicesList = ["Full Home", "Modular Kitchen", "Living Room", "Turnkey"];

  const toggleService = (srv) => {
    setSelectedServices((prev) =>
      prev.includes(srv) ? prev.filter((s) => s !== srv) : [...prev, srv]
    );
  };

  const onSubmit = (formData) => {
    if (onSave) {
      onSave({
        outcome: selectedOutcome,
        ...formData,
        quickFollowup,
        customDate,
        clientType,
        selectedServices,
      });
    }
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  const isQuickScheduleOutcome = [
    "RNR",
    "Busy",
    "Cut the Call",
    "Not Reachable",
    "Switched Off",
    "Call Later",
  ].includes(selectedOutcome);

  return (
    <Card className="p-4 bg-card border border-border shadow-none rounded-md space-y-4">
      <div className="pb-2 border-b border-border flex items-center justify-between">
        <h3 className="font-heading font-extrabold text-sm text-foreground">
          Log Call Disposition
        </h3>
        {savedNotice && (
          <span className="flex items-center gap-1 text-xs text-success font-medium">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Saved
          </span>
        )}
      </div>

      {/* Horizontally scrollable outcome row */}
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground font-semibold">
          Call Outcome
        </Label>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-none">
          {CALL_OUTCOMES.map((outcome) => {
            const isSelected = selectedOutcome === outcome;
            return (
              <Button
                key={outcome}
                type="button"
                size="sm"
                variant={isSelected ? "default" : "outline"}
                onClick={() => setSelectedOutcome(outcome)}
                className={cn(
                  "h-7 text-xs px-2.5 rounded-full shrink-0 font-medium transition-colors",
                  isSelected
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {outcome}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Dynamic Sections Based on Selected Outcome */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5 text-xs">
        {/* Section 1: Quick follow-up scheduling */}
        {isQuickScheduleOutcome && (
          <div className="space-y-2 pt-1 border-t border-border/60">
            <Label className="text-xs text-muted-foreground font-semibold">
              Schedule Quick Follow-up
            </Label>
            <div className="flex flex-wrap gap-1.5">
              {["In 2 Hours", "In 4 Hours", "Tomorrow", "In 2 Days", "Next Week"].map(
                (p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setQuickFollowup(p)}
                    className={cn(
                      "px-2.5 py-1 rounded text-xs border transition-colors",
                      quickFollowup === p
                        ? "bg-accent text-accent-foreground font-semibold border-primary/40"
                        : "bg-muted/40 text-muted-foreground border-border hover:bg-muted"
                    )}
                  >
                    {p}
                  </button>
                )
              )}

              {/* Custom Date Popover */}
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className={cn(
                      "px-2.5 py-1 rounded text-xs border flex items-center gap-1 transition-colors",
                      customDate
                        ? "bg-accent text-accent-foreground font-semibold border-primary/40"
                        : "bg-muted/40 text-muted-foreground border-border hover:bg-muted"
                    )}
                  >
                    <CalendarIcon className="h-3 w-3" />
                    <span>{customDate ? customDate.toLocaleDateString() : "Custom Date"}</span>
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={customDate}
                    onSelect={(d) => {
                      setCustomDate(d);
                      setQuickFollowup("Custom");
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-1 pt-1">
              <Label className="text-xs text-muted-foreground">Notes</Label>
              <Textarea
                {...register("notes")}
                placeholder="Ringing no response / requested callback..."
                className="text-xs h-16 resize-none bg-background"
              />
            </div>
          </div>
        )}

        {/* Section 2: Invalid */}
        {selectedOutcome === "Invalid" && (
          <div className="space-y-2 pt-1 border-t border-border/60">
            <div className="p-2 rounded bg-destructive/10 text-destructive text-[11px] font-medium">
              Note: Logging &quot;Invalid&quot; will automatically mark this lead as Junk.
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Invalid Reason</Label>
              <Input
                {...register("invalidReason")}
                placeholder="Wrong number, spam bot, out of service..."
                className="h-8 text-xs bg-background"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Note</Label>
              <Textarea
                {...register("notes")}
                placeholder="Additional audit note..."
                className="text-xs h-16 resize-none bg-background"
              />
            </div>
          </div>
        )}

        {/* Section 3: Interested -> Inline Mini "Create Deal" */}
        {selectedOutcome === "Interested" && (
          <div className="space-y-3 pt-1 border-t border-border/60">
            <div className="font-semibold text-foreground text-xs">
              Inline Opportunity / Create Deal
            </div>

            {/* Client Type Radio */}
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">Client Type</Label>
              <div className="flex gap-2">
                {["Client", "Student"].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setClientType(type)}
                    className={cn(
                      "px-3 py-1 rounded text-xs border font-medium",
                      clientType === type
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-muted/30 text-muted-foreground border-border hover:bg-muted"
                    )}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Services Chips */}
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">Services Interested</Label>
              <div className="flex flex-wrap gap-1.5">
                {servicesList.map((srv) => (
                  <button
                    key={srv}
                    type="button"
                    onClick={() => toggleService(srv)}
                    className={cn(
                      "px-2 py-0.5 rounded text-[11px] border font-medium transition-colors",
                      selectedServices.includes(srv)
                        ? "bg-accent text-accent-foreground border-primary/40"
                        : "bg-muted/30 text-muted-foreground border-border hover:bg-muted"
                    )}
                  >
                    {srv}
                  </button>
                ))}
              </div>
            </div>

            {/* Deal Value */}
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">
                Estimated Deal Value (₹ INR)
              </Label>
              <Input
                type="number"
                defaultValue={lead?.dealValueINR || 350000}
                {...register("dealValue")}
                className="h-8 text-xs bg-background font-mono tabular-nums"
              />
            </div>

            {/* Next Follow-up Date */}
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">Next Follow-up Date</Label>
              <Input
                type="date"
                defaultValue="2026-03-12"
                {...register("followupDate")}
                className="h-8 text-xs bg-background"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">Discussion Notes</Label>
              <Textarea
                {...register("notes")}
                placeholder="Key requirements, budget flexibility, timeline..."
                className="text-xs h-14 resize-none bg-background"
              />
            </div>
          </div>
        )}

        {/* Section 4: Interested for Future */}
        {selectedOutcome === "Interested for Future" && (
          <div className="space-y-2 pt-1 border-t border-border/60">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Future Callback Date</Label>
              <Input
                type="date"
                defaultValue="2026-04-01"
                {...register("futureDate")}
                className="h-8 text-xs bg-background"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Note</Label>
              <Textarea
                {...register("notes")}
                placeholder="Reason for future deferral (e.g. possession in April)..."
                className="text-xs h-16 resize-none bg-background"
              />
            </div>
          </div>
        )}

        {/* Section 5: Not Interested */}
        {selectedOutcome === "Not Interested" && (
          <div className="space-y-2 pt-1 border-t border-border/60">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Disinterest Reason</Label>
              <Select defaultValue="Budget">
                <SelectTrigger className="h-8 text-xs bg-background">
                  <SelectValue placeholder="Select Reason" />
                </SelectTrigger>
                <SelectContent>
                  {["Budget", "Competitor", "Timing", "Already Purchased", "Other"].map(
                    (opt) => (
                      <SelectItem key={opt} value={opt} className="text-xs">
                        {opt}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Note</Label>
              <Textarea
                {...register("notes")}
                placeholder="Competitor chosen or objection details..."
                className="text-xs h-16 resize-none bg-background"
              />
            </div>
          </div>
        )}

        {/* Section 6: Followed Up */}
        {selectedOutcome === "Followed Up" && (
          <div className="space-y-2 pt-1 border-t border-border/60">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Follow-up Summary Note</Label>
              <Textarea
                {...register("notes")}
                placeholder="Summarize discussion points and next milestones..."
                className="text-xs h-20 resize-none bg-background"
              />
            </div>
          </div>
        )}

        {/* Bottom "Send via" Row */}
        <div className="pt-2 border-t border-border flex items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="outline"
              size="icon"
              title="Send WhatsApp"
              className="h-7 w-7 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 border-border"
            >
              <MessageCircle className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              title="Send SMS"
              className="h-7 w-7 text-blue-700 hover:bg-blue-50 hover:text-blue-800 border-border"
            >
              <MessageSquare className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              title="Send Email"
              className="h-7 w-7 text-muted-foreground hover:bg-muted border-border"
            >
              <Mail className="h-3.5 w-3.5" />
            </Button>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 text-[11px] text-primary hover:text-primary hover:bg-primary/5"
          >
            Send Template
          </Button>
        </div>

        {/* Full-width primary Save button */}
        <Button
          type="submit"
          className="w-full h-8 text-xs bg-primary text-primary-foreground hover:bg-primary/90 font-medium mt-1"
        >
          Save
        </Button>
      </form>
    </Card>
  );
}
