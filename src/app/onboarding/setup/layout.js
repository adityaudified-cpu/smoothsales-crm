"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Check, CheckCircle2, ChevronRight, Sparkles } from "lucide-react";

const SETUP_STEPS = [
  { id: 1, slug: "call-outcomes", label: "Call Outcomes" },
  { id: 2, slug: "visit-outcomes", label: "Visit Outcomes" },
  { id: 3, slug: "qualification-form", label: "Qualification Form" },
  { id: 4, slug: "deal-stages", label: "Deal Stages" },
  { id: 5, slug: "products-services", label: "Products & Services" },
  { id: 6, slug: "invite-reps", label: "Invite Sales Reps" },
  { id: 7, slug: "add-leads", label: "Add Initial Leads" },
];

export default function WorkspaceSetupLayout({ children }) {
  const pathname = usePathname();

  // Find active step index (1-7, or 8 for finish)
  const getActiveStepIndex = () => {
    if (pathname.includes("finish")) return 8;
    for (let i = 0; i < SETUP_STEPS.length; i++) {
      if (pathname.includes(SETUP_STEPS[i].slug)) {
        return SETUP_STEPS[i].id;
      }
    }
    return 1;
  };

  const activeStep = getActiveStepIndex();

  return (
    <div className="flex-1 flex flex-col md:flex-row min-h-[calc(100vh-3.5rem)]">
      {/* Left Sidebar (Desktop) */}
      <aside className="w-full md:w-72 lg:w-80 border-b md:border-b-0 md:border-r border-border bg-card/50 backdrop-blur-xs flex flex-col justify-between shrink-0 p-5 lg:p-6">
        <div className="space-y-6">
          {/* Header */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                AI Guided Config
              </span>
            </div>
            <h2 className="font-heading text-lg font-bold text-foreground">
              Workspace Setup
            </h2>
            <p className="text-xs text-muted-foreground">
              {activeStep <= 7 ? `Step ${activeStep} of 7` : "Final Step"}
            </p>
          </div>

          {/* Stepper Vertical List */}
          <nav className="space-y-1 relative" aria-label="Setup Steps">
            {SETUP_STEPS.map((step, idx) => {
              const isCompleted = step.id < activeStep;
              const isCurrent = step.id === activeStep;
              const isFuture = step.id > activeStep;

              return (
                <div key={step.id} className="relative">
                  {/* Vertical connecting line */}
                  {idx < SETUP_STEPS.length - 1 && (
                    <div
                      className={`absolute left-[17px] top-[30px] w-0.5 h-[calc(100%-14px)] transition-colors duration-200 ${
                        isCompleted ? "bg-emerald-500/50" : "bg-border/60"
                      }`}
                      aria-hidden="true"
                    />
                  )}

                  <Link
                    href={`/onboarding/setup/${step.slug}`}
                    className={`group flex items-center gap-3.5 px-2.5 py-2 rounded-lg transition-colors text-xs font-medium ${
                      isCurrent
                        ? "bg-primary/10 text-primary font-semibold shadow-2xs"
                        : isCompleted
                        ? "text-foreground hover:bg-muted/50"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                    }`}
                  >
                    {/* Circle Indicator */}
                    <div
                      className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 text-xs font-semibold transition-all ${
                        isCurrent
                          ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                          : isCompleted
                          ? "bg-emerald-500 text-white"
                          : "border border-border bg-background text-muted-foreground group-hover:border-foreground/40"
                      }`}
                    >
                      {isCompleted ? (
                        <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                      ) : (
                        step.id
                      )}
                    </div>

                    {/* Step Label */}
                    <span className="truncate flex-1">{step.label}</span>

                    {/* Chevron on current */}
                    {isCurrent && (
                      <ChevronRight className="h-3.5 w-3.5 text-primary shrink-0" />
                    )}
                  </Link>
                </div>
              );
            })}

            {/* Small Divider Before Finish */}
            <div className="pt-2 pb-1">
              <div className="border-t border-border/80" />
            </div>

            {/* Finish Item */}
            <Link
              href="/onboarding/setup/finish"
              className={`flex items-center gap-3.5 px-2.5 py-2 rounded-lg transition-colors text-xs font-medium ${
                activeStep === 8
                  ? "bg-primary/10 text-primary font-semibold shadow-2xs"
                  : activeStep > 7
                  ? "text-emerald-600 dark:text-emerald-400 font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
              }`}
            >
              <div
                className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 text-xs font-semibold transition-all ${
                  activeStep === 8
                    ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                    : "border border-border bg-background text-muted-foreground"
                }`}
              >
                <Sparkles className="h-3.5 w-3.5" />
              </div>
              <span className="truncate flex-1">Finish &amp; Launch</span>
              {activeStep === 8 && (
                <ChevronRight className="h-3.5 w-3.5 text-primary shrink-0" />
              )}
            </Link>
          </nav>
        </div>

        {/* Sidebar Footer Hint */}
        <div className="hidden md:block pt-6 border-t border-border/70 text-[11px] text-muted-foreground">
          <p className="leading-relaxed">
            All AI suggestions are fully editable. You can reconfigure anytime in Settings.
          </p>
        </div>
      </aside>

      {/* Main Wizard Content Area */}
      <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-8 sm:py-8 lg:px-12">
        <div className="max-w-3xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
