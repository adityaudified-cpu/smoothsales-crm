export const conditionFieldOptions = [
  "Source",
  "Page/Account",
  "Campaign",
  "Ad Set",
  "Ad/Creative",
  "Keyword",
  "Location",
  "Category",
  "Form",
  "Landing Page",
  "Tag",
];

export const allocationMethodOptions = [
  {
    value: "round_robin",
    label: "Sequential Round Robin",
    description: "Distributes leads one-by-one among active team members in rotation.",
  },
  {
    value: "fixed",
    label: "Fixed User Assignment",
    description: "Always routes matching leads to one specific person.",
  },
  {
    value: "workload",
    label: "Workload-Based",
    description: "Assigns to whichever eligible agent currently has the fewest active leads.",
  },
  {
    value: "capacity",
    label: "Availability & Capacity Limits",
    description: "Skips agents who are unavailable or already at their maximum lead capacity.",
  },
  {
    value: "pool",
    label: "Lead Pool (Fallback)",
    description: "If no agent is eligible, the lead is held in an unassigned pool for manual claim.",
  },
];

export const MOCK_DISTRIBUTION_RULES = [
  {
    id: "rule-1",
    name: "Jaipur Meta Leads → Jaipur Team",
    active: true,
    priority: 1,
    conditions: [
      { field: "Source", operator: "equals", value: "Meta Ads" },
      { field: "Campaign", operator: "equals", value: "Jaipur Interior" },
    ],
    logic: "AND",
    target: { type: "team", id: "team-jaipur", label: "Jaipur Sales Team" },
    allocationMethod: "round_robin",
  },
  {
    id: "rule-2",
    name: "High-Ticket Luxury Villa Inquiries → Direct Specialist",
    active: true,
    priority: 2,
    conditions: [
      { field: "Category", operator: "equals", value: "Luxury Villa" },
      { field: "Location", operator: "equals", value: "Jaipur" },
    ],
    logic: "AND",
    target: { type: "user", id: "usr_2", label: "Pooja Deshmukh" },
    allocationMethod: "fixed",
  },
  {
    id: "rule-3",
    name: "Omnichannel Immediate Capture → Capacity Routing",
    active: true,
    priority: 3,
    conditions: [
      { field: "Source", operator: "equals", value: "WhatsApp" },
      { field: "Source", operator: "equals", value: "Website Form" },
      { field: "Tag", operator: "equals", value: "Instant Callback" },
    ],
    logic: "OR",
    target: { type: "team", id: "team-inbound", label: "Inbound Velocity Team" },
    allocationMethod: "capacity",
  },
  {
    id: "rule-4",
    name: "IndiaMART & Justdial Inbound → SME Outbound",
    active: true,
    priority: 4,
    conditions: [
      { field: "Source", operator: "equals", value: "IndiaMART" },
      { field: "Source", operator: "equals", value: "Justdial" },
    ],
    logic: "OR",
    target: { type: "team", id: "team-sme", label: "SME Outbound Hub" },
    allocationMethod: "workload",
  },
];
