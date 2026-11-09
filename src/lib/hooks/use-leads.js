"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { SAMPLE_LEADS } from "../mock-data/sample-leads";
import { isApiMode } from "../api/client";
import { customersApi } from "../api/customers";
import { customerToLead, leadToCustomerRequest, updatesToCustomerPatch } from "../api/mappers";

const SAMPLE_DATA_STORAGE_KEY = "smoothsales_leads_show_sample";
const IMPORTED_LEADS_STORAGE_KEY = "smoothsales_imported_leads";
// Sample leads are static, so edits/deletes to them are stored as patches.
const SAMPLE_OVERRIDES_STORAGE_KEY = "smoothsales_sample_lead_overrides";
const SAMPLE_DELETED_STORAGE_KEY = "smoothsales_sample_lead_deleted";

const isSampleId = (id) => String(id).startsWith("lead_");

function readJSON(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "null");
    return value ?? fallback;
  } catch {
    return fallback;
  }
}

function writeJSON(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

function getSampleLeads() {
  const overrides = readJSON(SAMPLE_OVERRIDES_STORAGE_KEY, {});
  const deleted = new Set(readJSON(SAMPLE_DELETED_STORAGE_KEY, []));
  return SAMPLE_LEADS.filter((lead) => !deleted.has(lead.id)).map((lead) => (overrides[lead.id] ? { ...lead, ...overrides[lead.id] } : lead));
}

function persistLeads(next, changedSampleIds = [], updates = null) {
  writeJSON(IMPORTED_LEADS_STORAGE_KEY, next.filter((lead) => !isSampleId(lead.id)));
  if (!changedSampleIds.length) return;
  if (updates) {
    const overrides = readJSON(SAMPLE_OVERRIDES_STORAGE_KEY, {});
    changedSampleIds.forEach((id) => { overrides[id] = { ...(overrides[id] || {}), ...updates }; });
    writeJSON(SAMPLE_OVERRIDES_STORAGE_KEY, overrides);
  } else {
    const deleted = new Set(readJSON(SAMPLE_DELETED_STORAGE_KEY, []));
    changedSampleIds.forEach((id) => deleted.add(id));
    writeJSON(SAMPLE_DELETED_STORAGE_KEY, [...deleted]);
  }
}

const apiFailed = (action) => (error) => toast.error(`Could not ${action}`, { description: error.message });

// Data source: browser storage + sample leads by default; the backend when NEXT_PUBLIC_LEADS_DATA_SOURCE=api.
export function useLeads() {
  const api = isApiMode();
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSampleData, setIsSampleData] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState(null);

  const loadFromApi = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch first page to get totalPages, then fetch remaining pages in parallel
      const first = await customersApi.list({ page: 0, size: 200 });
      let items = first.items.map(customerToLead);
      if (first.totalPages > 1) {
        const rest = await Promise.all(
          Array.from({ length: first.totalPages - 1 }, (_, i) =>
            customersApi.list({ page: i + 1, size: 200 }).then((p) => p.items.map(customerToLead))
          )
        );
        items = [...items, ...rest.flat()];
      }
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
    if (api) { loadFromApi(); return; }
    // Local mode: load from localStorage + sample leads
    try {
      const showSampleStored = localStorage.getItem(SAMPLE_DATA_STORAGE_KEY);
      const isSample = showSampleStored === null ? true : showSampleStored === "true";
      const importedLeads = JSON.parse(localStorage.getItem(IMPORTED_LEADS_STORAGE_KEY) || "[]");
      const safeImportedLeads = Array.isArray(importedLeads) ? importedLeads : [];
      setIsSampleData(isSample);
      if (!isSample) {
        setData(safeImportedLeads);
      } else {
        setData([...getSampleLeads(), ...safeImportedLeads]);
      }
    } catch {
      setData(SAMPLE_LEADS);
      setIsSampleData(true);
    } finally {
      setIsLoading(false);
      setIsInitialized(true);
    }
  }, [api, loadFromApi]);

  const dismissSampleData = useCallback(() => {
    try { localStorage.setItem(SAMPLE_DATA_STORAGE_KEY, "false"); } catch {}
    setIsSampleData(false);
    setData((prev) => prev.filter((lead) => !String(lead.id).startsWith("lead_")));
  }, []);

  const restoreSampleData = useCallback(() => {
    try { localStorage.setItem(SAMPLE_DATA_STORAGE_KEY, "true"); } catch {}
    setIsSampleData(true);
    writeJSON(SAMPLE_DELETED_STORAGE_KEY, []);
    setData((prev) => {
      const imported = prev.filter((lead) => !String(lead.id).startsWith("lead_"));
      return [...getSampleLeads(), ...imported];
    });
  }, []);

  const refreshData = useCallback(() => {
    if (api) { loadFromApi(); return; }
    setIsLoading(true);
    setTimeout(() => {
      try {
        const importedLeads = JSON.parse(localStorage.getItem(IMPORTED_LEADS_STORAGE_KEY) || "[]");
        const safeImportedLeads = Array.isArray(importedLeads) ? importedLeads : [];
        setData((current) => {
          const sample = current.some((lead) => String(lead.id).startsWith("lead_")) ? getSampleLeads() : [];
          return [...sample, ...safeImportedLeads];
        });
      } catch {
        setData((current) => current);
      }
      setIsLoading(false);
    }, 400);
  }, [api, loadFromApi]);

  // options.updateExisting: merge rows whose phone already exists into that lead instead of skipping them.
  const addLeads = useCallback((incomingLeads = [], options = {}) => {
    if (!Array.isArray(incomingLeads) || incomingLeads.length === 0) return 0;
    let stored = [];
    try {
      stored = JSON.parse(localStorage.getItem(IMPORTED_LEADS_STORAGE_KEY) || "[]");
      if (!Array.isArray(stored)) stored = [];
    } catch {}
    // Duplicates match on phone number or email, per lead.
    const keysOf = (lead) => [
      String(lead.mobile_number || lead.phone || "").replace(/\D/g, "").slice(-10),
      String(lead.email || "").trim().toLowerCase(),
    ].filter((key) => key.length >= 5);
    const existingByKey = new Map();
    [...data, ...stored].forEach((lead) => keysOf(lead).forEach((key) => { if (!existingByKey.has(key)) existingByKey.set(key, lead); }));
    const seenKeys = new Set(existingByKey.keys());
    const patches = new Map();
    const uniqueIncoming = incomingLeads.filter((lead) => {
      const keys = keysOf(lead);
      const matchKey = keys.find((key) => seenKeys.has(key));
      if (matchKey) {
        const target = existingByKey.get(matchKey);
        if (options.updateExisting && target) {
          const { id, awaiting_first_touch, lead_owner, created_at, next_followup, ...fields } = lead;
          const patch = Object.fromEntries(Object.entries(fields).filter(([, value]) => value !== "" && value !== null && !(Array.isArray(value) && !value.length)));
          patches.set(target.id, { ...(patches.get(target.id) || {}), ...patch, last_updated: new Date().toISOString() });
        }
        return false;
      }
      keys.forEach((key) => seenKeys.add(key));
      return true;
    });
    if (!patches.size && uniqueIncoming.length === 0) return 0;
    if (api) {
      setData((prev) => [...prev.map((lead) => (patches.has(lead.id) ? { ...lead, ...patches.get(lead.id) } : lead)), ...uniqueIncoming]);
      patches.forEach((patch, id) => { const body = updatesToCustomerPatch(patch); if (body) customersApi.patch(id, body).catch(apiFailed("update a duplicate lead")); });
      // Swap each optimistic row for the saved record so it carries the server id.
      uniqueIncoming.forEach((lead) => {
        customersApi.create(leadToCustomerRequest(lead))
          .then((saved) => setData((prev) => prev.map((item) => (item.id === lead.id ? customerToLead(saved) : item))))
          .catch((createError) => { setData((prev) => prev.filter((item) => item.id !== lead.id)); apiFailed(`save ${lead.lead_name}`)(createError); });
      });
      return uniqueIncoming.length;
    }
    if (!patches.size) {
      // Keeps the import available in memory when browser storage is unavailable.
      writeJSON(IMPORTED_LEADS_STORAGE_KEY, [...stored, ...uniqueIncoming]);
      setData((prev) => [...prev, ...uniqueIncoming]);
      return uniqueIncoming.length;
    }
    setData((prev) => {
      const next = [...prev.map((lead) => (patches.has(lead.id) ? { ...lead, ...patches.get(lead.id) } : lead)), ...uniqueIncoming];
      writeJSON(IMPORTED_LEADS_STORAGE_KEY, next.filter((lead) => !isSampleId(lead.id)));
      patches.forEach((patch, id) => { if (isSampleId(id)) persistLeads(next, [id], patch); });
      return next;
    });
    return uniqueIncoming.length;
  }, [data, api]);

  const batchDeleteLeads = useCallback((leadIds = []) => {
    if (api) {
      setData((prev) => prev.filter((l) => !leadIds.includes(l.id)));
      Promise.all(leadIds.map((id) => customersApi.remove(id))).catch((deleteError) => { apiFailed("delete leads")(deleteError); loadFromApi(); });
      return;
    }
    setData((prev) => {
      const next = prev.filter((l) => !leadIds.includes(l.id));
      persistLeads(next, leadIds.filter(isSampleId));
      return next;
    });
  }, [api, loadFromApi]);

  const batchUpdateLeads = useCallback((leadIds = [], updates = {}) => {
    if (api) {
      setData((prev) => prev.map((l) => (leadIds.includes(l.id) ? { ...l, ...updates } : l)));
      const { lead_owner, ...rest } = updates;
      const requests = [];
      if (lead_owner?.id) requests.push(customersApi.bulkAssignSelected(leadIds, lead_owner.id));
      const patch = updatesToCustomerPatch(rest);
      if (patch) requests.push(...leadIds.map((id) => customersApi.patch(id, patch)));
      Promise.all(requests).catch((updateError) => { apiFailed("save changes")(updateError); loadFromApi(); });
      return;
    }
    setData((prev) => {
      const next = prev.map((l) => (leadIds.includes(l.id) ? { ...l, ...updates } : l));
      persistLeads(next, leadIds.filter(isSampleId), updates);
      return next;
    });
  }, [api, loadFromApi]);

  // Single lead from the Add/Edit form. Resolves with the saved lead.
  const createLead = useCallback(async (lead) => {
    if (api) {
      const saved = customerToLead(await customersApi.create(leadToCustomerRequest(lead)));
      setData((prev) => [saved, ...prev]);
      return saved;
    }
    const added = addLeads([lead]);
    if (!added) throw new Error("A lead with this phone number or email already exists");
    return lead;
  }, [api, addLeads]);

  return {
    data,
    isLoading,
    isInitialized,
    isSampleData,
    error,
    dataSource: api ? "api" : "local",
    createLead,
    dismissSampleData,
    restoreSampleData,
    refreshData,
    addLeads,
    batchDeleteLeads,
    batchUpdateLeads,
    setData,
  };
}
