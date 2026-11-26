"use client";

import React, { useEffect, useMemo, useState } from "react";
import * as SheetPrimitive from "@radix-ui/react-dialog";
import {
  ArrowRight,
  CalendarClock,
  Check,
  ChevronDown,
  Loader2,
  Phone,
  X,
} from "lucide-react";
import { format, addHours, addDays, startOfWeek, nextMonday, setHours, setMinutes } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { callsApi } from "@/lib/api/customers";
import { customerToLead } from "@/lib/api/mappers";
import { OutcomeFormBuilderDialog } from "./outcome-form-builder-dialog";

const DEFAULT_OUTCOMES = [
  {
    outcomeCode: "INTERESTED",
    connected: true,
    label: "Interested",
    tone: "green",
    leadAction: "CREATE_DEAL",
    sortOrder: 1,
    enabled: true,
    formFields: [
      {
        id: "fld_project_type",
        key: "project_type",
        label: "Interior Design Project Type",
        type: "pills",
        options: ["Residential", "Commercial", "Hospitality", "Other"],
        required: false,
      },
      { id: "fld_property_location", key: "property_location", label: "Property Location", type: "text", options: [], placeholder: "Property Location" },
      { id: "fld_spaces_to_design", key: "spaces_to_design", label: "Spaces To Design", type: "text", options: [], placeholder: "Spaces To Design" },
      { id: "fld_project_area_sqft", key: "project_area_sqft", label: "Project Area (Square Feet)", type: "number", options: [], placeholder: "Project Area (Square Feet)" },
      {
        id: "fld_preferred_design_style",
        key: "preferred_design_style",
        label: "Preferred Design Style",
        type: "select",
        options: ["Modern Contemporary", "Minimalist", "Luxury Neo-Classical", "Scandinavian", "Industrial", "Bohemian", "Traditional Indian", "Transitional"],
        placeholder: "Search Preferred Design Style",
      },
      { id: "fld_design_requirements", key: "design_requirements", label: "Interior Design Requirements", type: "text", options: [], placeholder: "Interior Design Requirements" },
      { id: "fld_estimated_budget", key: "estimated_budget", label: "Estimated Project Budget", type: "number", options: [], placeholder: "Estimated Project Budget" },
      {
        id: "fld_expected_project_start",
        key: "expected_project_start",
        label: "Expected Project Start",
        type: "pills",
        options: ["Within One Month", "One To Three Months", "Three To Six Months", "Over Six Months", "Undecided"],
      },
      { id: "fld_required_completion_date", key: "required_completion_date", label: "Required Completion Date", type: "date", options: [], placeholder: "Required Completion Date" },
      { id: "fld_decision_maker", key: "decision_maker", label: "Decision Maker", type: "text", options: [], placeholder: "Decision Maker" },
    ],
  },
  { outcomeCode: "MEETING_AGREED", connected: true, label: "Meeting Agreed", tone: "blue", leadAction: "KEEP_OPEN", sortOrder: 2, enabled: true, formFields: [] },
  { outcomeCode: "SEND_MORE_INFO", connected: true, label: "Send More Info", tone: "blue", leadAction: "KEEP_OPEN", sortOrder: 3, enabled: true, formFields: [] },
  { outcomeCode: "CALL_BACK_LATER", connected: true, label: "Call Back Later", tone: "blue", leadAction: "KEEP_OPEN", sortOrder: 4, enabled: true, formFields: [] },
  { outcomeCode: "NOT_INTERESTED", connected: true, label: "Not Interested", tone: "red", leadAction: "CLOSE_LEAD", sortOrder: 5, enabled: true, formFields: [] },
  { outcomeCode: "BUDGET_MISMATCH", connected: true, label: "Budget Mismatch", tone: "red", leadAction: "CLOSE_LEAD", sortOrder: 6, enabled: true, formFields: [] },
  { outcomeCode: "RNR", connected: false, label: "RNR", tone: "blue", leadAction: "KEEP_OPEN", sortOrder: 7, enabled: true, formFields: [] },
  { outcomeCode: "BUSY", connected: false, label: "Busy", tone: "blue", leadAction: "KEEP_OPEN", sortOrder: 8, enabled: true, formFields: [] },
  { outcomeCode: "CUT_THE_CALL", connected: false, label: "Cut the call", tone: "blue", leadAction: "KEEP_OPEN", sortOrder: 9, enabled: true, formFields: [] },
  { outcomeCode: "NOT_REACHABLE", connected: false, label: "Not Reachable", tone: "blue", leadAction: "KEEP_OPEN", sortOrder: 10, enabled: true, formFields: [] },
  { outcomeCode: "SWITCHED_OFF", connected: false, label: "Switched Off", tone: "blue", leadAction: "KEEP_OPEN", sortOrder: 11, enabled: true, formFields: [] },
  { outcomeCode: "INVALID", connected: false, label: "Invalid", tone: "red", leadAction: "CLOSE_LEAD", sortOrder: 12, enabled: true, formFields: [] },
  { outcomeCode: "MULTIPLE_RNR", connected: false, label: "Multiple RNR", tone: "red", leadAction: "CLOSE_LEAD", sortOrder: 13, enabled: true, formFields: [] },
];

const DEAL_STAGES = [
  { value: "NEEDS_ASSESSMENT", label: "Needs Assessment" },
  { value: "PROPOSAL_SENT", label: "Proposal Sent" },
  { value: "TERMS_DISCUSSION", label: "Terms Discussion" },
  { value: "DEAL_WON", label: "Deal Won" },
  { value: "DEAL_LOST", label: "Deal Lost" },
];

const FOLLOWUP_PRESETS = [
  { id: "IN_2_HOURS", label: "In 2 Hours" },
  { id: "TOMORROW", label: "Tomorrow" },
  { id: "IN_2_DAYS", label: "In 2 Days" },
  { id: "LATER_THIS_WEEK", label: "Later This Week" },
  { id: "NEXT_WEEK", label: "Next Week" },
  { id: "CUSTOM", label: "Choose Date Time" },
];

function computePresetDate(preset) {
  const now = new Date();
  switch (preset) {
    case "IN_2_HOURS":
      return addHours(now, 2);
    case "TOMORROW":
      return setMinutes(setHours(addDays(now, 1), 10), 0);
    case "IN_2_DAYS":
      return setMinutes(setHours(addDays(now, 2), 10), 0);
    case "LATER_THIS_WEEK": {
      const friday = addDays(startOfWeek(now, { weekStartsOn: 1 }), 4);
      const target = friday > now ? friday : addDays(now, 1);
      return setMinutes(setHours(target, 11), 0);
    }
    case "NEXT_WEEK":
      return setMinutes(setHours(nextMonday(now), 10), 0);
    default:
      return addHours(now, 2);
  }
}

export function LogCallOutcomeDrawer({
  open,
  onOpenChange,
  lead,
  callId = null,
  sourceLabel = "Web-initiated call",
  onSaved,
}) {
  const [configs, setConfigs] = useState(DEFAULT_OUTCOMES);
  const [connectedTab, setConnectedTab] = useState(true);
  const [selectedCode, setSelectedCode] = useState(null);
  const [dealStage, setDealStage] = useState("NEEDS_ASSESSMENT");
  const [notes, setNotes] = useState("");
  const [formData, setFormData] = useState({});
  const [followupPreset, setFollowupPreset] = useState("IN_2_HOURS");
  const [customDate, setCustomDate] = useState(() => format(addHours(new Date(), 2), "yyyy-MM-dd"));
  const [customTime, setCustomTime] = useState(() => format(addHours(new Date(), 2), "HH:mm"));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [builderOpen, setBuilderOpen] = useState(false);

  // Load workspace outcome configs once when opened
  useEffect(() => {
    if (!open) return;
    callsApi
      .getOutcomeConfigs()
      .then((list) => {
        if (Array.isArray(list) && list.length > 0) {
          setConfigs(list);
        }
      })
      .catch(() => {});
  }, [open]);

  // Reset form state when lead changes or drawer opens
  useEffect(() => {
    if (open) {
      setConnectedTab(true);
      setSelectedCode(null);
      setDealStage("NEEDS_ASSESSMENT");
      setNotes("");
      const prefilled = {};
      if (lead?.city) prefilled.property_location = lead.city;
      if (lead?.preferred_service) prefilled.design_requirements = lead.preferred_service;
      if (lead?.dealValueINR > 0) prefilled.estimated_budget = String(lead.dealValueINR);
      setFormData({ ...(lead?.custom_fields || {}), ...prefilled });
      setFollowupPreset("IN_2_HOURS");
      const inTwo = addHours(new Date(), 2);
      setCustomDate(format(inTwo, "yyyy-MM-dd"));
      setCustomTime(format(inTwo, "HH:mm"));
    }
  }, [open, lead?.id]);

  const visibleOutcomes = useMemo(
    () => configs.filter((c) => c.enabled !== false && Boolean(c.connected) === connectedTab),
    [configs, connectedTab]
  );

  const selectedOutcome = useMemo(
    () => configs.find((c) => c.outcomeCode === selectedCode) || null,
    [configs, selectedCode]
  );

  const computedFollowupAt = useMemo(() => {
    if (!selectedOutcome || selectedOutcome.leadAction !== "KEEP_OPEN") return null;
    if (followupPreset === "CUSTOM") {
      if (!customDate) return null;
      const d = new Date(`${customDate}T${customTime || "10:00"}:00`);
      return Number.isNaN(d.getTime()) ? null : d;
    }
    return computePresetDate(followupPreset);
  }, [selectedOutcome, followupPreset, customDate, customTime]);

  const handleReset = () => {
    setSelectedCode(null);
    setDealStage("NEEDS_ASSESSMENT");
    setNotes("");
    setFormData({});
    setFollowupPreset("IN_2_HOURS");
  };

  const handleSelectConnectedTab = (isConnected) => {
    setConnectedTab(isConnected);
    if (selectedOutcome && Boolean(selectedOutcome.connected) !== isConnected) {
      setSelectedCode(null);
    }
  };

  const handleFieldChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleDialAgain = () => {
    const phone = String(lead?.mobile_number || lead?.phone || "").replace(/[^\d+]/g, "");
    if (!phone) return toast.error("No phone number on this lead");
    window.location.href = `tel:${phone}`;
  };

  const handleSubmit = async () => {
    if (!lead?.id) return toast.error("No lead selected");
    if (!selectedOutcome) return toast.error("Select a call outcome first");

    const fields = Array.isArray(selectedOutcome.formFields) ? selectedOutcome.formFields : [];
    for (const f of fields) {
      if (f.required && !String(formData[f.key] ?? "").trim()) {
        toast.error(`Please fill "${f.label}"`);
        return;
      }
    }

    if (selectedOutcome.leadAction === "KEEP_OPEN" && !computedFollowupAt) {
      toast.error("Please select a valid follow-up date and time");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        customerId: lead.id,
        callId: callId || null,
        connected: Boolean(selectedOutcome.connected),
        outcome: selectedOutcome.outcomeCode,
        outcomeLabel: selectedOutcome.label,
        dealStage: selectedOutcome.leadAction === "CREATE_DEAL" ? dealStage : null,
        dealValue: formData.estimated_budget ? Number(String(formData.estimated_budget).replace(/[^0-9.]/g, "")) || null : null,
        notes: notes.trim() || null,
        followUpAt: computedFollowupAt ? computedFollowupAt.toISOString() : null,
        followUpPreset: selectedOutcome.leadAction === "KEEP_OPEN" ? followupPreset : null,
        formData: Object.keys(formData).length ? formData : null,
        createReminder: selectedOutcome.leadAction === "KEEP_OPEN",
        callType: "OUTBOUND",
      };

      const res = await callsApi.logOutcome(payload);
      const updatedLead = res?.customer ? customerToLead(res.customer) : null;

      window.dispatchEvent(
        new CustomEvent("smoothsales:lead-updated", {
          detail: {
            lead: updatedLead,
            result: res,
          },
        })
      );

      if (selectedOutcome.leadAction === "CREATE_DEAL") {
        toast.success("Deal created & call outcome logged", {
          description: `${lead.lead_name || lead.name} moved to ${DEAL_STAGES.find((s) => s.value === dealStage)?.label || "Deal"}`,
        });
      } else if (selectedOutcome.leadAction === "CLOSE_LEAD") {
        toast.success("Call logged & lead closed", {
          description: `${lead.lead_name || lead.name} marked as ${selectedOutcome.label}`,
        });
      } else {
        toast.success("Call logged & follow-up scheduled", {
          description: computedFollowupAt
            ? `Next follow-up: ${format(computedFollowupAt, "EEE, dd MMM · hh:mm a")}`
            : undefined,
        });
      }

      if (onSaved) onSaved(res, updatedLead);
      onOpenChange(false);
    } catch (err) {
      toast.error("Failed to save call outcome", { description: err?.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const leadName = lead?.lead_name || lead?.name || lead?.fullName || "Lead";
  const leadPhone = lead?.mobile_number || lead?.phone || "";
  const customFields = Array.isArray(selectedOutcome?.formFields) ? selectedOutcome.formFields : [];

  const ctaLabel = !selectedOutcome
    ? "Save"
    : selectedOutcome.leadAction === "CREATE_DEAL"
    ? "Save and create deal"
    : selectedOutcome.leadAction === "CLOSE_LEAD"
    ? "Save and close lead"
    : "Save and keep lead open";

  return (
    <>
      <SheetPrimitive.Root open={open} onOpenChange={onOpenChange}>
        <SheetPrimitive.Portal>
          <SheetPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[1px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
          <SheetPrimitive.Content
            className={cn(
              "fixed inset-y-0 right-0 z-50 flex h-full w-full flex-col bg-[#f5f6f9] dark:bg-background shadow-2xl border-l border-border",
              "sm:max-w-[540px] transition ease-in-out data-[state=closed]:duration-200 data-[state=open]:duration-300",
              "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right"
            )}
          >
            {/* Header */}
            <div className="bg-card border-b border-border px-5 py-4 flex items-start justify-between gap-3 shrink-0">
              <div className="min-w-0">
                <SheetPrimitive.Description className="text-[12px] font-medium text-muted-foreground leading-none">
                  Log call outcome
                </SheetPrimitive.Description>
                <SheetPrimitive.Title className="text-[16px] font-bold text-foreground mt-1 truncate">
                  {leadName}
                </SheetPrimitive.Title>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[11.5px] text-muted-foreground">{sourceLabel}</span>
                  {leadPhone && (
                    <>
                      <span className="text-muted-foreground/50">·</span>
                      <button
                        type="button"
                        onClick={handleDialAgain}
                        className="inline-flex items-center gap-1 text-[11px] font-mono text-primary hover:underline"
                        title="Trigger device dialer"
                      >
                        <Phone className="h-3 w-3" />
                        {leadPhone}
                      </button>
                    </>
                  )}
                </div>
              </div>
              <SheetPrimitive.Close
                aria-label="Close"
                className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <X className="h-4 w-4" />
              </SheetPrimitive.Close>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3.5">
              {/* Card 1: Select outcome */}
              <div className="bg-card border border-border/80 rounded-xl p-4 shadow-2xs space-y-3.5">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <h3 className="text-[14px] font-semibold text-foreground">Select outcome</h3>

                  {/* Connected / Not connected segmented pill */}
                  <div
                    role="tablist"
                    aria-label="Call connection status"
                    className="inline-flex items-center rounded-lg bg-slate-100 dark:bg-muted p-0.5 border border-border/60"
                  >
                    <button
                      type="button"
                      role="tab"
                      aria-selected={connectedTab}
                      onClick={() => handleSelectConnectedTab(true)}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition-all",
                        connectedTab
                          ? "bg-card text-foreground shadow-xs font-semibold"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <span className={cn("h-2 w-2 rounded-full", connectedTab ? "bg-emerald-500" : "bg-slate-400")} />
                      <span>Connected</span>
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={!connectedTab}
                      onClick={() => handleSelectConnectedTab(false)}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition-all",
                        !connectedTab
                          ? "bg-card text-foreground shadow-xs font-semibold"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <span className={cn("h-2 w-2 rounded-full", !connectedTab ? "bg-rose-500" : "bg-slate-400")} />
                      <span>Not connected</span>
                    </button>
                  </div>
                </div>

                {/* Outcome pills grouped cleanly */}
                <div className="flex flex-wrap gap-2">
                  {visibleOutcomes.map((item) => {
                    const isSelected = selectedCode === item.outcomeCode;
                    const tone = item.tone || "blue";

                    const pillStyle =
                      tone === "green"
                        ? isSelected
                          ? "bg-emerald-50/90 border-[1.5px] border-emerald-800 text-emerald-900 font-semibold dark:bg-emerald-950/50 dark:text-emerald-200 dark:border-emerald-400"
                          : "bg-emerald-50/70 border border-emerald-200/90 text-emerald-800 hover:bg-emerald-100/70 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800"
                        : tone === "red"
                        ? isSelected
                          ? "bg-rose-50/90 border-[1.5px] border-rose-900 text-rose-950 font-semibold dark:bg-rose-950/50 dark:text-rose-200 dark:border-rose-400"
                          : "bg-rose-50/70 border border-rose-200/90 text-rose-900 hover:bg-rose-100/70 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-800"
                        : isSelected
                        ? "bg-sky-50/90 border-[1.5px] border-slate-900 text-slate-900 font-semibold dark:bg-sky-950/50 dark:text-sky-100 dark:border-sky-400"
                        : "bg-sky-50/70 border border-sky-200/90 text-slate-800 hover:bg-sky-100/70 dark:bg-sky-950/30 dark:text-sky-200 dark:border-sky-800";

                    const dotColor =
                      tone === "green"
                        ? "bg-emerald-500"
                        : tone === "red"
                        ? "bg-rose-500"
                        : "bg-blue-600";

                    return (
                      <button
                        key={item.outcomeCode}
                        type="button"
                        onClick={() => setSelectedCode(item.outcomeCode)}
                        className={cn(
                          "inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[13px] transition-all",
                          pillStyle
                        )}
                      >
                        {isSelected && <Check className="h-3.5 w-3.5 stroke-[2.5]" />}
                        <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", dotColor)} />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Consequence banner */}
                {selectedOutcome && (
                  <div
                    className={cn(
                      "rounded-lg px-3.5 py-2.5 text-[12.5px] font-medium flex items-center gap-2",
                      selectedOutcome.leadAction === "CREATE_DEAL"
                        ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                        : selectedOutcome.leadAction === "CLOSE_LEAD"
                        ? "bg-rose-50 text-rose-900 dark:bg-rose-950/40 dark:text-rose-300"
                        : "bg-sky-50 text-sky-950 dark:bg-sky-950/40 dark:text-sky-200"
                    )}
                  >
                    <ArrowRight className="h-3.5 w-3.5 shrink-0" />
                    <span>
                      {selectedOutcome.leadAction === "CREATE_DEAL"
                        ? "A new deal will be created"
                        : selectedOutcome.leadAction === "CLOSE_LEAD"
                        ? "Lead will be closed"
                        : "Lead remains open"}
                    </span>
                  </div>
                )}
              </div>

              {/* Card 2: Select the current deal stage (only for Interested / CREATE_DEAL) */}
              {selectedOutcome?.leadAction === "CREATE_DEAL" && (
                <div className="bg-card border border-border/80 rounded-xl p-4 shadow-2xs space-y-3">
                  <h3 className="text-[14px] font-semibold text-foreground">
                    Select the current deal stage
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {DEAL_STAGES.map((stage) => {
                      const active = dealStage === stage.value;
                      return (
                        <button
                          key={stage.value}
                          type="button"
                          onClick={() => setDealStage(stage.value)}
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12.5px] font-medium transition-all",
                            active
                              ? "bg-[#2b3a9f] text-white shadow-xs font-semibold"
                              : "bg-slate-200/80 dark:bg-muted text-slate-800 dark:text-foreground hover:bg-slate-200"
                          )}
                        >
                          {active && <Check className="h-3.5 w-3.5 stroke-[2.5]" />}
                          <span>{stage.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Card 3: Outcome notes (shown once any outcome is selected) */}
              {selectedOutcome && (
                <div className="bg-card border border-border/80 rounded-xl p-4 shadow-2xs space-y-2.5">
                  <h3 className="text-[14px] font-semibold text-foreground">Outcome notes</h3>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add outcome note"
                    className="min-h-[82px] resize-none bg-slate-100/90 dark:bg-muted/50 border-0 border-b border-slate-500 rounded-t-md rounded-b-none px-3.5 py-3 text-[13px] placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:border-b-2 focus-visible:border-primary"
                  />
                </div>
              )}

              {/* Card 4: Dynamic Qualification / Custom Form OR "Capture more details here" */}
              {selectedOutcome && (
                customFields.length > 0 ? (
                  <div className="bg-card border border-border/80 rounded-xl p-4 shadow-2xs space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wide">
                        Qualification Details
                      </span>
                      <button
                        type="button"
                        onClick={() => setBuilderOpen(true)}
                        className="text-[12px] font-semibold text-[#2b3a9f] dark:text-primary hover:underline inline-flex items-center gap-1"
                      >
                        <span>Edit form</span>
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    </div>

                    {customFields.map((field) => {
                      const val = formData[field.key] ?? "";
                      if (field.type === "pills") {
                        return (
                          <div key={field.key} className="space-y-2">
                            <label className="block text-[12.5px] font-semibold text-foreground">
                              {field.label}
                              {field.required && <span className="text-rose-500 ml-0.5">*</span>}
                            </label>
                            <div className="flex flex-wrap gap-2">
                              {(field.options || []).map((opt) => {
                                const selected = val === opt;
                                return (
                                  <button
                                    key={opt}
                                    type="button"
                                    onClick={() => handleFieldChange(field.key, selected ? "" : opt)}
                                    className={cn(
                                      "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12.5px] font-medium transition-all",
                                      selected
                                        ? "bg-[#2b3a9f] text-white font-semibold"
                                        : "bg-slate-200/80 dark:bg-muted text-slate-800 dark:text-foreground hover:bg-slate-200"
                                    )}
                                  >
                                    {selected && <Check className="h-3 w-3 stroke-[2.5]" />}
                                    <span>{opt}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      }

                      if (field.type === "select") {
                        return (
                          <div key={field.key} className="space-y-1.5">
                            <label className="block text-[12.5px] font-semibold text-foreground">
                              {field.label}
                              {field.required && <span className="text-rose-500 ml-0.5">*</span>}
                            </label>
                            <Select value={val} onValueChange={(v) => handleFieldChange(field.key, v)}>
                              <SelectTrigger className="h-11 bg-transparent border-0 border-b border-slate-400 rounded-none px-1 text-[13px] focus:ring-0">
                                <SelectValue placeholder={field.placeholder || `Search ${field.label}`} />
                              </SelectTrigger>
                              <SelectContent>
                                {(field.options || []).map((opt) => (
                                  <SelectItem key={opt} value={opt} className="text-xs">
                                    {opt}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        );
                      }

                      if (field.type === "textarea") {
                        return (
                          <div key={field.key} className="space-y-1.5">
                            <Textarea
                              value={val}
                              onChange={(e) => handleFieldChange(field.key, e.target.value)}
                              placeholder={field.placeholder || field.label}
                              className="min-h-[68px] bg-slate-100/90 dark:bg-muted/50 border-0 border-b border-slate-400 rounded-t-md rounded-b-none px-3.5 py-2.5 text-[13px]"
                            />
                          </div>
                        );
                      }

                      return (
                        <div key={field.key} className="space-y-1">
                          {field.type === "date" && (
                            <label className="block text-[11px] font-medium text-muted-foreground">
                              {field.label}
                              {field.required && <span className="text-rose-500 ml-0.5">*</span>}
                            </label>
                          )}
                          <Input
                            type={field.type === "number" ? "number" : field.type === "date" ? "date" : "text"}
                            value={val}
                            onChange={(e) => handleFieldChange(field.key, e.target.value)}
                            placeholder={field.placeholder || field.label}
                            className="h-11 bg-slate-100/90 dark:bg-muted/50 border-0 border-b border-slate-400 rounded-t-md rounded-b-none px-3.5 text-[13px] placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:border-b-2 focus-visible:border-primary"
                          />
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="bg-card border border-border/80 rounded-xl p-4 shadow-2xs flex items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <h4 className="text-[13.5px] font-semibold text-foreground">
                        Capture more details here
                      </h4>
                      <p className="text-[12px] text-muted-foreground leading-snug">
                        Set up a custom form to collect structured information for this call outcome.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setBuilderOpen(true)}
                      className="shrink-0 inline-flex items-center gap-1 text-[12.5px] font-semibold text-[#2b3a9f] dark:text-primary hover:underline"
                    >
                      <span>Set up form</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )
              )}

              {/* Card 5: Follow-up again (only when leadAction === KEEP_OPEN) */}
              {selectedOutcome?.leadAction === "KEEP_OPEN" && (
                <div className="bg-card border border-border/80 rounded-xl p-4 shadow-2xs space-y-3">
                  <h3 className="text-[14px] font-semibold text-foreground">Follow-up again</h3>
                  <div className="flex flex-wrap gap-2">
                    {FOLLOWUP_PRESETS.map((preset) => {
                      const active = followupPreset === preset.id;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => setFollowupPreset(preset.id)}
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12.5px] font-medium transition-all",
                            active
                              ? "bg-[#2b3a9f] text-white shadow-xs font-semibold"
                              : "bg-slate-200/80 dark:bg-muted text-slate-800 dark:text-foreground hover:bg-slate-200"
                          )}
                        >
                          {active && <Check className="h-3.5 w-3.5 stroke-[2.5]" />}
                          <span>{preset.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {followupPreset === "CUSTOM" && (
                    <div className="grid grid-cols-2 gap-2.5 pt-1">
                      <div className="space-y-1">
                        <label className="text-[11px] font-medium text-muted-foreground">Date</label>
                        <Input
                          type="date"
                          value={customDate}
                          onChange={(e) => setCustomDate(e.target.value)}
                          className="h-9 text-xs bg-background"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-medium text-muted-foreground">Time</label>
                        <Input
                          type="time"
                          value={customTime}
                          onChange={(e) => setCustomTime(e.target.value)}
                          className="h-9 text-xs bg-background"
                        />
                      </div>
                    </div>
                  )}

                  {computedFollowupAt && (
                    <div className="flex items-center gap-1.5 text-[11.5px] text-muted-foreground pt-0.5">
                      <CalendarClock className="h-3.5 w-3.5 text-[#2b3a9f] dark:text-primary" />
                      <span>
                        Scheduled for{" "}
                        <strong className="text-foreground">
                          {format(computedFollowupAt, "EEE, dd MMM yyyy · hh:mm a")}
                        </strong>
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Sticky Footer */}
            <div className="bg-card border-t border-border px-5 py-3.5 flex items-center justify-between gap-3 shrink-0">
              <Button
                type="button"
                variant="outline"
                onClick={handleReset}
                disabled={isSubmitting}
                className="h-10 px-4 text-[13px] font-semibold rounded-lg"
              >
                Reset
              </Button>

              <Button
                type="button"
                onClick={handleSubmit}
                disabled={!selectedOutcome || isSubmitting}
                className={cn(
                  "h-10 px-5 text-[13px] font-semibold rounded-lg transition-all",
                  selectedOutcome
                    ? "bg-[#d81b60] hover:bg-[#c2185b] text-white shadow-sm"
                    : "bg-slate-200 text-slate-400 dark:bg-muted dark:text-muted-foreground"
                )}
              >
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {ctaLabel}
              </Button>
            </div>
          </SheetPrimitive.Content>
        </SheetPrimitive.Portal>
      </SheetPrimitive.Root>

      <OutcomeFormBuilderDialog
        open={builderOpen}
        onOpenChange={setBuilderOpen}
        outcomeConfig={selectedOutcome}
        onSaved={(updatedCfg) => {
          setConfigs((prev) =>
            prev.map((c) => (c.outcomeCode === updatedCfg.outcomeCode ? updatedCfg : c))
          );
        }}
      />
    </>
  );
}
