"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  GitBranch,
  Plus,
  Trash2,
  Sliders,
  CheckCircle2,
  ArrowRight,
  Shield,
  Layers,
  HelpCircle,
} from "lucide-react";

export function DistributionRuleBuilder() {
  const [rules, setRules] = useState([
    {
      id: "rule_1",
      name: "Enterprise High-Intent Routing",
      active: true,
      priority: 1,
      strategy: "Round-Robin",
      conditions: [
        { field: "Deal Value (INR)", operator: ">=", value: "500000" },
        { field: "Lead Source", operator: "Equals", value: "Website Form" },
      ],
      targetTeam: "Enterprise Accounts",
      fallbackHours: "2 Hours",
      matchedCount: 42,
    },
    {
      id: "rule_2",
      name: "WhatsApp Instant Response Engine",
      active: true,
      priority: 2,
      strategy: "Weighted Load-Balance",
      conditions: [
        { field: "Lead Source", operator: "Equals", value: "WhatsApp" },
      ],
      targetTeam: "Inbound Velocity Team",
      fallbackHours: "15 Minutes",
      matchedCount: 168,
    },
    {
      id: "rule_3",
      name: "IndiaMART & Justdial SME Routing",
      active: true,
      priority: 3,
      strategy: "Round-Robin",
      conditions: [
        { field: "Lead Source", operator: "In", value: "IndiaMART, Justdial" },
      ],
      targetTeam: "SME Outbound Hub",
      fallbackHours: "4 Hours",
      matchedCount: 114,
    },
  ]);

  const [activeTab, setActiveTab] = useState("rules_list");
  const [newRuleName, setNewRuleName] = useState("");
  const [newStrategy, setNewStrategy] = useState("Round-Robin");
  const [newTeam, setNewTeam] = useState("Inbound Velocity Team");
  const [conditions, setConditions] = useState([
    { field: "Lead Source", operator: "Equals", value: "Meta Ads" },
  ]);

  const toggleRuleStatus = (ruleId) => {
    setRules((prev) =>
      prev.map((r) => (r.id === ruleId ? { ...r, active: !r.active } : r))
    );
  };

  const addCondition = () => {
    setConditions((prev) => [
      ...prev,
      { field: "City", operator: "Equals", value: "Bengaluru" },
    ]);
  };

  const removeCondition = (index) => {
    setConditions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCreateRule = (e) => {
    e.preventDefault();
    if (!newRuleName) return;

    const newRule = {
      id: `rule_${Date.now()}`,
      name: newRuleName,
      active: true,
      priority: rules.length + 1,
      strategy: newStrategy,
      conditions: [...conditions],
      targetTeam: newTeam,
      fallbackHours: "1 Hour",
      matchedCount: 0,
    };

    setRules([newRule, ...rules]);
    setNewRuleName("");
    setActiveTab("rules_list");
  };

  return (
    <div className="space-y-6">
      {/* Navigation sub-tabs */}
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("rules_list")}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
              activeTab === "rules_list"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
            }`}
          >
            Active Rules ({rules.length})
          </button>
          <button
            onClick={() => setActiveTab("builder")}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
              activeTab === "builder"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
            }`}
          >
            + Create New Rule
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Shield className="h-3.5 w-3.5 text-primary" />
          <span>Execution Order: Top to Bottom (First Match Wins)</span>
        </div>
      </div>

      {activeTab === "rules_list" && (
        <div className="space-y-4">
          {rules.map((rule) => (
            <Card
              key={rule.id}
              className="p-5 bg-card border border-border shadow-none rounded-md hover:border-primary/40 transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
                <div className="flex items-center gap-3">
                  <span className="h-6 w-6 rounded bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
                    #{rule.priority}
                  </span>
                  <div>
                    <h3 className="font-heading font-bold text-sm text-foreground flex items-center gap-2">
                      {rule.name}
                    </h3>
                    <span className="text-[11px] text-muted-foreground">
                      Strategy: <strong className="text-foreground">{rule.strategy}</strong> • Matched:{" "}
                      <strong className="text-foreground">{rule.matchedCount} leads</strong>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-muted-foreground">
                      {rule.active ? "Active" : "Paused"}
                    </span>
                    <Switch
                      checked={rule.active}
                      onCheckedChange={() => toggleRuleStatus(rule.id)}
                    />
                  </div>
                </div>
              </div>

              {/* Conditions & Target Display */}
              <div className="mt-3.5 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block mb-1.5">
                    Trigger Conditions (IF ALL MATCH)
                  </span>
                  <div className="space-y-1.5">
                    {rule.conditions.map((cond, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 bg-muted/40 px-2.5 py-1.5 rounded border border-border text-[11px]"
                      >
                        <span className="font-medium text-foreground">{cond.field}</span>
                        <span className="text-muted-foreground font-mono text-[10px]">
                          {cond.operator}
                        </span>
                        <span className="font-semibold text-primary">{cond.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block mb-1.5">
                    Destination & SLA Action (THEN ROUTE TO)
                  </span>
                  <div className="bg-muted/40 p-2.5 rounded border border-border space-y-1.5 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Target Team</span>
                      <strong className="text-foreground">{rule.targetTeam}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">SLA Escalation Fallback</span>
                      <span className="text-muted-foreground">{rule.fallbackHours}</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {activeTab === "builder" && (
        <Card className="p-6 bg-card border border-border shadow-none rounded-md">
          <form onSubmit={handleCreateRule} className="space-y-6">
            <div>
              <h3 className="font-heading font-bold text-base text-foreground">
                Distribution Rule Configuration
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Build granular algorithmic routing criteria to automatically dispatch leads to sales reps.
              </p>
            </div>

            {/* Rule Name & Strategy */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="space-y-1.5 md:col-span-2">
                <label className="font-semibold text-foreground">Rule Name</label>
                <Input
                  placeholder="e.g. North India High-Value Real Estate Inbound"
                  value={newRuleName}
                  onChange={(e) => setNewRuleName(e.target.value)}
                  required
                  className="h-8 text-xs bg-background"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Dispatch Algorithm</label>
                <select
                  value={newStrategy}
                  onChange={(e) => setNewStrategy(e.target.value)}
                  className="w-full h-8 text-xs px-2.5 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="Round-Robin">Strict Round-Robin</option>
                  <option value="Weighted Load-Balance">Weighted Rep Capacity</option>
                  <option value="Fastest First Call (Broadcasting)">Fastest Rep Broadcast</option>
                </select>
              </div>
            </div>

            {/* Dynamic Conditions */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-foreground">
                  Match Conditions (Evaluated in Real-Time)
                </label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addCondition}
                  className="h-7 text-xs gap-1"
                >
                  <Plus className="h-3 w-3" />
                  <span>Add Condition</span>
                </Button>
              </div>

              <div className="space-y-2">
                {conditions.map((cond, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <select
                      value={cond.field}
                      onChange={(e) => {
                        const val = e.target.value;
                        setConditions((prev) =>
                          prev.map((c, i) => (i === index ? { ...c, field: val } : c))
                        );
                      }}
                      className="h-8 text-xs px-2 bg-background border border-border rounded-md text-foreground flex-1"
                    >
                      <option value="Lead Source">Lead Source</option>
                      <option value="Deal Value (INR)">Deal Value (INR)</option>
                      <option value="City">City / State</option>
                      <option value="Initial Interest">Keyword / Product</option>
                    </select>

                    <select
                      value={cond.operator}
                      onChange={(e) => {
                        const val = e.target.value;
                        setConditions((prev) =>
                          prev.map((c, i) => (i === index ? { ...c, operator: val } : c))
                        );
                      }}
                      className="h-8 text-xs px-2 bg-background border border-border rounded-md text-foreground w-28"
                    >
                      <option value="Equals">Equals</option>
                      <option value="In">In List</option>
                      <option value=">=">&gt;=</option>
                      <option value="<=">&lt;=</option>
                      <option value="Contains">Contains</option>
                    </select>

                    <Input
                      value={cond.value}
                      onChange={(e) => {
                        const val = e.target.value;
                        setConditions((prev) =>
                          prev.map((c, i) => (i === index ? { ...c, value: val } : c))
                        );
                      }}
                      placeholder="e.g. Meta Ads"
                      className="h-8 text-xs bg-background flex-1"
                    />

                    {conditions.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeCondition(index)}
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Target Team & Fallback */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Target Sales Team</label>
                <select
                  value={newTeam}
                  onChange={(e) => setNewTeam(e.target.value)}
                  className="w-full h-8 text-xs px-2.5 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="Inbound Velocity Team">Inbound Velocity Team (6 Reps)</option>
                  <option value="Enterprise Accounts">Enterprise Accounts (4 Reps)</option>
                  <option value="SME Outbound Hub">SME Outbound Hub (8 Reps)</option>
                  <option value="Channel Alliance Team">Channel Alliance Team (3 Reps)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Fallback SLA (If No Pickup)</label>
                <select className="w-full h-8 text-xs px-2.5 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
                  <option value="15min">15 Minutes (High Priority SLA)</option>
                  <option value="1hr">1 Hour (Standard)</option>
                  <option value="4hr">4 Hours</option>
                  <option value="24hr">24 Hours</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setActiveTab("rules_list")}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Save & Deploy Rule
              </Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
}
