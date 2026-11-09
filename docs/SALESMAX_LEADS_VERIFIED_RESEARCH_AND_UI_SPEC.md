# Salesmax Leads Module — Verified Research, Page-wise Component Spec & Build Plan

> **Date:** November 1, 2026
> **Scope:** The Leads tab and its 7 sub-tabs (Active Leads, Worked Leads, Businesses, Documents, Segments & Lists, Uploads, Distributions) plus the Lead Details page.
> **App updated:** `smoothsales-frontend/apps/crm`
> **Supersedes:** the "Implementation Status" in `SALESMAX_LEADS_ALL_PAGES_DEEP_ANALYSIS_AND_PLAN.md` stays valid; this doc adds verified Salesmax behaviour and the second build round.

---

## 0. How to read this document

The Salesmax web app (`app.salesmax.ai`, formerly **Superfone**, `app.superfone.ai`) is behind a login, so its screens cannot be inspected directly. Every claim below is tagged:

- **Verified:** stated on salesmax.ai product pages or the Salesmax help center (sources in §7).
- **Inferred:** not documented publicly; a design decision for our CRM based on the verified workflow. Treat these as ours, not as a copy of Salesmax.

The earlier analysis doc mixed both without labels (for example its 13-column table spec and exact widths are not documented anywhere public). This doc corrects that.

---

## 1. What Salesmax's Leads workflow is (verified)

| Concept | What Salesmax says | Source |
|---|---|---|
| **Leads is a top-level menu with a Business sub-section** | Help steps: "Click **LEADS** → Click **BUSINESS** → Click **ADD BUSINESS** → enter details → **SUBMIT**". A Business is an organization you interact with, stored so the team shares its information. | Help: *How to Add New Business* |
| **Lifecycle stages** | `New lead → Prospecting → Opportunity → Closed`. "Called → Prospecting · Interested → Opportunity · Won, lost, or not interested → Closed." Dispositions, next actions and deal results move leads automatically. | /sales-crm, /lead-management-software |
| **Status labels** | Leads sorted by status such as **Fresh** and **Need Follow-up**. | SoftwareFinder listing |
| **Work queue** | Each owner has a work queue. New leads appear "at the top of that owner's work queue". Work view header: **Owner · last activity · next action · overdue**. | /lead-management-software, blog *speed-to-lead* |
| **Power dialer / auto calling** | "Auto calling · 4 of 23", a **Next call ready** card with leads left in today's queue; auto-dials a lead list, skips busy/unanswered. | /for/telecalling-teams, /features |
| **Call outcome form** | After a call: **disposition, a note, callback time, next action**; choosing an outcome can **automatically create a deal**. Caption: "Call outcome · disposition · automatic deal · next action · note." | /for/telecalling-teams |
| **Dispositions** | Interested, No answer, Callback, Not interested, Not reachable; also Busy, Invalid number (not recycled), Opted out. "Not answered" is a workflow state, not a dead lead. | /for/telecalling-teams, blog *speed-to-lead* |
| **Follow-up states** | Next actions are **due today, upcoming, or overdue**; overdue surfaces to managers. Example: "Call tomorrow · 11:30 AM", "Callback due · 11:30 AM". | /lead-management-software |
| **Lead detail actions** | Web app: on Lead details click **ACTION → Add Notes** (heading + description → SUBMIT) or **ACTION → LOG VISIT** (visit notes → SUBMIT). A global **ADD** button offers ADD NOTES / ADD VISIT. Mobile: **PREVIEW** opens details. | Help: *How to add call notes*, *How to add visit notes* |
| **Lead record content** | Owner, latest note, open task, call history, follow-up due; one timeline of calls, WhatsApp, notes, outcomes, meetings, deals, payments. | /lead-management-software, /sales-crm |
| **Search** | Search leads by **name or phone number**; reps see own + their team's leads. | Help: *How to search for the Lead* |
| **Assignment / distribution** | Rules: **round robin · source · product · geography**; by territory and availability. Bulk import then distribute requires **admin/manager role**. **Pending assignments** shows pending leads and pending tasks in one place, where they can be assigned. | /features, Help: *bulk import and distribute*, *Pending Assignments* |
| **Duplicates** | "Duplicate detection & merge": matching **phone numbers and emails** are caught automatically. | /features |
| **Manager attention queues** | Deals not worked, demos given, expired leads, lead-quality checks, missed calls, pending payments, neglected prospects — "open the exact leads behind every count". | /sales-crm |
| **User Wise Lead Position report** | Per salesperson: new leads, prospecting, followed-up leads / dispositions, opportunities, closed leads, revenue, **work rate, junk rate, deal conversion**. | /sales-crm, /lead-management-software |
| **Call Details report** | Total calls, connected calls, duration, dispositions, missed calls, activity by salesperson. | /for/telecalling-teams |
| **Recent activities** | A recent-activities view of what you and your team logged; an Activities tab with real-time updates. | Help: *Recent activities* |
| **Speed-to-lead metrics** | First-response in minutes, untouched new leads, oldest unworked enquiries, first-attempt outcomes, whether promised callbacks were completed. | blog *speed-to-lead* |
| **Quotes** | Itemized, branded quotes generated from deal data; payment links. | /features |

**Not publicly documented (so everything about them in our CRM is Inferred):** the exact pages for Worked Leads, Documents, Segments & Lists, Uploads and Distributions; table columns and widths; filter drawers; column chooser; bulk action bar.

---

## 2. Page-by-page component spec

Legend: ✅ existed before this round · 🆕 built this round · (V) verified basis · (I) inferred

### 2.1 Active Leads — `/leads/active` (the owner's work queue)

| Component | Behaviour | Basis | Status |
|---|---|---|---|
| Page header | Title, live count, Import Leads | (I) | ✅ |
| **Attention queues strip** | Clickable counts that filter the table: *Untouched new*, *Callbacks due today*, *Overdue follow-ups*, *Not connected yet*, *Neglected 7d+*, *High intent* | (V) attention queues + speed-to-lead metrics | 🆕 replaces 4 generic stat cards |
| Toolbar | Select-all, My/All, Filters, Saved views, search (name/phone/email), export, columns, refresh | Search (V), rest (I) | ✅ |
| Lead table | Lead, owner, stage, awaiting 1st touch, speed to 1st call, next follow-up, disposition, attempts, priority, source, last worked, last remark | Owner · last activity · next action · overdue (V) | ✅ |
| Filter drawer, bulk bar, import modal | Multi-filter, assign/stage/delete selected, import | Bulk import (V) | ✅ |
| Keyboard shortcuts | `/` or `Ctrl+K` search, `Ctrl+Shift+A` select, `Esc` clear | (I) | ✅ |

### 2.2 Worked Leads — `/leads/worked` (call execution ledger)

| Component | Behaviour | Basis | Status |
|---|---|---|---|
| Telemetry cards | Worked leads, connected rate, avg dials, recovery rate | Call Details report (V) | ✅ |
| Filters | Rep, outcome, date, search, export | (I) | ✅ |
| Worked table + call audit drawer | Per-lead attempts, disposition, direction, last remark | Call history (V) | ✅ |
| **Activity by salesperson** | Per rep: worked leads, calls, connected, connect %, not connected, callbacks pending | Call Details report "activity by salesperson" (V) | 🆕 |
| **Recent activities feed** | Latest calls, notes, visits, WhatsApp, tasks logged from any Lead Details page | Recent activities (V) | 🆕 |

### 2.3 Businesses — `/leads/businesses`

| Component | Behaviour | Basis | Status |
|---|---|---|---|
| **Add Business form** | Dialog: name (required, duplicate-checked), industry, phone, email, city, address, website, notes → Submit | LEADS → BUSINESS → ADD BUSINESS → SUBMIT (V); fields (I) | 🆕 (was name + city inline) |
| Accounts list | Name, cities, linked leads, combined potential, contact count | (I) | ✅ |
| Account 360 drawer | Potential, collected, primary contact, stakeholders, shared docs | (I) | ✅ + 🆕 business details & **Edit** |
| Unlinked leads triage | Attach or create business | (I) | ✅ |

### 2.4 Documents — `/leads/documents` (I)
Multi-file upload with lead + category, category pills, sort, preview, download, delete. ✅ No Salesmax-specific changes; header unified 🆕.

### 2.5 Segments & Lists — `/leads/segments` (I)
Rule builder with live count, saved lists, view leads, CSV export, WhatsApp broadcast (WhatsApp templates are (V)). ✅ Adds **lifecycle** (V) as a segment rule 🆕; header unified 🆕.

### 2.6 Uploads — `/leads/uploads`

| Component | Behaviour | Basis | Status |
|---|---|---|---|
| Dropzone + templates | CSV / Excel | Bulk import (V) | ✅ |
| 3-step wizard | Upload → Map columns → Review & deduplicate | (I) | ✅ |
| **Duplicate match on phone *and* email** | Rows matching an existing phone **or** email are duplicates | (V) | 🆕 (was phone only) |
| **Assign after import** | Optional owner or "Round robin" for the imported batch | Bulk import *and distribute* (V) | 🆕 |
| Import history | Batches with added / updated / skipped / invalid | (I) | ✅ |

### 2.7 Distributions — `/leads/distributions`

| Component | Behaviour | Basis | Status |
|---|---|---|---|
| KPI cards, round-robin status | Totals, unassigned, rotation health | Round robin (V) | ✅ |
| Rep workload & capacity | Status, rotation, capacity, balance | Availability-based assignment (V) | ✅ |
| **User Wise Lead Position** | Per rep: New, Prospecting, Followed-up, Opportunity, Closed, Revenue, Work rate, Junk rate, Conversion | (V) | 🆕 |
| Pending assignments / triage | Unassigned queue, manual + bulk + round-robin | Pending Assignments (V) | ✅ |
| Activity log | Assignment history | (I) | ✅ |

### 2.8 Lead Details — `/leads/active/[id]`

| Component | Behaviour | Basis | Status |
|---|---|---|---|
| **Work-queue bar** | "Lead 4 of 23" position, Prev/Next (`Shift+P/N`) | Auto calling "4 of 23" / Next call ready (V) | 🆕 position counter |
| **Lifecycle badge** | New lead / Prospecting / Opportunity / Closed, beside the pipeline stage | (V) | 🆕 |
| **ACTION menu** | Add Note · Log Visit · Add Task · Upload Document · Generate Quotation | ACTION → Add Notes / LOG VISIT (V) | 🆕 |
| **Call outcome form** | Disposition chips (Interested, Callback, No answer, Busy, Not reachable, Not interested, Invalid number); note; **callback time**; **next action**; **create deal** toggle; **Save & next lead** | (V) | 🆕 replaces dropdown + notes |
| **Note with heading** | Heading + description | Add Notes: heading + description (V) | 🆕 |
| **Log Visit** | Visit type, outcome, notes, date/time | LOG VISIT (V) | 🆕 |
| WhatsApp, Task, Follow-up chips, Deal card, Documents, Voice notes, Timeline | As built in round 1 | Timeline (V) | ✅ |

---

## 3. Lifecycle mapping (our stages → Salesmax lifecycle)

| Our `lead_stage` | Lifecycle |
|---|---|
| New, New Lead, Fresh | **New lead** |
| Contacted, Meeting Scheduled, Site Visit, Follow-up | **Prospecting** |
| Qualified, Proposal Sent, Negotiation | **Opportunity** |
| Deal Won, Won, Lost, Disqualified, Not Interested, Closed | **Closed** |

Implemented as `lifecycleOf(lead)` in `lib/leads-workspace.js`.

## 4. Disposition → lead field mapping

| Disposition | `lead_disposition` | `last_call_outcome` | Effect |
|---|---|---|---|
| Interested | Connected - Interested | Connected | Stage → Contacted if still New; optional deal (stage → Qualified) |
| Callback | Connected - Callback Requested | Connected | Requires callback time → `next_followup` |
| No answer | RNR | No answer | `unanswered_calls + 1`; suggests a retry follow-up |
| Busy | Busy | Busy | `unanswered_calls + 1` |
| Not reachable | Not Reachable | Not reachable | `unanswered_calls + 1` |
| Not interested | Not Interested | Connected | Stage → Not Interested (Closed) |
| Invalid number | Invalid Number | Invalid | Stage → Disqualified (not recycled) |

All dispositions: `attempts + 1`, `awaiting_first_touch = NO`, `last_worked`, `last_called_by`, timeline event.

## 5. Space & usability rules applied

- One shared `LeadsPageHeader` (icon, title, subtitle, actions) on every sub-page, so headers have identical height and padding.
- Page rhythm: `gap-4` between sections, `p-4` cards, `text-xs` body, `text-[11px]` hints.
- Every count is clickable when it represents a list (attention queues).
- Primary action per card is the right-most button; destructive actions confirm.

## 6. Build plan (this round)

1. `lib/leads-workspace.js`: `lifecycleOf`, `DISPOSITIONS`, `ATTENTION_QUEUES`, `matchesAttentionQueue`, `collectRecentActivities`.
2. `components/leads/leads-page-header.jsx`.
3. Active Leads: attention queues strip.
4. Lead Details: queue position, lifecycle badge, ACTION menu, Salesmax call outcome form with Save & next, heading notes, Log Visit.
5. Worked Leads: activity by salesperson, recent activities.
6. Distributions: User Wise Lead Position.
7. Uploads: phone + email dedupe, assign-after-import.
8. Businesses: Add Business dialog + edit.
9. Segments: lifecycle rule.
10. Build + lint the changed files.

## 7. Sources

- https://salesmax.ai/ — product overview
- https://salesmax.ai/features — feature list (duplicate detection, power dialer, assignment rules, quotes)
- https://salesmax.ai/lead-management-software — work queue, lifecycle, User Wise Lead Position
- https://salesmax.ai/for/telecalling-teams — auto calling, call outcome form, dispositions, Call Details report
- https://salesmax.ai/sales-crm — attention queues, lifecycle, report metrics
- https://salesmax.ai/blog/speed-to-lead-india — speed-to-lead metrics, disposition handling
- https://salesmax.tawk.help/article/how-to-add-new-business-to-superfone — LEADS → BUSINESS → ADD BUSINESS
- https://salesmax.tawk.help/article/how-to-add-call-notes — ACTION → Add Notes, global ADD
- https://salesmax.tawk.help/article/how-to-add-visit-notes — ACTION → LOG VISIT
- https://salesmax.tawk.help/article/how-to-search-for-the-lead-in-superfone — search by name/phone
- https://salesmax.tawk.help/article/how-to-check-the-pending-assignments-of-leads-or-tasks-in-superfone-web-app — pending assignments
- https://salesmax.tawk.help/article/how-to-check-the-recent-activities-in-superfone-web-app — recent activities
- https://salesmax.tawk.help/article/how-to-distribute-allocate-leads-tasks-to-the-teams — bulk import & distribute (admin/manager)
- https://softwarefinder.com/crm/salesmax — Fresh / Need Follow-up statuses
