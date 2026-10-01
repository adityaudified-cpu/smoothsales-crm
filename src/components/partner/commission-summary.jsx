"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DollarSign, ArrowUpRight, CheckCircle2, Clock } from "lucide-react";

export function CommissionSummary({ summary, partnerName = "Partner" }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [payoutSuccess, setPayoutSuccess] = useState(false);
  const [transferId, setTransferId] = useState("892101");

  const {
    pendingVerification = 0,
    maturedAvailable = 0,
    totalEarned = 0,
  } = summary || {};

  const canRequestPayout = maturedAvailable > 0;

  const handleConfirmPayout = () => {
    setTransferId(Date.now().toString().slice(-6));
    setPayoutSuccess(true);
    setTimeout(() => {
      setDialogOpen(false);
      setPayoutSuccess(false);
    }, 2000);
  };

  const formatCurrency = (amount) => {
    const num = Math.round(Number(amount) || 0);
    return `₹${num.toLocaleString("en-IN")}`;
  };

  return (
    <div className="space-y-4">
      {/* 3 Stat Cards Grid + Payout Action */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Pending Verification */}
        <Card className="p-4 border-border bg-card shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">
              PENDING VERIFICATION
            </span>
            <Clock className="h-3.5 w-3.5 text-amber-500" />
          </div>
          <div className="mt-1.5 text-2xl font-extrabold font-heading text-amber-600 dark:text-amber-400 tabular-nums">
            {formatCurrency(pendingVerification)}
          </div>
          <span className="text-[11px] text-muted-foreground mt-1 block">
            Awaiting client token verification (30d SLA)
          </span>
        </Card>

        {/* Available for Payout (Success tone) */}
        <Card className="p-4 border-success/40 bg-success/5 shadow-xs relative flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold">
                AVAILABLE FOR PAYOUT
              </span>
              <CheckCircle2 className="h-3.5 w-3.5 text-success" />
            </div>
            <div className="mt-1.5 text-2xl font-extrabold font-heading text-emerald-700 dark:text-emerald-400 tabular-nums">
              {formatCurrency(maturedAvailable)}
            </div>
            <span className="text-[11px] text-muted-foreground mt-1 block">
              Matured and ready to withdraw to bank
            </span>
          </div>

          <div className="pt-3 mt-2">
            <Button
              size="sm"
              disabled={!canRequestPayout}
              onClick={() => setDialogOpen(true)}
              className="w-full text-xs font-semibold gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <ArrowUpRight className="h-3.5 w-3.5" />
              Request Payout
            </Button>
          </div>
        </Card>

        {/* Total Earned All-Time */}
        <Card className="p-4 border-border bg-card shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">
              TOTAL EARNED ALL-TIME
            </span>
            <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
          <div className="mt-1.5 text-2xl font-extrabold font-heading text-foreground tabular-nums">
            {formatCurrency(totalEarned)}
          </div>
          <span className="text-[11px] text-muted-foreground mt-1 block">
            Cumulative commission disbursements
          </span>
        </Card>
      </div>

      {/* Payout Request Confirmation Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-lg font-bold text-foreground">
              Request Commission Payout
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground pt-1">
              Request payout of{" "}
              <strong className="text-foreground font-mono">
                {formatCurrency(maturedAvailable)}
              </strong>
              . This will be transferred directly to your registered bank account via NEFT/IMPS within 3–5 business days.
            </DialogDescription>
          </DialogHeader>

          {payoutSuccess ? (
            <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 text-xs text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>Payout request initiated successfully! Transfer ID #PO-{transferId}.</span>
            </div>
          ) : (
            <div className="p-3 rounded-lg bg-muted/40 border border-border text-xs space-y-1 text-muted-foreground">
              <div className="flex justify-between">
                <span>Beneficiary:</span>
                <span className="text-foreground font-medium">{partnerName}</span>
              </div>
              <div className="flex justify-between">
                <span>Direct Transfer Amount:</span>
                <span className="text-foreground font-mono font-bold">
                  {formatCurrency(maturedAvailable)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>TDS Deduction (5% Sec 194H):</span>
                <span className="text-foreground font-mono">
                  {formatCurrency(maturedAvailable * 0.05)}
                </span>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            {!payoutSuccess && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="button" onClick={handleConfirmPayout}>
                  Confirm Payout Request
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
