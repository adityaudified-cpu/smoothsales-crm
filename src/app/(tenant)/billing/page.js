import React from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreditCard, Check, Download, ShieldCheck } from "lucide-react";

export default function BillingPage() {
  const invoices = [
    { id: "INV-2026-03", date: "01 Mar 2026", amountINR: 42000, gstINR: 7560, totalINR: 49560, status: "Paid" },
    { id: "INV-2026-02", date: "01 Feb 2026", amountINR: 42000, gstINR: 7560, totalINR: 49560, status: "Paid" },
    { id: "INV-2026-01", date: "01 Jan 2026", amountINR: 42000, gstINR: 7560, totalINR: 49560, status: "Paid" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Subscription & Billing"
        description="Manage your tenant subscription plan, active sales seats, and GST tax invoices."
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-5 bg-card border border-border rounded-md shadow-none md:col-span-2 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div>
              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                Current Plan
              </span>
              <h3 className="text-xl font-heading font-bold text-foreground">
                Enterprise Growth Tier
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Up to 25 Sales Reps • Unlimited Lead Routing • Channel Commissions Engine
              </p>
            </div>
            <span className="text-xl font-heading font-bold text-foreground tabular-nums">
              ₹42,000<span className="text-xs font-normal text-muted-foreground">/mo + GST</span>
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-muted-foreground">Active Seats Allocated:</span>
              <strong className="text-foreground ml-2">21 of 25 seats used</strong>
            </div>
            <div>
              <span className="text-muted-foreground">Next Renewal Date:</span>
              <strong className="text-foreground ml-2">01 Apr 2026</strong>
            </div>
          </div>
        </Card>

        <Card className="p-5 bg-card border border-border rounded-md shadow-none space-y-3">
          <h4 className="font-heading font-bold text-sm text-foreground">
            Tax Details (GSTIN)
          </h4>
          <div className="text-xs space-y-2">
            <div>
              <span className="text-muted-foreground block text-[11px]">Entity Name:</span>
              <strong className="text-foreground">Apex Enterprises India Pvt Ltd</strong>
            </div>
            <div>
              <span className="text-muted-foreground block text-[11px]">GSTIN:</span>
              <code className="text-foreground font-mono">29AAACB1234F1Z8</code>
            </div>
            <div>
              <span className="text-muted-foreground block text-[11px]">State of Supply:</span>
              <span className="text-foreground">Karnataka (Code 29)</span>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-5 bg-card border border-border rounded-md shadow-none">
        <h3 className="font-heading font-bold text-sm text-foreground mb-3">
          Tax Invoices & Payment History
        </h3>
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-muted/40 border-b border-border text-[11px] font-medium text-muted-foreground uppercase">
            <tr>
              <th className="py-2.5 px-3">Invoice Number</th>
              <th className="py-2.5 px-3">Billing Date</th>
              <th className="py-2.5 px-3">Taxable Value</th>
              <th className="py-2.5 px-3">18% GST</th>
              <th className="py-2.5 px-3">Total Amount</th>
              <th className="py-2.5 px-3">Status</th>
              <th className="py-2.5 px-3 text-right">PDF</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {invoices.map((inv) => (
              <tr key={inv.id} className="hover:bg-muted/20">
                <td className="py-2.5 px-3 font-mono font-bold text-foreground">{inv.id}</td>
                <td className="py-2.5 px-3 text-muted-foreground">{inv.date}</td>
                <td className="py-2.5 px-3 text-foreground tabular-nums">₹{inv.amountINR.toLocaleString("en-IN")}</td>
                <td className="py-2.5 px-3 text-muted-foreground tabular-nums">₹{inv.gstINR.toLocaleString("en-IN")}</td>
                <td className="py-2.5 px-3 font-bold text-foreground tabular-nums">₹{inv.totalINR.toLocaleString("en-IN")}</td>
                <td className="py-2.5 px-3">
                  <span className="px-2 py-0.5 rounded text-[10px] bg-[hsl(var(--success-soft))] text-[hsl(var(--success))] font-semibold">
                    {inv.status}
                  </span>
                </td>
                <td className="py-2.5 px-3 text-right">
                  <Button variant="ghost" size="sm" className="h-6 px-2 text-[11px] gap-1">
                    <Download className="h-3 w-3" />
                    <span>Download</span>
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
