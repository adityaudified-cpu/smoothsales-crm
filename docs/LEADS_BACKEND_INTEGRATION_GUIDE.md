# Leads ↔ Backend Integration Guide

> Frontend: `apps/crm/src/lib/api/` · Backend: `Smoothsales-crm-backend` (`server.port 8080`, `context-path /api`)

## 1. Files

| File | Role |
|---|---|
| `lib/api/client.js` | `apiRequest()` — base URL, Bearer token, JSON/multipart, unwraps `ApiResponse<T>.data`, refreshes on 401 via `POST /auth/refresh`, throws `ApiError {status, message, errors}`. `unwrapPage()` for Spring `Page<T>`. |
| `lib/api/customers.js` | One function per endpoint: `customersApi`, `callsApi`, `remindersApi`, `documentsApi`, `usersApi`. |
| `lib/api/mappers.js` | `customerToLead`, `leadToCustomerRequest`, `updatesToCustomerPatch`, stage/source/priority/disposition enum maps. |
| `lib/hooks/use-leads.js` | Same hook API for every page; switches to the backend when `NEXT_PUBLIC_LEADS_DATA_SOURCE=api`. |

## 2. Turning it on

`apps/crm/.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:8080/api
NEXT_PUBLIC_LEADS_DATA_SOURCE=api
```

After login, store tokens with `setAuthTokens(authResponse)` from `lib/api/client.js` (`POST /auth/login` → `POST /auth/verify-otp` returns `AuthResponse {accessToken, refreshToken}`). The current `auth-context.jsx` uses demo accounts and does not call the backend yet; wiring it is the first integration task.

The backend must allow CORS from `http://localhost:3001`.

## 3. Hook → endpoint map (API mode)

| `useLeads` call | Endpoint |
|---|---|
| load / `refreshData()` | `GET /customers?page=0&size=500&sort=createdAt,desc` |
| `createLead(lead)` (Add Lead form) | `POST /customers` with `CustomerRequest` |
| `addLeads(rows)` (import wizard) | `POST /customers` per new row; `PATCH /customers/{id}` for "update existing" |
| `batchUpdateLeads(ids, updates)` | `PATCH /customers/{id}` with `CustomerPatchRequest`; owner change → `POST /customers/bulk-assign-selected` |
| `batchDeleteLeads(ids)` | `DELETE /customers/{id}` (soft delete) |
| Consent toggles (Lead Details) | `PATCH /customers/{id}/consent` |

Updates are optimistic. On failure the hook shows a toast and reloads from the server.

## 4. Field mapping

| Frontend lead | Backend `Customer` | Notes |
|---|---|---|
| `lead_name` | `firstName` + `lastName` | split on first space |
| `mobile_number` / `alternate_phone` | `phone` / `alternatePhone` | backend `phone` is unique |
| `email`, `business` | `email`, `company` | |
| `city` | `preferredLocation` | backend has no city field |
| `lead_stage` | `stage` | New Lead↔NEW, Contacted↔CONTACTED, Qualified↔QUALIFIED, Meeting Scheduled↔SITE_VISIT_SCHEDULED, Site Visit Done↔SITE_VISIT_DONE, Proposal Sent↔NEGOTIATION, Deal Won↔BOOKED, Lost↔LOST, Disqualified↔JUNK |
| `lead_source` | `source` + `sourceDetail` | labels without an enum (IndiaMART, JustDial) → `OTHER` + `sourceDetail` |
| `lead_owner {id,name}` | `assignedStaffId` / `assignedStaffName` | needs real user UUIDs |
| `lead_priority` 1–5 | `priority` HIGH/MEDIUM/LOW | 4–5 HIGH, 3 MEDIUM, 1–2 LOW (lossy) |
| `next_followup` (datetime) | `followUpDate` (date) / `nextEligibleCallAt` | **time of day is lost on write** |
| `last_user_remark` | `notes` (max 500) | |
| `attempts` / `awaiting_first_touch` | `totalCalls` | read-only, updated by calls |
| `dealValueINR` | `totalValue` | |
| `preferred_service` / `budget_range` | `propertyInterest` / `budget`, `budgetMin`, `budgetMax` | |
| consent flags | `dndRegistered`, `callConsent`, `whatsappConsent`, `emailConsent` | |
| `last_worked`, `created_at`, `last_updated` | `lastInteraction`, `createdAt`, `updatedAt` | |

Call outcomes → `CallDisposition.DispositionOutcome`: interested→INTERESTED, callback→CALLBACK_REQUESTED, no_answer/not_reachable→NOT_REACHABLE, busy→BUSY_ASKED_LATER, not_interested→NOT_INTERESTED, invalid→WRONG_NUMBER (`DISPOSITION_TO_API`). `POST /calls/disposition` needs a `callId`, so SIM calls should first be logged with `POST /calls/personal`.

## 5. Still local (backend gaps)

| Feature | Stored now | Backend needed |
|---|---|---|
| Timeline events from Lead Details (calls, notes w/ heading, visits, WhatsApp) | `smoothsales_lead_timeline_<id>` | use `GET /customers/{id}/timeline`, `POST /customers/{id}/notes`; visits need an activity type or `Reminder.type=SITE_VISIT` |
| Documents & voice notes | IndexedDB | file upload endpoint returning `storageKey`, then `POST /documents` |
| Business accounts | localStorage | Business entity + CRUD (currently `company` text only) |
| Segments | localStorage | CRUD on `/segments` (only `GET` exists) |
| Rep status / capacity / round-robin cursor | localStorage | user availability fields; server-side distribution |
| Import batch history | localStorage | persist `BulkImportResult` per upload |
| Fields: designation, city, tags, 1–5 priority, datetime follow-up | lost on API write | add columns or a custom-fields JSON column |
| Demo rep roster (`DEFAULT_REPS`) | constant | `GET /users/assignable` |

## 6. Test checklist when switching to API mode

1. Active Leads loads leads from the server; Refresh refetches.
2. Add Lead → appears with a server UUID; a duplicate phone shows the backend message.
3. Change stage from Board and Bulk bar → reload persists.
4. Assign owner (needs real user UUIDs) → `assignedStaffName` shows after reload.
5. Delete from Lead Details → gone after reload.
6. Consent toggle → `GET /customers/{id}` shows new flags.
7. Expired access token → one silent refresh, then the request succeeds.
