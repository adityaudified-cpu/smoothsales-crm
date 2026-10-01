"use client";

import React, { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { SettingsNav } from "@/components/settings/settings-nav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { defaultTenantBranding } from "@/lib/mock-data/tenant-branding";
import { toast } from "sonner";
import {
  UploadCloud,
  Palette,
  Mail,
  Lock,
  Sparkles,
  CheckCircle2,
  Image as ImageIcon,
} from "lucide-react";

export default function TenantBrandingSettingsPage() {
  const [isWhiteLabel, setIsWhiteLabel] = useState(defaultTenantBranding.isWhiteLabelTenant);
  const [brandName, setBrandName] = useState(defaultTenantBranding.brandName);
  const [emailSender, setEmailSender] = useState(defaultTenantBranding.customEmailSenderName);
  const [primaryColor, setPrimaryColor] = useState(defaultTenantBranding.primaryColor);
  const [secondaryColor, setSecondaryColor] = useState(defaultTenantBranding.secondaryColor);
  const [logoUploaded, setLogoUploaded] = useState(false);
  const [faviconUploaded, setFaviconUploaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      toast.success("Workspace branding configuration saved successfully", {
        description: "Primary theme colors, logo, and email sender signatures are now live.",
      });
    }, 600);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="White-Label Branding & Identity"
        description="Customize the brand identity, interface styling, and email sender persona for your sub-tenants."
      >
        <div className="flex items-center gap-2">
          {/* Quick toggle to demonstrate non-whitelabel vs whitelabel view */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsWhiteLabel(!isWhiteLabel)}
            className="text-xs text-muted-foreground hover:text-foreground h-8"
          >
            {isWhiteLabel ? "Preview Restricted View" : "Preview White-Label View"}
          </Button>

          {isWhiteLabel && (
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
              className="h-8 text-xs bg-primary text-primary-foreground font-semibold gap-1.5"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>{isSaving ? "Saving Changes..." : "Save Branding"}</span>
            </Button>
          )}
        </div>
      </PageHeader>

      <SettingsNav />

      {!isWhiteLabel ? (
        /* Restricted View for Non-Whitelabel Accounts */
        <Card className="p-8 border-dashed border-2 border-border bg-card/50 text-center max-w-2xl mx-auto my-8 space-y-4">
          <div className="h-12 w-12 rounded-full bg-muted/60 text-muted-foreground flex items-center justify-center mx-auto">
            <Lock className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-heading font-bold text-base text-foreground">
              Branding Customization Restricted
            </h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
              Branding customization is available on White Label partner accounts — contact your
              account manager or upgrade your tier to enable custom logos, colors, and white-labeled
              subdomains.
            </p>
          </div>
          <div className="pt-2">
            <Button
              size="sm"
              onClick={() => setIsWhiteLabel(true)}
              className="text-xs gap-1.5 bg-primary text-primary-foreground font-semibold"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Enable White Label (Demo)</span>
            </Button>
          </div>
        </Card>
      ) : (
        /* Full Branding Form */
        <div className="space-y-6">
          {/* Section 1: Logo & Favicon Drop Zones */}
          <Card className="p-6 bg-card border border-border rounded-lg shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="font-heading font-bold text-sm text-foreground flex items-center gap-2">
                  <ImageIcon className="h-4 w-4 text-primary" />
                  <span>Workspace Logo &amp; Favicon</span>
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Replace default platform marks across workspace navigation, client portal, and outgoing notifications.
                </p>
              </div>
              <Badge variant="outline" className="text-[10px] font-bold text-primary uppercase">
                Active White-Label
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Logo Drop Zone */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold">Workspace Brand Logo</Label>
                <div
                  onClick={() => {
                    setLogoUploaded(!logoUploaded);
                    toast.info(logoUploaded ? "Logo cleared" : "Mock logo uploaded successfully");
                  }}
                  className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all hover:bg-muted/40 flex flex-col items-center justify-center min-h-[140px] ${
                    logoUploaded
                      ? "border-emerald-500/50 bg-emerald-500/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground mb-2">
                    <UploadCloud className="h-4 w-4" />
                  </div>
                  {logoUploaded ? (
                    <div className="space-y-0.5">
                      <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                        agency-dark-logo.svg
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        Click to change or remove file
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-0.5">
                      <div className="text-xs font-medium text-foreground">
                        Click or drag &amp; drop to upload logo
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        Recommended: SVG or PNG with transparent background, at least 400×120px
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Favicon Drop Zone */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold">Browser Tab Favicon</Label>
                <div
                  onClick={() => {
                    setFaviconUploaded(!faviconUploaded);
                    toast.info(faviconUploaded ? "Favicon cleared" : "Mock favicon uploaded successfully");
                  }}
                  className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all hover:bg-muted/40 flex flex-col items-center justify-center min-h-[140px] ${
                    faviconUploaded
                      ? "border-emerald-500/50 bg-emerald-500/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground mb-2">
                    <UploadCloud className="h-4 w-4" />
                  </div>
                  {faviconUploaded ? (
                    <div className="space-y-0.5">
                      <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                        favicon-agency.png
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        Click to change or remove file
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-0.5">
                      <div className="text-xs font-medium text-foreground">
                        Click or drag &amp; drop to upload favicon
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        Recommended: Square 32×32px or 64×64px PNG or ICO format
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Section 2: Brand Colors */}
          <Card className="p-6 bg-card border border-border rounded-lg shadow-xs space-y-5">
            <div className="border-b border-border pb-3">
              <h3 className="font-heading font-bold text-sm text-foreground flex items-center gap-2">
                <Palette className="h-4 w-4 text-primary" />
                <span>Brand Colors &amp; Workspace Theme</span>
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Your primary color replaces the default SmoothSales blue throughout your workspace and in emails sent to your leads.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Primary Color Picker */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold">Primary Accent Color</Label>
                  <span className="text-[11px] text-muted-foreground font-mono">{primaryColor}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-11 h-9 p-1 rounded cursor-pointer border-border shrink-0"
                  />
                  <Input
                    type="text"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    placeholder="#24567E"
                    className="h-9 text-xs font-mono"
                  />
                  <div
                    className="w-9 h-9 rounded-md border border-border shrink-0 shadow-inner"
                    style={{ backgroundColor: primaryColor }}
                    title="Live Primary Preview"
                  />
                </div>
                <p className="text-[11px] text-muted-foreground leading-tight">
                  Used for primary buttons, active navigation indicators, and key metric badges.
                </p>
              </div>

              {/* Secondary Color Picker */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold">Secondary Accent Color</Label>
                  <span className="text-[11px] text-muted-foreground font-mono">{secondaryColor}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Input
                    type="color"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="w-11 h-9 p-1 rounded cursor-pointer border-border shrink-0"
                  />
                  <Input
                    type="text"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    placeholder="#3E7A5C"
                    className="h-9 text-xs font-mono"
                  />
                  <div
                    className="w-9 h-9 rounded-md border border-border shrink-0 shadow-inner"
                    style={{ backgroundColor: secondaryColor }}
                    title="Live Secondary Preview"
                  />
                </div>
                <p className="text-[11px] text-muted-foreground leading-tight">
                  Used for status badges, SLA alerts, and secondary pipeline milestones.
                </p>
              </div>
            </div>
          </Card>

          {/* Section 3: Custom Email Sender */}
          <Card className="p-6 bg-card border border-border rounded-lg shadow-xs space-y-5">
            <div className="border-b border-border pb-3">
              <h3 className="font-heading font-bold text-sm text-foreground flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary" />
                <span>Custom Email Sender Persona</span>
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Configure how system notifications, lead assignment dispatches, and SLA reports appear in client inboxes.
              </p>
            </div>

            <div className="space-y-4 max-w-xl">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Workspace Brand Name</Label>
                <Input
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  placeholder="Apex Growth Partners"
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Sender Name on Outbound Emails</Label>
                <Input
                  value={emailSender}
                  onChange={(e) => setEmailSender(e.target.value)}
                  placeholder="Apex Sales Desk"
                  className="h-9 text-xs"
                />
              </div>

              {/* Live Preview Box */}
              <div className="p-3.5 rounded-md bg-muted/50 border border-border space-y-1">
                <div className="text-[10.5px] font-bold text-muted-foreground uppercase tracking-wider font-mono">
                  Inbox Preview
                </div>
                <div className="text-xs text-foreground font-medium">
                  Emails will appear from:{" "}
                  <span className="font-bold text-primary">{emailSender || "SmoothSales.ai"}</span>{" "}
                  <code className="text-[11px] font-mono text-muted-foreground bg-background px-1.5 py-0.5 rounded border border-border">
                    &lt;notifications@{brandName ? brandName.toLowerCase().replace(/\s+/g, "") + ".com" : "smoothsales.ai"}&gt;
                  </code>
                </div>
              </div>
            </div>
          </Card>

          {/* Bottom Action */}
          <div className="flex justify-end gap-3 pt-2">
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
              className="h-9 px-6 text-xs bg-primary text-primary-foreground font-semibold gap-2 shadow-sm"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>{isSaving ? "Saving Workspace Settings..." : "Save Branding"}</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
