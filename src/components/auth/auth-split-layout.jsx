import React from "react";
import Link from "next/link";
import { Check } from "lucide-react";

export function AuthSplitLayout({ children }) {
  const benefits = [
    "Zero-drop lead routing from Meta, WhatsApp, and IndiaMART",
    "High-velocity call disposition with automatic SLA follow-ups",
    "Built-in channel partner commissions and statutory compliance",
  ];

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      {/* Left Panel: Primary brand panel (hidden on mobile, flex on desktop) */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary text-primary-foreground flex-col justify-between p-12 relative overflow-hidden select-none">
        {/* Subtle background overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/10 to-transparent pointer-events-none" />

        {/* Brand Wordmark Top */}
        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <div className="h-8 w-8 rounded bg-white text-primary flex items-center justify-center font-heading font-extrabold text-base shadow-sm">
              S
            </div>
            <span className="font-heading font-extrabold text-xl tracking-tight text-white">
              SmoothSales<span className="opacity-80 font-normal">.ai</span>
            </span>
          </Link>
        </div>

        {/* Value Proposition & Feature Bullets Center */}
        <div className="relative z-10 max-w-md space-y-8 my-auto">
          <h1 className="text-3xl font-heading font-extrabold leading-tight text-white">
            Run every lead, every channel, every partner — in one place.
          </h1>

          <div className="space-y-4">
            {benefits.map((benefit, idx) => (
              <div key={idx} className="flex items-start gap-3 text-sm text-white/90">
                <div className="h-5 w-5 rounded-full bg-white/20 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="h-3 w-3 text-white" />
                </div>
                <span className="leading-snug">{benefit}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer info */}
        <div className="relative z-10 text-xs text-white/60">
          © 2026 SmoothSales.ai Technologies. All rights reserved.
        </div>
      </div>

      {/* Right Panel: Form area */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-[400px]">{children}</div>
      </div>
    </div>
  );
}
