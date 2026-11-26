"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Phone,
  MapPin,
  Mail,
  Calendar,
  CheckSquare,
  Clock,
  AlertCircle,
  Plus,
  Search,
  MessageCircle,
  CalendarClock,
  CheckCircle2,
  RotateCw,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { format, formatDistanceToNowStrict, addHours, addDays, setHours, setMinutes } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { followupsApi } from "@/lib/api/followups";
import { customersApi } from "@/lib/api/customers";
import { useCallOutcome } from "@/lib/call-outcome-context";
import { encodeLeadId } from "@/lib/lead-id-codec";

const TYPE_META = {
  CALL: { label: "Call", icon: Phone, color: "text-emerald-600", bg: "bg-emerald-500/10" },
  FOLLOW_UP: { label: "Follow-up", icon: CalendarClock, color: "text-blue-600", bg: "bg-blue-500/10" },
  SITE_VISIT: { label: "Site Visit", icon: MapPin, color: "text-purple-600", bg: "bg-purple-500/10" },
  WHATSAPP: { label: "WhatsApp", icon: MessageCircle, color: "text-emerald-600", bg: "bg-emerald-500/10" },
  EMAIL: { label: "Email", icon: Mail, color: "text-amber-600", bg: "bg-amber-500/10" },
  OTHER: { label: "Task", icon: CheckSquare, color: "text-slate-600", bg: "bg-slate-500/10" },
};

const BUCKET_TABS = [
  { id: "all", label: "All Open & History" },
  { id: "overdue", label: "Overdue" },
  { id: "today", label: "Due Today" },
  { id: "upcoming", label: "Upcoming" },
  { id: "completed", label: "Completed" },
];

export default function ActivitiesPage() {
  const { openCallOutcomeDrawer } = useCallOutcome();

  const [bucket, setBucket] = useState("all");
  const [scope, setScope] = useState("team");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    overdueCount: 0,
    dueTodayCount: 0,
    upcomingCount: 0,
    completedCount: 0,
    items: [],
  });

  // Reschedule modal state
  const [rescheduleTarget, setRescheduleTarget] = useState(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("10:00");
  const [rescheduleNotes, setRescheduleNotes] = useState("");
  const [isSavingAction, setIsSavingAction] = useState(false);

  // Create Follow-up modal state
  const [createOpen, setCreateOpen] = useState(false);
  const [leadOptions, setLeadOptions] = useState([]);
  const [newCustomerId, setNewCustomerId] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState("CALL");
  const [newDate, setNewDate] = useState(() => format(addHours(new Date(), 2), "yyyy-MM-dd"));
  const [newTime, setNewTime] = useState(() => format(addHours(new Date(), 2), "HH:mm"));
  const [newNotes, setNewNotes] = useState("");

  const loadFollowups = useCallback(async () => {
    setLoading(true);
    try {
      const data = await followupsApi.list({ bucket, scope, type: typeFilter, search });
      setSummary({
        overdueCount: data?.overdueCount ?? 0,
        dueTodayCount: data?.dueTodayCount ?? 0,
        upcomingCount: data?.upcomingCount ?? 0,
        completedCount: data?.completedCount ?? 0,
        items: Array.isArray(data?.items) ? data.items : [],
      });
    } catch (err) {
      toast.error("Failed to load follow-ups", { description: err?.message });
    } finally {
      setLoading(false);
    }
  }, [bucket, scope, typeFilter, search]);

  useEffect(() => {
    loadFollowups();
  }, [loadFollowups]);

  useEffect(() => {
    const onUpdated = () => loadFollowups();
    window.addEventListener("smoothsales:lead-updated", onUpdated);
    return () => window.removeEventListener("smoothsales:lead-updated", onUpdated);
  }, [loadFollowups]);

  const openCreateModal = () => {
    setCreateOpen(true);
    if (leadOptions.length === 0) {
      customersApi
        .list({ page: 0, size: 100 })
        .then(({ items }) => setLeadOptions(items || []))
        .catch(() => {});
    }
  };

  const handleOpenReschedule = (item) => {
    const base = item.dueAt ? new Date(item.dueAt) : addHours(new Date(), 2);
    const safe = Number.isNaN(base.getTime()) ? addHours(new Date(), 2) : base;
    setRescheduleTarget(item);
    setRescheduleDate(format(safe, "yyyy-MM-dd"));
    setRescheduleTime(format(safe, "HH:mm"));
    setRescheduleNotes(item.notes || "");
  };

  const applyQuickReschedule = (preset) => {
    let target = addHours(new Date(), 2);
    if (preset === "TOMORROW") target = setMinutes(setHours(addDays(new Date(), 1), 10), 0);
    if (preset === "IN_2_DAYS") target = setMinutes(setHours(addDays(new Date(), 2), 10), 0);
    setRescheduleDate(format(target, "yyyy-MM-dd"));
    setRescheduleTime(format(target, "HH:mm"));
  };

  const handleSaveReschedule = async () => {
    if (!rescheduleTarget || !rescheduleDate) return;
    const d = new Date(`${rescheduleDate}T${rescheduleTime || "10:00"}:00`);
    if (Number.isNaN(d.getTime())) return toast.error("Invalid date or time");
    setIsSavingAction(true);
    try {
      await followupsApi.reschedule(rescheduleTarget.id, {
        dueAt: d.toISOString(),
        notes: rescheduleNotes.trim() || undefined,
      });
      toast.success("Follow-up rescheduled", {
        description: format(d, "EEE, dd MMM · hh:mm a"),
      });
      setRescheduleTarget(null);
      loadFollowups();
    } catch (err) {
      toast.error("Could not reschedule", { description: err?.message });
    } finally {
      setIsSavingAction(false);
    }
  };

  const handleComplete = async (item) => {
    try {
      await followupsApi.complete(item.id);
      toast.success("Follow-up marked complete");
      loadFollowups();
    } catch (err) {
      toast.error("Could not complete follow-up", { description: err?.message });
    }
  };

  const handleCreateFollowup = async () => {
    if (!newTitle.trim()) return toast.error("Enter a follow-up title");
    const d = new Date(`${newDate}T${newTime || "10:00"}:00`);
    if (Number.isNaN(d.getTime())) return toast.error("Pick a valid date and time");
    setIsSavingAction(true);
    try {
      await followupsApi.create({
        customerId: newCustomerId || null,
        title: newTitle.trim(),
        type: newType,
        dueAt: d.toISOString(),
        notes: newNotes.trim() || null,
      });
      toast.success("Follow-up scheduled");
      setCreateOpen(false);
      setNewTitle("");
      setNewNotes("");
      setNewCustomerId("");
      loadFollowups();
    } catch (err) {
      toast.error("Failed to create follow-up", { description: err?.message });
    } finally {
      setIsSavingAction(false);
    }
  };

  const handleCallItem = (item) => {
    if (!item.customerId) return toast.info("No lead linked to this task");
    openCallOutcomeDrawer(
      {
        id: item.customerId,
        lead_name: item.customerName || item.title,
        mobile_number: item.customerPhone || "",
        city: item.customerCity || "",
      },
      {
        dial: true,
        sourceLabel: "Follow-up call",
        onSaved: () => loadFollowups(),
      }
    );
  };

  const summaryCards = [
    { id: "overdue", label: "Overdue", value: summary.overdueCount, icon: AlertCircle, tone: "text-rose-600", bg: "bg-rose-500/10" },
    { id: "today", label: "Due Today", value: summary.dueTodayCount, icon: Clock, tone: "text-amber-600", bg: "bg-amber-500/10" },
    { id: "upcoming", label: "Upcoming", value: summary.upcomingCount, icon: Calendar, tone: "text-primary", bg: "bg-primary/10" },
    { id: "completed", label: "Completed", value: summary.completedCount, icon: CheckCircle2, tone: "text-emerald-600", bg: "bg-emerald-500/10" },
  ];

  return (
    <div className="space-y-5 pb-10">
      <PageHeader
        title="Follow-ups & To-dos"
        subtitle="Track overdue callbacks, today's scheduled calls, and upcoming follow-ups across your pipeline."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={loadFollowups} className="h-8 text-xs gap-1.5">
              <RotateCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
              Refresh
            </Button>
            <Button size="sm" onClick={openCreateModal} className="gap-1.5 h-8 text-xs bg-primary text-primary-foreground">
              <Plus className="h-3.5 w-3.5" />
              Schedule Follow-up
            </Button>
          </div>
        }
      />

      {/* Summary Cards (Click to filter) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          const active = bucket === card.id;
          return (
            <button
              key={card.id}
              type="button"
              onClick={() => setBucket(active ? "all" : card.id)}
              className={cn(
                "text-left p-4 rounded-xl border bg-card flex items-center gap-3 transition-all",
                active ? "border-primary ring-1 ring-primary/30 bg-primary/[0.03]" : "border-border hover:border-primary/40"
              )}
            >
              <div className={cn("p-2.5 rounded-lg shrink-0", card.bg)}>
                <Icon className={cn("h-4 w-4", card.tone)} />
              </div>
              <div>
                <p className="text-xl font-extrabold font-heading text-foreground tabular-nums">
                  {loading ? "—" : card.value}
                </p>
                <p className="text-xs text-muted-foreground">{card.label}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Filters & Bucket Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-1 overflow-x-auto">
          {BUCKET_TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setBucket(t.id)}
              className={cn(
                "px-3 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap",
                bucket === t.id
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-lg border border-border bg-card p-0.5 text-xs">
            {[
              { id: "team", label: "Team" },
              { id: "my", label: "My Follow-ups" },
            ].map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setScope(s.id)}
                className={cn(
                  "px-2.5 py-1 rounded-md font-medium transition-colors",
                  scope === s.id ? "bg-muted text-foreground font-semibold" : "text-muted-foreground"
                )}
              >
                {s.label}
              </button>
            ))}
          </div>

          <div className="relative min-w-[190px]">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search lead, phone, note..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-xs bg-card"
            />
          </div>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="h-8 w-32 text-xs bg-card">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL" className="text-xs">All Types</SelectItem>
              <SelectItem value="CALL" className="text-xs">Calls</SelectItem>
              <SelectItem value="FOLLOW_UP" className="text-xs">Follow-ups</SelectItem>
              <SelectItem value="SITE_VISIT" className="text-xs">Site Visits</SelectItem>
              <SelectItem value="WHATSAPP" className="text-xs">WhatsApp</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* List */}
      <Card className="border-border bg-card shadow-none divide-y divide-border overflow-hidden">
        {loading ? (
          <div className="py-12 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Loading follow-ups...</span>
          </div>
        ) : summary.items.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground space-y-1">
            <p className="font-medium text-foreground">No follow-ups in this view</p>
            <p className="text-xs">Call a lead and log an outcome to schedule automatic follow-ups.</p>
          </div>
        ) : (
          summary.items.map((item) => {
            const meta = TYPE_META[item.type] || TYPE_META.FOLLOW_UP;
            const Icon = meta.icon;
            const due = item.dueAt ? new Date(item.dueAt) : null;
            const isCompleted = item.status === "COMPLETED";
            const isOverdue = !isCompleted && due && due < new Date();

            return (
              <div
                key={item.id}
                className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 px-4 py-3.5 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div className={cn("p-2 rounded-lg shrink-0 mt-0.5", meta.bg)}>
                    <Icon className={cn("h-4 w-4", meta.color)} />
                  </div>
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={cn("text-xs font-bold text-foreground", isCompleted && "line-through text-muted-foreground")}>
                        {item.customerName || item.title}
                      </span>
                      {item.outcomeLabel && (
                        <Badge variant="outline" className="text-[10px] py-0 h-5">
                          {item.outcomeLabel}
                        </Badge>
                      )}
                      {item.customerStage && (
                        <Badge variant="secondary" className="text-[10px] py-0 h-5">
                          {item.customerStage.replace(/_/g, " ")}
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground flex-wrap">
                      {item.customerPhone && <span className="font-mono">{item.customerPhone}</span>}
                      {item.customerCity && <span>· {item.customerCity}</span>}
                      <span>· Owner: <strong className="text-foreground font-medium">{item.userName}</strong></span>
                    </div>

                    {item.notes && (
                      <p className="text-[11.5px] text-muted-foreground italic truncate max-w-xl">
                        &ldquo;{item.notes}&rdquo;
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  {due && (
                    <div className="text-right mr-1">
                      <div
                        className={cn(
                          "text-[11px] font-semibold",
                          isCompleted ? "text-emerald-600" : isOverdue ? "text-rose-600" : "text-foreground"
                        )}
                      >
                        {isCompleted
                          ? "Completed"
                          : isOverdue
                          ? `${formatDistanceToNowStrict(due)} overdue`
                          : `In ${formatDistanceToNowStrict(due)}`}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {format(due, "dd MMM, hh:mm a")}
                      </div>
                    </div>
                  )}

                  {!isCompleted && item.customerId && (
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => handleCallItem(item)}
                      className="h-7 px-2.5 text-[11px] gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      <Phone className="h-3 w-3" />
                      Call
                    </Button>
                  )}

                  {!isCompleted && (
                    <>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenReschedule(item)}
                        className="h-7 px-2.5 text-[11px]"
                      >
                        Reschedule
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleComplete(item)}
                        className="h-7 px-2.5 text-[11px] text-emerald-700 hover:text-emerald-800"
                      >
                        Done
                      </Button>
                    </>
                  )}

                  {item.customerId && (
                    <Button asChild variant="ghost" size="icon" className="h-7 w-7" title="Open Lead">
                      <Link href={`/leads/active/${encodeLeadId(item.customerId)}`}>
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </Card>

      {/* Reschedule Dialog */}
      <Dialog open={Boolean(rescheduleTarget)} onOpenChange={(o) => !o && setRescheduleTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Reschedule Follow-up</DialogTitle>
            <DialogDescription className="text-xs">
              {rescheduleTarget?.customerName || rescheduleTarget?.title}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <div className="flex flex-wrap gap-1.5">
              {[
                ["IN_2_HOURS", "In 2 Hours"],
                ["TOMORROW", "Tomorrow 10 AM"],
                ["IN_2_DAYS", "In 2 Days"],
              ].map(([key, label]) => (
                <Button
                  key={key}
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => applyQuickReschedule(key)}
                  className="h-7 text-xs rounded-full"
                >
                  {label}
                </Button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <Label className="text-xs">Date</Label>
                <Input type="date" value={rescheduleDate} onChange={(e) => setRescheduleDate(e.target.value)} className="h-8 text-xs" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Time</Label>
                <Input type="time" value={rescheduleTime} onChange={(e) => setRescheduleTime(e.target.value)} className="h-8 text-xs" />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Notes</Label>
              <Textarea
                value={rescheduleNotes}
                onChange={(e) => setRescheduleNotes(e.target.value)}
                placeholder="Reason or agenda for follow-up..."
                className="text-xs h-16"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setRescheduleTarget(null)} className="h-8 text-xs">
              Cancel
            </Button>
            <Button size="sm" onClick={handleSaveReschedule} disabled={isSavingAction} className="h-8 text-xs bg-primary text-primary-foreground">
              {isSavingAction && <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />}
              Save Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Schedule New Follow-up Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Schedule Follow-up</DialogTitle>
            <DialogDescription className="text-xs">
              Create a call, site visit, or task reminder linked to any lead.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <div className="space-y-1">
              <Label className="text-xs">Lead (Optional)</Label>
              <Select value={newCustomerId} onValueChange={setNewCustomerId}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Select a lead..." />
                </SelectTrigger>
                <SelectContent>
                  {leadOptions.map((c) => (
                    <SelectItem key={c.id} value={c.id} className="text-xs">
                      {c.fullName || `${c.firstName} ${c.lastName || ""}`} {c.phone ? `(${c.phone})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <Label className="text-xs">Type</Label>
                <Select value={newType} onValueChange={setNewType}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CALL" className="text-xs">Call</SelectItem>
                    <SelectItem value="FOLLOW_UP" className="text-xs">Follow-up</SelectItem>
                    <SelectItem value="SITE_VISIT" className="text-xs">Site Visit</SelectItem>
                    <SelectItem value="WHATSAPP" className="text-xs">WhatsApp</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Title</Label>
                <Input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Callback for quote"
                  className="h-8 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <Label className="text-xs">Date</Label>
                <Input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} className="h-8 text-xs" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Time</Label>
                <Input type="time" value={newTime} onChange={(e) => setNewTime(e.target.value)} className="h-8 text-xs" />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Notes</Label>
              <Textarea
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                placeholder="Context or talking points..."
                className="text-xs h-16"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setCreateOpen(false)} className="h-8 text-xs">
              Cancel
            </Button>
            <Button size="sm" onClick={handleCreateFollowup} disabled={isSavingAction} className="h-8 text-xs bg-primary text-primary-foreground">
              {isSavingAction && <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />}
              Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
