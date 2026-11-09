"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useLeads } from "@/lib/hooks/use-leads";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Phone,
  MessageCircle,
  MapPin,
  Building2,
  Clock,
  Globe,
  PhoneOutgoing,
  Calendar,
  Activity,
  Copy,
  Tag,
  Zap,
  CheckCircle2,
  Mic,
  Send,
  Check,
  Layers,
  FileText,
  Download,
  IndianRupee,
  Plus,
  Eye,
  Square,
  StickyNote,
  ChevronDown,
  MapPinned,
  SkipForward,
  Pencil,
  Trash2,
  ShieldCheck,
  ShieldAlert,
  SearchX,
} from "lucide-react";
import { format, formatDistanceToNowStrict } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { formatINR, parseValidDate } from "@/lib/format-cell-value";
import { addLeadDocument, downloadLeadDocument, formatFileSize, listLeadDocuments } from "@/lib/document-store";
import {
  DISPOSITIONS,
  DOCUMENT_CATEGORIES,
  LIFECYCLE_STYLES,
  WHATSAPP_TEMPLATES,
  estimateDealValue,
  fillTemplate,
  lifecycleOf,
  whatsappLink,
} from "@/lib/leads-workspace";
import { DocumentPreviewDialog } from "@/components/leads/document-preview-dialog";
import { LeadFormDialog } from "@/components/leads/lead-form-dialog";
import { PermissionGate } from "@/components/auth/permission-gate";
import { isApiMode } from "@/lib/api/client";
import { customersApi, callsApi, remindersApi } from "@/lib/api/customers";
import { DISPOSITION_TO_API } from "@/lib/api/mappers";
import { decodeLeadId, encodeLeadId } from "@/lib/lead-id-codec";

// ─── Constants ────────────────────────────────────────────────────────────────

const PIPELINE_STAGES = [
  { id: "new", name: "New Lead", step: 1 },
  { id: "contacted", name: "Contacted", step: 2 },
  { id: "meeting", name: "Meeting Scheduled", step: 3 },
  { id: "qualified", name: "Qualified", step: 4 },
  { id: "proposal", name: "Proposal Sent", step: 5 },
  { id: "won", name: "Deal Won", step: 6 },
];

const STAGE_COLORS = {
  "New Lead": "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  "Contacted": "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20",
  "Meeting Scheduled": "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
  "Qualified": "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
  "Proposal Sent": "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  "Deal Won": "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  "Disqualified": "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
};

const DISPOSITION_TONES = {
  emerald: "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  sky: "border-sky-500 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  amber: "border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  rose: "border-rose-500 bg-rose-500/10 text-rose-700 dark:text-rose-300",
};

const CONSENT_LABELS = {
  call_consent: "OK to call",
  whatsapp_consent: "OK to WhatsApp",
  email_consent: "OK to email",
  dnd_registered: "DND registered",
};

const VISIT_TYPES = ["Site visit", "Office meeting", "Showroom visit", "Virtual meeting"];
const VISIT_OUTCOMES = ["Completed", "Rescheduled", "No-show", "Cancelled"];
const MAX_VOICE_SECONDS = 300;
const AUDIO_SPEEDS = [1, 1.5, 2];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const makeId = (prefix) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
const nowMs = () => Date.now();
const fmtSec = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}m ${String(s % 60).padStart(2, "0")}s`;

function formatWhen(value) {
  const d = parseValidDate(value);
  if (!d) return "—";
  return Math.abs(Date.now() - d.getTime()) < 60000 ? "Just now" : formatDistanceToNowStrict(d, { addSuffix: true });
}

function atTime(daysAhead, hours) {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  d.setHours(hours, 0, 0, 0);
  return d;
}

const QUICK_FOLLOWUPS = [
  { label: "+2 Hours", build: () => new Date(Date.now() + 2 * 3600000) },
  { label: "Tomorrow 10 AM", build: () => atTime(1, 10) },
  { label: "Tomorrow 3 PM", build: () => atTime(1, 15) },
  { label: "Next Monday", build: () => atTime(((8 - new Date().getDay()) % 7) || 7, 10) },
];

const escapeHtml = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

function buildQuotationHtml({ lead, leadName, company, location, dealValue, tokenReceived, balancePending, ownerName }) {
  const rows = [
    ["Service", lead.preferred_service || lead.product_or_service || "As discussed"],
    ["Property", [lead.property_type, lead.project_type].filter(Boolean).join(" · ") || "—"],
    ["Budget", lead.budget_range || "—"],
    ["Site", lead.site_location_preference || lead.address || "—"],
  ];
  const quoteNo = `Q-${String(lead.id).replace(/\W/g, "").slice(-6).toUpperCase()}-${format(new Date(), "yyMMdd")}`;
  return `<!doctype html><html><head><meta charset="utf-8"><title>Quotation ${escapeHtml(quoteNo)}</title>
<style>body{font:13px/1.5 system-ui,sans-serif;color:#111;margin:40px}h1{font-size:20px;margin:0}table{width:100%;border-collapse:collapse;margin-top:16px}td,th{border:1px solid #ddd;padding:8px;text-align:left}th{background:#f5f5f5;width:35%}.muted{color:#666}.total td{font-weight:700}.head{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #111;padding-bottom:12px}@media print{body{margin:16mm}}</style></head><body>
<div class="head"><div><h1>Quotation</h1><div class="muted">${escapeHtml(quoteNo)} · ${escapeHtml(format(new Date(), "dd MMM yyyy"))}</div></div><div style="text-align:right"><strong>Prepared by</strong><br>${escapeHtml(ownerName)}</div></div>
<h3>Client</h3><div><strong>${escapeHtml(leadName)}</strong>${lead.designation ? ` · ${escapeHtml(lead.designation)}` : ""}<br>${escapeHtml(company)}<br>${escapeHtml(location)}<br>${escapeHtml(lead.mobile_number || "")} ${escapeHtml(lead.email || "")}</div>
<table>${rows.map(([k, v]) => `<tr><th>${escapeHtml(k)}</th><td>${escapeHtml(v)}</td></tr>`).join("")}</table>
<table><tr><th>Estimated value</th><td>${escapeHtml(formatINR(dealValue))}</td></tr><tr><th>Advance received</th><td>${escapeHtml(formatINR(tokenReceived))}</td></tr><tr class="total"><th>Balance</th><td>${escapeHtml(formatINR(balancePending))}</td></tr></table>
<p class="muted" style="margin-top:24px">Estimate based on budget band discussed. Final pricing follows site measurement. Valid 15 days.</p>
</body></html>`;
}

// ─── AudioClip sub-component ──────────────────────────────────────────────────

function AudioClip({ doc, duration }) {
  const audioRef = useRef(null);
  const [url, setUrl] = useState(null);
  const [speedIdx, setSpeedIdx] = useState(0);

  useEffect(() => {
    if (!doc?.blob) return undefined;
    const u = URL.createObjectURL(doc.blob);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [doc]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = AUDIO_SPEEDS[speedIdx];
  }, [speedIdx, url]);

  if (!doc) return <p className="text-xs text-muted-foreground italic">Recording removed from vault.</p>;

  return (
    <div className="flex items-center gap-2 rounded-lg bg-muted/40 border border-border p-2">
      <audio ref={audioRef} src={url || undefined} controls preload="metadata" className="h-7 min-w-0 flex-1" />
      {duration && <span className="font-mono text-[10px] text-muted-foreground shrink-0">{duration}</span>}
      <Button
        type="button" variant="ghost" size="sm"
        onClick={() => setSpeedIdx((i) => (i + 1) % AUDIO_SPEEDS.length)}
        className="h-6 px-1.5 font-mono text-[10px] shrink-0"
      >
        {AUDIO_SPEEDS[speedIdx]}x
      </Button>
      <Button
        type="button" variant="ghost" size="icon"
        onClick={() => downloadLeadDocument(doc)}
        className="h-6 w-6 shrink-0 text-muted-foreground"
      >
        <Download className="h-3 w-3" />
      </Button>
    </div>
  );
}

// ─── InfoRow helper ───────────────────────────────────────────────────────────

function InfoRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-3 py-1.5 border-b border-border/40 last:border-0">
      <span className="text-xs text-muted-foreground shrink-0">{label}</span>
      <span className="text-xs font-medium text-foreground text-right">{value || "—"}</span>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const leadId = decodeLeadId(String(params?.id || ""));

  const { data: leads, batchUpdateLeads, batchDeleteLeads, isInitialized } = useLeads();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const lead = useMemo(() => leads.find((l) => String(l.id) === leadId) || null, [leads, leadId]);
  const notFound = isInitialized && !lead;

  const { prevLeadId, nextLeadId, queueIndex, queueTotal } = useMemo(() => {
    const idx = leads.findIndex((l) => String(l.id) === leadId);
    return {
      queueIndex: idx,
      queueTotal: leads.length,
      prevLeadId: idx > 0 ? encodeLeadId(leads[idx - 1].id) : null,
      nextLeadId: idx >= 0 && idx < leads.length - 1 ? encodeLeadId(leads[idx + 1].id) : null,
    };
  }, [leads, leadId]);

  // Derived fields
  const leadName = lead?.lead_name || lead?.name || "Unnamed Lead";
  const mobileNumber = lead?.mobile_number || lead?.phone || "";
  const dialable = mobileNumber.replace(/[^\d+]/g, "");
  const email = lead?.email || "";
  const company = lead?.business || lead?.company || "—";
  const location = [lead?.city, lead?.state].filter(Boolean).join(", ") || "—";
  const address = lead?.address || "—";
  const designation = lead?.designation || "—";
  const leadSource = lead?.lead_source || lead?.source || "—";
  const priority = Number(lead?.lead_priority) || 0;
  const currentStage = lead?.lead_stage || "New Lead";
  const lifecycle = lead ? lifecycleOf(lead) : "New lead";
  const ownerName = lead?.lead_owner?.name || "Unassigned";
  const dealValue = lead ? estimateDealValue(lead) : 0;
  const tokenReceived = Number(lead?.total_payment) || 0;
  const balancePending = Math.max(0, dealValue - tokenReceived);
  const nextFollowupDate = parseValidDate(lead?.next_followup);
  const isOverdue = nextFollowupDate && nextFollowupDate < new Date();

  const currentStep = useMemo(() => {
    const s = currentStage.toLowerCase();
    if (s.includes("won")) return 6;
    if (s.includes("propos")) return 5;
    if (s.includes("qualif") && !s.includes("dis")) return 4;
    if (s.includes("meet") || s.includes("visit")) return 3;
    if (s.includes("contact")) return 2;
    return 1;
  }, [currentStage]);

  // Composer state
  const [composerTab, setComposerTab] = useState("call");
  const [dispositionId, setDispositionId] = useState("interested");
  const [callbackAt, setCallbackAt] = useState("");
  const [nextAction, setNextAction] = useState("");
  const [createDeal, setCreateDeal] = useState(false);
  const [callNotes, setCallNotes] = useState("");
  const [noteHeading, setNoteHeading] = useState("");
  const [noteBody, setNoteBody] = useState("");
  const [visitType, setVisitType] = useState(VISIT_TYPES[0]);
  const [visitOutcome, setVisitOutcome] = useState(VISIT_OUTCOMES[0]);
  const [visitAt, setVisitAt] = useState("");
  const [visitNotes, setVisitNotes] = useState("");
  const [templateId, setTemplateId] = useState(WHATSAPP_TEMPLATES[0].id);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDue, setTaskDue] = useState("");
  const [customFollowup, setCustomFollowup] = useState("");
  const [timelineFilter, setTimelineFilter] = useState("all");
  const [leadDocs, setLeadDocs] = useState([]);
  const [uploadCategory, setUploadCategory] = useState("Floorplan");
  const [previewDoc, setPreviewDoc] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordSecs, setRecordSecs] = useState(0);
  const recorderRef = useRef(null);
  const timerRef = useRef(null);
  const startRef = useRef(0);
  const fileInputRef = useRef(null);

  const whatsappMessage = lead ? fillTemplate(WHATSAPP_TEMPLATES.find((t) => t.id === templateId)?.body || "", lead) : "";

  // Timeline
  const timelineKey = `smoothsales_lead_timeline_${leadId}`;
  const [userEvents, setUserEvents] = useState([]);
  const [apiEvents, setApiEvents] = useState([]);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(timelineKey) || "[]");
      setUserEvents(Array.isArray(stored) ? stored : []);
    } catch { setUserEvents([]); }
  }, [timelineKey]);

  useEffect(() => {
    if (!isApiMode() || !lead || String(lead.id).startsWith("lead_") || String(lead.id).startsWith("manual_")) return;
    customersApi.timeline(lead.id)
      .then(({ items }) => {
        setApiEvents((items || []).map((ev) => ({
          id: ev.id || `api_${ev.createdAt}`,
          type: ev.type?.toLowerCase() || "system",
          title: ev.title || ev.description || "Activity",
          at: ev.createdAt || ev.timestamp,
          caller: ev.performedBy || ev.staffName,
          snippet: ev.notes || ev.description,
          transcript: ev.notes,
        })));
      })
      .catch(() => {});
  }, [lead]);

  const addEvent = useCallback((event) => {
    const entry = { id: makeId("ev"), at: new Date().toISOString(), caller: ownerName, ...event };
    setUserEvents((prev) => {
      const next = [entry, ...prev].slice(0, 200);
      try { localStorage.setItem(timelineKey, JSON.stringify(next)); } catch {}
      return next;
    });
  }, [ownerName, timelineKey]);

  const derivedEvents = useMemo(() => {
    if (!lead) return [];
    const evs = [];
    if (lead.last_call_outcome || lead.last_called_by) {
      evs.push({
        id: "rec_call", type: "call",
        title: `${lead.last_call_direction === "inbound" ? "Inbound" : "Outbound"} call · ${lead.last_call_outcome || "Logged"}`,
        caller: lead.last_called_by,
        at: lead.last_disposition_on || lead.last_worked,
        snippet: [lead.lead_disposition, lead.last_call_nature].filter(Boolean).join(" · "),
        transcript: lead.last_user_remark,
      });
    }
    if (lead.last_visit) evs.push({ id: "rec_visit", type: "visit", title: `Visit · ${lead.last_visit_outcome || "Completed"}`, at: lead.last_visit, snippet: [lead.last_visit_nature, lead.last_visit_by && `by ${lead.last_visit_by}`].filter(Boolean).join(" ") });
    if (lead.last_closed_task) evs.push({ id: "rec_task", type: "task", title: "Task completed", at: lead.last_updated, snippet: lead.last_closed_task });
    if (lead.became_opportunity) evs.push({ id: "rec_opp", type: "stage_change", title: "Became an opportunity", at: lead.became_opportunity });
    if (lead.started_work_on || lead.created_at) evs.push({ id: "rec_ingest", type: "system", title: `Lead from ${leadSource}`, at: lead.started_work_on || lead.created_at });
    return evs;
  }, [lead, leadSource]);

  const timelineEvents = useMemo(
    () => [...userEvents, ...apiEvents, ...derivedEvents].sort((a, b) => new Date(b.at || 0) - new Date(a.at || 0)),
    [userEvents, apiEvents, derivedEvents]
  );

  const filteredTimeline = useMemo(
    () => timelineFilter === "all" ? timelineEvents : timelineEvents.filter((e) => e.type === timelineFilter),
    [timelineEvents, timelineFilter]
  );

  // Documents
  const loadDocs = useCallback(async () => {
    if (!lead?.id) return;
    try {
      const all = (await listLeadDocuments()) || [];
      setLeadDocs(all.filter((d) => String(d.leadId) === String(lead.id)).sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt)));
    } catch { setLeadDocs([]); }
  }, [lead?.id]);

  useEffect(() => { loadDocs(); }, [loadDocs]);

  const saveDoc = async (blob, filename, category) => {
    const id = makeId("doc");
    await addLeadDocument({ id, leadId: String(lead.id), leadName, category, filename, mimeType: blob.type || "application/octet-stream", size: blob.size, uploadedAt: new Date().toISOString(), blob });
    return id;
  };

  const handleUploadFiles = async (fileList) => {
    const files = [...(fileList || [])].filter((f) => {
      if (f.size <= 25 * 1024 * 1024) return true;
      toast.error(`${f.name} is over 25 MB`);
      return false;
    });
    if (!files.length) return;
    try {
      for (const f of files) await saveDoc(f, f.name, uploadCategory);
      addEvent({ type: "system", title: `${files.length} document${files.length === 1 ? "" : "s"} uploaded`, snippet: files.map((f) => f.name).join(", ") });
      toast.success(`${files.length} file${files.length === 1 ? "" : "s"} attached`);
      await loadDocs();
    } catch (err) { toast.error("Upload failed", { description: err.message }); }
  };

  // Voice recording
  const stopRecording = useCallback(() => {
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
  }, []);

  const startRecording = async () => {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      toast.error("This browser can't record audio");
      return;
    }
    let stream;
    try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); }
    catch { toast.error("Microphone access blocked"); return; }
    const chunks = [];
    const recorder = new MediaRecorder(stream);
    recorder.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
    recorder.onstop = async () => {
      stream.getTracks().forEach((t) => t.stop());
      window.clearInterval(timerRef.current);
      setIsRecording(false);
      const secs = Math.max(1, Math.round((Date.now() - startRef.current) / 1000));
      const blob = new Blob(chunks, { type: recorder.mimeType || "audio/webm" });
      if (!blob.size) return toast.error("Nothing was recorded");
      try {
        const ext = (blob.type.split("/")[1] || "webm").split(";")[0];
        const docId = await saveDoc(blob, `Voice_${leadName.replace(/\s+/g, "_")}_${format(new Date(), "yyyyMMdd_HHmm")}.${ext}`, "Voice Note");
        addEvent({ type: "note", title: "Voice note", audioDocId: docId, duration: fmtSec(secs) });
        await loadDocs();
        toast.success(`Voice note saved (${fmtSec(secs)})`);
      } catch (err) { toast.error("Voice note failed", { description: err.message }); }
    };
    recorderRef.current = recorder;
    startRef.current = nowMs();
    setRecordSecs(0);
    recorder.start();
    setIsRecording(true);
    timerRef.current = window.setInterval(() => {
      const elapsed = Math.round((Date.now() - startRef.current) / 1000);
      setRecordSecs(elapsed);
      if (elapsed >= MAX_VOICE_SECONDS && recorder.state === "recording") recorder.stop();
    }, 500);
  };

  useEffect(() => () => {
    window.clearInterval(timerRef.current);
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
  }, []);

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const handleStageChange = useCallback((newStage) => {
    if (newStage === currentStage) return;
    batchUpdateLeads([lead.id], { lead_stage: newStage, last_worked: new Date().toISOString() });
    addEvent({ type: "stage_change", title: `Stage → ${newStage}`, snippet: `From "${currentStage}"` });
    toast.success(`Stage set to "${newStage}"`);
  }, [currentStage, lead, batchUpdateLeads, addEvent]);

  const handleCopy = useCallback((text, label) => {
    if (!text) return toast.error(`No ${label.toLowerCase()} on this lead`);
    navigator.clipboard.writeText(text).then(() => toast.success(`${label} copied`), () => toast.error("Clipboard unavailable"));
  }, []);

  const dndBlocked = Boolean(lead?.dnd_registered);
  const callBlocked = dndBlocked || lead?.call_consent === false;
  const whatsappBlocked = dndBlocked || lead?.whatsapp_consent === false;

  const updateConsent = useCallback((key, value) => {
    const next = {
      dnd_registered: Boolean(lead.dnd_registered),
      call_consent: lead.call_consent !== false,
      whatsapp_consent: lead.whatsapp_consent !== false,
      email_consent: Boolean(lead.email_consent),
      [key]: value,
    };
    batchUpdateLeads([lead.id], next);
    if (isApiMode()) {
      customersApi.updateConsent(lead.id, { dndRegistered: next.dnd_registered, callConsent: next.call_consent, whatsappConsent: next.whatsapp_consent, emailConsent: next.email_consent })
        .catch((err) => toast.error("Consent not saved", { description: err.message }));
    }
    addEvent({ type: "system", title: "Consent updated", snippet: CONSENT_LABELS[key] + (value ? " on" : " off") });
  }, [lead, batchUpdateLeads, addEvent]);

  const handleSaveEdit = useCallback(async (values) => {
    const changed = Object.keys(values).filter((k) => JSON.stringify(values[k] ?? "") !== JSON.stringify(lead[k] ?? ""));
    batchUpdateLeads([lead.id], { ...values, last_updated: new Date().toISOString() });
    if (changed.length) addEvent({ type: "system", title: "Lead updated", snippet: `${changed.length} field${changed.length === 1 ? "" : "s"} changed` });
    setIsEditOpen(false);
    toast.success("Lead updated");
  }, [lead, batchUpdateLeads, addEvent]);

  const handleDeleteLead = useCallback(() => {
    batchDeleteLeads([lead.id]);
    toast.success(`${leadName} deleted`);
    router.push(nextLeadId ? `/leads/active/${nextLeadId}` : "/leads/active");
  }, [leadName, lead, batchDeleteLeads, nextLeadId, router]);

  const handleCallNow = useCallback(() => {
    if (!dialable) return toast.error("No phone number on this lead");
    if (callBlocked) return toast.error(dndBlocked ? "Lead is on DND" : "Lead has not consented to calls");
    window.location.href = `tel:${dialable}`;
    setComposerTab("call");
    toast.info(`Dialing ${leadName}…`);
  }, [dialable, callBlocked, dndBlocked, leadName]);

  const handleWhatsAppSend = useCallback(() => {
    if (!dialable) return toast.error("No phone number on this lead");
    if (whatsappBlocked) return toast.error(dndBlocked ? "Lead is on DND" : "Lead has not consented to WhatsApp");
    window.open(whatsappLink(mobileNumber, whatsappMessage), "_blank", "noopener,noreferrer");
    const tplName = WHATSAPP_TEMPLATES.find((t) => t.id === templateId)?.name || templateId;
    addEvent({ type: "whatsapp", title: `WhatsApp · ${tplName}`, status: "sent", snippet: whatsappMessage });
    batchUpdateLeads([lead.id], { last_engagement_by_us: new Date().toISOString() });
  }, [dialable, whatsappBlocked, dndBlocked, mobileNumber, whatsappMessage, templateId, addEvent, batchUpdateLeads, lead]);

  const openComposer = useCallback((tab) => {
    setComposerTab(tab);
    window.requestAnimationFrame(() => document.getElementById("lead-composer")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }, []);

  const handleSaveCallLog = useCallback((goNext = false) => {
    const disp = DISPOSITIONS.find((d) => d.id === dispositionId);
    if (!disp) return toast.error("Pick a call outcome");
    if (disp.connected && !disp.closesAs && !callNotes.trim()) return toast.error("Add a note about the conversation");
    let cbDate = callbackAt ? new Date(callbackAt) : null;
    if (disp.needsCallback && !cbDate) return toast.error("Set the callback time");
    if (cbDate && cbDate < new Date()) return toast.error("Callback time must be in the future");
    if (!cbDate && !disp.connected && !disp.closesAs) cbDate = new Date(nowMs() + 7200000);
    const now = new Date().toISOString();
    const patch = {
      lead_disposition: disp.disposition,
      last_call_outcome: disp.outcome,
      last_call_direction: "outbound",
      last_called_by: ownerName,
      last_disposition_on: now,
      last_worked: now,
      awaiting_first_touch: "NO",
      attempts: (Number(lead.attempts) || 0) + 1,
      ...(callNotes.trim() ? { last_user_remark: callNotes.trim() } : {}),
      ...(nextAction.trim() ? { next_open_task: nextAction.trim() } : {}),
      ...(cbDate ? { next_followup: cbDate.toISOString() } : {}),
      ...(!disp.connected ? { unanswered_calls: (Number(lead.unanswered_calls) || 0) + 1 } : {}),
    };
    if (disp.closesAs) Object.assign(patch, { lead_stage: disp.closesAs, next_followup: null });
    else if (disp.connected && lifecycle === "New lead") patch.lead_stage = "Contacted";
    const dealCreated = createDeal && disp.id === "interested";
    if (dealCreated) Object.assign(patch, { lead_stage: "Qualified", became_opportunity: now, deal_stage: { stage: "Qualified", progress: 1 } });
    batchUpdateLeads([lead.id], patch);
    addEvent({
      type: "call",
      title: `Outbound · ${disp.label}`,
      transcript: callNotes.trim(),
      snippet: [cbDate && `Callback ${format(cbDate, "EEE dd MMM, hh:mm a")}`, nextAction.trim() && `Next: ${nextAction.trim()}`, dealCreated && "Deal created"].filter(Boolean).join(" · "),
    });
    if (isApiMode() && lead?.id && !String(lead.id).startsWith("lead_") && !String(lead.id).startsWith("manual_")) {
      callsApi.logPersonal({ customerId: lead.id, durationSeconds: 0, callType: "OUTBOUND", notes: callNotes.trim() || disp.label })
        .then((saved) => {
          if (saved?.id) callsApi.disposition({ callId: saved.id, outcome: DISPOSITION_TO_API[dispositionId] || "INTERESTED", stageUpdate: patch.lead_stage ? patch.lead_stage.toUpperCase().replace(/ /g, "_") : null, notes: callNotes.trim(), followUpDate: cbDate ? cbDate.toISOString().slice(0, 10) : null }).catch(() => {});
        }).catch(() => {});
    }
    setCallNotes(""); setCallbackAt(""); setNextAction(""); setCreateDeal(false);
    toast.success(`Logged: ${disp.label}`, { description: dealCreated ? "Moved to Opportunity" : cbDate ? `Follow-up ${format(cbDate, "EEE hh:mm a")}` : undefined });
    if (goNext && nextLeadId) router.push(`/leads/active/${nextLeadId}`);
  }, [dispositionId, callNotes, callbackAt, nextAction, createDeal, lead, ownerName, lifecycle, batchUpdateLeads, addEvent, nextLeadId, router]);

  const handleSaveVisit = useCallback(() => {
    if (!visitNotes.trim()) return toast.error("Add visit notes");
    const when = visitAt ? new Date(visitAt) : new Date();
    if (Number.isNaN(when.getTime())) return toast.error("Pick a valid visit time");
    batchUpdateLeads([lead.id], { last_visit: when.toISOString(), last_visit_outcome: visitOutcome, last_visit_nature: visitType, last_visit_by: ownerName, last_user_remark: visitNotes.trim(), last_worked: new Date().toISOString(), awaiting_first_touch: "NO" });
    addEvent({ type: "visit", title: `Visit · ${visitType} · ${visitOutcome}`, snippet: visitNotes.trim(), at: when.toISOString() });
    if (isApiMode() && lead?.id && !String(lead.id).startsWith("lead_") && !String(lead.id).startsWith("manual_")) {
      remindersApi.create({ customerId: lead.id, title: `${visitType} · ${visitOutcome}`, notes: visitNotes.trim(), dueAt: when.toISOString(), type: "SITE_VISIT" }).catch(() => {});
    }
    setVisitNotes(""); setVisitAt("");
    toast.success("Visit logged");
  }, [visitNotes, visitAt, visitOutcome, visitType, ownerName, lead, batchUpdateLeads, addEvent]);

  const setFollowup = useCallback((targetDate, label) => {
    if (!targetDate || Number.isNaN(targetDate.getTime())) return toast.error("Pick a valid date");
    if (targetDate < new Date()) return toast.error("Follow-up must be in the future");
    batchUpdateLeads([lead.id], { next_followup: targetDate.toISOString(), last_worked: new Date().toISOString() });
    addEvent({ type: "task", title: `Follow-up · ${label}`, snippet: format(targetDate, "dd MMM yyyy, hh:mm a") });
    if (isApiMode() && lead?.id && !String(lead.id).startsWith("lead_") && !String(lead.id).startsWith("manual_")) {
      remindersApi.create({ customerId: lead.id, title: `Follow-up · ${label}`, notes: `Scheduled: ${format(targetDate, "dd MMM yyyy, hh:mm a")}`, dueAt: targetDate.toISOString(), type: "FOLLOW_UP" }).catch(() => {});
    }
    toast.success(`Follow-up set for ${format(targetDate, "EEE dd MMM, hh:mm a")}`);
  }, [lead, batchUpdateLeads, addEvent]);

  const handleCreateTask = useCallback(() => {
    const title = taskTitle.trim();
    if (!title) return toast.error("Give the task a title");
    const due = taskDue ? new Date(taskDue) : null;
    batchUpdateLeads([lead.id], { next_open_task: title, ...(due && due > new Date() ? { next_followup: due.toISOString() } : {}) });
    addEvent({ type: "task", title: "Task created", snippet: due ? `${title} · due ${format(due, "dd MMM, hh:mm a")}` : title });
    if (isApiMode() && lead?.id && !String(lead.id).startsWith("lead_") && !String(lead.id).startsWith("manual_")) {
      remindersApi.create({ customerId: lead.id, title, notes: title, dueAt: due ? due.toISOString() : new Date(Date.now() + 86400000).toISOString(), type: "FOLLOW_UP" }).catch(() => {});
    }
    setTaskTitle(""); setTaskDue("");
    toast.success("Task created");
  }, [taskTitle, taskDue, lead, batchUpdateLeads, addEvent]);

  const handleCompleteTask = useCallback(() => {
    if (!lead.next_open_task) return;
    batchUpdateLeads([lead.id], { last_closed_task: lead.next_open_task, next_open_task: null, last_updated: new Date().toISOString() });
    addEvent({ type: "task", title: "Task completed", snippet: lead.next_open_task });
    toast.success("Task marked done");
  }, [lead, batchUpdateLeads, addEvent]);

  const handleGenerateQuotation = useCallback(() => {
    const popup = window.open("", "_blank", "width=820,height=960");
    if (!popup) return toast.error("Allow pop-ups to generate the quotation");
    popup.document.write(buildQuotationHtml({ lead, leadName, company, location, dealValue, tokenReceived, balancePending, ownerName }));
    popup.document.close();
    popup.focus();
    setTimeout(() => popup.print(), 300);
    addEvent({ type: "system", title: "Quotation generated", snippet: `Est. value ${formatINR(dealValue)}` });
  }, [lead, leadName, company, location, dealValue, tokenReceived, balancePending, ownerName, addEvent]);

  const handleSaveNote = useCallback(() => {
    if (!noteBody.trim()) return toast.error("Write a note first");
    batchUpdateLeads([lead.id], { last_user_remark: noteBody.trim(), last_updated: new Date().toISOString() });
    addEvent({ type: "note", title: noteHeading.trim() || "Note", snippet: noteBody.trim() });
    if (isApiMode() && lead?.id && !String(lead.id).startsWith("lead_") && !String(lead.id).startsWith("manual_")) {
      const content = noteHeading.trim() ? `${noteHeading.trim()}: ${noteBody.trim()}` : noteBody.trim();
      customersApi.addNote(lead.id, content).catch(() => {});
    }
    setNoteBody(""); setNoteHeading("");
    toast.success("Note saved");
  }, [noteBody, noteHeading, lead, batchUpdateLeads, addEvent]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e) => {
      const t = e.target;
      if (!e.shiftKey || e.ctrlKey || e.metaKey || e.altKey) return;
      if (t instanceof HTMLElement && (t.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName))) return;
      const k = e.key.toLowerCase();
      if (k === "p" && prevLeadId) { e.preventDefault(); router.push(`/leads/active/${prevLeadId}`); }
      if (k === "n" && nextLeadId) { e.preventDefault(); router.push(`/leads/active/${nextLeadId}`); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [prevLeadId, nextLeadId, router]);

  // ─── Loading / Not Found ─────────────────────────────────────────────────────

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="mx-auto flex max-w-sm flex-col items-center gap-4 py-24 text-center">
        <SearchX className="h-10 w-10 text-muted-foreground" />
        <div>
          <h1 className="text-sm font-bold">Lead not found</h1>
          <p className="text-xs text-muted-foreground mt-1">It may have been deleted or you may not have access.</p>
        </div>
        <Button asChild size="sm"><Link href="/leads/active">Back to Leads</Link></Button>
      </div>
    );
  }

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-3 pb-12 w-full max-w-[1440px] mx-auto">

      {/* ── Top Bar ── */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-card border border-border rounded-xl shadow-sm">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 min-w-0">
          <Button asChild variant="ghost" size="sm" className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground gap-1">
            <Link href="/leads/active"><ArrowLeft className="h-3.5 w-3.5" />Leads</Link>
          </Button>
          <span className="text-border text-xs">/</span>
          <span className="text-xs font-semibold text-foreground truncate max-w-[180px]">{leadName}</span>
          <Badge variant="outline" className="font-mono text-[9px] px-1.5 py-0 text-muted-foreground hidden sm:inline-flex">
            #{String(lead.id).replace(/\D/g, "").slice(-6) || String(lead.id).slice(-6).toUpperCase()}
          </Badge>
        </div>

        {/* Queue nav */}
        <div className="flex items-center gap-1 rounded-lg border border-border bg-muted/40 px-1 py-0.5">
          <Button variant="ghost" size="sm" disabled={!prevLeadId} onClick={() => prevLeadId && router.push(`/leads/active/${prevLeadId}`)} className="h-6 px-1.5 text-[11px] gap-0.5 disabled:opacity-30" title="Prev (Shift+P)">
            <ChevronLeft className="h-3 w-3" />Prev
          </Button>
          <span className="px-1.5 font-mono text-[10px] text-muted-foreground">
            {queueIndex >= 0 ? `${queueIndex + 1}/${queueTotal}` : "—"}
          </span>
          <Button variant="ghost" size="sm" disabled={!nextLeadId} onClick={() => nextLeadId && router.push(`/leads/active/${nextLeadId}`)} className="h-6 px-1.5 text-[11px] gap-0.5 disabled:opacity-30" title="Next (Shift+N)">
            Next<ChevronRight className="h-3 w-3" />
          </Button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5">
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="sm" onClick={handleCallNow} disabled={!dialable || callBlocked} className="h-8 px-3 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg">
                  <Phone className="h-3.5 w-3.5" />Call
                </Button>
              </TooltipTrigger>
              <TooltipContent>{!dialable ? "No phone number" : callBlocked ? "Blocked by DND" : `Call ${mobileNumber}`}</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Button size="sm" variant="outline" onClick={handleWhatsAppSend} className="h-8 px-3 gap-1.5 text-xs font-medium rounded-lg border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10">
            <MessageCircle className="h-3.5 w-3.5" />WhatsApp
          </Button>

          <Button size="sm" variant="outline" onClick={() => handleCopy(mobileNumber, "Phone")} className="h-8 w-8 p-0 rounded-lg" title="Copy phone">
            <Copy className="h-3.5 w-3.5" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline" className="h-8 px-2.5 gap-1 text-xs rounded-lg">
                More<ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel className="text-[10px] uppercase text-muted-foreground">Log activity</DropdownMenuLabel>
              <DropdownMenuItem onSelect={() => openComposer("call")}><Phone className="mr-2 h-3.5 w-3.5" />Log call</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => openComposer("note")}><StickyNote className="mr-2 h-3.5 w-3.5" />Add note</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => openComposer("visit")}><MapPinned className="mr-2 h-3.5 w-3.5" />Log visit</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => openComposer("task")}><Clock className="mr-2 h-3.5 w-3.5" />Add task</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => fileInputRef.current?.click()}><FileText className="mr-2 h-3.5 w-3.5" />Upload document</DropdownMenuItem>
              <DropdownMenuItem onSelect={handleGenerateQuotation}><Download className="mr-2 h-3.5 w-3.5" />Generate quotation</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => setIsEditOpen(true)}><Pencil className="mr-2 h-3.5 w-3.5" />Edit lead</DropdownMenuItem>
              <PermissionGate action="delete" resource="leads">
                <DropdownMenuItem onSelect={() => setDeleteConfirmOpen(true)} className="text-destructive focus:text-destructive">
                  <Trash2 className="mr-2 h-3.5 w-3.5" />Delete lead
                </DropdownMenuItem>
              </PermissionGate>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* ── Hero Card ── */}
      <Card className="border-border shadow-sm">
        <CardContent className="p-4 space-y-3">
          {/* Identity row */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="relative shrink-0">
                <Avatar className="h-12 w-12 border-2 border-border">
                  <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
                    {leadName.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {priority >= 4 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-amber-500 ring-2 ring-card flex items-center justify-center text-[9px] text-white font-bold" title="High priority">★</span>
                )}
              </div>
              <div className="space-y-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-base font-bold text-foreground tracking-tight">{leadName}</h1>
                  <button type="button" onClick={() => setIsEditOpen(true)} className="p-0.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                    <Pencil className="h-3 w-3" />
                  </button>
                  <Badge variant="outline" className={cn("text-[10.5px] font-semibold border", STAGE_COLORS[currentStage] || "bg-secondary text-secondary-foreground")}>
                    {currentStage}
                  </Badge>
                  <Badge variant="outline" className={cn("text-[10.5px] font-semibold border", LIFECYCLE_STYLES[lifecycle])}>
                    {lifecycle}
                  </Badge>
                  {lead.is_duplicate && <Badge variant="destructive" className="text-[9px] uppercase font-bold">Duplicate</Badge>}
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  {company !== "—" && <span className="flex items-center gap-1 font-medium text-foreground"><Building2 className="h-3 w-3 text-primary" />{company}</span>}
                  {designation !== "—" && <><span className="text-border">·</span><span>{designation}</span></>}
                  {location !== "—" && <><span className="text-border">·</span><span className="flex items-center gap-1"><MapPin className="h-2.5 w-2.5" />{location}</span></>}
                </div>
                {(lead.tags || []).length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {(lead.tags || []).map((tag) => (
                      <span key={tag} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-secondary text-secondary-foreground border border-border/70">
                        <Tag className="h-2 w-2" />{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Stats strip */}
            <div className="flex flex-wrap gap-2 sm:shrink-0">
              <div className="px-3 py-2 rounded-lg border border-border bg-muted/30 min-w-[110px]">
                <p className="text-[9.5px] uppercase font-bold text-muted-foreground tracking-wider">Owner</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Avatar className="h-4 w-4 border border-border">
                    <AvatarFallback className="bg-primary/10 text-primary text-[8px] font-bold">{ownerName.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <span className="text-xs font-semibold text-foreground truncate">{ownerName}</span>
                </div>
              </div>
              <div className="px-3 py-2 rounded-lg border border-border bg-muted/30 min-w-[110px]">
                <p className="text-[9.5px] uppercase font-bold text-muted-foreground tracking-wider">Deal Value</p>
                <p className="text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">{formatINR(dealValue)}</p>
              </div>
              <div className="px-3 py-2 rounded-lg border border-border bg-muted/30 min-w-[120px]">
                <p className="text-[9.5px] uppercase font-bold text-muted-foreground tracking-wider">Follow-up</p>
                {nextFollowupDate ? (
                  <p className={cn("text-xs font-semibold mt-0.5 flex items-center gap-1", isOverdue ? "text-rose-600" : "text-amber-600")}>
                    <Clock className="h-3 w-3" />
                    {isOverdue ? `${formatDistanceToNowStrict(nextFollowupDate)} overdue` : `in ${formatDistanceToNowStrict(nextFollowupDate)}`}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground mt-0.5">Not scheduled</p>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Stage stepper */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-muted-foreground">Pipeline Stage</span>
              <span className="text-[10px] font-mono text-muted-foreground">Step {currentStep} of 6</span>
            </div>
            {/* Progress bar */}
            <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${((currentStep - 1) / 5) * 100}%` }}
              />
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1">
              {PIPELINE_STAGES.map((s) => {
                const isPast = s.step < currentStep;
                const isCurrent = s.step === currentStep;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleStageChange(s.name)}
                    className={cn(
                      "h-7 px-2 rounded-lg border text-[10.5px] font-semibold transition-all flex items-center justify-center gap-1 truncate",
                      isCurrent ? "bg-primary text-primary-foreground border-primary shadow-sm" :
                      isPast ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/25 hover:bg-emerald-500/20" :
                      "bg-muted/30 text-muted-foreground border-border hover:bg-muted/60"
                    )}
                  >
                    {isPast && <Check className="h-3 w-3 shrink-0 text-emerald-600" />}
                    <span className="truncate">{s.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── 3-Column Layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr_280px] gap-3 items-start">

        {/* ── LEFT: Lead Info ── */}
        <div className="space-y-3">

          {/* Contact */}
          <Card className="border-border shadow-sm">
            <CardHeader className="px-4 py-3 pb-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-primary" />Contact
              </h3>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-2">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40 border border-border/60">
                <div>
                  <p className="text-[9.5px] text-muted-foreground uppercase font-mono tracking-wider">Mobile</p>
                  <p className="font-mono font-semibold text-xs text-foreground mt-0.5">{mobileNumber || "—"}</p>
                </div>
                <div className="flex items-center gap-1">
                  <Button size="icon" variant="ghost" onClick={handleCallNow} disabled={!dialable || callBlocked} className="h-7 w-7 text-emerald-600 hover:bg-emerald-500/10" title="Call">
                    <Phone className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => handleCopy(mobileNumber, "Phone")} className="h-7 w-7 text-muted-foreground hover:text-foreground" title="Copy">
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              {email && (
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40 border border-border/60">
                  <div className="min-w-0">
                    <p className="text-[9.5px] text-muted-foreground uppercase font-mono tracking-wider">Email</p>
                    <p className="font-medium text-xs text-foreground truncate mt-0.5">{email}</p>
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => handleCopy(email, "Email")} className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground" title="Copy">
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Details */}
          <Card className="border-border shadow-sm">
            <CardHeader className="px-4 py-3 pb-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-primary" />Details
              </h3>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <InfoRow label="Company" value={company} />
              <InfoRow label="Designation" value={designation} />
              <InfoRow label="City / State" value={location} />
              <InfoRow label="Address" value={address} />
              <InfoRow label="Budget" value={lead.budget_range} />
              <InfoRow label="Interested in" value={lead.preferred_service} />
              <InfoRow label="Property type" value={lead.property_type} />
            </CardContent>
          </Card>

          {/* Attribution */}
          <Card className="border-border shadow-sm">
            <CardHeader className="px-4 py-3 pb-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5 text-primary" />Attribution
              </h3>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <InfoRow label="Source" value={leadSource} />
              <InfoRow label="Campaign" value={lead.source_level_2} />
              <InfoRow label="Segment" value={lead.source_level_3} />
            </CardContent>
          </Card>

          {/* Consent */}
          <Card className="border-border shadow-sm">
            <CardHeader className="px-4 py-3 pb-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                {dndBlocked ? <ShieldAlert className="h-3.5 w-3.5 text-rose-500" /> : <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />}
                Consent & DND
              </h3>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-2">
              {dndBlocked && (
                <p className="text-[10.5px] font-medium text-rose-700 dark:text-rose-300 bg-rose-500/10 rounded-md px-2.5 py-1.5 border border-rose-500/20">
                  On DND — calls and WhatsApp are blocked.
                </p>
              )}
              {Object.entries(CONSENT_LABELS).map(([key, label]) => {
                const checked = key === "dnd_registered" || key === "email_consent" ? Boolean(lead[key]) : lead[key] !== false;
                return (
                  <div key={key} className="flex items-center justify-between gap-2">
                    <Label className={cn("text-xs cursor-pointer", key === "dnd_registered" && checked && "font-semibold text-rose-600")}>{label}</Label>
                    <Switch
                      checked={checked}
                      onCheckedChange={(val) => updateConsent(key, val)}
                      className={cn("scale-75", key === "dnd_registered" && checked && "data-[state=checked]:bg-rose-500")}
                    />
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* ── CENTER: Composer + Timeline ── */}
        <div className="space-y-3">

          {/* Composer */}
          <Card id="lead-composer" className="border-border shadow-sm scroll-mt-3">
            <CardHeader className="px-4 py-3 pb-0">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Activity className="h-3.5 w-3.5 text-primary" />Log Activity
                </h3>
                <span className="text-[10px] text-muted-foreground">Rep: {ownerName}</span>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-3">
              <Tabs value={composerTab} onValueChange={setComposerTab}>
                <TabsList className="grid grid-cols-5 h-8 w-full mb-3">
                  <TabsTrigger value="call" className="text-[11px] gap-1"><Phone className="h-3 w-3" />Call</TabsTrigger>
                  <TabsTrigger value="whatsapp" className="text-[11px] gap-1"><MessageCircle className="h-3 w-3" />WA</TabsTrigger>
                  <TabsTrigger value="note" className="text-[11px] gap-1"><StickyNote className="h-3 w-3" />Note</TabsTrigger>
                  <TabsTrigger value="visit" className="text-[11px] gap-1"><MapPinned className="h-3 w-3" />Visit</TabsTrigger>
                  <TabsTrigger value="task" className="text-[11px] gap-1"><Clock className="h-3 w-3" />Task</TabsTrigger>
                </TabsList>

                {/* Call tab */}
                <TabsContent value="call" className="space-y-3 mt-0">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-muted-foreground">Outcome</span>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <PhoneOutgoing className="h-3 w-3 text-emerald-500" />Attempt #{(Number(lead.attempts) || 0) + 1}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5" role="radiogroup">
                      {DISPOSITIONS.map((d) => (
                        <button
                          key={d.id}
                          type="button"
                          role="radio"
                          aria-checked={dispositionId === d.id}
                          onClick={() => setDispositionId(d.id)}
                          className={cn(
                            "h-7 rounded-full border px-3 text-[11px] font-semibold transition-colors",
                            dispositionId === d.id ? DISPOSITION_TONES[d.tone] : "border-border text-muted-foreground hover:bg-muted"
                          )}
                        >
                          {d.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <Textarea
                    rows={2}
                    value={callNotes}
                    onChange={(e) => setCallNotes(e.target.value)}
                    placeholder="What was discussed: requirement, objection, budget…"
                    className="text-xs resize-none"
                  />
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div className="flex flex-col gap-1">
                      <Label className="text-[10.5px] font-medium text-muted-foreground">
                        {DISPOSITIONS.find((d) => d.id === dispositionId)?.needsCallback ? "Callback time *" : "Callback time"}
                      </Label>
                      <Input type="datetime-local" value={callbackAt} onChange={(e) => setCallbackAt(e.target.value)} className="h-8 text-xs" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label className="text-[10.5px] font-medium text-muted-foreground">Next action</Label>
                      <Input value={nextAction} onChange={(e) => setNextAction(e.target.value)} maxLength={140} placeholder="e.g. Share quotation" className="h-8 text-xs" />
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    {dispositionId === "interested" ? (
                      <label className="flex items-center gap-1.5 text-xs font-medium cursor-pointer">
                        <Switch checked={createDeal} onCheckedChange={setCreateDeal} className="scale-75" />
                        Create deal (move to Opportunity)
                      </label>
                    ) : (
                      <span className="flex items-center gap-1 text-[10.5px] text-muted-foreground">
                        <Zap className="h-3 w-3 text-amber-500" />
                        {DISPOSITIONS.find((d) => d.id === dispositionId)?.closesAs ? "Closes the lead" : "Auto retry in 2h if no time set"}
                      </span>
                    )}
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleSaveCallLog(false)} className="h-8 gap-1.5 text-xs">
                        <Check className="h-3.5 w-3.5" />Save
                      </Button>
                      <Button size="sm" disabled={!nextLeadId} onClick={() => handleSaveCallLog(true)} className="h-8 gap-1.5 text-xs" title="Save & go to next lead">
                        <SkipForward className="h-3.5 w-3.5" />Save & Next
                      </Button>
                    </div>
                  </div>
                </TabsContent>

                {/* WhatsApp tab */}
                <TabsContent value="whatsapp" className="space-y-3 mt-0">
                  <div className="flex flex-col gap-1">
                    <Label className="text-[10.5px] font-medium text-muted-foreground">Template</Label>
                    <Select value={templateId} onValueChange={setTemplateId}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {WHATSAPP_TEMPLATES.map((t) => <SelectItem key={t.id} value={t.id} className="text-xs">{t.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="p-3 rounded-lg bg-emerald-500/8 border border-emerald-500/20 space-y-1">
                    <p className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                      <MessageCircle className="h-3 w-3" />Preview
                    </p>
                    <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap">{whatsappMessage}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground">{mobileNumber || "No number on record"}</span>
                    <Button size="sm" onClick={handleWhatsAppSend} disabled={!dialable || whatsappBlocked} className="h-8 gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white">
                      <Send className="h-3.5 w-3.5" />Send
                    </Button>
                  </div>
                </TabsContent>

                {/* Note tab */}
                <TabsContent value="note" className="space-y-3 mt-0">
                  <Input
                    value={noteHeading}
                    onChange={(e) => setNoteHeading(e.target.value)}
                    maxLength={100}
                    placeholder="Heading (optional)"
                    className="h-8 text-xs font-medium"
                  />
                  <Textarea
                    rows={3}
                    value={noteBody}
                    onChange={(e) => setNoteBody(e.target.value)}
                    placeholder="Internal note, observation, or follow-up detail…"
                    className="text-xs resize-none"
                  />
                  <div className="flex items-center justify-between">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={isRecording ? stopRecording : startRecording}
                      className={cn("h-8 gap-1.5 text-xs", isRecording ? "border-rose-500 text-rose-600 bg-rose-500/10" : "text-muted-foreground")}
                    >
                      {isRecording ? <Square className="h-3.5 w-3.5 fill-rose-500 text-rose-500" /> : <Mic className="h-3.5 w-3.5 text-rose-500" />}
                      {isRecording ? `Stop · ${fmtSec(recordSecs)}` : "Voice Note"}
                      {isRecording && <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-ping" />}
                    </Button>
                    <Button size="sm" onClick={handleSaveNote} className="h-8 gap-1.5 text-xs">
                      Save Note
                    </Button>
                  </div>
                </TabsContent>

                {/* Visit tab */}
                <TabsContent value="visit" className="space-y-3 mt-0">
                  <div className="grid gap-2 sm:grid-cols-3">
                    <div className="flex flex-col gap-1">
                      <Label className="text-[10.5px] font-medium text-muted-foreground">Type</Label>
                      <Select value={visitType} onValueChange={setVisitType}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>{VISIT_TYPES.map((v) => <SelectItem key={v} value={v} className="text-xs">{v}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label className="text-[10.5px] font-medium text-muted-foreground">Outcome</Label>
                      <Select value={visitOutcome} onValueChange={setVisitOutcome}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>{VISIT_OUTCOMES.map((v) => <SelectItem key={v} value={v} className="text-xs">{v}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label className="text-[10.5px] font-medium text-muted-foreground">When</Label>
                      <Input type="datetime-local" value={visitAt} onChange={(e) => setVisitAt(e.target.value)} className="h-8 text-xs" />
                    </div>
                  </div>
                  <Textarea
                    rows={2}
                    value={visitNotes}
                    onChange={(e) => setVisitNotes(e.target.value)}
                    placeholder="Site condition, measurements, who attended, next step…"
                    className="text-xs resize-none"
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-[10.5px] text-muted-foreground">
                      {lead.last_visit ? `Last: ${lead.last_visit_nature || "Visit"} · ${formatWhen(lead.last_visit)}` : "No visits yet"}
                    </span>
                    <Button size="sm" onClick={handleSaveVisit} className="h-8 text-xs">Log Visit</Button>
                  </div>
                </TabsContent>

                {/* Task tab */}
                <TabsContent value="task" className="space-y-3 mt-0">
                  {lead.next_open_task && (
                    <div className="flex items-center justify-between gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2">
                      <span className="text-xs min-w-0 truncate">
                        <span className="font-semibold text-amber-700 dark:text-amber-300">Open: </span>
                        {lead.next_open_task}
                      </span>
                      <Button variant="ghost" size="sm" onClick={handleCompleteTask} className="h-7 shrink-0 gap-1 text-xs text-emerald-700 dark:text-emerald-400">
                        <CheckCircle2 className="h-3.5 w-3.5" />Done
                      </Button>
                    </div>
                  )}
                  <Input
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleCreateTask(); }}
                    placeholder="Task title…"
                    maxLength={160}
                    className="h-8 text-xs"
                  />
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <Label className="text-[10.5px] text-muted-foreground shrink-0">Due</Label>
                      <Input type="datetime-local" value={taskDue} onChange={(e) => setTaskDue(e.target.value)} className="h-8 text-xs" />
                    </div>
                    <Button size="sm" onClick={handleCreateTask} className="h-8 text-xs shrink-0">Create Task</Button>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card className="border-border shadow-sm">
            <CardHeader className="px-4 py-3 pb-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-primary" />Activity Timeline
                </h3>
                <div className="flex items-center gap-0.5">
                  {[
                    { id: "all", label: "All" },
                    { id: "call", label: "Calls" },
                    { id: "note", label: "Notes" },
                    { id: "visit", label: "Visits" },
                    { id: "task", label: "Tasks" },
                  ].map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setTimelineFilter(f.id)}
                      className={cn(
                        "px-2 py-0.5 rounded text-[10px] font-semibold transition-colors",
                        timelineFilter === f.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                      )}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="relative pl-5 space-y-3 before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-px before:bg-border">
                {filteredTimeline.length === 0 && (
                  <p className="py-6 text-center text-xs text-muted-foreground">No activity yet.</p>
                )}
                {filteredTimeline.map((item) => (
                  <div key={item.id} className="relative">
                    <div className={cn(
                      "absolute -left-[22px] top-1.5 h-2.5 w-2.5 rounded-full bg-card border-2",
                      item.type === "call" ? "border-emerald-500" :
                      item.type === "whatsapp" ? "border-sky-500" :
                      item.type === "task" ? "border-amber-500" :
                      item.type === "note" ? "border-purple-500" :
                      item.type === "visit" ? "border-indigo-500" : "border-border"
                    )} />
                    <div className="p-2.5 rounded-lg bg-muted/20 border border-border/50 space-y-1 hover:bg-muted/40 transition-colors">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                          {item.type === "call" && <Phone className="h-3 w-3 text-emerald-600 shrink-0" />}
                          {item.type === "whatsapp" && <MessageCircle className="h-3 w-3 text-sky-600 shrink-0" />}
                          {item.type === "task" && <Clock className="h-3 w-3 text-amber-600 shrink-0" />}
                          {item.type === "stage_change" && <Layers className="h-3 w-3 text-primary shrink-0" />}
                          {item.type === "note" && <StickyNote className="h-3 w-3 text-purple-600 shrink-0" />}
                          {item.type === "visit" && <MapPinned className="h-3 w-3 text-indigo-600 shrink-0" />}
                          {item.type === "system" && <Activity className="h-3 w-3 text-muted-foreground shrink-0" />}
                          {item.title}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono shrink-0">{formatWhen(item.at)}</span>
                      </div>
                      {item.audioDocId && (
                        <AudioClip doc={leadDocs.find((d) => d.id === item.audioDocId)} duration={item.duration} />
                      )}
                      {item.type === "call" && item.transcript && (
                        <p className="text-xs text-muted-foreground italic border-l-2 border-emerald-500/40 pl-2">"{item.transcript}"</p>
                      )}
                      {item.snippet && <p className="text-xs text-muted-foreground">{item.snippet}</p>}
                      {item.caller && item.type === "call" && <p className="text-[10px] text-muted-foreground">by {item.caller}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── RIGHT: Follow-up, Deal, Documents ── */}
        <div className="space-y-3 lg:sticky lg:top-3">

          {/* Follow-up SLA */}
          <Card className="border-border shadow-sm">
            <CardHeader className="px-4 py-3 pb-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-primary" />Follow-up SLA
                </h3>
                {nextFollowupDate && (
                  <Badge variant="outline" className={cn("text-[9px] font-bold", isOverdue ? "border-rose-500/30 text-rose-600 bg-rose-500/10" : "border-amber-500/30 text-amber-600 bg-amber-500/10")}>
                    {isOverdue ? "OVERDUE" : "SCHEDULED"}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-2.5">
              <div className="grid grid-cols-2 gap-1.5">
                {QUICK_FOLLOWUPS.map((opt) => (
                  <Button
                    key={opt.label}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setFollowup(opt.build(), opt.label)}
                    title={format(opt.build(), "EEE dd MMM, hh:mm a")}
                    className="h-8 text-xs font-medium hover:border-primary hover:text-primary"
                  >
                    {opt.label}
                  </Button>
                ))}
              </div>
              <div className="flex items-center gap-1.5">
                <Input
                  type="datetime-local"
                  value={customFollowup}
                  onChange={(e) => setCustomFollowup(e.target.value)}
                  className="h-8 min-w-0 flex-1 text-xs"
                />
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!customFollowup}
                  onClick={() => { setFollowup(new Date(customFollowup), "Custom"); setCustomFollowup(""); }}
                  className="h-8 px-3 text-xs shrink-0"
                >
                  Set
                </Button>
              </div>
              {nextFollowupDate && (
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40 border border-border/60">
                  <div>
                    <p className="text-[9.5px] text-muted-foreground">Scheduled</p>
                    <p className="text-xs font-semibold text-foreground mt-0.5">{format(nextFollowupDate, "dd MMM yyyy, hh:mm a")}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { batchUpdateLeads([lead.id], { next_followup: null }); addEvent({ type: "task", title: "Follow-up cleared" }); toast.success("Follow-up cleared"); }}
                    className="h-7 text-xs text-destructive hover:bg-destructive/10 shrink-0"
                  >
                    Clear
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Deal & Commercials */}
          <Card className="border-border shadow-sm">
            <CardHeader className="px-4 py-3 pb-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <IndianRupee className="h-3.5 w-3.5 text-emerald-600" />Deal & Commercials
              </h3>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-2.5">
              <div className="p-3 rounded-lg bg-emerald-500/8 border border-emerald-500/20">
                <p className="text-[9px] uppercase font-bold text-emerald-800 dark:text-emerald-300 font-mono tracking-wider">
                  Estimated Value
                </p>
                <p className="font-mono font-extrabold text-lg text-emerald-700 dark:text-emerald-300 leading-tight mt-0.5">
                  {formatINR(dealValue)}
                </p>
                <div className="flex items-center justify-between text-[10px] text-emerald-800/70 dark:text-emerald-300/70 mt-1">
                  <span>Advance: {formatINR(tokenReceived)}</span>
                  <span>Balance: {formatINR(balancePending)}</span>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleGenerateQuotation}
                className="w-full h-8 text-xs gap-1.5 font-medium"
              >
                <Download className="h-3.5 w-3.5" />Generate Quotation
              </Button>
            </CardContent>
          </Card>

          {/* Documents */}
          <Card
            className="border-border shadow-sm"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); handleUploadFiles(e.dataTransfer.files); }}
          >
            <CardHeader className="px-4 py-3 pb-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-primary" />Documents
                </h3>
                <Link href="/leads/documents" className="text-[10px] text-muted-foreground hover:text-primary font-mono">
                  {leadDocs.length} file{leadDocs.length !== 1 ? "s" : ""}
                </Link>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-2">
              <div className="space-y-1 max-h-[200px] overflow-y-auto">
                {leadDocs.length === 0 && (
                  <p className="text-xs text-muted-foreground py-2 text-center">Drop files here or upload below.</p>
                )}
                {leadDocs.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between gap-1 p-2 rounded-lg bg-muted/30 border border-border/50 hover:bg-muted/50 transition-colors">
                    <button type="button" onClick={() => setPreviewDoc(doc)} className="min-w-0 text-left flex-1">
                      <p className="text-xs font-medium text-foreground truncate hover:text-primary">{doc.filename}</p>
                      <p className="text-[9.5px] text-muted-foreground">{doc.category || "Other"} · {formatFileSize(doc.size)}</p>
                    </button>
                    <div className="flex items-center shrink-0">
                      <Button type="button" variant="ghost" size="icon" onClick={() => setPreviewDoc(doc)} className="h-6 w-6 text-muted-foreground">
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button type="button" variant="ghost" size="icon" onClick={() => downloadLeadDocument(doc)} className="h-6 w-6 text-muted-foreground">
                        <Download className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-1.5">
                <Select value={uploadCategory} onValueChange={setUploadCategory}>
                  <SelectTrigger className="h-7 text-[10px] w-auto shrink-0 px-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DOCUMENT_CATEGORIES.filter((c) => c !== "Voice Note").map((c) => <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>)}
                  </SelectContent>
                </Select>
                <input ref={fileInputRef} type="file" multiple className="hidden" onChange={(e) => { handleUploadFiles(e.target.files); e.target.value = ""; }} />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 h-7 text-xs gap-1 border-dashed text-muted-foreground hover:text-foreground"
                >
                  <Plus className="h-3 w-3" />Upload
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Dialogs ── */}
      <DocumentPreviewDialog document={previewDoc} onOpenChange={(open) => !open && setPreviewDoc(null)} />
      {isEditOpen && (
        <LeadFormDialog
          key={lead.id}
          open
          lead={lead}
          existingLeads={leads}
          onOpenChange={setIsEditOpen}
          onSubmit={handleSaveEdit}
        />
      )}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {leadName}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the lead and all associated activity. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteLead}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
