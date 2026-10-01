/**
 * SmoothSales.ai Vertical-Aware Qualification Fields Mock Data
 * Demonstrates AI-tailoring of qualification fields based on business context.
 */

export const QUALIFICATION_TEMPLATES = {
  interior_design: [
    {
      id: "qf_project_scope",
      label: "Project Scope",
      type: "option",
      options: ["Full Home Turnkey", "Modular Kitchen & Living", "Renovation", "Commercial Office"],
      required: true,
    },
    {
      id: "qf_carpet_area",
      label: "Carpet Area (sq. ft.)",
      type: "number",
      options: [],
      required: true,
    },
    {
      id: "qf_budget_range",
      label: "Estimated Budget Range",
      type: "option",
      options: ["₹5L – ₹15L", "₹15L – ₹30L", "₹30L – ₹50L", "₹50L+"],
      required: true,
    },
    {
      id: "qf_possession_date",
      label: "Target Possession Date",
      type: "text",
      options: [],
      required: false,
    },
    {
      id: "qf_site_location",
      label: "Property Location / Society",
      type: "text",
      options: [],
      required: false,
    },
  ],
  real_estate: [
    {
      id: "qf_property_type",
      label: "Property Type Interest",
      type: "option",
      options: ["2 BHK Luxury", "3 BHK Premium", "4 BHK / Penthouse", "Plot / Villa"],
      required: true,
    },
    {
      id: "qf_budget_re",
      label: "Budget Range",
      type: "option",
      options: ["₹45L – ₹80L", "₹80L – ₹1.5 Cr", "₹1.5 Cr – ₹3 Cr", "₹3 Cr+"],
      required: true,
    },
    {
      id: "qf_location_re",
      label: "Preferred Micro-Location",
      type: "text",
      options: [],
      required: true,
    },
    {
      id: "qf_timeline_re",
      label: "Purchase Timeline",
      type: "option",
      options: ["Immediate (< 30 days)", "1 – 3 Months", "3 – 6 Months", "Investment Only"],
      required: true,
    },
    {
      id: "qf_funding_mode",
      label: "Financing Requirement",
      type: "option",
      options: ["Home Loan Required", "Self-Funded", "Assistance Needed"],
      required: false,
    },
  ],
  education: [
    {
      id: "qf_course_interest",
      label: "Program / Course Interest",
      type: "option",
      options: ["Full Stack Development", "Data Science & AI", "Product Management", "Executive MBA"],
      required: true,
    },
    {
      id: "qf_learning_mode",
      label: "Preferred Learning Mode",
      type: "option",
      options: ["Weekend Live Cohort", "Weekday Evening", "Self-Paced with Mentorship"],
      required: true,
    },
    {
      id: "qf_experience_lvl",
      label: "Current Experience Level",
      type: "option",
      options: ["College Final Year", "0–2 Years Working", "3–5 Years Working", "Career Switcher"],
      required: true,
    },
    {
      id: "qf_batch_timeline",
      label: "Target Batch Start",
      type: "option",
      options: ["Next Upcoming Cohort", "Next Month", "Exploratory Phase"],
      required: false,
    },
  ],
};

export function getQualificationFields(verticalOrDescription = "") {
  const text = String(verticalOrDescription).toLowerCase();
  if (text.includes("edu") || text.includes("course") || text.includes("student") || text.includes("tech academy") || text.includes("train")) {
    return JSON.parse(JSON.stringify(QUALIFICATION_TEMPLATES.education));
  }
  if (text.includes("real") || text.includes("estate") || text.includes("flat") || text.includes("apartment") || text.includes("builder") || text.includes("property")) {
    return JSON.parse(JSON.stringify(QUALIFICATION_TEMPLATES.real_estate));
  }
  // Default to interior design / turnkey
  return JSON.parse(JSON.stringify(QUALIFICATION_TEMPLATES.interior_design));
}
