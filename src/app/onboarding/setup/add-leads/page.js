"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserPlus,
  Sparkles,
  Loader2,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Phone,
  Building,
  MapPin,
  Check,
} from "lucide-react";
import { useOnboarding } from "@/lib/onboarding-context";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

const SAMPLE_GENERATED_LEADS = [
  {
    id: "lead_gen_1",
    name: "Vikram Singhania",
    company: "Singhania Estates (3 BHK Interior)",
    location: "Worli, Mumbai",
    phone: "+91 98201 55432",
    source: "IndiaMART Verified",
    budget: "₹35L - ₹50L",
    selected: true,
  },
  {
    id: "lead_gen_2",
    name: "Dr. Ananya Roy",
    company: "Dental Care Clinic (Full Renovation)",
    location: "Bandra West, Mumbai",
    phone: "+91 99102 77890",
    source: "Meta Ads Ingestion",
    budget: "₹20L - ₹28L",
    selected: true,
  },
  {
    id: "lead_gen_3",
    name: "Rajesh & Shilpa Patel",
    company: "Villa Duplex (Turnkey Modular)",
    location: "Powai, Mumbai",
    phone: "+91 98334 11029",
    source: "Housing.com Partner Lead",
    budget: "₹50L+",
    selected: true,
  },
  {
    id: "lead_gen_4",
    name: "Karan Malhotra",
    company: "Tech Hub Office (Modular Desking)",
    location: "Andheri East, Mumbai",
    phone: "+91 98450 99821",
    source: "Website Direct Form",
    budget: "₹15L - ₹25L",
    selected: false,
  },
];

export default function AddLeadsStepPage() {
  const router = useRouter();
  const { businessDescription } = useOnboarding();

  const [extraDetails, setExtraDetails] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [leadsList, setLeadsList] = useState(SAMPLE_GENERATED_LEADS);

  const handleToggleLead = (id) => {
    setLeadsList(
      leadsList.map((l) => (l.id === id ? { ...l, selected: !l.selected } : l))
    );
  };

  const handleFindLeads = async () => {
    setIsSearching(true);
    // Simulate AI lead search (1.3s)
    await new Promise((resolve) => setTimeout(resolve, 1300));
    setIsSearching(false);
    setHasSearched(true);
  };

  const handleContinue = () => {
    router.push("/onboarding/setup/finish");
  };

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
          <UserPlus className="h-3.5 w-3.5" />
          <span>Step 7 of 7</span>
        </div>
        <h1 className="font-heading text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
          Add Initial Leads
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          There are many integrations to connect your lead sources — Meta, IndiaMART, JustDial, Housing.com, web forms, and more. You can set these up later from Settings → Integrations. For now, let&apos;s get you started quickly.
        </p>
      </div>

      {/* Context-aware Info Box referencing businessDescription */}
      <div className="rounded-xl border border-primary/20 bg-primary/[0.04] p-4 sm:p-5 space-y-2">
        <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <span>We&apos;ll find potential customers for:</span>
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground italic leading-relaxed pl-5 border-l-2 border-primary/40">
          &ldquo;{businessDescription || "Turnkey interior design and execution for residential and commercial spaces"}&rdquo;
        </p>
      </div>

      {/* Extra Details Textarea */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-foreground">
          Add any extra details (optional)
        </label>
        <Textarea
          value={extraDetails}
          onChange={(e) => setExtraDetails(e.target.value)}
          placeholder="e.g. Focus on leads in South Delhi or Mumbai looking for 3 BHK renovations with budgets above ₹25 Lakhs."
          className="min-h-[75px] text-xs resize-none bg-background leading-relaxed"
        />
      </div>

      {/* Find Test Leads Button */}
      {!hasSearched ? (
        <div className="pt-1 flex flex-col sm:flex-row items-center gap-3">
          <Button
            type="button"
            onClick={handleFindLeads}
            disabled={isSearching}
            className="w-full sm:w-auto h-11 px-6 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-heading font-semibold text-xs sm:text-sm gap-2 shadow-xs"
          >
            {isSearching ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-primary-foreground" />
                <span>Searching buyer inquiries...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 text-cyan-300" />
                <span>✨ Find Test Leads</span>
              </>
            )}
          </Button>

          <Button
            type="button"
            variant="ghost"
            onClick={handleContinue}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            I&apos;ll add leads later
          </Button>
        </div>
      ) : null}

      {/* Revealed Leads Results List */}
      <AnimatePresence>
        {hasSearched && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-3.5 pt-2"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <h3 className="text-sm font-bold text-foreground font-heading">
                  AI Found 4 Verified Test Inquiries
                </h3>
              </div>
              <span className="text-xs text-muted-foreground">
                {leadsList.filter((l) => l.selected).length} leads selected for import
              </span>
            </div>

            <div className="space-y-2.5">
              {leadsList.map((lead) => (
                <Card
                  key={lead.id}
                  onClick={() => handleToggleLead(lead.id)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all duration-150 ${
                    lead.selected
                      ? "border-primary/50 bg-primary/[0.03] ring-1 ring-primary/20 shadow-xs"
                      : "border-border bg-card opacity-60 hover:opacity-100"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <Checkbox
                        checked={lead.selected}
                        onCheckedChange={() => handleToggleLead(lead.id)}
                        className="mt-1 data-[state=checked]:bg-primary"
                      />

                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-heading font-bold text-sm text-foreground">
                            {lead.name}
                          </span>
                          <Badge variant="outline" className="text-[10px] font-semibold text-primary border-primary/30">
                            {lead.source}
                          </Badge>
                        </div>

                        <div className="text-xs text-muted-foreground flex items-center gap-3 flex-wrap">
                          <span className="flex items-center gap-1">
                            <Building className="h-3 w-3" />
                            {lead.company}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {lead.location}
                          </span>
                          <span className="flex items-center gap-1 font-mono">
                            <Phone className="h-3 w-3" />
                            {lead.phone}
                          </span>
                        </div>
                      </div>
                    </div>

                    <Badge variant="secondary" className="text-[11px] font-semibold shrink-0">
                      {lead.budget}
                    </Badge>
                  </div>
                </Card>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer Navigation */}
      <div className="pt-4 flex items-center justify-between border-t border-border">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/onboarding/setup/invite-reps")}
          className="gap-2 text-xs font-medium"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back
        </Button>

        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={handleContinue}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Skip for now
          </Button>

          <Button
            onClick={handleContinue}
            className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 text-xs sm:text-sm font-semibold font-heading h-10 px-6 shadow-xs"
          >
            <span>Continue</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
