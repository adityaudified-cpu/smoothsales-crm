"use client";

import React, { useState, useRef, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Bot, Sparkles, MessageCircle, Send, Plus, Trash2, Save, User,
  BookOpen, Settings, FlaskConical, CheckCircle2, Zap, Brain,
  ShieldAlert, Target, Clock, RefreshCw, Edit2, X, AlertTriangle,
  TrendingUp, Activity, BarChart2, Cpu, Globe, FileText, Tag,
  ArrowRight, Info, ChevronDown, ChevronUp, Smartphone,
} from "lucide-react";
import { toast } from "sonner";
import { useWaAccounts, CHANNEL_BADGE } from "../wa-accounts-context";

const DEFAULT_PROMPT = `You are {{agent_name}}, a professional sales & customer success specialist at {{company_name}}.

Your goal is to qualify inbound leads, understand their requirements, and schedule discovery meetings or demos.

Always:
- Greet warmly and introduce yourself by name
- Ask clarifying questions about their business requirements, team size, budget, and timeline
- Highlight key benefits: streamlined workflow, quick implementation, dedicated support
- Offer to schedule a free 15-minute consultation or product walkthrough
- Keep responses concise (2-3 sentences max) and helpful
- Sound natural, polite, and consultative
- Use emojis sparingly to feel approachable

Never:
- Discuss competitor confidential information or make unfounded comparisons
- Make unauthorized commercial promises or unverified discounts (> 10%)
- Share internal cost breakdowns

If asked if you are an AI: Say "I'm a digital assistant at {{company_name}}, happy to help you or connect you with our human team anytime! 😊"`;

const INIT_FAQS = [
  { id: "f1", q: "What are your business hours?", a: "Our team is available Monday to Saturday, 9:30 AM to 6:30 PM. Inbound messages are answered promptly during business hours!", cat: "General" },
  { id: "f2", q: "How can I schedule a product demo or consultation?", a: "We would love to connect! Please share your preferred date and time, and our specialist will confirm a meeting invitation with you.", cat: "Process" },
  { id: "f3", q: "Where can I view your pricing and plans?", a: "Our pricing is structured based on team size and feature requirements. We can share a tailored proposal right after understanding your needs.", cat: "Pricing" },
  { id: "f4", q: "What solutions do you offer?", a: "We provide lead management, WhatsApp CRM automation, pipeline tracking, and sales analytics to help teams scale revenue.", cat: "General" },
  { id: "f5", q: "How do I reach human support directly?", a: "You can ask for a callback here or call our support line, and our account executive will connect with you right away.", cat: "Process" },
];

const INIT_CHAT = [
  { role: "agent", text: "Hello! I am your AI sales assistant. How can I help you today?", ts: "Just now" },
];

const VARS = [
  { id: "{{agent_name}}", label: "Agent Name" },
  { id: "{{company_name}}", label: "Company Name" },
  { id: "{{lead_name}}", label: "Lead Name" },
  { id: "{{product}}", label: "Product" },
  { id: "{{price_range}}", label: "Price Range" },
  { id: "{{city}}", label: "City" },
];

const HANDOFF_RULES = [
  { id: "r1", label: "Complex or sensitive query", desc: "Transfer to human when AI detects a complex or sensitive question", on: true },
  { id: "r2", label: "Pricing negotiation", desc: "Transfer when customer asks for discounts or special pricing", on: true },
  { id: "r3", label: "Complaint or negative sentiment", desc: "Transfer when negative sentiment or frustration is detected", on: true },
  { id: "r4", label: "After 5 unanswered turns", desc: "Transfer if AI cannot resolve the query after 5 exchanges", on: false },
  { id: "r5", label: "Legal or compliance query", desc: "Transfer when customer asks about contracts, legal terms, or compliance", on: true },
];

const LEAD_RULES = [
  { id: "l1", label: "Auto-create lead from chat", desc: "Automatically create a CRM lead when a new WhatsApp conversation starts", on: true },
  { id: "l2", label: "Capture name from conversation", desc: "Extract and save customer name from chat automatically", on: true },
  { id: "l3", label: "Capture budget from chat", desc: "Extract and save budget mentioned in conversation", on: true },
  { id: "l4", label: "Tag source as WhatsApp", desc: "Automatically tag all WhatsApp leads with source = WhatsApp", on: true },
  { id: "l5", label: "Capture team size / requirements", desc: "Extract and save team size or requirements mentioned in conversation", on: true },
];

const FAQ_CATS = ["All", "Pricing", "Process", "General", "Technical"];

// ─── Sub-components ───────────────────────────────────────────────────────────

function RuleRow({ rule, checked, onChange }) {
  return (
    <div className="flex items-start justify-between gap-4 p-3.5 rounded-xl border border-border bg-card hover:bg-muted/30 transition-colors">
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-foreground">{rule.label}</p>
        <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{rule.desc}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} className="shrink-0 mt-0.5" />
    </div>
  );
}

function StatCard({ label, value, sub, Icon, color, bg }) {
  return (
    <div className="flex items-center gap-3 p-4 rounded-2xl border border-border bg-card">
      <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${bg}`}>
        <Icon className={`h-5 w-5 ${color}`} />
      </div>
      <div>
        <p className="text-xl font-extrabold text-foreground leading-none">{value}</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">{label}</p>
        {sub && <p className="text-[10px] text-muted-foreground opacity-60">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function WhatsAppAIAgentPage() {
  const { accounts } = useWaAccounts();
  const metaAccounts = accounts.filter((a) => a.type === "meta");
  // Identity
  const [agentEnabled, setAgentEnabled] = useState(true);
  const [agentName, setAgentName] = useState("Priya");
  const [persona, setPersona] = useState("Sales & Solutions Specialist at SmoothSales CRM");
  const [tone, setTone] = useState("friendly");
  const [language, setLanguage] = useState("hinglish");
  const [model, setModel] = useState("gpt-4o-mini");
  const [greeting, setGreeting] = useState("Hi! I'm {{agent_name}} from {{company_name}} 😊 How can I help you today?");
  const [fallback, setFallback] = useState("Let me connect you with one of our team members who can better assist you!");
  const [workingHours, setWorkingHours] = useState(true);
  const [maxTurns, setMaxTurns] = useState("10");
  const [responseDelay, setResponseDelay] = useState("2");

  // Prompt
  const [systemPrompt, setSystemPrompt] = useState(DEFAULT_PROMPT);
  const promptRef = useRef(null);

  // Knowledge base
  const [faqs, setFaqs] = useState(INIT_FAQS);
  const [faqCat, setFaqCat] = useState("All");
  const [newQ, setNewQ] = useState("");
  const [newA, setNewA] = useState("");
  const [newCat, setNewCat] = useState("General");
  const [editingFaq, setEditingFaq] = useState(null);

  // Rules
  const [handoffRules, setHandoffRules] = useState(HANDOFF_RULES.map((r) => ({ ...r })));
  const [leadRules, setLeadRules] = useState(LEAD_RULES.map((r) => ({ ...r })));

  // Test console
  const [chat, setChat] = useState(INIT_CHAT);
  const [testInput, setTestInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chat, isTyping]);

  const insertVar = (v) => {
    const ta = promptRef.current;
    if (!ta) { setSystemPrompt((p) => p + " " + v); return; }
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    setSystemPrompt((p) => p.slice(0, start) + v + p.slice(end));
    setTimeout(() => { ta.focus(); ta.setSelectionRange(start + v.length, start + v.length); }, 0);
  };

  const addFaq = () => {
    if (!newQ.trim() || !newA.trim()) return toast.error("Fill both question and answer");
    if (editingFaq) {
      setFaqs((p) => p.map((f) => f.id === editingFaq ? { ...f, q: newQ, a: newA, cat: newCat } : f));
      setEditingFaq(null);
      toast.success("FAQ updated");
    } else {
      setFaqs((p) => [...p, { id: `f_${Date.now()}`, q: newQ, a: newA, cat: newCat }]);
      toast.success("FAQ added");
    }
    setNewQ(""); setNewA(""); setNewCat("General");
  };

  const startEditFaq = (faq) => {
    setEditingFaq(faq.id);
    setNewQ(faq.q); setNewA(faq.a); setNewCat(faq.cat);
  };

  const cancelEdit = () => { setEditingFaq(null); setNewQ(""); setNewA(""); setNewCat("General"); };

  const sendTest = () => {
    if (!testInput.trim()) return;
    const userMsg = { role: "user", text: testInput, ts: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) };
    setChat((p) => [...p, userMsg]);
    setTestInput("");
    setIsTyping(true);
    setTimeout(() => {
      const t = testInput.toLowerCase();
      let reply = `Thanks for reaching out! I'm ${agentName} from Jaipur Interiors. Could you tell me more about your requirements?`;
      if (t.includes("price") || t.includes("cost") || t.includes("budget")) reply = "Our packages start from ₹8L for 3BHK. We have beautiful designs in every budget! Would you like a free site visit? 😊";
      else if (t.includes("visit") || t.includes("meet")) reply = "Absolutely! We offer free site visits at your convenience. What day works best for you? 📅";
      else if (t.includes("time") || t.includes("days") || t.includes("long")) reply = "Typically 45-60 days for a 3BHK. We'll give you a detailed timeline after the site visit! 🏠";
      else if (t.includes("warranty") || t.includes("guarantee")) reply = "We provide a 10-year warranty on all modular furniture and 1-year on civil work. Quality is our promise! ✅";
      const agentMsg = { role: "agent", text: reply, ts: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) };
      setIsTyping(false);
      setChat((p) => [...p, agentMsg]);
    }, 1200);
  };

  const filteredFaqs = faqCat === "All" ? faqs : faqs.filter((f) => f.cat === faqCat);

  const toggleHandoff = (id) => setHandoffRules((p) => p.map((r) => r.id === id ? { ...r, on: !r.on } : r));
  const toggleLead = (id) => setLeadRules((p) => p.map((r) => r.id === id ? { ...r, on: !r.on } : r));

  return (
    <div className="flex flex-col h-full min-h-0 bg-background">

      {/* ── Top Bar ─────────────────────────────────────────────────────────── */}
      <div className="shrink-0 flex items-center justify-between gap-4 px-6 py-3.5 border-b border-border bg-card">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-9 w-9 rounded-xl bg-violet-500 flex items-center justify-center shrink-0 shadow-sm">
            <Bot className="h-[18px] w-[18px] text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-[15px] font-bold text-foreground leading-tight">WhatsApp AI Agent</h1>
            <p className="text-[11px] text-muted-foreground">Configure persona, knowledge base, and conversation rules</p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {/* Channel awareness */}
          {accounts.length > 0 && (
            <div className="hidden sm:flex items-center gap-1.5 flex-wrap">
              {accounts.map((acc) => {
                const cfg = CHANNEL_BADGE[acc.type] || CHANNEL_BADGE.meta;
                const Icon = acc.type === "personal" ? Smartphone : Globe;
                return (
                  <div key={acc.id} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-medium ${cfg.cls}`}>
                    <span className="h-1.5 w-1.5 rounded-full bg-current" />
                    <Icon className="h-3 w-3" />
                    {acc.label}
                  </div>
                );
              })}
            </div>
          )}
          {/* Agent status toggle */}
          <div className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-border bg-muted/40">
            <span className={`h-2 w-2 rounded-full shrink-0 ${agentEnabled ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground/40"}`} />
            <span className="text-xs text-muted-foreground font-medium">Agent</span>
            <Switch checked={agentEnabled} onCheckedChange={setAgentEnabled} className="scale-90" />
            <span className={`text-xs font-semibold ${agentEnabled ? "text-emerald-600" : "text-muted-foreground"}`}>
              {agentEnabled ? "Active" : "Paused"}
            </span>
          </div>
          <Button size="sm" className="h-8 text-xs gap-1.5 bg-violet-600 hover:bg-violet-700 text-white" onClick={() => toast.success("AI Agent configuration saved!")}>
            <Save className="h-3.5 w-3.5" />Save Config
          </Button>
        </div>
      </div>

      {/* ── KPI Strip ───────────────────────────────────────────────────────── */}
      <div className="shrink-0 grid grid-cols-2 sm:grid-cols-4 border-b border-border bg-card/60">
        {[
          { label: "Conversations Handled", value: "0", sub: "Live production", Icon: MessageCircle, color: "text-emerald-600", bg: "bg-emerald-500/10" },
          { label: "Human Escalations", value: "0", sub: "0% escalation", Icon: ShieldAlert, color: "text-amber-600", bg: "bg-amber-500/10" },
          { label: "Avg Response Time", value: "<1.0s", sub: "Real-time streaming", Icon: Zap, color: "text-blue-600", bg: "bg-blue-500/10" },
          { label: "Agent Status", value: agentEnabled ? "Online" : "Paused", sub: "Ready for inbound", Icon: TrendingUp, color: "text-violet-600", bg: "bg-violet-500/10" },
        ].map((s, i) => (
          <div key={s.label} className={`px-5 py-3 flex items-center gap-3 ${i < 3 ? "border-r border-border" : ""}`}>
            <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${s.bg}`}>
              <s.Icon className={`h-4 w-4 ${s.color}`} />
            </div>
            <div>
              <p className={`text-xl font-extrabold leading-none ${s.color}`}>{s.value}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{s.label} <span className="opacity-50">· {s.sub}</span></p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Tabs ────────────────────────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <Tabs defaultValue="identity" className="flex flex-col h-full">
          {/* Tab Bar */}
          <div className="shrink-0 px-6 pt-4 border-b border-border bg-card/40">
            <TabsList className="h-9 bg-muted/60 gap-0.5">
              {[
                { value: "identity", label: "Identity", Icon: User },
                { value: "prompt", label: "System Prompt", Icon: Sparkles },
                { value: "knowledge", label: "Knowledge Base", Icon: BookOpen },
                { value: "rules", label: "Rules", Icon: Settings },
                { value: "test", label: "Test Console", Icon: FlaskConical },
              ].map((t) => (
                <TabsTrigger key={t.value} value={t.value} className="gap-1.5 text-xs px-3 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  <t.Icon className="h-3.5 w-3.5" />{t.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {/* ── IDENTITY TAB ──────────────────────────────────────────────── */}
          <TabsContent value="identity" className="flex-1 overflow-y-auto p-6 mt-0">
            <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Agent Identity Card */}
              <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
                <div className="flex items-center gap-2.5 pb-1">
                  <div className="h-8 w-8 rounded-xl bg-violet-500/10 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-violet-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">Agent Identity</p>
                    <p className="text-[11px] text-muted-foreground">How the agent presents itself to customers</p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Agent Name <span className="text-muted-foreground font-normal">(shown to customers)</span></Label>
                  <Input value={agentName} onChange={(e) => setAgentName(e.target.value)} placeholder="e.g. Priya" className="h-9 text-xs" />
                  <p className="text-[11px] text-muted-foreground">Choose a human-sounding name. The agent introduces itself as this name.</p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Role / Persona</Label>
                  <Input value={persona} onChange={(e) => setPersona(e.target.value)} placeholder="e.g. Sales Consultant at Acme Corp" className="h-9 text-xs" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Tone</Label>
                    <Select value={tone} onValueChange={setTone}>
                      <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="friendly" className="text-xs">Friendly & Warm</SelectItem>
                        <SelectItem value="professional" className="text-xs">Professional</SelectItem>
                        <SelectItem value="casual" className="text-xs">Casual</SelectItem>
                        <SelectItem value="formal" className="text-xs">Formal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Language</Label>
                    <Select value={language} onValueChange={setLanguage}>
                      <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="english" className="text-xs">English</SelectItem>
                        <SelectItem value="hindi" className="text-xs">Hindi</SelectItem>
                        <SelectItem value="hinglish" className="text-xs">Hinglish</SelectItem>
                        <SelectItem value="auto" className="text-xs">Auto-detect</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">AI Model</Label>
                  <Select value={model} onValueChange={setModel}>
                    <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gpt-4o-mini" className="text-xs"><span className="font-semibold">GPT-4o Mini</span> — Fast & Cost-effective</SelectItem>
                      <SelectItem value="gpt-4o" className="text-xs"><span className="font-semibold">GPT-4o</span> — Most Accurate</SelectItem>
                      <SelectItem value="claude-3-haiku" className="text-xs"><span className="font-semibold">Claude 3 Haiku</span> — Balanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Model info pill */}
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-muted/40 border border-border text-[11px] text-muted-foreground">
                  <Cpu className="h-3.5 w-3.5 shrink-0 text-violet-500" />
                  <span>Current: <span className="font-semibold text-foreground">{model}</span> · ~$0.0002 per message · avg 1.2s latency</span>
                </div>
              </div>

              {/* Conversation Settings Card */}
              <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
                <div className="flex items-center gap-2.5 pb-1">
                  <div className="h-8 w-8 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                    <MessageCircle className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">Conversation Settings</p>
                    <p className="text-[11px] text-muted-foreground">Messages and behavior configuration</p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Greeting Message</Label>
                  <Textarea value={greeting} onChange={(e) => setGreeting(e.target.value)} className="text-xs min-h-[72px] resize-none" />
                  <p className="text-[11px] text-muted-foreground">Sent when a new conversation starts. Use {`{{agent_name}}`} and {`{{company_name}}`}.</p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Fallback / Handoff Message</Label>
                  <Textarea value={fallback} onChange={(e) => setFallback(e.target.value)} className="text-xs min-h-[56px] resize-none" />
                  <p className="text-[11px] text-muted-foreground">Sent when the AI cannot handle the query and escalates to a human.</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Max Turns Before Handoff</Label>
                    <Input type="number" min="3" max="20" value={maxTurns} onChange={(e) => setMaxTurns(e.target.value)} className="h-9 text-xs" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Response Delay (sec)</Label>
                    <Input type="number" min="0" max="10" value={responseDelay} onChange={(e) => setResponseDelay(e.target.value)} className="h-9 text-xs" />
                    <p className="text-[11px] text-muted-foreground">Simulates human typing delay.</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-muted/40 border border-border">
                  <div>
                    <p className="text-xs font-semibold text-foreground">Working Hours Only</p>
                    <p className="text-[11px] text-muted-foreground">AI only replies during business hours (9am–7pm)</p>
                  </div>
                  <Switch checked={workingHours} onCheckedChange={setWorkingHours} />
                </div>

                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-violet-500/5 border border-violet-500/20 text-[11px] text-violet-700 dark:text-violet-300">
                  <Sparkles className="h-3.5 w-3.5 shrink-0 mt-0.5 text-violet-500" />
                  <span>The agent will always claim to be human. It will never say "I am an AI" even if directly asked.</span>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ── SYSTEM PROMPT TAB ─────────────────────────────────────────── */}
          <TabsContent value="prompt" className="flex-1 overflow-y-auto p-6 mt-0">
            <div className="max-w-4xl mx-auto space-y-4">
              <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-xl bg-violet-500/10 flex items-center justify-center">
                      <Sparkles className="h-4 w-4 text-violet-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">System Prompt</p>
                      <p className="text-[11px] text-muted-foreground">Defines the agent's behavior, personality, and boundaries</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5" onClick={() => { setSystemPrompt(DEFAULT_PROMPT); toast.success("Reset to default"); }}>
                    <RefreshCw className="h-3 w-3" />Reset
                  </Button>
                </div>

                {/* Variable chips */}
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Insert Variable at Cursor</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {VARS.map((v) => (
                      <button
                        key={v.id}
                        onClick={() => insertVar(v.id)}
                        className="inline-flex items-center gap-1 text-[11px] font-mono px-2.5 py-1 rounded-lg bg-violet-500/8 text-violet-700 dark:text-violet-300 border border-violet-500/20 hover:bg-violet-500/15 transition-colors"
                      >
                        {v.id}
                        <span className="text-[9px] text-muted-foreground font-sans ml-0.5">({v.label})</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Prompt textarea */}
                <Textarea
                  ref={promptRef}
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  className="text-xs min-h-[340px] resize-none font-mono leading-relaxed"
                  spellCheck={false}
                />

                {/* Stats row */}
                <div className="flex items-center gap-4 text-[11px] text-muted-foreground pt-1 border-t border-border">
                  <span>{systemPrompt.length} characters</span>
                  <span>·</span>
                  <span>{systemPrompt.split(/\s+/).filter(Boolean).length} words</span>
                  <span>·</span>
                  <span>~{Math.ceil(systemPrompt.length / 4)} tokens</span>
                  <div className="ml-auto flex items-center gap-1.5 text-amber-600">
                    <Info className="h-3 w-3" />
                    <span>Variables like {`{{agent_name}}`} are replaced at runtime</span>
                  </div>
                </div>
              </div>

              {/* Tips card */}
              <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
                <p className="text-xs font-bold text-foreground flex items-center gap-2"><Brain className="h-3.5 w-3.5 text-violet-500" />Prompt Writing Tips</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { icon: Target, color: "text-emerald-600", bg: "bg-emerald-500/10", title: "Be Specific", desc: "Define exact goals, e.g. 'schedule a site visit' not just 'help customers'" },
                    { icon: ShieldAlert, color: "text-red-500", bg: "bg-red-500/10", title: "Set Boundaries", desc: "Explicitly list what the agent should NEVER do or say" },
                    { icon: Globe, color: "text-blue-600", bg: "bg-blue-500/10", title: "Use Variables", desc: "Use {{agent_name}} and {{company_name}} for dynamic personalization" },
                  ].map((tip) => (
                    <div key={tip.title} className="flex items-start gap-2.5 p-3 rounded-xl bg-muted/40 border border-border">
                      <div className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 ${tip.bg}`}>
                        <tip.icon className={`h-3.5 w-3.5 ${tip.color}`} />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-foreground">{tip.title}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{tip.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ── KNOWLEDGE BASE TAB ────────────────────────────────────────── */}
          <TabsContent value="knowledge" className="flex-1 overflow-y-auto p-6 mt-0">
            <div className="max-w-4xl mx-auto space-y-4">
              <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-xl bg-blue-500/10 flex items-center justify-center">
                      <BookOpen className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">FAQ Knowledge Base</p>
                      <p className="text-[11px] text-muted-foreground">{faqs.length} entries · AI uses these to answer customer questions accurately</p>
                    </div>
                  </div>
                  {/* Category filter */}
                  <div className="flex items-center gap-1 bg-muted/60 p-0.5 rounded-xl border border-border">
                    {FAQ_CATS.map((c) => (
                      <button key={c} onClick={() => setFaqCat(c)} className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${faqCat === c ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                {/* FAQ list */}
                <div className="space-y-2">
                  {filteredFaqs.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      <p className="text-xs">No FAQs in this category</p>
                    </div>
                  )}
                  {filteredFaqs.map((faq) => (
                    <div key={faq.id} className="group p-3.5 rounded-xl border border-border bg-muted/20 hover:bg-muted/40 transition-colors space-y-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2 flex-1 min-w-0">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 border border-blue-500/20 shrink-0 mt-0.5">{faq.cat}</span>
                          <p className="text-xs font-semibold text-foreground">{faq.q}</p>
                        </div>
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          <button onClick={() => startEditFaq(faq)} className="h-6 w-6 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-background transition-colors" title="Edit">
                            <Edit2 className="h-3 w-3" />
                          </button>
                          <button onClick={() => { setFaqs((p) => p.filter((f) => f.id !== faq.id)); toast.success("FAQ deleted"); }} className="h-6 w-6 rounded-md flex items-center justify-center text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors" title="Delete">
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed pl-0">{faq.a}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Add / Edit FAQ */}
              <div className="rounded-2xl border-2 border-dashed border-border bg-card p-5 space-y-3">
                <p className="text-xs font-bold text-foreground flex items-center gap-2">
                  {editingFaq ? <><Edit2 className="h-3.5 w-3.5 text-amber-500" />Edit FAQ</> : <><Plus className="h-3.5 w-3.5 text-blue-500" />Add New FAQ</>}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2 space-y-1.5">
                    <Label className="text-xs font-semibold">Question *</Label>
                    <Input value={newQ} onChange={(e) => setNewQ(e.target.value)} placeholder="e.g. What areas do you serve?" className="h-9 text-xs" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Category</Label>
                    <Select value={newCat} onValueChange={setNewCat}>
                      <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {FAQ_CATS.filter((c) => c !== "All").map((c) => <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Answer *</Label>
                  <Textarea value={newA} onChange={(e) => setNewA(e.target.value)} placeholder="Provide a clear, concise answer..." className="text-xs min-h-[72px] resize-none" />
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" className="h-8 text-xs gap-1.5 bg-blue-600 hover:bg-blue-700 text-white" onClick={addFaq}>
                    {editingFaq ? <><Save className="h-3 w-3" />Update FAQ</> : <><Plus className="h-3 w-3" />Add FAQ</>}
                  </Button>
                  {editingFaq && (
                    <Button variant="outline" size="sm" className="h-8 text-xs" onClick={cancelEdit}>Cancel</Button>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ── RULES TAB ─────────────────────────────────────────────────── */}
          <TabsContent value="rules" className="flex-1 overflow-y-auto p-6 mt-0">
            <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Handoff Rules */}
              <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
                <div className="flex items-center gap-2.5 pb-1">
                  <div className="h-8 w-8 rounded-xl bg-amber-500/10 flex items-center justify-center">
                    <ShieldAlert className="h-4 w-4 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">Handoff Rules</p>
                    <p className="text-[11px] text-muted-foreground">When to transfer conversation to a human agent</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {handoffRules.map((rule) => (
                    <RuleRow key={rule.id} rule={rule} checked={rule.on} onChange={() => toggleHandoff(rule.id)} />
                  ))}
                </div>
                <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 text-[11px] text-amber-700 dark:text-amber-400">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  <span>When a handoff is triggered, the agent sends the fallback message and marks the conversation for human review in Live Chat.</span>
                </div>
              </div>

              {/* Lead Capture Rules */}
              <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
                <div className="flex items-center gap-2.5 pb-1">
                  <div className="h-8 w-8 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                    <Target className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">Lead Capture Rules</p>
                    <p className="text-[11px] text-muted-foreground">Automatically extract and save data from conversations</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {leadRules.map((rule) => (
                    <RuleRow key={rule.id} rule={rule} checked={rule.on} onChange={() => toggleLead(rule.id)} />
                  ))}
                </div>
                <div className="flex items-start gap-2 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-[11px] text-emerald-700 dark:text-emerald-400">
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  <span>Captured data is automatically saved to the lead's CRM profile. You can view it in the Leads section.</span>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ── TEST CONSOLE TAB ──────────────────────────────────────────── */}
          <TabsContent value="test" className="flex-1 overflow-hidden p-6 mt-0">
            <div className="max-w-5xl mx-auto h-full grid grid-cols-1 lg:grid-cols-5 gap-6" style={{ maxHeight: "calc(100vh - 280px)" }}>

              {/* Chat window — 3 cols */}
              <div className="lg:col-span-3 flex flex-col rounded-2xl border border-border bg-card overflow-hidden">
                {/* Chat header */}
                <div className="shrink-0 flex items-center gap-3 px-4 py-3 border-b border-border bg-muted/20">
                  <div className="h-9 w-9 rounded-full bg-violet-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
                    {agentName[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-foreground">{agentName} <span className="text-muted-foreground font-normal">— AI Agent</span></p>
                    <p className="text-[10px] text-emerald-500 flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />Online
                    </p>
                  </div>
                  <Badge variant="outline" className="text-[10px] text-violet-600 border-violet-300 bg-violet-500/10 shrink-0">Test Mode</Badge>
                  <button onClick={() => setChat(INIT_CHAT)} className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors" title="Reset conversation">
                    <RefreshCw className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {chat.map((msg, i) => (
                    <div key={i} className={`flex items-end gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                      {msg.role === "agent" && (
                        <div className="h-6 w-6 rounded-full bg-violet-500 flex items-center justify-center text-white text-[10px] font-bold shrink-0 mb-0.5">
                          {agentName[0]}
                        </div>
                      )}
                      <div className={`max-w-[78%] space-y-0.5`}>
                        <div className={`px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed ${msg.role === "user" ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-muted text-foreground rounded-bl-sm"}`}>
                          {msg.text}
                        </div>
                        <p className={`text-[9px] text-muted-foreground ${msg.role === "user" ? "text-right" : "text-left"} px-1`}>{msg.ts}</p>
                      </div>
                    </div>
                  ))}
                  {isTyping && (
                    <div className="flex items-end gap-2 justify-start">
                      <div className="h-6 w-6 rounded-full bg-violet-500 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                        {agentName[0]}
                      </div>
                      <div className="px-3.5 py-2.5 rounded-2xl rounded-bl-sm bg-muted flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Input */}
                <div className="shrink-0 p-3 border-t border-border flex gap-2">
                  <Input
                    value={testInput}
                    onChange={(e) => setTestInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendTest()}
                    placeholder="Type a test message..."
                    className="h-9 text-xs flex-1"
                    disabled={isTyping}
                  />
                  <Button size="sm" className="h-9 w-9 p-0 bg-violet-600 hover:bg-violet-700 text-white shrink-0" onClick={sendTest} disabled={isTyping || !testInput.trim()}>
                    <Send className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              {/* Config panel — 2 cols */}
              <div className="lg:col-span-2 flex flex-col gap-4 overflow-y-auto">
                {/* Active config */}
                <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
                  <p className="text-xs font-bold text-foreground flex items-center gap-2"><Activity className="h-3.5 w-3.5 text-violet-500" />Active Configuration</p>
                  <div className="space-y-2">
                    {[
                      { label: "Agent Name", value: agentName },
                      { label: "Model", value: model },
                      { label: "Tone", value: tone },
                      { label: "Language", value: language },
                      { label: "Max Turns", value: maxTurns },
                      { label: "Delay", value: `${responseDelay}s` },
                    ].map((row) => (
                      <div key={row.label} className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
                        <span className="text-[11px] text-muted-foreground">{row.label}</span>
                        <span className="text-[11px] font-semibold text-foreground capitalize">{row.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Test scenarios */}
                <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
                  <p className="text-xs font-bold text-foreground flex items-center gap-2"><FlaskConical className="h-3.5 w-3.5 text-blue-500" />Quick Test Scenarios</p>
                  <div className="space-y-1.5">
                    {[
                      "What is your price range?",
                      "I want to schedule a site visit",
                      "How long does the project take?",
                      "Do you provide warranty?",
                      "Are you a bot or human?",
                    ].map((scenario) => (
                      <button
                        key={scenario}
                        onClick={() => { setTestInput(scenario); }}
                        className="w-full text-left text-[11px] px-3 py-2 rounded-xl border border-border bg-muted/30 hover:bg-muted/60 hover:border-primary/30 text-muted-foreground hover:text-foreground transition-all flex items-center gap-2"
                      >
                        <ArrowRight className="h-3 w-3 shrink-0 text-primary" />
                        {scenario}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Warning */}
                <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-3.5 text-[11px] text-amber-700 dark:text-amber-400 flex items-start gap-2">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  <span>This is a simulated test. In production, the AI uses your actual system prompt and knowledge base to generate responses.</span>
                </div>
              </div>
            </div>
          </TabsContent>

        </Tabs>
      </div>
    </div>
  );
}
