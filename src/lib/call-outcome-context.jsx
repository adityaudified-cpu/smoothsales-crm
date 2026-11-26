"use client";

import React, { createContext, useCallback, useContext, useState } from "react";
import { LogCallOutcomeDrawer } from "@/components/leads/log-call-outcome-drawer";
import { toast } from "sonner";

const CallOutcomeContext = createContext({
  openCallOutcomeDrawer: () => {},
});

export function CallOutcomeProvider({ children }) {
  const [drawerState, setDrawerState] = useState({
    open: false,
    lead: null,
    callId: null,
    sourceLabel: "Web-initiated call",
    onSaved: null,
  });

  const openCallOutcomeDrawer = useCallback((lead, options = {}) => {
    if (!lead) return;
    const { dial = true, callId = null, sourceLabel = "Web-initiated call", onSaved = null } = options;

    if (dial) {
      const phone = String(lead.mobile_number || lead.phone || lead.customerPhone || "").replace(/[^\d+]/g, "");
      if (phone) {
        try {
          window.location.href = `tel:${phone}`;
        } catch {}
      } else {
        toast.info("Opening call outcome logger (no phone number on lead)");
      }
    }

    setDrawerState({
      open: true,
      lead,
      callId,
      sourceLabel,
      onSaved,
    });
  }, []);

  return (
    <CallOutcomeContext.Provider value={{ openCallOutcomeDrawer }}>
      {children}
      <LogCallOutcomeDrawer
        open={drawerState.open}
        onOpenChange={(open) => setDrawerState((prev) => ({ ...prev, open }))}
        lead={drawerState.lead}
        callId={drawerState.callId}
        sourceLabel={drawerState.sourceLabel}
        onSaved={drawerState.onSaved}
      />
    </CallOutcomeContext.Provider>
  );
}

export function useCallOutcome() {
  return useContext(CallOutcomeContext);
}
