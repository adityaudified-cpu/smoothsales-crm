"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Phone,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  Info,
  Plus,
  Trash2,
} from "lucide-react";
import { useOnboarding } from "@/lib/onboarding-context";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function VisitOutcomesStepPage() {
  const router = useRouter();
  const { doesFieldVisits, updateOnboarding } = useOnboarding();

  const [fieldVisitsEnabled, setFieldVisitsEnabled] = useState(
    doesFieldVisits !== false
  );

  const [visitOutcomesList, setVisitOutcomesList] = useState([
    { id: "vo_1", label: "Site Visit Completed", outcomeType: "positive" },
    { id: "vo_2", label: "Follow-up Visit Needed", outcomeType: "neutral" },
    { id: "vo_3", label: "Not Interested After Visit", outcomeType: "negative" },
  ]);

  const [newOutcomeText, setNewOutcomeText] = useState("");

  const handleAddVisitOutcome = (e) => {
    e.preventDefault();
    if (!newOutcomeText.trim()) return;
    setVisitOutcomesList([
      ...visitOutcomesList,
      {
        id: `vo_${Date.now()}`,
        label: newOutcomeText.trim(),
        outcomeType: "neutral",
      },
    ]);
    setNewOutcomeText("");
  };

  const handleRemoveVisitOutcome = (id) => {
    setVisitOutcomesList(visitOutcomesList.filter((item) => item.id !== id));
  };

  const handleSaveAndContinue = () => {
    updateOnboarding({
      doesFieldVisits: fieldVisitsEnabled,
    });
    router.push("/setup/qualification-form");
  };

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
          <MapPin className="h-3.5 w-3.5" />
          <span>Step 2 of 7</span>
        </div>
        <h1 className="font-heading text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
          Visit Outcomes
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          Does your sales team do field visits to meet leads or clients in person?
        </p>
      </div>

      {/* Two Large Selectable Cards */}
      <div className="grid sm:grid-cols-2 gap-5">
        {/* Card 1: Yes */}
        <Card
          onClick={() => setFieldVisitsEnabled(true)}
          className={`p-6 rounded-xl border-2 cursor-pointer transition-all duration-200 relative flex flex-col justify-between ${
            fieldVisitsEnabled
              ? "border-emerald-500 bg-emerald-500/[0.04] ring-2 ring-emerald-500/20 shadow-xs"
              : "border-border bg-card hover:border-border/80"
          }`}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div
                className={`h-11 w-11 rounded-xl flex items-center justify-center ${
                  fieldVisitsEnabled
                    ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/25"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                <MapPin className="h-5 w-5" />
              </div>
              {fieldVisitsEnabled && (
                <div className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Selected</span>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <h3 className="font-heading text-base font-bold text-foreground">
                Yes, we do field visits
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Our reps visit clients on-site — configure what happens after each visit.
              </p>
            </div>
          </div>
        </Card>

        {/* Card 2: No */}
        <Card
          onClick={() => setFieldVisitsEnabled(false)}
          className={`p-6 rounded-xl border-2 cursor-pointer transition-all duration-200 relative flex flex-col justify-between ${
            !fieldVisitsEnabled
              ? "border-primary bg-primary/[0.04] ring-2 ring-primary/20 shadow-xs"
              : "border-border bg-card hover:border-border/80"
          }`}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div
                className={`h-11 w-11 rounded-xl flex items-center justify-center ${
                  !fieldVisitsEnabled
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                <Phone className="h-5 w-5" />
              </div>
              {!fieldVisitsEnabled && (
                <div className="flex items-center gap-1 text-xs font-bold text-primary">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Selected</span>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <h3 className="font-heading text-base font-bold text-foreground">
                No, we work remotely
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                We handle everything over calls, emails, WhatsApp, and online meetings.
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Direct link note to Field Partner sales channel */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex items-start gap-3">
        <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
        <div className="text-xs text-muted-foreground leading-relaxed">
          <strong className="text-foreground font-semibold">Channel Note: </strong>
          This also determines whether the{" "}
          <span className="font-semibold text-primary">Field Partner channel</span> is available in your workspace. Teams that conduct field visits get access to on-site GPS check-ins and QR visit verification.
        </div>
      </div>

      {/* Secondary Panel if "Yes" is selected */}
      <AnimatePresence>
        {fieldVisitsEnabled && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="space-y-4 pt-2"
          >
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-foreground font-heading">
                Site Visit Outcome Options
              </h3>
              <p className="text-xs text-muted-foreground">
                When a field executive completes an on-site visit, they choose one of these outcomes:
              </p>
            </div>

            <div className="space-y-2">
              {visitOutcomesList.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border bg-card text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    <span className="font-medium text-foreground">{item.label}</span>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveVisitOutcome(item.id)}
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>

            {/* Quick add row */}
            <form onSubmit={handleAddVisitOutcome} className="flex items-center gap-2 pt-1">
              <Input
                value={newOutcomeText}
                onChange={(e) => setNewOutcomeText(e.target.value)}
                placeholder="Add another visit outcome..."
                className="h-9 text-xs bg-background flex-1"
              />
              <Button
                type="submit"
                variant="outline"
                size="sm"
                disabled={!newOutcomeText.trim()}
                className="h-9 gap-1.5 text-xs font-semibold"
              >
                <Plus className="h-3.5 w-3.5" />
                Add
              </Button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer Navigation */}
      <div className="pt-4 flex items-center justify-between border-t border-border">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/setup/call-outcomes")}
          className="gap-2 text-xs font-medium"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back
        </Button>

        <Button
          onClick={handleSaveAndContinue}
          className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 text-xs sm:text-sm font-semibold font-heading h-10 px-6 shadow-xs"
        >
          <span>Save &amp; Continue</span>
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
