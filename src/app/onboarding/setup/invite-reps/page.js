"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  Plus,
  Trash2,
  ArrowRight,
  ArrowLeft,
  Gift,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { useOnboarding } from "@/lib/onboarding-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export default function InviteRepsStepPage() {
  const router = useRouter();
  const { invitedReps, trialRewardProgress, updateOnboarding } =
    useOnboarding();

  const [rows, setRows] = useState(() => {
    return invitedReps && invitedReps.length > 0
      ? invitedReps
      : [
          { email: "rohit.verma@company.com", role: "Sales Rep", phone: "+91 98234 11223" },
          { email: "sneha.k@company.com", role: "Sales Rep", phone: "+91 97123 44556" },
        ];
  });

  const handleRowChange = (index, field, value) => {
    const updated = [...rows];
    updated[index] = { ...updated[index], [field]: value };
    setRows(updated);
  };

  const handleAddRow = () => {
    setRows([...rows, { email: "", role: "Sales Rep", phone: "+91 " }]);
  };

  const handleRemoveRow = (index) => {
    if (rows.length === 1) {
      setRows([{ email: "", role: "Sales Rep", phone: "+91 " }]);
      return;
    }
    setRows(rows.filter((_, i) => i !== index));
  };

  const validInvitesCount = rows.filter((r) => r.email.trim() !== "").length;

  const handleSkip = () => {
    updateOnboarding({
      invitedReps: [],
      trialRewardProgress: {
        ...trialRewardProgress,
        invitesSent: 0,
      },
    });
    router.push("/onboarding/setup/add-leads");
  };

  const handleContinue = (e) => {
    e.preventDefault();
    const validRows = rows.filter((r) => r.email.trim() !== "");
    updateOnboarding({
      invitedReps: validRows,
      trialRewardProgress: {
        ...trialRewardProgress,
        repsAdded: Math.min(validRows.length, 3),
        invitesSent: Math.min(validRows.length, 3),
      },
    });
    router.push("/onboarding/setup/add-leads");
  };

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
          <Users className="h-3.5 w-3.5" />
          <span>Step 6 of 7</span>
        </div>
        <h1 className="font-heading text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
          Invite Sales Reps
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          Invite your first 3 reps to work toward your free admin seat.
        </p>
      </div>

      {/* Trial Reward Micro-Card */}
      <div className="rounded-xl border border-purple-500/30 bg-purple-950/20 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-purple-500/20 text-purple-300 shrink-0">
            <Gift className="h-4 w-4" />
          </div>
          <div>
            <div className="font-bold text-foreground flex items-center gap-1.5">
              <span>Trial Reward Milestone:</span>
              <span className="text-purple-400 font-semibold">
                {validInvitesCount} / 3 Reps Invited
              </span>
              {validInvitesCount >= 3 && (
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              )}
            </div>
            <p className="text-[11px] text-muted-foreground">
              Invite 3 team members to activate automated lead round-robin and unlock your 1-year free admin seat.
            </p>
          </div>
        </div>

        <Badge
          variant="outline"
          className="border-purple-400/40 text-purple-300 text-[10px] uppercase font-bold shrink-0 self-start sm:self-center"
        >
          {validInvitesCount >= 3 ? "Goal Reached" : `${3 - validInvitesCount} more needed`}
        </Badge>
      </div>

      {/* Reps Form Rows */}
      <form onSubmit={handleContinue} className="space-y-4">
        <div className="space-y-3">
          <div className="grid grid-cols-12 gap-3 text-[11px] font-bold text-muted-foreground px-1 uppercase tracking-wider">
            <span className="col-span-12 sm:col-span-5">Work Email</span>
            <span className="col-span-6 sm:col-span-3">Mobile (Optional)</span>
            <span className="col-span-5 sm:col-span-3">Role</span>
            <span className="col-span-1 text-center"></span>
          </div>

          {rows.map((row, index) => (
            <Card
              key={index}
              className="p-3 sm:p-2.5 rounded-xl border border-border bg-card shadow-2xs"
            >
              <div className="grid grid-cols-12 gap-3 items-center">
                <div className="col-span-12 sm:col-span-5">
                  <Input
                    type="email"
                    placeholder="rep.name@company.com"
                    value={row.email}
                    onChange={(e) =>
                      handleRowChange(index, "email", e.target.value)
                    }
                    className="h-9 text-xs"
                  />
                </div>

                <div className="col-span-6 sm:col-span-3">
                  <Input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={row.phone}
                    onChange={(e) =>
                      handleRowChange(index, "phone", e.target.value)
                    }
                    className="h-9 text-xs font-mono"
                  />
                </div>

                <div className="col-span-5 sm:col-span-3">
                  <Select
                    value={row.role}
                    onValueChange={(val) =>
                      handleRowChange(index, "role", val)
                    }
                  >
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="Role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Sales Rep">Sales Rep</SelectItem>
                      <SelectItem value="Manager">Sales Manager</SelectItem>
                      <SelectItem value="Admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="col-span-1 flex justify-center">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveRow(index)}
                    className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                    title="Remove invite"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Add Another Rep Button */}
        <div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddRow}
            className="gap-2 text-xs font-semibold text-primary border-primary/30 hover:bg-primary/5"
          >
            <Plus className="h-4 w-4" />
            Add another rep
          </Button>
        </div>

        {/* Footer Navigation */}
        <div className="pt-6 flex items-center justify-between border-t border-border">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/onboarding/setup/products-services")}
            className="gap-2 text-xs font-medium"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </Button>

          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={handleSkip}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Skip for now
            </Button>

            <Button
              type="submit"
              className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 text-xs sm:text-sm font-semibold font-heading h-10 px-6 shadow-xs"
            >
              <span>Continue</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
