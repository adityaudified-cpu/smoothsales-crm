"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2,
  AlertTriangle,
  Play,
  ArrowRight,
  Sparkles,
  PhoneCall,
  MapPin,
  FileText,
  GitBranch,
  Package,
  Users,
  UserPlus,
  ShieldCheck,
} from "lucide-react";
import { useOnboarding } from "@/lib/onboarding-context";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function SetupFinishPage() {
  const router = useRouter();
  const { invitedReps, businessName } = useOnboarding();

  const repsInvitedCount = (invitedReps || []).filter(
    (r) => r.email && r.email.trim() !== ""
  ).length;

  const checklistItems = [
    {
      id: "call-outcomes",
      label: "Call Outcomes & Status Mappings",
      icon: PhoneCall,
      isDone: true,
      href: "/onboarding/setup/call-outcomes",
    },
    {
      id: "visit-outcomes",
      label: "Field Visit Outcomes & Partner Channel",
      icon: MapPin,
      isDone: true,
      href: "/onboarding/setup/visit-outcomes",
    },
    {
      id: "qualification-form",
      label: "AI Qualification Questions Form",
      icon: FileText,
      isDone: true,
      href: "/onboarding/setup/qualification-form",
    },
    {
      id: "deal-stages",
      label: "Deal Stages & Conversion Attribution",
      icon: GitBranch,
      isDone: true,
      href: "/onboarding/setup/deal-stages",
    },
    {
      id: "products-services",
      label: "Products & Quotation Line Items",
      icon: Package,
      isDone: true,
      href: "/onboarding/setup/products-services",
    },
    {
      id: "invite-reps",
      label: "Sales Team Rep Invitations",
      icon: Users,
      // C10 Specification: If invitedReps.length === 0, show "Recommended" in warning pill!
      isDone: repsInvitedCount > 0,
      href: "/onboarding/setup/invite-reps",
    },
    {
      id: "add-leads",
      label: "Initial Verified Test Leads",
      icon: UserPlus,
      isDone: true,
      href: "/onboarding/setup/add-leads",
    },
  ];

  const handleLaunchDashboard = () => {
    router.push("/dashboard");
  };

  return (
    <div className="space-y-8 pb-10">
      {/* Header Congratulations */}
      <div className="text-center space-y-3 pt-2">
        <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mb-1 border border-emerald-500/20 shadow-xs">
          <CheckCircle2 className="h-7 w-7" />
        </div>

        <h1 className="font-heading text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
          Workspace Ready for {businessName || "Your Business"}!
        </h1>

        <p className="text-xs sm:text-sm text-muted-foreground max-w-lg mx-auto leading-relaxed">
          Your CRM, custom call outcomes, qualification forms, and pipeline stages have been configured and loaded.
        </p>
      </div>

      {/* Recap Checklist */}
      <Card className="p-5 sm:p-6 rounded-xl border border-border bg-card shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-border">
          <h2 className="text-sm font-bold text-foreground font-heading">
            Configuration Summary
          </h2>
          <span className="text-xs text-muted-foreground">
            7 of 7 Steps Reviewed
          </span>
        </div>

        <div className="divide-y divide-border/60 text-xs">
          {checklistItems.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                className="py-3 flex items-center justify-between gap-4 first:pt-1 last:pb-1"
              >
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-lg bg-muted text-muted-foreground shrink-0">
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="font-medium text-foreground">
                    {item.label}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {item.isDone ? (
                    <Badge
                      variant="outline"
                      className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[11px] font-semibold"
                    >
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Done
                    </Badge>
                  ) : (
                    <Link href={item.href}>
                      <Badge
                        variant="outline"
                        className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 text-[11px] font-semibold hover:bg-amber-500/20 transition-colors cursor-pointer"
                      >
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Recommended
                      </Badge>
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Quick Start Guide Card with Video Placeholder */}
      <Card className="p-6 rounded-xl border border-border bg-card shadow-xs space-y-4">
        <div className="space-y-1">
          <h2 className="text-sm font-bold text-foreground font-heading flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span>Quick Start Guide</span>
          </h2>
          <p className="text-xs text-muted-foreground">
            Learn how to get your team started in minutes.
          </p>
        </div>

        {/* Video Embed Placeholder */}
        <div className="relative rounded-xl overflow-hidden bg-foreground/95 aspect-video max-h-72 w-full flex flex-col items-center justify-center text-center p-6 group cursor-pointer border border-border">
          {/* Subtle grid pattern / gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none" />

          {/* Centered Play Button */}
          <div className="relative z-10 h-14 w-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/40 group-hover:scale-110 transition-transform duration-200 mb-3">
            <Play className="h-6 w-6 fill-current ml-1" />
          </div>

          <div className="relative z-10 text-white font-heading font-bold text-sm sm:text-base">
            SmoothSales 2-Minute Guided Tour
          </div>
          <div className="relative z-10 text-white/70 text-xs mt-1">
            Capturing leads, live telephony dialer, and commission distribution
          </div>
        </div>
      </Card>

      {/* Final Action Button: Go to Dashboard */}
      <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border">
        <div className="text-xs text-muted-foreground flex items-center gap-1.5">
          <ShieldCheck className="h-4 w-4 text-emerald-500" />
          <span>Your 14-day free trial is now active.</span>
        </div>

        <Button
          size="lg"
          onClick={handleLaunchDashboard}
          className="w-full sm:w-auto h-11 px-8 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-heading font-semibold text-sm gap-2 shadow-md shadow-primary/25"
        >
          <span>Go to Dashboard</span>
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
