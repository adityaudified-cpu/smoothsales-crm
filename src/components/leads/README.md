# SmoothSales.ai — Leads Module (Salesmax CRM Parity)

This module implements the Salesmax-style Leads architecture with 63 columns, sticky navigation, multi-tenant custom fields, and real-time filtering.

## File Structure

```
apps/crm/src/
├── app/(tenant)/leads/
│   ├── layout.js                     # Unified dark green secondary tab bar for all /leads/* routes
│   ├── page.js                       # Default redirect to /leads/active
│   ├── active/page.js                # Core Active Leads table view with all features
│   ├── worked/page.js                # Worked Leads view (filtered by attempts > 0 or last_worked)
│   ├── businesses/page.js            # Businesses placeholder with empty state
│   ├── documents/page.js             # Documents repository placeholder with empty state
│   ├── segments/page.js              # Smart lists & segments placeholder with empty state
│   ├── uploads/page.js               # CSV / spreadsheet bulk ingest placeholder
│   └── distributions/page.js         # Real-time lead routing logs placeholder
├── components/leads/
│   ├── leads-table.jsx               # TanStack Table + sticky lead column, hover quick actions, relative times
│   ├── leads-toolbar.jsx             # Select-all, My|All toggle, saved views, Ask AI, search, refresh
│   ├── leads-secondary-nav.jsx       # 7-tab dark green horizontal secondary nav bar
│   ├── columns-popover.jsx           # Column chooser with show/hide checkboxes, reordering, and search
│   ├── leads-filter-drawer.jsx       # Slide-out sheet for filtering by stage, owner, source, priority, city
│   ├── sample-data-banner.jsx        # Green info banner with "Exit sample data" & restore toggle
│   └── floating-bulk-actions.jsx     # Floating bottom action bar when 1+ rows are selected
├── lib/
│   ├── columns.config.js             # Master 63-column schema with group, filterable, cellType, width
│   ├── tenant-config.js              # Tenant pipeline stages, dispositions, and custom fields system
│   ├── mock-data/sample-leads.js     # 24 realistic sample leads with Indian demographics & edge cases
│   └── hooks/use-leads.js            # API-ready hook with sample data toggle & localStorage persistence
```

## Columns Configuration (63 Columns)

- **Core (1–25)**: `lead_name` (sticky, avatar, quick actions), `lead_owner`, `lead_stage` (tenant pipeline), `awaiting_first_touch`, `attempts`, `last_worked`, `started_work_on`, `speed_to_first_call`, `next_followup` (amber/red overdue badges), `became_opportunity`, `tags`, `product_or_service`, `recent_actions`, `unanswered_calls`, `answered_after_missed`, `missed_calls_from_them`, `last_user_remark`, `next_open_task`, `open_ticket`, `last_closed_task`, `deal_stage` (6-segment progress bar), `deal_updated_on`, `times_re_engaged`, `lead_disposition`, `last_disposition_on`.
- **Contact & Location (26–36)**: `business`, `mobile_number`, `email`, `address`, `state`, `city`, `area`, `country`, `zipcode`, `primary_team`, `designation`.
- **Classification & Source (37–44)**: `lead_type`, `lead_priority` (1–5 stars), `lead_source` (IndiaMART, Meta Ads, Website, Referral, CSV Import), `source_level_2`, `source_level_3`, `source_level_4`, `last_engagement_by_us`, `last_engagement_by_lead`.
- **Payments (45–47)**: `last_payment_status`, `last_payment_amount` (INR en-IN format with filter icon), `total_payment`.
- **Calls & Visits (48–55)**: `last_call_direction`, `last_call_outcome`, `last_call_nature`, `last_called_by`, `last_visit`, `last_visit_outcome`, `last_visit_nature`, `last_visit_by`.
- **Meta & Custom Fields (56–63)**: `last_updated`, `is_duplicate`, `budget_range`, `preferred_service`, `project_stage`, `project_type`, `property_type`, `site_location_preference`.

## Multi-Tenant Custom Fields Extensibility

Columns 58–63 are tenant custom fields defined in `tenant-config.js`. Additional fields defined per tenant are automatically appended as dynamic columns to `columns.config.js` via `buildColumnsConfig(customFields)`.
