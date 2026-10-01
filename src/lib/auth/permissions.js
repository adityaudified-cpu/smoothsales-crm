/**
 * Central Role-Based Access Control (RBAC) definitions & permission helpers.
 * Fully API-ready: Matches standard backend permission payloads (e.g. JWT claims or user.permissions array).
 */

export const ROLES = {
  ADMIN: "Admin",
  MANAGER: "Manager",
  TEAM_LEADER: "Team Leader",
  SALES_USER: "Sales User",
  SUPER_ADMIN: "Super Admin",
  PARTNER: "Partner",
};

/**
 * Page-level route authorization matrix.
 * Defines which path prefixes each role is allowed to visit.
 */
export const ROLE_ROUTE_PERMISSIONS = {
  [ROLES.ADMIN]: [
    "/dashboard",
    "/leads",
    "/deals",
    "/pipelines",
    "/distribution-rules",
    "/teams",
    "/permissions",
    "/channels",
    "/partners",
    "/partner-onboarding",
    "/commission-ledger",
    "/integrations",
    "/reports",
    "/settings",
    "/billing",
  ],
  [ROLES.MANAGER]: [
    "/dashboard",
    "/leads",
    "/deals",
    "/pipelines",
    "/distribution-rules",
    "/teams",
    "/channels",
    "/partners",
    "/reports",
    "/settings",
  ],
  [ROLES.TEAM_LEADER]: [
    "/dashboard",
    "/leads",
    "/deals",
    "/pipelines",
    "/teams",
    "/reports",
    "/settings",
  ],
  [ROLES.SALES_USER]: [
    "/dashboard",
    "/leads",
    "/deals",
    "/settings",
  ],
  [ROLES.SUPER_ADMIN]: ["/admin"],
  [ROLES.PARTNER]: ["/portal"],
};

/**
 * Granular action-level permissions matrix.
 * Resource actions: 'view', 'create', 'edit', 'delete', 'reassign', 'export'.
 */
export const ROLE_ACTION_PERMISSIONS = {
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
    leads: ["view", "create", "edit", "reassign", "export"], // Cannot delete leads
    deals: ["view", "create", "edit", "export"],
    rules: ["view", "create", "edit"],
    teams: ["view", "edit"],
    permissions: [],
    channels: ["view"],
    settings: ["view"],
  },
  [ROLES.TEAM_LEADER]: {
    leads: ["view", "create", "edit", "reassign"], // Can reassign own team leads, cannot delete/export
    deals: ["view", "create", "edit"],
    rules: ["view"],
    teams: ["view"],
    permissions: [],
    channels: [],
    settings: ["view"],
  },
  [ROLES.SALES_USER]: {
    leads: ["view", "create", "edit"], // Can view and create/add dispositions, CANNOT delete or reassign
    deals: ["view", "create", "edit"],
    rules: [],
    teams: [],
    permissions: [],
    channels: [],
    settings: ["view"],
  },
};

/**
 * Check whether a user has permission to perform an action on a resource.
 * Example: can(user, 'delete', 'leads') -> returns false for Sales User, true for Admin.
 */
export function can(user, action, resource) {
  if (!user) return false;

  // 1. If user object has custom granular permissions from API (e.g. ['leads:create', 'leads:view'])
  if (Array.isArray(user.permissions) && user.permissions.length > 0) {
    const permKey = `${resource}:${action}`;
    const wildcardKey = `${resource}:*`;
    return (
      user.permissions.includes(permKey) ||
      user.permissions.includes(wildcardKey) ||
      user.permissions.includes("*")
    );
  }

  // 2. Role-based fallback
  const role = user.role || ROLES.SALES_USER;
  const resourceRules = ROLE_ACTION_PERMISSIONS[role]?.[resource];
  if (!resourceRules) return false;

  return resourceRules.includes(action) || resourceRules.includes("*");
}

/**
 * Check whether a user has access to a given pathname.
 */
export function hasRouteAccess(user, pathname) {
  if (!user) return false;

  const role = user.role || ROLES.SALES_USER;
  const allowedRoutes = ROLE_ROUTE_PERMISSIONS[role] || [];

  // Exact match or prefix match (e.g. /leads/new matches /leads)
  return allowedRoutes.some((route) => {
    if (pathname === route) return true;
    if (pathname.startsWith(`${route}/`)) return true;
    return false;
  });
}
