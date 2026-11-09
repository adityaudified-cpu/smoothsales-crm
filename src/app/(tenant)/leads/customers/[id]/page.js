"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Phone,
  MessageCircle,
  Mail,
  Building2,
  MapPin,
  Copy,
  Clock,
  Globe,
  IndianRupee,
  FileText,
  Activity,
  ChevronLeft,
  ChevronRight,
  StickyNote,
  CheckCircle2,
  AlertCircle,
  RotateCw,
  Plus,
  Send,
  Check,
} from "lucide-react";
import { format, formatDistanceToNowStrict, parseISO, isValid } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { customersApi, remindersApi } from "@/lib/api/customers";

const STATUS_CFG = {
  ACTIVE:   { label: "Active",   cls: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30" },
  AT_RISK:  { label: "At Risk",  cls: "bg-amber-500/10 text-amber-600 border-amber-500/30" },
  CHURNED:  { label: "Churned",  cls: "bg-rose-500/10 text-rose-600 border-rose-500/30" },
  INACTIVE: { label: "Inactive", cls: "bg-muted text-muted-foreground border-border" },
};

function formatINR(val) {
  if (!val || isNaN(val)) return "—";
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(val));
}

function formatWhen(isoString) {
  if (!isoString) return "—";
  try {
    const d = typeof isoString === "string" ? parseISO(isoString) : new Date(isoString);
    if (!isValid(d)) return "—";
    return Math.abs(Date.now() - d.getTime()) < 60000 ? "Just now" : formatDistanceToNowStrict(d, { addSuffix: true });
  } catch { return "—"; }
}

function getInitials(name = "") {
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase() || "??";
}

const TIMELINE_ICON = {
  call: Phone,
  whatsapp: MessageCircle,
  note: StickyNote,
  task: Clock,
  stage_change: Activity,
  system: Activity,
};

const TIMELINE_COLOR = {
  call: "border-emerald-500",
  whatsapp: "border-sky-500",
  note: "border-purple-500",
  task: "border-amber-500",
  stage_change: "border-primary",
  system: "border-border",
};

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const customerId = String(params?.id || "");

  const [customer, setCustomer] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [noteText, setNoteText] = useState("");
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [timelineFilter, setTimelineFilter] = useState("all");

  // Map ActivityLog.ActivityType enum → { type, title } for the timeline
  const normalizeTimelineItem = (item) => {
    const raw = (item.activityType || item.type || "").toString();
    const TYPE_MAP = {
      CALL_MADE: { type: "call", title: "Outbound call" },
      CALL_RECEIVED: { type: "call", title: "Inbound call" },
      CALL_MISSED: { type: "call", title: "Missed call" },
      DISPOSITION_SUBMITTED: { type: "call", title: "Call disposition logged" },
      WHATSAPP_SENT: { type: "whatsapp", title: "WhatsApp sent" },
      WHATSAPP_RECEIVED: { type: "whatsapp", title: "WhatsApp received" },
      NOTE_ADDED: { type: "note", title: "Note added" },
      REMINDER_SET: { type: "task", title: "Reminder set" },
      REMINDER_COMPLETED: { type: "task", title: "Reminder completed" },
      STAGE_CHANGED: { type: "stage_change", title: "Stage changed" },
      LEAD_CREATED: { type: "system", title: "Lead created" },
      LEAD_UPDATED: { type: "system", title: "Lead updated" },
      ASSIGNMENT_CHANGED: { type: "system", title: "Assigned" },
      CONSENT_UPDATED: { type: "system", title: "Consent updated" },
      DOCUMENT_UPLOADED: { type: "system", title: "Document uploaded" },
      DOCUMENT_SHARED: { type: "system", title: "Document shared" },
      EMAIL_SENT: { type: "system", title: "Email sent" },
    };
    const mapped = TYPE_MAP[raw] || { type: "system", title: raw.replace(/_/g, " ").toLowerCase().replace(/^./, (c) => c.toUpperCase()) };
    return {
      ...item,
      type: mapped.type,
      title: item.title || mapped.title,
      snippet: item.snippet || item.description || "",
      at: item.at || item.createdAt,
      performedBy: item.performedByName || item.performedBy || "",
    };
  };

  const loadCustomer = useCallback(async () => {
    if (!customerId) return;
    setIsLoading(true);
    try {
      const [data, tl] = await Promise.allSettled([
        customersApi.get(customerId),
        customersApi.timeline(customerId, { size: 50 }),
      ]);
      if (data.status === "fulfilled") {
        const c = data.value;
        // Normalize CustomerResponse fields for display
        setCustomer({
          ...c,
          fullName: c.fullName || [c.firstName, c.lastName].filter(Boolean).join(" ") || "Unknown",
          company: c.company || "",
          city: c.preferredLocation || "",
          status: c.status === "FRESH" || c.status === "SHUFFLED" || c.status === "LEAD" ? "ACTIVE" : (c.status || "ACTIVE"),
          tier: c.priority === "HIGH" ? "Enterprise" : c.priority === "MEDIUM" ? "Mid-Market" : "SMB",
          totalRevenue: c.totalValue || 0,
          totalDeals: c.totalCalls || 0,
          assignedTo: c.assignedStaffName ? { name: c.assignedStaffName } : null,
          source: c.sourceDetail || c.source || "",
        });
      }
      if (tl.status === "fulfilled") {
        const items = Array.isArray(tl.value) ? tl.value : (tl.value?.items || []);
        setTimeline(items.map(normalizeTimelineItem));
      }
    } catch {
      toast.error("Could not load customer");
    } finally {
      setIsLoading(false);
    }
  }, [customerId]);

  useEffect(() => { loadCustomer(); }, [loadCustomer]);

  const handleCopy = (text, label) => {
    if (!text) return toast.error(`No ${label}`);
    navigator.clipboard.writeText(text).then(() => toast.success(`Copied ${label}`), () => toast.error("Clipboard unavailable"));
  };

  const handleCall = () => {
    const phone = (customer?.phone || "").replace(/[^\d+]/g, "");
    if (!phone) return toast.error("No phone number");
    window.location.href = `tel:${phone}`;
    toast.info(`Dialing ${customer?.fullName || customer?.name}...`);
  };

  const handleWhatsApp = () => {
    const phone = (customer?.phone || "").replace(/\D/g, "");
    if (!phone) return toast.error("No phone number");
    window.open(`https://wa.me/${phone}`, "_blank", "noopener,noreferrer");
  };

  const handleSaveNote = async () => {
    if (!noteText.trim()) return toast.error("Write a note first");
    setIsSavingNote(true);
    try {
      await customersApi.addNote(customerId, noteText.trim());
      setNoteText("");
      toast.success("Note saved");
      loadCustomer();
    } catch {
      // Optimistic local add if API fails
      setTimeline((prev) => [{ id: `local_${Date.now()}`, type: "note", title: "Note", snippet: noteText.trim(), createdAt: new Date().toISOString() }, ...prev]);
      setNoteText("");
      toast.success("Note saved locally");
    } finally {
      setIsSavingNote(false);
    }
  };

  const filteredTimeline = useMemo(() => {
    if (timelineFilter === "all") return timeline;
    return timeline.filter((ev) => (ev.type || ev.activityType || "").toLowerCase() === timelineFilter);
  }, [timeline, timelineFilter]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-2">
          <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-muted-foreground">Loading customer...</span>
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="flex flex-col items-center gap-3 py-20 text-center">
        <AlertCircle className="h-10 w-10 text-muted-foreground" />
        <h1 className="text-base font-bold">Customer not found</h1>
        <p className="text-xs text-muted-foreground">This customer may have been deleted or you may not have access.</p>
        <Button asChild size="sm" className="h-8 text-xs"><Link href="/leads/customers">Back to Customers</Link></Button>
      </div>
    );
  }

  const name = customer.fullName || customer.name || "Unknown";
  const company = customer.businessName || customer.company || "—";
  const phone = customer.phone || "";
  const email = customer.email || "";
  const city = customer.city || "";
  const statusKey = customer.status || "INACTIVE";
  const sc = STATUS_CFG[statusKey] || STATUS_CFG.INACTIVE;
  const revenue = customer.totalRevenue ?? customer.totalValue ?? 0;
  const ownerName = customer.assignedTo?.name || "Unassigned";

  return (
    <div className="flex flex-col gap-2.5 pb-12 w-full max-w-[1400px] mx-auto">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 bg-card/90 backdrop-blur-sm border border-border/70 rounded-xl shadow-2xs">
        <div className="flex items-center gap-1.5 text-xs">
          <Link href="/leads/customers" className="inline-flex items-center gap-1 font-semibold text-muted-foreground hover:text-foreground px-1.5 py-0.5 rounded hover:bg-muted">
            <ArrowLeft className="h-3 w-3" />
            <span>Customers</span>
          </Link>
          <span className="text-border">/</span>
          <span className="font-bold text-foreground truncate max-w-[200px]">{name}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Button size="sm" onClick={handleCall} disabled={!phone} className="h-7 text-xs px-2.5 gap-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg">
            <Phone className="h-3 w-3" /><span>Call</span>
          </Button>
          <Button size="sm" variant="outline" onClick={handleWhatsApp} disabled={!phone} className="h-7 text-xs px-2.5 gap-1 border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10 font-medium rounded-lg">
            <MessageCircle className="h-3 w-3" /><span>WhatsApp</span>
          </Button>
          <Button size="sm" variant="outline" onClick={() => handleCopy(phone, "Phone")} disabled={!phone} className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground rounded-lg" title="Copy phone">
            <Copy className="h-3 w-3" />
          </Button>
          <Button size="sm" variant="outline" onClick={loadCustomer} className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground rounded-lg" title="Refresh">
            <RotateCw className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Hero Card */}
      <Card className="p-3.5 bg-card border border-border/70 rounded-xl shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-11 w-11 text-xs font-bold border border-border">
              <AvatarFallback className="bg-primary/10 text-primary">{getInitials(name)}</AvatarFallback>
            </Avatar>
            <div className="space-y-0.5">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-heading font-extrabold text-base text-foreground tracking-tight">{name}</h1>
                <span className={cn("px-2 py-0.5 rounded-full text-[10.5px] font-semibold border", sc.cls)}>{sc.label}</span>
                {customer.tier && (
                  <Badge variant="outline" className="text-[10px] font-semibold">{customer.tier}</Badge>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
                <span className="font-medium text-foreground flex items-center gap-1"><Building2 className="h-3 w-3 text-primary" />{company}</span>
                {customer.designation && <><span>•</span><span>{customer.designation}</span></>}
                {city && <><span>•</span><span className="flex items-center gap-1"><MapPin className="h-2.5 w-2.5" />{city}</span></>}
              </div>
            </div>
          </div>

          {/* KPI Strip */}
          <div className="flex flex-wrap items-center gap-2 border-t lg:border-t-0 lg:border-l border-border/60 pt-2 lg:pt-0 lg:pl-4">
            {[
              { label: "Total Revenue", value: formatINR(revenue), color: "text-emerald-600" },
              { label: "Total Deals", value: String(customer.totalDeals ?? customer.deals ?? 0), color: "text-primary" },
              { label: "Owner", value: ownerName, color: "text-foreground" },
              { label: "Source", value: customer.source || "—", color: "text-foreground" },
            ].map((kpi) => (
              <div key={kpi.label} className="px-2.5 py-1.5 bg-muted/40 rounded-lg border border-border/60 space-y-0.5 min-w-[100px]">
                <div className="text-[9.5px] uppercase font-bold text-muted-foreground tracking-wider leading-none">{kpi.label}</div>
                <div className={cn("font-bold text-[12px] leading-tight", kpi.color)}>{kpi.value}</div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-2.5 items-start">
        {/* LEFT: Contact Info */}
        <div className="space-y-2.5">
          <Card className="p-3 bg-card border border-border/70 rounded-xl space-y-2 shadow-2xs">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Phone className="h-3 w-3 text-primary" /><span>Contact Info</span>
            </h3>
            {[
              { label: "Mobile", value: phone, icon: Phone, action: () => handleCopy(phone, "Phone") },
              { label: "Email", value: email, icon: Mail, action: () => handleCopy(email, "Email") },
              { label: "City", value: city, icon: MapPin, action: null },
              { label: "Website", value: customer.website || "—", icon: Globe, action: null },
            ].map((row) => (
              <div key={row.label} className="p-2 rounded-lg bg-muted/40 border border-border/70 flex items-center justify-between">
                <div>
                  <div className="text-[9.5px] text-muted-foreground uppercase font-mono">{row.label}</div>
                  <div className="font-semibold text-foreground text-[11px] truncate max-w-[180px]">{row.value || "—"}</div>
                </div>
                {row.action && row.value && (
                  <Button size="icon" variant="ghost" onClick={row.action} className="h-6 w-6 text-muted-foreground hover:text-foreground">
                    <Copy className="h-3 w-3" />
                  </Button>
                )}
              </div>
            ))}
          </Card>

          <Card className="p-3 bg-card border border-border/70 rounded-xl space-y-1.5 shadow-2xs text-[11.5px]">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 mb-1">
              <IndianRupee className="h-3 w-3 text-emerald-600" /><span>Financials</span>
            </h3>
            {[
              { label: "Total Revenue", value: formatINR(revenue) },
              { label: "Total Deals", value: String(customer.totalDeals ?? customer.deals ?? 0) },
              { label: "Tier", value: customer.tier || "—" },
              { label: "Source", value: customer.source || "—" },
            ].map((row) => (
              <div key={row.label} className="flex justify-between py-1 border-b border-border/40 last:border-0">
                <span className="text-muted-foreground">{row.label}:</span>
                <span className="font-semibold text-foreground">{row.value}</span>
              </div>
            ))}
          </Card>
        </div>

        {/* RIGHT: Timeline + Note Composer */}
        <div className="space-y-2.5">
          {/* Note Composer */}
          <Card className="p-3 bg-card border border-border/70 rounded-xl shadow-2xs space-y-2">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
              <StickyNote className="h-3 w-3 text-primary" /><span>Add Note</span>
            </h3>
            <textarea
              rows={2}
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Internal note, follow-up context, or meeting summary..."
              className="w-full text-xs rounded border border-input bg-background p-2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary leading-normal"
            />
            <div className="flex justify-end">
              <Button size="sm" onClick={handleSaveNote} disabled={isSavingNote || !noteText.trim()} className="h-7 text-xs px-3 bg-primary text-primary-foreground font-semibold rounded-lg gap-1">
                {isSavingNote ? <RotateCw className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                <span>Save Note</span>
              </Button>
            </div>
          </Card>

          {/* Activity Timeline */}
          <Card className="p-3 bg-card border border-border/70 rounded-xl shadow-2xs space-y-2.5">
            <div className="flex items-center justify-between border-b border-border/60 pb-2">
              <div className="flex items-center gap-1.5">
                <Activity className="h-3.5 w-3.5 text-primary" />
                <h3 className="font-heading font-extrabold text-xs text-foreground">Activity Timeline</h3>
              </div>
              <div className="flex items-center gap-0.5">
                {["all", "call", "note", "task", "whatsapp"].map((f) => (
                  <button key={f} type="button" onClick={() => setTimelineFilter(f)}
                    className={cn("px-1.5 py-0.5 rounded text-[10px] font-semibold transition-colors capitalize",
                      timelineFilter === f ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                    )}>
                    {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1) + "s"}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative pl-5 space-y-2.5 before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-[2px] before:bg-border/60">
              {filteredTimeline.length === 0 ? (
                <p className="py-6 text-center text-[11px] text-muted-foreground">No activity yet.</p>
              ) : (
                filteredTimeline.map((item) => {
                  const type = (item.type || item.activityType || "system").toLowerCase();
                  const Icon = TIMELINE_ICON[type] || Activity;
                  const dotColor = TIMELINE_COLOR[type] || "border-border";
                  const title = item.title || item.activityType || "Activity";
                  const snippet = item.snippet || item.description || item.content || "";
                  const at = item.at || item.createdAt || item.activityDate;
                  return (
                    <div key={item.id} className="relative">
                      <div className={cn("absolute -left-[24px] top-1.5 h-2.5 w-2.5 rounded-full bg-card border-2 shadow-2xs", dotColor)} />
                      <div className="p-2.5 rounded-lg bg-muted/25 border border-border/60 space-y-1 hover:bg-muted/40 transition-colors">
                        <div className="flex items-center justify-between gap-1.5">
                          <span className="font-bold text-[11px] text-foreground flex items-center gap-1">
                            <Icon className="h-3 w-3 text-muted-foreground" />
                            <span>{title}</span>
                          </span>
                          <span className="text-[10px] text-muted-foreground font-mono shrink-0">{formatWhen(at)}</span>
                        </div>
                        {snippet && <p className="text-[11px] text-muted-foreground leading-normal">{snippet}</p>}
                        {item.performedBy && <p className="text-[10px] text-muted-foreground">by {item.performedBy}</p>}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
