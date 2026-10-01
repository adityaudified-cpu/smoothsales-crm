"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Gift,
  X,
  Clock,
  CheckCircle2,
  Users,
  Send,
  PhoneCall,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

export function TrialRewardWidget() {
  const [isOpen, setIsOpen] = useState(true);

  if (!isOpen) return null;

  // Mock progress state for post-onboarding trial tenant
  const progress = {
    daysRemaining: 4,
    repsAdded: 3,
    targetReps: 3,
    invitesSent: 2,
    targetInvites: 3,
    callsLogged: 24,
    targetCalls: 100,
  };

  const callPercentage = Math.round(
    (progress.callsLogged / progress.targetCalls) * 100
  );

  return (
    <AnimatePresence>
      <motion.aside
        aria-label="Trial Reward Widget"
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="fixed bottom-6 right-6 w-84 z-40 rounded-2xl border border-purple-500/35 bg-card/95 backdrop-blur-md shadow-2xl shadow-purple-950/25 overflow-hidden text-foreground antialiased"
      >
        {/* Top Accent Gradient Bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-purple-600 via-indigo-500 to-primary" />

        <div className="p-4 space-y-3.5">
          {/* Header with pill and dismiss button */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/20 text-purple-600 dark:text-purple-300 border border-purple-500/30 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                <Gift className="h-3 w-3 text-purple-400" />
                Trial Reward
              </span>

              <span className="text-[11px] text-muted-foreground flex items-center gap-1 font-medium">
                <Clock className="h-3 w-3 text-amber-500" />
                <span>{progress.daysRemaining} days remaining</span>
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="h-6 w-6 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 flex items-center justify-center transition-colors"
              title="Dismiss reward widget"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Heading & Incentive description */}
          <div className="space-y-1">
            <h4 className="font-heading text-sm font-bold text-foreground flex items-center gap-1.5">
              <span>Earn 1 Free Admin Seat (1 Year)</span>
              <Sparkles className="h-3.5 w-3.5 text-amber-400 shrink-0" />
            </h4>
            <p className="text-[11px] text-muted-foreground leading-snug">
              Complete your 3 workspace milestones before your trial ends to qualify:
            </p>
          </div>

          {/* Call tracking progress bar */}
          <div className="space-y-1.5 rounded-lg border border-purple-500/20 bg-purple-950/15 p-2.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-semibold text-foreground flex items-center gap-1">
                <PhoneCall className="h-3 w-3 text-purple-400" />
                Call Milestones
              </span>
              <span className="font-mono text-purple-300 font-bold tabular-nums">
                {progress.callsLogged} / {progress.targetCalls}
              </span>
            </div>

            {/* Custom progress bar */}
            <div className="h-2 w-full rounded-full bg-purple-950/40 overflow-hidden border border-purple-500/20">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all duration-500"
                style={{ width: `${callPercentage}%` }}
              />
            </div>
          </div>

          {/* Checklist of 3 Sub-goals */}
          <div className="space-y-2 text-xs">
            {/* Goal 1: Reps Added */}
            <div className="flex items-center justify-between p-2 rounded-lg bg-muted/25 border border-border/60">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded bg-muted text-muted-foreground">
                  <Users className="h-3.5 w-3.5 text-primary" />
                </div>
                <span className="font-medium text-foreground text-[11px]">
                  Add 3 sales reps
                </span>
              </div>
              <div className="flex items-center gap-1 text-[11px] font-semibold">
                <span className="text-emerald-600 dark:text-emerald-400">
                  {progress.repsAdded}/{progress.targetReps}
                </span>
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              </div>
            </div>

            {/* Goal 2: Invites Sent */}
            <div className="flex items-center justify-between p-2 rounded-lg bg-muted/25 border border-border/60">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded bg-muted text-muted-foreground">
                  <Send className="h-3.5 w-3.5 text-purple-400" />
                </div>
                <span className="font-medium text-foreground text-[11px]">
                  Invite reps to workspace
                </span>
              </div>
              <div className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground">
                <span>{progress.invitesSent}/{progress.targetInvites}</span>
              </div>
            </div>

            {/* Goal 3: Calls Tracked */}
            <div className="flex items-center justify-between p-2 rounded-lg bg-muted/25 border border-border/60">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded bg-muted text-muted-foreground">
                  <PhoneCall className="h-3.5 w-3.5 text-cyan-400" />
                </div>
                <span className="font-medium text-foreground text-[11px]">
                  Log 100 tracked calls
                </span>
              </div>
              <div className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground">
                <span>{progress.callsLogged}/{progress.targetCalls}</span>
              </div>
            </div>
          </div>

          {/* Quick link action */}
          <div className="pt-1 flex items-center justify-between text-[11px]">
            <span className="text-muted-foreground text-[10px]">
              Support confirms upon subscribing
            </span>
            <Link
              href="/telephony"
              className="text-primary hover:text-primary/80 font-bold flex items-center gap-0.5"
            >
              <span>Track Calls</span>
              <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </motion.aside>
    </AnimatePresence>
  );
}
