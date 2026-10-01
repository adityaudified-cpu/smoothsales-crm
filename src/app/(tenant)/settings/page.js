import React from "react";
import { PageHeader } from "@/components/layout/page-header";
import { SettingsNav } from "@/components/settings/settings-nav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Workspace & Tenant Settings"
        description="Configure localization, working hours for SLA tracking, and global notification triggers."
      >
        <Button size="sm" className="h-8 text-xs bg-primary text-primary-foreground">
          Save Settings
        </Button>
      </PageHeader>

      <SettingsNav />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-5 bg-card border border-border rounded-md shadow-none space-y-4">
          <h3 className="font-heading font-bold text-sm text-foreground">
            Tenant Profile & Regional Localization
          </h3>
          <div className="space-y-3 text-xs">
            <div className="space-y-1">
              <Label className="text-xs">Company / Legal Name</Label>
              <Input defaultValue="Apex Enterprises India Pvt Ltd" className="h-8 text-xs" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Base Currency</Label>
              <Input defaultValue="INR (₹) — Indian Rupee" disabled className="h-8 text-xs bg-muted" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Time Zone</Label>
              <Input defaultValue="Asia/Kolkata (IST, UTC+05:30)" disabled className="h-8 text-xs bg-muted" />
            </div>
          </div>
        </Card>

        <Card className="p-5 bg-card border border-border rounded-md shadow-none space-y-4">
          <h3 className="font-heading font-bold text-sm text-foreground">
            Sales SLA & Working Hours
          </h3>
          <div className="space-y-3 text-xs">
            <div className="space-y-1">
              <Label className="text-xs">Operating Window</Label>
              <div className="grid grid-cols-2 gap-2">
                <Input defaultValue="09:30 AM" className="h-8 text-xs" />
                <Input defaultValue="07:30 PM" className="h-8 text-xs" />
              </div>
            </div>
            <div className="flex items-center justify-between pt-2">
              <div>
                <div className="font-medium text-foreground">Pause SLA on Weekends</div>
                <div className="text-[11px] text-muted-foreground">
                  Do not breach response SLA on Saturday & Sunday
                </div>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between pt-2">
              <div>
                <div className="font-medium text-foreground">Auto-Reassign Stale Leads</div>
                <div className="text-[11px] text-muted-foreground">
                  Reroute if no call attempted within 30 minutes
                </div>
              </div>
              <Switch defaultChecked />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
