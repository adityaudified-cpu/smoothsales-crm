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
  if (acc.type === "meta" && (!acc.phoneId || !acc.wabaId)) return true;
  if (acc.type === "personal" && (acc.battery || acc.device === "Linked WhatsApp Business Phone" || acc.device === "Samsung Galaxy S24" || acc.status === "connected")) {
    return true;
  }
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
    let backendMapped = [];
    try {
      if (isApiMode()) {
        const backendAccounts = await whatsappAccountsApi.list();
        if (Array.isArray(backendAccounts)) {
          backendMapped = backendAccounts
            .filter((a) => a && !isMockAccount(a))
            .map(mapAccount);
        }
      }
    } catch (err) {
      console.warn("Failed to fetch WhatsApp accounts from backend:", err);
    }

    // Preserve clean personal SIM accounts registered locally, discard any mock data
    const saved = readLocal(WA_ACCOUNTS_KEY, []);
    const cleanPersonal = Array.isArray(saved)
      ? saved.filter((a) => a && a.type === "personal" && !isMockAccount(a))
      : [];

    const combined = [...backendMapped, ...cleanPersonal];
    setAccounts(combined);
    const defaultMeta = combined.find((a) => a.type === "meta");
    setActiveAccountId(defaultMeta?.id || combined[0]?.id || null);
    writeLocal(WA_ACCOUNTS_KEY, combined);
    return combined;
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

    // Personal WhatsApp SIM registration for CRM Timeline Logging
    const newAcc = {
      type: "personal",
      id: acc.id || `personal_${Date.now()}`,
      label: acc.label || `Rep SIM (${acc.agentName || "Sales Rep"})`,
      number: acc.number || "",
      agentName: acc.agentName || "Sales Rep",
      device: "Sales Rep SIM",
      status: "registered",
      syncStatus: "Timeline Logging Active",
      connectedAt: new Date().toISOString().slice(0, 10),
    };

    setAccounts((prev) => {
      const filtered = prev.filter((a) => a.id !== newAcc.id);
      const updated = [...filtered, newAcc];
      writeLocal(WA_ACCOUNTS_KEY, updated);
      return updated;
    });
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
  const metaAccount = accounts.find((a) => a.type === "meta" && (a.phoneId || a.phoneNumberId)) || null;
  const isConnected = !!metaAccount;

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
