"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search, Send, Paperclip, Phone, MoreVertical, Check, CheckCheck,
  Bot, FileText, X, Wifi, WifiOff, MessageCircle, UserPlus,
  Zap, Plus, Star, Archive, Loader2, ArrowUpRight, AlertCircle,
  ExternalLink, User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  whatsappInboxApi, whatsappSendApi, whatsappTemplatesApi,
  subscribeInboundMessages,
} from "@/lib/api/whatsapp";
import { customersApi } from "@/lib/api/customers";
import { isApiMode } from "@/lib/api/client";
import { encodeId } from "../campaigns/data";

const LABEL_COLORS = {
  "Hot Lead": "bg-rose-500/10 text-rose-600 border-rose-200",
  "Warm": "bg-amber-500/10 text-amber-600 border-amber-200",
  "Follow-up": "bg-blue-500/10 text-blue-600 border-blue-200",
  "Scheduled": "bg-emerald-500/10 text-emerald-600 border-emerald-200",
  "New": "bg-purple-500/10 text-purple-600 border-purple-200",
};

const SOURCE_COLORS = {
  "Meta Ads": "bg-blue-500/10 text-blue-600",
  "Website": "bg-violet-500/10 text-violet-600",
  "WhatsApp": "bg-emerald-500/10 text-emerald-600",
  "JustDial": "bg-orange-500/10 text-orange-600",
  "IndiaMART": "bg-green-500/10 text-green-600",
};

const CHANNEL_CFG = {
  meta: { label: "Meta Cloud API", cls: "bg-blue-500/10 text-blue-600 border-blue-500/20", dot: "bg-blue-500" },
  personal: { label: "Personal WA", cls: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20", dot: "bg-emerald-500" },
};

const FILTERS = [
  { key: "all", label: "All" },
  { key: "open", label: "Open" },
  { key: "unread", label: "Unread" },
  { key: "resolved", label: "Resolved" },
];

const QUICK_REPLIES = [
  "Hi! Thanks for reaching out. How can I assist you today?",
  "Would you like to schedule a quick 10-minute demo or consultation call?",
  "I have shared our product catalog and pricing overview with you.",
  "Our sales specialist will follow up with you shortly.",
  "Please let us know if you have any questions or need further details!",
];

// ─── Status & Helper Components ───────────────────────────────────────────────

function StatusIcon({ status, fromUs }) {
  if (!fromUs) return null;
  const s = String(status || "").toLowerCase();
  if (s === "read") return <CheckCheck className="h-3 w-3 text-emerald-500" />;
  if (s === "delivered") return <CheckCheck className="h-3 w-3 text-muted-foreground" />;
  if (s === "failed") return <AlertCircle className="h-3 w-3 text-red-500" />;
  return <Check className="h-3 w-3 text-muted-foreground" />;
}

function TypingIndicator() {
  return (
    <div className="flex justify-start items-end gap-2 mb-1">
      <div className="bg-muted border border-border rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1 shadow-sm">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 animate-bounce"
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </div>
    </div>
  );
}

function DateSeparator({ label }) {
  return (
    <div className="flex items-center gap-3 my-4 select-none">
      <div className="flex-1 h-px bg-border" />
      <span className="text-[10px] text-muted-foreground font-medium px-2.5 py-1 rounded-full bg-muted border border-border">
        {label}
      </span>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}

function ConvItem({ conv, isActive, onClick }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-start gap-2.5 px-3 py-2.5 text-left transition-all hover:bg-muted/60 group relative",
        isActive
          ? "bg-emerald-500/8 border-l-[3px] border-emerald-500 pl-[9px]"
          : "border-l-[3px] border-transparent"
      )}
    >
      <div className="relative shrink-0 mt-0.5">
        <Avatar className="h-9 w-9 border border-border">
          <AvatarFallback className="text-[11px] font-bold bg-emerald-500/10 text-emerald-700">
            {conv.initials}
          </AvatarFallback>
        </Avatar>
        {conv.online && (
          <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-card" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1 mb-0.5">
          <div className="flex items-center gap-1 min-w-0">
            {conv.starred && <Star className="h-2.5 w-2.5 text-amber-400 fill-amber-400 shrink-0" />}
            <span className="text-xs font-semibold truncate text-foreground">
              {conv.name}
            </span>
          </div>
          <span className="text-[10px] text-muted-foreground shrink-0">{conv.lastTime}</span>
        </div>

        <p className={cn("text-[11px] truncate leading-relaxed", conv.unread > 0 ? "text-foreground/80 font-medium" : "text-muted-foreground")}>
          {conv.lastMsg || "No messages yet"}
        </p>

        <div className="flex items-center gap-1 mt-1.5 flex-wrap">
          {conv.source && (
            <span className={cn("text-[9px] px-1.5 py-0.5 rounded-md font-medium", SOURCE_COLORS[conv.source] || "bg-muted text-muted-foreground")}>
              {conv.source}
            </span>
          )}
          {conv.label && (
            <span className={cn("text-[9px] px-1.5 py-0.5 rounded-md font-semibold border", LABEL_COLORS[conv.label] || "bg-muted text-muted-foreground border-border")}>
              {conv.label}
            </span>
          )}
          {conv.channel && CHANNEL_CFG[conv.channel] && (
            <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-semibold border ${CHANNEL_CFG[conv.channel].cls}`}>
              {CHANNEL_CFG[conv.channel].label}
            </span>
          )}
          {conv.status === "resolved" && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground font-medium">
              resolved
            </span>
          )}
          {conv.unread > 0 && (
            <span className="ml-auto h-4 min-w-4 px-1 rounded-full bg-emerald-500 text-white text-[9px] font-bold flex items-center justify-center">
              {conv.unread}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

// ─── New Chat Modal ───────────────────────────────────────────────────────────

function NewChatModal({ open, onClose, onChatCreated }) {
  const [leads, setLeads] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [searchLead, setSearchLead] = useState("");
  const [selectedLead, setSelectedLead] = useState(null);
  const [manualName, setManualName] = useState("");
  const [manualPhone, setManualPhone] = useState("");
  const [mode, setMode] = useState("select"); // 'select' | 'manual'
  const [sendType, setSendType] = useState("text"); // 'text' | 'template'
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [templateVars, setTemplateVars] = useState({});
  const [initialMessage, setInitialMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoadingLeads(true);
    customersApi.list({ size: 100 })
      .then((data) => {
        const items = Array.isArray(data) ? data : (data?.items || data?.content || []);
        setLeads(items);
      })
      .catch(() => { })
      .finally(() => setLoadingLeads(false));

    whatsappTemplatesApi.getApproved()
      .then((data) => {
        const list = Array.isArray(data) ? data : (data?.data || []);
        setTemplates(list);
      })
      .catch(() => { });
  }, [open]);

  const filteredLeads = useMemo(() => {
    if (!searchLead) return leads.slice(0, 20);
    const q = searchLead.toLowerCase();
    return leads.filter((l) =>
      (l.fullName || l.name || "").toLowerCase().includes(q) ||
      (l.phone || "").includes(q) ||
      (l.email || "").toLowerCase().includes(q)
    ).slice(0, 20);
  }, [leads, searchLead]);

  const selectedTmpl = useMemo(() => {
    return templates.find((t) => t.id === selectedTemplateId || t.templateName === selectedTemplateId);
  }, [templates, selectedTemplateId]);

  const handleStartChat = async () => {
    const targetName = mode === "select" ? (selectedLead?.fullName || selectedLead?.name) : manualName.trim();
    const targetPhone = mode === "select" ? selectedLead?.phone : manualPhone.trim();
    const customerId = mode === "select" ? selectedLead?.id : null;

    if (!targetPhone) {
      toast.error("Please select a lead or provide a valid phone number");
      return;
    }

    setSubmitting(true);
    try {
      if (sendType === "template" && selectedTmpl) {
        const varList = (selectedTmpl.variables || []).map((v, i) => templateVars[v] || templateVars[String(i + 1)] || targetName || "");
        if (customerId) {
          await whatsappSendApi.sendTemplate({
            customerId,
            templateId: selectedTmpl.id,
            variables: varList,
          });
        }
        toast.success(`Template "${selectedTmpl.displayName || selectedTmpl.templateName}" sent!`);
      } else if (initialMessage.trim()) {
        if (customerId) {
          await whatsappSendApi.sendSession({
            customerId,
            messageBody: initialMessage.trim(),
          });
        }
        toast.success("Message sent successfully!");
      }

      const newConv = {
        id: String(customerId || `custom_${Date.now()}`),
        customerId: customerId ? String(customerId) : null,
        name: targetName || targetPhone,
        phone: targetPhone,
        initials: (targetName || "WA").split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase(),
        lastMsg: sendType === "template" ? `[Template] ${selectedTmpl?.displayName || selectedTmpl?.templateName}` : initialMessage.trim(),
        lastTime: "Just now",
        unread: 0,
        status: "open",
        assignee: "You",
        source: "WhatsApp",
        online: false,
        starred: false,
        channel: "meta",
        messages: [
          ...(initialMessage.trim() || sendType === "template" ? [{
            id: `msg_${Date.now()}`,
            from: "us",
            text: sendType === "template" ? (selectedTmpl?.bodyText || selectedTmpl?.displayName) : initialMessage.trim(),
            time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
            status: "delivered",
            date: "Today",
          }] : []),
        ],
        notes: "",
        tags: [],
      };

      onChatCreated(newConv);
      onClose();
    } catch (err) {
      toast.error(err?.message || "Failed to start conversation");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg p-0 overflow-hidden">
        <DialogHeader className="px-5 py-4 border-b border-border">
          <DialogTitle className="text-sm font-bold flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-emerald-500 flex items-center justify-center text-white">
              <MessageCircle className="h-4 w-4" />
            </div>
            Start New WhatsApp Conversation
          </DialogTitle>
        </DialogHeader>

        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Target Mode Toggle */}
          <div className="flex rounded-lg border border-border p-1 bg-muted/40">
            <button
              onClick={() => { setMode("select"); setSelectedLead(null); }}
              className={cn("flex-1 py-1.5 text-xs font-semibold rounded-md transition-all", mode === "select" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
            >
              Choose from CRM Leads
            </button>
            <button
              onClick={() => setMode("manual")}
              className={cn("flex-1 py-1.5 text-xs font-semibold rounded-md transition-all", mode === "manual" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
            >
              Enter Phone Number
            </button>
          </div>

          {mode === "select" ? (
            <div className="space-y-2">
              <Label className="text-xs font-medium">Select Lead / Contact <span className="text-red-500">*</span></Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  value={searchLead}
                  onChange={(e) => setSearchLead(e.target.value)}
                  placeholder="Search lead by name, phone or email..."
                  className="pl-8 h-8 text-xs"
                />
              </div>
              <div className="border border-border rounded-lg max-h-40 overflow-y-auto divide-y divide-border/60">
                {loadingLeads ? (
                  <div className="flex items-center justify-center py-6 text-xs text-muted-foreground gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Loading CRM leads...
                  </div>
                ) : filteredLeads.length === 0 ? (
                  <div className="py-6 text-center text-xs text-muted-foreground">
                    No leads found matching query
                  </div>
                ) : (
                  filteredLeads.map((lead) => {
                    const isSel = selectedLead?.id === lead.id;
                    return (
                      <button
                        key={lead.id}
                        type="button"
                        onClick={() => setSelectedLead(lead)}
                        className={cn("w-full text-left px-3 py-2 flex items-center justify-between text-xs transition-colors hover:bg-muted/50", isSel ? "bg-emerald-500/10 font-medium text-emerald-800 dark:text-emerald-300" : "")}
                      >
                        <div>
                          <p className="font-semibold">{lead.fullName || lead.name || "Unnamed"}</p>
                          <p className="text-[10.5px] text-muted-foreground">{lead.phone || "No phone"} · {lead.email || "No email"}</p>
                        </div>
                        {isSel && <Check className="h-4 w-4 text-emerald-600" />}
                      </button>
                    );
                  })
                )}
              </div>
              {selectedLead && (
                <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-emerald-800 dark:text-emerald-300">{selectedLead.fullName || selectedLead.name}</span>
                    <span className="text-muted-foreground ml-2">({selectedLead.phone})</span>
                  </div>
                  <Badge variant="outline" className="text-[10px] bg-background">Selected</Badge>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Customer Name</Label>
                <Input value={manualName} onChange={(e) => setManualName(e.target.value)} placeholder="e.g. Rajesh Kumar" className="h-8 text-xs" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Phone Number (with +91) <span className="text-red-500">*</span></Label>
                <Input value={manualPhone} onChange={(e) => setManualPhone(e.target.value)} placeholder="+91 98765 43210" className="h-8 text-xs" />
              </div>
            </div>
          )}

          {/* Message Type Toggle */}
          <div className="space-y-2 pt-2 border-t border-border">
            <Label className="text-xs font-medium">Initial Message Type</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSendType("text")}
                className={cn("p-2 rounded-lg border text-xs text-left transition-colors", sendType === "text" ? "border-emerald-500 bg-emerald-500/10 font-semibold text-emerald-800 dark:text-emerald-300" : "border-border hover:bg-muted/50")}
              >
                <p>Direct Message / Session</p>
                <p className="text-[10px] text-muted-foreground font-normal">Active within 24hr window</p>
              </button>
              <button
                type="button"
                onClick={() => setSendType("template")}
                className={cn("p-2 rounded-lg border text-xs text-left transition-colors", sendType === "template" ? "border-emerald-500 bg-emerald-500/10 font-semibold text-emerald-800 dark:text-emerald-300" : "border-border hover:bg-muted/50")}
              >
                <p>Approved Template</p>
                <p className="text-[10px] text-muted-foreground font-normal">Meta official 24/7 delivery</p>
              </button>
            </div>
          </div>

          {sendType === "template" ? (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Select Approved Template</Label>
                <Select value={selectedTemplateId} onValueChange={(v) => { setSelectedTemplateId(v); setTemplateVars({}); }}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder={templates.length === 0 ? "No approved templates found" : "Choose approved template"} />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((t) => (
                      <SelectItem key={t.id || t.templateName} value={t.id || t.templateName} className="text-xs">
                        {t.displayName || t.templateName} <span className="text-muted-foreground text-[10px]">· {t.category}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedTmpl && (
                <div className="p-3 rounded-lg bg-muted/40 border border-border space-y-2">
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Template Preview</p>
                  <p className="text-xs whitespace-pre-wrap leading-relaxed bg-background p-2.5 rounded border border-border/80">
                    {selectedTmpl.bodyText || selectedTmpl.body || "Template content"}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Message Body</Label>
              <Textarea
                value={initialMessage}
                onChange={(e) => setInitialMessage(e.target.value)}
                placeholder="Type your opening message to this customer..."
                className="text-xs min-h-[80px] resize-none"
              />
            </div>
          )}
        </div>

        <DialogFooter className="px-5 py-3 border-t border-border bg-card flex justify-between items-center">
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleStartChat}
            disabled={submitting || (mode === "select" ? !selectedLead : !manualPhone.trim())}
            className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
          >
            {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            Start Conversation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function WhatsAppChatPage() {
  const router = useRouter();
  const [conversations, setConversations] = useState([]);
  const [isLoadingConvs, setIsLoadingConvs] = useState(false);
  const [activeId, setActiveId] = useState(null);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [isAiMode, setIsAiMode] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [editingNote, setEditingNote] = useState(false);
  const [newChatOpen, setNewChatOpen] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Load conversations from API
  const loadConversations = useCallback(() => {
    setIsLoadingConvs(true);
    whatsappInboxApi.getConversations()
      .then((data) => {
        const items = Array.isArray(data) ? data : (data?.data || data?.content || []);
        if (items.length > 0) {
          const mapped = items.map((c) => ({
            id: String(c.customerId || c.id),
            customerId: String(c.customerId || c.id),
            name: c.customerName || c.name || "Customer",
            phone: c.customerPhone || c.phoneNumber || c.phone || "",
            initials: (c.customerName || c.name || "WA").split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase(),
            lastMsg: c.lastMessage || "",
            lastTime: c.lastMessageAt ? new Date(c.lastMessageAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "",
            unread: c.unreadCount || 0,
            status: (c.status || "open").toLowerCase(),
            assignee: c.assignedStaffName || c.assigneeName || "Unassigned",
            source: c.source || "WhatsApp",
            label: c.label || null,
            online: false,
            starred: Boolean(c.starred),
            channel: c.channel || "meta",
            messages: [],
            notes: c.notes || "",
            tags: c.tags || [],
          }));
          setConversations(mapped);
          setActiveId((curr) => curr || mapped[0]?.id || null);
        } else {
          setConversations([]);
          setActiveId(null);
        }
        setWsConnected(true);
      })
      .catch((err) => {
        console.warn("Failed to load conversations:", err);
        setConversations([]);
        setActiveId(null);
        setWsConnected(false);
      })
      .finally(() => setIsLoadingConvs(false));
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Load thread messages when active conversation changes
  useEffect(() => {
    if (!activeId) return;
    setConversations((prev) => {
      const conv = prev.find((c) => c.id === activeId);
      if (!conv || (conv.messages && conv.messages.length > 0)) return prev;

      whatsappInboxApi.getThread(activeId, { page: 0, size: 50 })
        .then((data) => {
          const msgs = Array.isArray(data) ? data : (data?.items || data?.content || data?.data || []);
          const mapped = msgs.map((m) => ({
            id: String(m.id || Math.random()),
            from: (m.direction === "OUTBOUND" || m.direction === "outbound") ? "us" : "them",
            text: m.messageBody || m.body || m.content || "",
            time: (m.sentAt || m.createdAt) ? new Date(m.sentAt || m.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "",
            status: (m.status || "sent").toLowerCase(),
            date: (m.sentAt || m.createdAt) ? new Date(m.sentAt || m.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) : "Today",
          }));
          setConversations((p) => p.map((c) => c.id === activeId ? { ...c, messages: mapped } : c));
          whatsappInboxApi.markAsRead(activeId).catch(() => { });
        })
        .catch(() => { });
      return prev;
    });
  }, [activeId]);

  const active = useMemo(() => conversations.find((c) => c.id === activeId), [conversations, activeId]);

  // Real-time WebSocket Inbound Listener
  useEffect(() => {
    const unsub = subscribeInboundMessages((msg) => {
      const convId = String(msg.customerId || msg.phone);
      const newMsg = {
        id: `ws_${Date.now()}`,
        from: "them",
        text: msg.messageBody || msg.body || "",
        time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
        status: "delivered",
        date: "Today",
      };
      setConversations((prev) => {
        const existing = prev.find((c) => c.id === convId);
        if (existing) {
          return prev.map((c) =>
            c.id === convId
              ? {
                ...c,
                messages: [...c.messages, newMsg],
                lastMsg: msg.messageBody || msg.body || "",
                lastTime: "Just now",
                unread: c.id === activeId ? 0 : c.unread + 1,
              }
              : c
          );
        }
        return [
          {
            id: convId,
            customerId: msg.customerId ? String(msg.customerId) : null,
            name: msg.customerName || msg.phone || "Inbound Lead",
            phone: msg.phone || "",
            initials: (msg.customerName || "WA").split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase(),
            lastMsg: msg.messageBody || msg.body || "",
            lastTime: "Just now",
            unread: 1,
            status: "open",
            assignee: "Unassigned",
            source: "WhatsApp",
            online: true,
            starred: false,
            channel: "meta",
            messages: [newMsg],
            notes: "",
            tags: ["New Inbound"],
          },
          ...prev,
        ];
      });
      setWsConnected(true);
    });
    return unsub;
  }, [activeId]);

  const filtered = useMemo(() => {
    return conversations.filter((c) => {
      const q = search.toLowerCase();
      const matchSearch = !search || c.name.toLowerCase().includes(q) || c.phone.includes(q);
      const matchFilter =
        filter === "all" ||
        (filter === "open" && c.status === "open") ||
        (filter === "unread" && c.unread > 0) ||
        (filter === "resolved" && c.status === "resolved");
      return matchSearch && matchFilter;
    });
  }, [conversations, search, filter]);

  const totalUnread = useMemo(() => {
    return conversations.reduce((s, c) => s + (c.unread || 0), 0);
  }, [conversations]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeId, conversations, isTyping]);

  useEffect(() => {
    if (active) setNoteText(active.notes || "");
  }, [activeId, active]);

  const selectConv = useCallback((id) => {
    setActiveId(id);
    setConversations((prev) => prev.map((c) => c.id === id ? { ...c, unread: 0 } : c));
    setShowQuickReplies(false);
  }, []);

  const sendMessage = useCallback(async () => {
    if (!message.trim() || !active) return;
    const msgText = message.trim();
    const tempId = `m_${Date.now()}`;
    const newMsg = {
      id: tempId,
      from: "us",
      text: msgText,
      time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
      status: "sent",
      date: "Today",
    };

    setConversations((prev) =>
      prev.map((c) => c.id === activeId
        ? { ...c, messages: [...c.messages, newMsg], lastMsg: msgText, lastTime: "Just now" }
        : c)
    );
    setMessage("");
    setShowQuickReplies(false);

    try {
      if (active.customerId || activeId) {
        await whatsappSendApi.sendSession({
          customerId: active.customerId || activeId,
          messageBody: msgText,
        });
      }
      setConversations((prev) => prev.map((c) => c.id === activeId
        ? { ...c, messages: c.messages.map((m) => m.id === tempId ? { ...m, status: "delivered" } : m) }
        : c));
    } catch (err) {
      toast.error(err?.message || "Failed to send message via WhatsApp");
      setConversations((prev) => prev.map((c) => c.id === activeId
        ? { ...c, messages: c.messages.map((m) => m.id === tempId ? { ...m, status: "failed" } : m) }
        : c));
    }
  }, [message, active, activeId]);

  const markResolved = useCallback((id) => {
    setConversations((prev) => prev.map((c) => c.id === id ? { ...c, status: "resolved", unread: 0 } : c));
    toast.success("Conversation marked as resolved");
  }, []);

  const assignToMe = useCallback((id) => {
    setConversations((prev) => prev.map((c) => c.id === id ? { ...c, assignee: "You" } : c));
    toast.success("Assigned to you");
  }, []);

  const toggleStar = useCallback((id) => {
    setConversations((prev) => prev.map((c) => c.id === id ? { ...c, starred: !c.starred } : c));
  }, []);

  const saveNote = useCallback(() => {
    setConversations((prev) => prev.map((c) => c.id === activeId ? { ...c, notes: noteText } : c));
    setEditingNote(false);
    toast.success("Note saved");
  }, [activeId, noteText]);

  const groupedMessages = useMemo(() => {
    if (!active) return {};
    return active.messages.reduce((acc, msg) => {
      const d = msg.date || "Today";
      if (!acc[d]) acc[d] = [];
      acc[d].push(msg);
      return acc;
    }, {});
  }, [active]);

  const viewLead = useCallback(() => {
    if (!active) return;
    const cid = active.customerId || active.id;
    if (cid && cid.includes("-")) {
      router.push(`/leads/active/${encodeId(cid)}`);
    } else {
      router.push(`/leads/active?search=${encodeURIComponent(active.phone || active.name)}`);
    }
  }, [active, router]);

  return (
    <div className="flex h-[calc(100vh-56px)] overflow-hidden bg-background border border-border rounded-xl">

      {/* ── LEFT: Conversation List ── */}
      <div className="w-[300px] shrink-0 border-r border-border flex flex-col bg-card">

        {/* Header */}
        <div className="px-3 pt-3 pb-2 border-b border-border space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-foreground">Chats</span>
              {totalUnread > 0 && (
                <span className="h-5 min-w-5 px-1.5 rounded-full bg-emerald-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {totalUnread}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <div className={cn(
                "flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border",
                wsConnected
                  ? "bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:border-emerald-800"
                  : "bg-rose-500/10 text-rose-600 border-rose-200"
              )}>
                {wsConnected ? <Wifi className="h-2.5 w-2.5" /> : <WifiOff className="h-2.5 w-2.5" />}
                {wsConnected ? "Live" : "Offline"}
              </div>
              <Button
                size="icon"
                className="h-7 w-7 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm"
                onClick={() => setNewChatOpen(true)}
                title="Start New WhatsApp Chat"
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name or number..."
              className="pl-8 h-8 text-xs bg-muted/50 border-border focus-visible:ring-1 rounded-lg"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1">
            {FILTERS.map((f) => {
              const count = f.key === "unread" ? totalUnread : null;
              return (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={cn(
                    "flex-1 py-1 rounded-lg text-[10px] font-semibold transition-all",
                    filter === f.key
                      ? "bg-emerald-500 text-white shadow-sm"
                      : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80"
                  )}
                >
                  {f.label}{count ? <span className="ml-0.5 opacity-80">({count})</span> : null}
                </button>
              );
            })}
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {isLoadingConvs ? (
            <div className="flex flex-col items-center justify-center h-40 gap-2 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin opacity-40" />
              <p className="text-xs">Loading conversations...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 px-4 text-center text-muted-foreground">
              <MessageCircle className="h-8 w-8 opacity-20 mb-2" />
              <p className="text-xs font-semibold text-foreground">No conversations</p>
              <p className="text-[11px] text-muted-foreground mt-1 mb-3">
                {search ? "No chats matching search" : "Inbound WhatsApp messages will appear here."}
              </p>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs border-emerald-500/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10"
                onClick={() => setNewChatOpen(true)}
              >
                <Plus className="h-3 w-3 mr-1" /> New Chat
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {filtered.map((conv) => (
                <ConvItem
                  key={conv.id}
                  conv={conv}
                  isActive={activeId === conv.id}
                  onClick={() => selectConv(conv.id)}
                />
              ))}
            </div>
          )}
        </div>

        <div className="px-3 py-2 border-t border-border flex items-center justify-between">
          <p className="text-[10px] text-muted-foreground">
            {filtered.length} of {conversations.length} conversations
          </p>
          <Button
            size="sm"
            variant="ghost"
            onClick={loadConversations}
            className="h-5 px-1.5 text-[10px] text-muted-foreground hover:text-foreground"
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* ── CENTER: Chat Window ── */}
      {active ? (
        <div className="flex-1 flex flex-col min-w-0 bg-muted/20">

          {/* Chat Header */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-card">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <Avatar className="h-8 w-8 border border-border">
                  <AvatarFallback className="text-[11px] font-bold bg-emerald-500/10 text-emerald-700">
                    {active.initials}
                  </AvatarFallback>
                </Avatar>
                {active.online && (
                  <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-card" />
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground leading-tight">{active.name}</p>
                <p className="text-[10px] text-muted-foreground">{active.phone || "No phone number"}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsAiMode(!isAiMode)}
                className={cn("h-7 px-2.5 text-[11px] gap-1.5 font-semibold rounded-lg",
                  isAiMode
                    ? "bg-violet-500/10 text-violet-600 hover:bg-violet-500/20"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Bot className="h-3.5 w-3.5" />
                {isAiMode ? "AI On" : "AI Off"}
              </Button>
              {active.status !== "resolved" && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => markResolved(active.id)}
                  className="h-7 px-2.5 text-[11px] gap-1.5 font-semibold text-emerald-600 hover:bg-emerald-500/10 rounded-lg"
                >
                  Resolve
                </Button>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-foreground rounded-lg">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44 text-xs">
                  <DropdownMenuItem onClick={() => assignToMe(active.id)} className="gap-2 cursor-pointer text-xs">
                    <UserPlus className="h-3.5 w-3.5" /> Assign to Me
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => toggleStar(active.id)} className="gap-2 cursor-pointer text-xs">
                    <Star className="h-3.5 w-3.5" /> {active.starred ? "Unstar" : "Star"}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={viewLead} className="gap-2 cursor-pointer text-xs">
                    <ExternalLink className="h-3.5 w-3.5" /> Open Lead Profile
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => markResolved(active.id)} className="gap-2 cursor-pointer text-xs">
                    <Archive className="h-3.5 w-3.5" /> Mark Resolved
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-0.5">
            {Object.keys(groupedMessages).length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground py-12">
                <MessageCircle className="h-10 w-10 opacity-20 mb-2" />
                <p className="text-xs font-semibold text-foreground">No message history yet</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Send a template or text message below to begin chatting.
                </p>
              </div>
            ) : (
              Object.entries(groupedMessages).map(([date, msgs]) => (
                <div key={date}>
                  <DateSeparator label={date} />
                  <div className="space-y-2">
                    {msgs.map((msg) => {
                      const isUs = msg.from === "us";
                      return (
                        <div key={msg.id} className={cn("flex", isUs ? "justify-end" : "justify-start")}>
                          <div className={cn(
                            "max-w-[68%] px-3.5 py-2.5 rounded-2xl shadow-sm text-[12.5px] leading-relaxed",
                            isUs
                              ? "bg-emerald-600 text-white rounded-br-sm"
                              : "bg-card text-foreground rounded-bl-sm border border-border"
                          )}>
                            <p className="whitespace-pre-wrap">{msg.text}</p>
                            <div className={cn("flex items-center gap-1 mt-1", isUs ? "justify-end" : "justify-start")}>
                              <span className={cn("text-[9.5px]", isUs ? "text-white/75" : "text-muted-foreground")}>
                                {msg.time}
                              </span>
                              <StatusIcon status={msg.status} fromUs={isUs} />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
            {isTyping && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Replies */}
          {showQuickReplies && (
            <div className="px-4 pb-2 flex flex-col gap-1 bg-card border-t border-border">
              <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider pt-2 mb-1">Quick Replies</p>
              {QUICK_REPLIES.map((qr, i) => (
                <button
                  key={i}
                  onClick={() => { setMessage(qr); setShowQuickReplies(false); inputRef.current?.focus(); }}
                  className="text-left text-[11.5px] text-foreground hover:text-primary px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/80 transition-colors truncate"
                >
                  {qr}
                </button>
              ))}
            </div>
          )}

          {/* Input Bar */}
          <div className="px-3 py-2.5 bg-card border-t border-border">
            {isAiMode && (
              <div className="flex items-center gap-1.5 mb-2 px-1">
                <Bot className="h-3 w-3 text-violet-500" />
                <span className="text-[10px] text-violet-600 font-semibold">AI Assistant is active for auto-replies</span>
              </div>
            )}
            <div className="flex items-end gap-2">
              <div className="flex items-center gap-0.5">
                <button
                  onClick={() => setShowQuickReplies(!showQuickReplies)}
                  title="Quick Replies"
                  className={cn("p-1.5 rounded-lg transition-colors", showQuickReplies ? "text-emerald-600 bg-emerald-500/10" : "text-muted-foreground hover:text-foreground hover:bg-muted")}
                >
                  <Zap className="h-4 w-4" />
                </button>
                <button
                  onClick={() => toast.info("Document & Image attachments will be sent via Meta Media API")}
                  title="Attach file"
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <Paperclip className="h-4 w-4" />
                </button>
              </div>
              <Textarea
                ref={inputRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
                }}
                placeholder="Type a WhatsApp message... (Enter to send, Shift+Enter for newline)"
                rows={1}
                className="flex-1 resize-none bg-muted/50 border-border text-foreground placeholder:text-muted-foreground text-[12.5px] rounded-xl px-3 py-2 focus-visible:ring-1 focus-visible:ring-emerald-500/50 min-h-[36px] max-h-[120px]"
              />
              <Button
                onClick={sendMessage}
                disabled={!message.trim()}
                size="icon"
                className="h-9 w-9 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shrink-0 disabled:opacity-40"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center bg-muted/20">
          <div className="text-center space-y-3 max-w-sm px-4">
            <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto">
              <MessageCircle className="h-7 w-7" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">WhatsApp Live Inbox</p>
              <p className="text-xs text-muted-foreground mt-1">
                Select a conversation from the left, or click below to start a chat with any lead or customer.
              </p>
            </div>
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5 shadow-sm"
              onClick={() => setNewChatOpen(true)}
            >
              <Plus className="h-3.5 w-3.5" /> Start New Chat
            </Button>
          </div>
        </div>
      )}

      {/* ── RIGHT: Contact Info Panel ── */}
      {active && (
        <div className="w-[240px] shrink-0 border-l border-border flex flex-col bg-card overflow-y-auto">
          <div className="p-4 border-b border-border text-center">
            <Avatar className="h-12 w-12 mx-auto mb-2 border-2 border-border">
              <AvatarFallback className="text-sm font-bold bg-emerald-500/10 text-emerald-700">
                {active.initials}
              </AvatarFallback>
            </Avatar>
            <p className="text-xs font-bold text-foreground">{active.name}</p>
            <p className="text-[10.5px] text-muted-foreground mt-0.5">{active.phone || "No phone"}</p>
            {active.channel && CHANNEL_CFG[active.channel] && (
              <span className={`inline-flex items-center gap-1 text-[9px] font-semibold px-2 py-0.5 rounded-full border mt-1.5 ${CHANNEL_CFG[active.channel].cls}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${CHANNEL_CFG[active.channel].dot}`} />
                {CHANNEL_CFG[active.channel].label}
              </span>
            )}
            <div className="flex items-center justify-center gap-1.5 mt-2 flex-wrap">
              {active.source && (
                <span className={cn("text-[9px] px-1.5 py-0.5 rounded-md font-medium", SOURCE_COLORS[active.source] || "bg-muted text-muted-foreground")}>
                  {active.source}
                </span>
              )}
              {active.label && (
                <span className={cn("text-[9px] px-1.5 py-0.5 rounded-md font-semibold border", LABEL_COLORS[active.label] || "bg-muted text-muted-foreground border-border")}>
                  {active.label}
                </span>
              )}
            </div>
          </div>

          <div className="p-3 space-y-4 text-xs">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Assigned Agent</p>
              <p className="text-foreground font-medium text-xs">{active.assignee}</p>
            </div>

            {active.tags?.length > 0 && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Tags</p>
                <div className="flex flex-wrap gap-1">
                  {active.tags.map((tag) => (
                    <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground border border-border font-medium">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Notes</p>
                <button onClick={() => setEditingNote(!editingNote)} className="text-[10px] text-primary hover:underline">
                  {editingNote ? "Cancel" : "Edit"}
                </button>
              </div>
              {editingNote ? (
                <div className="space-y-1.5">
                  <Textarea
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    rows={3}
                    className="text-xs resize-none"
                    placeholder="Add a customer note..."
                  />
                  <Button size="sm" onClick={saveNote} className="h-6 text-[10px] w-full">Save</Button>
                </div>
              ) : (
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  {active.notes || "No notes yet."}
                </p>
              )}
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Quick Actions</p>
              <div className="space-y-1">
                {active.phone && (
                  <button
                    onClick={() => window.open(`tel:${active.phone.replace(/[^\d+]/g, "")}`)}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-muted/60 hover:bg-muted text-foreground text-[11px] font-medium transition-colors"
                  >
                    <Phone className="h-3.5 w-3.5 text-emerald-600" /> Call Now
                  </button>
                )}
                <button
                  onClick={viewLead}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-muted/60 hover:bg-muted text-foreground text-[11px] font-medium transition-colors"
                >
                  <FileText className="h-3.5 w-3.5 text-primary" /> View Lead Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── New Chat Dialog ── */}
      <NewChatModal
        open={newChatOpen}
        onClose={() => setNewChatOpen(false)}
        onChatCreated={(conv) => {
          setConversations((prev) => [conv, ...prev.filter((c) => c.id !== conv.id)]);
          setActiveId(conv.id);
        }}
      />
    </div>
  );
}
