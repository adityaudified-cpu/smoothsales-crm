"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MOCK_PARTNERS } from "@/lib/mock-data/partners";
import {
  ArrowLeft,
  Handshake,
  CheckCircle2,
  FileText,
  CreditCard,
  Building,
  ShieldCheck,
} from "lucide-react";

export default function PartnerDetailPage() {
  const params = useParams();
  const partnerId = params?.id || "part_1";
  const partner = MOCK_PARTNERS.find((p) => p.id === partnerId) || MOCK_PARTNERS[0];

  return (
    <div className="space-y-6">
      <Link
        href="/partners"
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-2"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        <span>Back to Partners</span>
      </Link>

      <PageHeader
        title={partner.name}
        description={`Tier: ${partner.tier} Channel Alliance • Joined ${partner.joinedDate}`}
        badge={`Commission: ${partner.commissionRate}`}
      >
        <Button size="sm" className="h-8 gap-1.5 text-xs bg-primary text-primary-foreground">
          <CreditCard className="h-3.5 w-3.5" />
          <span>Release Payout (₹{partner.pendingPayoutINR.toLocaleString("en-IN")})</span>
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Compliance & KYC Card */}
        <Card className="p-5 bg-card border border-border rounded-md shadow-none space-y-4">
          <h3 className="font-heading font-bold text-sm text-foreground flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            Statutory KYC Compliance
          </h3>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-1 border-b border-border">
              <span className="text-muted-foreground">KYC Status</span>
              <span className="font-semibold text-[hsl(var(--success))]">
                {partner.kycStatus}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-border">
              <span className="text-muted-foreground">Entity PAN</span>
              <span className="font-mono font-bold text-foreground">
                {partner.panNumber}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-border">
              <span className="text-muted-foreground">GSTIN</span>
              <span className="font-mono text-foreground">
                {partner.gstin}
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-muted-foreground">TDS Deduction</span>
              <span className="text-foreground">Section 194H (5%)</span>
            </div>
          </div>
        </Card>

        {/* Commercial Ledger */}
        <Card className="p-5 bg-card border border-border rounded-md shadow-none md:col-span-2 space-y-4">
          <h3 className="font-heading font-bold text-sm text-foreground">
            Financial Ledger Summary
          </h3>

          <div className="grid grid-cols-3 gap-4 text-xs">
            <div className="p-3 bg-muted/30 rounded border border-border">
              <span className="text-[10px] uppercase font-semibold text-muted-foreground">
                Total Referred Volume
              </span>
              <div className="text-base font-bold text-foreground mt-1 tabular-nums">
                ₹{partner.totalReferredINR.toLocaleString("en-IN")}
              </div>
            </div>
            <div className="p-3 bg-muted/30 rounded border border-border">
              <span className="text-[10px] uppercase font-semibold text-muted-foreground">
                Cumulative Commission
              </span>
              <div className="text-base font-bold text-foreground mt-1 tabular-nums">
                ₹{partner.earnedCommissionINR.toLocaleString("en-IN")}
              </div>
            </div>
            <div className="p-3 bg-muted/30 rounded border border-border">
              <span className="text-[10px] uppercase font-semibold text-muted-foreground">
                Pending Settlement
              </span>
              <div className="text-base font-bold text-amber-700 mt-1 tabular-nums">
                ₹{partner.pendingPayoutINR.toLocaleString("en-IN")}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
