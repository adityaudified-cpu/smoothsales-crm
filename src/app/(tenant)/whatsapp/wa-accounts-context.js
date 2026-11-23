"use client";
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { whatsappAccountsApi } from "@/lib/api/whatsapp";

/**
 * The workspace's WhatsApp numbers (Cloud API and WhatsApp Business app coexistence), loaded
 * from the backend. Shared by every WhatsApp page.
 */
const WaAccountsContext = createContext(null);

export function mapAccount(acc) {
  return {
    id: String(acc.id),
    type: "meta",
    connectionType: acc.connectionType || "CLOUD_API",
    label: acc.label || acc.verifiedName || "WhatsApp number",
    phoneNumberId: acc.phoneNumberId,
    phoneId: acc.phoneNumberId,
    wabaId: acc.wabaId,
    number: acc.displayPhoneNumber || "",
    displayPhoneNumber: acc.displayPhoneNumber || "",
    verifiedName: acc.verifiedName || "",
    qualityRating: acc.qualityRating || null,
    messagingLimit: acc.messagingLimit || null,
    status: acc.status || "CONNECTED",
    isDefault: Boolean(acc.isDefault),
    webhookSubscribed: Boolean(acc.webhookSubscribed),
    lastVerifiedAt: acc.lastVerifiedAt || null,
    lastError: acc.lastError || null,
    createdAt: acc.createdAt || null,
    templateManagerUrl: acc.templateManagerUrl,
  };
}

/** "Sales line · +91 98765 43210" */
export function accountName(acc) {
  if (!acc) return "";
  return acc.number ? `${acc.label} · ${acc.number}` : acc.label;
}

export function WaAccountsProvider({ children }) {
  const [accounts, setAccounts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const refreshAccounts = useCallback(async () => {
    try {
      const data = await whatsappAccountsApi.list();
      const mapped = data.map(mapAccount);
      setAccounts(mapped);
      setError(null);
      return mapped;
    } catch (e) {
      setError(e?.message || "Could not load WhatsApp numbers");
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { refreshAccounts(); }, [refreshAccounts]);

  const value = useMemo(() => {
    const defaultAccount = accounts.find((a) => a.isDefault) || accounts[0] || null;
    return {
      accounts,
      defaultAccount,
      /** Kept for older pages: the default number. */
      metaAccount: defaultAccount,
      isConnected: accounts.length > 0,
      isLoading,
      error,
      refreshAccounts,
      accountById: (id) => accounts.find((a) => a.id === String(id)) || null,
    };
  }, [accounts, isLoading, error, refreshAccounts]);

  return <WaAccountsContext.Provider value={value}>{children}</WaAccountsContext.Provider>;
}

export function useWaAccounts() {
  const ctx = useContext(WaAccountsContext);
  if (!ctx) throw new Error("useWaAccounts must be used inside WaAccountsProvider");
  return ctx;
}

export const CHANNEL_BADGE = {
  meta: { label: "Cloud API", cls: "bg-info/10 text-info border-info/20" },
  CLOUD_API: { label: "Cloud API", cls: "bg-info/10 text-info border-info/20" },
  BUSINESS_APP: { label: "Business app", cls: "bg-success/10 text-success border-success/20" },
};
