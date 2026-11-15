"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import { customersApi } from "../api/customers";
import { customerToLead, leadToCustomerRequest, updatesToCustomerPatch } from "../api/mappers";

const PAGE_SIZE = 500;
const BULK_CHUNK = 1000; // backend limit per bulk call
const IMPORT_CONCURRENCY = 5;

const apiFailed = (action) => (error) =>
  toast.error(`Could not ${action}`, { description: error?.message || "An unexpected error occurred." });

const chunks = (list, size) => {
  const out = [];
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size));
  return out;
};

// Runs bulk calls in chunks and merges { succeeded, failed[] }.
async function runBulk(ids, call) {
  let succeeded = 0;
  const failed = [];
  for (const part of chunks(ids, BULK_CHUNK)) {
    const res = await call(part);
    succeeded += Number(res?.succeeded || 0);
    if (Array.isArray(res?.failed)) failed.push(...res.failed);
  }
  return { succeeded, failed };
}

function reportBulk(verb, { succeeded, failed }) {
  if (!failed.length) {
    toast.success(`${verb} ${succeeded} lead${succeeded === 1 ? "" : "s"}`);
    return;
  }
  const reasons = [...new Set(failed.map((f) => f.reason).filter(Boolean))].slice(0, 2).join("; ");
  toast.warning(`${verb} ${succeeded}, ${failed.length} failed`, { description: reasons || undefined });
}

/**
 * Leads the current user can see, loaded from `/api/customers` page by page.
 * There is no local or sample data: on failure `error` is set and the list stays as it was.
 */
export function useLeads() {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState(null);
  const loadId = useRef(0);

  const loadFromApi = useCallback(async () => {
    const id = ++loadId.current;
    setIsLoading(true);
    try {
      const first = await customersApi.list({ page: 0, size: PAGE_SIZE });
      let items = first.items;
      for (let page = 1; page < (first.totalPages || 1); page++) {
        if (id !== loadId.current) return; // a newer load started
        const next = await customersApi.list({ page, size: PAGE_SIZE });
        items = items.concat(next.items);
      }
      if (id !== loadId.current) return;
      setData(items.map(customerToLead));
      setTotal(first.total ?? items.length);
      setError(null);
    } catch (loadError) {
      if (id !== loadId.current) return;
      setError(loadError);
      apiFailed("load leads")(loadError);
    } finally {
      if (id === loadId.current) {
        setIsLoading(false);
        setIsInitialized(true);
      }
    }
  }, []);

  useEffect(() => {
    loadFromApi();
  }, [loadFromApi]);

  const refreshData = useCallback(() => loadFromApi(), [loadFromApi]);

  const createLead = useCallback(async (lead) => {
    try {
      const saved = customerToLead(await customersApi.create(leadToCustomerRequest(lead)));
      setData((prev) => [saved, ...prev]);
      setTotal((t) => t + 1);
      toast.success(`Lead "${saved.lead_name || "Prospect"}" created`);
      return saved;
    } catch (err) {
      apiFailed("create lead")(err);
      throw err;
    }
  }, []);

  // Creates leads a few at a time. Returns the number saved; failures are reported, not hidden.
  const addLeads = useCallback(async (incomingLeads = []) => {
    if (!Array.isArray(incomingLeads) || incomingLeads.length === 0) return 0;
    const saved = [];
    const failures = [];
    let cursor = 0;
    const worker = async () => {
      while (cursor < incomingLeads.length) {
        const index = cursor++;
        try {
          saved.push(customerToLead(await customersApi.create(leadToCustomerRequest(incomingLeads[index]))));
        } catch (err) {
          failures.push({ row: index + 1, reason: err?.message });
        }
      }
    };
    await Promise.all(Array.from({ length: Math.min(IMPORT_CONCURRENCY, incomingLeads.length) }, worker));
    if (saved.length) {
      setData((prev) => [...saved, ...prev]);
      setTotal((t) => t + saved.length);
    }
    if (failures.length) {
      const sample = failures.slice(0, 3).map((f) => `row ${f.row}: ${f.reason || "failed"}`).join("; ");
      toast.warning(`Imported ${saved.length} of ${incomingLeads.length} leads`, { description: sample });
    } else {
      toast.success(`Imported ${saved.length} leads`);
    }
    return saved.length;
  }, []);

  const batchDeleteLeads = useCallback(async (leadIds = []) => {
    if (!leadIds.length) return;
    try {
      const result = await runBulk(leadIds, customersApi.bulkDelete);
      const failedIds = new Set(result.failed.map((f) => f.id));
      setData((prev) => prev.filter((l) => !leadIds.includes(l.id) || failedIds.has(l.id)));
      setTotal((t) => Math.max(0, t - result.succeeded));
      reportBulk("Deleted", result);
    } catch (deleteError) {
      apiFailed("delete leads")(deleteError);
      loadFromApi();
    }
  }, [loadFromApi]);

  const batchUpdateLeads = useCallback(async (leadIds = [], updates = {}) => {
    if (!leadIds.length) return;
    const { lead_owner, ...rest } = updates;
    const patch = updatesToCustomerPatch(rest);
    try {
      if (lead_owner?.id) await customersApi.bulkAssignSelected(leadIds, lead_owner.id);
      const result = patch ? await runBulk(leadIds, (ids) => customersApi.bulkUpdate(ids, patch)) : { succeeded: leadIds.length, failed: [] };
      const failedIds = new Set(result.failed.map((f) => f.id));
      setData((prev) => prev.map((l) => (leadIds.includes(l.id) && !failedIds.has(l.id) ? { ...l, ...updates } : l)));
      reportBulk("Updated", result);
    } catch (updateError) {
      apiFailed("save changes")(updateError);
      loadFromApi();
    }
  }, [loadFromApi]);

  return {
    data,
    total,
    isLoading,
    isInitialized,
    error,
    createLead,
    refreshData,
    addLeads,
    batchDeleteLeads,
    batchUpdateLeads,
    setData,
  };
}
