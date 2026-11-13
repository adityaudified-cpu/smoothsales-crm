# Integrations Page — Full Plan & Development Doc

## 1. Current State Analysis

### Frontend (`smoothsales-crm`)
- `src/app/(tenant)/integrations/page.js` — basic grid of cards, toggle-only, no modals
- `src/components/integrations/integration-card.jsx` — simple card, no config UI
- `src/lib/mock-data/integrations.js` — static list, no API calls
- No dedicated API layer for integrations exists yet

### Backend (`Smoothsales-crm-backend`)
- **Meta Lead Ads** — fully built: `MetaWebhookController`, `MetaAdminController`, `MetaAdminService`, `MetaGraphClient`, `MetaBackfillService`, `MetaLeadService`, `MetaWebhookEventProcessor`
- DB tables: `meta_pages`, `meta_ad_accounts`, `lead_attribution`, `webhook_events_raw`, `sync_runs`
- Config: `app.meta.*` in `application.yml` (app-id, app-secret, verify-token, system-user-token, graph-version)
- **No Google Ads, IndiaMART, 99acres, MagicBricks, or Website Webhook controllers exist yet**

---

## 2. What We Are Building

### A. Frontend — Integrations Page Overhaul
1. **`src/lib/api/integrations.js`** — API layer for all integration endpoints
2. **`src/components/integrations/`** — New modal-based config components:
   - `MetaLeadsModal.jsx` — Meta Graph API + Conversions API setup
   - `GoogleAdsModal.jsx` — Google Ads Lead Form Extensions setup
   - `WebhookLeadModal.jsx` — Generic webhook (IndiaMART, 99acres, MagicBricks, custom)
   - `IntegrationCard.jsx` — Enhanced card with real status + "Configure" button
3. **`src/app/(tenant)/integrations/page.js`** — Rebuilt with real API calls + modals

### B. Backend — New Controllers & Migrations
1. **`IntegrationSettingsController.java`** — CRUD for all integration configs stored in `tenant_settings`
2. **`WebhookLeadController.java`** — Public webhook endpoint for IndiaMART / 99acres / MagicBricks / custom sites
3. **`V31__integration_settings.sql`** — `integration_configs` table (per-tenant key-value store for API keys)
4. **`GoogleAdsWebhookController.java`** — Google Ads lead form webhook receiver

---

## 3. API Endpoints Map

### Existing (Backend already has)
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/admin/meta/pages` | List Meta pages |
| POST | `/api/admin/meta/pages/sync` | Sync pages from Graph API |
| POST | `/api/admin/meta/pages/{id}/subscribe` | Subscribe page to webhooks |
| POST | `/api/admin/meta/backfill` | Manual lead backfill |
| GET | `/api/admin/meta/diagnostics` | Token + permissions check |
| POST | `/api/admin/meta/events/requeue` | Requeue failed events |
| GET/POST | `/api/webhooks/meta` | Meta webhook receiver |

### New (We are building)
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/integrations` | List all integration configs for tenant |
| PUT | `/api/integrations/{key}` | Save/update integration config |
| DELETE | `/api/integrations/{key}` | Remove integration config |
| POST | `/api/webhooks/leads/{source}` | Generic lead webhook (indiamart, 99acres, magicbricks, custom) |
| POST | `/api/webhooks/google-ads` | Google Ads lead form webhook |

---

## 4. Meta Integration — Required Credentials
| Field | Where to get |
|-------|-------------|
| App ID | Meta for Developers → Your App → Settings → Basic |
| App Secret | Same page |
| System User Token | Business Manager → System Users → Generate Token (needs `leads_retrieval`, `pages_read_engagement`, `pages_manage_metadata`) |
| Verify Token | Any random string you set (must match `META_VERIFY_TOKEN` env var) |
| Webhook URL | `https://api.smoothsales.in/api/webhooks/meta` |

### Meta Conversions API
| Field | Where to get |
|-------|-------------|
| Pixel ID | Events Manager → Your Pixel → Settings |
| Access Token | Events Manager → Your Pixel → Settings → Conversions API → Generate Access Token |

---

## 5. Google Ads Integration — Required Credentials
| Field | Where to get |
|-------|-------------|
| Developer Token | Google Ads API Center → Apply for access |
| Client ID / Secret | Google Cloud Console → OAuth 2.0 Credentials |
| Refresh Token | OAuth flow with `https://www.googleapis.com/auth/adwords` scope |
| Customer ID | Google Ads account (10-digit, no dashes) |
| Webhook URL | `https://api.smoothsales.in/api/webhooks/google-ads` |

---

## 6. Portal Webhooks — Required Setup
| Portal | Setup Path | Webhook URL |
|--------|-----------|-------------|
| IndiaMART | Seller Panel → Lead Manager → API Settings | `https://api.smoothsales.in/api/webhooks/leads/indiamart` |
| 99acres | Builder Dashboard → Lead Settings → Webhook | `https://api.smoothsales.in/api/webhooks/leads/99acres` |
| MagicBricks | Developer Portal → Webhook Config | `https://api.smoothsales.in/api/webhooks/leads/magicbricks` |
| Custom Site | Copy embed snippet from CRM | `https://api.smoothsales.in/api/webhooks/leads/custom` |

---

## 7. Files to Create/Modify

### Frontend
- `src/lib/api/integrations.js` — NEW
- `src/components/integrations/MetaLeadsModal.jsx` — NEW
- `src/components/integrations/GoogleAdsModal.jsx` — NEW
- `src/components/integrations/WebhookLeadModal.jsx` — NEW
- `src/components/integrations/integration-card.jsx` — MODIFY (add onConfigure prop)
- `src/app/(tenant)/integrations/page.js` — MODIFY (wire modals + real API)

### Backend
- `db/migration/V31__integration_configs.sql` — NEW
- `entity/IntegrationConfig.java` — NEW
- `repository/IntegrationConfigRepository.java` — NEW
- `controller/IntegrationSettingsController.java` — NEW
- `controller/WebhookLeadController.java` — NEW
- `controller/GoogleAdsWebhookController.java` — NEW
- `service/IntegrationConfigService.java` — NEW
- `service/WebhookLeadService.java` — NEW
