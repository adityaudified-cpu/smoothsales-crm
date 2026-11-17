"use client";

import React, { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  ShieldAlert, ShieldCheck, Zap, Clock, Users, AlertTriangle,
  Save, RefreshCw, Plus, Trash2, CheckCircle2, Sliders,
  HelpCircle, Info, Lock, Flame
} from "lucide-react";
import { toast } from "sonner";
import { useWaAccounts } from "../wa-accounts-context";

const SETTINGS_KEY = "smoothsales_wa_antiban_settings";

const DEFAULT_SETTINGS = {
  // Anti-Ban & Rate Limiting
  batchSize: 50,
  minDelaySeconds: 15,
  maxDelaySeconds: 45,
  randomizeJitter: true,
  dailyLimit: 1000,
  warmupMode: false,
  warmupDay: 5,
  // Working Hours (IST / Local)
  enforceWorkingHours: true,
  workingHourStart: "09:00",
  workingHourEnd: "20:30",
  allowWeekendBroadcasts: false,
  // DND & Opt-out
  autoOptOut: true,
  optOutKeywords: "STOP, UNSUBSCRIBE, DONT MESSAGE, BAND KARO, CANCEL",
  blacklistedNumbers: [
    "+919800000000",
    "+919811111111"
  ],
  // Fallback Channel Routing
  autoFallbackPersonal: true,
  notifyOnQuotaWarning: true,
  quotaWarningThreshold: 80,
};

export default function WhatsAppSettingsPage() {
  const { accounts } = useWaAccounts();
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [newBlacklistNumber, setNewBlacklistNumber] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_KEY);
      if (saved) {
        setSettings(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Failed to load settings from storage", e);
    }
  }, []);

  const handleSave = () => {
    setIsSaving(true);
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
      setTimeout(() => {
        setIsSaving(false);
        toast.success("WhatsApp Anti-Ban & Delivery settings saved successfully!");
      }, 400);
    } catch (e) {
      setIsSaving(false);
      toast.error("Failed to save settings");
    }
  };

  const handleAddBlacklist = (e) => {
    e.preventDefault();
    const clean = newBlacklistNumber.trim().replace(/\s+/g, "");
    if (!clean || clean.length < 10) {
      toast.error("Enter a valid 10+ digit phone number");
      return;
    }
    if (settings.blacklistedNumbers.includes(clean)) {
      toast.warning("Number is already in the DND list");
      return;
    }
    setSettings((prev) => ({
      ...prev,
      blacklistedNumbers: [clean, ...prev.blacklistedNumbers]
    }));
    setNewBlacklistNumber("");
    toast.success(`Added ${clean} to DND list`);
  };

  const handleRemoveBlacklist = (num) => {
    setSettings((prev) => ({
      ...prev,
      blacklistedNumbers: prev.blacklistedNumbers.filter((n) => n !== num)
    }));
    toast.success(`Removed ${num} from DND list`);
  };

  return (
    <div className="flex flex-col h-full bg-background overflow-y-auto">
      {/* ── Top Bar ─────────────────────────────────────────────────────────── */}
      <div className="shrink-0 flex items-center justify-between gap-4 px-6 py-4 border-b border-border bg-card sticky top-0 z-20 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-500/20">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-foreground leading-tight flex items-center gap-2">
              WhatsApp Anti-Ban & Delivery Engine
              <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
                Active Guard
              </Badge>
            </h1>
            <p className="text-xs text-muted-foreground">
              Protect connected WhatsApp numbers from spam restrictions with TeleCRM & AiSensy-grade anti-ban algorithms.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs gap-1.5"
            onClick={() => {
              setSettings(DEFAULT_SETTINGS);
              toast.info("Reset to recommended safety defaults");
            }}
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Reset Defaults
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isSaving}
            className="h-8 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
          >
            <Save className="h-3.5 w-3.5" />
            {isSaving ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </div>

      {/* ── Main Content Grid ──────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto w-full p-6 space-y-6">

        {/* Protection Health Banner */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 flex items-start gap-3">
            <div className="h-8 w-8 rounded-lg bg-emerald-500/20 text-emerald-600 flex items-center justify-center shrink-0">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-emerald-900 dark:text-emerald-300">Human Rhythm Simulation</p>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-400/80 mt-0.5">
                {settings.randomizeJitter ? "Active (15s–45s dynamic delays)" : "Disabled (Constant delay)"}
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-blue-500/20 bg-blue-500/5 flex items-start gap-3">
            <div className="h-8 w-8 rounded-lg bg-blue-500/20 text-blue-600 flex items-center justify-center shrink-0">
              <Clock className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-blue-900 dark:text-blue-300">Working Hours Guard</p>
              <p className="text-[11px] text-blue-700 dark:text-blue-400/80 mt-0.5">
                {settings.enforceWorkingHours
                  ? `${settings.workingHourStart} to ${settings.workingHourEnd} Local Time`
                  : "24x7 Unrestricted"}
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 flex items-start gap-3">
            <div className="h-8 w-8 rounded-lg bg-amber-500/20 text-amber-600 flex items-center justify-center shrink-0">
              <Flame className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-amber-900 dark:text-amber-300">Warm-Up Mode</p>
              <p className="text-[11px] text-amber-700 dark:text-amber-400/80 mt-0.5">
                {settings.warmupMode ? `Active (Day ${settings.warmupDay} of 14)` : "Full Speed (1,000/day)"}
              </p>
            </div>
          </div>
        </div>

        {/* Section 1: Rate Limiting & Anti-Ban Controls */}
        <div className="p-5 rounded-xl border border-border bg-card shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div className="flex items-center gap-2">
              <Sliders className="h-4 w-4 text-emerald-600" />
              <h2 className="text-sm font-bold text-foreground">Rate Limiting & Delay Pacing</h2>
            </div>
            <span className="text-[11px] text-muted-foreground">Controls blast speed for WhatsApp Campaigns</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Batch Size */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label className="text-xs font-semibold">Batch Size</Label>
                <span className="text-xs font-mono font-bold text-emerald-600">{settings.batchSize} messages / batch</span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                How many messages to send in one continuous cycle before inserting an idle rest period.
              </p>
              <div className="flex items-center gap-3 pt-1">
                <input
                  type="range"
                  min={10}
                  max={200}
                  step={5}
                  value={settings.batchSize}
                  onChange={(e) => setSettings((s) => ({ ...s, batchSize: Number(e.target.value) }))}
                  className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-emerald-600"
                />
              </div>
            </div>

            {/* Daily Send Limit */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label className="text-xs font-semibold">Daily Send Limit (per Connected Phone)</Label>
                <span className="text-xs font-mono font-bold text-emerald-600">{settings.dailyLimit} msgs / day</span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Hard ceiling to stop broadcasts before Meta flagging occurs.
              </p>
              <div className="flex items-center gap-3 pt-1">
                <input
                  type="range"
                  min={100}
                  max={5000}
                  step={100}
                  value={settings.dailyLimit}
                  onChange={(e) => setSettings((s) => ({ ...s, dailyLimit: Number(e.target.value) }))}
                  className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-emerald-600"
                />
              </div>
            </div>

            {/* Delay Interval */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label className="text-xs font-semibold">Delay Between Messages</Label>
                <span className="text-xs font-mono font-bold text-emerald-600">
                  {settings.minDelaySeconds}s – {settings.maxDelaySeconds}s
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Dynamic humanized pause between consecutive messages to replicate manual typing.
              </p>
              <div className="flex items-center gap-3 pt-1">
                <input
                  type="range"
                  min={5}
                  max={60}
                  step={5}
                  value={settings.minDelaySeconds}
                  onChange={(e) => {
                    const min = Number(e.target.value);
                    setSettings((s) => ({ ...s, minDelaySeconds: min, maxDelaySeconds: Math.max(min + 5, s.maxDelaySeconds) }));
                  }}
                  className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-emerald-600"
                />
              </div>
            </div>

            {/* Jitter / Human Simulation Toggle */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40 border border-border">
              <div className="space-y-0.5 pr-4">
                <Label className="text-xs font-semibold cursor-pointer">Simulate Human Typing Jitter</Label>
                <p className="text-[11px] text-muted-foreground">
                  Adds micro-fluctuations (±15%) to message timing to bypass bot detection signatures.
                </p>
              </div>
              <Switch
                checked={settings.randomizeJitter}
                onCheckedChange={(c) => setSettings((s) => ({ ...s, randomizeJitter: c }))}
              />
            </div>
          </div>
        </div>

        {/* Section 2: Account Warm-Up Routine */}
        <div className="p-5 rounded-xl border border-border bg-card shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div className="flex items-center gap-2">
              <Flame className="h-4 w-4 text-amber-500" />
              <div>
                <h2 className="text-sm font-bold text-foreground">14-Day Number Warm-Up Ramp</h2>
                <p className="text-[11px] text-muted-foreground">Safely scale newly linked WhatsApp numbers</p>
              </div>
            </div>
            <Switch
              checked={settings.warmupMode}
              onCheckedChange={(c) => setSettings((s) => ({ ...s, warmupMode: c }))}
            />
          </div>

          {settings.warmupMode ? (
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300">
                Warm-up mode throttles daily volume automatically:
                <span className="font-semibold ml-1">
                  Day 1–3: 50 msgs • Day 4–7: 150 msgs • Day 8–14: 500 msgs • Day 15+: Full Capacity.
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-medium text-foreground">Current Progress:</span>
                <span className="text-xs font-bold text-amber-600">Day {settings.warmupDay} of 14</span>
                <input
                  type="range"
                  min={1}
                  max={14}
                  step={1}
                  value={settings.warmupDay}
                  onChange={(e) => setSettings((s) => ({ ...s, warmupDay: Number(e.target.value) }))}
                  className="w-48 h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-amber-600"
                />
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              Enable this if you just linked a fresh SIM or new Personal WhatsApp account.
            </p>
          )}
        </div>

        {/* Section 3: Compliant Working Hours */}
        <div className="p-5 rounded-xl border border-border bg-card shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-500" />
              <h2 className="text-sm font-bold text-foreground">Working Hours & Quiet Windows</h2>
            </div>
            <Switch
              checked={settings.enforceWorkingHours}
              onCheckedChange={(c) => setSettings((s) => ({ ...s, enforceWorkingHours: c }))}
            />
          </div>

          <p className="text-xs text-muted-foreground">
            Messages scheduled outside working hours will automatically pause and resume the next morning at opening time.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-1">
            <div className="space-y-1.5">
              <Label className="text-xs">Start Time</Label>
              <Input
                type="time"
                value={settings.workingHourStart}
                onChange={(e) => setSettings((s) => ({ ...s, workingHourStart: e.target.value }))}
                disabled={!settings.enforceWorkingHours}
                className="h-8 text-xs font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">End Time (Quiet Window Starts)</Label>
              <Input
                type="time"
                value={settings.workingHourEnd}
                onChange={(e) => setSettings((s) => ({ ...s, workingHourEnd: e.target.value }))}
                disabled={!settings.enforceWorkingHours}
                className="h-8 text-xs font-mono"
              />
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30 border border-border mt-auto">
              <span className="text-xs text-foreground font-medium">Send on Weekends</span>
              <Switch
                checked={settings.allowWeekendBroadcasts}
                onCheckedChange={(c) => setSettings((s) => ({ ...s, allowWeekendBroadcasts: c }))}
                disabled={!settings.enforceWorkingHours}
              />
            </div>
          </div>
        </div>

        {/* Section 4: DND & Opt-Out Keywords */}
        <div className="p-5 rounded-xl border border-border bg-card shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-red-500" />
              <h2 className="text-sm font-bold text-foreground">Auto-Opt Out & DND Engine</h2>
            </div>
            <Switch
              checked={settings.autoOptOut}
              onCheckedChange={(c) => setSettings((s) => ({ ...s, autoOptOut: c }))}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold">Unsubscribe Keywords (Comma Separated)</Label>
            <p className="text-[11px] text-muted-foreground">
              When a lead replies with any of these words, they will automatically be blacklisted from future campaigns.
            </p>
            <Input
              value={settings.optOutKeywords}
              onChange={(e) => setSettings((s) => ({ ...s, optOutKeywords: e.target.value }))}
              placeholder="STOP, UNSUBSCRIBE, NO, REMOVE"
              className="h-8 text-xs font-mono"
              disabled={!settings.autoOptOut}
            />
          </div>

          <div className="space-y-3 pt-2">
            <Label className="text-xs font-semibold flex items-center justify-between">
              <span>Do-Not-Disturb (DND) Blacklist ({settings.blacklistedNumbers.length})</span>
            </Label>

            <form onSubmit={handleAddBlacklist} className="flex gap-2">
              <Input
                placeholder="Add phone number e.g. +919876543210"
                value={newBlacklistNumber}
                onChange={(e) => setNewBlacklistNumber(e.target.value)}
                className="h-8 text-xs font-mono max-w-sm"
              />
              <Button type="submit" size="sm" variant="outline" className="h-8 text-xs gap-1">
                <Plus className="h-3.5 w-3.5" /> Add to DND
              </Button>
            </form>

            <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-2 rounded-lg bg-muted/40 border border-border">
              {settings.blacklistedNumbers.length === 0 ? (
                <span className="text-xs text-muted-foreground p-1">No numbers blacklisted yet.</span>
              ) : (
                settings.blacklistedNumbers.map((num) => (
                  <Badge
                    key={num}
                    variant="secondary"
                    className="text-xs font-mono gap-1.5 py-1 px-2.5 bg-background border border-border"
                  >
                    {num}
                    <button
                      type="button"
                      onClick={() => handleRemoveBlacklist(num)}
                      className="text-muted-foreground hover:text-red-500"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </Badge>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Section 5: Smart Fallback Channel */}
        <div className="p-5 rounded-xl border border-border bg-card shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-emerald-600" />
              <h2 className="text-sm font-bold text-foreground">Intelligent Fallback Routing</h2>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40 border border-border">
            <div className="space-y-0.5 pr-4">
              <Label className="text-xs font-semibold cursor-pointer">Auto-Fallback to Personal WhatsApp</Label>
              <p className="text-[11px] text-muted-foreground">
                If Meta Cloud API 24-hour service conversation window has expired, transparently route the message through the agent’s Personal WhatsApp so the conversation never drops.
              </p>
            </div>
            <Switch
              checked={settings.autoFallbackPersonal}
              onCheckedChange={(c) => setSettings((s) => ({ ...s, autoFallbackPersonal: c }))}
            />
          </div>
        </div>

      </div>
    </div>
  );
}
