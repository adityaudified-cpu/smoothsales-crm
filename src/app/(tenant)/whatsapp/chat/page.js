"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Search, Send, Paperclip, X, Plus, Loader2, ArrowLeft, FileText, Zap, UserPlus, UserMinus,
  ExternalLink, Clock, Info, MessageCircle, Phone, Wifi, WifiOff, ChevronUp, Image as ImageIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import {
  whatsappInboxApi, whatsappSendApi, subscribeInboundMessages, onRealtimeStatus,
} from "@/lib/api/whatsapp";
import { customersApi } from "@/lib/api/customers";
import { usersApi } from "@/lib/api/users";
import { useWaAccounts, accountName } from "../wa-accounts-context";
import { encodeId } from "../campaigns/data";
import { MessageTicks } from "@/components/whatsapp/message-ticks";
import { MessageMedia } from "@/components/whatsapp/message-media";
import { SendTemplateDialog } from "@/components/whatsapp/send-template-dialog";
import { WaText } from "@/components/whatsapp/template-preview";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "unread", label: "Unread" },
  { key: "mine", label: "Mine" },
  { key: "unassigned", label: "Unassigned" },
  { key: "contacts", label: "Not leads" },
];

const STAGES = ["NEW", "CONTACTED", "QUALIFIED", "SITE_VISIT_SCHEDULED", "SITE_VISIT_DONE", "NEGOTIATION", "BOOKED", "LOST", "JUNK"];

const QUICK_REPLIES = [
  "Hi! Thanks for reaching out. How can I help you today?",
  "Could you share a good time for a quick call?",
  "I've shared the details above — let me know if you have any questions.",
  "Our team will get back to you shortly.",
];

const ACCEPT = "image/jpeg,image/png,image/webp,video/mp4,video/3gpp,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv";

// ── helpers ──────────────────────────────────────────────────────────────────

const initials = (name) => String(name || "WA").split(/\s+/).filter(Boolean).map((p) => p[0]).slice(0, 2).join("").toUpperCase();

function fmtTime(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

function fmtListTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return fmtTime(iso);
  const y = new Date(now); y.setDate(now.getDate() - 1);
  if (d.toDateString() === y.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

function dayLabel(iso) {
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return "Today";
  const y = new Date(now); y.setDate(now.getDate() - 1);
  if (d.toDateString() === y.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: d.getFullYear() === now.getFullYear() ? undefined : "numeric" });
}

function hoursLeft(closesAt) {
  if (!closesAt) return 0;
  return Math.max(0, (new Date(closesAt).getTime() - Date.now()) / 36e5);
}

function mapConversation(c) {
  return {
    id: String(c.customerId),
    name: c.customerName || c.profileName || c.customerPhone || "WhatsApp contact",
    phone: c.customerPhone || "",
    isLead: c.isLead !== false,
    stage: c.stage,
    assignedStaffId: c.assignedStaffId || null,
    assignedStaffName: c.assignedStaffName || null,
    lastMessage: c.lastMessage || "",
    lastDirection: c.lastDirection,
    lastStatus: c.lastStatus,
    lastMessageAt: c.lastMessageAt,
    windowOpen: Boolean(c.windowOpen),
    unread: c.unreadCount || 0,
    accountId: c.whatsappAccountId || null,
  };
}

/** Message from the API or the socket → thread item. */
function mapMessage(m) {
  return {
    id: String(m.id),
    direction: String(m.direction || "").toUpperCase() === "INBOUND" ? "in" : "out",
    text: m.messageBody ?? m.body ?? "",
    status: String(m.status || "SENT").toLowerCase(),
    failureReason: m.failureReason || null,
    mediaType: m.mediaType || null,
    hasMedia: Boolean(m.hasMedia ?? m.mediaUrl),
    // Public links (template headers) load directly; private files go through the API.
    localUrl: /^https:\/\//.test(m.mediaUrl || "") && !/fbsbx\.com|facebook\.com/.test(m.mediaUrl) ? m.mediaUrl : null,
    templateName: m.templateName || null,
    at: m.sentAt || m.createdAt || new Date().toISOString(),
    createdAt: m.createdAt || m.sentAt,
    accountId: m.whatsappAccountId || null,
  };
}

// ── conversation list ────────────────────────────────────────────────────────

function ConversationRow({ conv, active, onSelect, accountLabel }) {
  return (
    <li>
      <button type="button" onClick={() => onSelect(conv.id)} aria-current={active ? "true" : undefined}
        className={cn("w-full text-left flex gap-3 px-3 py-2.5 border-l-2 transition-colors focus-visible:outline-none focus-visible:bg-accent",
          active ? "bg-accent border-primary" : "border-transparent hover:bg-muted/60")}>
        <span className="h-9 w-9 shrink-0 rounded-full bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground" aria-hidden>
          {initials(conv.name)}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-baseline justify-between gap-2">
            <span className={cn("truncate text-[13px]", conv.unread ? "font-semibold" : "font-medium")}>{conv.name}</span>
            <span className={cn("text-2xs shrink-0 tabular", conv.unread ? "text-primary font-medium" : "text-muted-foreground")}>{fmtListTime(conv.lastMessageAt)}</span>
          </span>
          <span className="flex items-center gap-1 mt-0.5">
            {conv.lastDirection === "OUTBOUND" && <MessageTicks status={conv.lastStatus} className="h-3 w-3" />}
            <span className={cn("truncate text-xs", conv.unread ? "text-foreground" : "text-muted-foreground")}>{conv.lastMessage || "—"}</span>
            {conv.unread > 0 && (
              <span className="ml-auto shrink-0 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-primary-foreground text-2xs font-semibold flex items-center justify-center tabular" aria-label={`${conv.unread} unread`}>
                {conv.unread}
              </span>
            )}
          </span>
          <span className="flex items-center gap-1.5 mt-1 text-2xs text-muted-foreground">
            {!conv.isLead && <span className="rounded-sm border border-warning/40 bg-warning/10 text-foreground px-1">Not a lead yet</span>}
            {conv.assignedStaffName ? <span className="truncate">{conv.assignedStaffName}</span> : <span>Unassigned</span>}
            {accountLabel && <span className="truncate">· {accountLabel}</span>}
          </span>
        </span>
      </button>
    </li>
  );
}

// ── new chat ─────────────────────────────────────────────────────────────────

function NewChatDialog({ open, onOpenChange, onPick }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");

  useEffect(() => {
    if (!open) { setQ(""); setResults([]); setPhone(""); setName(""); return; }
  }, [open]);

  useEffect(() => {
    if (!open || q.trim().length < 2) { setResults([]); return; }
    const t = setTimeout(() => {
      setLoading(true);
      customersApi.search(q.trim(), { size: 8 })
        .then((r) => setResults(r.items || []))
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(t);
  }, [q, open]);

  const digits = phone.replace(/\D/g, "");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader className="text-left">
          <DialogTitle className="text-base font-semibold">New conversation</DialogTitle>
          <DialogDescription>WhatsApp only allows an approved template as the first message. Pick who to message, then choose the template.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="nc-search" className="text-xs">Find a lead or customer</Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" aria-hidden />
              <Input id="nc-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name or phone" className="h-9 pl-8 text-sm" />
            </div>
            {(loading || results.length > 0) && (
              <ul className="rounded-md border border-border divide-y divide-border max-h-52 overflow-y-auto">
                {loading && <li className="px-3 py-2 text-xs text-muted-foreground">Searching…</li>}
                {results.map((c) => (
                  <li key={c.id}>
                    <button type="button" className="w-full text-left px-3 py-2 hover:bg-muted/60 focus-visible:outline-none focus-visible:bg-accent"
                      onClick={() => onPick({ customerId: String(c.id), name: c.fullName || `${c.firstName || ""} ${c.lastName || ""}`.trim(), firstName: c.firstName, phone: c.phone })}>
                      <span className="block text-sm font-medium">{c.fullName || `${c.firstName || ""} ${c.lastName || ""}`.trim()}</span>
                      <span className="block text-xs text-muted-foreground font-mono">{c.phone || "No phone"}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="relative text-center"><span className="bg-background px-2 text-2xs uppercase tracking-wider text-muted-foreground relative z-10">or a new number</span><span className="absolute inset-x-0 top-1/2 h-px bg-border" aria-hidden /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="nc-phone" className="text-xs">Phone with country code</Label>
              <Input id="nc-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98765 43210" className="h-9 text-sm font-mono" inputMode="tel" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="nc-name" className="text-xs">Name (optional)</Label>
              <Input id="nc-name" value={name} onChange={(e) => setName(e.target.value)} className="h-9 text-sm" />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button size="sm" disabled={digits.length < 10}
            onClick={() => onPick({ customerId: null, phone: digits.length === 10 ? `+91${digits}` : `+${digits}`, name: name.trim() || undefined, firstName: name.trim().split(" ")[0] })}>
            Choose template
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── contact panel ────────────────────────────────────────────────────────────

function ContactPanel({ contact, users, accountLabel, onUpdate, canManage, meId }) {
  const [notes, setNotes] = useState(contact?.notes || "");
  const [busy, setBusy] = useState(null);
  useEffect(() => { setNotes(contact?.notes || ""); }, [contact?.customerId, contact?.notes]);
  if (!contact) {
    return <div className="p-4 space-y-3" aria-busy="true">{[0, 1, 2, 3].map((i) => <div key={i} className="h-8 rounded bg-muted animate-pulse" />)}</div>;
  }
  const act = async (key, fn, ok) => {
    setBusy(key);
    try { onUpdate(await fn()); if (ok) toast.success(ok); } catch (e) { toast.error(e?.message || "Action failed"); } finally { setBusy(null); }
  };
  const id = contact.customerId;
  return (
    <div className="p-4 space-y-5 text-sm">
      <div className="text-center space-y-1">
        <span className="mx-auto h-12 w-12 rounded-full bg-muted flex items-center justify-center text-sm font-semibold text-muted-foreground" aria-hidden>{initials(contact.name)}</span>
        <p className="font-semibold">{contact.name}</p>
        <p className="font-mono text-xs text-muted-foreground tabular">{contact.phone}</p>
        {accountLabel && <p className="text-2xs text-muted-foreground">via {accountLabel}</p>}
      </div>

      {/* Lead decision — the main CRM action from a chat */}
      <section className="rounded-md border border-border p-3 space-y-2" aria-labelledby="cp-lead">
        <p id="cp-lead" className="text-2xs font-medium uppercase tracking-wider text-muted-foreground">Lead</p>
        {contact.isLead ? (
          <>
            <p className="text-xs">Counted as a lead{contact.stage ? <> · <span className="font-medium">{contact.stage.replaceAll("_", " ").toLowerCase()}</span></> : null}</p>
            <Select value={contact.stage || "NEW"} onValueChange={(v) => act("stage", () => whatsappInboxApi.setStage(id, v), "Stage updated")}>
              <SelectTrigger className="h-8 text-xs" aria-label="Lead stage"><SelectValue /></SelectTrigger>
              <SelectContent>{STAGES.map((s) => <SelectItem key={s} value={s} className="text-xs">{s.replaceAll("_", " ").toLowerCase()}</SelectItem>)}</SelectContent>
            </Select>
            <Button variant="ghost" size="sm" className="w-full h-8 text-xs text-muted-foreground" disabled={Boolean(busy)}
              onClick={() => act("lead", () => whatsappInboxApi.setLead(id, false), "Removed from leads")}>
              <UserMinus /> Not a lead
            </Button>
          </>
        ) : (
          <>
            <p className="text-xs text-muted-foreground">This person messaged you but is not counted in Leads yet.</p>
            <Button size="sm" className="w-full h-8 text-xs" disabled={Boolean(busy)}
              onClick={() => act("lead", () => whatsappInboxApi.setLead(id, true), "Added to leads")}>
              {busy === "lead" ? <Loader2 className="animate-spin" /> : <UserPlus />} Add to leads
            </Button>
          </>
        )}
      </section>

      <section className="space-y-1.5" aria-labelledby="cp-owner">
        <p id="cp-owner" className="text-2xs font-medium uppercase tracking-wider text-muted-foreground">Assigned to</p>
        {canManage ? (
          <Select value={contact.assignedStaffId || "none"} onValueChange={(v) => act("assign", () => whatsappInboxApi.assign(id, v === "none" ? null : v), "Assignment updated")}>
            <SelectTrigger className="h-8 text-xs" aria-label="Assign to"><SelectValue placeholder="Unassigned" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none" className="text-xs">Unassigned</SelectItem>
              {users.map((u) => <SelectItem key={u.id} value={String(u.id)} className="text-xs">{u.name}</SelectItem>)}
            </SelectContent>
          </Select>
        ) : (
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs">{contact.assignedStaffName || "Unassigned"}</span>
            {!contact.assignedStaffId && meId && (
              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => act("assign", () => whatsappInboxApi.assign(id, meId), "Assigned to you")}>Assign to me</Button>
            )}
          </div>
        )}
      </section>

      <section className="space-y-1.5" aria-labelledby="cp-notes">
        <Label id="cp-notes" htmlFor="cp-notes-input" className="text-2xs font-medium uppercase tracking-wider text-muted-foreground">Notes</Label>
        <Textarea id="cp-notes-input" value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} className="text-xs" placeholder="Budget, requirement, follow-up…" />
        {notes !== (contact.notes || "") && (
          <Button size="sm" variant="secondary" className="h-7 text-xs w-full" disabled={busy === "notes"}
            onClick={() => act("notes", () => whatsappInboxApi.saveNotes(id, notes), "Notes saved")}>Save notes</Button>
        )}
      </section>

      <section className="space-y-1 text-xs">
        <p className="text-2xs font-medium uppercase tracking-wider text-muted-foreground">Details</p>
        <p className="flex justify-between gap-2"><span className="text-muted-foreground">Source</span><span className="text-right truncate">{contact.sourceDetail || contact.source || "—"}</span></p>
        {contact.email && <p className="flex justify-between gap-2"><span className="text-muted-foreground">Email</span><span className="truncate">{contact.email}</span></p>}
        {contact.city && <p className="flex justify-between gap-2"><span className="text-muted-foreground">City</span><span>{contact.city}</span></p>}
        {(contact.dnd || !contact.whatsappConsent) && <p className="text-destructive">Opted out of WhatsApp — sending is blocked.</p>}
      </section>

      <div className="flex flex-col gap-1.5">
        {contact.phone && (
          <Button asChild variant="outline" size="sm" className="h-8 text-xs justify-start">
            <a href={`tel:${contact.phone.replace(/[^\d+]/g, "")}`}><Phone /> Call</a>
          </Button>
        )}
        <Button asChild variant="outline" size="sm" className="h-8 text-xs justify-start">
          <Link href={`/leads/active/${encodeId(id)}`}><ExternalLink /> Open full profile</Link>
        </Button>
      </div>
    </div>
  );
}

// ── page ─────────────────────────────────────────────────────────────────────

export default function WhatsAppChatPage() {
  const { accounts, defaultAccount, accountById } = useWaAccounts();
  const [conversations, setConversations] = useState([]);
  const [listState, setListState] = useState("loading"); // loading | ready | error
  const [filter, setFilter] = useState("all");
  const [numberFilter, setNumberFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [activeId, setActiveId] = useState(null);
  const [threads, setThreads] = useState({}); // id → { items, hasMore, loading, error }
  const [contact, setContact] = useState(null);
  const [live, setLive] = useState(false);
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [sending, setSending] = useState(false);
  const [sendAccountId, setSendAccountId] = useState(null);
  const [templateOpen, setTemplateOpen] = useState(false);
  const [templateContact, setTemplateContact] = useState(null);
  const [newChatOpen, setNewChatOpen] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [me, setMe] = useState(null);
  const scrollRef = useRef(null);
  const fileRef = useRef(null);
  const inputRef = useRef(null);
  const activeRef = useRef(null);
  activeRef.current = activeId;

  // who am I (for "Mine" and self-assign)
  useEffect(() => {
    try {
      const token = localStorage.getItem("smoothsales_access_token");
      const p = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
      const roles = String(p.roles || "");
      setMe({ id: p.sub, canManage: /ADMIN|MANAGER|BRANCH_HEAD|TEAM_LEADER/.test(roles) });
    } catch { setMe({ id: null, canManage: false }); }
    usersApi.team()
      .then((r) => (Array.isArray(r) ? r : r?.content || []))
      .catch(() => usersApi.list().then((r) => r.items || []))
      .then((list) => setUsers((list || []).filter((u) => u.active !== false).map((u) => ({
        id: String(u.id), name: u.fullName || `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.email,
      }))))
      .catch(() => setUsers([]));
  }, []);

  const loadConversations = useCallback(async () => {
    try {
      const list = await whatsappInboxApi.getConversations();
      setConversations(list.map(mapConversation));
      setListState("ready");
    } catch {
      setListState((s) => (s === "ready" ? s : "error"));
    }
  }, []);

  const loadThread = useCallback(async (id, { older = false } = {}) => {
    setThreads((t) => ({ ...t, [id]: { ...(t[id] || { items: [] }), loading: true, error: null } }));
    try {
      const current = threads[id]?.items || [];
      const before = older && current.length ? current[0].createdAt : undefined;
      const res = await whatsappInboxApi.getThread(id, { before, size: 50 });
      const items = (res.items || []).map(mapMessage);
      setThreads((t) => {
        const prev = t[id]?.items || [];
        const merged = older ? [...items, ...prev] : mergeLatest(prev, items);
        return { ...t, [id]: { items: merged, hasMore: Boolean(res.hasMore), loading: false, error: null } };
      });
      if (!older) {
        setContact(res.contact || null);
        setConversations((cs) => cs.map((c) => (c.id === id ? { ...c, unread: 0 } : c)));
      }
    } catch (e) {
      setThreads((t) => ({ ...t, [id]: { ...(t[id] || { items: [] }), loading: false, error: e?.message || "Could not load messages" } }));
    }
  }, [threads]);

  useEffect(() => { loadConversations(); }, [loadConversations]);
  useEffect(() => onRealtimeStatus(setLive), []);

  // Safety net when the socket is down: poll.
  useEffect(() => {
    if (live) return;
    const t = setInterval(() => {
      loadConversations();
      if (activeRef.current) loadThread(activeRef.current);
    }, 12000);
    return () => clearInterval(t);
  }, [live, loadConversations, loadThread]);

  // Realtime events
  useEffect(() => subscribeInboundMessages((evt) => {
    const id = String(evt.customerId || "");
    if (!id) return;
    if (evt.type === "conversation") {
      setConversations((cs) => cs.map((c) => (c.id === id ? { ...c, isLead: evt.isLead, assignedStaffId: evt.assignedStaffId || null, assignedStaffName: evt.assignedStaffName || null } : c)));
      if (activeRef.current === id) whatsappInboxApi.getContact(id).then(setContact).catch(() => {});
      return;
    }
    const msg = mapMessage(evt);
    setThreads((t) => {
      if (!t[id]) return t;
      return { ...t, [id]: { ...t[id], items: upsert(t[id].items, msg) } };
    });
    setConversations((cs) => {
      const exists = cs.find((c) => c.id === id);
      if (!exists) {
        loadConversations();
        return cs;
      }
      const isActive = activeRef.current === id;
      const updated = {
        ...exists,
        name: evt.customerName || exists.name,
        isLead: evt.isLead ?? exists.isLead,
        lastMessage: msg.text || (msg.mediaType ? `[${msg.mediaType.toLowerCase()}]` : exists.lastMessage),
        lastDirection: msg.direction === "in" ? "INBOUND" : "OUTBOUND",
        lastStatus: msg.status.toUpperCase(),
        lastMessageAt: msg.at,
        windowOpen: msg.direction === "in" ? true : exists.windowOpen,
        unread: msg.direction === "in" && !isActive && msg.status !== "read" && !exists._seen?.has(msg.id) ? exists.unread + 1 : exists.unread,
        accountId: msg.accountId || exists.accountId,
      };
      updated._seen = new Set([...(exists._seen || []), msg.id]);
      return [updated, ...cs.filter((c) => c.id !== id)];
    });
    if (activeRef.current === id && msg.direction === "in") {
      whatsappInboxApi.markAsRead(id).catch(() => {});
      setContact((c) => (c ? { ...c, windowOpen: true, windowClosesAt: new Date(Date.now() + 864e5).toISOString() } : c));
    }
  }), [loadConversations]);

  // Open a conversation
  const select = useCallback((id) => {
    setActiveId(id);
    setContact(null);
    setText("");
    clearFile();
    setQuickOpen(false);
    loadThread(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadThread]);

  const active = conversations.find((c) => c.id === activeId) || null;
  const thread = threads[activeId] || { items: [], loading: true };

  // Number to reply from: the one the chat is on, else the default.
  useEffect(() => {
    if (!activeId) return;
    setSendAccountId(contact?.lastAccountId || active?.accountId || defaultAccount?.id || null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId, contact?.lastAccountId, defaultAccount?.id]);

  // Keep the newest message in view
  const lastId = thread.items[thread.items.length - 1]?.id;
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [activeId, lastId]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return conversations.filter((c) => {
      if (q && !c.name.toLowerCase().includes(q) && !c.phone.replace(/\D/g, "").includes(q.replace(/\D/g, "") || "§")) return false;
      if (numberFilter !== "all" && c.accountId !== numberFilter) return false;
      if (filter === "unread") return c.unread > 0;
      if (filter === "mine") return me?.id && c.assignedStaffId === me.id;
      if (filter === "unassigned") return !c.assignedStaffId;
      if (filter === "contacts") return !c.isLead;
      return true;
    });
  }, [conversations, search, filter, numberFilter, me]);

  const totalUnread = conversations.reduce((s, c) => s + (c.unread || 0), 0);
  const windowOpen = contact ? contact.windowOpen && hoursLeft(contact.windowClosesAt) > 0 : active?.windowOpen;
  const blocked = contact && (contact.dnd || !contact.whatsappConsent);

  function clearFile() {
    setFile(null);
    setFilePreview((p) => { if (p) URL.revokeObjectURL(p); return null; });
    if (fileRef.current) fileRef.current.value = "";
  }

  const pickFile = (f) => {
    if (!f) return;
    setFile(f);
    setFilePreview(f.type.startsWith("image/") ? URL.createObjectURL(f) : null);
  };

  const send = async () => {
    if (!active || sending || (!text.trim() && !file)) return;
    const body = text.trim();
    const tempId = `tmp_${Date.now()}`;
    const optimistic = {
      id: tempId, direction: "out", text: file ? body || file.name : body, status: "pending",
      mediaType: file ? (file.type.startsWith("image/") ? "IMAGE" : file.type.startsWith("video/") ? "VIDEO" : file.type.startsWith("audio/") ? "AUDIO" : "DOCUMENT") : null,
      localUrl: file ? filePreview || null : null, at: new Date().toISOString(), createdAt: new Date().toISOString(),
    };
    setThreads((t) => ({ ...t, [active.id]: { ...thread, items: [...thread.items, optimistic] } }));
    setText("");
    const sendingFile = file;
    clearFile();
    setSending(true);
    try {
      const res = sendingFile
        ? await whatsappSendApi.sendMedia({ file: sendingFile, customerId: active.id, caption: body || undefined, accountId: sendAccountId })
        : await whatsappSendApi.sendText({ customerId: active.id, body, accountId: sendAccountId });
      const real = mapMessage(res);
      setThreads((t) => ({ ...t, [active.id]: { ...t[active.id], items: upsert(t[active.id].items.filter((m) => m.id !== tempId), real) } }));
      if (real.status === "failed") toast.error(real.failureReason || "WhatsApp rejected the message");
    } catch (e) {
      setThreads((t) => ({ ...t, [active.id]: { ...t[active.id], items: t[active.id].items.map((m) => (m.id === tempId ? { ...m, status: "failed", failureReason: e?.message } : m)) } }));
      toast.error(e?.message || "Message not sent");
      if (!sendingFile) setText(body);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const openTemplateFor = (c) => { setTemplateContact(c); setTemplateOpen(true); };

  const onTemplateSent = (message) => {
    if (!message) return;
    const id = String(message.customerId || "");
    loadConversations().then(() => { if (id) select(id); });
  };

  const accountLabelOf = (id) => (accounts.length > 1 ? accountById(id)?.label : null);

  // Group thread by day
  const grouped = useMemo(() => {
    const out = [];
    let last = null;
    for (const m of thread.items) {
      const label = dayLabel(m.at);
      if (label !== last) { out.push({ type: "day", label, key: `d_${m.id}` }); last = label; }
      out.push({ type: "msg", m, key: m.id });
    }
    return out;
  }, [thread.items]);

  return (
    <div className="flex h-[calc(100vh-56px)] min-h-0 overflow-hidden border border-border rounded-lg bg-card">
      {/* ── List ── */}
      <aside className={cn("w-full md:w-[320px] shrink-0 border-r border-border flex flex-col min-h-0", activeId && "hidden md:flex")} aria-label="Conversations">
        <div className="p-3 space-y-2.5 border-b border-border">
          <div className="flex items-center justify-between">
            <h1 className="text-base font-semibold flex items-center gap-2">
              Chats {totalUnread > 0 && <span className="text-2xs rounded-full bg-primary text-primary-foreground px-1.5 py-0.5 tabular">{totalUnread}</span>}
            </h1>
            <div className="flex items-center gap-1.5">
              <span className={cn("inline-flex items-center gap-1 text-2xs", live ? "text-success" : "text-muted-foreground")} title={live ? "Live updates on" : "Reconnecting — refreshing every 12 s"}>
                {live ? <Wifi className="h-3 w-3" aria-hidden /> : <WifiOff className="h-3 w-3" aria-hidden />}{live ? "Live" : "Polling"}
              </span>
              <Button size="icon" className="h-8 w-8" onClick={() => setNewChatOpen(true)} aria-label="New conversation"><Plus /></Button>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" aria-hidden />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name or number" className="h-8 pl-8 text-xs" aria-label="Search conversations" />
          </div>
          <div className="flex gap-1 overflow-x-auto no-scrollbar" role="tablist" aria-label="Filter conversations">
            {FILTERS.map((f) => (
              <button key={f.key} type="button" role="tab" aria-selected={filter === f.key} onClick={() => setFilter(f.key)}
                className={cn("h-7 px-2.5 rounded-md text-xs whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  filter === f.key ? "bg-accent text-accent-foreground font-medium" : "text-muted-foreground hover:text-foreground hover:bg-muted/60")}>
                {f.label}
              </button>
            ))}
          </div>
          {accounts.length > 1 && (
            <Select value={numberFilter} onValueChange={setNumberFilter}>
              <SelectTrigger className="h-8 text-xs" aria-label="Filter by number"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">All numbers</SelectItem>
                {accounts.map((a) => <SelectItem key={a.id} value={a.id} className="text-xs">{accountName(a)}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
        </div>
        <div className="flex-1 overflow-y-auto">
          {listState === "loading" ? (
            <ul aria-busy="true">{[0, 1, 2, 3, 4, 5].map((i) => (
              <li key={i} className="flex gap-3 px-3 py-3"><span className="h-9 w-9 rounded-full bg-muted animate-pulse" /><span className="flex-1 space-y-1.5"><span className="block h-3 w-2/3 rounded bg-muted animate-pulse" /><span className="block h-3 w-1/2 rounded bg-muted animate-pulse" /></span></li>
            ))}</ul>
          ) : listState === "error" ? (
            <div className="p-6 text-center space-y-2"><p className="text-sm text-destructive">Could not load chats.</p><Button variant="outline" size="sm" onClick={loadConversations}>Retry</Button></div>
          ) : filtered.length === 0 ? (
            <div className="p-6 text-center space-y-2">
              <MessageCircle className="h-6 w-6 mx-auto text-muted-foreground" aria-hidden />
              <p className="text-sm font-medium">{conversations.length === 0 ? "No conversations yet" : "Nothing matches"}</p>
              <p className="text-xs text-muted-foreground">{conversations.length === 0 ? (accounts.length === 0 ? "Connect a WhatsApp number to start receiving chats." : "When customers message your number, chats appear here.") : "Try another filter."}</p>
              {accounts.length === 0 ? <Button asChild size="sm" variant="outline"><Link href="/whatsapp/connect">Connect a number</Link></Button>
                : conversations.length === 0 && <Button size="sm" variant="outline" onClick={() => setNewChatOpen(true)}><Plus /> New conversation</Button>}
            </div>
          ) : (
            <ul className="divide-y divide-border/60">
              {filtered.map((c) => <ConversationRow key={c.id} conv={c} active={c.id === activeId} onSelect={select} accountLabel={accountLabelOf(c.accountId)} />)}
            </ul>
          )}
        </div>
      </aside>

      {/* ── Thread ── */}
      <section className={cn("flex-1 min-w-0 flex flex-col bg-background", !activeId && "hidden md:flex")} aria-label="Conversation">
        {!active ? (
          <div className="flex-1 flex items-center justify-center p-6 text-center">
            <div className="space-y-2 max-w-xs">
              <MessageCircle className="h-8 w-8 mx-auto text-muted-foreground" aria-hidden />
              <p className="text-sm font-medium">Pick a chat</p>
              <p className="text-xs text-muted-foreground">Replies from customers' phones appear here instantly.</p>
            </div>
          </div>
        ) : (
          <>
            <header className="flex items-center gap-2 px-3 py-2 border-b border-border bg-card">
              <Button variant="ghost" size="icon" className="h-8 w-8 md:hidden" onClick={() => setActiveId(null)} aria-label="Back to chats"><ArrowLeft /></Button>
              <span className="h-8 w-8 shrink-0 rounded-full bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground" aria-hidden>{initials(active.name)}</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold truncate">{active.name}</p>
                <p className="text-2xs text-muted-foreground font-mono truncate tabular">{active.phone}</p>
              </div>
              {windowOpen ? (
                <span className="hidden sm:inline-flex items-center gap-1 text-2xs text-success" title="Free-form replies allowed until the window closes">
                  <Clock className="h-3 w-3" aria-hidden /> {Math.ceil(hoursLeft(contact?.windowClosesAt) || 24)}h to reply
                </span>
              ) : (
                <span className="hidden sm:inline-flex items-center gap-1 text-2xs text-foreground"><Clock className="h-3 w-3 text-warning" aria-hidden /> Window closed</span>
              )}
              <Button variant="ghost" size="icon" className="h-8 w-8 xl:hidden" onClick={() => setInfoOpen(true)} aria-label="Contact details"><Info /></Button>
            </header>

            <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 sm:px-6 py-4" aria-live="polite">
              {thread.hasMore && (
                <div className="flex justify-center mb-3">
                  <Button variant="outline" size="sm" className="h-7 text-xs" disabled={thread.loading} onClick={() => loadThread(active.id, { older: true })}>
                    {thread.loading ? <Loader2 className="animate-spin" /> : <ChevronUp />} Older messages
                  </Button>
                </div>
              )}
              {thread.error && (
                <div className="text-center space-y-2 py-6"><p className="text-sm text-destructive">{thread.error}</p><Button variant="outline" size="sm" onClick={() => loadThread(active.id)}>Retry</Button></div>
              )}
              {thread.loading && thread.items.length === 0 && (
                <div className="space-y-3" aria-busy="true">
                  {[0, 1, 2, 3].map((i) => <div key={i} className={cn("h-10 rounded-lg bg-muted animate-pulse", i % 2 ? "ml-auto w-1/2" : "w-2/5")} />)}
                </div>
              )}
              {!thread.loading && !thread.error && thread.items.length === 0 && (
                <p className="text-center text-xs text-muted-foreground py-10">No messages yet. Start with a template.</p>
              )}
              <ol className="space-y-1.5">
                {grouped.map((g) => g.type === "day" ? (
                  <li key={g.key} className="flex justify-center py-2" aria-label={g.label}>
                    <span className="text-2xs text-muted-foreground bg-muted rounded-md px-2 py-0.5">{g.label}</span>
                  </li>
                ) : (
                  <Bubble key={g.key} m={g.m} />
                ))}
              </ol>
            </div>

            {/* Composer */}
            <div className="border-t border-border bg-card p-2.5 space-y-2">
              {blocked ? (
                <p className="text-xs text-destructive px-1">This contact opted out of WhatsApp or is on DND. Messages are blocked.</p>
              ) : !windowOpen ? (
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 rounded-md border border-warning/40 bg-warning/10 px-3 py-2">
                  <p className="text-xs flex-1">The 24-hour reply window is closed. Send an approved template — when they reply, you can chat freely again.</p>
                  <Button size="sm" className="h-8 text-xs" onClick={() => openTemplateFor({ customerId: active.id, name: contact?.name || active.name, firstName: contact?.firstName, phone: active.phone })}>
                    <FileText /> Send template
                  </Button>
                </div>
              ) : (
                <>
                  {quickOpen && (
                    <ul className="flex flex-wrap gap-1.5" aria-label="Quick replies">
                      {QUICK_REPLIES.map((q) => (
                        <li key={q}><button type="button" onClick={() => { setText(q); setQuickOpen(false); inputRef.current?.focus(); }}
                          className="text-xs rounded-md border border-border px-2 py-1 hover:bg-muted/60 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{q}</button></li>
                      ))}
                    </ul>
                  )}
                  {file && (
                    <div className="flex items-center gap-2 rounded-md border border-border px-2 py-1.5">
                      {filePreview ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={filePreview} alt="" className="h-10 w-10 rounded object-cover" />
                      ) : <FileText className="h-5 w-5 text-muted-foreground" aria-hidden />}
                      <span className="text-xs truncate flex-1">{file.name} <span className="text-muted-foreground tabular">· {(file.size / 1024 / 1024).toFixed(1)} MB</span></span>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={clearFile} aria-label="Remove attachment"><X /></Button>
                    </div>
                  )}
                  <div className="flex items-end gap-1.5">
                    <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={() => fileRef.current?.click()} aria-label="Attach image or document"><Paperclip /></Button>
                    <Button variant="ghost" size="icon" className={cn("h-9 w-9 shrink-0", quickOpen && "bg-accent")} onClick={() => setQuickOpen((v) => !v)} aria-label="Quick replies" aria-pressed={quickOpen}><Zap /></Button>
                    <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" aria-label="Send a template"
                      onClick={() => openTemplateFor({ customerId: active.id, name: contact?.name || active.name, firstName: contact?.firstName, phone: active.phone })}><FileText /></Button>
                    <input ref={fileRef} type="file" accept={ACCEPT} className="hidden" onChange={(e) => pickFile(e.target.files?.[0])} />
                    <Textarea ref={inputRef} value={text} onChange={(e) => setText(e.target.value)} rows={1}
                      onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                      onPaste={(e) => { const f = e.clipboardData?.files?.[0]; if (f) { e.preventDefault(); pickFile(f); } }}
                      placeholder={file ? "Add a caption…" : "Type a message"} aria-label="Message"
                      className="flex-1 min-h-[36px] max-h-32 resize-none text-[13px]" />
                    <Button size="icon" className="h-9 w-9 shrink-0" onClick={send} disabled={sending || (!text.trim() && !file)} aria-label="Send">
                      {sending ? <Loader2 className="animate-spin" /> : <Send />}
                    </Button>
                  </div>
                </>
              )}
              {accounts.length > 1 && !blocked && (
                <div className="flex items-center gap-2 px-1">
                  <span className="text-2xs text-muted-foreground">Reply from</span>
                  <Select value={sendAccountId || ""} onValueChange={setSendAccountId}>
                    <SelectTrigger className="h-7 w-auto min-w-[180px] text-2xs" aria-label="Reply from number"><SelectValue placeholder="Default number" /></SelectTrigger>
                    <SelectContent>{accounts.map((a) => <SelectItem key={a.id} value={a.id} className="text-xs">{accountName(a)}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </>
        )}
      </section>

      {/* ── Contact panel ── */}
      {active && (
        <aside className="hidden xl:block w-[280px] shrink-0 border-l border-border overflow-y-auto" aria-label="Contact">
          <ContactPanel contact={contact} users={users} accountLabel={accountLabelOf(sendAccountId)} canManage={me?.canManage} meId={me?.id}
            onUpdate={(c) => { setContact(c); setConversations((cs) => cs.map((x) => (x.id === c.customerId ? { ...x, isLead: c.isLead, stage: c.stage, assignedStaffId: c.assignedStaffId, assignedStaffName: c.assignedStaffName } : x))); }} />
        </aside>
      )}
      <Sheet open={infoOpen} onOpenChange={setInfoOpen}>
        <SheetContent side="right" className="w-[300px] p-0 overflow-y-auto">
          <SheetHeader className="sr-only"><SheetTitle>Contact details</SheetTitle></SheetHeader>
          <ContactPanel contact={contact} users={users} accountLabel={accountLabelOf(sendAccountId)} canManage={me?.canManage} meId={me?.id}
            onUpdate={(c) => { setContact(c); setConversations((cs) => cs.map((x) => (x.id === c.customerId ? { ...x, isLead: c.isLead, assignedStaffId: c.assignedStaffId, assignedStaffName: c.assignedStaffName } : x))); }} />
        </SheetContent>
      </Sheet>

      <NewChatDialog open={newChatOpen} onOpenChange={setNewChatOpen} onPick={(c) => { setNewChatOpen(false); openTemplateFor(c); }} />
      <SendTemplateDialog open={templateOpen} onOpenChange={setTemplateOpen}
        accountId={templateContact?.customerId === activeId ? sendAccountId : defaultAccount?.id}
        contact={templateContact} onSent={(m) => {
          if (templateContact?.customerId && templateContact.customerId === activeId) {
            const real = mapMessage(m);
            setThreads((t) => ({ ...t, [activeId]: { ...t[activeId], items: upsert(t[activeId]?.items || [], real) } }));
          } else onTemplateSent(m);
        }} />
    </div>
  );
}

// ── bubble ───────────────────────────────────────────────────────────────────

function Bubble({ m }) {
  const out = m.direction === "out";
  const media = m.mediaType && m.mediaType !== "TEXT";
  const caption = media ? m.text : null;
  return (
    <li className={cn("flex", out ? "justify-end" : "justify-start")}>
      <div className={cn("max-w-[85%] sm:max-w-[68%] rounded-lg px-3 py-2 text-[13px] leading-relaxed",
        out ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-card border border-border rounded-bl-sm",
        m.status === "failed" && out && "ring-1 ring-destructive")}>
        {m.templateName && out && (
          <p className={cn("text-2xs mb-1 flex items-center gap-1", out ? "text-primary-foreground/70" : "text-muted-foreground")}>
            <FileText className="h-3 w-3" aria-hidden /> Template · {m.templateName}
          </p>
        )}
        {media && (m.hasMedia || m.localUrl) && (
          <MessageMedia messageId={m.id.startsWith("tmp_") ? null : m.id} localUrl={m.localUrl} mediaType={m.mediaType} caption={caption} outbound={out} />
        )}
        {media && !m.hasMedia && !m.localUrl && m.mediaType !== "LOCATION" && (
          <p className={cn("text-2xs flex items-center gap-1", out ? "text-primary-foreground/70" : "text-muted-foreground")}><ImageIcon className="h-3 w-3" aria-hidden /> {m.mediaType.toLowerCase()}</p>
        )}
        {(!media || (caption && m.mediaType !== "DOCUMENT")) && m.text && (
          <p className="whitespace-pre-wrap break-words"><WaText text={m.text} /></p>
        )}
        <p className={cn("flex items-center justify-end gap-1 mt-0.5 text-2xs tabular", out ? "text-primary-foreground/70" : "text-muted-foreground")}>
          {fmtTime(m.at)}
          {out && <MessageTicks status={m.status} tone="onPrimary" className="h-3 w-3" />}
        </p>
        {m.status === "failed" && m.failureReason && (
          <p className={cn("text-2xs mt-1", out ? "text-primary-foreground" : "text-destructive")}>{m.failureReason}</p>
        )}
      </div>
    </li>
  );
}

// ── list utils ───────────────────────────────────────────────────────────────

function upsert(items, msg) {
  const i = items.findIndex((x) => x.id === msg.id);
  if (i >= 0) {
    const copy = [...items];
    copy[i] = { ...copy[i], ...msg, localUrl: copy[i].localUrl || msg.localUrl };
    return copy;
  }
  return [...items, msg].sort((a, b) => new Date(a.createdAt || a.at) - new Date(b.createdAt || b.at));
}

/** Newest page from the server merged with what we already show (keeps older pages). */
function mergeLatest(prev, latest) {
  if (!prev.length) return latest;
  const ids = new Set(latest.map((m) => m.id));
  const oldest = latest[0]?.createdAt;
  const keepOlder = prev.filter((m) => !ids.has(m.id) && !m.id.startsWith("tmp_") && oldest && new Date(m.createdAt) < new Date(oldest));
  const pending = prev.filter((m) => m.id.startsWith("tmp_"));
  return [...keepOlder, ...latest, ...pending];
}
