"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { KeyRound, Plus, Trash2, Unplug } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { rotateWebhookKey, testLead } from "@/lib/api/integrations";
import { DeliveryLog } from "./delivery-log";
import { CodeBlock, Confirm, CopyField, DetailShell, LoadError, Panel, Rows, Saving, ago, useIntegration } from "./shared";

const TARGETS = [["name", "Full name"], ["firstName", "First name"], ["lastName", "Last name"], ["phone", "Phone"], ["email", "Email"],
  ["city", "City"], ["company", "Company"], ["message", "Message"], ["budget", "Budget"]];

function snippets(url, origin) {
  return {
    script: `<script src="${origin}/lead-capture.js" data-endpoint="${url}" defer></script>

<form data-smoothsales>
  <input name="name" placeholder="Name" required>
  <input name="phone" type="tel" placeholder="Phone" required>
  <input name="email" type="email" placeholder="Email">
  <input name="_gotcha" tabindex="-1" autocomplete="off" style="display:none">
  <button type="submit">Send</button>
  <p data-smoothsales-thanks hidden>Thank you, we will call you soon.</p>
  <p data-smoothsales-error hidden>Not sent. Please try again.</p>
</form>`,
    html: `<form action="${url}" method="post">
  <input name="name" required>
  <input name="phone" type="tel" required>
  <input name="email" type="email">
  <input type="hidden" name="page_url" value="">
  <input name="_gotcha" tabindex="-1" autocomplete="off" style="display:none">
  <button type="submit">Send</button>
</form>
<script>document.querySelector('[name=page_url]').value = location.href</script>`,
    server: `curl -X POST "${url}" \\
  -H "Content-Type: application/json" \\
  -d '{"name":"Asha Verma","phone":"9876543210","email":"asha@example.com","message":"Call me","utm_source":"newsletter"}'`,
  };
}

export function WebsiteDetail() {
  const { state, data, busy, load, save, remove } = useIntegration("website");
  const [freshUrl, setFreshUrl] = useState(null);
  const [creating, setCreating] = useState(false);
  const [origin, setOrigin] = useState("");
  const [f, setF] = useState(null);
  const [test, setTest] = useState({ name: "Test Lead", phone: "", email: "", message: "Test from Integrations" });
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);
  const [logKey, setLogKey] = useState(0);

  useEffect(() => { setOrigin(window.location.origin); }, []);
  useEffect(() => {
    if (!data) return;
    const c = data.config || {};
    setF({
      sites: (c.allowedOrigins || []).join("\n"), redirectUrl: c.redirectUrl || "",
      mappings: (c.fieldMappings || []).map((m) => ({ sourceKey: m.sourceKey || "", targetField: m.targetField || "name" })),
    });
  }, [data]);

  const hasUrl = !!data?.webhookKeyHint;
  const createUrl = async () => {
    setCreating(true);
    try {
      const r = await rotateWebhookKey("website");
      setFreshUrl(r.webhookUrl);
      toast.success("Webhook URL created. Copy it now.");
      await load();
    } catch (e) {
      toast.error(e?.message || "Could not create the URL");
    } finally {
      setCreating(false);
    }
  };

  const submit = (e) => {
    e.preventDefault();
    save({
      config: {
        allowedOrigins: f.sites.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean),
        redirectUrl: f.redirectUrl.trim(),
        fieldMappings: f.mappings.filter((m) => m.sourceKey.trim()).map((m) => ({ ...m, sourceKey: m.sourceKey.trim() })),
      },
    });
  };

  const sendTest = async (e) => {
    e.preventDefault();
    setSending(true);
    setResult(null);
    try {
      setResult(await testLead("website", { payload: test }));
      toast.success("Test lead created");
      setLogKey((k) => k + 1);
    } catch (err) {
      toast.error(err?.message || "Test lead failed");
    } finally {
      setSending(false);
    }
  };

  const code = snippets(freshUrl || "PASTE_YOUR_WEBHOOK_URL", origin || "https://your-crm");
  const setMap = (i, patch) => setF((s) => ({ ...s, mappings: s.mappings.map((m, j) => (j === i ? { ...m, ...patch } : m)) }));

  return (
    <DetailShell integrationKey="website" title="Website" status={hasUrl ? data?.status : "not_configured"}
      description="Leads from any website form or landing page, with UTM tags and ad click tracking."
      actions={state === "ready" && hasUrl && (
        <>
          <label className="flex items-center gap-2 text-xs font-medium text-foreground">
            <Switch checked={!!data.enabled} disabled={!!busy} onCheckedChange={(on) => save({ enabled: on }, on ? "Lead capture is on" : "Lead capture is paused")} /> Capture leads
          </label>
          <Confirm trigger={<Button variant="outline" size="sm" disabled={!!busy}><Unplug /> Disconnect</Button>}
            title="Disconnect your website?" action="Disconnect" onConfirm={() => { setFreshUrl(null); remove(); }}
            description="The webhook URL stops working immediately and the settings are deleted. Existing leads are kept." />
        </>
      )}>
      {state === "loading" && <Rows count={6} />}
      {state === "error" && <LoadError message="Could not load this integration." onRetry={load} />}
      {state === "ready" && f && (
        <>
          <div className="grid gap-4 lg:grid-cols-2 items-start">
            <Panel id="url" title="Webhook URL" description="Your forms send leads to this address. It contains a secret key and is shown in full only once."
              action={hasUrl ? (
                <Confirm trigger={<Button variant="outline" size="sm" disabled={creating}><KeyRound /> Replace URL</Button>}
                  title="Replace the webhook URL?" action="Replace" onConfirm={createUrl}
                  description="Forms that use the current URL stop sending leads until you update them." />
              ) : (
                <Button size="sm" onClick={createUrl} disabled={creating}><Saving on={creating} />{!creating && <KeyRound />} Create URL</Button>
              )}>
              <CopyField label={freshUrl ? "Copy it now" : "Current URL"} value={freshUrl || data.webhookUrlMasked} canCopy={!!freshUrl} placeholder="No URL yet" />
              <p className="text-xs text-muted-foreground">
                {data.lastEventAt ? `Last lead received ${ago(data.lastEventAt)}.` : hasUrl ? "No lead received yet." : "Create the URL to start."} Up to 240 submissions a minute.
              </p>
            </Panel>

            <Panel id="test" title="Send a test lead" description="Runs the real pipeline and creates a real lead you can delete afterwards.">
              <form onSubmit={sendTest} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[["name", "Name", "text"], ["phone", "Phone", "tel"], ["email", "Email", "email"], ["message", "Message", "text"]].map(([k, label, type]) => (
                  <div key={k} className="space-y-1.5">
                    <Label htmlFor={`wt-${k}`} className="text-xs">{label}</Label>
                    <Input id={`wt-${k}`} type={type} value={test[k]} onChange={(e) => setTest((s) => ({ ...s, [k]: e.target.value }))} className="h-8 text-xs" />
                  </div>
                ))}
                <div className="sm:col-span-2 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs text-foreground" role="status">
                    {result && <>Saved as <Link className="underline underline-offset-2" href={`/leads/customers/${result.leadId}`}>{result.name}</Link>{result.assignedTo ? `, assigned to ${result.assignedTo}` : ", not assigned"}.</>}
                  </p>
                  <Button type="submit" size="sm" variant="outline" disabled={sending || (!test.phone.trim() && !test.email.trim())}><Saving on={sending} /> Send test</Button>
                </div>
              </form>
            </Panel>
          </div>

          <Panel id="code" title="Add it to your website" description="A phone number or an email is required. The hidden _gotcha field catches bots.">
            <Tabs defaultValue="script">
              <TabsList className="h-auto flex-wrap">
                <TabsTrigger value="script">Script (recommended)</TabsTrigger>
                <TabsTrigger value="html">Plain HTML</TabsTrigger>
                <TabsTrigger value="server">Server / API</TabsTrigger>
              </TabsList>
              <TabsContent value="script" className="space-y-2">
                <p className="text-xs text-muted-foreground">Remembers the visitor’s UTM tags and Google or Facebook click ID for 90 days. Add <code className="font-mono">data-redirect=&quot;/thank-you&quot;</code> to open a page afterwards.</p>
                <CodeBlock code={code.script} label="script snippet" />
              </TabsContent>
              <TabsContent value="html" className="space-y-2">
                <p className="text-xs text-muted-foreground">Works without JavaScript on submit. Set a thank-you page below, otherwise visitors see a plain confirmation.</p>
                <CodeBlock code={code.html} label="HTML snippet" />
              </TabsContent>
              <TabsContent value="server" className="space-y-2">
                <p className="text-xs text-muted-foreground">From your backend, WordPress or any tool that can POST JSON or form data.</p>
                <CodeBlock code={code.server} label="API example" />
              </TabsContent>
            </Tabs>
          </Panel>

          <form onSubmit={submit}>
            <Panel id="set" title="Settings" action={<Button type="submit" size="sm" disabled={!!busy}><Saving on={busy === "save"} /> Save</Button>}>
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="ws-sites" className="text-xs">Allowed websites (one per line)</Label>
                    <Textarea id="ws-sites" rows={3} value={f.sites} onChange={(e) => setF((s) => ({ ...s, sites: e.target.value }))} placeholder={"example.com\nlanding.example.com"} className="text-xs font-mono" />
                    <p className="text-xs text-muted-foreground">Browsers on other sites are refused. Empty allows any site.</p>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="ws-thanks" className="text-xs">Thank-you page for plain HTML forms</Label>
                    <Input id="ws-thanks" type="url" value={f.redirectUrl} onChange={(e) => setF((s) => ({ ...s, redirectUrl: e.target.value }))} placeholder="https://example.com/thank-you" className="h-8 text-xs font-mono" />
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-medium text-foreground">Field names</p>
                  <p className="text-xs text-muted-foreground">Common names such as name, phone, mobile, email, city and message are recognised. Add a rule only if your form uses others.</p>
                  {f.mappings.map((m, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Input aria-label="Form field name" value={m.sourceKey} onChange={(e) => setMap(i, { sourceKey: e.target.value })} placeholder="your-field" className="h-8 text-xs font-mono" />
                      <Select value={m.targetField} onValueChange={(v) => setMap(i, { targetField: v })}>
                        <SelectTrigger className="h-8 w-36 shrink-0 text-xs" aria-label="Lead field"><SelectValue /></SelectTrigger>
                        <SelectContent>{TARGETS.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
                      </Select>
                      <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0" aria-label="Remove rule" onClick={() => setF((s) => ({ ...s, mappings: s.mappings.filter((_, j) => j !== i) }))}><Trash2 /></Button>
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" onClick={() => setF((s) => ({ ...s, mappings: [...s.mappings, { sourceKey: "", targetField: "name" }] }))}><Plus /> Add rule</Button>
                </div>
              </div>
            </Panel>
          </form>
          <DeliveryLog key={logKey} source="WEBSITE" title="Submissions" description="The last 100 form submissions, including rejected ones." emptyText="No submissions yet. Add the snippet to your site and submit the form once." />
        </>
      )}
    </DetailShell>
  );
}
