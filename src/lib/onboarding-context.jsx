"use client";

import React, { createContext, useContext, useState } from "react";
import { usePathname } from "next/navigation";

const OnboardingContext = createContext(null);

export function OnboardingProvider({ children }) {
  const pathname = usePathname();

  const [state, setState] = useState({
    businessName: "Jaipur Interiors Pvt Ltd",
    businessDescription:
      "We design bespoke luxury residential and commercial interiors in Mumbai and Jaipur, providing turnkey design and execution.",
    websiteUrl: "",
    vertical: "interior_design", // "interior_design" | "real_estate" | "education" | "general"
    doesFieldVisits: true, // boolean | null
    callOutcomes: null, // initialized or updated in Step 1
    qualificationFields: null, // initialized or updated in Step 3
    dealStages: null, // initialized or updated in Step 4
    productsServices: null, // initialized or updated in Step 5
    invitedReps: [], // [{ email: "priya@company.com", role: "Sales Rep", phone: "+91 98765 43210" }]
    trialRewardProgress: { repsAdded: 0, invitesSent: 0, callsLogged: 0 },
  });

  const updateOnboarding = (patch) => {
    setState((prev) => ({ ...prev, ...patch }));
  };

  // Helper to map pathname to current 7-step wizard step (0 to 7)
  const getStepIndex = () => {
    if (pathname?.includes("call-outcomes")) return 1;
    if (pathname?.includes("visit-outcomes")) return 2;
    if (pathname?.includes("qualification-form")) return 3;
    if (pathname?.includes("deal-stages")) return 4;
    if (pathname?.includes("products-services")) return 5;
    if (pathname?.includes("invite-reps")) return 6;
    if (pathname?.includes("add-leads")) return 7;
    if (pathname?.includes("finish")) return 8;
    return 0;
  };

  const currentStep = getStepIndex();

  return (
    <OnboardingContext.Provider
      value={{
        ...state,
        currentStep,
        updateOnboarding,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error("useOnboarding must be used within an OnboardingProvider");
  }
  return context;
}
