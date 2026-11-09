# WhatsApp CRM Module — Deep Research, Analysis & Implementation Plan

## 1. Research: How Top CRMs Handle WhatsApp

### Salesforce + WhatsApp (via Messaging for In-App & Web)
- Sidebar nav item "Messaging" with sub-items: Conversations, Campaigns, Templates, Bots
- AI Agent (Einstein Bot) has: Persona name, greeting message, fallback message, handoff trigger
- Flow builder uses drag-drop canvas (similar to n8n) with trigger → condition → action nodes
- Templates synced from Meta Business Manager via API

### HubSpot WhatsApp Integration
- Left sidebar: "Conversations" → sub-tabs: Inbox, Campaigns, Templates
- AI assistant "ChatSpot" has: system prompt, tone selector, knowledge base upload
- Automation: "Workflows" with visual node editor — trigger node → delay node → send message node → branch node

### Zoho CRM + WhatsApp
- Sidebar: "WhatsApp" expandable with: Chats, Broadcasts, Templates, Automation, Settings
- AI Agent "Zia": persona name, role description, business context, FAQ pairs, escalation rules
- Flow: Linear step builder (not canvas) but with branch conditions

### Intercom (Best-in-class)
- Sidebar: "Conversations" with filters, "Campaigns" (Series), "Bots" (Fin AI)
- Fin AI Agent: System prompt, persona name, tone, sources (URLs, PDFs, FAQs), handoff conditions
- Automation "Series": Visual canvas with Start → Step nodes → Branch → End

### Wati (WhatsApp-first CRM)
- Sidebar: Conversations, Broadcasts, Templates, Automation, Team Inbox, Analytics
- AI Bot: Name, welcome message, fallback, FAQ pairs, escalation keyword
- Automation: Linear flow with trigger → delay → send template → condition → branch

### n8n Flow Builder (Reference for our Automation UI)
- Canvas-based drag-drop
- Nodes: Trigger, Action, Condition/Branch, Delay, Loop
- Each node has: type icon, label, config panel on click
- Connections: arrows between nodes
- Toolbar: Add node, zoom in/out, fit to screen, run flow

---

## 2. What We Are Building

### Navigation Structure (Sidebar — like Leads)
```
WhatsApp (expandable group in sidebar)
├── Live Chat
├── Campaigns
├── Templates
├── AI Agent        ← NEW dedicated page
└── Automation      ← Rebuilt as n8n-style flow builder
```

### No top tab bar inside WhatsApp pages — sidebar handles navigation.

---

## 3. AI Agent Page — Full Spec

### Sections:
1. **Agent Identity**
   - Agent Name (e.g. "Priya") — shown to customers
   - Role/Persona (e.g. "Interior Design Consultant at Jaipur Interiors")
   - Avatar/Emoji selector
   - "I am a human" disclosure toggle (legal compliance)

2. **System Prompt Builder**
   - Large textarea for full system prompt
   - Variable chips: {{company_name}}, {{agent_name}}, {{lead_name}}, {{product}}
   - Tone selector: Professional / Friendly / Formal / Casual
   - Language: English / Hindi / Hinglish

3. **Knowledge Base**
   - FAQ pairs (question → answer) — add/edit/delete
   - Business info: company name, services, pricing, location, timings
   - Product catalog: name, description, price range

4. **Conversation Rules**
   - Greeting message (sent on first contact)
   - Fallback message (when AI doesn't know)
   - Escalation trigger: keyword / confidence threshold / always
   - Escalation message: "Let me connect you with our team..."
   - Working hours: auto-reply outside hours

5. **Test Console**
   - Chat simulator: type a message, see AI response
   - Shows which FAQ/context was used

6. **Status & Analytics**
   - AI handled / Human escalated / Avg response time

---

## 4. Automation Flow Builder — Full Spec (n8n-style)

### Canvas Layout:
- Left panel: Node palette (drag to canvas)
- Center: Canvas with nodes and connections
- Right panel: Node config (when node selected)
- Top toolbar: Save, Run, Zoom, Fit, Clear

### Node Types:
| Node | Icon | Color | Description |
|------|------|-------|-------------|
| Trigger | ⚡ | Green | Start event (new lead, keyword, campaign reply, etc.) |
| Send Template | 💬 | Blue | Send approved Meta template |
| Send Message | ✉️ | Blue | Send free-form message (within 24h window) |
| Wait / Delay | ⏱️ | Amber | Wait X hours/days before next step |
| Condition | 🔀 | Purple | Branch: if reply contains / if no reply / if tag = |
| Add Tag | 🏷️ | Gray | Tag the lead |
| Create Lead | 👤 | Teal | Create lead in CRM from chat |
| Assign Agent | 👨‍💼 | Gray | Assign to human agent |
| End | ⏹️ | Red | End flow |

### Trigger Events:
- New lead created
- Keyword received (YES / STOP / PRICE / etc.)
- Campaign reply received
- Lead inactive 30 days
- Visit scheduled
- Quotation sent
- Deal won
- Inbound message (any)

### Connection Logic:
- Condition node has 2 outputs: YES branch / NO branch
- Other nodes have 1 output
- Arrows drawn between node output → next node input

---

## 5. Pages to Build/Rebuild

| Page | Status | Action |
|------|--------|--------|
| /whatsapp/chat | ✅ Complete | Minor UI polish |
| /whatsapp/campaigns | ✅ Complete | Minor UI polish |
| /whatsapp/templates | ✅ Complete | Minor UI polish |
| /whatsapp/ai-agent | ❌ Missing | Build from scratch |
| /whatsapp/automation | ⚠️ Basic | Rebuild as n8n-style canvas |
| WhatsApp layout | ⚠️ Has top tabs | Remove top tabs |
| Sidebar | ⚠️ Single item | Make expandable group like Leads |

---

## 6. Implementation Order
1. Create `/whatsapp/ai-agent` directory and page
2. Rebuild `/whatsapp/automation` as canvas flow builder
3. Update sidebar — WhatsApp as expandable group with 5 sub-items
4. Remove top tab bar from WhatsApp layout (just pass children)
5. Update permissions for new ai-agent route
