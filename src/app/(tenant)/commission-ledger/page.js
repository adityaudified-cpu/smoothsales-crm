"use client";

import React, { useState, useMemo } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { CommissionTypeBadge } from "@/components/commission/commission-type-badge";
import { MaturityStatusBadge } from "@/components/commission/maturity-status-badge";
import { commissionLedgerEntries } from "@/lib/mock-data/commission-ledger";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DollarSign,
  Info,
  Search,
  Filter,
  ArrowDownToLine,
  ShieldCheck,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { differenceInDays } from "date-fns";

export default function CommissionLedgerPage() {
  const [activeTab, setActiveTab] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  const formatINR = (val) => `₹${Math.round(val || 0).toLocaleString("en-IN")}`;

  // Calculate dynamic stats
  const { pendingTotal, availableTotal } = useMemo(() => {
    let pending = 0;
    let available = 0;
    commissionLedgerEntries.forEach((entry) => {
      const totalComm = entry.partnerCommissionAmount + entry.employeeCommissionAmount;
      if (entry.status === "PENDING_VERIFICATION") {
        pending += totalComm;
      } else if (entry.status === "MATURED_APPROVED") {
        available += totalComm;
      }
    });
    return { pendingTotal: pending, availableTotal: available };
  }, []);

  const filteredEntries = useMemo(() => {
    return commissionLedgerEntries.filter((entry) => {
      // Tab filter
      let matchesTab = true;
      if (activeTab === "PENDING") {
        matchesTab = entry.status === "PENDING_VERIFICATION";
      } else if (activeTab === "AVAILABLE") {
        matchesTab = entry.status === "MATURED_APPROVED";
      } else if (activeTab === "VOIDED") {
        matchesTab = entry.status === "REFUND_CANCELLED";
      }

      // Search filter
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        entry.orderId.toLowerCase().includes(searchLower) ||
        entry.beneficiaryPartnerName.toLowerCase().includes(searchLower) ||
        (entry.beneficiaryEmployeeName &&
          entry.beneficiaryEmployeeName.toLowerCase().includes(searchLower));

      return matchesTab && matchesSearch;
    });
  }, [activeTab, searchTerm]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Commission Ledger"
        subtitle="Automated 3-scenario attribution, hold-period verification, and joint partner/internal split ledger."
        actions={
          <Button variant="outline" size="sm" className="gap-1.5 text-xs">
            <ArrowDownToLine className="h-3.5 w-3.5" />
            Export CSV
          </Button>
        }
      />

      {/* 3 Top StatCards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="PENDING VERIFICATION"
          value={formatINR(pendingTotal)}
          deltaText="In 14-day money-back guarantee window"
          deltaTone="warning"
        />
        <StatCard
          label="AVAILABLE FOR PAYOUT"
          value={formatINR(availableTotal)}
          deltaText="Matured and approved for settlement"
          deltaTone="success"
        />
        <StatCard
          label="TOTAL DISBURSED ALL-TIME"
          value="₹6,85,000"
          deltaText="Settled to bank accounts via NEFT"
          deltaTone="success"
        />
      </div>

      {/* Info Callout */}
      <div className="p-4 rounded-lg bg-accent/60 border border-border text-xs text-foreground/90 flex items-start gap-3 shadow-xs">
        <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="text-foreground">Attribution Policy:</strong> Commission is held for verification during the money-back guarantee window before becoming available for payout. If a customer requests a refund during this window, the entry is voided. On <em>Dead-Lead Revival</em>, any historical employee claim is revoked and attributed 100% to the reviving broker.
        </div>
      </div>

      {/* Main Ledger Table Card with Tabs */}
      <Card className="border-border bg-card shadow-xs overflow-hidden">
        <div className="p-4 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
            <TabsList className="bg-muted/60 p-1 border border-border h-9">
              <TabsTrigger value="ALL" className="text-xs px-3">
                All Entries ({commissionLedgerEntries.length})
              </TabsTrigger>
              <TabsTrigger value="PENDING" className="text-xs px-3">
                Pending
              </TabsTrigger>
              <TabsTrigger value="AVAILABLE" className="text-xs px-3">
                Available
              </TabsTrigger>
              <TabsTrigger value="VOIDED" className="text-xs px-3">
                Voided
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search order or partner..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-muted-foreground font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Order ID &amp; Deal</th>
                <th className="py-3 px-4">Scenario / Type</th>
                <th className="py-3 px-4">Beneficiary &amp; Split Breakdown</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Days Until Maturity</th>
                <th className="py-3 px-4 text-right">Matures On</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredEntries.map((row) => {
                const isJoint = row.commissionType === "JOINT_HANDOVER" && row.employeeCommissionAmount > 0;
                const isPending = row.status === "PENDING_VERIFICATION";
                const isMatured = row.status === "MATURED_APPROVED";

                // Calculate days until maturity
                let maturityIndicator = null;
                if (isPending) {
                  const now = new Date();
                  const maturesDate = row.maturesAt ? new Date(row.maturesAt) : null;
                  let daysLeft = 4;
                  if (maturesDate && !isNaN(maturesDate.getTime())) {
                    daysLeft = Math.max(0, differenceInDays(maturesDate, now));
                  }
                  maturityIndicator = (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-warning/10 text-warning border border-warning/30 whitespace-nowrap">
                      <Clock className="h-3 w-3 shrink-0" />
                      <span>{daysLeft === 0 ? "Due today" : `${daysLeft}d left`}</span>
                    </span>
                  );
                } else if (isMatured) {
                  maturityIndicator = (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-success/10 text-success border border-success/20 whitespace-nowrap">
                      <CheckCircle2 className="h-3 w-3 shrink-0" />
                      <span>Matured</span>
                    </span>
                  );
                } else {
                  maturityIndicator = (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-muted text-muted-foreground border border-border whitespace-nowrap">
                      Voided
                    </span>
                  );
                }

                return (
                  <tr key={row.id} className="hover:bg-muted/20">
                    {/* Order ID & Deal Value */}
                    <td className="py-3.5 px-4">
                      <div className="font-mono font-semibold text-foreground">
                        {row.orderId}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        Deal: <span className="font-mono text-foreground font-medium">{formatINR(row.transactionAmount)}</span>
                      </div>
                    </td>

                    {/* Scenario Type */}
                    <td className="py-3.5 px-4">
                      <CommissionTypeBadge type={row.commissionType} />
                    </td>

                    {/* Beneficiary & Split */}
                    <td className="py-3.5 px-4">
                      {isJoint ? (
                        <div className="space-y-1.5">
                          <div className="font-medium text-foreground">
                            {row.beneficiaryPartnerName}
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-primary/10 text-primary border border-primary/20">
                              Partner: {formatINR(row.partnerCommissionAmount)} (70%)
                            </span>
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-muted text-muted-foreground border border-border">
                              Employee: {formatINR(row.employeeCommissionAmount)} (30%)
                            </span>
                          </div>
                          {row.beneficiaryEmployeeName && (
                            <div className="text-[11px] text-muted-foreground">
                              Assigned rep: {row.beneficiaryEmployeeName}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <div className="font-semibold text-foreground">
                            {row.beneficiaryPartnerName}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                              {formatINR(row.partnerCommissionAmount)}
                            </span>
                            {row.commissionType === "DEAD_LEAD_REVIVED" && (
                              <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                Employee claim revoked
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </td>

                    {/* Maturity Status */}
                    <td className="py-3.5 px-4">
                      <MaturityStatusBadge status={row.status} />
                    </td>

                    {/* Days Until Maturity */}
                    <td className="py-3.5 px-4">
                      {maturityIndicator}
                    </td>

                    {/* Matures On */}
                    <td className="py-3.5 px-4 text-right font-mono text-muted-foreground">
                      {row.maturesAt}
                    </td>
                  </tr>
                );
              })}

              {filteredEntries.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-muted-foreground text-xs">
                    No commission entries found matching current filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
