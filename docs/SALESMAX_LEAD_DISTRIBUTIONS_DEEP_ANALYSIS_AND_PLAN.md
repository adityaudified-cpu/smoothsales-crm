# Salesmax CRM (`salesmax.ai`) Lead Distribution & Ownership Engine: Deep Analysis & Implementation Blueprint

> **System Target:** SmoothSales CRM Multi-Tenant Telecalling Architecture  
> **Benchmark Reference:** Salesmax CRM (`salesmax.ai`) Telephony & Dynamic Dispatch Engine  
> **Route:** `/leads/distributions` (with integration to `/distribution-rules` and `/leads/active/[id]`)  
> **Date:** October 31, 2026  
> **Standard:** 100% Production-Grade, Compressed, High-Density Telecalling Cockpit (Zero Bloat, Full Interactive Frontend State)

---

## 1. Executive Overview & Salesmax Philosophy

In **Salesmax CRM (`salesmax.ai`)**, lead distribution is not merely a static "Assigned To" column in a database. It is the **central nervous system of high-velocity telecalling sales**. 

In high-ticket, rapid-response industries (Real Estate, Turnkey Interior Architecture, Solar, Education, and Wealth Advisory), the speed of lead dispatch directly dictates deal conversion:
* **The 5-Minute Inbound SLA:** Leads contacted within 5 minutes of form submission convert at an **800% higher rate** than those contacted after 30 minutes.
* **Telecaller Burnout & Quota Skew:** Without automated capacity limits, top performers get flooded with 60+ unworked leads while other reps sit idle, causing follow-up SLAs to breach.
* **Orphaned Lead Prevention:** Inbound leads from Meta Ads, IndiaMART, Justdial, and Website Webhooks that arrive when reps are on break or offline must be quarantined into a live **Unassigned Triage Queue** and automatically redistributed the second an eligible rep becomes available.

```
+-----------------------------------------------------------------------------------------------------------------------------------------+
|                                                  SALESMAX DYNAMIC DISPATCH ENGINE                                                       |
+-----------------------------------------------------------------------------------------------------------------------------------------+
|                                                                                                                                         |
|   INBOUND FIREHOSE                                      REAL-TIME DISPATCH ENGINE                            TELECALLER SQUAD           |
|   ----------------                                      -------------------------                            ----------------           |
|   [ Meta Webhooks ]       \                             +------------------------------+                    / [ Aarav Sharma ]          |
|   [ IndiaMART Push ]       > ---> [ Matching Engine ] ->| 1. Availability Filter       |-> [ Round Robin ] ---> [ 14/25 Capacity: 56% ] |
|   [ Website Forms ]       /       (Location, Budget,    | 2. Max Quota Ceiling Check   |   [ Workload-Based ]   \ (🟢 Available)        |
|   [ CSV Bulk Upload ]    /         Category, Source)    | 3. Round-Robin Turn Rotation |                                                |
|                                                         +------------------------------+                     / [ Sneha Roy ]            |
|                                                                     |                                   ---> [ 22/25 Capacity: 88% ] |
|                                                                     v                                   \    (🟢 Available)         |
|                                                          [ If All Reps at Max Capacity ]                                                |
|                                                                     |                                        / [ Rohan Varma ]          |
|                                                                     v                                   ---> [ 28/30 Capacity: 93% ] |
|                                                         +------------------------------+                \    (🟡 On Call)             |
|                                                         |  UNASSIGNED TRIAGE QUEUE     |                                                |
|                                                         |  - Live SLA Warning Clock    |                     / [ Pooja Deshmukh ]       |
|                                                         |  - 1-Click Auto-Distribute   |                ---> [ 8/20 Capacity: 40% ]  |
|                                                         |  - Manual Batch Reassign     |                \    (🟠 On Break - Skip RR)  |
|                                                         +------------------------------+                                                |
|                                                                                                                                         |
+-----------------------------------------------------------------------------------------------------------------------------------------+
```

---

## 2. Page Architecture & Component Inventory

The Salesmax Lead Ownership & Distribution screen (`/leads/distributions`) delivers a compact, high-density operations command center structured into **7 core modules**:

```
+-----------------------------------------------------------------------------------------------------------------------------------------+
| 1. GLOBAL ACTION HEADER                                                                                                                 |
|    [Share2 Icon] Lead Ownership & Distribution Cockpit          [Routing Rules (3)]  [Active Leads]  [⚡ Auto-Distribute (Round Robin)] |
+-----------------------------------------------------------------------------------------------------------------------------------------+
| 2. TELEMETRY METRIC PILLS (Interactive Filters)                                                                                         |
|    +------------------------+ +------------------------+ +------------------------+ +-------------------------------------------------+ |
|    | Total Workspace Leads  | | Assigned Leads         | | Unassigned Triage      | | Engine Health & Rep Squad                       | |
|    | 24 Leads (100%)        | | 21 Leads (87.5%)       | | 3 Leads (12.5% Alert!) | | Active ⚡ 0.8s SLA · 4/5 Reps Online            | |
|    +------------------------+ +------------------------+ +------------------------+ +-------------------------------------------------+ |
+-----------------------------------------------------------------------------------------------------------------------------------------+
| 3. TELECALLER SQUAD: WORKLOAD, QUOTA & AVAILABILITY COCKPIT                                                                             |
|    - Rep Avatar, Name & Team Role                                                                                                       |
|    - Live Availability Selector (🟢 Available / 🟡 On Call / 🟠 On Break / ⚪ Offline)                                                  |
|    - Auto-Distribute Master Toggle (Enable/Pause lead routing for this agent)                                                           |
|    - Capacity Utilization Bar (e.g. 14 / 25 leads - 56% · Emerald/Amber/Rose)                                                           |
|    - Overdue Follow-ups SLA counter                                                                                                     |
|    - 1-Click "Reassign From Rep" modal trigger & "Filter Rep Leads" shortcut                                                            |
+-----------------------------------------------------------------------------------------------------------------------------------------+
| 4. UNASSIGNED LEADS TRIAGE QUEUE (Zero-Orphan Protection)                                                                               |
|    - Alert banner showing unassigned count and queue age                                                                                |
|    - Multi-select checkbox bar with bulk actions:                                                                                       |
|      [ Distribute Selected (Round Robin) ]  [ Assign Selected to Rep... ]  [ Clear ]                                                    |
|    - Unassigned rows: Lead Name, Source badge, Budget/Spec, In-Queue SLA Timer (⚡ <5m / ⚠️ >15m), Quick-assign rep dropdown               |
+-----------------------------------------------------------------------------------------------------------------------------------------+
| 5. WORKSPACE LEAD ASSIGNMENT TABLE & REASSIGNMENT CONTROLS                                                                              |
|    - Tabs: [All Leads (24)] [Assigned (21)] [Unassigned (3)] [High Intent ≥4★ (11)]                                                     |
|    - Omni-Search & Source Filter & Owner Filter dropdowns                                                                               |
|    - High-density rows: Checkbox, Lead Name & Phone, Owner (with 1-click in-table dropdown reassign), Stage Pill, 1-5 Priority Stars,   |
|      Source, City, SLA / Last Worked, Floating Quick Actions (Call, WhatsApp, Reassign)                                                 |
+-----------------------------------------------------------------------------------------------------------------------------------------+
| 6. REASSIGNMENT MODAL & BULK TRANSFER DIALOG                                                                                            |
|    - Select target telecaller with live capacity preview                                                                                |
|    - Reason tagging ("Workload Balancing", "Language Match", "Senior Escalation")                                                      |
|    - Optimistic batch update with instant Sonner toast notification                                                                     |
+-----------------------------------------------------------------------------------------------------------------------------------------+
| 7. RECENT DISTRIBUTION AUDIT TRAIL (Slide-Over Drawer)                                                                                  |
|    - Real-time event ledger showing every routing decision: Matched Rule, Lead Name, Assigned Rep, Latency (ms), Trigger Source & Time |
+-----------------------------------------------------------------------------------------------------------------------------------------+
```

---

## 3. Detailed Component Specifications

### Component 1: `DistributionPageHeader`
* **File Location:** `src/app/(tenant)/leads/distributions/page.js`
* **Key Visuals:**
  * Left: `Share2` icon in `bg-primary/10 text-primary` container, bold title *"Lead Ownership & Distribution"*, subtitle *"Real-time telecalling workload balancing, quota compliance & automated round-robin dispatch"*.
  * Right Action Group:
    * `Audit Log` button (`History` icon with badge) that opens slide-over drawer.
    * `Routing Rules` button (`GitBranch` icon) linking to `/distribution-rules`.
    * `Active Leads` button (`ArrowLeft` icon) linking to `/leads/active`.
    * **`Auto-Distribute (Round Robin)` CTA:** Primary emerald button (`Zap` icon) that triggers one-click automated redistribution of all unassigned leads across eligible reps.

### Component 2: `DistributionTelemetryCards`
* **File Location:** `src/components/distribution/distribution-telemetry-cards.jsx`
* **Card Breakdown:**
  1. **Total Workspace Leads:** Total count, subtitle *"All active & closed leads in tenant"*. Click to clear filters and view all.
  2. **Assigned Pipeline:** Emerald styling, count + percentage badge (`87.5%`), subtitle showing average leads per rep. Click to filter table to assigned leads.
  3. **Unassigned Triage Queue:** Amber/Rose alert styling with pulsating ping beacon if `count > 0`. Subtitle *"Immediate dispatch required (<5m SLA)"*. Click to filter table to unassigned leads.
  4. **Engine Health & Squad Status:** Cyan/Indigo styling, displays engine latency (`⚡ 0.8s SLA`), active routing rules count (`3 Active Rules`), and rep availability (`4/5 Reps Online`).

### Component 3: `RepWorkloadTable`
* **File Location:** `src/components/distribution/rep-workload-table.jsx`
* **Purpose:** Provides sales managers with complete visibility over every telecaller's current load, availability, and quota headroom.
* **Columns & Controls:**
  * **Telecaller Profile:** Initials avatar with role color, full name, email, and team tag (`Jaipur Sales Team`, `Enterprise Accounts`).
  * **Availability Status Selector:** Dropdown badge allowing instant switching between:
    * `🟢 Available` (Eligible for automated round robin)
    * `🟡 On Call` (Busy on an active call)
    * `🟠 On Break` (Paused; skipped by round robin)
    * `⚪ Offline` (Logged out; skipped by round robin)
  * **Auto-Routing Toggle:** Switch component. When turned off, the rep is excluded from automated distribution without changing their profile.
  * **Capacity Utilization Bar:** 
    * Format: `[Current Count] / [Max Active Leads] leads ([Utilization]%)`
    * Progress Bar Color: Emerald if `<75%`, Amber if `75%–90%`, Rose if `>90%` or full.
  * **SLA Overdue Warning:** Badge showing how many leads assigned to this rep have overdue follow-up SLAs.
  * **Quick Actions:**
    * `Reassign Leads`: Opens dialog to transfer leads from this rep to another.
    * `Filter Table`: Filters the workspace leads table to inspect only this rep's pipeline.

### Component 4: `UnassignedTriageQueue`
* **File Location:** `src/components/distribution/unassigned-triage-queue.jsx`
* **Purpose:** Quarantines leads without owners to prevent SLA breaches.
* **Controls & Features:**
  * Master & individual selection checkboxes for bulk operations.
  * Filter search input specifically for unassigned leads.
  * Bulk action bar:
    * `Distribute Selected (Round Robin)`: Distributes only the checked unassigned leads.
    * `Assign Selected to Rep...`: Opens rep picker.
  * Row Details:
    * Lead Name (clickable link to `/leads/active/[id]`)
    * Phone & Email
    * Inbound Source (`Meta Ads`, `IndiaMART`, `Website Form`, `Referral`)
    * City / Budget Requirement
    * Waiting In Queue Duration with SLA status badge:
      * `<5 mins`: Emerald `⚡ Fresh (<5m SLA)`
      * `5–15 mins`: Amber `⏳ Aging (8m)`
      * `>15 mins`: Rose `⚠️ SLA Breached (24m)`
    * Inline 1-Click Rep Assignment Dropdown for instant single-lead assignment.

### Component 5: `AllAssignmentsTable`
* **File Location:** `src/components/distribution/all-assignments-table.jsx`
* **Purpose:** Complete high-density workspace leads directory with in-place owner reassignments.
* **Features:**
  * Segmented filter tabs: `All Leads`, `Assigned`, `Unassigned`, `High Priority (≥4★)`.
  * Multi-field search (Lead Name, Owner Name, Source, City, Phone).
  * Rep filter dropdown to isolate any team member's portfolio.
  * Inline Lead Owner selector: Clicking the owner badge opens a popover to immediately reassign the lead with instantaneous optimistic update and persistence.
  * Clickable 1–5 Priority rating stars.
  * Row action buttons: Launch phone dialer, send WhatsApp, copy phone, view full lead cockpit.

### Component 6: `ReassignModal`
* **File Location:** `src/components/distribution/reassign-modal.jsx`
* **Purpose:** Controlled reassignment of one or more leads between team members.
* **Fields:**
  * Source: Current lead(s) / source rep.
  * Target Rep Picker: Shows each rep's name, current capacity, and live availability status. Reps at max capacity are flagged.
  * Reason for Reassignment: `Workload Balancing`, `Language / Regional Match`, `Senior Account Escalation`, `Leave Coverage`, `Customer Request`.
  * "Transfer Leads" CTA with loading state and Sonner toast.

### Component 7: `DistributionAuditDrawer`
* **File Location:** `src/components/distribution/distribution-audit-drawer.jsx`
* **Purpose:** Slide-over sheet displaying the real-time event audit trail from `MOCK_DISTRIBUTION_AUDIT_LOG`.
* **Details Displayed:**
  * Lead Name & Matched Rule
  * Assigned Rep
  * Routing Decision Latency (`0.8s SLA`)
  * Trigger Source (`Meta Webhook`, `Round Robin Engine`, `Manual Reassignment`)
  * Relative timestamp (`2 mins ago`, `14 mins ago`).

---

## 4. Availability-Aware Round-Robin Dispatch Algorithm

The automated round-robin engine implemented in the frontend adheres to standard Salesmax enterprise routing rules:

```javascript
/**
 * Availability-Aware Round-Robin Dispatch Algorithm
 * 
 * 1. Filter Reps:
 *    - Must have autoLeadDistribution === true
 *    - Must have availability === "Available" (skip "On Break", "Offline")
 *    - Current active leads < maxActiveLeads (skip reps at capacity ceiling)
 * 
 * 2. If no reps eligible:
 *    - Alert user that all reps are busy or at capacity; keep leads in triage queue.
 * 
 * 3. Distribution Loop:
 *    - Sort eligible reps by current assigned count ascending (Workload-aware round robin)
 *    - For each unassigned lead:
 *        * Pick rep with lowest load who is under maxActiveLeads
 *        * Increment rep's assigned count
 *        * Reassign lead to rep
 *        * Create audit log entry with timestamp and rule "Sequential Round Robin"
 * 
 * 4. Persist Updates:
 *    - Update leads state via useLeads hook
 *    - Sync imported leads to localStorage
 *    - Trigger Sonner toast with summary: "Successfully distributed N leads across M reps!"
 */
```

---

## 5. Implementation Roadmap & Verification

1. **Step 1:** Create `src/components/distribution/distribution-telemetry-cards.jsx`
2. **Step 2:** Create `src/components/distribution/rep-workload-table.jsx`
3. **Step 3:** Create `src/components/distribution/unassigned-triage-queue.jsx`
4. **Step 4:** Create `src/components/distribution/reassign-modal.jsx`
5. **Step 5:** Create `src/components/distribution/distribution-audit-drawer.jsx`
6. **Step 6:** Create `src/components/distribution/all-assignments-table.jsx`
7. **Step 7:** Rewrite `src/app/(tenant)/leads/distributions/page.js` to assemble all components into a coherent, high-speed telecalling operations cockpit.
8. **Step 8:** Mirror changes to `smoothsales-crm` to keep both workspaces synchronized.
9. **Step 9:** Verify on Next.js dev server on port 3001 with zero errors, zero console warnings, and responsive layout.

---
*Created by Antigravity Agent for SmoothSales CRM Development Team.*
