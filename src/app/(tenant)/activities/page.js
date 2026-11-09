"use client";

import React, { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Filter,
  ChevronRight,
} from "lucide-react";

const ACTIVITY_TYPES = {
  call: { label: "Call", icon: Phone, color: "text-blue-500", bg: "bg-blue-500/10" },
  visit: { label: "Visit", icon: MapPin, color: "text-purple-500", bg: "bg-purple-500/10" },
  email: { label: "Email", icon: Mail, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  meeting: { label: "Meeting", icon: Calendar, color: "text-amber-500", bg: "bg-amber-500/10" },
  task: { label: "Task", icon: CheckSquare, color: "text-rose-500", bg: "bg-rose-500/10" },
};

const MOCK_ACTIVITIES = [
  { id: "a1", type: "call", title: "Follow-up call", lead: "Aditya Narayan", company: "Apex Tech Logistics", assignee: "Aarav Sharma", dueAt: "Today, 11:00 AM", status: "overdue", outcome: null },
  { id: "a2", type: "meeting", title: "Product demo meeting", lead: "Kavita Nair", company: "Zenith Retail", assignee: "Pooja Deshmukh", dueAt: "Today, 2:30 PM", status: "upcoming", outcome: null },
  { id: "a3", type: "email", title: "Send proposal document", lead: "Rajeshwar Iyer", company: "Trident Engineering", assignee: "Vikram Singhania", dueAt: "Today, 4:00 PM", status: "upcoming", outcome: null },
  { id: "a4", type: "call", title: "Qualification call", lead: "Meera Kulkarni", company: "Sudarshan Healthtech", assignee: "Aarav Sharma", dueAt: "Yesterday, 3:00 PM", status: "done", outcome: "Interested" },
  { id: "a5", type: "visit", title: "Site visit — office renovation", lead: "Harish Patel", company: "Gujarat Solar", assignee: "Pooja Deshmukh", dueAt: "Yesterday, 11:00 AM", status: "done", outcome: "Visited" },
  { id: "a6", type: "task", title: "Update lead qualification form", lead: "Sanjay Singhal", company: "Kisan Agro Export", assignee: "Vikram Singhania", dueAt: "Tomorrow, 10:00 AM", status: "upcoming", outcome: null },
  { id: "a7", type: "call", title: "Closing call", lead: "Dr. Ananya Roy", company: "Dental Care Clinic", assignee: "Aarav Sharma", dueAt: "Tomorrow, 12:00 PM", status: "upcoming", outcome: null },
  { id: "a8", type: "email", title: "Send revised quote", lead: "Vikram Singhania", company: "Singhania Estates", assignee: "Pooja Deshmukh", dueAt: "2 days ago", status: "done", outcome: "Sent" },
];

const STATUS_CONFIG = {
  overdue: { label: "Overdue", variant: "destructive" },
  upcoming: { label: "Upcoming", variant: "outline" },
  done: { label: "Done", variant: "secondary" },
};

const SUMMARY_CARDS = [
  { label: "Due Today", value: "12", icon: Clock, tone: "text-amber-500", bg: "bg-amber-500/10" },
  { label: "Overdue", value: "4", icon: AlertCircle, tone: "text-destructive", bg: "bg-destructive/10" },
  { label: "Completed Today", value: "8", icon: CheckSquare, tone: "text-emerald-500", bg: "bg-emerald-500/10" },
  { label: "Scheduled This Week", value: "31", icon: Calendar, tone: "text-primary", bg: "bg-primary/10" },
];

export default function ActivitiesPage() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = MOCK_ACTIVITIES.filter((a) => {
    const matchSearch =
      !search ||
      a.lead.toLowerCase().includes(search.toLowerCase()) ||
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.company.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "all" || a.type === typeFilter;
    const matchStatus = statusFilter === "all" || a.status === statusFilter;
    return matchSearch && matchType && matchStatus;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Activities"
        subtitle="All tasks, calls, meetings, and follow-ups across your team."
        actions={
          <Button size="sm" className="gap-1.5 text-xs bg-primary text-primary-foreground">
            <Plus className="h-3.5 w-3.5" />
            Log Activity
          </Button>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {SUMMARY_CARDS.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label} className="p-4 border-border bg-card shadow-none flex items-center gap-3">
              <div className={`p-2 rounded-lg ${card.bg} shrink-0`}>
                <Icon className={`h-4 w-4 ${card.tone}`} />
              </div>
              <div>
                <p className="text-xl font-extrabold font-heading text-foreground">{card.value}</p>
                <p className="text-xs text-muted-foreground">{card.label}</p>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search activities..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-xs"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="h-8 w-32 text-xs">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="call">Call</SelectItem>
            <SelectItem value="visit">Visit</SelectItem>
            <SelectItem value="email">Email</SelectItem>
            <SelectItem value="meeting">Meeting</SelectItem>
            <SelectItem value="task">Task</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-8 w-32 text-xs">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
            <SelectItem value="upcoming">Upcoming</SelectItem>
            <SelectItem value="done">Done</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Activities List */}
      <Card className="border-border bg-card shadow-none overflow-hidden">
        <div className="divide-y divide-border">
          {filtered.length === 0 && (
            <div className="py-12 text-center text-sm text-muted-foreground">No activities found.</div>
          )}
          {filtered.map((activity) => {
            const typeConfig = ACTIVITY_TYPES[activity.type];
            const statusConfig = STATUS_CONFIG[activity.status];
            const Icon = typeConfig.icon;
            return (
              <div
                key={activity.id}
                className="flex items-center gap-4 px-5 py-3.5 hover:bg-muted/20 transition-colors group cursor-pointer"
              >
                <div className={`p-2 rounded-lg ${typeConfig.bg} shrink-0`}>
                  <Icon className={`h-4 w-4 ${typeConfig.color}`} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-foreground">{activity.title}</span>
                    <Badge variant={statusConfig.variant} className="text-[10px] h-4 px-1.5">
                      {statusConfig.label}
                    </Badge>
                    {activity.outcome && (
                      <Badge variant="outline" className="text-[10px] h-4 px-1.5 text-emerald-600 border-emerald-300">
                        {activity.outcome}
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    <span className="font-medium text-foreground">{activity.lead}</span>
                    {" · "}{activity.company}
                    {" · "}Assigned to {activity.assignee}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
                  <Clock className="h-3 w-3" />
                  <span>{activity.dueAt}</span>
                </div>

                <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
