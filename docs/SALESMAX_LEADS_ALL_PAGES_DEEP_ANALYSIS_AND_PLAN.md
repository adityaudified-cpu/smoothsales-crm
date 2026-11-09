# Salesmax CRM (`salesmax.ai`) Leads Module: Complete Page-by-Page & Component-by-Component Deep Analysis & Development Blueprint

> **System Target:** SmoothSales CRM Multi-Tenant Telecalling Architecture  
> **Benchmark Reference:** Salesmax CRM (`salesmax.ai`) High-Velocity Telephony Engine  
> **Module Scope:** All 8 Sub-routes & Pages under the **Leads** Tab  
> **Date:** October 31, 2026  
> **Standard:** 100% Production-Grade, Simple, Compressed, High-Density Telecalling Cockpit (No Fluff / No Bloat)

---

## 1. Executive Overview & Salesmax Leads Architecture

In **Salesmax CRM (`salesmax.ai`)**, the **Leads** section is not just a generic contact database or CRM table. It is designed as a **high-speed telecalling execution engine** built specifically for high-ticket Indian verticals (Real Estate, Turnkey Interior Design, Luxury Architecture, Education, and Solar).

Sales reps and managers navigate through **8 dedicated sub-pages**, each serving a precise stage in the telecalling and lead management lifecycle:

```
+-------------------------------------------------------------------------------------------------------------------------------+
|                                                SALESMAX LEADS ECOSYSTEM                                                       |
+-------------------------------------------------------------------------------------------------------------------------------+
|                                                                                                                               |
|   1. Active Leads (/leads/active)       --> Live telecalling dispatch queue, SLA countdowns, 1-click call/WhatsApp, table    |
|   2. Worked Leads (/leads/worked)       --> Complete calling history, audit trail of touches, duration, attempts & remarks   |
|   3. Businesses (/leads/businesses)     --> B2B parent accounts, grouping multi-stakeholder contacts under 1 company entity   |
|   4. Documents (/leads/documents)       --> File repository for floorplans, 3D CAD renders, client KYC, quotes & receipts    |
|   5. Segments (/leads/segments)         --> Smart Lists & dynamic auto-updating filters (e.g., "Mumbai HNIs > 4★")            |
|   6. Uploads (/leads/uploads)           --> Bulk CSV/Excel ingestion wizard, column header auto-mapping & phone deduplication |
|   7. Distributions (/leads/distributions)--> Lead ownership balancing, round-robin quota monitor & unassigned triage queue     |
|   8. Lead Details (/leads/active/[id])  --> 3-Column Telecalling Cockpit: Lead 360 + Omnichannel Composer + SLA Follow-up    |
|                                                                                                                               |
+-------------------------------------------------------------------------------------------------------------------------------+
```

---

## 2. Page-by-Page & Component-by-Component Deep Breakdown

---

### Page 1: Active Leads Cockpit (`/leads/active` & `/leads`)

#### A. Purpose & User Journey
The primary operational dashboard for telecallers and sales reps. Reps open this screen at 9:00 AM to work their daily lead queue. The page must instantly communicate:
- How many leads are awaiting first touch (<5 minute SLA).
- Which follow-ups are overdue right now.
- Which leads are VIP high intent (≥4★).
- Provide immediate 1-click dialer and WhatsApp outreach without opening each lead.

#### B. Component Inventory & UI Specs

| Component Name | File Location | Exact Purpose & Features | Salesmax Benchmark Spec |
|---|---|---|---|
| `PageHeader` | Inline in `active/page.js` | Top bar with page title, active lead count, and primary "Import Leads" button. | Slim `h-8` action bar, title `text-base font-bold`, subtitle `text-[11px] text-muted-foreground`. |
| `InteractiveMetricCards` | Inline in `active/page.js` | 4 compressed telemetry pills that double as instant 1-click table filters. | **4 Cards:**<br>1. *Total Leads* (all active)<br>2. *Awaiting 1st Touch* (pulsating SLA alert)<br>3. *High Intent* (Priority ≥ 4★)<br>4. *Overdue Follow-ups* (needs attention).<br>Clicking a card toggles active ring highlight and filters the table. |
| `SampleDataBanner` | `components/leads/sample-data-banner.jsx` | Informs developer/tenant that sample data is loaded with 1-click "Exit sample data" or "Restore" buttons. | Compact banner with subtle emerald tint, dismissable to local storage. |
| `LeadsToolbar` | `components/leads/leads-toolbar.jsx` | Full telecalling control bar. | **Controls:**<br>1. Master checkbox with indeterminate support.<br>2. `My` vs `All` rep segmented toggle.<br>3. `Filters` trigger button with active count badge.<br>4. `Saved Views` dropdown (All Active, My Leads, Unassigned, High Intent, TAT Overdue, Proposal Sent).<br>5. Omni-search input with instant `X` clear.<br>6. `Export` dropdown (Visible leads vs Selected rows CSV).<br>7. `Column Chooser` (`12/16` columns) with search & drag-and-drop reorder.<br>8. `Refresh` button with spinner. |
| `LeadTable` | `components/leads/lead-table.jsx` | High-density TanStack React Table with fixed column widths and sticky pinning. | **12 Core Salesmax Telecalling Columns:**<br>1. `select` (44px, sticky left: 0)<br>2. `lead_name` (280px, sticky left: 44px) with avatar, source badge (`IM`, `META`), phone, city, and **row-hover floating quick actions** (Call, WhatsApp, Copy, View)<br>3. `lead_owner` (160px) with avatar + name or Unassigned badge<br>4. `lead_stage` (155px) with color-coded dot & pill<br>5. `awaiting_first_touch` (145px) with pulsating ping beacon<br>6. `speed_to_first_call` (145px) with lightning `⚡ < 5m` badge<br>7. `next_followup` (170px) with overdue warning & `border-l-4 border-l-rose-500` row accent<br>8. `lead_disposition` (155px) call outcome badge<br>9. `attempts` (95px) dials counter<br>10. `lead_priority` (135px) interactive 1–5 clickable rating stars<br>11. `lead_source` (150px) branded badge<br>12. `last_worked` (135px) relative time<br>13. `last_user_remark` (220px) snippet + inline pencil edit popover.<br>**Footer:** Rows per page (10, 15, 25, 50, 100), density toggle (compact/normal), page stepper. |
| `LeadsFilterDrawer` | `components/leads/leads-filter-drawer.jsx` | Slide-over sheet for multi-criteria slicing. | Filters: Pipeline Stage pills, Lead Owner picker, Lead Source pills, Priority rating buttons (5★ to 1★), City chips, and Awaiting 1st Touch filter. |
| `FloatingBulkActions` | `components/leads/floating-bulk-actions.jsx` | Bottom-floating bar when 1+ leads are selected. | Shows count selected, 1-click "Assign Rep", "Change Stage", "Batch Delete", and "Clear Selection". |
| `ExcelUploadModal` | `components/leads/excel-upload-modal.jsx` | Drag-and-drop CSV / Excel ingestion dialog. | Auto-validates rows, parses headers, skips duplicate phone numbers, and adds leads to pipeline with toast feedback. |

---

### Page 2: Worked Leads History (`/leads/worked`)

#### A. Purpose & User Journey
Worked Leads serves as the **telecalling execution ledger**. Sales managers and auditors use this page to evaluate telecaller productivity:
- Which leads have actually received outbound call attempts?
- What was the call outcome (Connected, RNR, Busy, Invalid)?
- What is the recovery rate on leads that were answered after a missed call?
- Prevents leads from slipping through the cracks after initial outreach.

#### B. Component Inventory & UI Specs

| Component Name | File Location | Exact Purpose & Features | Salesmax Benchmark Spec |
|---|---|---|---|
| `WorkedHeader` | `worked/page.js` | Header with execution summary, records count, and link back to Active Leads. | Icon badge `CheckCircle2`, title "Worked Leads", subtitle with live count. |
| `WorkedTelemetryCards` | *To be enhanced in `worked/page.js`* | 4 high-density metric cards summarizing calling performance. | 1. *Total Worked Leads* (all leads with attempts > 0)<br>2. *Connected Rate* (% of calls that spoke to lead)<br>3. *Average Attempts per Lead* (dialer persistence)<br>4. *Recovery Rate* (answered after initial missed attempt). |
| `WorkedToolbar` | *To be enhanced in `worked/page.js`* | Filter worked leads by rep, call outcome, and date range. | Rep dropdown (`Sneha Roy`, `Aarav Sharma`, `Rohan Varma`), Date filter (`Today`, `This Week`, `Last 30 Days`), Search bar, and CSV export. |
| `WorkedLeadsTable` | `components/leads/lead-table.jsx` | Reuses the core high-density table configured for worked audit columns. | Shows: Lead Name, Worked By Rep, Attempts Badge, Last Disposition (`Connected - Interested`, `RNR`), Direction (Inbound/Outbound with icon), Last Call Nature (`Negotiation`, `Introductory`), Last Worked Relative Time, and Remarks. |
| `CallHistoryQuickDrawer` | *New Component* | Clicking any worked row opens a slide-over showing the complete call attempt log, duration, and audio recordings for that specific lead. | Slide-over drawer with chronological list of all phone interactions and audio playback. |

---

### Page 3: Businesses & Parent Accounts (`/leads/businesses`)

#### A. Purpose & User Journey
In luxury interior design, enterprise B2B sales, and turnkey real estate, deals often involve **multiple stakeholders** (e.g. Managing Director, Site Engineer, Architect, Spouse, Finance Head) associated with a single project or company entity. Salesmax prevents multi-agent confusion by linking all these individual contacts under a single **Parent Business Account**.

#### B. Component Inventory & UI Specs

| Component Name | File Location | Exact Purpose & Features | Salesmax Benchmark Spec |
|---|---|---|---|
| `BusinessHeader` | `businesses/page.js` | Title, subtitle, and link to Active Leads. | Clean card header with `Building` icon. |
| `CreateBusinessBar` | `businesses/page.js` | Inline quick-create form for new company accounts. | Input for Company Name (e.g. "Apex Tech Pvt Ltd"), City, and "Add Business" CTA with duplicate validation. |
| `BusinessAccountsCardList` | `businesses/page.js` | Grid/List of parent accounts showing associated data. | Each card displays:<br>- Business Name & Associated Cities<br>- Linked Lead Chips (clicking opens lead detail)<br>- Total Leads Count badge<br>- Combined Deal Potential from all linked leads<br>- Delete empty account action. |
| `UnlinkedLeadsCard` | `businesses/page.js` | Triage queue for leads with no company assigned. | List of leads without parent accounts with a 1-click select dropdown to immediately attach them to an existing business account or create new. |
| `BusinessDetailDrawer` | *New Component* | Slide-over showing account 360: all contacts, total combined deal value, primary contact person, and shared architectural documents. | Clean multi-contact view for enterprise account management. |

---

### Page 4: Lead Documents & File Vault (`/leads/documents`)

#### A. Purpose & User Journey
Sales reps deal with heavy project files: architectural DWG floor plans, 3D interior renders, client KYC / Aadhar cards, quotation PDFs, payment advance receipts, and signed agreement letters. Salesmax provides a dedicated document repository with file tagging, lead linking, and instant download/preview.

#### B. Component Inventory & UI Specs

| Component Name | File Location | Exact Purpose & Features | Salesmax Benchmark Spec |
|---|---|---|---|
| `DocumentsHeader` | `documents/page.js` | Title, file count, storage indicator, and back link. | Icon `FileText`, title "Lead Documents & Attachments". |
| `UploadDropzoneCard` | `documents/page.js` | Drag-and-drop file uploader with lead selection. | Supports `.pdf`, `.dwg`, `.png`, `.jpg`, `.xlsx`, `.docx` up to 25MB.<br>Includes: Lead search picker, document category selector (`Quotation`, `Floorplan`, `KYC`, `Receipt`), and "Upload Document" CTA. |
| `DocumentsFilterToolbar` | *To be enhanced in `documents/page.js`* | Search by filename or lead name, and category filter pills. | Category pills (`All`, `Quotations`, `Floorplans`, `KYC Proofs`, `Receipts`), Sort dropdown (Date, Size, Name). |
| `DocumentsTable` | `documents/page.js` | High-density list of all saved documents. | File type icon, Filename, Linked Lead chip (clickable to lead details), Category badge, File Size (KB/MB), Uploaded Date, and Action buttons (1-click Download, Preview, Delete). |
| `DocumentPreviewModal` | *New Component* | In-browser preview modal for PDF and image documents without forcing a download. | Fullscreen modal with PDF viewer / image lightbox. |

---

### Page 5: Segments & Smart Lists (`/leads/segments`)

#### A. Purpose & User Journey
High-velocity sales requires targeting specific cohorts (e.g. "Mumbai HNIs with Budget > ₹1Cr", "IndiaMART Leads with No Touch in 2 Hours", "Overdue Proposal Leads", "Commercial Office Inquiries"). Salesmax allows reps and managers to create Dynamic Smart Lists that auto-populate as leads match the criteria.

#### B. Component Inventory & UI Specs

| Component Name | File Location | Exact Purpose & Features | Salesmax Benchmark Spec |
|---|---|---|---|
| `SegmentsHeader` | `segments/page.js` | Title, subtitle, and link to Active Leads. | Icon `Layers`, title "Lead Segments & Smart Lists". |
| `SegmentBuilderForm` | `segments/page.js` | Form to define filter rules for a smart list. | Inputs: Segment Name, Pipeline Stage dropdown, Lead Source dropdown, City dropdown, Minimum Priority stars, and live matching lead counter pill (*"Matches 6 leads right now"*). |
| `SavedSegmentsList` | `segments/page.js` | Cards representing saved dynamic segments. | Each card shows:<br>- Segment Title<br>- Filter criteria summary badges (`Stage: Qualified · City: Mumbai · Priority: 4+★`)<br>- Live matching count pill (`6 leads`)<br>- Action buttons: "View Leads" (expandable), "Export Segment CSV", "Broadcast WhatsApp Template", "Delete". |
| `SegmentLeadsInlineGrid` | `segments/page.js` | Expandable drawer showing the leads currently inside this segment with 1-click links to their detail pages. | Interactive chips with lead name, city, phone, and 1-click dialer. |

---

### Page 6: Bulk Ingestion & Uploads (`/leads/uploads`)

#### A. Purpose & User Journey
Telecalling teams receive leads in bulk from offline exhibitions, broker CSVs, agency Facebook exports, and IndiaMART bulk downloads. Salesmax has a 3-step ingestion wizard with phone deduplication, column header mapping, and attribution tagging.

#### B. Component Inventory & UI Specs

| Component Name | File Location | Exact Purpose & Features | Salesmax Benchmark Spec |
|---|---|---|---|
| `UploadHeader` | `uploads/page.js` | Header with title, explanation, and "Download CSV Template" button. | Icon `UploadCloud`, title "CSV & Bulk Lead Uploads". |
| `BulkUploadDropzone` | `uploads/page.js` | Large dashed dropzone supporting drag-and-drop for `.csv`, `.xlsx`, `.xls` files. | Icon `FileSpreadsheet`, drag-over highlight, browse file button, and template download button. |
| `ExcelUploadModal` | `components/leads/excel-upload-modal.jsx` | 3-step import wizard dialog. | **3 Steps:**<br>1. *Upload:* Parses file headers, displays row count.<br>2. *Map Columns:* Maps CSV headers to CRM keys (`lead_name`, `mobile_number`, `city`, `business`, etc.) with drop-down overrides.<br>3. *Review & Deduplicate:* Highlights duplicate phone numbers against existing database with options: "Skip Duplicates" (Recommended) vs "Update Existing". |
| `RecentImportsHistory` | *To be enhanced in `uploads/page.js`* | Table showing past bulk uploads with timestamp, filename, rows imported, duplicate count, and imported by rep. | Audit history of all bulk ingestion batches. |

---

### Page 7: Ownership & Distributions (`/leads/distributions`)

#### A. Purpose & User Journey
Lead distribution fairness and SLA velocity depend on balanced workload. Salesmax monitors rep workload, quota caps, active telecalling status (Available / On Break / Offline), unassigned lead counts, and round-robin routing health.

#### B. Component Inventory & UI Specs

| Component Name | File Location | Exact Purpose & Features | Salesmax Benchmark Spec |
|---|---|---|---|
| `DistributionHeader` | `distributions/page.js` | Title, subtitle, link to Active Leads, and link to "Routing Rules (`/distribution-rules`)". | Icon `Share2`, title "Lead Ownership & Distribution". |
| `DistributionStatsCards` | `distributions/page.js` | 3 KPI cards showing pipeline workload balance. | 1. *Total Leads in Workspace*<br>2. *Assigned Leads* (emerald card)<br>3. *Unassigned Leads* (amber warning card if > 0). |
| `RepWorkloadTable` | `distributions/page.js` | Workload summary by assigned owner. | Rep Avatar, Name, Total Leads assigned, Contacted %, Overdue count, and Quick "Reassign / Balance" action. |
| `UnassignedLeadsTriageQueue` | `distributions/page.js` | Table listing all leads currently unassigned with search bar and 1-click "Auto-Distribute Round Robin" or manual assign modal. | Ensures zero leads stay orphaned. |

---

### Page 8: Lead 360 & Telecalling Cockpit (`/leads/active/[id]` & `/leads/[id]`)

#### A. Purpose & User Journey
The core execution screen for telecallers. Allows the rep to handle calls, WhatsApp messaging, note-taking, pipeline advancement, document viewing, deal tracking, and follow-up scheduling on a single screen without page reloading or navigating away.

#### B. Component Inventory & UI Specs

| Component Name | File Location | Exact Purpose & Features | Salesmax Benchmark Spec |
|---|---|---|---|
| `TopActionBar` | `leads/[id]/page.js` | Slim top navigation bar. | **Controls:**<br>1. Breadcrumb navigation (`Active Leads / [Lead Name] / #[Lead ID]`).<br>2. Queue Navigation Stepper: `[< Prev Lead]` and `[Next Lead >]` buttons (keyboard shortcuts `Shift+P`, `Shift+N`) to blaze through queue without returning to table.<br>3. Immediate Action CTAs: `[Call Now]` (Emerald green dialer launch), `[WhatsApp]` (template picker), `[Copy Phone]`. |
| `HeroProfileBanner` | `leads/[id]/page.js` | Lead identity & vital stats banner. | Avatar with VIP 5-Star Intent badge (`★`), Lead Name, Duplicate warning flag, Stage pill, Subtitle (`Designation · Company · City, State`), Tags strip, and 4 KPI telemetry chips: Assigned Rep (`Sneha Roy`), Total Deal Value (`₹1,20,00,000`), Follow-up SLA badge (`in 1 day` or `OVERDUE` pulsating alert), and Speed SLA (`⚡ 2m`). |
| `Interactive6StageStepper` | `leads/[id]/page.js` | Visual 6-step progress stepper. | `1. New Lead` ➔ `2. Contacted` ➔ `3. Meeting Scheduled` ➔ `4. Qualified` ➔ `5. Proposal Sent` ➔ `6. Deal Won`.<br>Clicking any step immediately advances the lead and logs an audit entry to the activity timeline. |
| `LeftRail_DirectChannels` | `leads/[id]/page.js` | Direct phone & email channels card. | Monospace phone with 1-click copy, verified WhatsApp badge, work email with 1-click copy. |
| `LeftRail_EntityLocation` | `leads/[id]/page.js` | Company & geographic details card. | Company entity name, contact designation, street address, city, and state. |
| `LeftRail_RequirementsSpec` | `leads/[id]/page.js` | Tenant custom specifications card. | Project Budget (`> ₹1 Crore`), Preferred Service (`Turnkey Interior`), Possession Stage (`Ready to Move`), Property Type (`Independent Villa`). |
| `LeftRail_Attribution` | `leads/[id]/page.js` | Marketing provenance card. | Primary Channel (`Referral`, `IndiaMART`, `Meta Ads`), Campaign ID, Segment, and Partner Lock-in guarantee status. |
| `CenterStage_OmnichannelComposer` | `leads/[id]/page.js` | Unified rep action workspace with 4 tabs. | **4 Tabs:**<br>1. *Log Call:* Call outcome dropdown (`Connected`, `Meeting Confirmed`, `Callback Requested`, `RNR`, `Busy`, `Switched Off`), outbound dialer pill, discussion notes textarea, and "Save Log" CTA.<br>2. *WhatsApp:* Pre-approved WhatsApp Business template selector with dynamic variable merge (`{{lead_name}}`), live preview chat bubble, and "Send WhatsApp" CTA.<br>3. *Quick Note:* Internal note-taking with team `@mentions` and Audio Voice Note recorder trigger.<br>4. *Task:* Task title creator and calendar sync. |
| `CenterStage_ActivityTimeline` | `leads/[id]/page.js` | Chronological unified interaction stream with embedded audio player. | Filter pills (`All`, `Calls`, `WhatsApp`, `Tasks`).<br>**Embedded Call Recording Player:** Play/Pause button, seekable animated sound wave bars, duration counter (`03m 45s`), speed toggle (`1x`, `1.5x`, `2x`), download audio button, and AI transcript snippet!<br>WhatsApp delivery & read receipts, stage audit trail, and inbound webhook history. |
| `RightRail_FollowupCockpit` | `leads/[id]/page.js` | 1-Click fast follow-up scheduler. | Quick chips: `[+2 Hours]`, `[Tom 10 AM]`, `[Tom 3 PM]`, `[Next Mon]`.<br>Active SLA deadline display with 1-click "Clear" action. |
| `RightRail_DealsCommercials` | `leads/[id]/page.js` | Deal value and payment progress card. | Total Deal Potential (`₹1,20,00,000`), Token advance received, Balance pending, and "Generate Quotation PDF" CTA. |
| `RightRail_DocumentVault` | `leads/[id]/page.js` | Attached documents list and dropzone. | List of linked documents (`Villa_Floorplan_G+1.dwg`, `Client_KYC_ID.pdf`, `Italian_Finish_Palette.pdf`) with file size and 1-click download.<br>"Upload Document" dashed dropzone. |

---

## 3. Implementation Status (updated November 1, 2026)

All frontend gaps from the original analysis are implemented. Data lives in browser storage until the APIs are connected (see section 5).

| Route / Page | Status | What was built |
|---|---|---|
| **`/leads/active`** | Done | Keyboard shortcuts: `/` or `Ctrl+K` focuses search, `Ctrl+Shift+A` selects all visible rows, `Esc` clears selection. Import modal now receives existing leads for duplicate review. |
| **`/leads/worked`** | Done (already complete) | 4 telemetry cards, rep/outcome/date filters, call history drawer were already present. |
| **`/leads/businesses`** | Done | Summary KPIs, search, city on create, combined deal potential per account, "+ Create new business" from unlinked leads, **Account 360 drawer** (combined potential, collected, primary contact with star toggle, stakeholders with unlink, add stakeholder, shared documents with preview). |
| **`/leads/documents`** | Done | Multi-file dropzone (25MB each), lead search picker, **category** on upload, category filter pills with counts, sort (newest/oldest/name/size), storage indicator, **in-browser preview** (image, PDF, audio, video, text). |
| **`/leads/segments`** | Done | Live "Matches N leads right now" counter in the builder, **Export Segment CSV**, **WhatsApp broadcast** dialog (template, variables, preview, send-next queue with sent ticks), 1-click dial on lead chips, delete confirmation. |
| **`/leads/uploads`** | Done | Import wizard is now 3 steps: **Upload → Map Columns → Review & Deduplicate** (skip vs update existing, in-file duplicate detection, row preview). **Recent import batches** table (added / updated / skipped / invalid). |
| **`/leads/distributions`** | Done | Rep roster with **status** (Available / On Break / Offline), round-robin toggle, editable **capacity** with utilization bar, contacted %, overdue; **Auto-distribute round robin** (all or selected, capacity-aware, persistent cursor), bulk/manual assign, **Balance** (release over-capacity leads), reassign from all-assignments list, distribution activity log. |
| **`/leads/active/[id]`** | Done | **Voice notes** via microphone (saved to Documents, playable in timeline with speed + download), persistent per-lead timeline derived from real lead fields (no hardcoded sample story), real tasks (due date sets follow-up, mark done), follow-up chips use real calendar times + custom date-time, WhatsApp preview equals the sent message, correct dispositions for RNR/Busy/Switched Off, printable **quotation** (Save as PDF), live **document vault** (drag-drop upload, category, preview, download), `Shift+P` / `Shift+N` queue shortcuts, no invented phone/email fallbacks. |

**Data layer fix:** edits to sample leads (stage, owner, follow-up, remarks) used to be lost on reload. They now persist as patches (`smoothsales_sample_lead_overrides`, `smoothsales_sample_lead_deleted`).

**Not done:** the older `smoothsales-crm/` app was not synced; `smoothsales-frontend/apps/crm` is the app that was updated.

---

## 4. Phased Development Roadmap

```
+-------------------------------------------------------------------------------------------------------------------------+
|                                              PHASED IMPLEMENTATION PLAN                                                 |
+-------------------------------------------------------------------------------------------------------------------------+
|                                                                                                                         |
|  [Phase 1: Telemetry & Calling Audit]  -> Upgrade /leads/worked with the 4 calling telemetry cards & call history drawer |
|  [Phase 2: B2B Accounts & Stakeholders] -> Upgrade /leads/businesses with Account 360 drawer & combined deal value      |
|  [Phase 3: Document Vault & Preview]   -> Upgrade /leads/documents with in-browser PDF/Image preview lightbox & categories |
|  [Phase 4: Smart Segments & Broadcast] -> Upgrade /leads/segments with CSV export & WhatsApp broadcast action           |
|  [Phase 5: Uploads & Routing Audit]    -> Upgrade /leads/uploads & /leads/distributions with batch logs & auto-balance  |
|  [Phase 6: Verification & Polish]      -> Cross-browser testing, zero layout shift, sync smoothsales-crm & frontend     |
|                                                                                                                         |
+-------------------------------------------------------------------------------------------------------------------------+
```

---
## 5. Browser Storage → Future API Map

Every frontend-only store is isolated so the API swap touches one place.

| Feature | Current storage | Code location | Suggested endpoint |
|---|---|---|---|
| Lead edits / imports | `smoothsales_imported_leads`, `smoothsales_sample_lead_overrides`, `smoothsales_sample_lead_deleted` | `lib/hooks/use-leads.js` | `GET/POST/PATCH/DELETE /leads` |
| Lead timeline events | `smoothsales_lead_timeline_<leadId>` | `leads/[id]/page.js` (`addEvent`) | `GET/POST /leads/:id/activities` |
| Documents & voice notes | IndexedDB `smoothsales_crm_documents` | `lib/document-store.js` | `GET/POST/DELETE /leads/:id/documents` (multipart) |
| Import batches | `smoothsales_lead_import_history_v1` | `lib/leads-workspace.js` | `GET /lead-imports`, `POST /lead-imports` |
| Rep status / capacity | `smoothsales_rep_roster_v1` | `leads/distributions/page.js` | `GET/PATCH /reps/:id/availability` |
| Round-robin cursor | `smoothsales_round_robin_cursor_v1` | `lib/leads-workspace.js` | `POST /leads/distribute` (server-side) |
| Distribution log | `smoothsales_distribution_log_v1` | `leads/distributions/page.js` | `GET /distribution-audit-log` |
| Segments | `smoothsales_saved_lead_segments_v1` | `leads/segments/page.js` | `GET/POST/DELETE /segments` |
| Business accounts | `smoothsales_lead_business_accounts_v1` | `leads/businesses/page.js` | `GET/POST/PATCH /businesses` |
| WhatsApp templates | constant `WHATSAPP_TEMPLATES` | `lib/leads-workspace.js` | `GET /whatsapp/templates`; broadcast via `POST /whatsapp/broadcast` |
| Deal value | estimated from `budget_range` (`estimateDealValue`) | `lib/leads-workspace.js` | real `deal_value` on lead/deal |

---
*Created by Antigravity Agent for SmoothSales CRM Development Team. Status updated after implementation.*
