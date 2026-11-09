# Leads Module — Competitive Research, Audit & Readiness

> **Date:** November 1, 2026 · **App:** `smoothsales-frontend/apps/crm` · **Backend:** `Smoothsales-crm-backend` (Spring Boot, `/api`)
> Companion docs: `SALESMAX_LEADS_VERIFIED_RESEARCH_AND_UI_SPEC.md` (Salesmax detail), `LEADS_BACKEND_INTEGRATION_GUIDE.md` (API wiring).

---

## 1. CRMs reviewed

| CRM | Positioning | Lead features confirmed from sources |
|---|---|---|
| **Salesmax** (ex-Superfone) | Indian SMB telecalling + WhatsApp CRM | Work queue, auto-dialer "4 of 23", call outcome form (disposition + note + callback + next action + auto deal), lifecycle New → Prospecting → Opportunity → Closed, round-robin/source/product/geo assignment, phone+email dedupe, Business records, ACTION → Add Notes / Log Visit, attention queues, User Wise Lead Position report |
| **Zoho CRM** | Global general CRM | Create lead form, web-to-lead, import; list views + custom views (Unread, Converted, Recently Created); search by alphabet/criteria; advanced filters; mass delete, mass email, mass transfer, export; assignment rules (owner-based, round-robin); scoring rules; **convert lead → Account + Contact + optional Deal**; per-field customisation; View/Create/Edit/Share/Delete permissions |
| **Runo** | Indian call-management CRM | Auto-dialer, call recording, caller ID with previous interactions, rule-based and bulk allocation, follow-up reminders and callback alerts, Google Calendar sync, live agent status, call reports |
| **TeleCRM** | Indian telecalling CRM | 1-click dialer, call tracking/recording, follow-up reminders, bulk import, WhatsApp integration, auto lead capture + distribution, lead scoring/qualification, real-time leaderboard (calls, duration, closed deals) |
| **LeadSquared / Kylas** | Indian mid-market sales CRM | Custom filters and tabs, dynamic dashboards, lead scoring, lead capture from forms/social/trade inquiries, duplicate handling, campaign/source tracking, workflow automation |
| **"Smart CRM"** | No single well-known product found under this name; the Capterra "Smart CRM Solution" listing names no vendor | Listing only: contact management, import/export, interaction tracking, lead qualification, quotes, reporting |

Sources are listed in §6. Where a feature is only on a third-party listing it is not treated as confirmed.

---

## 2. Feature matrix — what the market treats as standard

✅ = SmoothSales has it now · 🆕 = built in this round · ➖ = not built (reason given)

| Capability | Salesmax | Zoho | Runo | TeleCRM | LSQ/Kylas | **SmoothSales** |
|---|:-:|:-:|:-:|:-:|:-:|---|
| **Manual "Add lead" form** | ✓ | ✓ | ✓ | ✓ | ✓ | 🆕 `LeadFormDialog` with live duplicate check |
| **Edit lead details** | ✓ | ✓ | ✓ | ✓ | ✓ | 🆕 Lead Details → Action → Edit / pencil |
| Delete lead | ✓ | ✓ | ✓ | ✓ | ✓ | 🆕 Lead Details → Action → Delete (+ bulk delete ✅) |
| Bulk import (CSV/Excel) | ✓ | ✓ | ✓ | ✓ | ✓ | ✅ 3-step wizard |
| Duplicate detection (phone + email) | ✓ | ✓ | – | – | ✓ | ✅ import · 🆕 add/edit form |
| List views / saved views | ✓ | ✓ | ✓ | ✓ | ✓ | ✅ Saved views, segments |
| **Kanban / pipeline board** | ✓ | ✓ | – | – | ✓ | 🆕 Active Leads → Board (drag to change stage) |
| Advanced filters | ✓ | ✓ | ✓ | ✓ | ✓ | ✅ Filter drawer |
| Mass assign / stage / delete | ✓ | ✓ | ✓ | ✓ | ✓ | ✅ Bulk bar (owners now from roster 🆕) |
| Export CSV | ✓ | ✓ | ✓ | ✓ | ✓ | ✅ |
| Assignment rules / round robin | ✓ | ✓ | ✓ | ✓ | ✓ | ✅ Distributions (capacity-aware) |
| Click-to-call + post-call disposition | ✓ | – | ✓ | ✓ | ✓ | ✅ disposition chips, Save & next |
| Follow-up reminders / callbacks | ✓ | ✓ | ✓ | ✓ | ✓ | ✅ follow-up SLA, attention queues |
| WhatsApp templates / broadcast | ✓ | – | – | ✓ | ✓ | ✅ |
| Activity timeline | ✓ | ✓ | ✓ | ✓ | ✓ | ✅ |
| Notes, visits, tasks, documents | ✓ | ✓ | ✓ | ✓ | ✓ | ✅ |
| **Consent / DND controls** | – | – | – | – | ✓ | 🆕 Consent & DND card; blocks call/WhatsApp |
| Lead scoring | – | ✓ | – | ✓ | ✓ | ➖ Priority stars only; needs backend scoring rules |
| Convert lead → account/contact/deal | ✓ (auto deal) | ✓ | – | – | ✓ | ✅ "Create deal" on Interested; ➖ full account/contact conversion needs a Deals API |
| Rep leaderboard / reports | ✓ | ✓ | ✓ | ✓ | ✓ | ✅ User Wise Lead Position, Activity by salesperson |
| Call recording playback | ✓ | – | ✓ | ✓ | ✓ | ➖ needs telephony (backend has `/calls/recordings`) |
| Auto-dialer / power dialer | ✓ | – | ✓ | ✓ | – | ➖ Save & next is the manual equivalent; backend has call campaigns |
| Role-based visibility | ✓ | ✓ | ✓ | ✓ | ✓ | ➖ frontend roles exist; enforced by backend `@PreAuthorize` once on API |

---

## 3. Audit findings (all pages) and fixes

| # | Page | Finding | Severity | Fix |
|---|---|---|---|---|
| 1 | Active Leads | "My leads" / My toggle hardcoded to "Aarav Sharma", so every user saw Aarav's leads | High | Uses the signed-in user (`useAuth().user.name`) |
| 2 | Bulk bar, Filter drawer | Owner lists hardcoded to 3 names (Kavita missing); no way to unassign | Medium | Read from the shared rep roster; added "Unassign" |
| 3 | Active Leads | No way to add one lead manually | High | Add Lead form |
| 4 | Lead Details | Unknown lead id silently showed a different lead | High | "Lead not found" screen |
| 5 | Lead Details | Lead fields could not be edited | High | Edit dialog (same form as create) |
| 6 | Lead Details | "Not interested" wrote stage "Not Interested", which no filter or stage list knew | Medium | Writes **Lost** (new stage, = backend `LOST`) |
| 7 | Lead Details | Calls/WhatsApp allowed with no consent tracking | Medium (compliance) | Consent & DND card; actions blocked when DND or consent off |
| 8 | Worked Leads | Lint errors (unescaped quotes, `location.href` mutation) | Low | Fixed |
| 9 | All pages | Data only in browser storage; no API layer | Blocker for backend | `lib/api/*` + `useLeads` API mode (see integration guide) |

**Verified this round:** production build passes; 24/24 sample leads round-trip lead → `CustomerRequest` → `CustomerResponse` → lead with name, phone, stage and source intact; HTTP client tested against a mocked server for envelope unwrap, 401 → refresh → retry, and error messages.

**Known remaining lint:** `react-hooks/set-state-in-effect` on effects that load browser storage on mount (same pattern as the existing `use-persisted-state` hook). These disappear as pages move to API data.

---

## 4. Page-by-page status

| Page | Ready for backend? | Notes |
|---|---|---|
| Active Leads | **Yes** via `useLeads` | Table + Board, Add Lead, attention queues, bulk actions |
| Lead Details | **Mostly** | Fields, stage, owner, notes, consent go to the API. Timeline events, visits and documents are still local (see guide §4) |
| Worked Leads | **Yes** (reads leads) | Recent activities feed is local until `/customers/{id}/timeline` is used |
| Businesses | No | Backend has `company` text only, no Business entity |
| Documents | No | Backend `DocumentRequest` needs a `storageKey`; there is no file upload endpoint |
| Segments | No | Backend `SegmentController` has only `GET /segments` |
| Uploads | Partly | `customersApi.importFile` maps to `POST /customers/import`; the wizard still parses in the browser |
| Distributions | Partly | Assign / bulk assign map to the API; rep status and capacity have no backend fields |

---

## 5. Recommended next steps

1. Point `NEXT_PUBLIC_API_URL` at the backend, set `NEXT_PUBLIC_LEADS_DATA_SOURCE=api`, and log in so `smoothsales_access_token` is stored (see guide §2).
2. Replace the demo rep list (`DEFAULT_REPS`) with `GET /users/assignable` so owners carry real UUIDs.
3. Backend additions, in priority order: datetime follow-ups, `city`/`designation`/`priority 1–5` fields, a Business entity, segment CRUD, a document upload endpoint, rep availability/capacity, and lead scoring.

## 6. Sources

- Salesmax: https://salesmax.ai/features · https://salesmax.ai/lead-management-software · https://salesmax.ai/for/telecalling-teams · https://salesmax.ai/sales-crm · https://salesmax.tawk.help/
- Zoho CRM: https://help.zoho.com/portal/en/kb/crm/sales-force-automation/leads/articles/leads-26-4-2026 · https://help.zoho.com/portal/en/kb/crm-v2-1/sales-force-automation/leads/articles/crm-v2-work-with-leads
- Runo: https://www.capterra.com/p/214472/Call-Management-CRM/ · https://apps.apple.com/app/id1528004506
- TeleCRM: https://telecrm.in/lead-management-lp · https://telecrm.in/blog/crm-features/
- LeadSquared / Kylas: https://www.capterra.com/compare/130199-210630/LeadSquared-vs-Kylas · https://kylas.io/kylas-vs-leadsquared
- Smart CRM Solution: https://www.capterra.in/software/1085129/Smart-CRM-Solution
