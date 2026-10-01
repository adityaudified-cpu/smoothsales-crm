"use client";

import { useState, useEffect, useCallback } from "react";
import { SAMPLE_LEADS } from "../mock-data/sample-leads";

const SAMPLE_DATA_STORAGE_KEY = "smoothsales_leads_show_sample";
const CUSTOM_LEADS_STORAGE_KEY = "smoothsales_leads_data";

/**
 * useLeads hook
 * Provides leads data, loading state, sample data toggle, and mutation helpers.
 * Fully prepared to be swapped with a real backend API (e.g. TanStack Query or SWR).
 */
export function useLeads() {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSampleData, setIsSampleData] = useState(true);

  // Initialize from storage or default to sample data
  const loadLeads = useCallback(() => {
    setIsLoading(true);
    try {
      const showSampleStored = localStorage.getItem(SAMPLE_DATA_STORAGE_KEY);
      const isSample = showSampleStored === null ? true : showSampleStored === "true";
      setIsSampleData(isSample);

      if (isSample) {
        const storedCustomData = localStorage.getItem(CUSTOM_LEADS_STORAGE_KEY);
        if (storedCustomData) {
          setData(JSON.parse(storedCustomData));
        } else {
          setData(SAMPLE_LEADS);
        }
      } else {
        // Real or empty state
        const storedCustomData = localStorage.getItem(CUSTOM_LEADS_STORAGE_KEY);
        if (storedCustomData) {
          setData(JSON.parse(storedCustomData));
        } else {
          setData([]);
        }
      }
    } catch {
      setData(SAMPLE_LEADS);
      setIsSampleData(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLeads();
  }, [loadLeads]);

  // Exit sample data mode
  const dismissSampleData = useCallback(() => {
    try {
      localStorage.setItem(SAMPLE_DATA_STORAGE_KEY, "false");
    } catch {}
    setIsSampleData(false);
    setData([]);
  }, []);

  // Restore sample data mode
  const restoreSampleData = useCallback(() => {
    try {
      localStorage.setItem(SAMPLE_DATA_STORAGE_KEY, "true");
      localStorage.removeItem(CUSTOM_LEADS_STORAGE_KEY);
    } catch {}
    setIsSampleData(true);
    setData(SAMPLE_LEADS);
  }, []);

  // Refresh data with mock latency
  const refreshData = useCallback(() => {
    setIsLoading(true);
    setTimeout(() => {
      loadLeads();
    }, 400);
  }, [loadLeads]);

  // Batch delete leads (for bulk actions)
  const batchDeleteLeads = useCallback((leadIds = []) => {
    setData((prev) => {
      const updated = prev.filter((l) => !leadIds.includes(l.id));
      try {
        localStorage.setItem(CUSTOM_LEADS_STORAGE_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, []);

  // Batch update leads (e.g. change owner or stage)
  const batchUpdateLeads = useCallback((leadIds = [], updates = {}) => {
    setData((prev) => {
      const updated = prev.map((l) => (leadIds.includes(l.id) ? { ...l, ...updates } : l));
      try {
        localStorage.setItem(CUSTOM_LEADS_STORAGE_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, []);

  return {
    data,
    isLoading,
    isSampleData,
    dismissSampleData,
    restoreSampleData,
    refreshData,
    batchDeleteLeads,
    batchUpdateLeads,
    setData,
  };
}
