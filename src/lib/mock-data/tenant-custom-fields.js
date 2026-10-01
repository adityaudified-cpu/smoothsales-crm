// Tenant Custom Fields configuration (Columns 58-63)
export const REAL_ESTATE_CUSTOM_FIELDS = [
  {
    key: "budget_range",
    label: "Budget Range",
    type: "select",
    options: ["₹25L – ₹50L", "₹50L – ₹1Cr", "₹1Cr – ₹2.5Cr", "₹2.5Cr+"],
  },
  {
    key: "preferred_service",
    label: "Preferred Service",
    type: "select",
    options: ["Turnkey Interior", "Modular Kitchen", "Full Renovation", "Architectural Design"],
  },
  {
    key: "project_stage",
    label: "Project Stage",
    type: "select",
    options: ["Pre-Launch", "Under Construction", "Ready to Move", "Occupancy Applied"],
  },
  {
    key: "project_type",
    label: "Project Type",
    type: "select",
    options: ["Residential", "Commercial", "Hospitality", "Retail"],
  },
  {
    key: "property_type",
    label: "Property Type",
    type: "select",
    options: ["Apartment / Flat", "Villa / Bungalow", "Plot / Land", "Penthouse", "Office Suite"],
  },
  {
    key: "site_location_preference",
    label: "Site Location Preference",
    type: "text",
  },
];

export const INTERIOR_DESIGN_CUSTOM_FIELDS = [
  {
    key: "space_type",
    label: "Space Type",
    type: "select",
    options: ["2 BHK", "3 BHK", "4 BHK / Villa", "Commercial Office", "Retail Store"],
  },
  {
    key: "project_budget",
    label: "Project Budget",
    type: "select",
    options: ["₹5L – ₹10L", "₹10L – ₹25L", "₹25L – ₹50L", "₹50L+"],
  },
  {
    key: "timeline",
    label: "Timeline",
    type: "select",
    options: ["Immediate (< 15 days)", "1 Month", "2–3 Months", "Flexible"],
  },
];

export function getTenantCustomFields(vertical = "real_estate") {
  if (vertical === "interior_design") {
    return INTERIOR_DESIGN_CUSTOM_FIELDS;
  }
  return REAL_ESTATE_CUSTOM_FIELDS;
}
