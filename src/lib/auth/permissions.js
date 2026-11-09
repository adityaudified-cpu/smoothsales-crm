/**
 * SmoothSales CRM — Dynamic RBAC
 * Permission-based routing and access control.
 * Works for ALL roles (system + custom) based on user.permissions[] from JWT.
 * Falls back to static role-name matrix for demo/offline mode.
 */

// ─── Canonical role constants (match backend seeded role names exactly) ────────
export const ROLES = {
  ADMIN: "ADMIN",
  MANAGER: "BRANCH_HEAD",       // Branch Head
  TEAM_LEADER: "TEAM_LEADER",
  SALES_USER: "AGENT",
  SUPER_ADMIN: "SUPER_ADMIN",
  PARTNER: "PARTNER",
};

// Human-readable display labels for any role name
export const ROLE_LABELS = {
  ADMIN: "Admin",
  BRANCH_HEAD: "Branch Head",
  TEAM_LEADER: "Team Leader",
  AGENT: "Sales Agent",
  SUPER_ADMIN: "Super Admin",
  PARTNER: "Partner",
};

export function getRoleLabel(role = "") {
  const r = role.toUpperCase().replace("ROLE_", "");
  return ROLE_LABELS[r] || r.replace(/_/g, " ");
}

// Normalize any backend role string → canonical ROLES value
export function normalizeRole(role = "") {
  const r = role.toUpperCase().replace("ROLE_", "");
  if (r === "ADMIN") return ROLES.ADMIN;
  if (r === "BRANCH_HEAD" || r === "MANAGER") return ROLES.MANAGER;
  if (r === "TEAM_LEADER") return ROLES.TEAM_LEADER;
  if (r === "AGENT" || r === "SALES_USER") return ROLES.SALES_USER;
  return r || ROLES.SALES_USER; // pass-through for custom roles
}

// ─── Permission → Route mapping ────────────────────────────────────────────────
// This is the KEY to dynamic RBAC: routes are unlocked by PERMISSIONS, not role names.
// Any custom role that has USERS_VIEW permission automatically gets /teams access.
export const PERMISSION_ROUTE_MAP = {
  DASHBOARD_VIEW:   ["/dashboard"],
  MONITORING_VIEW:  ["/distribution-rules", "/forecasting"],

  // Leads & Customers — CUSTOMERS_VIEW or LEADS_VIEW unlocks the leads hub
  CUSTOMERS_VIEW:   [
    "/leads", "/leads/active", "/leads/worked", "/leads/customers",
    "/leads/businesses", "/leads/documents", "/leads/segments",
    "/leads/uploads", "/leads/distributions", "/contacts",
  ],
  LEADS_VIEW:       [
    "/leads", "/leads/active", "/leads/worked", "/leads/customers",
    "/leads/businesses", "/leads/documents", "/leads/segments",
    "/leads/uploads", "/leads/distributions",
  ],
  LEADS_ASSIGN:     ["/distribution-rules"],

  // Deals & Pipeline
  CUSTOMERS_EDIT:   ["/deals", "/pipelines"],

  // Activities (calls)
  CALLS_VIEW:       ["/activities"],

  // WhatsApp
  WHATSAPP_VIEW:    [
    "/whatsapp", "/whatsapp/chat", "/whatsapp/connect",
    "/whatsapp/campaigns", "/whatsapp/templates",
    "/whatsapp/ai-agent", "/whatsapp/automation",
  ],

  // Reports
  REPORTS_VIEW:     ["/reports", "/reports/caller-scorecard"],

  // User & Role management
  USERS_VIEW:       ["/teams"],
  ROLES_VIEW:       ["/permissions"],

  // Settings
  SETTINGS_VIEW:    [
    "/settings", "/settings/branding", "/settings/domain", "/settings/custom-fields",
  ],

  // Billing & Partners (admin-level, but permission-gated)
  SETTINGS_EDIT:    ["/billing"],

  // Always accessible to any authenticated user (no specific permission needed)
  _AUTHENTICATED:   [
    "/notifications", "/profile", "/channels", "/integrations",
    "/partners", "/partner-onboarding", "/commission-ledger",
  ],
};

// ─── Static fallback: role-name → allowed routes (for demo/offline mode) ───────
// Used ONLY when user.permissions array is empty (demo accounts, no backend).
const ROLE_ROUTE_FALLBACK = {
  [ROLES.ADMIN]: [
    "/dashboard", "/leads", "/contacts", "/deals", "/activities", "/forecasting",
    "/pipelines", "/distribution-rules", "/teams", "/permissions", "/channels",
    "/partners", "/partner-onboarding", "/commission-ledger", "/integrations",
    "/reports", "/whatsapp", "/notifications", "/profile", "/settings", "/billing",
  ],
  [ROLES.MANAGER]: [
    "/dashboard", "/leads", "/contacts", "/deals", "/activities", "/forecasting",
    "/pipelines", "/distribution-rules", "/teams", "/channels", "/partners",
    "/reports", "/whatsapp", "/notifications", "/profile", "/settings",
  ],
  [ROLES.TEAM_LEADER]: [
    "/dashboard", "/leads", "/contacts", "/deals", "/activities", "/pipelines",
    "/teams", "/reports", "/whatsapp", "/notifications", "/profile", "/settings",
  ],
  [ROLES.SALES_USER]: [
    "/dashboard", "/leads", "/contacts", "/deals", "/activities",
    "/whatsapp", "/notifications", "/profile", "/settings",
  ],
  [ROLES.SUPER_ADMIN]: ["/admin"],
  [ROLES.PARTNER]: ["/portal"],
};

// ─── Static fallback: role-name → action permissions ──────────────────────────
const ROLE_ACTION_FALLBACK = {
  [ROLES.ADMIN]: {
    leads: ["view", "create", "edit", "delete", "reassign", "export"],
    deals: ["view", "create", "edit", "delete", "export"],
    rules: ["view", "create", "edit", "delete"],
    teams: ["view", "create", "edit", "delete"],
    permissions: ["view", "edit"],
    channels: ["view", "create", "edit", "delete"],
    settings: ["view", "edit"],
  },
  [ROLES.MANAGER]: {
    leads: ["view", "create", "edit", "reassign", "export"],
    deals: ["view", "create", "edit", "export"],
    rules: ["view", "create", "edit"],
    teams: ["view", "edit"],
    permissions: [],
    channels: ["view"],
    settings: ["view"],
  },
  [ROLES.TEAM_LEADER]: {
    leads: ["view", "create", "edit", "reassign"],
    deals: ["view", "create", "edit"],
    rules: ["view"],
    teams: ["view"],
    permissions: [],
    channels: [],
    settings: ["view"],
  },
  [ROLES.SALES_USER]: {
    leads: ["view", "create", "edit"],
    deals: ["view", "create", "edit"],
    rules: [],
    teams: [],
    permissions: [],
    channels: [],
    settings: ["view"],
  },
};

// ─── Permission → action mapping (for can() with real permissions) ─────────────
const PERMISSION_ACTION_MAP = {
  "LEADS_VIEW":        { leads: "view" },
  "LEADS_CREATE":      { leads: "create" },
  "LEADS_EDIT":        { leads: "edit" },
  "LEADS_DELETE":      { leads: "delete" },
  "LEADS_ASSIGN":      { leads: "reassign" },
  "LEADS_IMPORT":      { leads: "export" },
  "CUSTOMERS_VIEW":    { leads: "view", deals: "view" },
  "CUSTOMERS_CREATE":  { leads: "create" },
  "CUSTOMERS_EDIT":    { leads: "edit", deals: "edit" },
  "CUSTOMERS_DELETE":  { leads: "delete" },
  "USERS_VIEW":        { teams: "view" },
  "USERS_CREATE":      { teams: "create" },
  "USERS_EDIT":        { teams: "edit" },
  "USERS_DELETE":      { teams: "delete" },
  "ROLES_VIEW":        { permissions: "view" },
  "ROLES_EDIT":        { permissions: "edit" },
  "SETTINGS_VIEW":     { settings: "view" },
  "SETTINGS_EDIT":     { settings: "edit" },
};

// ─── Core helpers ──────────────────────────────────────────────────────────────

/**
 * Check if a user has a specific permission string.
 * Works for both system roles (via static fallback) and custom roles (via permissions array).
 */
export function hasPermission(user, permission) {
  if (!user) return false;
  if (!permission) return true; // null permission = always accessible

  // 1. Use real permissions from JWT/API (works for ALL roles including custom)
  if (Array.isArray(user.permissions) && user.permissions.length > 0) {
    return user.permissions.includes(permission) || user.permissions.includes("*");
  }

  // 2. Fallback: derive from static role matrix (demo/offline mode)
  const role = normalizeRole(user.role || "");
  const fallbackRoutes = ROLE_ROUTE_FALLBACK[role] || [];
  const permRoutes = PERMISSION_ROUTE_MAP[permission] || [];
  // If any of the permission's routes are in the role's allowed routes, grant it
  return permRoutes.some((r) => fallbackRoutes.some((fr) => r === fr || r.startsWith(fr + "/")));
}

/**
 * Check whether a user has access to a given pathname.
 * PRIMARY: Uses user.permissions[] from JWT — works for ANY role including custom.
 * FALLBACK: Uses static role-name matrix when permissions array is empty.
 */
export function hasRouteAccess(user, pathname) {
  if (!user) return false;

  // Always allow profile and notifications for any authenticated user
  const alwaysAllowed = PERMISSION_ROUTE_MAP._AUTHENTICATED || [];
  if (alwaysAllowed.some((r) => pathname === r || pathname.startsWith(r + "/"))) {
    return true;
  }

  // 1. Permission-based check (works for system AND custom roles)
  if (Array.isArray(user.permissions) && user.permissions.length > 0) {
    for (const [perm, routes] of Object.entries(PERMISSION_ROUTE_MAP)) {
      if (perm === "_AUTHENTICATED") continue;
      if (!user.permissions.includes(perm)) continue;
      if (routes.some((r) => pathname === r || pathname.startsWith(r + "/"))) {
        return true;
      }
    }
    return false;
  }

  // 2. Static role-name fallback (demo/offline mode)
  const role = normalizeRole(user.role || "");
  const allowedRoutes = ROLE_ROUTE_FALLBACK[role] || [];
  return allowedRoutes.some((route) => pathname === route || pathname.startsWith(route + "/"));
}

/**
 * Check whether a user can perform an action on a resource.
 * PRIMARY: Uses user.permissions[] from JWT.
 * FALLBACK: Uses static role-action matrix.
 */
export function can(user, action, resource) {
  if (!user) return false;

  // 1. Real permissions from JWT
  if (Array.isArray(user.permissions) && user.permissions.length > 0) {
    // Check direct permission keys like "LEADS_CREATE", "LEADS_DELETE" etc.
    for (const [perm, mapping] of Object.entries(PERMISSION_ACTION_MAP)) {
      if (!user.permissions.includes(perm)) continue;
      if (mapping[resource] === action) return true;
    }
    // Also check wildcard
    return user.permissions.includes("*");
  }

  // 2. Static role fallback
  const role = normalizeRole(user.role || "");
  const resourceRules = ROLE_ACTION_FALLBACK[role]?.[resource];
  if (!resourceRules) return false;
  return resourceRules.includes(action) || resourceRules.includes("*");
}

/**
 * Get all routes accessible to a user (for programmatic use).
 */
export function getAccessibleRoutes(user) {
  if (!user) return [];

  const routes = new Set(PERMISSION_ROUTE_MAP._AUTHENTICATED || []);

  if (Array.isArray(user.permissions) && user.permissions.length > 0) {
    for (const [perm, permRoutes] of Object.entries(PERMISSION_ROUTE_MAP)) {
      if (perm === "_AUTHENTICATED") continue;
      if (user.permissions.includes(perm)) {
        permRoutes.forEach((r) => routes.add(r));
      }
    }
  } else {
    const role = normalizeRole(user.role || "");
    (ROLE_ROUTE_FALLBACK[role] || []).forEach((r) => routes.add(r));
  }

  return Array.from(routes);
}

// Keep these exports for backward compatibility
export const ROLE_ROUTE_PERMISSIONS = ROLE_ROUTE_FALLBACK;
export const ROLE_ACTION_PERMISSIONS = ROLE_ACTION_FALLBACK;
