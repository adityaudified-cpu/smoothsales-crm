"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { customersApi } from "../api/customers";
import { customerToLead, leadToCustomerRequest, updatesToCustomerPatch } from "../api/mappers";

const apiFailed = (action) => (error) =>
  toast.error(`Could not ${action}`, { description: error?.message || "An unexpected error occurred." });

/**
 * Production Leads Hook: Directly connects to Spring Boot `/api/customers` endpoints.
 * Zero demo data, zero localStorage fallbacks.
 */
export function useLeads() {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState(null);

  const loadFromApi = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch up to 100 leads per request
      const res = await customersApi.list({ page: 0, size: 100 });
      const items = (res?.items || []).map(customerToLead);
      setData(items);
      setError(null);
    } catch (loadError) {
      setError(loadError);
      apiFailed("load leads")(loadError);
    } finally {
      setIsLoading(false);
      setIsInitialized(true);
    }
  }, []);

  useEffect(() => {
    loadFromApi();
  }, [loadFromApi]);

  const refreshData = useCallback(() => {
    loadFromApi();
  }, [loadFromApi]);

  // Single lead creation
  const createLead = useCallback(async (lead) => {
    try {
      const saved = customerToLead(await customersApi.create(leadToCustomerRequest(lead)));
      setData((prev) => [saved, ...prev]);
      toast.success(`Lead "${saved.lead_name || 'Prospect'}" created successfully`);
      return saved;
    } catch (err) {
      apiFailed("create lead")(err);
      throw err;
    }
  }, []);

  // Batch import leads
  const addLeads = useCallback(async (incomingLeads = []) => {
    if (!Array.isArray(incomingLeads) || incomingLeads.length === 0) return 0;
    let savedCount = 0;
    try {
      const promises = incomingLeads.map(async (lead) => {
        try {
          const saved = await customersApi.create(leadToCustomerRequest(lead));
          savedCount++;
          return customerToLead(saved);
        } catch {
          return null;
        }
      });
      const results = await Promise.all(promises);
      const successful = results.filter(Boolean);
      setData((prev) => [...successful, ...prev]);
      if (savedCount > 0) {
        toast.success(`Successfully imported ${savedCount} leads`);
      }
      return savedCount;
    } catch (err) {
      apiFailed("import leads")(err);
      return savedCount;
    }
  }, []);

  // Batch delete leads
  const batchDeleteLeads = useCallback(async (leadIds = []) => {
    if (!leadIds.length) return;
    setData((prev) => prev.filter((l) => !leadIds.includes(l.id)));
    try {
      await Promise.all(leadIds.map((id) => customersApi.remove(id)));
      toast.success(`Deleted ${leadIds.length} lead(s)`);
    } catch (deleteError) {
      apiFailed("delete leads")(deleteError);
      loadFromApi();
    }
  }, [loadFromApi]);

  // Batch update leads
  const batchUpdateLeads = useCallback(async (leadIds = [], updates = {}) => {
    if (!leadIds.length) return;
    setData((prev) => prev.map((l) => (leadIds.includes(l.id) ? { ...l, ...updates } : l)));
    const { lead_owner, ...rest } = updates;
    const requests = [];
    if (lead_owner?.id) requests.push(customersApi.bulkAssignSelected(leadIds, lead_owner.id));
    const patch = updatesToCustomerPatch(rest);
    if (patch) requests.push(...leadIds.map((id) => customersApi.patch(id, patch)));
    try {
      await Promise.all(requests);
      toast.success("Updated selected leads");
    } catch (updateError) {
      apiFailed("save changes")(updateError);
      loadFromApi();
    }
  }, [loadFromApi]);

  return {
    data,
    isLoading,
    isInitialized,
    isSampleData: false,
    error,
    dataSource: "api",
    createLead,
    dismissSampleData: () => {},
    restoreSampleData: () => {},
    refreshData,
    addLeads,
    batchDeleteLeads,
    batchUpdateLeads,
    setData,
  };
}
