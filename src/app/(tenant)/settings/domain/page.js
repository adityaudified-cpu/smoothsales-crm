"use client";

import React, { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { SettingsNav } from "@/components/settings/settings-nav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Globe,
  Copy,
  Check,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Trash2,
  ShieldCheck,
  ExternalLink,
  ArrowRight,
} from "lucide-react";

export default function CustomDomainSettingsPage() {
  const [domainStatus, setDomainStatus] = useState("not_configured"); // "not_configured" | "pending_verification" | "verified"
  const [domainInput, setDomainInput] = useState("");
  const [activeDomain, setActiveDomain] = useState("crm.apexcreatives.com");
  const [isVerifying, setIsVerifying] = useState(false);
  const [copiedValue, setCopiedValue] = useState(false);
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);

  const handleConnectDomain = (e) => {
    e.preventDefault();
    if (!domainInput.trim()) {
      toast.error("Please enter a valid subdomain (e.g. crm.youragency.com)");
      return;
    }
    setActiveDomain(domainInput.trim().toLowerCase());
    setDomainStatus("pending_verification");
    toast.info("Domain registered. Please update your DNS records to complete verification.");
  };

  const handleCopyTarget = () => {
    navigator.clipboard.writeText("cname.smoothsales.ai");
    setCopiedValue(true);
    toast.success("Target CNAME copied to clipboard");
    setTimeout(() => setCopiedValue(false), 2000);
  };

  const handleCheckVerification = () => {
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      setDomainStatus("verified");
      toast.success(`Custom domain ${activeDomain} verified and SSL provisioned!`);
    }, 1200);
  };

  const handleConfirmRemove = () => {
    setDomainStatus("not_configured");
    setDomainInput("");
    setRemoveDialogOpen(false);
    toast.info("Custom domain disconnected. Workspace reverted to standard domain.");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Custom Domain Configuration"
        description="Serve your entire tenant CRM workspace under your own branded domain or client subdomain."
      />

      <SettingsNav />

      {/* STATE 1: NOT CONFIGURED */}
      {domainStatus === "not_configured" && (
        <Card className="p-6 bg-card border border-border rounded-lg shadow-xs space-y-6 max-w-2xl">
          <div className="space-y-1">
            <h3 className="font-heading font-bold text-sm text-foreground flex items-center gap-2">
              <Globe className="h-4 w-4 text-primary" />
              <span>Connect Your Custom Domain</span>
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Point your own domain at your SmoothSales workspace so your clients, team members, and
              partners never see the SmoothSales.ai URL.
            </p>
          </div>

          <form onSubmit={handleConnectDomain} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-semibold">Your Custom Domain</Label>
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="crm.youragency.com"
                  value={domainInput}
                  onChange={(e) => setDomainInput(e.target.value)}
                  className="h-9 text-xs font-mono"
                  required
                />
                <Button
                  type="submit"
                  size="sm"
                  className="h-9 text-xs font-semibold bg-primary text-primary-foreground gap-1.5 shrink-0"
                >
                  <span>Connect Domain</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                We recommend using a dedicated subdomain like <code className="font-mono text-foreground">crm.yourdomain.com</code> or <code className="font-mono text-foreground">portal.yourdomain.com</code>.
              </p>
            </div>
          </form>

          <div className="pt-2 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
            <span>Automatic SSL provisioned via Cloudflare Enterprise</span>
            <span className="flex items-center gap-1 font-medium text-primary">
              <ShieldCheck className="h-3.5 w-3.5" />
              Zero-Downtime Migration
            </span>
          </div>
        </Card>
      )}

      {/* STATE 2: PENDING VERIFICATION */}
      {domainStatus === "pending_verification" && (
        <div className="space-y-6 max-w-3xl">
          <Card className="p-6 bg-card border border-border rounded-lg shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
              <div className="space-y-0.5">
                <div className="text-xs text-muted-foreground">Configured Domain</div>
                <div className="font-heading font-extrabold text-base text-foreground font-mono">
                  {activeDomain}
                </div>
              </div>
              <Badge
                variant="outline"
                className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 gap-1.5 text-xs py-1 px-3 w-fit"
              >
                <AlertTriangle className="h-3.5 w-3.5" />
                <span>Pending DNS Verification</span>
              </Badge>
            </div>

            {/* DNS Instructions Card */}
            <div className="space-y-3">
              <div className="space-y-1">
                <h4 className="text-xs font-semibold text-foreground">
                  DNS Configuration Instructions
                </h4>
                <p className="text-[11.5px] text-muted-foreground leading-relaxed">
                  Log in to your DNS provider (Cloudflare, GoDaddy, Namecheap, AWS Route 53) and add
                  the following CNAME record to point your domain to our network:
                </p>
              </div>

              <div className="border border-border rounded-md overflow-hidden text-xs">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-muted/50 border-b border-border text-[11px] font-mono uppercase text-muted-foreground">
                    <tr>
                      <th className="py-2.5 px-4 font-semibold">Record Type</th>
                      <th className="py-2.5 px-4 font-semibold">Host / Name</th>
                      <th className="py-2.5 px-4 font-semibold">Target Value</th>
                      <th className="py-2.5 px-4 font-semibold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border bg-card">
                    <tr>
                      <td className="py-3 px-4 font-mono font-bold text-primary">CNAME</td>
                      <td className="py-3 px-4 font-mono text-foreground">
                        {activeDomain.split(".")[0]}
                      </td>
                      <td className="py-3 px-4 font-mono text-foreground font-medium">
                        cname.smoothsales.ai
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleCopyTarget}
                          className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground"
                        >
                          {copiedValue ? (
                            <>
                              <Check className="h-3.5 w-3.5 text-emerald-500" />
                              <span className="text-emerald-500 font-semibold">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3.5 w-3.5" />
                              <span>Copy</span>
                            </>
                          )}
                        </Button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="text-[11px] text-muted-foreground bg-muted/40 p-3 rounded-md border border-border">
                Note: DNS propagation can take between a few seconds and up to 10 minutes depending on your registrar TTL settings.
              </div>
            </div>

            {/* Verification Button */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDomainStatus("not_configured")}
                className="text-xs text-muted-foreground h-8 w-full sm:w-auto"
              >
                Change Domain Name
              </Button>

              <Button
                size="sm"
                onClick={handleCheckVerification}
                disabled={isVerifying}
                className="text-xs font-semibold bg-primary text-primary-foreground gap-1.5 h-8 w-full sm:w-auto"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isVerifying ? "animate-spin" : ""}`} />
                <span>{isVerifying ? "Querying DNS Records..." : "Check Verification Status"}</span>
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* STATE 3: VERIFIED & ACTIVE */}
      {domainStatus === "verified" && (
        <div className="space-y-6 max-w-3xl">
          <Card className="p-6 bg-card border border-border rounded-lg shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border">
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">Connected Custom Domain</span>
                <div className="font-heading font-extrabold text-xl text-foreground font-mono flex items-center gap-2">
                  <span>https://{activeDomain}</span>
                  <a
                    href={`https://${activeDomain}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </div>

              <Badge
                variant="outline"
                className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 gap-1.5 text-xs py-1 px-3 w-fit"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Verified &amp; Active</span>
              </Badge>
            </div>

            {/* Health & Status Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-lg border border-border bg-muted/20 space-y-1">
                <div className="text-[11px] font-semibold text-foreground flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-500" />
                  <span>SSL / TLS Encryption</span>
                </div>
                <div className="text-muted-foreground">
                  Status: <strong className="text-emerald-600 dark:text-emerald-400">Active, auto-renewing</strong>
                </div>
                <div className="text-[10px] text-muted-foreground font-mono">
                  Issued by: Let's Encrypt TLS-ALPN-01
                </div>
              </div>

              <div className="p-3.5 rounded-lg border border-border bg-muted/20 space-y-1">
                <div className="text-[11px] font-semibold text-foreground flex items-center gap-1.5">
                  <Globe className="h-4 w-4 text-primary" />
                  <span>Edge Routing Cluster</span>
                </div>
                <div className="text-muted-foreground">
                  Target: <span className="font-mono text-foreground font-semibold">cname.smoothsales.ai</span>
                </div>
                <div className="text-[10px] text-muted-foreground">
                  Anycast CDN edge caching enabled
                </div>
              </div>
            </div>

            {/* Remove Action */}
            <div className="pt-3 border-t border-border flex items-center justify-between">
              <div className="text-xs text-muted-foreground">
                Disconnecting will revert your workspace URL back to <code className="font-mono text-foreground">app.smoothsales.ai</code>.
              </div>

              <Button
                variant="destructive"
                size="sm"
                onClick={() => setRemoveDialogOpen(true)}
                className="text-xs gap-1.5 h-8 shrink-0"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Remove Domain</span>
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Confirmation Dialog for Domain Removal */}
      <Dialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold font-heading text-destructive flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              <span>Disconnect Custom Domain?</span>
            </DialogTitle>
            <DialogDescription className="text-xs pt-1.5 leading-relaxed">
              Are you sure you want to disconnect <strong className="text-foreground font-mono">{activeDomain}</strong>?
              Traffic to this domain will immediately stop routing to your CRM workspace.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRemoveDialogOpen(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleConfirmRemove}
              className="text-xs"
            >
              Yes, Disconnect Domain
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
