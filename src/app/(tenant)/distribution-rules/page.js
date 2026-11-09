"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
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
  CheckCircle2,
  AlertTriangle,
  Zap,
  Settings2,
  ChevronRight,
  Clock3,
  Trophy,
  Users2,
  MapPin,
} from "lucide-react";
import {
  MOCK_DISTRIBUTION_RULES,
  allocationMethodOptions,
} from "@/lib/mock-data/distribution-rules";
import { MOCK_DISTRIBUTION_AUDIT_LOG } from "@/lib/mock-data/distribution-audit-log";
import { RuleBuilderSheet } from "@/components/distribution/rule-builder-sheet";
import { usePersistedState } from "@/lib/hooks/use-persisted-state";

const METHOD_STYLES = {
  round_robin: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800",
  fixed: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800",
  workload: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
  capacity: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
  pool: "bg-muted text-muted-foreground border-border",
};

export default function DistributionRulesPage() {
  const [rules, setRules] = usePersistedState("smoothsales_distribution_rules_v1", MOCK_DISTRIBUTION_RULES);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [activeTab, setActiveTab] = useState("rules");
  const [deletingId, setDeletingId] = useState(null);

  const handleOpenCreate = () => { setEditingRule(null); setSheetOpen(true); };
  const handleOpenEdit = (rule) => { setEditingRule(rule); setSheetOpen(true); };
  const handleToggleActive = (ruleId) => {
    setRules((prev) => prev.map((r) => (r.id === ruleId ? { ...r, active: !r.active } : r)));
  };
  const handleDeleteRule = (ruleId) => {
    setDeletingId(ruleId);
    setTimeout(() => {
      setRules((prev) => prev.filter((r) => r.id !== ruleId));
      setDeletingId(null);
    }, 200);
  };
  const handleSaveRule = (savedRule) => {
    setRules((prev) => {
      const exists = prev.some((r) => r.id === savedRule.id);
      if (exists) return prev.map((r) => (r.id === savedRule.id ? savedRule : r)).sort((a, b) => a.priority - b.priority);
      return [...prev, savedRule].sort((a, b) => a.priority - b.priority);
    });
  };

  const getConditionSummary = (rule) => {
    if (!rule.conditions?.length) return "Always match — applies to all inbound leads";
    const connector = ` ${rule.logic || "AND"} `;
    return rule.conditions.map((c) => `${c.field} = "${c.value || "(any)"}"`).join(connector);
  };

  const getAllocationLabel = (methodKey) => {
    const found = allocationMethodOptions.find((o) => o.value === methodKey);
    return found ? found.label : methodKey;
  };

  const activeCount = rules.filter((r) => r.active).length;
  const pausedCount = rules.length - activeCount;

  return (
    <div className="space-y-0">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-border mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
            <GitBranch className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-heading text-xl font-extrabold tracking-tight text-foreground">
              Distribution Engine
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Configure routing rules, partner tiers, and review assignment decisions.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 rounded-full border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 px-3 py-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
            {activeCount} Active Rules
          </div>
          {activeTab === "rules" && (
            <Button
              size="sm"
              onClick={handleOpenCreate}
              className="h-8 gap-1.5 text-xs font-semibold"
            >
              <Plus className="h-3.5 w-3.5" />
              New Rule
            </Button>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-5">
        <TabsList className="h-9 bg-muted/50 border border-border p-1 gap-0.5">
          <TabsTrigger value="rules" className="h-7 gap-1.5 text-xs px-3 data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <GitBranch className="h-3.5 w-3.5" />
            Rules Cascade
            <span className="ml-1 rounded-full bg-primary/10 text-primary px-1.5 py-0 text-[10px] font-bold">
              {rules.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="tiers" className="h-7 gap-1.5 text-xs px-3 data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <ShieldCheck className="h-3.5 w-3.5" />
            Partner Tiers & SLA
          </TabsTrigger>
          <TabsTrigger value="audit" className="h-7 gap-1.5 text-xs px-3 data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <History className="h-3.5 w-3.5" />
            Audit Log
            <span className="ml-1 rounded-full bg-muted text-muted-foreground px-1.5 py-0 text-[10px] font-bold">
              {MOCK_DISTRIBUTION_AUDIT_LOG.length}
            </span>
          </TabsTrigger>
        </TabsList>

        {/* ── TAB 1: RULES CASCADE ── */}
        <TabsContent value="rules" className="space-y-3 mt-0">
          {/* Stats bar */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Total Rules", value: rules.length, color: "text-foreground", bg: "" },
              { label: "Active", value: activeCount, color: "text-emerald-600 dark:text-emerald-400", bg: activeCount > 0 ? "border-emerald-200 dark:border-emerald-800" : "" },
              { label: "Paused", value: pausedCount, color: "text-amber-600 dark:text-amber-400", bg: pausedCount > 0 ? "border-amber-200 dark:border-amber-800" : "" },
            ].map((stat) => (
              <div key={stat.label} className={`rounded-lg border bg-card px-4 py-2.5 flex items-center justify-between ${stat.bg || "border-border"}`}>
                <span className="text-[11px] text-muted-foreground font-medium">{stat.label}</span>
                <span className={`text-lg font-bold tabular-nums ${stat.color}`}>{stat.value}</span>
              </div>
            ))}
          </div>

          {/* Rules timeline */}
          <div className="relative">
            {rules.length > 0 && (
              <div className="absolute left-[22px] top-8 bottom-8 w-px bg-gradient-to-b from-primary/40 via-border to-transparent" />
            )}
            <div className="space-y-2.5">
              {rules.map((rule, idx) => {
                const conditionSummary = getConditionSummary(rule);
                const isDeleting = deletingId === rule.id;
                return (
                  <div
                    key={rule.id}
                    className={`relative flex gap-4 transition-all duration-200 ${isDeleting ? "opacity-0 scale-95" : "opacity-100"}`}
                  >
                    {/* Priority node */}
                    <div className="relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 bg-card shadow-sm transition-colors mt-2"
                      style={{ borderColor: rule.active ? "hsl(var(--primary))" : "hsl(var(--border))" }}>
                      <span className={`text-xs font-bold tabular-nums ${rule.active ? "text-primary" : "text-muted-foreground"}`}>
                        {rule.priority}
                      </span>
                    </div>

                    {/* Rule card */}
                    <div className={`flex-1 rounded-xl border bg-card p-4 transition-all duration-150 hover:shadow-sm group ${
                      rule.active
                        ? "border-border hover:border-primary/30"
                        : "border-border/60 bg-muted/20 opacity-70"
                    }`}>
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="space-y-2 flex-1 min-w-0">
                          {/* Title row */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-sm text-foreground leading-tight">
                              {rule.name}
                            </h3>
                            {!rule.active && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-muted border border-border px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                                PAUSED
                              </span>
                            )}
                          </div>

                          {/* Badges row */}
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="inline-flex items-center gap-1 rounded-md border border-border bg-accent px-2 py-0.5 text-[11px] font-medium text-accent-foreground">
                              <ArrowRight className="h-3 w-3 text-primary shrink-0" />
                              {rule.target?.label || "Lead Pool"}
                            </span>
                            <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold ${METHOD_STYLES[rule.allocationMethod] || METHOD_STYLES.pool}`}>
                              {getAllocationLabel(rule.allocationMethod)}
                            </span>
                            <span className="inline-flex items-center gap-1 rounded-md border border-border bg-muted px-2 py-0.5 text-[10px] font-mono text-muted-foreground">
                              {rule.logic || "AND"} logic · {rule.conditions?.length || 0} condition{rule.conditions?.length !== 1 ? "s" : ""}
                            </span>
                          </div>

                          {/* Condition summary */}
                          <p className="text-[11px] text-muted-foreground font-mono leading-relaxed bg-muted/40 rounded-md px-2.5 py-1.5 border border-border/50">
                            {conditionSummary}
                          </p>
                        </div>

                        {/* Right controls */}
                        <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
                          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                            <Switch
                              checked={rule.active}
                              onCheckedChange={() => handleToggleActive(rule.id)}
                              suppressHydrationWarning
                            />
                            <span className={rule.active ? "text-emerald-600 dark:text-emerald-400 font-medium" : ""}>
                              {rule.active ? "Live" : "Off"}
                            </span>
                          </div>
                          <div className="flex items-center gap-0.5 border-l border-border pl-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenEdit(rule)}
                              className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteRule(rule.id)}
                              className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {rules.length === 0 && (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 py-16 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground mb-3">
                  <GitBranch className="h-6 w-6" />
                </div>
                <p className="text-sm font-semibold text-foreground">No routing rules defined</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                  All inbound leads will fall through to the Global Default pool.
                </p>
                <Button size="sm" onClick={handleOpenCreate} className="mt-4 gap-1.5 text-xs">
                  <Plus className="h-3.5 w-3.5" /> Create First Rule
                </Button>
              </div>
            )}
          </div>

          {rules.length > 0 && (
            <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-[11px] text-muted-foreground">
              <ChevronRight className="h-3.5 w-3.5 text-primary shrink-0" />
              Rules are evaluated top-to-bottom by priority. If no rule matches, leads fall to the Global Default pool.
            </div>
          )}
        </TabsContent>

        {/* ── TAB 2: PARTNER TIERS ── */}
        <TabsContent value="tiers" className="space-y-4 mt-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                tier: "Tier 1",
                name: "Elite Resellers",
                sla: "30s SLA",
                weight: "3× Priority Multiplier",
                desc: "First-priority immediate assignment. Guaranteed sub-minute routing to designated account executives.",
                icon: Trophy,
                badgeClass: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-700",
                iconClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
                slaClass: "text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800",
              },
              {
                tier: "Tier 2",
                name: "Certified Partners",
                sla: "2m SLA",
                weight: "1.5× Multiplier",
                desc: "Standard round-robin queue. Routed to regional sales squads with mandatory 2-minute acknowledgment.",
                icon: Users2,
                badgeClass: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-700",
                iconClass: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
                slaClass: "text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800",
              },
              {
                tier: "Tier 3",
                name: "Field Brokers",
                sla: "5m SLA",
                weight: "Direct Tag / Geo Radius",
                desc: "Geographic territory pool. Leads are tagged to verified local brokers for site visits and follow-ups.",
                icon: MapPin,
                badgeClass: "bg-muted text-muted-foreground border-border",
                iconClass: "bg-muted text-muted-foreground",
                slaClass: "text-muted-foreground bg-muted border-border",
              },
            ].map((t) => (
              <div key={t.tier} className="rounded-xl border border-border bg-card p-5 space-y-4 hover:border-border/80 hover:shadow-sm transition-all">
                <div className="flex items-start justify-between gap-2">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${t.iconClass}`}>
                    <t.icon className="h-4.5 w-4.5 h-[18px] w-[18px]" />
                  </div>
                  <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${t.slaClass}`}>
                    {t.sla}
                  </span>
                </div>
                <div>
                  <div className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-bold mb-1.5 ${t.badgeClass}`}>
                    {t.tier} — {t.name}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{t.desc}</p>
                </div>
                <div className="pt-3 border-t border-border flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">Routing Weight</span>
                  <strong className="text-foreground font-semibold">{t.weight}</strong>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* ── TAB 3: AUDIT LOG ── */}
        <TabsContent value="audit" className="space-y-4 mt-0">
          {/* Legend */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3">
            <div>
              <p className="text-xs font-bold text-foreground">Sample Distribution Decisions</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Illustrative rows only — connect a routing service to replace with live events.
              </p>
            </div>
            <div className="flex items-center gap-3 text-[11px]">
              <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                <CheckCircle2 className="h-3.5 w-3.5" />
                &lt; 2.0s Within SLA
              </span>
              <span className="text-border">|</span>
              <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-medium">
                <AlertTriangle className="h-3.5 w-3.5" />
                &gt; 2.0s High Latency
              </span>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    <th className="py-3 px-4">Lead</th>
                    <th className="py-3 px-4">Matched Rule</th>
                    <th className="py-3 px-4">Assigned To</th>
                    <th className="py-3 px-4">Decision Time</th>
                    <th className="py-3 px-4 text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {MOCK_DISTRIBUTION_AUDIT_LOG.map((log) => {
                    const isFallback = log.matchedRuleName.includes("No rule matched");
                    const formattedSec = (log.decisionTimeMs / 1000).toFixed(1) + "s";
                    const isWithinSla = log.decisionTimeMs <= 2000;
                    return (
                      <tr key={log.id} className="hover:bg-muted/20 transition-colors">
                        <td className="py-3 px-4">
                          <p className="font-semibold text-foreground">{log.leadName}</p>
                          <p className="text-[10px] font-mono text-muted-foreground mt-0.5">{log.triggerSource}</p>
                        </td>
                        <td className="py-3 px-4 max-w-[220px]">
                          {isFallback ? (
                            <span className="italic text-muted-foreground">No rule matched — Global Default</span>
                          ) : (
                            <span className="font-medium text-foreground">{log.matchedRuleName}</span>
                          )}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
                            <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
                            {log.assignedTo}
                          </span>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold font-mono ${
                            isWithinSla
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800"
                              : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800"
                          }`}>
                            {isWithinSla ? <CheckCircle2 className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                            {formattedSec}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-[11px] text-muted-foreground whitespace-nowrap">
                          {log.timestamp}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>

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
