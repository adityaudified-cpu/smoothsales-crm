"use client";

import React, { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import {
  MOCK_PARTNER_APPLICATIONS,
  PARTNER_STAGES,
} from "@/lib/mock-data/partner-applications";
import { toast } from "sonner";
import {
  Kanban,
  FileCheck2,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  Building2,
  UserCheck,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  ShieldAlert,
  Send,
  Sparkles,
} from "lucide-react";

export default function PartnerOnboardingDeskPage() {
  const [applications, setApplications] = useState(MOCK_PARTNER_APPLICATIONS);
  const [activeTab, setActiveTab] = useState("pipeline");
  const [expandedKycId, setExpandedKycId] = useState(null);
  const [rejectReasons, setRejectReasons] = useState({});

  // Helper to get partner type badge
  const renderPartnerTypeBadge = (type) => {
    if (type === "white_label") {
      return (
        <Badge
          variant="outline"
          className="text-[10px] font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900"
        >
          White Label
        </Badge>
      );
    }
    return (
      <Badge
        variant="outline"
        className="text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900"
      >
        Business Partner
      </Badge>
    );
  };

  // KYC: Approve single document
  const handleApproveDoc = (appId, docName) => {
    setApplications((prev) =>
      prev.map((app) => {
        if (app.id !== appId) return app;
        return {
          ...app,
          documents: app.documents.map((doc) =>
            doc.name === docName ? { ...doc, status: "verified" } : doc
          ),
        };
      })
    );
    toast.success(`Document "${docName}" marked as verified.`);
  };

  // KYC: Reject single document
  const handleRejectDoc = (appId, docName) => {
    setApplications((prev) =>
      prev.map((app) => {
        if (app.id !== appId) return app;
        return {
          ...app,
          documents: app.documents.map((doc) =>
            doc.name === docName ? { ...doc, status: "rejected" } : doc
          ),
        };
      })
    );
  };

  // KYC: Save reject reason
  const handleReasonChange = (docName, reason) => {
    setRejectReasons((prev) => ({ ...prev, [docName]: reason }));
  };

  // KYC: Approve Partner Account (when all docs are verified)
  const handleApprovePartnerAccount = (appId, businessName) => {
    setApplications((prev) =>
      prev.map((app) =>
        app.id === appId ? { ...app, stage: "approved", trainingProgress: 25 } : app
      )
    );
    toast.success("Partner account approved — activation email sent", {
      description: `${businessName} has been granted verified partner access.`,
    });
  };

  // KYC List: stage === "kyc_uploaded"
  const kycApplications = applications.filter(
    (app) => app.stage === "kyc_uploaded"
  );

  // Agreements List: stage === "agreement_sent" | "kyc_uploaded" | "approved"
  const agreementApplications = applications.filter((app) =>
    ["agreement_sent", "kyc_uploaded", "approved"].includes(app.stage)
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Partner Onboarding Desk"
        subtitle="Internal desk for the Partner Acquisition Team to review, verify KYC, and approve incoming reseller applications."
      >
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs px-2.5 py-1 bg-muted/60 font-mono">
            {applications.filter((a) => a.stage === "approved").length} Approved Partners
          </Badge>
        </div>
      </PageHeader>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-muted/60 p-1 border border-border">
          <TabsTrigger value="pipeline" className="gap-2 text-xs">
            <Kanban className="h-3.5 w-3.5" />
            <span>Pipeline Board</span>
          </TabsTrigger>
          <TabsTrigger value="kyc" className="gap-2 text-xs relative">
            <FileCheck2 className="h-3.5 w-3.5" />
            <span>KYC Verification</span>
            {kycApplications.length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500 text-white">
                {kycApplications.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="agreements" className="gap-2 text-xs">
            <FileText className="h-3.5 w-3.5" />
            <span>Agreements</span>
          </TabsTrigger>
        </TabsList>

        {/* 1. PIPELINE TAB: KANBAN BOARD */}
        <TabsContent value="pipeline" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3 pb-6 overflow-x-auto select-none items-start">
            {PARTNER_STAGES.map((col) => {
              const colApps = applications.filter((a) => a.stage === col.id);

              return (
                <div
                  key={col.id}
                  className="bg-muted/40 rounded-lg p-3 flex flex-col gap-3 min-w-[240px] border border-border/60"
                >
                  {/* Column Header */}
                  <div className="flex items-center justify-between px-1">
                    <h3 className="font-heading font-bold text-xs text-foreground uppercase tracking-wide">
                      {col.label}
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-background border border-border text-muted-foreground tabular-nums">
                      {colApps.length}
                    </span>
                  </div>

                  {/* Cards */}
                  <div className="space-y-2.5">
                    {colApps.map((app) => (
                      <Card
                        key={app.id}
                        className="p-3.5 bg-card border border-border shadow-xs rounded-md space-y-2.5 hover:border-primary/40 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-heading font-bold text-xs text-foreground leading-snug">
                            {app.businessName}
                          </h4>
                          {renderPartnerTypeBadge(app.partnerType)}
                        </div>

                        <div className="text-[11px] text-muted-foreground space-y-0.5">
                          <div className="flex items-center gap-1.5 text-foreground/80 font-medium">
                            <Building2 className="h-3 w-3 text-muted-foreground" />
                            <span>{app.contactPerson}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>Submitted {app.submittedAt}</span>
                          </div>
                        </div>

                        {/* Part A4: Training status tracker on approved cards */}
                        {app.stage === "approved" && (
                          <div className="pt-2 border-t border-border/80 space-y-1">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-muted-foreground font-medium">
                                Onboarding training:
                              </span>
                              <span className="font-mono font-bold text-foreground">
                                {app.trainingProgress}%
                              </span>
                            </div>
                            <Progress
                              value={app.trainingProgress}
                              className="h-1.5 rounded-full bg-muted"
                            />
                          </div>
                        )}

                        {app.stage === "kyc_uploaded" && (
                          <div className="pt-1.5 flex items-center justify-between text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                            <span>KYC Pending Review</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setActiveTab("kyc");
                                setExpandedKycId(app.id);
                              }}
                              className="h-5 px-1.5 text-[10px] text-primary"
                            >
                              Review Docs →
                            </Button>
                          </div>
                        )}
                      </Card>
                    ))}

                    {colApps.length === 0 && (
                      <div className="py-8 text-center text-xs text-muted-foreground border border-dashed border-border rounded-md">
                        No applications
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>

        {/* 2. KYC VERIFICATION TAB */}
        <TabsContent value="kyc" className="space-y-4">
          <div className="flex items-center justify-between p-3.5 bg-muted/40 rounded-md border border-border text-xs">
            <div className="flex items-center gap-2">
              <FileCheck2 className="h-4 w-4 text-primary" />
              <span>
                Review verified government IDs and signed dealer agreements before issuing production CRM tenant credentials.
              </span>
            </div>
            <span className="text-muted-foreground font-mono">
              {kycApplications.length} pending applications
            </span>
          </div>

          <div className="space-y-4">
            {kycApplications.map((app) => {
              const isExpanded = expandedKycId === app.id;
              const allVerified =
                app.documents.length > 0 &&
                app.documents.every((d) => d.status === "verified");

              return (
                <Card
                  key={app.id}
                  className="bg-card border border-border rounded-md shadow-xs overflow-hidden"
                >
                  <div
                    onClick={() => setExpandedKycId(isExpanded ? null : app.id)}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-muted/20 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-heading font-bold text-sm">
                        {app.businessName.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-heading font-bold text-sm text-foreground">
                            {app.businessName}
                          </h3>
                          {renderPartnerTypeBadge(app.partnerType)}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          Contact: <strong className="text-foreground">{app.contactPerson}</strong> ({app.phone}) • {app.city}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right text-xs">
                        <div className="font-medium text-foreground">
                          {app.documents.filter((d) => d.status === "verified").length} of{" "}
                          {app.documents.length} Docs Verified
                        </div>
                        <div className="text-muted-foreground text-[11px]">
                          Submitted {app.submittedAt}
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Expanded Document Viewer Panel */}
                  {isExpanded && (
                    <div className="p-4 pt-0 border-t border-border bg-muted/10 space-y-4">
                      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pt-3">
                        Submitted Verification Documents ({app.documents.length})
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {app.documents.map((doc) => {
                          const isVerified = doc.status === "verified";
                          const isRejected = doc.status === "rejected";

                          return (
                            <div
                              key={doc.name}
                              className="p-3.5 rounded-md border border-border bg-card space-y-3"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2.5 overflow-hidden">
                                  <div className="h-8 w-8 rounded bg-muted flex items-center justify-center text-muted-foreground shrink-0">
                                    <FileText className="h-4 w-4" />
                                  </div>
                                  <div className="truncate">
                                    <div className="text-xs font-semibold text-foreground truncate">
                                      {doc.name}
                                    </div>
                                    <div className="text-[11px] text-muted-foreground">
                                      Document Type:{" "}
                                      <strong className="text-foreground">{doc.type}</strong>
                                    </div>
                                  </div>
                                </div>

                                <Badge
                                  variant="outline"
                                  className={`text-[10px] capitalize shrink-0 ${
                                    isVerified
                                      ? "bg-emerald-500/10 text-emerald-600 border-emerald-300 dark:border-emerald-800"
                                      : isRejected
                                      ? "bg-destructive/10 text-destructive border-destructive/30"
                                      : "bg-amber-500/10 text-amber-600 border-amber-300 dark:border-amber-800"
                                  }`}
                                >
                                  {doc.status}
                                </Badge>
                              </div>

                              {/* Document Preview Placeholder */}
                              <div className="p-3 rounded border border-dashed border-border bg-muted/30 flex items-center justify-between text-xs text-muted-foreground">
                                <span className="font-mono text-[11px]">
                                  Placeholder PDF Preview [{doc.type}]
                                </span>
                                <span className="text-[10px] bg-background px-1.5 py-0.5 rounded border border-border">
                                  2.4 MB
                                </span>
                              </div>

                              {/* Action Buttons: Approve / Reject */}
                              <div className="flex items-center justify-end gap-2 pt-1">
                                <Button
                                  variant={isRejected ? "destructive" : "outline"}
                                  size="sm"
                                  onClick={() => handleRejectDoc(app.id, doc.name)}
                                  className="h-7 text-xs gap-1"
                                >
                                  <XCircle className="h-3 w-3" />
                                  <span>Reject</span>
                                </Button>
                                <Button
                                  variant={isVerified ? "default" : "secondary"}
                                  size="sm"
                                  onClick={() => handleApproveDoc(app.id, doc.name)}
                                  className={`h-7 text-xs gap-1 ${
                                    isVerified
                                      ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                                      : ""
                                  }`}
                                >
                                  <CheckCircle2 className="h-3 w-3" />
                                  <span>{isVerified ? "Verified" : "Approve"}</span>
                                </Button>
                              </div>

                              {/* Inline Rejection Reason Input */}
                              {isRejected && (
                                <div className="pt-2 border-t border-destructive/20 space-y-1">
                                  <label className="text-[10px] font-semibold text-destructive uppercase">
                                    Rejection Reason (dispatched to applicant)
                                  </label>
                                  <Input
                                    value={rejectReasons[doc.name] || ""}
                                    onChange={(e) =>
                                      handleReasonChange(doc.name, e.target.value)
                                    }
                                    placeholder="e.g. GST number blurry or address mismatch"
                                    className="h-7 text-xs border-destructive/40"
                                  />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Prominent Approve Partner Account Button */}
                      <div className="pt-4 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="text-xs text-muted-foreground">
                          {allVerified ? (
                            <span className="text-emerald-600 font-semibold flex items-center gap-1.5">
                              <CheckCircle2 className="h-4 w-4" />
                              All required KYC documents verified. Ready to issue account.
                            </span>
                          ) : (
                            <span className="flex items-center gap-1.5 text-amber-600">
                              <Clock className="h-3.5 w-3.5" />
                              Verify all documents to unlock account approval.
                            </span>
                          )}
                        </div>

                        <Button
                          disabled={!allVerified}
                          onClick={() =>
                            handleApprovePartnerAccount(app.id, app.businessName)
                          }
                          className="h-8 gap-2 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold disabled:opacity-50"
                        >
                          <UserCheck className="h-3.5 w-3.5" />
                          <span>Approve Partner Account</span>
                        </Button>
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}

            {kycApplications.length === 0 && (
              <div className="p-10 text-center text-xs text-muted-foreground border border-dashed border-border rounded-md bg-card">
                No applications currently awaiting KYC verification.
              </div>
            )}
          </div>
        </TabsContent>

        {/* 3. AGREEMENTS TAB */}
        <TabsContent value="agreements" className="space-y-4">
          <Card className="bg-card border border-border rounded-md shadow-xs overflow-hidden">
            <div className="p-4 border-b border-border">
              <h3 className="font-heading font-bold text-sm text-foreground">
                Partner Reseller Agreements ({agreementApplications.length})
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Official partnership memorandums and digital contracts sent to applicants
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-muted-foreground font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Business Name</th>
                    <th className="py-3 px-4">Contact Person</th>
                    <th className="py-3 px-4">Partner Type</th>
                    <th className="py-3 px-4">Agreement Status</th>
                    <th className="py-3 px-4">Lifecycle Stage</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {agreementApplications.map((app) => {
                    const isSigned = app.stage === "kyc_uploaded" || app.stage === "approved";

                    return (
                      <tr key={app.id} className="hover:bg-muted/20 transition-colors">
                        <td className="py-3.5 px-4 font-semibold text-foreground">
                          {app.businessName}
                        </td>
                        <td className="py-3.5 px-4 text-muted-foreground">
                          {app.contactPerson}
                        </td>
                        <td className="py-3.5 px-4">
                          {renderPartnerTypeBadge(app.partnerType)}
                        </td>
                        <td className="py-3.5 px-4">
                          <Badge
                            variant="outline"
                            className={`text-xs ${
                              isSigned
                                ? "bg-emerald-500/10 text-emerald-600 border-emerald-300"
                                : "bg-amber-500/10 text-amber-600 border-amber-300"
                            }`}
                          >
                            {isSigned ? "Signed" : "Sent (Awaiting Signature)"}
                          </Badge>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[11px] capitalize text-muted-foreground">
                          {app.stage.replace("_", " ")}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              toast.info(`Opening signed agreement preview for ${app.businessName}`)
                            }
                            className="h-7 text-xs text-primary gap-1"
                          >
                            <span>View Agreement</span>
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
