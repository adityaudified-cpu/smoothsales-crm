/**
 * Multi-tenant configuration for SmoothSales.ai
 * Provides tenant-configurable pipeline stages, dispositions, and custom field definitions.
 */

export const DEFAULT_PIPELINE_STAGES = [
  { id: "new", name: "New Lead", badgeClass: "bg-slate-900 text-slate-100 dark:bg-slate-100 dark:text-slate-900 border-slate-700", dotColor: "bg-blue-400" },
  { id: "contacted", name: "Contacted", badgeClass: "bg-blue-950 text-blue-200 border-blue-800", dotColor: "bg-blue-500" },
  { id: "qualified", name: "Qualified", badgeClass: "bg-emerald-950 text-emerald-200 border-emerald-800", dotColor: "bg-emerald-400" },
  { id: "meeting_scheduled", name: "Meeting Scheduled", badgeClass: "bg-purple-950 text-purple-200 border-purple-800", dotColor: "bg-purple-400" },
  { id: "proposal_sent", name: "Proposal Sent", badgeClass: "bg-amber-950 text-amber-200 border-amber-800", dotColor: "bg-amber-400" },
  { id: "deal_won", name: "Deal Won", badgeClass: "bg-green-950 text-green-200 border-green-800", dotColor: "bg-green-400" },
  { id: "lost", name: "Lost", badgeClass: "bg-zinc-900 text-zinc-200 border-zinc-700", dotColor: "bg-zinc-400" },
  { id: "disqualified", name: "Disqualified", badgeClass: "bg-rose-950 text-rose-200 border-rose-800", dotColor: "bg-rose-400" },
];

export const DEFAULT_DISPOSITIONS = [
  { id: "connected_interested", name: "Connected - Interested", type: "positive", badge: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { id: "connected_followup", name: "Connected - Call Later", type: "neutral", badge: "bg-amber-50 text-amber-700 border-amber-200" },
  { id: "ringing_no_response", name: "RNR (Ringing No Response)", type: "warning", badge: "bg-orange-50 text-orange-700 border-orange-200" },
  { id: "busy_switched_off", name: "Switched Off / Busy", type: "warning", badge: "bg-slate-100 text-slate-700 border-slate-200" },
  { id: "not_interested", name: "Not Interested", type: "negative", badge: "bg-rose-50 text-rose-700 border-rose-200" },
  { id: "budget_mismatch", name: "Budget Mismatch", type: "negative", badge: "bg-purple-50 text-purple-700 border-purple-200" },
  { id: "invalid_number", name: "Invalid Number", type: "negative", badge: "bg-red-50 text-red-700 border-red-200" },
];

/**
 * Tenant-defined custom fields system.
 * These are defined per tenant and appended as dynamic columns to the Leads table.
 */
export const DEFAULT_TENANT_CUSTOM_FIELDS = [
  {
    key: "budget_range",
    label: "Budget Range",
    type: "select",
    options: ["< ₹10 Lakhs", "₹10L - ₹25L", "₹25L - ₹50L", "₹50L - ₹1 Crore", "> ₹1 Crore"],
    group: "Meta & Custom",
    filterable: true,
    defaultVisible: true,
  },
  {
    key: "preferred_service",
    label: "Preferred Service",
    type: "select",
    options: ["Turnkey Interior", "Modular Kitchen", "Commercial Fitout", "Civil & Renovation", "Consultation Only"],
    group: "Meta & Custom",
    filterable: true,
    defaultVisible: true,
  },
  {
    key: "project_stage",
    label: "Project Stage",
    type: "select",
    options: ["Planning / Blueprint", "Possession in 1-3 Mos", "Possession Handed Over", "Renovation Underway"],
    group: "Meta & Custom",
    filterable: true,
    defaultVisible: false,
  },
  {
    key: "project_type",
    label: "Project Type",
    type: "select",
    options: ["Residential 3BHK", "Residential Villa", "Commercial Office", "Retail Showroom", "Studio Apartment"],
    group: "Meta & Custom",
    filterable: true,
    defaultVisible: false,
  },
  {
    key: "property_type",
    label: "Property Type",
    type: "select",
    options: ["Apartment", "Independent Villa", "Penthouse", "Duplex", "Commercial Complex"],
    group: "Meta & Custom",
    filterable: true,
    defaultVisible: false,
  },
  {
    key: "site_location_preference",
    label: "Site Location Preference",
    type: "text",
    options: [],
    group: "Meta & Custom",
    filterable: true,
    defaultVisible: false,
  },
];

export function getTenantPipelineStages() {
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem("smoothsales_tenant_pipeline_stages");
      if (stored) return JSON.parse(stored);
    } catch {}
  }
  return DEFAULT_PIPELINE_STAGES;
}

export function getTenantDispositions() {
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem("smoothsales_tenant_dispositions");
      if (stored) return JSON.parse(stored);
    } catch {}
  }
  return DEFAULT_DISPOSITIONS;
}

export function getTenantCustomFields() {
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem("smoothsales_tenant_custom_fields");
      if (stored) return JSON.parse(stored);
    } catch {}
  }
  return DEFAULT_TENANT_CUSTOM_FIELDS;
}
