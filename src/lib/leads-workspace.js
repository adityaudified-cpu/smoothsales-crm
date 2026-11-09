// Browser-side stores for Leads module features that have no API yet.
// Each export maps to one future endpoint, so swapping in the API later only touches this file.

export const IMPORT_HISTORY_STORAGE_KEY = "smoothsales_lead_import_history_v1";
export const REP_ROSTER_STORAGE_KEY = "smoothsales_rep_roster_v1";
export const ROUND_ROBIN_CURSOR_KEY = "smoothsales_round_robin_cursor_v1";

export const REP_STATUSES = ["Available", "On Break", "Offline"];
export const DEFAULT_DAILY_CAPACITY = 40;

// Workspace reps who can own leads, even before any lead is assigned to them.
export const DEFAULT_REPS = [
  { name: "Aarav Sharma", initials: "AS", role: "Sr. Account Exec" },
  { name: "Sneha Roy", initials: "SR", role: "Key Accounts" },
  { name: "Rohan Varma", initials: "RV", role: "Inside Sales" },
  { name: "Kavita Pillai", initials: "KP", role: "Field Sales" },
];

export const DOCUMENT_CATEGORIES = ["Quotation", "Floorplan", "KYC", "Receipt", "Agreement", "Voice Note", "Other"];

export const WHATSAPP_TEMPLATES = [
  { id: "studio_visit_invite", name: "Studio visit invite", body: "Hi {{lead_name}}, we would love to host you at our Experience Centre this week. Reply with a convenient day and time." },
  { id: "followup_check_in", name: "Follow-up check-in", body: "Hi {{lead_name}}, just checking in on your enquiry. Is now a good time for a quick call?" },
  { id: "festive_offer", name: "Festive offer", body: "Hi {{lead_name}}, our festive pricing is live until the end of the month. Shall I share the details for {{city}}?" },
];

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

export function getImportHistory() {
  const history = readJSON(IMPORT_HISTORY_STORAGE_KEY, []);
  return Array.isArray(history) ? history : [];
}

export function recordImportBatch(batch) {
  const entry = { id: `batch_${Date.now()}`, importedAt: new Date().toISOString(), importedBy: "You", ...batch };
  writeJSON(IMPORT_HISTORY_STORAGE_KEY, [entry, ...getImportHistory()].slice(0, 100));
  return entry;
}

export function fillTemplate(body, lead) {
  if (!lead || !body) return body || "";
  return body
    .replace(/\{\{lead_name\}\}/g, (lead.lead_name || lead.name || "there").split(" ")[0])
    .replace(/\{\{city\}\}/g, lead.city || "your city")
    .replace(/\{\{business\}\}/g, lead.business || "your company");
}

export function whatsappLink(phone, message) {
  const digits = String(phone || "").replace(/\D/g, "");
  const withCountry = digits.length === 10 ? `91${digits}` : digits;
  return `https://wa.me/${withCountry}?text=${encodeURIComponent(message)}`;
}

export function getRoundRobinCursor() {
  return Number(readJSON(ROUND_ROBIN_CURSOR_KEY, 0)) || 0;
}

export function setRoundRobinCursor(value) {
  writeJSON(ROUND_ROBIN_CURSOR_KEY, value);
}

export function leadsToCSV(leads, columns) {
  const escape = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
  const rows = leads.map((lead) => columns.map(([, read]) => escape(read(lead))).join(","));
  return "﻿" + [columns.map(([label]) => escape(label)).join(","), ...rows].join("\r\n");
}

export const LEAD_EXPORT_COLUMNS = [
  ["Lead Name", (lead) => lead.lead_name || lead.name],
  ["Mobile", (lead) => lead.mobile_number || lead.phone],
  ["Email", (lead) => lead.email],
  ["City", (lead) => lead.city],
  ["Business", (lead) => lead.business],
  ["Stage", (lead) => lead.lead_stage],
  ["Source", (lead) => lead.lead_source],
  ["Priority", (lead) => lead.lead_priority],
  ["Owner", (lead) => lead.lead_owner?.name || "Unassigned"],
  ["Last Remark", (lead) => lead.last_user_remark],
];

// Midpoint of the lead's budget band, used until deals carry an explicit value.
const BUDGET_MIDPOINTS = [
  [/<\s*₹?\s*10\s*l/i, 500000],
  [/10\s*l\s*-\s*₹?\s*25\s*l/i, 1750000],
  [/25\s*l\s*-\s*₹?\s*50\s*l/i, 3750000],
  [/50\s*l\s*-\s*₹?\s*1\s*cr/i, 7500000],
  [/>\s*₹?\s*1\s*cr/i, 10000000],
];

export function estimateDealValue(lead) {
  const explicit = Number(lead?.dealValueINR || lead?.deal_value);
  if (explicit > 0) return explicit;
  const band = String(lead?.budget_range || "");
  return BUDGET_MIDPOINTS.find(([pattern]) => pattern.test(band))?.[1] || 0;
}

// Salesmax lifecycle: New lead → Prospecting → Opportunity → Closed.
export const LIFECYCLES = ["New lead", "Prospecting", "Opportunity", "Closed"];
export const LIFECYCLE_STYLES = {
  "New lead": "bg-sky-500/10 text-sky-700 border-sky-500/25 dark:text-sky-300",
  Prospecting: "bg-amber-500/10 text-amber-700 border-amber-500/25 dark:text-amber-300",
  Opportunity: "bg-purple-500/10 text-purple-700 border-purple-500/25 dark:text-purple-300",
  Closed: "bg-muted text-muted-foreground border-border",
};

export function lifecycleOf(lead) {
  const stage = String(lead?.lead_stage || "").toLowerCase();
  if (/won|lost|disqualif|not interested|closed|junk/.test(stage)) return "Closed";
  if (/qualif|propos|negotiat|opportunit/.test(stage)) return "Opportunity";
  if (/contact|meet|visit|follow|prospect/.test(stage)) return "Prospecting";
  return "New lead";
}

// Post-call dispositions; `patch` returns the lead fields each outcome writes.
export const DISPOSITIONS = [
  { id: "interested", label: "Interested", tone: "emerald", connected: true, disposition: "Connected - Interested", outcome: "Connected" },
  { id: "callback", label: "Callback", tone: "sky", connected: true, disposition: "Connected - Callback Requested", outcome: "Connected", needsCallback: true },
  { id: "no_answer", label: "No answer", tone: "amber", connected: false, disposition: "RNR", outcome: "No answer" },
  { id: "busy", label: "Busy", tone: "amber", connected: false, disposition: "Busy", outcome: "Busy" },
  { id: "not_reachable", label: "Not reachable", tone: "amber", connected: false, disposition: "Not Reachable", outcome: "Not reachable" },
  { id: "not_interested", label: "Not interested", tone: "rose", connected: true, disposition: "Not Interested", outcome: "Connected", closesAs: "Lost" },
  { id: "invalid", label: "Invalid number", tone: "rose", connected: false, disposition: "Invalid Number", outcome: "Invalid", closesAs: "Disqualified" },
];

const DAY = 24 * 60 * 60 * 1000;
const isSameDay = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
const touchedAt = (lead) => new Date(lead.last_worked || lead.last_updated || lead.created_at || 0);
const isUntouched = (lead) => lead.awaiting_first_touch === "YES" || lead.awaiting_first_touch === true || (!Number(lead.attempts) && !lead.last_worked);

// Manager attention queues: each count opens the exact leads behind it.
export const ATTENTION_QUEUES = [
  { id: "untouched", label: "Untouched new", hint: "No call attempt yet", tone: "amber", test: (lead) => isUntouched(lead) && lifecycleOf(lead) !== "Closed" },
  { id: "due_today", label: "Callbacks due today", hint: "Follow-up later today", tone: "sky", test: (lead, now) => { const due = lead.next_followup && new Date(lead.next_followup); return Boolean(due) && due >= now && isSameDay(due, now); } },
  { id: "overdue", label: "Overdue follow-ups", hint: "Promised time has passed", tone: "rose", test: (lead, now) => Boolean(lead.next_followup) && new Date(lead.next_followup) < now },
  { id: "not_connected", label: "Not connected yet", hint: "Dialed, never answered", tone: "orange", test: (lead) => Number(lead.attempts) > 0 && lead.last_call_outcome && lead.last_call_outcome !== "Connected" && lifecycleOf(lead) !== "Closed" },
  { id: "neglected", label: "Neglected 7d+", hint: "Open lead, no activity in 7 days", tone: "slate", test: (lead, now) => lifecycleOf(lead) !== "Closed" && !isUntouched(lead) && now - touchedAt(lead) > 7 * DAY },
  { id: "high_intent", label: "High intent", hint: "Priority 4★ or above", tone: "emerald", test: (lead) => Number(lead.lead_priority) >= 4 && lifecycleOf(lead) !== "Closed" },
];

export function matchesAttentionQueue(lead, queueId, now = new Date()) {
  const queue = ATTENTION_QUEUES.find((item) => item.id === queueId);
  return queue ? Boolean(queue.test(lead, now)) : true;
}

export const TIMELINE_KEY_PREFIX = "smoothsales_lead_timeline_";

// Gathers activities logged on Lead Details pages across all leads, newest first.
export function collectRecentActivities(limit = 50) {
  const items = [];
  try {
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      if (!key?.startsWith(TIMELINE_KEY_PREFIX)) continue;
      const leadId = key.slice(TIMELINE_KEY_PREFIX.length);
      const events = JSON.parse(localStorage.getItem(key) || "[]");
      if (Array.isArray(events)) events.forEach((event) => items.push({ ...event, leadId }));
    }
  } catch {
    return [];
  }
  return items.sort((a, b) => new Date(b.at || 0) - new Date(a.at || 0)).slice(0, limit);
}

// Reps that should receive round-robin leads right now (Available and in rotation).
export function getRotationReps() {
  const roster = readJSON(REP_ROSTER_STORAGE_KEY, {});
  return DEFAULT_REPS.filter((rep) => {
    const config = roster?.[rep.name] || {};
    return (config.status || "Available") === "Available" && config.inRotation !== false;
  });
}
