# SmoothSales CRM: Audit and Development Plan

**Date:** 14 Nov 2026
**Scope:** Leads, WhatsApp, and Integrations modules (frontend + backend), plus the app shell, auth, and the infrastructure they depend on.
**Repos:** `frontend/` (Next.js 16.3, React 19.2, Tailwind 3, shadcn/ui) and `backend/` (Spring Boot 3.3, Java 17, MySQL, Redis, RabbitMQ, Flyway).

---

## 1. Summary

The product has a broad surface (about 60 frontend routes and about 190 backend endpoints), but it is not production-ready as a SaaS. Six problems block everything else:

1. **The frontend does not build.** It was extracted from a monorepo and still imports three workspace packages that do not exist outside it (`@smoothsales/ui`, `@smoothsales/lib`, `@smoothsales/config`). The global stylesheet, the Tailwind theme, and the `cn()` helper all come from those packages.
2. **The backend is single-tenant.** No table has a `tenant_id`. Every company that signs up would share one pool of leads, templates, campaigns, and integration credentials. `customers.phone` is globally unique, so two companies cannot store the same contact.
3. **The frontend runs on browser storage by default.** `NEXT_PUBLIC_LEADS_DATA_SOURCE=local` is the default. 52 empty `catch {}` blocks silently fall back to `localStorage` when an API call fails, so the UI looks like it works while nothing is saved.
4. **Several features are fake.** Integration "Test connection" always returns success with marketing copy. Meta CAPI and Google OCI "conversions" never call Meta or Google. The personal WhatsApp "pairing code" is a random string generated in the browser, and the "QR code" encodes the user's own phone number.
5. **The public webhooks are open.** The website webhook reads an API key but never checks it. Portal webhooks have no authentication. The WhatsApp webhook does not verify Meta's signature. Anyone who knows the URL can inject leads or fake delivery receipts.
6. **A live secret is committed.** `backend/src/main/resources/application.yml:126` contains a real-looking WhatsApp Cloud API access token, plus a phone number ID and WABA ID, as defaults. It is in git history.

> **Action for the account owner, now:** revoke that WhatsApp token in Meta Business Manager and issue a new one. Removing it from the file does not remove it from git history or from any clone.

---

## 2. Competitive research: what top CRMs do

Sources are listed at the end of this document. Most are vendor marketing or third-party reviews, so they show product direction, not verified detail.

| Pattern | TeleCRM | Salesmate | Zoho CRM | What we adopt |
|---|---|---|---|---|
| Lead capture from Indian portals (IndiaMART, Justdial, 99acres) | Core selling point | Via integrations | Via marketplace | Keep our portal webhooks, make them secure and correct |
| Dedup + auto-assignment on capture | Yes | Yes | Assignment rules | Run assignment and dedup on every ingestion path |
| Multiple views of one list | List | List + pipeline board | List, Kanban, Canvas (list, tile, table) | Table + Kanban with saved views |
| Follow-up cue inline in the list | Reminders | Idle-deal flags | Colour-coded next-activity labels | "Next follow-up" and "untouched for X" chips per row |
| Two-way WhatsApp inside the CRM | Yes, with broadcasts and templates | Yes | Native integration, threaded replies | Inbox tied to the lead record, template sends, campaigns |
| Lead record as the hub | Timeline | 360° contact view | Related lists | Single lead page: timeline, calls, WhatsApp, docs, reminders |

**What this means for the UI:**
- **Density beats decoration.** These tools are used all day by telecallers. Rows must be scannable, and actions (call, WhatsApp, assign, status) must be one click from the row.
- **The lead record is the centre.** Every channel (call, WhatsApp, form, portal) shows up on one timeline.
- **Status is always visible.** Each integration shows connected or broken, and when it last received data. Each message shows sent, delivered, read, or failed.

---

## 3. Design direction

**Direction: "Operator console."** It is calm and dense, built for people who work in it eight hours a day.

- **Surfaces:** a warm-neutral paper background in light mode and deep slate in dark mode. Content sits on flat panels with hairline borders, not floating cards with heavy shadows.
- **Brand colour:** one deep teal-green as the primary (continuing the current emerald identity, which also fits WhatsApp). It is used for primary actions and active state only.
- **Status colours:** green, amber, red, and blue, each tuned for WCAG AA on both themes.
- **Typography:** *Instrument Sans* for UI text, *JetBrains Mono* for phone numbers, IDs, and webhook URLs (tabular figures), and a display weight for page titles only.
- **Rules:**
  - All colour, spacing, radius, and shadow values come from CSS variables in `globals.css`, mapped into the Tailwind theme.
  - No hex values in components. There are currently 8 hex values across 4 files; these will be replaced.
  - Every data view has loading (skeleton), empty, error (with retry), and populated states.
  - Motion is limited to 150–200 ms transitions and is disabled under `prefers-reduced-motion`.
  - Layouts must work at 390 px (phone), 768 px (tablet), and 1440 px (desktop), with visible focus rings and full keyboard navigation.

The direction is recorded in `frontend/.interface-design/system.md` so later work stays consistent.

---

## 4. Audit findings

Severity: **P0** blocks production or is a security hole. **P1** is broken or misleading behaviour. **P2** is quality or polish.

### 4.1 Infrastructure and build

| # | Sev | Finding | Location |
|---|---|---|---|
| I-1 | P0 | Frontend imports missing monorepo packages, so the build fails | `frontend/package.json:29-31`, `src/app/globals.css:1`, `tailwind.config.js:1`, `src/lib/utils.js:1`, `src/lib/mock-data/{users,teams,pricing-plans}.js` |
| I-2 | P0 | WhatsApp token, phone ID, and WABA ID hardcoded as defaults | `backend/.../application.yml:126-128` |
| I-3 | P0 | Default JWT secret in config; app starts with it if `JWT_SECRET` is unset | `application.yml:101` |
| I-4 | P1 | Redis is mandatory (ShedLock, cache, presence), so the app cannot start locally without it | `config/AppConfig.java:28`, `config/RedisConfig.java` |
| I-5 | P1 | `qrcode` package is used by the connect page but not declared | `whatsapp/connect/page.js:341` |
| I-6 | P2 | Duplicate onboarding routes: `app/onboarding/*` and `app/(onboarding)/*` contain the same pages | `src/app/` |
| I-7 | P2 | Stray utility classes in production sources | `src/main/java/HashGen.java`, `crm/HashGen.java`, `src/test/java/{DropDb,FixFlyway}.java` |
| I-8 | P2 | Local DB is MariaDB 10.4 (XAMPP), while migrations target MySQL 8. Compatibility must be verified at first boot | environment |

### 4.2 Multi-tenancy (SaaS readiness)

| # | Sev | Finding |
|---|---|---|
| T-1 | P0 | No `tenant_id` on any table. All data is global. |
| T-2 | P0 | `customers.phone` is `UNIQUE` across the whole database (`entity/Customer.java:28`). It must be unique per tenant. |
| T-3 | P0 | WhatsApp credentials are one global set from env vars, so every tenant would send from the same number. Credentials must be stored per tenant (encrypted). |
| T-4 | P0 | `integration_configs.integration_key` is looked up globally (`findByIntegrationKey`), so one tenant's IndiaMART config would apply to all. |
| T-5 | P1 | Public webhook URLs carry no tenant identifier, so an inbound lead cannot be routed to the right company. |

### 4.3 Backend security

| # | Sev | Finding | Location |
|---|---|---|---|
| S-1 | P0 | Website webhook reads `X-API-Key` or `api_key` but never validates it | `controller/WebhookLeadController.java:30-36` |
| S-2 | P0 | Portal webhooks (`/webhooks/leads/{source}` etc.) have no auth at all | `WebhookLeadController.java:53` |
| S-3 | P0 | WhatsApp webhook POST does not verify `X-Hub-Signature-256` (the Meta Leads webhook does, via `MetaHmacValidator`) | `controller/WhatsAppController.java:61` |
| S-4 | P0 | `GET /integrations` and `GET /integrations/{key}` return raw `configJson` (access tokens, API keys) to any logged-in user, including agents | `IntegrationSettingsController.java:38-49` |
| S-5 | P0 | `/reports/*/download` is in `PUBLIC_PATHS`, so reports are downloadable without login | `config/SecurityConfig.java:51` |
| S-6 | P1 | `GET /customers/{id}/timeline` has no access check (IDOR), so any user can read any lead's history | `CustomerController.java:297` |
| S-7 | P1 | `GET /integrations/audit/webhooks` returns raw lead PII payloads to any logged-in user | `IntegrationSettingsController.java:195` |
| S-8 | P1 | `signatureValid(true)` is hardcoded on every stored raw event | `service/WebhookLeadService.java:40` |
| S-10 | P1 | WebSocket topics (`/topic/whatsapp.conversations`, `/topic/campaign.progress`, `/topic/agents`) are global, so every tenant would receive every other tenant's live messages | `WhatsAppIntegrationService.java:864`, `WhatsAppCampaignService.java:661`, `AgentPresenceService.java:59` |
| S-11 | P1 | Seeder marks two WhatsApp templates `APPROVED` even when Meta submission fails (one carries another company's name), so the 24-hour fallback would send unapproved templates | `config/DataSeeder.java:40-90` |
| S-12 | P2 | `/settings/storage/cleanup` reports "queued successfully" but does nothing (Settings module, Phase 5) | `SettingsController.java:56` |
| S-13 | P1 | No signup endpoint: a new company cannot create a workspace | `AuthController.java` |
| S-9 | P2 | CORS allows `https://*.vercel.app` and ngrok wildcards with credentials in the default config | `application.yml:109` |

### 4.4 Backend correctness: webhooks and integrations

| # | Sev | Finding | Location |
|---|---|---|---|
| W-1 | P1 | WhatsApp webhook handles only `entry[0].changes[0]`. Meta batches events, so every other status update and inbound message in a batch is dropped | `WhatsAppIntegrationService.java:577`, `WhatsAppController.java:69` |
| W-2 | P1 | Webhook processing runs synchronously in the request. Slow Graph calls (media URL fetch) risk Meta timeouts and retries, which create duplicate inbound messages. There is no idempotency check on `wamId` for inbound messages | `WhatsAppIntegrationService.java:683-829` |
| W-3 | P1 | Lead webhooks parse every body as JSON. Form-urlencoded posts (`name=..&phone=..`), which the endpoint explicitly accepts, fail and are marked FAILED | `WebhookLeadService.java:64` |
| W-4 | P1 | IndiaMART Push API wraps leads in `{"RESPONSE": {...}}`, so the top-level field mapping finds nothing | `WebhookLeadService.java:172` |
| W-5 | P1 | Dedup uses the exact phone string, not `PhoneNormalizer`. `+91 98xxx`, `098xxx` and `98xxx` become three leads | `WebhookLeadService.java:71` |
| W-6 | P1 | Leads captured by webhook are never assigned (assignment hook not invoked) and no notification is sent | `WebhookLeadService.java:76` |
| W-7 | P1 | `POST /integrations/{key}/test` is fake: always `success=true` with hardcoded marketing text | `IntegrationSettingsController.java:79-170` |
| W-8 | P1 | `POST /integrations/conversions/meta` and `/google` are fake. Nothing is sent to Meta or Google; the response claims `DELIVERED` or `UPLOADED`. OCI invents a `gclid_mock_...` value | `IntegrationSettingsController.java:209-257` |
| W-9 | P1 | Inbound WhatsApp from an unknown number creates a lead named "WhatsApp Lead &lt;number&gt;" without using the WhatsApp profile name in `contacts[0].profile.name` | `WhatsAppIntegrationService.java:743` |
| W-10 | P2 | Session-message fallback picks templates by hardcoded names (`universal_broadcast_msg` etc.) that only exist in one Meta account | `WhatsAppIntegrationService.java:528-536` |
| W-11 | P2 | `checkTemplateSendability` sends a real message to `910000000000` to probe a template | `WhatsAppIntegrationService.java:331` |
| W-12 | P2 | Meta media URLs expire after about 5 minutes but are stored permanently as `mediaUrl`, so images in the inbox break | `WhatsAppIntegrationService.java:696` |

### 4.5 Backend: endpoints the frontend needs but which do not exist

| Frontend call | Used by | Backend |
|---|---|---|
| `GET/PUT /whatsapp/ai-agent/config`, `/faqs`, `/stats`, `POST /test-chat` | WhatsApp → AI Agent | **missing** |
| `GET/POST/PUT/DELETE /whatsapp/automation/flows`, `/{id}/activate`, `/{id}/pause` | WhatsApp → Automation | **missing** |
| WhatsApp account management (connect, list, verify Cloud API numbers) | WhatsApp → Connect | **missing**: done in the browser against `graph.facebook.com`, with the token in `localStorage` |
| `GET /campaigns/whatsapp/audience-preview?segmentId=` | Campaigns | exists, but takes `stage/source/priority`, not `segmentId` |
| Segments CRUD | Leads → Segments | only `GET /segments` |
| Document file upload | Leads → Documents | only metadata (`storageKey`); no file storage |
| STOMP subscriptions for inbox and campaign progress | Chat, Campaigns | backend publishes; frontend `subscribe*` functions are empty stubs |

### 4.6 Frontend

| # | Sev | Finding | Location |
|---|---|---|---|
| F-1 | P0 | Data layer defaults to `localStorage`. Leads, templates, campaigns, conversations, AI agent, and automation all have local fallbacks | `lib/api/client.js:17`, `lib/api/whatsapp.js`, `lib/hooks/use-leads.js` |
| F-2 | P0 | 52 empty `catch {}` blocks swallow API errors, so failures look like success | 17 files |
| F-3 | P0 | Meta access token stored in `localStorage` and used from the browser | `lib/api/whatsapp.js:43-48,540` |
| F-4 | P1 | Fake personal WhatsApp pairing code (random string) and QR (encodes the user's own phone) | `whatsapp/connect/page.js:222-356,644` |
| F-5 | P1 | `DEMO_ACCOUNTS` with passwords shipped in the bundle; `switchDemoRole` swaps the user's role client-side | `lib/auth/auth-context.jsx:12-17,143` |
| F-6 | P1 | `useLeads` downloads **every** lead (200 per page, all pages in parallel) and filters in the browser. This does not scale past a few thousand leads | `lib/hooks/use-leads.js:59-82` |
| F-7 | P1 | Bulk delete sends one DELETE per lead in parallel; partial failures are not reported | `use-leads.js:185` |
| F-8 | P1 | Mock data still imported inside module scope: call-disposition form (`mock-data/leads`), active leads (`mock-data/tenant-custom-fields`), plus 19 other mock files used by other modules | see §7 |
| F-9 | P2 | Very large page files are hard to maintain: connect page (2,181 lines), integrations page (1,743), lead table (1,267), universal config modal (1,157), chat (1,101) | `src/app/(tenant)/...` |
| F-10 | P2 | Hardcoded hex colours | `leads-secondary-nav.jsx`, `whatsapp-broadcast-dialog.jsx`, `whatsapp/templates`, `whatsapp/campaigns` |
| F-11 | P2 | Auth tokens in `localStorage` (XSS-exposed). Acceptable short-term; plan to move refresh token to an httpOnly cookie | `lib/api/client.js:20-44` |

---

## 5. Target architecture

### 5.1 Multi-tenancy (shared database, tenant column)

- New `tenants` table (id, name, slug, plan, status, created_at).
- `tenant_id` (UUID, NOT NULL, indexed) added to every business table through a Flyway migration. Existing rows are back-filled to a single "default" tenant.
- `users.tenant_id` is the source of truth. The JWT carries `tid`. A `TenantContext` (request-scoped) is set by the JWT filter.
- A Hibernate `@Filter` (or `@TenantId` with the discriminator strategy, which Hibernate 6 supports) enforces the tenant on every query, so a missed `WHERE` clause cannot leak data.
- Unique constraints become composite: `(tenant_id, phone)`, `(tenant_id, integration_key)`, `(tenant_id, template_name, language)`.
- Public webhooks resolve the tenant from a **per-integration secret key in the URL**: `/webhooks/leads/{source}/{webhookKey}`. The key is random (32 bytes), stored hashed, rotatable from the UI, and doubles as authentication.
- WhatsApp webhooks resolve the tenant from `metadata.phone_number_id` → `whatsapp_accounts.phone_number_id`.

### 5.2 Secrets

- New `whatsapp_accounts` table per tenant: phone number ID, WABA ID, display number, verified name, quality rating, encrypted access token, status.
- Integration configs split into public settings (returned to the UI) and secrets (AES-GCM encrypted at rest with a key from `APP_ENCRYPTION_KEY`, never returned, shown as `••••last4`).
- No secret defaults in `application.yml`. The app refuses to start in the `prod` profile without `JWT_SECRET` and `APP_ENCRYPTION_KEY`.

### 5.3 Webhook pipeline (all sources)

`receive → verify (HMAC or key) → store raw event (idempotency key) → 200 OK immediately → async process → normalise phone → dedup per tenant → create/merge lead → attribution → assignment hook → notify (WebSocket) → mark PROCESSED / FAILED with reason`

- Body parser handles JSON, form-urlencoded, and multipart.
- Source adapters (IndiaMART `RESPONSE` wrapper, Justdial, 99acres, MagicBricks, Google Forms, Jotform, Google Ads, generic) are one class each behind an interface, with unit tests using real sample payloads.
- Failed events stay visible in the Integrations → Activity tab with a "Reprocess" button (already partly built).

### 5.4 Frontend data layer

- API-only. The `local` mode, every `localStorage` fallback, and every silent `catch {}` are removed. Errors surface as toasts plus inline error states with retry.
- Add **TanStack Query** for caching, background refetch, optimistic updates with rollback, and pagination.
- Leads list moves to **server-side** pagination, sorting, and filtering via `GET /customers/leads` (already supports filters) instead of downloading everything.
- A STOMP client (`@stomp/stompjs`) replaces the stub subscriptions for the live inbox and campaign progress.

---

## 6. Execution plan

Each phase ends with a working build and is committed separately so it can be reviewed or reverted on its own.

### Phase 0: Foundation (make both apps run)
1. Frontend: remove `@smoothsales/*` dependencies; write a new `globals.css` (design tokens, light and dark), `tailwind.config.js` (theme mapped to tokens), and `cn()` in `lib/utils.js`. Add missing `qrcode` or remove its use (see Phase 2). `npm install` and `npm run build` pass.
2. Backend: remove hardcoded secrets from `application.yml`; add `.env.example` entries. Make Redis optional for local dev (in-memory cache and a JDBC ShedLock provider when `app.redis.enabled=false`). Boot against local MariaDB and fix any migration incompatibilities.
3. Delete stray `HashGen`, `DropDb`, `FixFlyway` classes. (The two onboarding trees differ in 6 files and both are linked, so merging them moves to Phase 5 with the rest of onboarding.)

### Phase 1: Backend hardening
1. Multi-tenancy (§5.1): migration, entity base class, tenant filter, JWT claim, composite uniques, tenant-aware repositories.
2. Webhook security: per-integration webhook keys (S-1, S-2), WhatsApp HMAC (S-3), real `signatureValid`.
3. Webhook correctness: iterate all `entry[]` and `changes[]` (W-1), async processing with `wamId` idempotency (W-2), multi-format body parsing (W-3), source adapters (W-4), phone normalisation (W-5), assignment and notification (W-6), WhatsApp profile name (W-9).
4. Secrets (§5.2): `whatsapp_accounts` table and API (`/whatsapp/accounts`: connect, verify against Graph server-side, list, disconnect), encrypted integration secrets, masked responses (S-4).
5. Make integration tests real (W-7): Meta (Graph `/me` + page token), WhatsApp (phone number lookup), Exotel (account lookup), OpenAI (`/models`), webhook-only sources report "last event received at". Remove the fake CAPI and OCI responses (W-8). Either implement them against the real APIs or return `501 Not configured`; no fake success.
6. Missing endpoints (§4.5): AI agent config and FAQs, automation flows (CRUD, activate, pause, with a trigger engine for "new lead", "keyword reply", "no reply after X"), segment CRUD and audience preview by segment, document upload (local disk storage behind an interface so S3 can replace it later), media proxy for expiring Meta media (W-12).
7. Access control: IDOR fixes (S-6), restrict audit log and integration endpoints to admins (S-7), remove `/reports/*/download` from public paths and use signed short-lived links (S-5).
8. Tests: unit tests for every source adapter, webhook signature verification, tenant isolation (tenant A cannot read tenant B), and integration tests for the lead and WhatsApp flows.

### Phase 2: Frontend data layer
1. Add TanStack Query; rewrite `lib/api/*` as API-only modules; remove `isApiMode`, `LEADS_DATA_SOURCE`, and every `localStorage` fallback.
2. Server-side paginated leads; bulk endpoints for delete and status change.
3. Real-time inbox and campaign progress over STOMP.
4. Remove `DEMO_ACCOUNTS`, `switchDemoRole`, sample-data banner, fake pairing code and QR.

### Phase 3: UI redesign (Leads, WhatsApp, Integrations, shell)
1. **Shell:** sidebar (collapsible, grouped, keyboard-navigable, mobile drawer), topbar (global search, notifications, account menu), page header pattern.
2. **Leads:** tabs (Active, Worked, Businesses, Documents, Segments, Distributions). Dense table with sticky header, column chooser, saved views, inline status and owner edit, row quick actions (call, WhatsApp, assign). Kanban view. Filter drawer. Bulk-action bar. Import wizard with column mapping and an error report. Lead detail page as a 360° hub (timeline, calls, WhatsApp thread, documents, reminders, attribution).
3. **WhatsApp:** overview (account health, quality rating, message volume), live inbox (three-pane on desktop, stacked on mobile, 24-hour window indicator, template picker when the window is closed), templates (builder with live phone preview and Meta status), campaigns (wizard: audience → template → variables → schedule; live progress), automation (flow list and editor), AI agent (config, FAQs, test chat), connect (Cloud API numbers only; see decision D-2).
4. **Integrations:** marketplace grouped by category with real status (connected, error, last event time). One config drawer per integration (credentials, field mapping, webhook URL with copy and rotate, test, activity log). Webhook activity tab with reprocess.
5. Every screen: loading, empty, error, and populated states; 390 / 768 / 1440 px layouts; AA contrast; keyboard and focus.

### Phase 4: Verification
1. `npm run build` and `npm run lint` clean; `mvn test` green.
2. End-to-end checks against the running backend: create, import, assign, and delete leads; send a webhook lead from each adapter; template create and submit; campaign create and start; inbox send and receive (with a real WhatsApp test number if credentials are provided).
3. Playwright screenshots at 1440 px and 390 px for every redesigned page, reviewed and fixed.

### Phase 5 (later, outside this scope)
Modules that still run entirely on mock data and are **not** in this round: Dashboard charts, Deals, Pipelines, Partners, Partner onboarding, Commission ledger, Reports, Caller scorecard, Telephony, Distribution rules builder, Channels, Branding, Onboarding setup steps. Each needs backend endpoints first. They will be listed in the UI as "coming soon" rather than showing fake numbers.

---

## 7. Demo and mock data to remove

| File | Used by | Action |
|---|---|---|
| `lib/mock-data/sample-leads.js` (1,595 lines), `leads.js` | Leads, disposition form, dashboard widget | Delete; disposition outcomes come from tenant settings |
| `lib/mock-data/tenant-custom-fields.js` | Active leads | Replace with `/settings/tenant` custom fields |
| `lib/mock-data/integrations.js` | Integrations | Catalogue becomes static metadata only (names, logos, docs); status comes from the API |
| `lib/mock-data/users.js`, `teams.js` | Distribution rule builder, channels | Replace with `/users/team` |
| `components/leads/sample-data-banner.jsx` | Leads | Delete |
| `DEMO_ACCOUNTS` in `auth-context.jsx` | Login | Delete |
| Fake QR and pairing code | WhatsApp connect | Delete (see D-2) |
| Remaining 19 mock files | Phase 5 modules | Kept until those modules get APIs; their pages show "coming soon" |

---

## 8. Decisions

**Decided on 14 Nov 2026:** D-1 shared database with `tenant_id`. D-2 official Cloud API only, fake pairing screens removed. D-3 CAPI and OCI hidden until real test accounts exist. D-4 is still open.

| # | Decision | Recommendation |
|---|---|---|
| D-1 | **Tenancy model.** Shared database with a `tenant_id` column, or one deployment per customer? | Shared database. It is the standard SaaS model, cheapest to run, and the plan above assumes it. |
| D-2 | **Personal WhatsApp (non-API numbers).** Linking a personal number needs an unofficial WhatsApp Web gateway (for example Baileys) running as a separate service. It works, but violates WhatsApp's terms, and numbers can be banned. | Ship the official Cloud API only for now. Keep personal WhatsApp as the existing "log a personal message" feature, without fake pairing screens. |
| D-3 | **Meta CAPI and Google OCI.** Build real integrations now, or hide them until later? | Hide them until a real Meta pixel or Google Ads account is available for testing. |
| D-4 | **Credentials for end-to-end testing.** A Meta test WhatsApp number and app secret are needed to verify the live inbox. | Provide test credentials through `.env`, never in chat or git. |

---

## 9. Risks

- **Scope.** This is several weeks of work for one developer. Phases are ordered so each one leaves the product better and shippable.
- **Migration on existing data.** If a production database already exists, the tenancy migration must be rehearsed on a copy first.
- **MariaDB vs MySQL 8.** Local XAMPP runs MariaDB 10.4. Production should run MySQL 8 as `docker-compose.yml` defines. Anything that only passes on MariaDB is a false signal.
- **Meta API behaviour** (template review times, 24-hour window, rate limits) can only be verified with a real account.

---

## Sources

- [TeleCRM: Lead management](https://telecrm.in/lead-management-lp)
- [TeleCRM: 13 must-have CRM features for Indian sales teams (2026)](https://telecrm.in/blog/crm-features/)
- [TeleCRM: Best CRM software in India (2026)](https://telecrm.in/blog/best-crm-software-in-india/)
- [TechRadar: Salesmate CRM review 2026](https://www.techradar.com/pro/software-services/salesmate-crm-review)
- [ClickUp: Pipedrive vs Salesmate (2026)](https://clickup.com/blog/pipedrive-vs-salesmate/)
- [Zoho CRM: Views and filters](https://www.zoho.com/crm/views-filters.html)
- [Zoho CRM: Customizing module view using Canvas](https://help.zoho.com/portal/en/kb/crm-v2-1/customize-crm-account/canvas/articles/crm-v2-customizing-module-view-using-the-all-new-canvas-design-suite)
- [Zoho community: WhatsApp for Business integration enhancements](https://help.zoho.com/portal/vi/community/topic/nimble-enhancements-to-whatsapp-for-business-integration-in-zoho-crm-enjoy-context-and-clarity-in-business-messaging?page=4)
