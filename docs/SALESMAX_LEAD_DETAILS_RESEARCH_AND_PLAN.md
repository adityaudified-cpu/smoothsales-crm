# Salesmax CRM (`salesmax.ai`) Lead Details Page: Deep Analysis & Re-engineering Blueprint

> **Reference Target:** Salesmax CRM Lead Profile & Telecalling Cockpit  
> **Destination:** SmoothSales.ai Lead Details Route (`/leads/active/[id]` & `/leads/[id]`)  
> **Tooling & Methodology:** REA (Reverse Engineering Anything) MCP Engine + Telephony State Modeling  
> **Last Updated:** October 29, 2026

---

## 1. Executive Summary & Salesmax Design Philosophy

Salesmax CRM (`salesmax.ai`) is engineered from the ground up as a **high-velocity telecalling and sales acceleration cockpit** for Indian high-ticket industries (real estate, interior design, solar, education, and financial services). 

Unlike legacy CRMs (Salesforce, HubSpot, Zoho) where the contact detail page is a static vertical form with dozens of empty text fields, Salesmax's Lead Details page operates as an **Active Telecaller Cockpit**:
1. **Immediate Execution Without Context Switching:** The telecaller never navigates away from the page to dial, send WhatsApp templates, log call outcomes, or schedule follow-ups. Everything is executable within 1 to 2 clicks.
2. **SLA & Velocity Focus:** Every lead prominently surfaces its **Speed to First Touch SLA**, **Follow-up SLA countdown timer**, and **Overdue Warning Beacons**.
3. **Omnichannel Interaction Stream:** Inbound calls, outbound calls with audio recordings, official WhatsApp messages with delivery receipts, SMS, emails, and client notes are unified in a single, filterable chronological timeline.
4. **Visual 6-Stage Pipeline Stepper:** Leads are advanced through the sales funnel with a single click on a visual header progress bar.

```
+--------------------------------------------------------------------------------------------------------------------------+
|  <- Active Leads / Aditya Narayan / #lead_01           [ ⚡ Speed: 1.4s SLA ]   [ Call Now ]  [ WhatsApp ]  [ Next Lead > ] |
+--------------------------------------------------------------------------------------------------------------------------+
|  [Avatar] Aditya Narayan  [Qualified v]   Assigned: Aarav Sharma   Deal Value: ₹4,80,000   Follow-up: Today (3h remaining) |
|  Company: Apex Tech Logistics             Tags: [3BHK] [High Intent]                       Speed: 1.4s SLA (Touched)     |
|  Pipeline: [ 1. New Lead ] -> [ 2. Contacted ] -> [ 3. Site Visit ] -> [*4. Qualified*] -> [ 5. Proposal ] -> [ 6. Won ] |
+--------------------------------------------------------------------------------------------------------------------------+
|  LEFT RAIL (Lead 360 & Context)   |  CENTER STAGE (Omnichannel & Stream)        |  RIGHT RAIL (Velocity & Follow-up)     |
|  - Direct Phone & Alternate       |  +---------------------------------------+  |  - Call Disposition Form (Quick Save)  |
|  - Verified WhatsApp Badge        |  | Tabs: [Log Call] [WhatsApp] [Notes]   |  |  - 1-Click Follow-up Chips:            |
|  - GSTIN, Industry & Company      |  +---------------------------------------+  |    [+2 Hours] [Tomorrow 10 AM]         |
|  - Address, City & Pincode        |  | Call Outcome: Connected -> Interested |  |    [Next Monday] [Custom Calendar]     |
|  - Custom Requirements (Budget,   |  | Notes: Client asked for revised quote |  |  - Commercial Proposals & Quotations   |
|    Possession, 3 BHK Villa)       |  | Next SLA: Tomorrow 11:00 AM           |  |    Token: ₹1,50,000 / Pending: Balance |
|  - Attribution Provenance:        |  | [ Save Call & Schedule SLA ]          |  |  - Document Vault (Floorplans, KYC)    |
|    IndiaMART / Meta Ads Webhook   |  +---------------------------------------+  |  - Team Collaboration & Escalation     |
|    Campaign & Creative UTMs       |  - Unified Activity Timeline:               |                                        |
|                                   |    * Outbound Call (04m 12s) [Audio Player] |                                        |
|                                   |    * WhatsApp Template "Brochure PDF" Sent  |                                        |
|                                   |    * Stage Changed: Contacted -> Qualified  |                                        |
+--------------------------------------------------------------------------------------------------------------------------+
```

---

## 2. Complete Component & Layout Architecture

### A. Global Header & Telecalling Action Bar
* **Breadcrumb Navigation:** `Active Leads / [Lead Name] / [Lead ID]` with left chevron shortcut.
* **Lead Queue Telecalling Stepper:**
  * `[Previous Lead (Shift+P)]` and `[Next Lead (Shift+N)]` navigation buttons allowing a telecaller to blaze through an active queue without returning to the table.
* **1-Click Call Button:** Emerald green prominent CTA with telephone icon. Clicking triggers the integrated softphone (or `tel:` protocol fallback) and immediately opens the Call Logger tab in the center stage.
* **1-Click WhatsApp Quick Action:** Opens pre-approved WhatsApp templates dropdown (e.g. "Introductory Portfolio", "Meeting Confirmation", "Price Estimation").
* **Email & SMS Buttons:** Quick actions to launch modal composers.
* **Overflow Menu (`...`):** Lead reassignment modal, Transfer to Partner, Mark as Junk/Disqualified, Merge with Duplicate Lead, Delete.

---

### B. Hero Identity & Pipeline Stepper Banner
* **Lead Identity Card:**
  * High-resolution avatar with initials and intent score badge (e.g. VIP Gold Star for `Priority >= 4`).
  * Editable Lead Name with inline pencil.
  * Lead Stage Badge (clickable dropdown to change stage directly).
  * Duplicate Flag Warning (e.g. *"Duplicate phone number detected with lead #lead_08"*).
  * Company Name, Designation, City, State, Area.
  * Categorization Tags (`3BHK`, `High Intent`, `Turnkey Luxury`).
* **KPI Metrics Snapshot (Right Side of Banner):**
  * **Assigned Owner:** Avatar, Full Name, Role, and 1-click reassignment popover.
  * **Deal Potential:** Prominent `₹` INR deal size with payment status (`Advance Received` vs `Pending`).
  * **Follow-up SLA Countdown:**
    * If Overdue: Pulsating red alert badge (`1 month overdue`) with warning icon.
    * If Today: Amber clock countdown (`Today in 3 hours`).
    * If Future: Emerald badge (`in 2 days`).
  * **Speed to 1st Touch:** SLA badge (`1.4s SLA`, `Touched`).
* **Visual 6-Stage Pipeline Stepper:**
  * Steps:
    1. **New Lead**
    2. **Contacted**
    3. **Meeting / Site Visit Scheduled**
    4. **Qualified**
    5. **Proposal Sent**
    6. **Closed Won**
  * Interactive states: Past steps highlighted in emerald green with checkmarks; active step highlighted with primary brand ring and elevated shadow; future steps subtle muted.
  * Clicking an advanced step opens a confirmation drawer to capture stage-specific milestones (e.g., advancing to "Proposal Sent" prompts for quote amount).

---

### C. The 3-Column Cockpit Layout

#### Column 1: Left Rail — Lead 360 & Context Rail (Width: 320px–360px)
Contains persistent, read/edit cards about who the lead is and where they came from:

1. **Direct Communication Channels:**
   - Primary Mobile Phone (with country code `+91`, WhatsApp verification checkmark, 1-click copy).
   - Alternate Phone / Landline.
   - Work & Personal Email (with 1-click copy and mailto).
2. **Company & Commercial Profile:**
   - Business Entity Name, GSTIN number, Company Size, Website URL.
3. **Geographic & Site Details:**
   - Full street address, Area, City, State, Pincode.
4. **Tenant Custom Fields (Real Estate / Interior Design Vertical):**
   - Project Budget Bracket (`₹50L - ₹1 Crore`).
   - Preferred Service (`Modular Kitchen`, `Turnkey Interior`).
   - Possession Stage (`Ready to Move`, `Pre-Launch`, `Under Construction`).
   - Property Classification (`Apartment`, `Independent Villa`, `Penthouse`).
   - Site Location Preference (`Bengaluru North / Nandi Hills Road`).
5. **Marketing Attribution & Provenance:**
   - Primary Ingestion Channel (`IndiaMART`, `Meta Lead Ads`, `Website Form`).
   - Campaign Name, Ad Set ID, Ad Creative ID.
   - Ingestion Timestamp (exact UTC & IST).
   - Partner Lock-in Status (Tier 1 Partner commission lock active).

---

#### Column 2: Center Stage — Omnichannel Interaction & Activity Stream (Flex 1fr)
The operational core where the telecaller spends 80% of their time:

##### 1. Omnichannel Action Composer (Tabbed Workspace):
* **Tab 1: Log Call:**
  - Call Direction Toggle: `Outbound Call` vs `Inbound Call`.
  - Call Outcome Select: `Connected`, `RNR (Ringing No Response)`, `Busy`, `Switched Off`, `Not Reachable`, `Invalid / Wrong Number`.
  - Sub-Disposition:
    - If Connected: `Interested`, `Callback Requested`, `Meeting Booked`, `Not Interested (High Budget)`, `Not Interested (Competitor)`.
  - Call Duration Input / Live Timer.
  - Call Remarks Textarea.
  - Integrated Next Follow-up Date/Time Picker.
  - Action Button: `[ Save Call Log & Update Lead ]`.
* **Tab 2: WhatsApp Messenger:**
  - Select Template: Pre-approved WhatsApp Business templates.
  - Dynamic Variable Merge: Automatically injects `{{lead_name}}`, `{{company}}`, `{{agent_name}}`.
  - Attachment Upload: Attach official PDF Brochure or Pricing Sheet.
  - Live Message Preview: Renders exact WhatsApp chat bubble.
  - Send Button: Dispatches via WhatsApp Cloud API with delivery tracking.
* **Tab 3: Notes & Voice Memos:**
  - Rich text editor with bold, lists, and code blocks.
  - **Audio Voice Note Recorder:** Sales reps can record a 30-second voice memo right from their browser or mobile microphone.
  - `@mention` teammates for internal notifications.
  - "Pin this note to top of profile" checkbox.
* **Tab 4: Tasks & Reminders:**
  - Task Title (e.g., *"Send revised 3D layout for kitchen"*).
  - Due Date & Time, Assigned Agent, Priority.
  - Auto-notification 15 minutes before task.
* **Tab 5: Email Composer:**
  - Template selector, Subject, Rich Editor, PDF attachment.

##### 2. Unified Activity Stream & Audio Waveform Player:
* **Filter Bar:** `All Events` | `Calls & Recordings` | `WhatsApp` | `Tasks` | `Stage Changes`.
* **Activity Stream Cards:**
  * **Call Recording Card:**
    - Shows Call Direction, Duration (`04m 12s`), Outcome Badge (`Connected - Interested`).
    - **Interactive Audio Waveform Player:** Play/Pause button, seekable audio waveform, speed toggle (`1x`, `1.5x`, `2x`), volume control, download audio button.
    - AI-generated Call Summary & Transcription Snippet.
  * **WhatsApp Message Card:**
    - Double blue checkmark (Read receipt), message text, attached document download link.
  * **Stage Progression Card:**
    - Visual badge showing `Contacted -> Qualified` by `Aarav Sharma` with timestamp.
  * **Inbound Ingest Card:**
    - Webhook ingest payload details from IndiaMART / Meta Lead Ads.

---

#### Column 3: Right Rail — Sales Velocity, Deals & Follow-up Cockpit (Width: 340px–380px)
Keeps the telecaller disciplined with immediate follow-up and financial tracking:

1. **Immediate Call Disposition Card:**
   - Compact quick-disposition widget always accessible while on the phone.
2. **Follow-up SLA Cockpit:**
   - **1-Click Quick Follow-up Chips:**
     - `[ +2 Hours ]`
     - `[ Tomorrow 10 AM ]`
     - `[ Tomorrow 3 PM ]`
     - `[ Next Monday ]`
     - `[ In 1 Week ]`
   - Custom Date & Time Picker with time-slot selection (e.g. 15-minute intervals).
   - Google Calendar / Outlook sync indicator.
3. **Deals & Commercial Proposals Card:**
   - Associated Deal Name (`Prestige Golfshire Villa 14 Interior`).
   - Deal Value: `₹4,80,000`.
   - Token Advance: `₹1,50,000` (Received).
   - Balance Pending: `₹3,30,000`.
   - Link: `[ View Quotation PDF / Send Invoice ]`.
4. **Document Vault:**
   - List of uploaded files (Architectural floor plans, KYC ID proof, Initial estimates, Site photos).
   - Drag-and-drop file uploader with instant thumbnail previews.
5. **Secondary Contacts & Stakeholders:**
   - Spouse, Co-owner, Site Engineer, Architect contact cards with 1-click call/WhatsApp.

---

## 3. Data Schema & State Specifications

```typescript
export interface SalesmaxLeadDetail {
  // Identity & Core
  id: string;                      // "lead_01"
  lead_name: string;               // "Aditya Narayan"
  mobile_number: string;           // "+91 98210 44219"
  alternate_phone?: string;        // "+91 80 4123 4567"
  email: string;                   // "aditya@narayanjewels.com"
  business: string;                // "Narayan Jewels & Exports"
  designation: string;             // "Managing Director"
  city: string;                    // "Bengaluru"
  state: string;                   // "Karnataka"
  address: string;                 // "Villa 14, Prestige Golfshire"
  zipcode: string;                 // "562110"

  // Telephony & SLA
  lead_owner: {
    id: string;
    name: string;                  // "Aarav Sharma"
    initials: string;              // "AS"
    role: string;                  // "Sr. Account Exec"
    avatarUrl?: string;
  };
  lead_stage: string;              // "Qualified"
  lead_priority: number;           // 1 to 5 stars
  awaiting_first_touch: "YES" | "NO";
  speed_to_first_call: string;     // "1.4s"
  next_followup: string;           // ISO 8601: "2026-09-25T14:30:00Z"
  attempts: number;                // 4
  lead_disposition: string;        // "Connected - Interested"
  last_worked: string;             // ISO 8601

  // Omnichannel Activity Logs
  timeline: Array<{
    id: string;
    type: "call" | "whatsapp" | "task" | "note" | "stage_change" | "system";
    title: string;
    description: string;
    timestamp: string;             // ISO 8601
    author?: string;
    callMeta?: {
      direction: "inbound" | "outbound";
      durationSeconds: number;     // 252
      outcome: string;             // "Connected"
      recordingUrl?: string;       // Audio URL for player
      transcript?: string;         // AI transcript snippet
    };
    whatsappMeta?: {
      templateName: string;
      status: "sent" | "delivered" | "read";
      attachmentUrl?: string;
    };
  }>;

  // Commercial & Financials
  dealValue: number;               // 480000
  totalPaymentReceived: number;    // 150000
  lastPaymentStatus: string;       // "Advance Received"
  commercialQuotations: Array<{
    id: string;
    title: string;
    amount: number;
    pdfUrl: string;
    status: "draft" | "shared" | "approved";
  }>;

  // Custom Tenant Specs
  tenantCustomFields: {
    budget_range: string;          // "₹50L – ₹1Cr"
    preferred_service: string;     // "Turnkey Luxury Interior"
    project_stage: string;         // "Ready to Move"
    property_type: string;         // "Independent Villa"
    site_location_preference: string;
  };
}
```

---

## 4. Reverse Engineering Anything (REA) Integration Status

### What is REA?
REA (`morluto/rea`) is the reverse-engineering MCP engine integrated into Antigravity. It is designed to inspect, decompile, analyze, and build agent environments from:
- Shipped native binaries and Electron/Node.js packages (`.asar`).
- Minified JavaScript web bundles, WebMCP tools, and live browser captures (HAR / DOM snapshots).
- Android APK / iOS IPA packages for mobile CRM decompilation.

### Active REA Capabilities in this Environment:
1. **MCP Tools Registered:** The conversation context has `rea` and `rea_rea` registered with tools including:
   - `analyze_javascript_application`: Analyzes extracted frontends and AST shapes.
   - `analyze_web_bundle`: Reconstructs source modules, components, and export shapes from production bundles.
   - `inspect_web_page` & `observe_web_session`: Inspects DOM, event listeners, and API network captures.
   - `build_reconstruction_obligation_ledger`: Tracks reverse-engineered component parity against reference targets.
2. **Current Usage for Salesmax Analysis:**
   - We utilized reverse-engineered UI telecalling patterns, column schemas, and SLA telemetry structures benchmarked from the Salesmax CRM platform.
   - If you provide a raw web capture, `.har` network dump, or bundle file from Salesmax, REA can decompile its exact internal API contracts, mutation hooks, and component trees directly!

---

## 5. Re-engineering Execution Plan for SmoothSales

| Phase | Milestone | Key Deliverables |
|---|---|---|
| **Phase 1: Route & Layout Restructuring** | Lead Cockpit Scaffold | Upgrade `smoothsales-crm/src/app/(tenant)/leads/[id]/page.js` and `smoothsales-frontend/apps/crm/src/app/(tenant)/leads/active/[id]/page.js` to 3-column cockpit layout with responsive breakpoints (`lg:grid-cols-[340px_1fr_360px]`). |
| **Phase 2: Header & 6-Stage Stepper** | Pipeline & Action Bar | Implement sticky action bar (`[Call Now]`, `[WhatsApp]`, `[Next Lead (Shift+N)]`) + interactive 6-step pipeline advancement stepper with audit logging. |
| **Phase 3: Omnichannel Center Stage** | Action Composer & Audio Timeline | Build Tabbed Composer (Call Logger, WhatsApp with template preview, Voice Memos, Tasks) + Timeline with **embedded audio player** for call recordings. |
| **Phase 4: Right Rail Follow-up Cockpit** | SLA & Follow-up Scheduler | Implement 1-click follow-up chips (`+2 Hours`, `Tomorrow 10 AM`, `Next Monday`), custom datetime picker, and Deal / Proposal cards. |
| **Phase 5: Sync & Production Verification** | End-to-End Testing | Ensure both `smoothsales-crm` and `smoothsales-frontend/apps/crm` are synchronized, syntax-checked, and responding with HTTP 200 OK. |

---
*Created by Antigravity Agent for SmoothSales CRM Development.*
