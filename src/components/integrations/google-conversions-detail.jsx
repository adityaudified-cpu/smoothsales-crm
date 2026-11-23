"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, LogIn, Unplug, Zap } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { googleOAuthApi } from "@/lib/api/integrations";
import { ConversionLog, StageMap } from "./conversion-log";
import { Confirm, CopyField, DetailShell, LoadError, Panel, Rows, Saving, Status, useIntegration } from "./shared";

const PATH = "/integrations/google_oci";

export function GoogleConversionsDetail() {
  const router = useRouter();
  const { state, data, busy, load, save, test, remove } = useIntegration("google_oci");
  const [f, setF] = useState(null);
  const [signing, setSigning] = useState(false);
  const [redirectUri, setRedirectUri] = useState("");
  const handled = useRef(false);

  useEffect(() => { setRedirectUri(window.location.origin + PATH); }, []);

  useEffect(() => {
    if (!data) return;
    const c = data.config || {};
    setF({
      customerId: c.customerId || "", loginCustomerId: c.loginCustomerId || "", clientId: c.clientId || "", clientSecret: "",
      currency: c.currency || "INR", allLeads: !!c.allLeads, adConsentCollected: !!c.adConsentCollected, stageActions: c.stageActions || {},
    });
  }, [data]);

  // Back from Google's consent screen.
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    if (handled.current || (!q.get("code") && !q.get("error"))) return;
    handled.current = true;
    router.replace(PATH);
    if (q.get("error")) {
      toast.error(q.get("error") === "access_denied" ? "Google sign-in was cancelled" : "Google sign-in failed");
      return;
    }
    setSigning(true);
    googleOAuthApi.complete(q.get("code"), q.get("state"))
      .then(() => { toast.success("Google connected"); return load(); })
      .catch((e) => toast.error(e?.message || "Google sign-in failed"))
      .finally(() => setSigning(false));
  }, [load, router]);

  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e?.target ? e.target.value : e }));
  const config = () => ({ ...f, clientId: f.clientId.trim(), currency: f.currency.trim().toUpperCase() });
  const signedIn = !!data?.secretHints?.refreshToken;
  const secretSaved = !!data?.secretHints?.clientSecret;

  const signIn = async () => {
    setSigning(true);
    try {
      if (!(await save({ config: config() }))) { setSigning(false); return; }
      const { url } = await googleOAuthApi.start(redirectUri);
      window.location.href = url;
    } catch (e) {
      toast.error(e?.message || "Could not start Google sign-in");
      setSigning(false);
    }
  };
  const signOut = async () => {
    try {
      await googleOAuthApi.disconnect();
      toast.success("Signed out of Google");
      load();
    } catch (e) {
      toast.error(e?.message || "Could not sign out");
    }
  };
  const toggle = (on) => save({ enabled: on, config: on ? config() : {} }, on ? "Uploads are on" : "Uploads are paused");

  return (
    <DetailShell integrationKey="google_oci" title="Google Ads Conversions" status={data?.status}
      description="Uploads qualified leads and bookings to Google Ads through the Data Manager API, so bidding learns which clicks turn into customers."
      testMessage={data?.lastTestMessage} testedAt={data?.lastTestedAt} testOk={data?.lastTestStatus === "OK"}
      actions={state === "ready" && f && (
        <>
          <label className="flex items-center gap-2 text-xs font-medium text-foreground">
            <Switch checked={!!data.enabled} onCheckedChange={toggle} disabled={!!busy || (!signedIn && !data.enabled)} /> Upload conversions
          </label>
          <Button variant="outline" size="sm" onClick={test} disabled={!!busy || !signedIn}><Saving on={busy === "test"} />{busy !== "test" && <Zap />} Check connection</Button>
          {data.configured && (
            <Confirm trigger={<Button variant="outline" size="sm" disabled={!!busy}><Unplug /> Disconnect</Button>}
              title="Disconnect Google conversions?" action="Disconnect" onConfirm={remove}
              description="The Google sign-in, account and stage rules are deleted and uploads stop. The conversion log is kept." />
          )}
        </>
      )}>
      {state === "loading" && <Rows count={6} />}
      {state === "error" && <LoadError message="Could not load this integration." onRetry={load} />}
      {state === "ready" && f && (
        <form onSubmit={(e) => { e.preventDefault(); save({ config: config() }); }} className="grid gap-4 lg:grid-cols-2 items-start">
          <div className="space-y-4 min-w-0">
            <Panel id="gc" title="Google sign-in"
              description="Create an OAuth client (Web application) in Google Cloud with the Data Manager API enabled, then sign in with a user who can manage conversions in this Google Ads account."
              action={<Status tone={signedIn ? "success" : "muted"}>{signedIn ? "Signed in" : "Not signed in"}</Status>}>
              <div className="grid gap-3">
                <CopyField label="Authorised redirect URI" value={redirectUri} />
                <div className="space-y-1.5">
                  <Label htmlFor="go-id" className="text-xs">OAuth client ID</Label>
                  <Input id="go-id" autoComplete="off" value={f.clientId} onChange={set("clientId")} placeholder="…apps.googleusercontent.com" className="h-8 text-xs font-mono" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="go-secret" className="text-xs">OAuth client secret</Label>
                  <Input id="go-secret" type="password" autoComplete="new-password" value={f.clientSecret} onChange={set("clientSecret")} className="h-8 text-xs font-mono"
                    placeholder={secretSaved ? `Saved (${data.secretHints.clientSecret}). Leave blank to keep it` : "Paste the client secret"} />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button type="button" size="sm" onClick={signIn} disabled={signing || !!busy || !f.clientId.trim() || (!secretSaved && !f.clientSecret)}>
                    <Saving on={signing} />{!signing && <LogIn />} {signedIn ? "Sign in again" : "Save & sign in with Google"}
                  </Button>
                  {signedIn && <Button type="button" variant="outline" size="sm" onClick={signOut}>Sign out</Button>}
                  <a href="https://console.cloud.google.com/apis/library/datamanager.googleapis.com" target="_blank" rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline">Enable Data Manager API <ExternalLink className="h-3 w-3" aria-hidden /></a>
                </div>
                <p className="text-xs text-muted-foreground">While the Google Cloud app is in “Testing”, Google expires the sign-in after 7 days. Publish the app to keep it.</p>
              </div>
            </Panel>
            <Panel id="ga" title="Google Ads account">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="go-cust" className="text-xs">Customer ID</Label>
                  <Input id="go-cust" value={f.customerId} onChange={set("customerId")} placeholder="123-456-7890" className="h-8 text-xs font-mono" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="go-login" className="text-xs">Manager account ID (optional)</Label>
                  <Input id="go-login" value={f.loginCustomerId} onChange={set("loginCustomerId")} placeholder="Only for MCC access" className="h-8 text-xs font-mono" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="go-cur" className="text-xs">Currency of lead value</Label>
                  <Input id="go-cur" maxLength={3} value={f.currency} onChange={set("currency")} className="h-8 text-xs font-mono uppercase" />
                </div>
              </div>
              <label className="flex items-start gap-2 text-sm text-foreground">
                <Switch checked={f.adConsentCollected} onCheckedChange={set("adConsentCollected")} className="mt-0.5" />
                <span>My forms collect ad consent<span className="block text-xs text-muted-foreground">Sends “consent granted” with each conversion. Turn on only if your forms really ask for it. Leads that refused are never sent.</span></span>
              </label>
              <label className="flex items-start gap-2 text-sm text-foreground">
                <Switch checked={f.allLeads} onCheckedChange={set("allLeads")} className="mt-0.5" />
                <span>Upload every lead<span className="block text-xs text-muted-foreground">Off: only leads from Google lead forms or with a Google click ID. On: every lead with an email or phone (enhanced conversions for leads).</span></span>
              </label>
            </Panel>
          </div>
          <Panel id="gs" title="Stages to upload" description="Enter the ID of an “Import” conversion action. In Google Ads open Goals → Conversions, click the action and copy ctId from the address bar.">
            <StageMap value={f.stageActions} onChange={set("stageActions")} columnLabel="Conversion action ID" placeholder="Not uploaded" inputMode="numeric"
              hint="Emails and phone numbers are hashed before they leave the CRM. Google can take up to a day to show an upload in reports." />
            <div className="flex justify-end"><Button type="submit" size="sm" disabled={!!busy}><Saving on={busy === "save"} /> Save</Button></div>
          </Panel>
        </form>
      )}
      <ConversionLog destination="GOOGLE" platform="Google Ads" />
    </DetailShell>
  );
}
