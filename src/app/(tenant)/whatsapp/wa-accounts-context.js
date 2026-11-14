"use client";
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { verifyMetaCredentials } from "@/lib/api/whatsapp";

const WA_ACCOUNTS_KEY = "wa_accounts_v2";
const WA_SETTINGS_KEY = "wa_settings_v1";

function readLocal(key, fallback = null) {
  try { return JSON.parse(localStorage.getItem(key) ?? "null") ?? fallback; } catch { return fallback; }
}
function writeLocal(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

const WaAccountsContext = createContext(null);

const DEFAULT_META_ACCOUNT = {
  id: "meta_primary",
  label: "SmoothSales Official WhatsApp",
  number: "+91 87500 73899",
  type: "meta",
  phoneId: "1197546510113741",
  wabaId: "4424288871221076",
  status: "connected",
  qualityRating: "GREEN",
  metaStatus: "CONNECTED",
  verifiedName: "SmoothSales",
  connectedAt: "2026-11-03",
};

export function WaAccountsProvider({ children }) {
  const [accounts, setAccounts] = useState([]);
  const [activeAccountId, setActiveAccountId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [settings, setSettings] = useState(() => readLocal(WA_SETTINGS_KEY, {
    leadCapture: { lc1: true, lc2: true, lc3: true, lc4: false, lc5: true, lc6: false },
    automation:  { ar1: true, ar2: false, ar3: false, ar4: true, ar5: true },
  }));

  // Load from localStorage or initialize with verified backend Meta account
  useEffect(() => {
    const saved = readLocal(WA_ACCOUNTS_KEY, null);
    if (Array.isArray(saved) && saved.length > 0) {
      setAccounts(saved);
      setActiveAccountId(saved[0].id);
    } else {
      setAccounts([DEFAULT_META_ACCOUNT]);
      setActiveAccountId(DEFAULT_META_ACCOUNT.id);
      writeLocal(WA_ACCOUNTS_KEY, [DEFAULT_META_ACCOUNT]);
    }
    setIsLoading(false);
  }, []);

  // Persist accounts to localStorage whenever they change
  useEffect(() => {
    if (!isLoading) writeLocal(WA_ACCOUNTS_KEY, accounts);
  }, [accounts, isLoading]);

  // Persist settings
  const saveSettings = useCallback((patch) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      writeLocal(WA_SETTINGS_KEY, next);
      return next;
    });
  }, []);

  const addAccount = useCallback(async (acc) => {
    // For Meta accounts — verify credentials with Meta Graph API
    if (acc.type === "meta" && acc.token && acc.phoneId) {
      const info = await verifyMetaCredentials({ token: acc.token, phoneId: acc.phoneId });
      acc.number = info.display_phone_number || "";
      acc.verifiedName = info.verified_name || acc.label;
      acc.qualityRating = info.quality_rating || "UNKNOWN";
      acc.metaStatus = info.status || "CONNECTED";
    }

    const newAcc = {
      ...acc,
      id: acc.type === "meta" ? "meta_primary" : `personal_${Date.now()}`,
      status: "connected",
      connectedAt: new Date().toISOString().slice(0, 10),
    };

    setAccounts((prev) => {
      // Replace existing account of same id
      const filtered = prev.filter((a) => a.id !== newAcc.id);
      return [newAcc, ...filtered];
    });
    setActiveAccountId(newAcc.id);
    return newAcc;
  }, []);

  const removeAccount = useCallback((id) => {
    setAccounts((prev) => prev.filter((a) => a.id !== id));
    setActiveAccountId((prev) => {
      if (prev !== id) return prev;
      const remaining = accounts.filter((a) => a.id !== id);
      return remaining[0]?.id || null;
    });
  }, [accounts]);

  const activeAccount = accounts.find((a) => a.id === activeAccountId) || null;
  const isConnected = accounts.length > 0;
  const metaAccount = accounts.find((a) => a.type === "meta") || null;

  return (
    <WaAccountsContext.Provider value={{
      accounts,
      activeAccount,
      activeAccountId,
      setActiveAccountId,
      addAccount,
      removeAccount,
      isLoading,
      isConnected,
      metaAccount,
      settings,
      saveSettings,
    }}>
      {children}
    </WaAccountsContext.Provider>
  );
}

export function useWaAccounts() {
  const ctx = useContext(WaAccountsContext);
  if (!ctx) throw new Error("useWaAccounts must be used inside WaAccountsProvider");
  return ctx;
}

export const CHANNEL_BADGE = {
  meta:     { label: "Meta API",    cls: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
  personal: { label: "Personal WA", cls: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
};
