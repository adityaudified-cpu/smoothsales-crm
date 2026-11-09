// Translates between the frontend lead shape and the backend Customer DTOs
// (CustomerResponse / CustomerRequest / CustomerPatchRequest in Smoothsales-crm-backend).

// Frontend stage name ↔ Customer.LeadStage
export const STAGE_TO_API = {
  "New Lead": "NEW",
  New: "NEW",
  Contacted: "CONTACTED",
  Qualified: "QUALIFIED",
  "Meeting Scheduled": "SITE_VISIT_SCHEDULED",
  "Site Visit Done": "SITE_VISIT_DONE",
  "Proposal Sent": "NEGOTIATION",
  Negotiation: "NEGOTIATION",
  "Deal Won": "BOOKED",
  Lost: "LOST",
  "Not Interested": "LOST",
  Disqualified: "JUNK",
};
export const STAGE_FROM_API = {
  NEW: "New Lead",
  CONTACTED: "Contacted",
  QUALIFIED: "Qualified",
  SITE_VISIT_SCHEDULED: "Meeting Scheduled",
  SITE_VISIT_DONE: "Site Visit Done",
  NEGOTIATION: "Proposal Sent",
  BOOKED: "Deal Won",
  LOST: "Lost",
  JUNK: "Disqualified",
};

// Frontend source label ↔ Customer.LeadSource; labels with no enum go to OTHER + sourceDetail.
export const SOURCE_TO_API = {
  Manual: "MANUAL",
  "CSV Upload": "MANUAL",
  "Meta Ads": "META_LEAD_AD",
  Facebook: "FACEBOOK_AD",
  "Facebook Ads": "FACEBOOK_AD",
  Google: "GOOGLE",
  "Google Ads": "GOOGLE_AD",
  Website: "WEBSITE",
  LinkedIn: "LINKEDIN",
  WhatsApp: "WHATSAPP_CTWA",
  "WhatsApp Campaign": "WHATSAPP_CAMPAIGN",
  "Call Campaign": "CALL_CAMPAIGN",
  "99acres": "PORTAL_99ACRES",
  MagicBricks: "PORTAL_MAGICBRICKS",
  "Housing.com": "PORTAL_HOUSING",
  Referral: "REFERRAL",
  "Walk-in": "WALK_IN",
};
export const SOURCE_FROM_API = Object.fromEntries(Object.entries(SOURCE_TO_API).reverse().map(([label, value]) => [value, label]));
SOURCE_FROM_API.MANUAL = "Manual";
SOURCE_FROM_API.OTHER = "Other";

export const LEAD_SOURCE_OPTIONS = ["Manual", "Meta Ads", "Google Ads", "Website", "IndiaMART", "JustDial", "WhatsApp", "Referral", "Walk-in", "99acres", "MagicBricks", "Housing.com", "LinkedIn", "Other"];

// Priority: 1–5 stars ↔ HIGH | MEDIUM | LOW
export const priorityToApi = (stars) => (Number(stars) >= 4 ? "HIGH" : Number(stars) === 3 ? "MEDIUM" : Number(stars) > 0 ? "LOW" : null);
export const priorityFromApi = (value) => ({ HIGH: 5, MEDIUM: 3, LOW: 2 })[String(value || "").toUpperCase()] || 3;

export function splitName(fullName = "") {
  const parts = String(fullName).trim().split(/\s+/);
  return { firstName: parts[0] || "", lastName: parts.slice(1).join(" ") || null };
}

const toDateOnly = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
};

const initialsOf = (name = "") => name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();

// CustomerResponse → lead used across the Leads pages
export function customerToLead(customer) {
  const name = customer.fullName || [customer.firstName, customer.lastName].filter(Boolean).join(" ");
  const source = customer.source === "OTHER" && customer.sourceDetail ? customer.sourceDetail : SOURCE_FROM_API[customer.source] || customer.source || "Manual";
  return {
    id: customer.id,
    lead_name: name,
    name,
    first_name: customer.firstName,
    last_name: customer.lastName,
    mobile_number: customer.phone || "",
    phone: customer.phone || "",
    alternate_phone: customer.alternatePhone || "",
    email: customer.email || "",
    business: customer.company || "",
    city: customer.preferredLocation || "",
    lead_stage: STAGE_FROM_API[customer.stage] || customer.stage || "New Lead",
    lead_status: customer.status,
    lead_source: source,
    source_level_2: customer.campaignName || customer.sourceDetail || "",
    source_level_3: customer.formName || customer.pageName || "",
    lead_owner: customer.assignedStaffId ? { id: customer.assignedStaffId, name: customer.assignedStaffName || "Assigned", initials: initialsOf(customer.assignedStaffName || "") } : null,
    lead_priority: priorityFromApi(customer.priority),
    budget_range: customer.budget || "",
    budget_min: customer.budgetMin,
    budget_max: customer.budgetMax,
    preferred_service: customer.propertyInterest || "",
    next_followup: customer.nextEligibleCallAt || (customer.followUpDate ? `${customer.followUpDate}T10:00:00` : null),
    last_user_remark: customer.notes || "",
    attempts: customer.totalCalls || 0,
    awaiting_first_touch: customer.totalCalls ? "NO" : "YES",
    dealValueINR: customer.totalValue || 0,
    last_worked: customer.lastInteraction || null,
    created_at: customer.createdAt,
    started_work_on: customer.createdAt,
    last_updated: customer.updatedAt,
    dnd_registered: Boolean(customer.dndRegistered),
    whatsapp_consent: customer.whatsappConsent !== false,
    call_consent: customer.callConsent !== false,
    email_consent: Boolean(customer.emailConsent),
    occurrence_count: customer.occurrenceCount,
    tags: [],
  };
}

// Lead (create form or import row) → CustomerRequest
export function leadToCustomerRequest(lead) {
  const { firstName, lastName } = splitName(lead.lead_name || lead.name);
  const sourceEnum = SOURCE_TO_API[lead.lead_source];
  return {
    firstName,
    lastName,
    phone: lead.mobile_number || lead.phone || null,
    alternatePhone: lead.alternate_phone || null,
    email: lead.email || null,
    company: lead.business || null,
    stage: STAGE_TO_API[lead.lead_stage] || "NEW",
    source: sourceEnum || (lead.lead_source ? "OTHER" : "MANUAL"),
    sourceDetail: sourceEnum ? lead.source_level_2 || null : lead.lead_source || null,
    assignedStaffId: lead.lead_owner?.id || null,
    whatsappConsent: lead.whatsapp_consent !== false,
    callConsent: lead.call_consent !== false,
    propertyInterest: lead.preferred_service || null,
    budgetMin: lead.budget_min ?? null,
    budgetMax: lead.budget_max ?? null,
    preferredLocation: lead.city || null,
    followUpDate: toDateOnly(lead.next_followup),
    notes: lead.last_user_remark || lead.notes || null,
    priority: priorityToApi(lead.lead_priority),
    totalValue: lead.dealValueINR || null,
  };
}

// Partial lead updates → CustomerPatchRequest. Returns null when nothing maps to the backend.
export function updatesToCustomerPatch(updates) {
  const patch = {};
  if ("lead_name" in updates) Object.assign(patch, splitName(updates.lead_name));
  if ("mobile_number" in updates) patch.phone = updates.mobile_number || null;
  if ("alternate_phone" in updates) patch.alternatePhone = updates.alternate_phone || null;
  if ("email" in updates) patch.email = updates.email || null;
  if ("business" in updates) patch.company = updates.business || null;
  if ("lead_stage" in updates) patch.stage = STAGE_TO_API[updates.lead_stage] || null;
  if ("lead_status" in updates) patch.status = updates.lead_status;
  if ("lead_owner" in updates && updates.lead_owner?.id) patch.assignedStaffId = updates.lead_owner.id;
  if ("dealValueINR" in updates) patch.totalValue = updates.dealValueINR;
  if ("preferred_service" in updates) patch.propertyInterest = updates.preferred_service || null;
  if ("lead_priority" in updates) patch.priority = priorityToApi(updates.lead_priority);
  if ("last_user_remark" in updates) patch.notes = updates.last_user_remark || null;
  return Object.keys(patch).length ? patch : null;
}

// Frontend disposition id → CallDisposition.DispositionOutcome
export const DISPOSITION_TO_API = {
  interested: "INTERESTED",
  callback: "CALLBACK_REQUESTED",
  no_answer: "NOT_REACHABLE",
  busy: "BUSY_ASKED_LATER",
  not_reachable: "NOT_REACHABLE",
  not_interested: "NOT_INTERESTED",
  invalid: "WRONG_NUMBER",
};
