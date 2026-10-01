export const VISIBILITY_SCOPE_OPTIONS = [
  { value: "own_leads", label: "Only Own Leads", description: "User can only view leads directly assigned to them." },
  { value: "team_leads", label: "Team's Leads", description: "User can view all leads assigned to members of their designated team." },
  { value: "assigned_teams", label: "Assigned Teams' Leads", description: "User can view leads across specifically assigned multiple teams or branches." },
  { value: "all_department", label: "All Department Leads", description: "User can view leads belonging to their entire functional department." },
  { value: "all_leads", label: "All Leads", description: "Full visibility across all tenant leads regardless of owner or team." },
  { value: "custom", label: "Custom Scope", description: "Dynamic tag-based and branch-filtered visibility rules." },
];

export const REASSIGNMENT_PERMISSION_OPTIONS = [
  { value: "none", label: "Cannot Reassign", description: "Leads cannot be reassigned; ownership is locked to original round-robin." },
  { value: "own_team_only", label: "Own Team Only", description: "Can reassign leads exclusively among colleagues in the same team." },
  { value: "assigned_teams", label: "Assigned Teams", description: "Can distribute and reassign leads across managed sub-teams." },
  { value: "any_user", label: "Any User", description: "Unrestricted reassignment rights to any user or broker across the tenant." },
];

export const MOCK_ROLE_PERMISSIONS = [
  {
    role: "Admin",
    title: "Tenant Administrator",
    description: "Full system administrative control, tenant settings, billing, and organizational visibility.",
    visibilityScope: "all_leads",
    reassignmentPermission: "any_user",
    isLocked: true,
    userCount: 2,
  },
  {
    role: "Manager",
    title: "Regional Sales Director / Manager",
    description: "Supervises multi-branch teams, overrides round-robin fallbacks, and monitors SLA escalations.",
    visibilityScope: "all_department",
    reassignmentPermission: "assigned_teams",
    isLocked: false,
    userCount: 4,
  },
  {
    role: "Team Leader",
    title: "Floor Team Leader",
    description: "Direct team manager monitoring telecaller daily call quotas and live pipeline stages.",
    visibilityScope: "team_leads",
    reassignmentPermission: "own_team_only",
    isLocked: false,
    userCount: 8,
  },
  {
    role: "Sales User",
    title: "Inside Sales Rep / Telecaller",
    description: "Frontline agent executing calling queues, disposition updates, and site visit scheduling.",
    visibilityScope: "own_leads",
    reassignmentPermission: "none",
    isLocked: false,
    userCount: 26,
  },
];
