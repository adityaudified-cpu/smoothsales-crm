"use client";

import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Zap,
  Clock,
  FileText,
  SlidersHorizontal,
  Bot,
  UserCheck,
  CheckCircle2,
  Check,
  Sparkles,
  Layers,
  ChevronRight,
  Filter,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const AUTOMATION_TRIGGERS_DEF = [
  {
    id: "ar1",
    title: "Welcome Message on First Contact",
    trigger: "First Inbound Message",
    category: "onboarding",
    desc: "Greet leads automatically with an approved welcome message upon initial outreach.",
    template: "universal",
    timing: "Immediate (0s delay)",
    snippet: "Hi {{1}}! Welcome to SmoothSales CRM. Would you like to schedule a quick discovery demo?",
    default: true,
  },
  {
    id: "ar2",
    title: "Meeting / Demo Reminder",
    trigger: "Meeting Scheduled",
    category: "engagement",
    desc: "Send an automated confirmation and reminder 2 hours prior to scheduled meetings.",
    template: "starting",
    timing: "2 Hours Before Meeting",
    snippet: "Hi {{1}}, this is a friendly reminder for your session with our specialist on {{2}} at {{3}}.",
    default: true,
  },
  {
    id: "ar3",
    title: "Follow-up After 24h Silence",
    trigger: "No Reply 24h",
    category: "engagement",
    desc: "Send a polite follow-up nudge if a prospect does not reply within 24 hours.",
    template: "hello_world",
    timing: "24 Hours of Inactivity",
    snippet: "Hi {{1}}! Just following up on your enquiry. Reply YES or call us to connect with a specialist.",
    default: false,
  },
  {
    id: "ar4",
    title: "Quotation Sent Notification",
    trigger: "Quotation Sent",
    category: "onboarding",
    desc: "Notify customer immediately when a quote or pricing proposal is generated in CRM.",
    template: "jaspers_market_plain_text_v1",
    timing: "Immediate on Quote Generate",
    snippet: "Hi {{1}}, your quotation is ready! Please review and let us know if you have any questions.",
    default: true,
  },
  {
    id: "ar5",
    title: "AI Sales Agent Auto-Pilot",
    trigger: "AI Qualification Trigger",
    category: "ai",
    desc: "Let Priya (AI Sales Assistant) qualify budget, property requirements, and book site visits 24/7.",
    template: "universal",
    timing: "Conversational Real-time",
    snippet: "Priya qualifies lead requirements, budget range, and instantly proposes available demo slots.",
    default: true,
  },
];

export function AutomationTriggersTab({
  autoRules,
  setAutoRules,
  onOpenTriggerConfig,
  onSaveRules,
}) {
  const [selectedCategory, setSelectedCategory] = useState("all");

  const filtered =
    selectedCategory === "all"
      ? AUTOMATION_TRIGGERS_DEF
      : AUTOMATION_TRIGGERS_DEF.filter((t) => t.category === selectedCategory);

  const toggleTrigger = (id, checked) => {
    setAutoRules((prev) => ({
      ...prev,
      [id]: {
        ...(prev[id] || {}),
        enabled: checked,
      },
    }));
  };

  return (
    <div className="space-y-5">
      {/* Main Unified Automations Matrix (Zero Toy Cards!) */}
      <div className="rounded-xl border border-border/80 bg-card overflow-hidden shadow-2xs">
        {/* Header */}
        <div className="px-5 py-4 border-b border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-muted/15">
          <div>
            <h2 className="text-sm font-bold text-foreground tracking-tight">
              Event-Driven WhatsApp Automation Pipelines
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Lifecycle messaging triggers that execute based on CRM deal milestones, inbound events, and AI qualification.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={onSaveRules}
              className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shadow-2xs font-semibold rounded-lg"
            >
              <Check className="h-3.5 w-3.5" /> Save Automation Rules
            </Button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="px-5 py-2.5 border-b border-border/60 bg-muted/20 flex items-center justify-between gap-3 overflow-x-auto">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-medium text-muted-foreground mr-1 flex items-center gap-1">
              <Filter className="h-3 w-3" /> Filter:
            </span>
            {[
              { id: "all", label: "All Triggers (5)" },
              { id: "onboarding", label: "Onboarding & Quotes" },
              { id: "engagement", label: "Reminders & Nudges" },
              { id: "ai", label: "AI Auto-Pilot" },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={cn(
                  "px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors",
                  selectedCategory === cat.id
                    ? "bg-emerald-600 text-white font-semibold shadow-2xs"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <span className="text-[11px] text-muted-foreground hidden sm:inline">
            Showing {filtered.length} of {AUTOMATION_TRIGGERS_DEF.length} workflows
          </span>
        </div>

        {/* Unified Table View */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border/60 bg-muted/30 text-[10.5px] font-bold text-muted-foreground uppercase tracking-wider">
                <th className="py-3 px-5">Workflow &amp; Trigger Event</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Dispatch Timing</th>
                <th className="py-3 px-4">Meta Template</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-5 text-right">Configure</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filtered.map((trigger) => {
                const rule = autoRules[trigger.id] || {
                  enabled: trigger.default,
                  template: trigger.template,
                  timing: trigger.timing,
                };
                const isEnabled = rule.enabled;

                return (
                  <tr
                    key={trigger.id}
                    className={cn(
                      "hover:bg-muted/15 transition-colors",
                      !isEnabled && "opacity-65"
                    )}
                  >
                    {/* Workflow & Trigger Event */}
                    <td className="py-3.5 px-5">
                      <div className="space-y-0.5 max-w-md">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground text-xs">
                            {trigger.title}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-1">
                          {trigger.desc}
                        </p>
                        <div className="text-[10px] text-muted-foreground font-mono bg-muted/50 px-2 py-0.5 rounded border border-border/40 inline-block mt-1">
                          Trigger: {trigger.trigger}
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3.5 px-4">
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[9.5px] py-0 px-2 font-medium uppercase",
                          trigger.category === "ai"
                            ? "bg-violet-500/10 text-violet-600 border-violet-500/20 font-bold"
                            : trigger.category === "onboarding"
                            ? "bg-blue-500/10 text-blue-600 border-blue-500/20"
                            : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                        )}
                      >
                        {trigger.category === "ai"
                          ? "AI Auto-Pilot"
                          : trigger.category === "onboarding"
                          ? "Onboarding"
                          : "Engagement"}
                      </Badge>
                    </td>

                    {/* Dispatch Timing */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 text-foreground text-[11px] font-medium">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        {rule.timing || trigger.timing}
                      </div>
                    </td>

                    {/* Meta Template */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 font-mono text-[11px] text-foreground">
                        <FileText className="h-3 w-3 text-muted-foreground" />
                        <span className="truncate max-w-[140px] font-semibold">
                          {rule.template || trigger.template}
                        </span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={isEnabled}
                          onCheckedChange={(c) => toggleTrigger(trigger.id, c)}
                          className="data-[state=checked]:bg-emerald-600"
                        />
                        <span className="text-[11px] font-semibold text-muted-foreground min-w-[45px]">
                          {isEnabled ? "Active" : "Paused"}
                        </span>
                      </div>
                    </td>

                    {/* Configure Action */}
                    <td className="py-3.5 px-5 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-2.5 text-[11px] font-medium rounded-md gap-1 border-border hover:bg-muted/70"
                        onClick={() => onOpenTriggerConfig(trigger)}
                      >
                        <SlidersHorizontal className="h-3 w-3 text-muted-foreground" />
                        Configure
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-border/60 bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-muted-foreground text-[11px]">
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            <span>Templates must be marked APPROVED by Meta before they can be dispatched by live triggers.</span>
          </div>
          <Button
            size="sm"
            onClick={onSaveRules}
            className="h-7 px-3 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-md shadow-2xs font-semibold"
          >
            Save Automation Changes
          </Button>
        </div>
      </div>
    </div>
  );
}
