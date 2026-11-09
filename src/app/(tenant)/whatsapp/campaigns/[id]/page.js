"use client";

import React, { useMemo, useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft, Megaphone, Send, Eye, MessageCircle, CheckCheck,
  XCircle, Clock, Play, Pause, BarChart2, TrendingUp, FileText,
  Search, Users, Phone, Loader2,
} from "lucide-react";
import { STATUS_CFG, MSG_STATUS_CFG, decodeId } from "../data";
import { whatsappCampaignsApi } from "@/lib/api/whatsapp";
import { isApiMode } from "@/lib/api/client";

function StatCard({ label, value, sub, colorCls, bgCls, icon: Icon }) {
  return (
    <div className="p-4 rounded-xl border border-border bg-card flex items-center gap-3">
      <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${bgCls}`}>
        <Icon className={`h-4 w-4 ${colorCls}`} />
      </div>
      <div className="min-w-0">
        <p className={`text-xl font-bold leading-none ${colorCls}`}>{value}</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">{label}</p>
        {sub && <p className="text-[10px] text-muted-foreground opacity-60">{sub}</p>}
      </div>
    </div>
  );
}

export default function CampaignDetailPage() {
  const { id: encodedId } = useParams();
  const router = useRouter();
  const [contactSearch, setContactSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [campaign, setCampaign] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMsgs, setIsLoadingMsgs] = useState(false);

  const campaignId = useMemo(() => decodeId(encodedId), [encodedId]);

  // Load campaign from API
  useEffect(() => {
    if (!campaignId) return;
    setIsLoading(true);
    const load = async () => {
      try {
        if (isApiMode()) {
          const data = await whatsappCampaignsApi.getById(campaignId);
          const c = data?.data || data;
          setCampaign({
            id: c.id,
            name: c.name || "",
            template: c.templateName || c.template || "",
            templateId: c.templateId || "",
            segment: c.segmentName || c.segment || "All Leads",
            status: (c.status || "draft").toLowerCase(),
            scheduledAt: c.scheduledAt ? new Date(c.scheduledAt).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—",
            sent: c.sentCount || 0,
            delivered: c.deliveredCount || 0,
            read: c.readCount || 0,
            replied: c.repliedCount || 0,
            failed: c.failedCount || 0,
            createdAt: c.createdAt ? new Date(c.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "",
          });
        } else {
          setCampaign(null);
        }
      } catch {
        setCampaign(null);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [campaignId]);

  // Load messages from API
  useEffect(() => {
    if (!campaignId || !isApiMode()) return;
    setIsLoadingMsgs(true);
    whatsappCampaignsApi.getMessages(campaignId, { size: 200 })
      .then((data) => {
        const items = Array.isArray(data) ? data : (data?.content || []);
        setMessages(items.map((m) => ({
          id: m.id,
          name: m.customerName || m.name || "Unknown",
          phone: m.customerPhone || m.phone || "",
          status: (m.status || "sent").toLowerCase(),
          sentAt: m.sentAt ? new Date(m.sentAt).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—",
          deliveredAt: m.deliveredAt ? new Date(m.deliveredAt).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : null,
          readAt: m.readAt ? new Date(m.readAt).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : null,
          repliedAt: m.repliedAt ? new Date(m.repliedAt).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : null,
          reply: m.replyText || null,
          failReason: m.failureReason || null,
        })));
      })
      .catch(() => {})
      .finally(() => setIsLoadingMsgs(false));
  }, [campaignId]);

  const contacts = useMemo(() => messages.filter((c) => {
    const q = contactSearch.toLowerCase();
    const matchSearch = !q || c.name.toLowerCase().includes(q) || c.phone.includes(q);
    const matchStatus = statusFilter === "all" || c.status === statusFilter;
    return matchSearch && matchStatus;
  }), [messages, contactSearch, statusFilter]);

  if (isLoading) {
    return (
      <div className="flex flex-col h-full items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="h-7 w-7 animate-spin opacity-40" />
        <p className="text-sm">Loading campaign...</p>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="flex flex-col h-full items-center justify-center gap-3 text-muted-foreground">
        <Megaphone className="h-10 w-10 opacity-20" />
        <p className="text-sm font-medium">Campaign not found</p>
        <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={() => router.back()}>
          <ArrowLeft className="h-3.5 w-3.5" />Go Back
        </Button>
      </div>
    );
  }

  const sc = STATUS_CFG[campaign.status] ?? STATUS_CFG.draft;
  const delivRate = campaign.sent > 0 ? Math.round((campaign.delivered / campaign.sent) * 100) : 0;
  const readRate  = campaign.sent > 0 ? Math.round((campaign.read / campaign.sent) * 100) : 0;
  const replyRate = campaign.sent > 0 ? Math.round((campaign.replied / campaign.sent) * 100) : 0;
  const failRate  = campaign.sent > 0 ? Math.round((campaign.failed / campaign.sent) * 100) : 0;
  const pending   = Math.max(0, campaign.sent - campaign.delivered - campaign.failed);

  const statusCounts = useMemo(() => {
    const counts = { all: messages.length, replied: 0, read: 0, delivered: 0, sent: 0, failed: 0 };
    messages.forEach((c) => { if (counts[c.status] !== undefined) counts[c.status]++; });
    return counts;
  }, [messages]);

  const handleAction = async (action) => {
    if (!isApiMode()) return;
    try {
      if (action === "start") await whatsappCampaignsApi.start(campaign.id);
      else if (action === "pause") await whatsappCampaignsApi.pause(campaign.id);
      const data = await whatsappCampaignsApi.getById(campaign.id);
      const c = data?.data || data;
      setCampaign((prev) => ({ ...prev, status: (c.status || prev.status).toLowerCase() }));
    } catch {}
  };

  return (
    <div className="flex flex-col h-full min-h-0 bg-background">

      {/* Top Bar */}
      <div className="shrink-0 flex items-center gap-3 px-6 py-3 border-b border-border bg-card">
        <button onClick={() => router.back()}
          className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="h-8 w-8 rounded-lg bg-emerald-500 flex items-center justify-center shrink-0">
          <Megaphone className="h-4 w-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-sm font-bold text-foreground truncate">{campaign.name}</h1>
            <span className={`inline-flex items-center gap-1.5 text-[10px] font-medium px-2 py-1 rounded-full border ${sc.cls}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${sc.dot} ${campaign.status === "running" ? "animate-pulse" : ""}`} />
              {sc.label}
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground">Template: {campaign.template} · Segment: {campaign.segment}</p>
        </div>
        {(campaign.status === "draft" || campaign.status === "scheduled") && (
          <Button size="sm" className="h-8 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shrink-0" onClick={() => handleAction("start")}>
            <Play className="h-3.5 w-3.5" />Send Now
          </Button>
        )}
        {(campaign.status === "running" || campaign.status === "paused") && (
          <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5 shrink-0" onClick={() => handleAction(campaign.status === "running" ? "pause" : "start")}>
            {campaign.status === "running" ? <><Pause className="h-3.5 w-3.5" />Pause</> : <><Play className="h-3.5 w-3.5" />Resume</>}
          </Button>
        )}
      </div>

      {/* Scrollable Body */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto px-6 py-5 space-y-5">

          {/* Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <StatCard label="Sent"      value={campaign.sent.toLocaleString()}      colorCls="text-blue-600"    bgCls="bg-blue-500/10"    icon={Send}          sub={null} />
            <StatCard label="Delivered" value={`${delivRate}%`}                     colorCls="text-emerald-600" bgCls="bg-emerald-500/10" icon={CheckCheck}    sub={campaign.delivered.toLocaleString()} />
            <StatCard label="Read"      value={`${readRate}%`}                      colorCls="text-violet-600"  bgCls="bg-violet-500/10"  icon={Eye}           sub={campaign.read.toLocaleString()} />
            <StatCard label="Replied"   value={`${replyRate}%`}                     colorCls="text-amber-600"   bgCls="bg-amber-500/10"   icon={MessageCircle} sub={campaign.replied.toLocaleString()} />
            <StatCard label="Failed"    value={campaign.failed > 0 ? campaign.failed.toLocaleString() : "0"} colorCls={campaign.failed > 0 ? "text-red-500" : "text-muted-foreground"} bgCls="bg-red-500/10" icon={XCircle} sub={campaign.failed > 0 ? `${failRate}% rate` : null} />
            <StatCard label="Pending"   value={pending.toLocaleString()}             colorCls="text-orange-500"  bgCls="bg-orange-500/10"  icon={Clock}         sub={null} />
          </div>

          {/* Delivery Funnel */}
          {campaign.sent > 0 && (
            <div className="rounded-xl border border-border bg-card p-5 space-y-3">
              <p className="text-xs font-semibold text-foreground flex items-center gap-2">
                <BarChart2 className="h-4 w-4 text-muted-foreground" />Delivery Funnel
              </p>
              <div className="space-y-2.5">
                {[
                  { label: "Sent",      value: campaign.sent,      pct: 100,       color: "bg-blue-500",    textColor: "text-blue-600" },
                  { label: "Delivered", value: campaign.delivered, pct: delivRate, color: "bg-emerald-500", textColor: "text-emerald-600" },
                  { label: "Read",      value: campaign.read,      pct: readRate,  color: "bg-violet-500",  textColor: "text-violet-600" },
                  { label: "Replied",   value: campaign.replied,   pct: replyRate, color: "bg-amber-500",   textColor: "text-amber-600" },
                  { label: "Failed",    value: campaign.failed,    pct: failRate,  color: "bg-red-500",     textColor: "text-red-500" },
                ].map((row) => (
                  <div key={row.label} className="flex items-center gap-3">
                    <span className="text-[11px] text-muted-foreground w-16 shrink-0">{row.label}</span>
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${row.color}`} style={{ width: `${row.pct}%` }} />
                    </div>
                    <div className="flex items-center gap-1.5 w-24 justify-end shrink-0">
                      <span className={`text-[11px] font-semibold ${row.textColor}`}>{row.value.toLocaleString()}</span>
                      <span className="text-[10px] text-muted-foreground">({row.pct}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Message Log Table */}
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border flex-wrap">
              <p className="text-xs font-semibold text-foreground flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                Message Log
                <span className="text-muted-foreground font-normal">({messages.length} recipients)</span>
                {isLoadingMsgs && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-0.5 bg-muted/50 p-0.5 rounded-lg border border-border">
                  {["all", "replied", "read", "delivered", "sent", "failed"].map((s) => (
                    <button key={s} onClick={() => setStatusFilter(s)}
                      className={`px-2 py-1 rounded-md text-[10px] font-medium transition-colors capitalize ${statusFilter === s ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                      {s === "all" ? `All (${statusCounts.all})` : `${s.charAt(0).toUpperCase() + s.slice(1)} (${statusCounts[s] ?? 0})`}
                    </button>
                  ))}
                </div>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" />
                  <Input value={contactSearch} onChange={(e) => setContactSearch(e.target.value)}
                    placeholder="Search name or number..." className="pl-7 h-7 text-xs w-44 bg-background" />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    {["#", "Contact", "Phone", "Status", "Sent At", "Delivered At", "Read At", "Replied At", "Reply", "Fail Reason"].map((h, i) => (
                      <th key={h} className={`px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap ${i === 0 ? "w-10" : ""}`}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {contacts.length === 0 && (
                    <tr>
                      <td colSpan={10} className="px-4 py-10 text-center">
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                          <Users className="h-6 w-6 opacity-25" />
                          <p className="text-xs font-medium">{messages.length === 0 ? "No messages sent yet" : "No contacts match your filter"}</p>
                        </div>
                      </td>
                    </tr>
                  )}
                  {contacts.map((c, idx) => {
                    const ms = MSG_STATUS_CFG[c.status] ?? MSG_STATUS_CFG.sent;
                    return (
                      <tr key={c.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-3 py-3 text-[11px] text-muted-foreground font-mono w-10">{idx + 1}</td>
                        <td className="px-3 py-3 min-w-[140px]">
                          <div className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center shrink-0 text-[10px] font-semibold text-muted-foreground">
                              {c.name.charAt(0)}
                            </div>
                            <span className="text-[12px] font-medium text-foreground whitespace-nowrap">{c.name}</span>
                          </div>
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          <span className="text-[11px] text-muted-foreground font-mono flex items-center gap-1">
                            <Phone className="h-2.5 w-2.5 shrink-0" />{c.phone}
                          </span>
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1.5 text-[10px] font-medium px-2 py-1 rounded-full border ${ms.cls}`}>
                            <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${ms.dot}`} />
                            {ms.label}
                          </span>
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-[11px] text-muted-foreground">{c.sentAt || "—"}</td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          {c.deliveredAt ? <span className="text-[11px] text-emerald-600">{c.deliveredAt}</span> : <span className="text-[11px] text-muted-foreground">—</span>}
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          {c.readAt ? <span className="text-[11px] text-violet-600">{c.readAt}</span> : <span className="text-[11px] text-muted-foreground">—</span>}
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          {c.repliedAt ? <span className="text-[11px] text-amber-600">{c.repliedAt}</span> : <span className="text-[11px] text-muted-foreground">—</span>}
                        </td>
                        <td className="px-3 py-3 min-w-[160px] max-w-[200px]">
                          {c.reply ? <span className="text-[11px] text-foreground italic truncate block max-w-[180px]">"{c.reply}"</span> : <span className="text-[11px] text-muted-foreground">—</span>}
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          {c.failReason ? <span className="text-[11px] text-red-500">{c.failReason}</span> : <span className="text-[11px] text-muted-foreground">—</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="px-4 py-2.5 border-t border-border bg-muted/20 flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">
                Showing {contacts.length} of {messages.length} recipients
              </span>
              <span className="text-[11px] text-muted-foreground">
                {statusCounts.replied} replied · {statusCounts.read} read · {statusCounts.delivered} delivered · {statusCounts.failed} failed
              </span>
            </div>
          </div>

          {campaign.sent === 0 && messages.length === 0 && (
            <div className="rounded-xl border border-dashed border-border bg-muted/20 p-8 flex flex-col items-center gap-3 text-muted-foreground">
              <TrendingUp className="h-8 w-8 opacity-25" />
              <p className="text-sm font-medium">No analytics yet</p>
              <p className="text-xs opacity-60">
                {campaign.status === "scheduled" ? `Scheduled for ${campaign.scheduledAt}` : "Send this campaign to start seeing delivery analytics"}
              </p>
              {(campaign.status === "draft" || campaign.status === "scheduled") && (
                <Button size="sm" className="mt-1 h-8 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => handleAction("start")}>
                  <Play className="h-3.5 w-3.5" />Send Now
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
