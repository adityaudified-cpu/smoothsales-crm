"use client";

import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { MOCK_USERS } from "@/lib/mock-data/users";
import { urls } from "@/lib/urls";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Radio,
  PhoneCall,
  MapPin,
  Building2,
  Gift,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Sparkles,
  AlertTriangle,
  Settings,
  Copy,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function ChannelsPage() {
  // Read doesFieldVisits from localStorage if available, or default to true
  const [doesFieldVisits, setDoesFieldVisits] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("smoothsales_doesFieldVisits");
        if (stored !== null) return JSON.parse(stored);
      } catch (e) {}
    }
    return true;
  });

  const handleToggleFieldVisits = (val) => {
    setDoesFieldVisits(val);
    try {
      localStorage.setItem("smoothsales_doesFieldVisits", JSON.stringify(val));
    } catch (e) {}
    toast.info(
      val
        ? "Field sales & broker channel enabled"
        : "Field sales channel disabled (Remote Sales Only mode)"
    );
  };

  const channels = [
    {
      id: "inbound_digital",
      name: "Inbound Digital & Webhook Endpoints",
      type: "Digital Ingestion",
      icon: Radio,
      enabled: true,
      leadsCount: 519,
      description:
        "Meta Lead Ads, Website Forms, WhatsApp Webhooks, IndiaMART, and Justdial automated capture.",
      details: "5 active endpoints connected",
      link: "/integrations",
      linkText: "Manage Webhooks",
    },
    {
      id: "inside_sales",
      name: "Inside Sales & Telecalling Floor",
      type: "Direct Floor",
      icon: PhoneCall,
      enabled: true,
      leadsCount: 382,
      description:
        "High-velocity click-to-call queues, multi-outcome dispositions, and automated call-recording AI.",
      details: "14 telecallers on floor",
      link: "/leads",
      linkText: "Open Calling Queue",
    },
    {
      id: "field_sales",
      name: "Field Partner & Direct Broker Network",
      type: "Field Operations",
      icon: MapPin,
      enabled: doesFieldVisits,
      leadsCount: doesFieldVisits ? 164 : 0,
      description:
        "External property brokers, site-visit specialists, and local territory representatives.",
      details: doesFieldVisits ? "28 registered field brokers" : "Disabled by workspace settings",
      disabledNote:
        "Not enabled — your workspace is configured for remote sales only. Change this in Settings.",
      link: urls.partners("/field"),
      linkText: "Launch Broker Hub",
    },
    {
      id: "white_label",
      name: "White-Label Agency Resellers",
      type: "Reseller Channel",
      icon: Building2,
      enabled: true,
      leadsCount: 94,
      description:
        "Branded partner subdomains, custom client onboarding desks, and managed sub-tenant instances.",
      details: "3 certified agency partners",
      link: "/partners",
      linkText: "Partner Desk",
    },
    {
      id: "referral_affiliate",
      name: "Affiliate & Customer Referral Network",
      type: "Viral & Affiliate",
      icon: Gift,
      enabled: true,
      leadsCount: 58,
      description:
        "Self-serve referral tracking links, milestone commission ledger, and coupon-code attribution.",
      details: "42 active promoters",
      link: "/commission-ledger",
      linkText: "Commission Ledger",
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sales Channels Overview"
        subtitle="Manage the 5 primary customer acquisition and distribution channels configured for this workspace."
      >
        <div className="flex items-center gap-3 bg-muted/60 px-3 py-1.5 rounded-lg border border-border">
          <div className="text-right text-xs">
            <div className="font-semibold text-foreground">Field Sales Setting</div>
            <div className="text-[10px] text-muted-foreground">
              {doesFieldVisits ? "Field Visits Active" : "Remote Sales Only"}
            </div>
          </div>
          <Switch
            checked={doesFieldVisits}
            onCheckedChange={handleToggleFieldVisits}
            aria-label="Toggle Field Visits Channel"
          />
        </div>
      </PageHeader>

      {/* 5 Sales Channels Cards */}
      <div className="grid grid-cols-1 gap-4">
        {channels.map((ch) => {
          const Icon = ch.icon;
          const isFieldChannel = ch.id === "field_sales";
          const isDisabled = !ch.enabled;

          return (
            <Card
              key={ch.id}
              className={`p-5 bg-card border rounded-md shadow-xs transition-all ${
                isDisabled
                  ? "border-border/60 bg-muted/20 opacity-80"
                  : "border-border hover:border-primary/40"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div
                    className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${
                      isDisabled
                        ? "bg-muted text-muted-foreground"
                        : "bg-primary/10 text-primary"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-heading font-bold text-sm text-foreground">
                        {ch.name}
                      </h3>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-muted text-muted-foreground font-mono">
                        {ch.type}
                      </span>
                      {isDisabled ? (
                        <Badge
                          variant="outline"
                          className="text-[10px] bg-muted text-muted-foreground border-border"
                        >
                          Disabled
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:border-emerald-900"
                        >
                          Active Channel
                        </Badge>
                      )}
                    </div>

                    <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl">
                      {ch.description}
                    </p>

                    {/* Part F1: Field visit decision specific warning note */}
                    {isFieldChannel && isDisabled && (
                      <div className="pt-2">
                        <div className="inline-flex items-center gap-1.5 p-2 rounded bg-amber-500/10 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs">
                          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                          <span>{ch.disabledNote}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between sm:flex-col sm:items-end gap-2 shrink-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-border">
                  <div className="text-right">
                    <div className="text-xs font-semibold text-foreground">
                      {ch.leadsCount > 0 ? (
                        <span className="font-mono">{ch.leadsCount} leads ingested</span>
                      ) : (
                        <span className="text-muted-foreground text-[11px]">—</span>
                      )}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {ch.details}
                    </div>
                  </div>

                  {isDisabled ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleFieldVisits(true)}
                      className="h-7 text-xs"
                    >
                      Enable in Settings
                    </Button>
                  ) : ch.link.startsWith("http") ? (
                    <a href={ch.link}>
                      <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                        <span>{ch.linkText}</span>
                        <ArrowRight className="h-3 w-3" />
                      </Button>
                    </a>
                  ) : (
                    <Link href={ch.link}>
                      <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                        <span>{ch.linkText}</span>
                        <ArrowRight className="h-3 w-3" />
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
