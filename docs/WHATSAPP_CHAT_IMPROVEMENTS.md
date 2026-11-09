# WhatsApp Chat Page — Full Improvement Documentation

## Issues Identified (vs Reference CRMs: Wati, Intercom, Freshdesk)

### Critical Missing Features
1. **No 24h window indicator** — WhatsApp Business API restricts free-form messages after 24h of last customer message. Only templates allowed after that. No UI indicator existed.
2. **No template sending from chat** — Cannot send approved Meta templates from the chat window. Critical for re-engaging contacts after 24h window.
3. **No new conversation / outbound flow** — No way to start a new conversation with a contact.
4. **No WhatsApp number selector** — Multiple WABA numbers can be connected; no selector existed.
5. **Right panel too thin (240px) and incomplete** — Missing: notes, tags, conversation history, lead link.
6. **Assign agent non-functional** — Only "Assign to me" existed; no dropdown to assign to other agents.
7. **Labels non-functional** — "Add label" in menu did nothing.
8. **No file/image preview before send** — Attach button existed but no preview or upload flow.
9. **No emoji picker** — Smile icon existed but no picker.
10. **No pagination/infinite scroll** — Only 5 mock conversations; no load-more mechanism.

### UI/UX Issues
- Conversation list had no "New Chat" button
- No visual separation between date groups in messages
- No typing indicator
- No message reactions display
- Status badge in header was too small and unclear
- Right panel had no expandable sections

## Improvements Made

### Chat Page (`/whatsapp/chat`)
- **24h Window Banner**: Yellow warning banner appears when last customer message > 24h ago. Forces template selection.
- **Template Picker Modal**: Full modal to select approved templates, fill variables, preview before send.
- **New Conversation Dialog**: Search contact by name/phone, select WhatsApp number, pick template to start.
- **Agent Assignment Dropdown**: Dropdown with all team members to assign conversation.
- **Working Labels**: Click to add/remove labels with color coding (Hot, Warm, Cold, Follow-up, Scheduled, New).
- **File Attachment Preview**: File input with preview card before sending.
- **Emoji Picker**: Simple grid of common emojis inline.
- **WhatsApp Number Selector**: Dropdown in header to switch between connected WABA numbers.
- **Right Panel Expanded (280px)**:
  - Contact details with edit
  - Linked lead with quick-create
  - Notes section (add/view)
  - Tags
  - Conversation history count
  - Quick actions
- **Date separators** in message thread
- **Typing indicator** simulation
- **Message context menu** (reply, copy, delete)

### Architecture Notes
- All state is local (mock) — replace with API calls to `/api/whatsapp/conversations`, `/api/whatsapp/messages`, `/api/whatsapp/templates`
- Template variables filled client-side — backend should do final substitution
- 24h window check: `Date.now() - lastCustomerMessageTime > 86400000`
- WebSocket connection status shown in header

## API Integration Points (Backend)
```
GET  /api/whatsapp/conversations?status=open&page=1
GET  /api/whatsapp/conversations/:id/messages
POST /api/whatsapp/conversations/:id/messages
POST /api/whatsapp/conversations/:id/template
GET  /api/whatsapp/templates?status=APPROVED
POST /api/whatsapp/conversations
PUT  /api/whatsapp/conversations/:id/assign
PUT  /api/whatsapp/conversations/:id/label
PUT  /api/whatsapp/conversations/:id/status
GET  /api/whatsapp/numbers (connected WABA numbers)
```
