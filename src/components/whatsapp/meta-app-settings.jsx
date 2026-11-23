"use client";

import { useEffect, useState } from "react";
import { Copy, Check, Loader2, ShieldCheck, AlertTriangle, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { whatsappAppSettingsApi } from "@/lib/api/whatsapp";

function CopyField({ label, value }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="space-y-1">
      <p className="text-2xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <div className="flex items-center gap-2 rounded-md border border-border bg-input-background px-2.5 h-8">
        <code className="font-mono text-xs truncate flex-1">{value || "Saved with the form below"}</code>
        {value && (
          <button type="button" aria-label={`Copy ${label}`}
            onClick={() => { navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
            className="p-1 rounded text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
        )}
      </div>
    </div>
  );
}

function newToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

/** The workspace's Meta app: credentials for signup, webhooks and template samples. Admins only. */
export function MetaAppSettings({ fields = [] }) {
  const [state, setState] = useState("loading"); // loading | ready | hidden | error
  const [saved, setSaved] = useState(null);
  const [form, setForm] = useState({ appId: "", appSecret: "", signupConfigId: "", verifyToken: "" });
  const [saving, setSaving] = useState(false);

  const show = (d) => {
    setSaved(d);
    setForm({ appId: d.appId || "", appSecret: "", signupConfigId: d.signupConfigId || "", verifyToken: d.verifyToken || "" });
  };

  const load = () => {
    setState("loading");
    whatsappAppSettingsApi.get()
      .then((d) => { show(d); setState("ready"); })
      .catch((e) => setState(e?.status === 403 ? "hidden" : "error"));
  };
  useEffect(() => { load(); }, []);

  const set = (k) => (e) => setForm((s) => ({ ...s, [k]: e.target.value }));

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      show(await whatsappAppSettingsApi.save(form));
      toast.success("Meta app saved");
    } catch (err) {
      toast.error(err?.message || "Could not save");
    } finally {
      setSaving(false);
    }
  };

  if (state === "hidden") {
    return (
      <section className="rounded-lg border border-border bg-card p-4">
        <h2 className="text-sm font-semibold">Meta app and webhook</h2>
        <p className="text-xs text-muted-foreground mt-1">Only workspace admins can see and change these settings.</p>
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-border bg-card p-4 space-y-4" aria-labelledby="meta-app-h">
      <div>
        <h2 id="meta-app-h" className="text-sm font-semibold">Meta app and webhook</h2>
        <p className="text-xs text-muted-foreground">
          From developers.facebook.com: your app, then App settings and WhatsApp configuration. Needed once per workspace.
        </p>
      </div>

      {state === "loading" && <div className="space-y-2" aria-busy="true">{[0, 1, 2, 3].map((i) => <div key={i} className="h-8 rounded bg-muted animate-pulse" />)}</div>}
      {state === "error" && (
        <div className="space-y-2"><p className="text-sm text-destructive">Could not load the settings.</p><Button variant="outline" size="sm" onClick={load}>Retry</Button></div>
      )}

      {state === "ready" && (
        <>
          <form onSubmit={save} className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="ma-id" className="text-xs">App ID</Label>
              <Input id="ma-id" inputMode="numeric" value={form.appId} onChange={set("appId")} placeholder="123456789012345" className="h-8 text-xs font-mono" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ma-secret" className="text-xs">App Secret</Label>
              <Input id="ma-secret" type="password" autoComplete="new-password" value={form.appSecret} onChange={set("appSecret")}
                placeholder={saved.appSecretSet ? "Saved. Leave blank to keep it" : "Paste the App Secret"} className="h-8 text-xs font-mono" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ma-config" className="text-xs">Embedded Signup configuration ID</Label>
              <Input id="ma-config" inputMode="numeric" value={form.signupConfigId} onChange={set("signupConfigId")} placeholder="Facebook Login for Business" className="h-8 text-xs font-mono" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ma-verify" className="text-xs">Webhook verify token</Label>
              <div className="flex gap-1.5">
                <Input id="ma-verify" autoComplete="off" value={form.verifyToken} onChange={set("verifyToken")} placeholder="Generated when you save" className="h-8 text-xs font-mono" />
                <Button type="button" variant="outline" size="icon" className="h-8 w-8 shrink-0" aria-label="Generate a new verify token"
                  onClick={() => setForm((s) => ({ ...s, verifyToken: newToken() }))}><RefreshCw /></Button>
              </div>
            </div>
            <div className="sm:col-span-2 flex flex-wrap items-center justify-between gap-2">
              <p className="flex items-center gap-1.5 text-2xs text-foreground">
                {saved.webhookSigned
                  ? <><ShieldCheck className="h-3.5 w-3.5 text-success" aria-hidden /> Incoming events are signature-checked</>
                  : <><AlertTriangle className="h-3.5 w-3.5 text-warning" aria-hidden /> Add the App Secret so fake messages cannot be posted to your inbox</>}
              </p>
              <Button type="submit" size="sm" disabled={saving}>{saving && <Loader2 className="animate-spin" />} Check & save</Button>
            </div>
          </form>

          <div className="grid sm:grid-cols-2 gap-3 border-t border-border pt-4">
            <CopyField label="Callback URL" value={saved.webhookUrl} />
            <CopyField label="Verify token" value={saved.verifyToken} />
          </div>
          <div>
            <p className="text-2xs font-medium uppercase tracking-wider text-muted-foreground mb-1.5">Subscribe to these webhook fields</p>
            <ul className="space-y-1">
              {fields.map(([name, description]) => (
                <li key={name} className="flex flex-wrap items-baseline gap-x-2 text-xs">
                  <code className="font-mono text-foreground">{name}</code>
                  <span className="text-muted-foreground">{description}</span>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </section>
  );
}