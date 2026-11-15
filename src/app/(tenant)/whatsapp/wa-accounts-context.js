"use client";
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { whatsappAccountsApi } from "@/lib/api/whatsapp";
import { isApiMode } from "@/lib/api/client";

const WA_ACCOUNTS_KEY = "wa_accounts_v2";
const WA_SETTINGS_KEY = "wa_settings_v1";

function readLocal(key, fallback = null) {
  try { return JSON.parse(localStorage.getItem(key) ?? "null") ?? fallback; } catch { return fallback; }
}
function writeLocal(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

function isMockAccount(acc) {
  if (!acc) return true;
  const num = (acc.number || acc.displayPhoneNumber || "").replace(/\s+/g, "");
  if (num.includes("8750073899")) return true;
  if (acc.phoneId === "1197546510113741" || acc.wabaId === "4424288871221076") return true;
  return false;
}

const WaAccountsContext = createContext(null);

export function WaAccountsProvider({ children }) {
  const [accounts, setAccounts] = useState([]);
  const [activeAccountId, setActiveAccountId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [settings, setSettings] = useState(() => readLocal(WA_SETTINGS_KEY, {
    leadCapture: { lc1: true, lc2: true, lc3: true, lc4: false, lc5: true, lc6: false },
    automation:  { ar1: true, ar2: false, ar3: false, ar4: true, ar5: true },
  }));

  const mapAccount = useCallback((acc) => ({
    id: acc.id,
    type: "meta",
    label: acc.label || acc.verifiedName || "WhatsApp Business",
    phoneId: acc.phoneNumberId || acc.phoneId,
    phoneNumberId: acc.phoneNumberId || acc.phoneId,
    wabaId: acc.wabaId,
    number: acc.displayPhoneNumber || acc.number || "",
    displayPhoneNumber: acc.displayPhoneNumber || acc.number || "",
    verifiedName: acc.verifiedName || "",
    qualityRating: acc.qualityRating || "UNKNOWN",
    messagingLimit: acc.messagingLimit || "1,000 / 24 Hours",
    status: acc.status || "CONNECTED",
    isDefault: !!acc.isDefault,
    webhookSubscribed: !!acc.webhookSubscribed,
    connectedAt: acc.createdAt ? new Date(acc.createdAt).toISOString().slice(0, 10) : "",
    lastVerifiedAt: acc.lastVerifiedAt,
  }), []);

  const refreshAccounts = useCallback(async () => {
    try {
      if (isApiMode()) {
        const backendAccounts = await whatsappAccountsApi.list();
        if (Array.isArray(backendAccounts)) {
          const mapped = backendAccounts.map(mapAccount);
          setAccounts(mapped);
          setActiveAccountId(mapped[0]?.id || null);
          writeLocal(WA_ACCOUNTS_KEY, mapped);
          return mapped;
        }
      }
    } catch (err) {
      console.warn("Failed to fetch WhatsApp accounts from backend:", err);
    }

    // Local fallback: discard any mock data
    const saved = readLocal(WA_ACCOUNTS_KEY, []);
    const clean = Array.isArray(saved) ? saved.filter((a) => !isMockAccount(a)) : [];
    setAccounts(clean);
    setActiveAccountId(clean[0]?.id || null);
    writeLocal(WA_ACCOUNTS_KEY, clean);
    return clean;
  }, [mapAccount]);

  // Load from backend on mount
  useEffect(() => {
    let mounted = true;
    refreshAccounts().finally(() => {
      if (mounted) setIsLoading(false);
    });
    return () => { mounted = false; };
  }, [refreshAccounts]);

  // Persist settings
  const saveSettings = useCallback((patch) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      writeLocal(WA_SETTINGS_KEY, next);
      return next;
    });
  }, []);

  const addAccount = useCallback(async (acc) => {
    if (acc.type === "meta") {
      // Connect on backend server (token encrypted, Meta Graph verified on backend)
      const res = await whatsappAccountsApi.connect({
        phoneNumberId: acc.phoneId,
        wabaId: acc.wabaId,
        accessToken: acc.token,
        label: acc.label,
      });

      const newMapped = mapAccount(res);
      setAccounts((prev) => {
        const filtered = prev.filter((a) => a.id !== newMapped.id);
        const updated = [newMapped, ...filtered];
        writeLocal(WA_ACCOUNTS_KEY, updated);
        return updated;
      });
      setActiveAccountId(newMapped.id);
      return newMapped;
    }

    // Personal WhatsApp device pairing
    const newAcc = {
      ...acc,
      id: `personal_${Date.now()}`,
      status: "connected",
      connectedAt: new Date().toISOString().slice(0, 10),
    };

    setAccounts((prev) => {
      const filtered = prev.filter((a) => a.id !== newAcc.id);
      const updated = [newAcc, ...filtered];
      writeLocal(WA_ACCOUNTS_KEY, updated);
      return updated;
    });
    setActiveAccountId(newAcc.id);
    return newAcc;
  }, [mapAccount]);

  const removeAccount = useCallback(async (id) => {
    try {
      if (isApiMode()) {
        await whatsappAccountsApi.disconnect(id);
      }
    } catch (err) {
      console.warn("Failed to disconnect WhatsApp account on backend:", err);
    }
    setAccounts((prev) => {
      const next = prev.filter((a) => a.id !== id);
      writeLocal(WA_ACCOUNTS_KEY, next);
      return next;
    });
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
      refreshAccounts,
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
