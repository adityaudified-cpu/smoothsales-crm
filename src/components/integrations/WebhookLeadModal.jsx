"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, ExternalLink, Key, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { integrationsApi } from "@/lib/api/integrations";

// Config per portal
const PORTAL_CONFIG = {
  indiamart: {
    name: "IndiaMART",
    color: "bg-orange-600",
    letter: "I",
    webhookPath: "indiamart",
    fields: [
      { key: "apiKey", label: "API Key", placeholder: "Your IndiaMART API Key", hint: "Seller Panel → Lead Manager → API Settings" },
      { key: "mobileNo", label: "Registered Mobile", placeholder: "9876543210", hint: "Mobile number registered with IndiaMART" },
    ],
    setupSteps: [
      "Log in to IndiaMART Seller Panel",
      "Go to Lead Manager → API Settings",
      "Generate your API Key",
      "Enter the Webhook URL below in the API Settings",
      "Save and test with a sample lead",
    ],
    docsUrl: "https://seller.indiamart.com",
    payloadSample: `{ "SENDER_NAME": "Rahul Sharma", "SENDER_MOBILE": "9876543210", "SENDER_EMAIL": "rahul@example.com", "QUERY_MESSAGE": "Need 100 units", "SENDER_CITY": "Mumbai" }`,
  },
  "99acres": {
    name: "99acres",
    color: "bg-blue-700",
    letter: "9",
    webhookPath: "99acres",
    fields: [
      { key: "apiKey", label: "API Key", placeholder: "Your 99acres API Key", hint: "Builder Dashboard → Lead Settings → API Key" },
      { key: "projectId", label: "Project ID", placeholder: "PROJ123456", hint: "Your project listing ID on 99acres" },
    ],
    setupSteps: [
      "Log in to 99acres Builder Dashboard",
      "Go to Lead Settings → Webhook Configuration",
      "Enter the Webhook URL below",
      "Save your API Key and Project ID here",
      "Test with a sample lead submission",
    ],
    docsUrl: "https://www.99acres.com",
    payloadSample: `{ "name": "Priya Singh", "mobile": "9876543210", "email": "priya@example.com", "city": "Delhi", "message": "Interested in 3BHK" }`,
  },
  magicbricks: {
    name: "MagicBricks",
    color: "bg-red-600",
    letter: "M",
    webhookPath: "magicbricks",
    fields: [
      { key: "apiKey", label: "API Key", placeholder: "Your MagicBricks API Key", hint: "Developer Portal → Webhook Config → API Key" },
      { key: "projectCode", label: "Project Code", placeholder: "MB_PROJ_001", hint: "Your project code on MagicBricks" },
    ],
    setupSteps: [
      "Log in to MagicBricks Developer Portal",
      "Go to Webhook Configuration",
      "Enter the Webhook URL below",
      "Copy your API Key and Project Code",
      "Test the integration",
    ],
    docsUrl: "https://www.magicbricks.com",
    payloadSample: `{ "leadName": "Amit Kumar", "leadPhone": "9876543210", "leadEmail": "amit@example.com", "leadCity": "Bangalore", "leadMessage": "Looking for 2BHK" }`,
  },
  custom: {
    name: "Custom Website Webhook",
    color: "bg-slate-700",
    letter: "W",
    webhookPath: "custom",
    fields: [
      { key: "secretKey", label: "Secret Key (optional)", placeholder: "my-webhook-secret", hint: "Optional HMAC secret for payload verification" },
      { key: "siteName", label: "Site Name", placeholder: "My Landing Page", hint: "Label to identify this source in leads" },
    ],
    setupSteps: [
      "Copy the Webhook URL below",
      "Add it to your website's form submission handler",
      "POST JSON with: name, phone, email, city, message fields",
      "Optionally add X-Webhook-Secret header for security",
      "Test with a sample form submission",
    ],
    docsUrl: null,
    payloadSample: `{ "name": "John Doe", "phone": "9876543210", "email": "john@example.com", "city": "Mumbai", "message": "Interested in your product" }`,
  },
};

export function WebhookLeadModal({ open, onClose, onSaved, integrationId }) {
  const config = PORTAL_CONFIG[integrationId] || PORTAL_CONFIG[integrationId?.replace("_form", "")] || PORTAL_CONFIG.custom;
  const [tab, setTab] = useState("setup");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({});

  const webhookUrl = `${process.env.NEXT_PUBLIC_API_URL || "https://api.smoothsales.in/api"}/webhooks/leads/${config.webhookPath}`;

  useEffect(() => {
    if (!open) return;
    setTab("setup");
    integrationsApi.getByKey(integrationId).then((cfg) => {
      if (cfg?.configJson) {
        try {
          const c = typeof cfg.configJson === "string" ? JSON.parse(cfg.configJson) : cfg.configJson;
          setForm(c);
        } catch {}
      }
    }).catch(() => {});
  }, [open, integrationId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await integrationsApi.save(integrationId, {
        displayName: config.name,
        category: "Listing Portals",
        enabled: true,
        config: form,
      });
      toast.success(`${config.name} integration saved`);
      onSaved?.();
    } catch (e) {
      toast.error("Failed to save", { description: e.message });
    } finally {
      setSaving(false);
    }
  };

  const copy = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className={`h-10 w-10 rounded-xl ${config.color} flex items-center justify-center shrink-0`}>
              <span className="text-white font-bold text-sm">{config.letter}</span>
            </div>
            <div>
              <DialogTitle className="text-base font-bold">{config.name}</DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">Webhook Lead Integration</p>
            </div>
          </div>
        </DialogHeader>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="w-full rounded-none border-b border-border bg-transparent h-auto p-0">
            {["setup", "webhook", "payload"].map((t) => (
              <TabsTrigger key={t} value={t} className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent text-xs py-3 capitalize">
                {t}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* ── Setup ── */}
          <TabsContent value="setup" className="p-6 space-y-5">
            {config.fields.map((field) => (
              <div key={field.key} className="space-y-1.5">
                <Label className="text-xs font-semibold">{field.label}</Label>
                <Input
                  placeholder={field.placeholder}
                  value={form[field.key] || ""}
                  onChange={(e) => setForm((f) => ({ ...f, [field.key]: e.target.value }))}
                  className="h-9 text-sm font-mono"
                />
                <p className="text-[10px] text-muted-foreground">{field.hint}</p>
              </div>
            ))}

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
              <Button size="sm" onClick={handleSave} disabled={saving} className="gap-1.5">
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Key className="h-3.5 w-3.5" />}
                Save
              </Button>
            </div>
          </TabsContent>

          {/* ── Webhook ── */}
          <TabsContent value="webhook" className="p-6 space-y-5">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Webhook URL</Label>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs bg-muted px-3 py-2 rounded-lg border border-border font-mono break-all">{webhookUrl}</code>
                <Button variant="outline" size="icon" className="h-9 w-9 shrink-0" onClick={() => copy(webhookUrl)}>
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-2">
              <p className="text-xs font-semibold">Setup Steps</p>
              {config.setupSteps.map((step, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="h-4 w-4 rounded-full bg-primary/10 text-primary text-[9px] font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                  <p className="text-xs text-muted-foreground">{step}</p>
                </div>
              ))}
            </div>

            {config.docsUrl && (
              <Button variant="outline" size="sm" className="gap-1.5 w-full" onClick={() => window.open(config.docsUrl, "_blank")}>
                <ExternalLink className="h-3.5 w-3.5" /> Open {config.name} Portal
              </Button>
            )}
          </TabsContent>

          {/* ── Payload ── */}
          <TabsContent value="payload" className="p-6 space-y-4">
            <p className="text-sm font-semibold">Expected Payload Format</p>
            <p className="text-xs text-muted-foreground">The CRM automatically maps these fields to lead records.</p>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Sample Payload</Label>
              <div className="relative">
                <pre className="text-[11px] bg-muted px-4 py-3 rounded-xl border border-border font-mono overflow-x-auto whitespace-pre-wrap">{config.payloadSample}</pre>
                <Button variant="outline" size="icon" className="absolute top-2 right-2 h-7 w-7" onClick={() => copy(config.payloadSample)}>
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold">Field Mapping</p>
              {[
                { from: "name / SENDER_NAME / leadName", to: "Lead Name" },
                { from: "phone / SENDER_MOBILE / leadPhone / mobile", to: "Phone Number" },
                { from: "email / SENDER_EMAIL / leadEmail", to: "Email" },
                { from: "city / SENDER_CITY / leadCity", to: "City" },
                { from: "message / QUERY_MESSAGE / leadMessage", to: "Notes / Requirement" },
              ].map((m) => (
                <div key={m.to} className="flex items-center gap-2 text-xs">
                  <code className="text-[10px] font-mono px-2 py-0.5 rounded bg-muted border border-border text-muted-foreground">{m.from}</code>
                  <span className="text-muted-foreground">→</span>
                  <span className="font-medium">{m.to}</span>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
