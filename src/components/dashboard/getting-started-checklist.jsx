"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle2,
  Circle,
  FileSpreadsheet,
  Radio,
  Users,
  PlayCircle,
  X,
  Sparkles,
  ArrowRight,
  PartyPopper,
} from "lucide-react";
import { toast } from "sonner";

export function GettingStartedChecklist() {
  const [isDismissed, setIsDismissed] = useState(false);
  const [items, setItems] = useState([
    {
      id: "import_data",
      label: "Import sample or historical lead database (CSV / Excel)",
      completed: true,
      href: "/leads",
      icon: FileSpreadsheet,
    },
    {
      id: "connect_channel",
      label: "Connect first inbound channel endpoint (Meta Ads or Webhook)",
      completed: true,
      href: "/channels",
      icon: Radio,
    },
    {
      id: "create_team",
      label: "Invite sales telecallers and assign round-robin teams",
      completed: false,
      href: "/teams",
      icon: Users,
    },
    {
      id: "training_demo",
      label: "Simulate a live test lead and complete a call disposition",
      completed: false,
      href: "/leads/lead_101",
      icon: PlayCircle,
    },
  ]);

  if (isDismissed) return null;

  const completedCount = items.filter((i) => i.completed).length;
  const percentage = Math.round((completedCount / items.length) * 100);
  const isAllComplete = completedCount === items.length;

  const handleToggleItem = (id) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const nextState = !item.completed;
        if (nextState) {
          toast.success(`Completed: ${item.label}`);
        }
        return { ...item, completed: nextState };
      })
    );
  };

  return (
    <Card className="p-5 bg-card border border-border shadow-xs rounded-lg space-y-4">
      {/* Header with Title & Dismiss */}
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="font-heading font-extrabold text-sm text-foreground">
              Getting Started Checklist
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary font-mono">
              Setup Guide
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Complete workspace foundations to enable automated lead ingestion and team attribution.
          </p>
        </div>

        {/* Dismiss Button: available anytime, or highlighted when complete */}
        <button
          type="button"
          onClick={() => {
            setIsDismissed(true);
            toast.info("Checklist minimized. Access anytime in Settings.");
          }}
          className="text-muted-foreground hover:text-foreground p-1 rounded transition-colors"
          aria-label="Dismiss checklist"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Progress Bar & Status */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-foreground">
            {completedCount} of {items.length} tasks complete
          </span>
          <span className="font-mono text-muted-foreground font-bold">
            {percentage}%
          </span>
        </div>
        <Progress value={percentage} className="h-2 rounded-full bg-muted" />
      </div>

      {/* 4 Checklist Items */}
      <div className="divide-y divide-border/60 text-xs pt-1">
        {items.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.id}
              className="py-2.5 flex items-center justify-between gap-3 first:pt-0 last:pb-0 hover:bg-muted/20 px-1.5 rounded transition-colors"
            >
              <button
                type="button"
                onClick={() => handleToggleItem(item.id)}
                className="flex items-center gap-2.5 text-left group flex-1"
              >
                {item.completed ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                ) : (
                  <Circle className="h-4 w-4 text-muted-foreground/60 group-hover:text-primary shrink-0 transition-colors" />
                )}

                <span
                  className={
                    item.completed
                      ? "text-muted-foreground line-through decoration-muted-foreground/60"
                      : "text-foreground font-medium"
                  }
                >
                  {item.label}
                </span>
              </button>

              <Link href={item.href} className="shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-[11px] text-muted-foreground hover:text-foreground gap-1"
                >
                  <span>Open</span>
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>
          );
        })}
      </div>

      {/* Complete State Banner */}
      {isAllComplete && (
        <div className="pt-2 flex items-center justify-between bg-emerald-500/10 border border-emerald-300 dark:border-emerald-800 p-2.5 rounded text-xs text-emerald-700 dark:text-emerald-300">
          <div className="flex items-center gap-2">
            <PartyPopper className="h-4 w-4 text-emerald-600" />
            <span className="font-semibold">
              All checklist items complete! Workspace ready for full production.
            </span>
          </div>
          <Button
            size="sm"
            onClick={() => setIsDismissed(true)}
            className="h-6 text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            Dismiss Checklist
          </Button>
        </div>
      )}
    </Card>
  );
}
