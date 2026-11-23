"use client";

import { useEffect, useState } from "react";
import { Unplug, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ConversionLog, StageMap } from "./conversion-log";
import { Confirm, DetailShell, LoadError, Panel, Rows, Saving, useIntegration } from "./shared";

const DEFAULT_EVENTS = { CONTACTED: "Contacted", QUALIFIED: "Qualified", SITE_VISIT_DONE: "Site Visit", BOOKED: "Converted" };

export function MetaCapiDetail() {
  const { state, data, busy, load, save, test, remove } = useIntegration("meta_capi");
  const [f, setF] = useState(null);

  useEffect(() => {
    if (!data) return;
    const c = data.config || {};
    setF({
      pixelId: c.pixelId || "", capiToken: "", testEventCode: c.testEventCode || "", currency: c.currency || "INR",
      allLeads: !!c.allLeads, stageEvents: c.stageEvents || DEFAULT_EVENTS,
    });
  }, [data]);

  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e?.target ? e.target.value : e }));
  const tokenSaved = !!data?.secretHints?.capiToken;

  const submit = (e) => {
    e.preventDefault();
    save({ config: { ...f, pixelId: f.pixelId.trim(), currency: f.currency.trim().toUpperCase(), stageEvents: f.stageEvents } });
  };
  // Switching on saves what is on screen, so nobody turns on settings they did not mean.
  const toggle = (on) => save({ enabled: on, config: on ? { ...f, pixelId: f.pixelId.trim(), currency: f.currency.trim().toUpperCase() } : {} },
    on ? "Reporting is on" : "Reporting is paused");

  return (
    <DetailShell integrationKey="meta_capi" title="Meta Conversions API" status={data?.status}
      description="Tells Meta which leads moved forward, so campaigns find more people like them."
      testMessage={data?.lastTestMessage} testedAt={data?.lastTestedAt} testOk={data?.lastTestStatus === "OK"}
      actions={state === "ready" && f && (
        <>
          <label className="flex items-center gap-2 text-xs font-medium text-foreground">
            <Switch checked={!!data.enabled} onCheckedChange={toggle} disabled={!!busy} /> Report conversions
          </label>
          <Button variant="outline" size="sm" onClick={test} disabled={!!busy || !tokenSaved}><Saving on={busy === "test"} />{busy !== "test" && <Zap />} Send test event</Button>
          {data.configured && (
            <Confirm trigger={<Button variant="outline" size="sm" disabled={!!busy}><Unplug /> Disconnect</Button>}
              title="Disconnect Meta Conversions API?" action="Disconnect" onConfirm={remove}
              description="The dataset, access token and stage rules are deleted and reporting stops. The conversion log is kept." />
          )}
        </>
      )}>
      {state === "loading" && <Rows count={6} />}
      {state === "error" && <LoadError message="Could not load this integration." onRetry={load} />}
      {state === "ready" && f && (
        <form onSubmit={submit} className="grid gap-4 lg:grid-cols-2 items-start">
          <Panel id="ds" title="Dataset" description="Events Manager → your dataset → Settings.">
            <div className="grid gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="mc-pixel" className="text-xs">Dataset (Pixel) ID</Label>
                <Input id="mc-pixel" inputMode="numeric" value={f.pixelId} onChange={set("pixelId")} placeholder="123456789012345" className="h-8 text-xs font-mono" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="mc-token" className="text-xs">Access token</Label>
                <Input id="mc-token" type="password" autoComplete="new-password" value={f.capiToken} onChange={set("capiToken")} className="h-8 text-xs font-mono"
                  placeholder={tokenSaved ? `Saved (${data.secretHints.capiToken}). Leave blank to keep it` : "Conversions API → Generate access token"} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="mc-test" className="text-xs">Test event code</Label>
                  <Input id="mc-test" value={f.testEventCode} onChange={set("testEventCode")} placeholder="TEST12345" className="h-8 text-xs font-mono" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="mc-cur" className="text-xs">Currency of lead value</Label>
                  <Input id="mc-cur" maxLength={3} value={f.currency} onChange={set("currency")} className="h-8 text-xs font-mono uppercase" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">The test code is only used by “Send test event”. Real conversions are never marked as tests.</p>
              <label className="flex items-start gap-2 text-sm text-foreground">
                <Switch checked={f.allLeads} onCheckedChange={set("allLeads")} className="mt-0.5" />
                <span>Report every lead<span className="block text-xs text-muted-foreground">Off: only leads that came from Meta lead forms or ad clicks. On: every lead with an email or phone, matched by hashed contact details.</span></span>
              </label>
            </div>
          </Panel>
          <Panel id="st" title="Stages to report" description="Use the same event names in Events Manager when you set up your CRM funnel. Leave a stage blank to skip it.">
            <StageMap value={f.stageEvents} onChange={set("stageEvents")} columnLabel="Event name sent" placeholder="Not reported"
              hint="Names, emails and phone numbers are hashed before they leave the CRM. Leads that refused consent are never sent." />
            <div className="flex justify-end"><Button type="submit" size="sm" disabled={!!busy}><Saving on={busy === "save"} /> Save</Button></div>
          </Panel>
        </form>
      )}
      <ConversionLog destination="META" platform="Meta" />
    </DetailShell>
  );
}
