"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LeadStatusBadge } from "@/components/leads/lead-status-badge";
import { AttributionLockBadge } from "@/components/leads/attribution-lock-badge";
import { CallDispositionForm } from "@/components/leads/call-disposition-form";
import { Badge } from "@/components/ui/badge";
import { MOCK_LEADS } from "@/lib/mock-data/leads";
import { ArrowLeft, Clock, CheckCircle2, Sparkles, Building2 } from "lucide-react";

import ActiveLeadsPage from "../active/page";
import WorkedLeadsPage from "../worked/page";
import BusinessesPage from "../businesses/page";
import LeadDocumentsPage from "../documents/page";
import SegmentsPage from "../segments/page";
import LeadUploadsPage from "../uploads/page";
import LeadDistributionsPage from "../distributions/page";

export default function LeadDetailPage() {
  const params = useParams();
  const leadId = params?.id || "lead_101";

  if (leadId === "active") return <ActiveLeadsPage />;
  if (leadId === "worked") return <WorkedLeadsPage />;
  if (leadId === "businesses") return <BusinessesPage />;
  if (leadId === "documents") return <LeadDocumentsPage />;
  if (leadId === "segments") return <SegmentsPage />;
  if (leadId === "uploads") return <LeadUploadsPage />;
  if (leadId === "distributions") return <LeadDistributionsPage />;

  const lead = MOCK_LEADS.find((l) => l.id === leadId) || MOCK_LEADS[0];
  const [currentStatus, setCurrentStatus] = useState(lead.status || "Qualified");

  const [timeline, setTimeline] = useState([
    {
      id: "ev_1",
      title: "Call attempted — Interested",
      description: "Discussed full home turnkey requirement. Client requested proposal.",
      timestamp: "Today, 11:30 AM",
      type: "call",
    },
    {
      id: "ev_2",
      title: "WhatsApp brochure template sent",
      description: "Delivered 'Jaipur Interiors — 2026 Portfolio PDF' via Official WhatsApp API.",
      timestamp: "Yesterday, 04:15 PM",
      type: "whatsapp",
    },
    {
      id: "ev_3",
      title: "Call attempted — RNR",
      description: "Ringing no response. Automated SMS notification dispatched.",
      timestamp: "06 Mar, 02:20 PM",
      type: "call",
    },
    {
      id: "ev_4",
      title: "Lead routed via Round-Robin",
      description: `Assigned to ${lead.ownerName || "Aarav Sharma"} within 1.2s SLA.`,
      timestamp: "05 Mar, 10:16 AM",
      type: "system",
    },
    {
      id: "ev_5",
      title: `Lead received from ${lead.source}`,
      description: `Ingested via webhook trigger for campaign ID: cmp_jaipur_09.`,
      timestamp: "05 Mar, 10:15 AM",
      type: "inbound",
    },
  ]);

  const handleSaveDisposition = (data) => {
    if (data.outcome === "Interested") {
      setCurrentStatus("Qualified");
    }
    const newEntry = {
      id: `ev_${Date.now()}`,
      title: `Call logged — ${data.outcome}`,
      description: data.notes || `Disposition marked as ${data.outcome}.`,
      timestamp: "Just now",
      type: "call",
    };
    setTimeline([newEntry, ...timeline]);
  };

  const isQualified = [
    "Qualified",
    "Demo Scheduled",
    "Proposal Sent",
    "Won",
    "Closed Won",
  ].includes(currentStatus);

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <Link
          href="/leads"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-2"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Leads</span>
        </Link>
      </div>

      {/* Two-column layout: Left (1fr) + Right (360px) */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 items-start">
        {/* Left Column: Lead Header Card + Activity Timeline */}
        <div className="space-y-6">
          {/* Lead Header Card */}
          <Card className="p-5 bg-card border border-border shadow-none rounded-md space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h1 className="font-heading font-extrabold text-2xl text-foreground tracking-tight">
                  {lead.name}
                </h1>
                <div className="text-sm font-mono text-muted-foreground tabular-nums mt-0.5">
                  {lead.phone}
                </div>
              </div>

              <div className="flex items-center flex-wrap gap-2.5">
                <span className="px-2.5 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground border border-border">
                  {lead.source}
                </span>
                <LeadStatusBadge status={currentStatus} />
                <AttributionLockBadge
                  partnerName={lead.attributedPartnerName}
                  lockedUntil={lead.attributionLockedUntil}
                  status={currentStatus}
                />
              </div>
            </div>

            <div className="pt-3 border-t border-border flex flex-wrap gap-6 text-xs text-muted-foreground">
              <div>
                Company: <strong className="text-foreground font-medium">{lead.company}</strong>
              </div>
              <div>
                City: <strong className="text-foreground font-medium">{lead.city}</strong>
              </div>
              <div>
                Owner: <strong className="text-foreground font-medium">{lead.ownerName}</strong>
              </div>
              <div>
                Deal Value:{" "}
                <strong className="text-foreground font-medium font-mono tabular-nums">
                  ₹{lead.dealValueINR.toLocaleString("en-IN")}
                </strong>
              </div>
            </div>
          </Card>

          {/* Captured Qualification Details Card (Rendered for Qualified or later stages) */}
          {isQualified && (
            <Card className="p-5 bg-card border border-border shadow-none rounded-md space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <h3 className="font-heading font-extrabold text-sm text-foreground">
                    Captured Qualification Details
                  </h3>
                </div>
                <Badge
                  variant="outline"
                  className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/30 uppercase"
                >
                  Verified Intent
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 text-xs">
                <div className="p-3 rounded-lg bg-muted/40 border border-border space-y-1">
                  <div className="text-[10px] font-semibold text-muted-foreground uppercase font-mono">
                    Requirement Type
                  </div>
                  <div className="font-semibold text-foreground">
                    3 BHK Premium Turnkey Apartment
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-muted/40 border border-border space-y-1">
                  <div className="text-[10px] font-semibold text-muted-foreground uppercase font-mono">
                    Budget Bracket
                  </div>
                  <div className="font-semibold text-foreground font-mono">
                    ₹1.50 Cr – ₹2.20 Cr
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-muted/40 border border-border space-y-1">
                  <div className="text-[10px] font-semibold text-muted-foreground uppercase font-mono">
                    Purchase Timeline
                  </div>
                  <div className="font-semibold text-foreground">
                    Immediate (Within 30 Days)
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-muted/40 border border-border space-y-1">
                  <div className="text-[10px] font-semibold text-muted-foreground uppercase font-mono">
                    Preferred Micro-Market
                  </div>
                  <div className="font-semibold text-foreground">
                    C-Scheme / Malviya Nagar, Jaipur
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-muted/40 border border-border space-y-1">
                  <div className="text-[10px] font-semibold text-muted-foreground uppercase font-mono">
                    Financing &amp; Payment
                  </div>
                  <div className="font-semibold text-foreground">
                    Pre-approved HDFC Bank (75% Loan)
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-muted/40 border border-border space-y-1">
                  <div className="text-[10px] font-semibold text-muted-foreground uppercase font-mono">
                    Decision Maker
                  </div>
                  <div className="font-semibold text-foreground">
                    Self &amp; Co-applicant (Spouse)
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Activity Timeline Card */}
          <Card className="p-5 bg-card border border-border shadow-none rounded-md space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <h3 className="font-heading font-extrabold text-sm text-foreground">
                Activity Timeline
              </h3>
              <span className="text-xs text-muted-foreground">
                {timeline.length} events
              </span>
            </div>

            {/* Connected-dot vertical list */}
            <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[2px] before:bg-border">
              {timeline.map((entry) => (
                <div key={entry.id} className="relative group">
                  {/* Small Connected Dot */}
                  <div className="absolute -left-[29px] top-1 h-3 w-3 rounded-full bg-card border-2 border-primary" />

                  <div className="space-y-1 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-foreground">
                        {entry.title}
                      </span>
                      <span className="text-[11px] text-muted-foreground tabular-nums flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {entry.timestamp}
                      </span>
                    </div>

                    <p className="text-muted-foreground text-[11px] leading-relaxed">
                      {entry.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right Column: Sticky Call Disposition Form */}
        <div className="lg:sticky lg:top-20">
          <CallDispositionForm lead={lead} onSave={handleSaveDisposition} />
        </div>
      </div>
    </div>
  );
}
