"use client";

import React, { useState } from "react";
import { 
  Phone, 
  PhoneCall, 
  PhoneIncoming, 
  PhoneOutgoing, 
  PhoneMissed, 
  Clock, 
  Play, 
  User, 
  CheckCircle2, 
  XCircle, 
  Search, 
  Filter, 
  Download,
  Flame,
  ShieldAlert
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CALLER_SCORECARD_DATA } from "@/lib/mock-data/caller-scorecard";

const MOCK_CALL_LOGS = [
  {
    id: "CALL-8821",
    contact: "Aarav Sharma",
    company: "Apex Global Realty",
    phone: "+91 98201 44552",
    rep: "Rohan Verma",
    direction: "outgoing",
    duration: "4m 32s",
    outcome: "Interested - Site Visit Scheduled",
    status: "connected",
    time: "Today, 11:24 AM",
    recording: true,
  },
  {
    id: "CALL-8820",
    contact: "Priya Nair",
    company: "EduSphere Academics",
    phone: "+91 98450 12398",
    rep: "Neha Gupta",
    direction: "incoming",
    duration: "6m 15s",
    outcome: "Demo Scheduled",
    status: "connected",
    time: "Today, 10:45 AM",
    recording: true,
  },
  {
    id: "CALL-8819",
    contact: "Vikram Rathore",
    company: "Studio Craft Interiors",
    phone: "+91 99100 87654",
    rep: "Rohan Verma",
    direction: "outgoing",
    duration: "0m 45s",
    outcome: "Busy - Callback Requested",
    status: "busy",
    time: "Today, 09:50 AM",
    recording: false,
  },
  {
    id: "CALL-8818",
    contact: "Sanjay Singhania",
    company: "Heritage Estates",
    phone: "+91 98111 23456",
    rep: "Amit Patel",
    direction: "outgoing",
    duration: "8m 10s",
    outcome: "Contract Sent",
    status: "connected",
    time: "Yesterday, 04:30 PM",
    recording: true,
  },
  {
    id: "CALL-8817",
    contact: "Kavita Rao",
    company: "Nexus Edutech",
    phone: "+91 97234 56789",
    rep: "Neha Gupta",
    direction: "outgoing",
    duration: "0m 00s",
    outcome: "No Answer",
    status: "missed",
    time: "Yesterday, 03:15 PM",
    recording: false,
  },
];

export default function TelephonyPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterOutcome, setFilterOutcome] = useState("all");

  const filteredLogs = MOCK_CALL_LOGS.filter((call) => {
    const matchesSearch = 
      call.contact.toLowerCase().includes(searchTerm.toLowerCase()) ||
      call.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      call.rep.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesOutcome = filterOutcome === "all" || call.status === filterOutcome;
    return matchesSearch && matchesOutcome;
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
            <Phone className="h-6 w-6 text-primary" />
            Telephony & Call Intelligence
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Real-time call tracking, recording playback, talk-ratio metrics, and automatic disposition logging.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
            <Download className="h-3.5 w-3.5" />
            Export Logs
          </Button>
          <Button size="sm" className="h-8 text-xs gap-1.5 bg-primary text-primary-foreground">
            <PhoneCall className="h-3.5 w-3.5" />
            Dialer Quick-Start
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card border-border shadow-sm">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
            <span className="text-xs font-medium text-muted-foreground">Total Calls Today</span>
            <PhoneCall className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-extrabold font-heading text-foreground">148</div>
            <div className="text-[11px] text-success flex items-center gap-1 mt-1 font-semibold">
              <span>+18%</span>
              <span className="text-muted-foreground font-normal">vs daily target</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border shadow-sm">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
            <span className="text-xs font-medium text-muted-foreground">Connected Calls</span>
            <PhoneIncoming className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-extrabold font-heading text-foreground">92</div>
            <div className="text-[11px] text-muted-foreground mt-1">
              Connection rate: <strong className="text-foreground">62.1%</strong>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border shadow-sm">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
            <span className="text-xs font-medium text-muted-foreground">Avg Talk Time</span>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-extrabold font-heading text-foreground">4m 12s</div>
            <div className="text-[11px] text-muted-foreground mt-1">
              Top Rep: <strong className="text-foreground">Rohan Verma (6m 05s)</strong>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border shadow-sm">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
            <span className="text-xs font-medium text-muted-foreground">Conversion from Calls</span>
            <Flame className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-extrabold font-heading text-foreground">28.4%</div>
            <div className="text-[11px] text-muted-foreground mt-1">
              26 Deals moved to qualified stage
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Call Logs Table */}
      <Card className="bg-card border-border shadow-sm">
        <CardHeader className="p-4 border-b border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-sm font-bold font-heading">Call Records & Dispositions</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">Showing verified dialer logs synced with active leads</p>
          </div>
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search contact, company, rep..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 h-8 text-xs bg-background"
              />
            </div>
            <Select value={filterOutcome} onValueChange={setFilterOutcome}>
              <SelectTrigger className="h-8 text-xs w-[130px] bg-background">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="connected">Connected</SelectItem>
                <SelectItem value="busy">Busy</SelectItem>
                <SelectItem value="missed">Missed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-muted/40 border-b border-border text-muted-foreground font-semibold">
                  <th className="py-2.5 px-4">Contact & Company</th>
                  <th className="py-2.5 px-4">Phone Number</th>
                  <th className="py-2.5 px-4">Sales Rep</th>
                  <th className="py-2.5 px-4">Duration</th>
                  <th className="py-2.5 px-4">Logged Outcome</th>
                  <th className="py-2.5 px-4">Timestamp</th>
                  <th className="py-2.5 px-4 text-right">Recording</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredLogs.map((call) => (
                  <tr key={call.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4 font-medium text-foreground">
                      <div>{call.contact}</div>
                      <div className="text-[11px] text-muted-foreground">{call.company}</div>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-muted-foreground">
                      {call.phone}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 text-foreground">
                        <User className="h-3 w-3 text-muted-foreground" />
                        <span>{call.rep}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px]">
                      {call.duration}
                    </td>
                    <td className="py-3 px-4">
                      <Badge 
                        variant="outline"
                        className={
                          call.status === "connected"
                            ? "bg-success/10 text-success border-success/30 font-semibold"
                            : call.status === "busy"
                            ? "bg-warning/10 text-warning border-warning/30 font-semibold"
                            : "bg-destructive/10 text-destructive border-destructive/30 font-semibold"
                        }
                      >
                        {call.outcome}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground text-[11px]">
                      {call.time}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {call.recording ? (
                        <Button variant="ghost" size="sm" className="h-7 px-2 text-[11px] gap-1 text-primary hover:text-primary/80">
                          <Play className="h-3 w-3 fill-current" />
                          Listen
                        </Button>
                      ) : (
                        <span className="text-muted-foreground text-[11px] italic">N/A</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
