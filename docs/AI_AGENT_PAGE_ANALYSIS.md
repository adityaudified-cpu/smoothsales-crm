# WhatsApp AI Agent Page — Deep Analysis & Complete Improvement Plan

## Reference CRM Analysis (Wati, Interakt, Respond.io, Tidio, Freshchat)

### What Top CRMs Do for AI Agent Config

#### Respond.io AI Agent
- Dedicated "AI Agent" section with clear ON/OFF toggle at top
- Tabs: Profile | Instructions | Knowledge Sources | Channels | Handoff
- "Profile" = agent name, avatar color, role description
- "Instructions" = full system prompt editor with character count, variable chips
- "Knowledge Sources" = upload PDFs, paste URLs, add FAQs — all in one place
- "Channels" = which WhatsApp numbers this agent is active on
- "Handoff" = conditions + assignee team for escalation
- Live "Preview" panel always visible on right side (not a separate tab)
- Save button is sticky at bottom of each section

#### Wati AI Bot
- Simple 3-step setup wizard: 1) Name & Persona → 2) Training Data → 3) Test
- "Training Data" accepts: FAQ pairs, PDF upload, website URL crawl
- "Test Bot" is a floating WhatsApp-style chat on the right side of the page
- Shows "Confidence Score" per response in test mode
- Has "Escalation Keywords" — if user types these, hand off to human
- Shows "Bot Analytics" card: total handled, escalated, avg CSAT

#### Interakt AI
- "AI Copilot" — assists human agents (suggests replies, doesn't auto-reply)
- Separate "AI Automation" for fully automated flows
- Knowledge base = product catalog + FAQs + custom Q&A
- Shows which leads the AI has interacted with in a table

#### Tidio AI (Lyro)
- Clean 2-column layout: config on left, live preview on right (always visible)
- "Personality" section: name, avatar, tone slider (Formal ↔ Casual)
- "Limits" section: max response length, topics to avoid
- "Sources" section: website pages, uploaded docs, manual FAQs
- Real-time token/character count on system prompt
- "Conversations" tab shows all AI-handled chats with rating

#### Freshchat Freddy AI
- "Freddy Self Service" — dedicated AI agent product
- Setup: Intent detection → Response mapping → Fallback config
- Shows "Deflection Rate" — % of queries resolved without human
- "Topics" = categories of questions the bot handles
- Each topic has: trigger phrases + response template + follow-up action

---

## Issues Found in Current AI Agent Page

### Critical Issues
1. **Rules tab uses `defaultChecked` on Switch** — React uncontrolled component warning; state not tracked, so saving config won't capture these values
2. **Test console has fixed `style={{ height: 480 }}`** — breaks on small screens, should use flex layout
3. **`sendTest()` response logic is hardcoded** — only checks for "price" keyword, gives same generic response for everything else; should simulate FAQ matching
4. **No character count on system prompt** — users don't know how long their prompt is
5. **No "unsaved changes" indicator** — user edits but doesn't know if saved
6. **Stats cards are hardcoded** — "1,284 conversations" never changes
7. **Knowledge Base has no edit capability** — can only add/delete, not edit existing FAQs
8. **No WhatsApp connection status** — page doesn't show if API is connected
9. **No "which number is this agent active on"** — missing channel assignment
10. **Greeting/fallback messages don't show live preview** — user can't see how it looks

### UI/UX Issues
1. **Tab layout wastes space** — Identity tab has 2 cards side by side but on mobile they stack awkwardly
2. **System Prompt tab** — variable chips append to end of prompt (cursor position ignored)
3. **Knowledge Base** — no search/filter when FAQ list grows long
4. **Rules tab** — switches have no state tracking (defaultChecked vs checked)
5. **Test Console** — no "typing indicator" simulation, no timestamp on messages
6. **Test Console** — right panel "Test Configuration" is too sparse, wastes space
7. **No visual hierarchy** — all cards look the same weight
8. **Missing: escalation keywords config** (like Wati) — specific words that trigger human handoff
9. **Missing: response length control** — max tokens/characters per response
10. **Missing: topics/intents the bot should handle** — scope definition

### Missing Features vs Top CRMs
1. **Live preview panel** — always-visible WhatsApp bubble preview on right
2. **Confidence threshold** — below X% confidence → escalate to human
3. **Escalation keywords** — specific trigger words for immediate handoff
4. **Channel assignment** — which WhatsApp number(s) this agent is active on
5. **Response scope** — topics the bot should/shouldn't answer
6. **Analytics tab** — conversations handled, escalation rate, CSAT, top questions
7. **Knowledge source types** — currently only FAQ; should show URL and PDF options (even if disabled/coming soon)
8. **FAQ edit in-place** — click to edit existing FAQ without delete+re-add
9. **Prompt character counter** — show chars used / recommended max
10. **Unsaved changes warning** — dirty state indicator

---

## Complete Improvement Plan

### Architecture
- Keep 5 tabs but improve each significantly
- Add 6th "Analytics" tab
- Fix all uncontrolled Switch → controlled with useState
- Fix test console to use flex height (not fixed px)
- Add dirty state tracking with "Unsaved changes" badge
- Improve sendTest() to match FAQs and give varied responses
- Add escalation keywords section to Rules tab
- Add channel assignment section to Identity tab
- Add character counter to system prompt
- Add in-place FAQ editing
- Add typing indicator in test console

### Tab-by-Tab Plan

#### Tab 1: Identity
- Agent name + avatar color picker (6 preset colors)
- Role/persona input
- Tone select + Language select + AI Model select
- Channel assignment: "Active on" — show connected WhatsApp numbers
- Greeting message textarea with live WhatsApp bubble preview
- Fallback message textarea
- Working hours toggle with time range inputs (9am–7pm)
- "Claim to be human" toggle with warning

#### Tab 2: System Prompt
- Full prompt editor with character count (X / 2000 chars)
- Variable chips that insert at cursor position
- Reset to default button
- Prompt quality tips panel on right

#### Tab 3: Knowledge Base
- Search bar for FAQs
- FAQ list with inline edit (click pencil → edit in place)
- Add new FAQ form at bottom
- "Other sources" section: URL crawl (coming soon), PDF upload (coming soon)

#### Tab 4: Rules
- All switches CONTROLLED with useState
- Handoff rules section
- Lead capture rules section  
- NEW: Escalation keywords section (add/remove keywords)
- NEW: Response scope section (topics to handle / avoid)
- NEW: Confidence threshold slider (use number input since no Slider component)

#### Tab 5: Test Console
- Full height flex layout (no fixed px)
- Typing indicator (animated dots)
- FAQ-aware response simulation
- Message timestamps
- Right panel: active config summary + quick actions

#### Tab 6: Analytics (NEW)
- KPI cards: Conversations Handled, Escalation Rate, Avg Response Time, CSAT
- Top 5 questions asked (table)
- Daily conversation volume (simple bar chart using CSS)
- Recent escalations list
