"use client";

import React from "react";
import Link from "next/link";
import { OnboardingProvider } from "@/lib/onboarding-context";
import { HelpCircle } from "lucide-react";

export default function OnboardingRootLayout({ children }) {
  return (
    <OnboardingProvider>
      <div className="min-h-screen bg-background text-foreground flex flex-col antialiased">
        {/* Clean Top Navigation Bar */}
        <header className="h-14 border-b border-border/80 px-6 bg-card/80 backdrop-blur-sm sticky top-0 z-30 flex items-center justify-between shadow-2xs">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-90">
            <div className="relative w-7 h-7 rounded-lg overflow-hidden border border-primary/30 shadow-xs shrink-0">
              <img
                src="/images/smoothsales-logo.jpg"
                alt="SmoothSales.ai"
                className="w-full h-full object-cover"
              />
            </div>
            <span className="font-heading font-extrabold text-sm tracking-tight text-foreground">
              SmoothSales<span className="text-primary font-normal">.ai</span>
            </span>
          </Link>

          {/* Right helper links */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <a
              href="https://wa.me/919876543210?text=Hi%20SmoothSales%20Team,%20I%20need%20help%20with%20onboarding%20setup"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 hover:text-foreground transition-colors font-medium"
            >
              <HelpCircle className="h-3.5 w-3.5 text-primary" />
              <span>Need help? Chat on WhatsApp</span>
            </a>
          </div>
        </header>

        {/* Dynamic Route Content */}
        <main className="flex-1 flex flex-col">
          {children}
        </main>
      </div>
    </OnboardingProvider>
  );
}
