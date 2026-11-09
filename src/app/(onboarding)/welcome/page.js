"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Store, Users, Check, Clock, ArrowRight, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function WelcomePathChoicePage() {
  const [selectedPath, setSelectedPath] = useState("owner"); // "owner" | "team"

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center p-4 sm:p-6 lg:p-10">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="w-full max-w-4xl space-y-8"
      >
        {/* Header Branding & Welcome */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-primary/10 text-primary mb-1 shadow-xs border border-primary/20">
            <span className="font-heading font-extrabold text-xl text-primary">S</span>
          </div>

          <h1 className="font-heading text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Welcome, Aarav!
          </h1>

          <p className="text-sm sm:text-base text-muted-foreground max-w-md mx-auto leading-relaxed">
            Let&apos;s get you started with SmoothSales. Which best describes you?
          </p>
        </div>

        {/* Two Selectable Cards */}
        <div className="grid md:grid-cols-2 gap-6 items-stretch">
          {/* Option 1: I Own a Business */}
          <div className="relative flex flex-col">
            {/* "Most Popular" pill badge above card */}
            <div className="flex justify-end mb-2 pr-2">
              <Badge className="bg-primary text-primary-foreground hover:bg-primary font-semibold text-[11px] px-2.5 py-0.5 shadow-xs">
                <Sparkles className="h-3 w-3 mr-1" />
                Most Popular
              </Badge>
            </div>

            <Card
              onClick={() => setSelectedPath("owner")}
              className={`flex-1 p-6 sm:p-7 flex flex-col justify-between cursor-pointer transition-all duration-200 rounded-xl border-2 relative overflow-hidden ${
                selectedPath === "owner"
                  ? "border-primary bg-card ring-2 ring-primary/20 shadow-md"
                  : "border-border/80 bg-card hover:border-border hover:shadow-xs"
              }`}
            >
              <div className="space-y-5">
                {/* Storefront Icon */}
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white shadow-md shadow-primary/25">
                  <Store className="h-6 w-6" />
                </div>

                <div className="space-y-2">
                  <h2 className="font-heading text-xl font-bold text-foreground">
                    I Own a Business
                  </h2>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    Create a workspace for your business and start your 14-day free trial.
                  </p>
                </div>

                {/* Features Checklist */}
                <div className="space-y-2.5 pt-2 border-t border-border/70">
                  <div className="flex items-center gap-2.5 text-xs text-foreground font-medium">
                    <div className="h-5 w-5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <Check className="h-3 w-3 stroke-[2.5]" />
                    </div>
                    <span>14-day full free trial (no credit card required)</span>
                  </div>

                  <div className="flex items-center gap-2.5 text-xs text-foreground font-medium">
                    <div className="h-5 w-5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <Check className="h-3 w-3 stroke-[2.5]" />
                    </div>
                    <span>Full CRM, call tracker &amp; pipeline access</span>
                  </div>

                  <div className="flex items-center gap-2.5 text-xs text-foreground font-medium">
                    <div className="h-5 w-5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <Check className="h-3 w-3 stroke-[2.5]" />
                    </div>
                    <span>Invite your sales team and assign leads</span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-6 mt-4">
                <Link href="/business-info" className="block w-full">
                  <Button className="w-full h-11 text-sm font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 gap-2 shadow-sm font-heading">
                    Create Workspace
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </Card>
          </div>

          {/* Option 2: I'm Joining My Team */}
          <div className="relative flex flex-col pt-7">
            <Card
              onClick={() => setSelectedPath("team")}
              className={`flex-1 p-6 sm:p-7 flex flex-col justify-between cursor-pointer transition-all duration-200 rounded-xl border-2 relative ${
                selectedPath === "team"
                  ? "border-primary bg-card ring-2 ring-primary/20 shadow-md"
                  : "border-border/80 bg-card hover:border-border hover:shadow-xs"
              }`}
            >
              <div className="space-y-5">
                {/* Users Icon */}
                <div className="h-12 w-12 rounded-xl bg-muted border border-border flex items-center justify-center text-muted-foreground">
                  <Users className="h-6 w-6" />
                </div>

                <div className="space-y-2">
                  <h2 className="font-heading text-xl font-bold text-foreground">
                    I&apos;m Joining My Team
                  </h2>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    Your admin will send you an invitation to join your company&apos;s workspace.
                  </p>
                </div>

                {/* Dead-end waiting info box */}
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3.5 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-amber-600 dark:text-amber-400">
                    <Clock className="h-4 w-4" />
                    <span>Waiting for invitation</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Check your email or WhatsApp for an invite link from your company administrator.
                  </p>
                </div>

                <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 pt-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                  <span>Ask your admin to invite you via email or phone number.</span>
                </div>
              </div>

              {/* Disabled / Informational button */}
              <div className="pt-6 mt-4">
                <Button
                  variant="outline"
                  disabled
                  className="w-full h-11 text-xs text-muted-foreground border-border bg-muted/40 cursor-not-allowed"
                >
                  <Clock className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                  Awaiting Admin Invitation
                </Button>
              </div>
            </Card>
          </div>
        </div>

        {/* Security & Reassurance Footer */}
        <div className="text-center text-xs text-muted-foreground">
          Need assistance setting up your workspace?{" "}
          <a
            href="https://wa.me/919876543210?text=Hello%20SmoothSales,%20I%20need%20assistance%20with%20workspace%20setup"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary font-medium hover:underline"
          >
            Speak with our setup specialist
          </a>
        </div>
      </motion.div>
    </div>
  );
}
