"use client";

import React, { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Pencil,
  Trash2,
  ArrowRight,
  GitBranch,
  ShieldCheck,
  History,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Users,
  Building,
} from "lucide-react";
import {
  MOCK_DISTRIBUTION_RULES,
  allocationMethodOptions,
} from "@/lib/mock-data/distribution-rules";
import { MOCK_DISTRIBUTION_AUDIT_LOG } from "@/lib/mock-data/distribution-audit-log";
import { RuleBuilderSheet } from "@/components/distribution/rule-builder-sheet";

export default function DistributionRulesPage() {
  const [rules, setRules] = useState(MOCK_DISTRIBUTION_RULES);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [activeTab, setActiveTab] = useState("rules");

  const handleOpenCreate = () => {
    setEditingRule(null);
    setSheetOpen(true);
  };

  const handleOpenEdit = (rule) => {
    setEditingRule(rule);
    setSheetOpen(true);
  };

  const handleToggleActive = (ruleId) => {
    setRules((prev) =>
      prev.map((r) => (r.id === ruleId ? { ...r, active: !r.active } : r))
    );
  };

  const handleDeleteRule = (ruleId) => {
    setRules((prev) => prev.filter((r) => r.id !== ruleId));
  };

  const handleSaveRule = (savedRule) => {
    setRules((prev) => {
      const exists = prev.some((r) => r.id === savedRule.id);
      if (exists) {
        return prev
          .map((r) => (r.id === savedRule.id ? savedRule : r))
          .sort((a, b) => a.priority - b.priority);
      }
      return [...prev, savedRule].sort((a, b) => a.priority - b.priority);
    });
  };

  // Helper to get plain language summary
  const getConditionSummary = (rule) => {
    if (!rule.conditions || !rule.conditions.length) return "Always match";
    const connector = ` ${rule.logic || "AND"} `;
    return rule.conditions
      .map((c) => `${c.field} is ${c.value || "(any)"}`)
      .join(connector);
  };

  const getAllocationLabel = (methodKey) => {
    const found = allocationMethodOptions.find((o) => o.value === methodKey);
    return found ? found.label : methodKey;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Distribution Engine & Routing"
        subtitle="Configure round-robin algorithms, partner SLAs, and review real-time assignment audit logs."
        actions={
          activeTab === "rules" ? (
            <Button
              size="sm"
              onClick={handleOpenCreate}
              className="h-8 gap-1.5 text-xs bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>New Rule</span>
            </Button>
          ) : null
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-muted/60 p-1 border border-border">
          <TabsTrigger value="rules" className="gap-2 text-xs">
            <GitBranch className="h-3.5 w-3.5" />
            <span>Rules Cascade</span>
          </TabsTrigger>
          <TabsTrigger value="tiers" className="gap-2 text-xs">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Partner Tiers &amp; SLA</span>
          </TabsTrigger>
          <TabsTrigger value="audit" className="gap-2 text-xs">
            <History className="h-3.5 w-3.5" />
            <span>Audit Log</span>
            <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-muted text-muted-foreground font-mono">
              {MOCK_DISTRIBUTION_AUDIT_LOG.length}
            </span>
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: RULES CASCADE */}
        <TabsContent value="rules" className="space-y-6">
          <div className="relative pl-6 space-y-4 before:absolute before:left-3 before:top-4 before:bottom-4 before:w-[2px] before:bg-border">
            {rules.map((rule) => {
              const conditionSummary = getConditionSummary(rule);

              return (
                <div key={rule.id} className="relative group">
                  {/* Priority badge on left edge */}
                  <div className="absolute -left-[35px] top-4 h-7 w-7 rounded-full bg-card border-2 border-primary flex items-center justify-center text-xs font-bold text-primary tabular-nums shadow-sm">
                    {rule.priority}
                  </div>

                  <Card className="p-4 bg-card border border-border shadow-none rounded-md hover:border-primary/40 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <h3 className="font-heading font-semibold text-sm text-foreground">
                            {rule.name}
                          </h3>

                          {/* Target Pill */}
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-accent text-accent-foreground border border-border">
                            <ArrowRight className="h-3 w-3 text-primary" />
                            <span>{rule.target?.label || "Lead Pool"}</span>
                          </span>

                          {/* Allocation Method */}
                          <span className="inline-flex px-2 py-0.5 rounded text-[10px] text-muted-foreground bg-muted border border-border">
                            {getAllocationLabel(rule.allocationMethod)}
                          </span>
                        </div>

                        {/* Plain Language Condition Summary */}
                        <p className="text-xs text-muted-foreground font-mono leading-relaxed">
                          {conditionSummary}
                        </p>
                      </div>

                      {/* Actions & Switch */}
                      <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{rule.active ? "Active" : "Paused"}</span>
                          <Switch
                            checked={rule.active}
                            onCheckedChange={() => handleToggleActive(rule.id)}
                          />
                        </div>

                        <div className="flex items-center gap-1 border-l border-border pl-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenEdit(rule)}
                            className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteRule(rule.id)}
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              );
            })}

            {rules.length === 0 && (
              <div className="p-8 text-center text-xs text-muted-foreground border border-dashed border-border rounded-md bg-card">
                No active distribution rules defined. Leads will route to the default pool.
              </div>
            )}
          </div>

          <p className="text-xs text-muted-foreground italic pl-6">
            If no rule matches, leads fall through to the Global Default and then the Lead Pool.
          </p>
        </TabsContent>

        {/* TAB 2: PARTNER TIERS & SLA */}
        <TabsContent value="tiers" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4 bg-card border border-border rounded-md space-y-3">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-300 font-bold">
                  Tier 1 — Elite Resellers
                </Badge>
                <span className="text-xs font-mono font-bold text-foreground">30s SLA</span>
              </div>
              <p className="text-xs text-muted-foreground">
                First-priority immediate assignment. Guaranteed sub-minute routing to designated account executives.
              </p>
              <div className="pt-2 border-t border-border flex justify-between text-xs">
                <span className="text-muted-foreground">Routing Weight:</span>
                <strong className="text-foreground">3x Priority Multiplier</strong>
              </div>
            </Card>

            <Card className="p-4 bg-card border border-border rounded-md space-y-3">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-300 font-bold">
                  Tier 2 — Certified Partners
                </Badge>
                <span className="text-xs font-mono font-bold text-foreground">2m SLA</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Standard round-robin queue. Routed to regional sales squads with mandatory 2-minute acknowledgment.
              </p>
              <div className="pt-2 border-t border-border flex justify-between text-xs">
                <span className="text-muted-foreground">Routing Weight:</span>
                <strong className="text-foreground">1.5x Multiplier</strong>
              </div>
            </Card>

            <Card className="p-4 bg-card border border-border rounded-md space-y-3">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="bg-muted text-muted-foreground border-border font-bold">
                  Tier 3 — Field Brokers
                </Badge>
                <span className="text-xs font-mono font-bold text-foreground">5m SLA</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Geographic territory pool. Leads are tagged to verified local brokers for site visits and follow-ups.
              </p>
              <div className="pt-2 border-t border-border flex justify-between text-xs">
                <span className="text-muted-foreground">Routing Weight:</span>
                <strong className="text-foreground">Direct Tag / Geo Radius</strong>
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* TAB 3: AUDIT LOG (PART E) */}
        <TabsContent value="audit" className="space-y-4">
          <Card className="bg-card border border-border rounded-md shadow-xs overflow-hidden">
            <div className="p-4 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-heading font-bold text-sm text-foreground">
                  Distribution Decision Audit Log
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Complete real-time decision trail showing rule evaluations, assigned targets, and routing engine latency.
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="flex items-center gap-1 text-emerald-600 font-medium">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  &lt; 2.0s Target SLA
                </span>
                <span className="text-muted-foreground">•</span>
                <span className="flex items-center gap-1 text-amber-600 font-medium">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  &gt; 2.0s High Latency
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-muted-foreground font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Lead</th>
                    <th className="py-3 px-4">Matched Rule</th>
                    <th className="py-3 px-4">Assigned To</th>
                    <th className="py-3 px-4">Decision Time</th>
                    <th className="py-3 px-4 text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {MOCK_DISTRIBUTION_AUDIT_LOG.map((log) => {
                    const isFallback = log.matchedRuleName.includes("No rule matched");
                    const formattedSec = (log.decisionTimeMs / 1000).toFixed(1) + "s";
                    const isWithinSla = log.decisionTimeMs <= 2000;

                    return (
                      <tr key={log.id} className="hover:bg-muted/20 transition-colors">
                        <td className="py-3.5 px-4 font-semibold text-foreground">
                          <div>{log.leadName}</div>
                          <div className="text-[10px] font-mono text-muted-foreground font-normal">
                            {log.triggerSource}
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          {isFallback ? (
                            <span className="italic text-muted-foreground font-medium">
                              No rule matched — used Global Default
                            </span>
                          ) : (
                            <span className="font-medium text-foreground">
                              {log.matchedRuleName}
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-foreground/90">
                          <span className="inline-flex items-center gap-1.5 font-medium">
                            <span className="h-2 w-2 rounded-full bg-primary" />
                            <span>{log.assignedTo}</span>
                          </span>
                        </td>

                        <td className="py-3.5 px-4 font-mono font-bold">
                          <span
                            className={
                              isWithinSla
                                ? "text-emerald-600 dark:text-emerald-400"
                                : "text-amber-600 dark:text-amber-400"
                            }
                          >
                            {formattedSec}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right font-mono text-muted-foreground text-[11px]">
                          {log.timestamp}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Rule Builder Sheet */}
      <RuleBuilderSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        initialRule={editingRule}
        defaultPriority={rules.length + 1}
        onSaveRule={handleSaveRule}
      />
    </div>
  );
}
