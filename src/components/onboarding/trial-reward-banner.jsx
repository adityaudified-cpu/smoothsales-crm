"use client";

import React from "react";
import { Gift, Sparkles, CheckCircle2 } from "lucide-react";

export function TrialRewardBanner({ progress = { repsAdded: 0, invitesSent: 0, callsLogged: 0 }, className = "" }) {
  const reps = progress?.repsAdded ?? 0;
  const invites = progress?.invitesSent ?? 0;
  const calls = progress?.callsLogged ?? 0;

  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-purple-500/30 bg-gradient-to-br from-purple-950/60 via-purple-900/40 to-indigo-950/60 p-5 sm:p-6 text-foreground shadow-lg shadow-purple-950/20 ${className}`}
    >
      {/* Background subtle radial glow */}
      <div
        className="pointer-events-none absolute -right-12 -top-12 h-56 w-56 rounded-full bg-purple-500/15 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        {/* Left Side: Incentive Details */}
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-purple-400/40 bg-purple-500/20 px-2.5 py-0.5 text-[11px] font-bold tracking-wider text-purple-200 uppercase">
            <Gift className="h-3 w-3 text-purple-300" />
            <span>Your Trial Reward</span>
          </div>

          <h3 className="font-heading text-lg sm:text-xl font-extrabold tracking-tight text-white flex items-center gap-2">
            Earn one free admin seat for your first year
            <Sparkles className="h-4 w-4 text-amber-300 shrink-0" />
          </h3>

          <p className="text-xs sm:text-sm text-purple-200/85 leading-relaxed">
            Add 3 sales reps, invite them to SmoothSales, and log 100 tracked calls before your trial ends.
          </p>
        </div>

        {/* Right Side: 3 Milestone Stat Boxes */}
        <div className="grid grid-cols-3 gap-2.5 sm:gap-3 shrink-0">
          {/* Reps */}
          <div className="rounded-lg border border-purple-400/25 bg-purple-950/50 backdrop-blur-xs p-3 text-center min-w-[84px]">
            <div className="flex items-center justify-center gap-1 font-heading text-lg sm:text-xl font-extrabold text-white">
              <span>{reps}</span>
              <span className="text-purple-300/60 text-xs font-normal">/3</span>
              {reps >= 3 && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />}
            </div>
            <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-purple-300">
              Reps
            </div>
          </div>

          {/* Invites */}
          <div className="rounded-lg border border-purple-400/25 bg-purple-950/50 backdrop-blur-xs p-3 text-center min-w-[84px]">
            <div className="flex items-center justify-center gap-1 font-heading text-lg sm:text-xl font-extrabold text-white">
              <span>{invites}</span>
              <span className="text-purple-300/60 text-xs font-normal">/3</span>
              {invites >= 3 && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />}
            </div>
            <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-purple-300">
              Invites
            </div>
          </div>

          {/* Calls */}
          <div className="rounded-lg border border-purple-400/25 bg-purple-950/50 backdrop-blur-xs p-3 text-center min-w-[84px]">
            <div className="flex items-center justify-center gap-1 font-heading text-lg sm:text-xl font-extrabold text-white">
              <span>{calls}</span>
              <span className="text-purple-300/60 text-xs font-normal">/100</span>
              {calls >= 100 && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />}
            </div>
            <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-purple-300">
              Calls
            </div>
          </div>
        </div>
      </div>

      {/* Bottom disclaimer */}
      <div className="relative z-10 mt-3.5 pt-3 border-t border-purple-500/20 text-[11px] text-purple-300/70">
        For self-created trials. Support confirms eligibility when you subscribe.
      </div>
    </div>
  );
}
