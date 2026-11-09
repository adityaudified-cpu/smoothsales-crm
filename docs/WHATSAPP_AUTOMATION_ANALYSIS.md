# WhatsApp Automation Page — Deep Analysis & Improvement Plan

## Issues Found in Current Implementation

### Critical Issues
1. **No template selector in Add Step dialog** — "Send Template" step has a free-text detail field instead of a dropdown of actual Meta-approved templates from the templates page
2. **No step editing** — Steps can only be deleted, not edited after creation
3. **No drag-to-reorder** — Steps cannot be reordered in the flow
4. **Delete flow bug** — After deleting selected flow, `setSelectedFlow` uses stale `flows` array (before state update), so it may select wrong flow
5. **Canvas height not fixed** — Canvas body has no fixed height, so long flows push footer off screen
6. **No flow duplication** — Cannot duplicate an existing flow
7. **No run history / execution log** — No way to see which leads went through which flow
8. **Condition node has no branch config** — Condition step has no way to define Yes/No branches
9. **Wait node has no time picker** — Delay is free text, should be structured (number + unit)
10. **No WhatsApp connection status** — Page doesn't show if WhatsApp API is connected

### UI/UX Issues (vs Zoho, HubSpot, Interakt, Wati)
1. Canvas dotted grid background looks good but nodes are too narrow (max-w-xs = 320px) — should be wider
2. Flow list left panel has no search/filter
3. No "last edited" timestamp on flows
4. Stats cards show hardcoded "Templates Used: 6" — should be dynamic
5. No empty state for flow list
6. No keyboard shortcut hints
7. Node step numbers (-left-6) overflow outside card boundary

### Missing Features (vs top CRM WhatsApp tools like Wati, Interakt, AiSensy)
1. **Template preview in step** — When selecting a template in a step, show preview
2. **Variable mapping** — Map template variables to lead fields (e.g. {{1}} → lead.name)
3. **Condition branches** — If/Else branching with separate paths
4. **Flow analytics** — Per-flow: sent, delivered, replied, converted stats
5. **Test flow** — Run flow against a test lead
6. **Webhook trigger** — Trigger flow from external webhook
7. **API connection settings** — WhatsApp Business API credentials panel

## Reference CRM Analysis

### Wati (WhatsApp Team Inbox)
- Left: flow list with search, status filter, last run time
- Center: vertical node canvas with colored node types
- Each node: icon + title + config summary + edit/delete buttons
- Template nodes show template name + preview snippet
- Wait nodes have structured time picker (1h, 24h, 3d etc.)
- Condition nodes show branch labels (Yes/No, Replied/Not Replied)
- Add node button between every pair of nodes (not just at end)

### Interakt
- Flow builder with trigger → action → condition → action chain
- Template selector with search and preview
- Variable mapping UI: {{1}} = Contact Name, {{2}} = Visit Date
- Flow stats: Enrolled, Completed, Dropped off

### HubSpot Workflows
- Visual canvas with drag handles
- Branch nodes show two paths side by side
- Each action has a config panel that slides in from right
- Delay node: structured picker (minutes/hours/days/weeks)

### AiSensy
- Simple list-based flow builder (not canvas)
- Template picker with category filter
- Keyword trigger with exact/contains match
- Re-enrollment settings (allow re-entry after X days)

## Improvement Plan

### Phase 1 — Fix Critical Bugs
- Fix delete flow bug (use functional update)
- Fix step number overflow
- Add structured delay picker (number + unit select)
- Add template dropdown in Send Template step (from MOCK_TEMPLATES)
- Add step edit capability

### Phase 2 — UI Improvements
- Wider nodes (max-w-sm instead of max-w-xs)
- Add search to flow list
- Add flow duplication
- Add "last edited" to flow cards
- Fix canvas height with proper overflow

### Phase 3 — Feature Additions
- Template preview in step config
- Variable mapping for template variables
- Condition node branch labels
- Flow-level analytics row
- WhatsApp API connection status banner
- Add node button between steps (not just at end)
