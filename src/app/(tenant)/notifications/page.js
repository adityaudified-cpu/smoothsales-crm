"use client";

import React, { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Phone,
  AlertCircle,
  CheckCircle2,
  UserPlus,
  GitBranch,
  Bell,
  BellOff,
  Check,
} from "lucide-react";

const NOTIFICATION_ICONS = {
  lead: { icon: UserPlus, color: "text-blue-500", bg: "bg-blue-500/10" },
  overdue: { icon: AlertCircle, color: "text-destructive", bg: "bg-destructive/10" },
  deal: { icon: GitBranch, color: "text-purple-500", bg: "bg-purple-500/10" },
  call: { icon: Phone, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  system: { icon: Bell, color: "text-amber-500", bg: "bg-amber-500/10" },
};

const MOCK_NOTIFICATIONS = [
  { id: "n1", type: "lead", title: "New lead assigned to you", desc: "Aditya Narayan from Apex Tech Logistics has been assigned to you via round-robin.", time: "2 min ago", unread: true },
  { id: "n2", type: "overdue", title: "Follow-up overdue", desc: "Meera Kulkarni — follow-up was due 3 hours ago. Please log a disposition.", time: "1 hour ago", unread: true },
  { id: "n3", type: "deal", title: "Deal moved to Proposal Sent", desc: "Kavita Nair (Zenith Retail) — deal stage updated by Pooja Deshmukh.", time: "2 hours ago", unread: false },
  { id: "n4", type: "call", title: "Call logged — Interested", desc: "Aarav Sharma logged a call for Rajeshwar Iyer. Outcome: Interested.", time: "3 hours ago", unread: false },
  { id: "n5", type: "lead", title: "New inbound lead via Meta Ads", desc: "Harish Patel from Gujarat Solar submitted a form. Auto-assigned to Vikram.", time: "4 hours ago", unread: false },
  { id: "n6", type: "system", title: "Trial expires in 7 days", desc: "Your 14-day free trial ends on Oct 15. Upgrade to keep all features.", time: "Yesterday", unread: false },
  { id: "n7", type: "deal", title: "Deal closed — Won!", desc: "Vikram Singhania (Singhania Estates) — ₹35L deal marked as Closed Won.", time: "Yesterday", unread: false },
  { id: "n8", type: "overdue", title: "TAT violation detected", desc: "Sanjay Singhal — lead unworked for 48 hours. SLA breach.", time: "2 days ago", unread: false },
];

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const [filter, setFilter] = useState("all");

  const markAllRead = () => setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  const markRead = (id) => setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, unread: false } : n));

  const filtered = filter === "unread" ? notifications.filter((n) => n.unread) : notifications;
  const unreadCount = notifications.filter((n) => n.unread).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        subtitle="Real-time alerts, reminders, and system updates."
        actions={
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={markAllRead}>
                <Check className="h-3.5 w-3.5" />
                Mark all read
              </Button>
            )}
          </div>
        }
      />

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 border-b border-border">
        {[
          { key: "all", label: "All" },
          { key: "unread", label: `Unread${unreadCount > 0 ? ` (${unreadCount})` : ""}` },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-4 py-2 text-xs font-semibold border-b-2 -mb-px transition-colors ${
              filter === tab.key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <Card className="border-border bg-card shadow-none overflow-hidden">
        <div className="divide-y divide-border">
          {filtered.length === 0 && (
            <div className="py-16 flex flex-col items-center gap-3 text-muted-foreground">
              <BellOff className="h-8 w-8 opacity-40" />
              <p className="text-sm">No notifications</p>
            </div>
          )}
          {filtered.map((n) => {
            const config = NOTIFICATION_ICONS[n.type];
            const Icon = config.icon;
            return (
              <div
                key={n.id}
                className={`flex items-start gap-4 px-5 py-4 transition-colors cursor-pointer group ${
                  n.unread ? "bg-primary/[0.02] hover:bg-primary/[0.04]" : "hover:bg-muted/20"
                }`}
                onClick={() => markRead(n.id)}
              >
                <div className={`p-2 rounded-lg ${config.bg} shrink-0 mt-0.5`}>
                  <Icon className={`h-4 w-4 ${config.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-xs font-semibold ${n.unread ? "text-foreground" : "text-muted-foreground"}`}>
                      {n.unread && <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary mr-1.5 mb-0.5" />}
                      {n.title}
                    </p>
                    <span className="text-[11px] text-muted-foreground shrink-0">{n.time}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{n.desc}</p>
                </div>
                {n.unread && (
                  <button
                    onClick={(e) => { e.stopPropagation(); markRead(n.id); }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground shrink-0"
                    title="Mark as read"
                  >
                    <Check className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
