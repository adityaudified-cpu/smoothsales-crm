import React from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MOCK_PARTNERS } from "@/lib/mock-data/partners";
import { Plus, Handshake, CheckCircle2, AlertCircle, ArrowUpRight, ShieldCheck, Zap } from "lucide-react";

export default function PartnersPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Channel Partners Directory"
        description="Manage franchise brokers, affiliate networks, KYC compliance, conversion metrics, and commission payouts."
      >
        <Button size="sm" className="h-8 gap-1.5 text-xs bg-primary text-primary-foreground">
          <Plus className="h-3.5 w-3.5" />
          <span>Onboard Partner</span>
        </Button>
      </PageHeader>

      <Card className="p-5 bg-card border border-border rounded-md shadow-none overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-muted/40 border-b border-border text-[11px] font-medium text-muted-foreground uppercase">
              <tr>
                <th className="py-2.5 px-3">Partner Entity</th>
                <th className="py-2.5 px-3">Primary Contact</th>
                <th className="py-2.5 px-3">Tier &amp; Category</th>
                <th className="py-2.5 px-3 text-center">Leads Assigned</th>
                <th className="py-2.5 px-3 text-center">Conv. Rate</th>
                <th className="py-2.5 px-3">KYC Status</th>
                <th className="py-2.5 px-3">Commission %</th>
                <th className="py-2.5 px-3">Earned (All-Time)</th>
                <th className="py-2.5 px-3">Pending Payout</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {MOCK_PARTNERS.map((p) => {
                const isHighPerformance = p.tierCategory === "HIGH_PERFORMANCE";

                return (
                  <tr key={p.id} className="hover:bg-muted/20">
                    {/* Partner Entity */}
                    <td className="py-2.5 px-3">
                      <Link
                        href={`/partners/${p.id}`}
                        className="font-semibold text-foreground hover:text-primary transition-colors block"
                      >
                        {p.name}
                      </Link>
                      <span className="text-[11px] text-muted-foreground font-mono">
                        PAN: {p.panNumber}
                      </span>
                    </td>

                    {/* Primary Contact */}
                    <td className="py-2.5 px-3 text-foreground">
                      <div>{p.contactPerson}</div>
                      <span className="text-[11px] text-muted-foreground font-mono">
                        {p.phone}
                      </span>
                    </td>

                    {/* Tier & SLA Category (High Performance vs Standard) */}
                    <td className="py-2.5 px-3">
                      <div className="flex flex-col gap-1 items-start">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-accent text-accent-foreground border border-border">
                          {p.tier}
                        </span>
                        {isHighPerformance ? (
                          <Badge
                            variant="outline"
                            className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-300 text-[9px] px-1.5 py-0 font-bold uppercase gap-1"
                          >
                            <Zap className="h-2.5 w-2.5" />
                            HIGH_PERFORMANCE
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="bg-muted text-muted-foreground border-border text-[9px] px-1.5 py-0 font-medium uppercase"
                          >
                            STANDARD
                          </Badge>
                        )}
                      </div>
                    </td>

                    {/* Total Leads Assigned */}
                    <td className="py-2.5 px-3 text-center font-mono font-bold text-foreground tabular-nums">
                      {p.totalLeadsAssigned || p.activeLeads || 0}
                    </td>

                    {/* Conversion Rate */}
                    <td className="py-2.5 px-3 text-center">
                      <span className="inline-flex px-1.5 py-0.5 rounded text-[11px] font-mono font-bold bg-primary/10 text-primary">
                        {p.conversionRate || "22.5%"}
                      </span>
                    </td>

                    {/* KYC Status */}
                    <td className="py-2.5 px-3">
                      {p.kycStatus === "Verified" ? (
                        <span className="flex items-center gap-1 text-[hsl(var(--success))] font-semibold">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Verified
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-amber-600 font-semibold">
                          <AlertCircle className="h-3.5 w-3.5" />
                          Pending
                        </span>
                      )}
                    </td>

                    {/* Commission Rate */}
                    <td className="py-2.5 px-3 font-semibold text-foreground">
                      {p.commissionRate}
                    </td>

                    {/* Total Commission Earned (All-time) */}
                    <td className="py-2.5 px-3 font-bold text-foreground tabular-nums">
                      ₹{p.earnedCommissionINR.toLocaleString("en-IN")}
                    </td>

                    {/* Pending Payout */}
                    <td className="py-2.5 px-3 font-bold text-amber-700 dark:text-amber-400 tabular-nums">
                      ₹{p.pendingPayoutINR.toLocaleString("en-IN")}
                    </td>

                    {/* Action */}
                    <td className="py-2.5 px-3 text-right">
                      <Link href={`/partners/${p.id}`}>
                        <Button variant="outline" size="sm" className="h-7 text-xs">
                          View KYC
                        </Button>
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
