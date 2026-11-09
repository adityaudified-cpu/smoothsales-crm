# SmoothSales CRM — Dynamic RBAC & Multi-Tenant SaaS Architecture
## Deep Research, Audit & Implementation Plan

---

## 1. CURRENT STATE AUDIT

### 1.1 Backend Role System (Spring Boot)

**DB Tables:**
- `roles` — id, name (UNIQUE), description, require2fa, permissions (via role_permissions)
- `role_permissions` — role_id, permission (composite PK)
- `user_roles` — user_id, role_id (many-to-many)
- `users` — has reports_to_id (self-referential FK for hierarchy)

**Seeded System Roles (V1 + V26 migrations):**
| Role Name    | Description                          | Hierarchy Level |
|--------------|--------------------------------------|-----------------|
| ADMIN        | Full system access                   | 0 (top)         |
| BRANCH_HEAD  | Branch management + team oversight   | 1               |
| TEAM_LEADER  | Team management + campaign execution | 2               |
| AGENT        | Customer interaction + calling       | 3 (leaf)        |

**Permission Constants (30 total in PermissionConstants.java):**
- DASHBOARD_VIEW, MONITORING_VIEW
- CUSTOMERS_VIEW/CREATE/EDIT/DELETE
- LEADS_VIEW/CREATE/EDIT/DELETE/ASSIGN/IMPORT/SYNC_META
- CAMPAIGNS_VIEW/CREATE/MANAGE
- CALLS_VIEW/MANAGE
- WHATSAPP_VIEW/SEND/MANAGE
- REMINDERS_VIEW/MANAGE, DOCUMENTS_VIEW/MANAGE
- REPORTS_VIEW
- USERS_VIEW/CREATE/EDIT, ROLES_VIEW/CREATE/EDIT/DELETE
- SETTINGS_VIEW/EDIT

**Hierarchy Logic (UserService.java):**
- ADMIN → sees ALL users/leads (no filter)
- BRANCH_HEAD → sees self + direct TL reports + their agents (2 levels deep)
- TEAM_LEADER → sees self + direct agent reports (1 level deep)
- AGENT → sees only self

**UserPrincipal.java helpers:**
- `isAdmin()` → checks ROLE_ADMIN authority
- `isBranchHead()` → checks ROLE_BRANCH_HEAD or ROLE_MANAGER
- `isTeamLeader()` → checks ROLE_TEAM_LEADER
- `isAgent()` → not admin/BH/TL

### 1.2 Frontend RBAC System

**Current permissions.js:**
- ROLES constants now match backend: ADMIN="ADMIN", MANAGER="BRANCH_HEAD", TEAM_LEADER="TEAM_LEADER", SALES_USER="AGENT"
- ROLE_ROUTE_PERMISSIONS — static route access matrix per role
- ROLE_ACTION_PERMISSIONS — static action matrix per role
- `hasRouteAccess(user, pathname)` — checks route access
- `can(user, action, resource)` — checks action permission (uses user.permissions array from JWT if present, falls back to static matrix)
- `normalizeRole(role)` — normalizes any backend role string to canonical ROLES value

**CRITICAL ISSUE IDENTIFIED:**
The current system uses a STATIC permission matrix in `permissions.js`. This means:
1. If an admin creates a custom role (e.g. "FIELD_AGENT") with custom permissions via the Permissions page, those permissions are stored in DB but the frontend RBAC still uses the hardcoded static matrix.
2. The `can()` function DOES check `user.permissions` array first (from JWT/API), so granular permissions work IF they are in the JWT.
3. BUT `hasRouteAccess()` only checks the static ROLE_ROUTE_PERMISSIONS matrix — custom roles get NO route access.

---

## 2. SAAS MULTI-TENANT REQUIREMENTS ANALYSIS

### 2.1 What Different Companies Need

**Company Type A: Flat Structure (e.g. small startup, 5-10 agents)**
- No hierarchy needed
- All agents see all leads
- Simple: ADMIN + AGENT roles only
- `hierarchyEnabled: false`

**Company Type B: Team-Based (e.g. mid-size, 20-50 agents)**
- ADMIN → TEAM_LEADER → AGENT
- TL sees only their team's leads
- `hierarchyEnabled: true`, `hierarchyDepth: 2`

**Company Type C: Branch-Based (e.g. large real estate, 50-200 agents)**
- ADMIN → BRANCH_HEAD → TEAM_LEADER → AGENT
- Full 3-level hierarchy
- `hierarchyEnabled: true`, `hierarchyDepth: 3`

**Company Type D: Custom Roles (e.g. enterprise)**
- Custom roles like "Field Agent", "Inside Sales", "Pre-Sales"
- Each with custom permission sets
- Dynamic route access based on permissions, not role name

### 2.2 What Needs to Be Dynamic

| Feature                    | Current State        | Required State              |
|----------------------------|----------------------|-----------------------------|
| Route access               | Static per role name | Dynamic from permissions    |
| Action permissions         | Static per role name | Dynamic from permissions    |
| Hierarchy enforcement      | Always on            | Configurable per tenant     |
| Role names                 | Fixed 4 roles        | Custom roles supported      |
| Sidebar nav items          | Static filter        | Permission-based filter      |
| Lead visibility scope      | Role-based hierarchy | Configurable (flat/hierarchy)|

---

## 3. ARCHITECTURE DECISIONS

### 3.1 Permission-to-Route Mapping (Frontend)

Instead of role-name-based route access, map PERMISSIONS to routes:

```
DASHBOARD_VIEW     → /dashboard
CUSTOMERS_VIEW     → /leads, /contacts
LEADS_VIEW         → /leads
CAMPAIGNS_VIEW     → /whatsapp/campaigns
CALLS_VIEW         → /activities
REPORTS_VIEW       → /reports
USERS_VIEW         → /teams
ROLES_VIEW         → /permissions
SETTINGS_VIEW      → /settings
SETTINGS_EDIT      → /settings/branding, /settings/domain, /settings/custom-fields
WHATSAPP_VIEW      → /whatsapp
MONITORING_VIEW    → /distribution-rules, /forecasting
```

This way:
- Custom roles with USERS_VIEW permission automatically get /teams access
- No hardcoded role names needed in route checks
- Works for any number of custom roles

### 3.2 Hierarchy Configuration

Add `hierarchyMode` to tenant/user context:
- `FLAT` — all users see all leads (no reports_to filtering)
- `HIERARCHICAL` — standard reports_to chain filtering

Backend: `GET /settings/hierarchy` → `{ hierarchyMode: "FLAT" | "HIERARCHICAL" }`
Frontend: Context reads this setting and passes to lead queries

### 3.3 Dynamic Sidebar

Sidebar items filtered by `user.permissions` array (from JWT), not role name.
Each nav item gets a `requiredPermission` field.

---

## 4. IMPLEMENTATION PLAN

### Phase 1: Frontend — Permission-Based RBAC (No Backend Changes)
1. Update `permissions.js` — add PERMISSION_ROUTE_MAP, update hasRouteAccess to use permissions
2. Update `sidebar.jsx` — add requiredPermission to each nav item, filter by permissions
3. Update `layout.js` — use permission-based access check
4. Update `auth-context.jsx` — ensure permissions array is always populated

### Phase 2: Backend — Tenant Settings API
1. Add `TenantSettings` entity with `hierarchyMode` field
2. Add `GET/PUT /settings/tenant` endpoint
3. Update `UserService.getAccessibleStaffIds()` to respect hierarchyMode

### Phase 3: Frontend — Hierarchy Mode UI
1. Add hierarchy toggle to Settings page
2. Update teams page to show hierarchy tree when enabled
3. Update lead queries to pass hierarchy context

### Phase 4: DB Migration
1. V30 — Add tenant_settings table
2. V31 — Add hierarchy_mode column to tenant_settings

---

## 5. PERMISSION → ROUTE MAPPING (Complete)

```javascript
export const PERMISSION_ROUTE_MAP = {
  // Dashboard
  "DASHBOARD_VIEW":    ["/dashboard"],
  "MONITORING_VIEW":   ["/distribution-rules", "/forecasting"],
  
  // Leads & Customers
  "CUSTOMERS_VIEW":    ["/leads", "/contacts", "/leads/active", "/leads/worked", 
                        "/leads/customers", "/leads/businesses", "/leads/documents",
                        "/leads/segments", "/leads/uploads", "/leads/distributions"],
  "LEADS_VIEW":        ["/leads", "/leads/active", "/leads/worked"],
  "LEADS_ASSIGN":      ["/distribution-rules"],
  
  // Deals & Pipeline
  "CUSTOMERS_EDIT":    ["/deals", "/pipelines"],
  
  // Activities
  "CALLS_VIEW":        ["/activities"],
  
  // WhatsApp
  "WHATSAPP_VIEW":     ["/whatsapp", "/whatsapp/chat", "/whatsapp/connect",
                        "/whatsapp/campaigns", "/whatsapp/templates",
                        "/whatsapp/ai-agent", "/whatsapp/automation"],
  
  // Reports
  "REPORTS_VIEW":      ["/reports", "/reports/caller-scorecard"],
  
  // Users & Roles
  "USERS_VIEW":        ["/teams"],
  "ROLES_VIEW":        ["/permissions"],
  
  // Settings
  "SETTINGS_VIEW":     ["/settings", "/settings/branding", "/settings/domain",
                        "/settings/custom-fields"],
  
  // Notifications (all authenticated users)
  "_AUTHENTICATED":    ["/notifications", "/profile", "/channels", "/integrations",
                        "/billing", "/partners", "/partner-onboarding", 
                        "/commission-ledger"],
};
```

---

## 6. SIDEBAR NAV PERMISSION REQUIREMENTS

```javascript
// Each nav item needs requiredPermission field:
{ name: "Dashboard",          href: "/dashboard",          permission: "DASHBOARD_VIEW" }
{ name: "Leads",              href: "/leads/active",       permission: "LEADS_VIEW" }
{ name: "Deals & Pipeline",   href: "/deals",              permission: "CUSTOMERS_EDIT" }
{ name: "Activities",         href: "/activities",         permission: "CALLS_VIEW" }
{ name: "Forecasting",        href: "/forecasting",        permission: "MONITORING_VIEW" }
{ name: "WhatsApp",           href: "/whatsapp/chat",      permission: "WHATSAPP_VIEW" }
{ name: "Distribution Rules", href: "/distribution-rules", permission: "LEADS_ASSIGN" }
{ name: "Teams & Users",      href: "/teams",              permission: "USERS_VIEW" }
{ name: "Permissions",        href: "/permissions",        permission: "ROLES_VIEW" }
{ name: "Integrations",       href: "/integrations",       permission: null } // all
{ name: "Reports",            href: "/reports",            permission: "REPORTS_VIEW" }
{ name: "Notifications",      href: "/notifications",      permission: null } // all
{ name: "Settings",           href: "/settings",           permission: "SETTINGS_VIEW" }
```

---

## 7. BACKEND CHANGES NEEDED

### 7.1 TenantSettings Entity + Migration (V30)
```sql
CREATE TABLE tenant_settings (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    hierarchy_mode VARCHAR(20) NOT NULL DEFAULT 'HIERARCHICAL',
    -- HIERARCHICAL = reports_to chain enforced
    -- FLAT = all users see all leads
    created_at DATETIME(6) NOT NULL DEFAULT NOW(6),
    updated_at DATETIME(6) NOT NULL DEFAULT NOW(6)
);
INSERT INTO tenant_settings (id, hierarchy_mode) VALUES (UUID(), 'HIERARCHICAL');
```

### 7.2 SettingsController additions
```java
@GetMapping("/hierarchy")
public ResponseEntity<ApiResponse<Map<String,String>>> getHierarchyMode() { ... }

@PutMapping("/hierarchy")  
@PreAuthorize("hasRole('ADMIN')")
public ResponseEntity<ApiResponse<Map<String,String>>> setHierarchyMode(@RequestBody Map<String,String> body) { ... }
```

### 7.3 UserService.getAccessibleStaffIds() update
```java
// If hierarchyMode == FLAT, return null (all users visible)
// If hierarchyMode == HIERARCHICAL, use existing reports_to chain logic
```

---

## 8. ISSUES FOUND IN CURRENT CODEBASE

### Critical
1. **Static RBAC in frontend** — `hasRouteAccess()` uses role names, not permissions. Custom roles get no route access.
2. **Hierarchy always on** — No way to disable hierarchy for flat-structure companies.

### Medium
3. **V5 seeds MANAGER permissions** but V26 renames MANAGER→BRANCH_HEAD. The V5 MANAGER permissions are now orphaned (no role named MANAGER exists after V26). BRANCH_HEAD gets permissions from V26 correctly, but old MANAGER permissions in role_permissions table are orphaned.
4. **VIEWER role** seeded in V1 but never used, has no permissions seeded.
5. **`can()` function** checks `user.permissions` as array but backend sends it as a Java `Set<String>` which JSON serializes as array — this is fine, but `Array.from()` in mapAuthResponse handles it correctly now.

### Minor
6. **Sidebar "Switch Role" demo** — shows ROLES.MANAGER = "BRANCH_HEAD" which is confusing for demo. Should show display labels.
7. **Teams page** — `inviteReportsTo` Select has `value=""` for "None" but Select component may not handle empty string value correctly in all shadcn versions.

---

## 9. FILES TO CHANGE

### Frontend
| File | Change |
|------|--------|
| `src/lib/auth/permissions.js` | Add PERMISSION_ROUTE_MAP, update hasRouteAccess, add hasPermission helper |
| `src/components/layout/sidebar.jsx` | Add permission field to nav items, filter by hasPermission |
| `src/app/(tenant)/layout.js` | Use permission-based access check |
| `src/lib/api/users.js` | Add hierarchy settings API |
| `src/app/(tenant)/settings/page.js` | Add hierarchy mode toggle |
| `src/app/(tenant)/teams/page.js` | Fix reportsTo empty string, add hierarchy tree view |

### Backend
| File | Change |
|------|--------|
| `db/migration/V30__add_tenant_settings.sql` | New migration |
| `entity/TenantSettings.java` | New entity |
| `repository/TenantSettingsRepository.java` | New repository |
| `service/SettingsService.java` | Add hierarchy mode methods |
| `controller/SettingsController.java` | Add hierarchy endpoints |
| `service/UserService.java` | Respect hierarchy mode |
| `dto/response/TenantSettingsResponse.java` | New DTO |

---

## 10. SUMMARY

The system is well-architected but needs these key changes for production SaaS:

1. **Permission-based routing** (not role-name-based) — enables custom roles to work
2. **Hierarchy mode toggle** — enables flat-structure companies
3. **DB migration for tenant settings** — stores hierarchy preference
4. **Sidebar permission filtering** — shows only relevant nav items per user's actual permissions
5. **Fix orphaned MANAGER permissions** in DB (V5 seeded MANAGER, V26 renamed to BRANCH_HEAD)

All changes are backward compatible — existing 4 system roles continue to work exactly as before.
