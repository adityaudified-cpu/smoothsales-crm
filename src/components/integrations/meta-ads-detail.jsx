"use client";

import { useCallback, useEffect, useState } from "react";
import { Bell, ChevronDown, Download, Plus, RefreshCw, RotateCw, Trash2, Unplug, Zap } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { MetaAppSettings } from "@/components/whatsapp/meta-app-settings";
import { metaAdminApi } from "@/lib/api/integrations";
import { cn } from "@/lib/utils";
import { DeliveryLog } from "./delivery-log";
import { Confirm, DetailShell, Empty, LoadError, Panel, Rows, Saving, Status, ago, useIntegration } from "./shared";

const NEEDED = ["leads_retrieval", "pages_show_list", "pages_read_engagement", "pages_manage_metadata"];

function Forms({ page }) {
  const [state, setState] = useState("loading");
  const [forms, setForms] = useState([]);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    setState("loading");
    try {
      setForms(await metaAdminApi.listForms(page.pageId));
      setState("ready");
    } catch (e) {
      setError(e?.message || "");
      setState("error");
    }
  }, [page.pageId]);
  useEffect(() => { load(); }, [load]);

  const toggle = async (form, on) => {
    setForms((list) => list.map((x) => (x.id === form.id ? { ...x, active: on } : x)));
    try {
      await metaAdminApi.toggleFormActive(page.pageId, form.id, on);
    } catch (e) {
      setForms((list) => list.map((x) => (x.id === form.id ? { ...x, active: !on } : x)));
      toast.error(e?.message || "Could not change the form");
    }
  };

  if (state === "loading") return <Rows count={2} />;
  if (state === "error") return <LoadError message={error || "Could not load forms from Meta."} onRetry={load} />;
  if (forms.length === 0) return <Empty>This page has no lead forms yet. Create one in Ads Manager.</Empty>;
  return (
    <ul className="divide-y divide-border rounded-md border border-border">
      {forms.map((form) => (
        <li key={form.id} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 px-3 py-2">
          <div className="min-w-0">
            <p className="text-sm text-foreground truncate">{form.name || "Untitled form"}</p>
            <p className="text-xs text-muted-foreground"><span className="font-mono">{form.id}</span>{form.leads_count != null && <> · <span className="tabular">{form.leads_count}</span> leads</>}{form.status && form.status !== "ACTIVE" && ` · ${form.status.toLowerCase()} in Meta`}</p>
          </div>
          <label className="flex items-center gap-2 text-xs text-muted-foreground">Capture <Switch checked={form.active !== false} onCheckedChange={(on) => toggle(form, on)} aria-label={`Capture leads from ${form.name}`} /></label>
        </li>
      ))}
    </ul>
  );
}

function Pages({ connected, reloadKey }) {
  const [state, setState] = useState("loading");
  const [pages, setPages] = useState([]);
  const [open, setOpen] = useState(null);
  const [busy, setBusy] = useState(null);
  const [newId, setNewId] = useState("");

  const load = useCallback(async () => {
    try {
      const list = await metaAdminApi.listPages();
      setPages(Array.isArray(list) ? list : []);
      setState("ready");
    } catch (e) {
      setState(e?.status === 403 ? "forbidden" : "error");
    }
  }, []);
  useEffect(() => { load(); }, [load, reloadKey]);

  const run = async (id, work, done) => {
    setBusy(id);
    try {
      const r = await work();
      const message = typeof done === "function" ? done(r) : done;
      if (message?.error) toast.error(message.error); else if (message) toast.success(message);
      await load();
      return true;
    } catch (e) {
      toast.error(e?.message || "Meta did not accept this");
      return false;
    } finally {
      setBusy(null);
    }
  };

  const sync = () => run("sync", () => metaAdminApi.syncPages(), (r) => (r?.length ? `${r.length} page(s) found` : { error: "No new page is visible to this token" }));
  const backfill = (p) => run(`b-${p.pageId}`, () => metaAdminApi.triggerBackfill(p.pageId, String(Math.floor(Date.now() / 1000) - 30 * 86400)), (runs) => {
    const r = runs?.[0];
    if (!r) return { error: "Nothing was checked" };
    if (r.errorCount > 0) return { error: r.errorSummary || "Meta returned errors" };
    return `${r.insertedCount} new, ${r.duplicateCount} already in the CRM`;
  });

  return (
    <Panel id="pages" title="Facebook pages" description="Leads are captured from pages that are subscribed and switched on."
      action={<Button size="sm" variant="outline" onClick={sync} disabled={!connected || !!busy}>{busy === "sync" ? <Saving on /> : <RefreshCw />} Find pages</Button>}>
      {state === "loading" && <Rows count={3} />}
      {state === "error" && <LoadError message="Could not load pages." onRetry={load} />}
      {state === "forbidden" && <Empty>Only workspace admins can manage Meta pages.</Empty>}
      {state === "ready" && (
        <>
          {pages.length === 0 ? (
            <Empty>{connected ? "No pages yet. Use “Find pages” to load the ones your token can see." : "Save a Meta access token first."}</Empty>
          ) : (
            <ul className="divide-y divide-border border-y border-border">
              {pages.map((p) => (
                <li key={p.pageId} className="py-3 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">{p.pageName}</p>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
                        <span className="font-mono text-xs text-muted-foreground">{p.pageId}</span>
                        <Status tone={!p.active ? "muted" : p.webhookSubscribed ? "success" : "warning"}>{!p.active ? "Paused" : p.webhookSubscribed ? "Live" : "Not subscribed"}</Status>
                        {p.lastSyncedAt && <span className="text-xs text-muted-foreground">checked {ago(p.lastSyncedAt)}</span>}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {!p.webhookSubscribed && (
                        <Button size="sm" disabled={!!busy} onClick={() => run(`s-${p.pageId}`, () => metaAdminApi.subscribePage(p.pageId), (r) => (r?.subscribed ? "Subscribed" : { error: "Meta did not subscribe the page" }))}>
                          {busy === `s-${p.pageId}` ? <Saving on /> : <Bell />} Subscribe
                        </Button>
                      )}
                      <Button size="sm" variant="outline" disabled={!!busy} onClick={() => backfill(p)}>{busy === `b-${p.pageId}` ? <Saving on /> : <Download />} Last 30 days</Button>
                      <Button size="sm" variant="outline" aria-expanded={open === p.pageId} onClick={() => setOpen(open === p.pageId ? null : p.pageId)}>Forms <ChevronDown className={cn("transition-transform", open === p.pageId && "rotate-180")} /></Button>
                      <Switch checked={p.active} disabled={!!busy} aria-label={`Capture leads from ${p.pageName}`} onCheckedChange={(on) => run(`a-${p.pageId}`, () => metaAdminApi.togglePageActive(p.pageId, on), on ? "Page is live" : "Page is paused")} />
                      <Confirm
                        trigger={
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/30"
                            aria-label={`Delete ${p.pageName}`}
                            disabled={!!busy}
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
                          </Button>
                        }
                        title={`Delete ${p.pageName}?`}
                        action="Delete"
                        onConfirm={() => run(`d-${p.pageId}`, () => metaAdminApi.deletePage(p.pageId), "Page deleted")}
                        description="New leads from this page will no longer be captured. Existing leads in the CRM will be kept."
                      />
                    </div>
                  </div>
                  {open === p.pageId && <Forms page={p} />}
                </li>
              ))}
            </ul>
          )}
          <form className="flex flex-wrap items-end gap-2" onSubmit={async (e) => {
            e.preventDefault();
            if (await run("add", () => metaAdminApi.addPageManual(newId), "Page added")) setNewId("");
          }}>
            <div className="space-y-1.5">
              <Label htmlFor="mp-id" className="text-xs">Page missing? Add it by ID</Label>
              <Input id="mp-id" inputMode="numeric" value={newId} onChange={(e) => setNewId(e.target.value.replace(/\D/g, ""))} placeholder="Facebook page ID" className="h-8 w-56 text-xs font-mono" />
            </div>
            <Button type="submit" size="sm" variant="outline" disabled={!connected || !newId || !!busy}>{busy === "add" ? <Saving on /> : <Plus />} Add page</Button>
          </form>
        </>
      )}
    </Panel>
  );
}

function AdAccounts({ connected, reloadKey }) {
  const [state, setState] = useState("loading");
  const [items, setItems] = useState([]);
  const [busyItem, setBusyItem] = useState(null);
  const [newId, setNewId] = useState("");
  const [newName, setNewName] = useState("");
  const [busyAdd, setBusyAdd] = useState(false);

  const load = useCallback(async () => {
    try {
      const list = await metaAdminApi.listAdAccounts();
      setItems(Array.isArray(list) ? list : []);
      setState("ready");
    } catch (e) {
      setState(e?.status === 403 ? "hidden" : "error");
    }
  }, []);
  useEffect(() => { load(); }, [load, reloadKey]);

  const act = async (work, message, id) => {
    if (id) setBusyItem(id);
    try {
      await work();
      toast.success(message);
      await load();
    } catch (e) {
      toast.error(e?.message || "Could not change the ad account");
    } finally {
      if (id) setBusyItem(null);
    }
  };

  if (state === "hidden") return null;
  return (
    <Panel id="accts" title="Ad accounts" description="Used to show which ad account a lead came from. “Find pages” refreshes this list.">
      {state === "loading" && <Rows count={2} />}
      {state === "error" && <LoadError message="Could not load ad accounts." onRetry={load} />}
      {state === "ready" && (
        <>
          {items.length === 0 ? (
            <Empty>{connected ? "No ad accounts linked yet. Use “Find pages” or add an account ID below." : "Save a Meta access token first."}</Empty>
          ) : (
            <ul className="divide-y divide-border border-y border-border">
              {items.map((a) => (
                <li key={a.adAccountId} className="flex flex-wrap items-center justify-between gap-3 py-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{a.name}</p>
                    <p className="font-mono text-xs text-muted-foreground">{a.adAccountId}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={a.active}
                      disabled={busyItem === a.adAccountId}
                      aria-label={`Use ${a.name}`}
                      onCheckedChange={(on) => act(() => metaAdminApi.toggleAdAccountActive(a.adAccountId, on), on ? "Account active" : "Account paused", a.adAccountId)}
                    />
                    <Confirm
                      trigger={
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/30"
                          aria-label={`Delete ${a.name}`}
                          disabled={busyItem === a.adAccountId}
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
                        </Button>
                      }
                      title={`Delete ${a.name}?`}
                      action="Delete"
                      description="Only the link in the CRM is removed. Nothing changes in Meta Business Manager."
                      onConfirm={() => act(() => metaAdminApi.deleteAdAccount(a.adAccountId), "Ad account deleted", a.adAccountId)}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
          <form className="flex flex-wrap items-end gap-2 pt-2" onSubmit={async (e) => {
            e.preventDefault();
            if (!newId.trim()) return;
            setBusyAdd(true);
            try {
              await metaAdminApi.addAdAccount(newId.trim(), newName.trim() || undefined);
              toast.success("Ad account linked");
              setNewId("");
              setNewName("");
              await load();
            } catch (err) {
              toast.error(err?.message || "Could not link ad account");
            } finally {
              setBusyAdd(false);
            }
          }}>
            <div className="space-y-1.5">
              <Label htmlFor="ma-acc-id" className="text-xs">Account missing? Add by ID</Label>
              <Input id="ma-acc-id" value={newId} onChange={(e) => setNewId(e.target.value.trim())} placeholder="e.g. act_123456789" className="h-8 w-48 text-xs font-mono" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ma-acc-name" className="text-xs">Account name (optional)</Label>
              <Input id="ma-acc-name" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Main Ads" className="h-8 w-44 text-xs" />
            </div>
            <Button type="submit" size="sm" variant="outline" disabled={!connected || !newId.trim() || busyAdd}>
              {busyAdd ? <Saving on /> : <Plus className="h-3.5 w-3.5 mr-1" />} Add account
            </Button>
          </form>
        </>
      )}
    </Panel>
  );
}

function Health({ reloadKey }) {
  const [state, setState] = useState("loading");
  const [d, setD] = useState(null);
  const load = useCallback(async () => {
    setState("loading");
    try {
      setD(await metaAdminApi.getDiagnostics());
      setState("ready");
    } catch (e) {
      setState(e?.status === 403 ? "hidden" : "error");
    }
  }, []);
  useEffect(() => { load(); }, [load, reloadKey]);
  if (state === "hidden") return null;
  const missing = NEEDED.filter((p) => !(d?.grantedPermissions || []).includes(p));
  const issues = (d?.pages || []).filter((p) => p.error);
  return (
    <Panel id="health" title="Health" description="Checked live with Meta."
      action={<Button variant="outline" size="icon" className="h-8 w-8" aria-label="Check again" onClick={load} disabled={state === "loading"}><RefreshCw className={state === "loading" ? "animate-spin" : undefined} /></Button>}>
      {state === "loading" && <Rows count={3} />}
      {state === "error" && <LoadError message="Meta could not be checked." onRetry={load} />}
      {state === "ready" && (
        <ul className="space-y-2 text-sm">
          <li className="flex flex-wrap items-center gap-x-2"><Status tone={d.tokenValid ? "success" : "destructive"}>Access token</Status><span className="text-xs text-muted-foreground">{d.tokenValid ? `Works, owned by ${d.tokenOwnerName || d.tokenOwnerId}` : d.statusMessage}</span></li>
          {d.tokenValid && <li className="flex flex-wrap items-center gap-x-2"><Status tone={missing.length ? "destructive" : "success"}>Permissions</Status><span className="text-xs text-muted-foreground">{missing.length ? <>Missing <span className="font-mono text-foreground">{missing.join(", ")}</span></> : "All granted"}</span></li>}
          {d.tokenValid && <li className="flex flex-wrap items-center gap-x-2"><Status tone={(d.pages || []).length ? "success" : "warning"}>Pages</Status><span className="text-xs text-muted-foreground">{(d.pages || []).length} visible, {(d.pages || []).filter((p) => p.webhookSubscribed).length} subscribed</span></li>}
          {issues.map((p) => <li key={p.pageId} className="text-xs text-foreground"><Status tone="warning" className="mr-2">{p.pageName}</Status>{p.error}</li>)}
        </ul>
      )}
    </Panel>
  );
}

export function MetaAdsDetail() {
  const { state, data, busy, load, save, test, remove } = useIntegration("meta_ads");
  const [token, setToken] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const tokenSaved = !!(data?.secretHints?.accessToken || data?.secretHints?.systemUserToken);

  const submit = async (e) => {
    e.preventDefault();
    if (await save({ enabled: true, config: { accessToken: token.trim() } }, "Token saved")) {
      setToken("");
      await test();
      setReloadKey((k) => k + 1);
    }
  };
  const requeue = async () => {
    try {
      const r = await metaAdminApi.requeueEvents("FAILED_PERMANENT");
      toast.success(r?.requeuedCount ? `${r.requeuedCount} delivery(s) queued again` : "Nothing to retry");
    } catch (e) {
      toast.error(e?.message || "Could not retry");
    }
  };

  return (
    <DetailShell integrationKey="meta_ads" title="Meta Lead Ads" status={data?.status}
      description="Leads from Facebook and Instagram lead forms, in real time, with campaign and ad details."
      testMessage={data?.lastTestMessage} testedAt={data?.lastTestedAt} testOk={data?.lastTestStatus === "OK"}
      actions={state === "ready" && (
        <div className="flex items-center gap-2">
          {tokenSaved && (
            <Button variant="outline" size="sm" onClick={test} disabled={!!busy}>
              <Saving on={busy === "test"} />
              {busy !== "test" && <Zap className="h-3.5 w-3.5 mr-1" />} Check connection
            </Button>
          )}
          <Confirm
            trigger={
              <Button
                variant="outline"
                size="sm"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/30"
                disabled={!!busy}
              >
                <Unplug className="h-3.5 w-3.5 mr-1" /> Disconnect
              </Button>
            }
            title="Disconnect Meta Lead Ads?"
            action="Disconnect"
            onConfirm={async () => {
              await remove();
              setReloadKey((k) => k + 1);
            }}
            description="The access token, connected Facebook pages, and ad accounts will be removed from your CRM. Existing leads will remain safe."
          />
        </div>
      )}>
      {state === "loading" && <Rows count={6} />}
      {state === "error" && <LoadError message="Could not load this integration." onRetry={load} />}
      {state === "ready" && (
        <>
          <div className="grid gap-4 lg:grid-cols-2 items-start">
            <Panel id="tok" title="Access token" description="Business Settings → System users → Generate token. Assign your pages and ad accounts to that system user.">
              <form onSubmit={submit} className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="ma-token" className="text-xs">System user access token</Label>
                  <Input id="ma-token" type="password" autoComplete="new-password" value={token} onChange={(e) => setToken(e.target.value)} className="h-8 text-xs font-mono"
                    placeholder={tokenSaved ? `Saved (${data.secretHints.accessToken || data.secretHints.systemUserToken}). Paste to replace` : "EAAB…"} />
                </div>
                <p className="text-xs text-muted-foreground">Permissions: <span className="font-mono">{[...NEEDED, "ads_read"].join(", ")}</span></p>
                <div className="flex justify-end"><Button type="submit" size="sm" disabled={!token.trim() || !!busy}><Saving on={busy === "save" || busy === "test"} /> Save & check</Button></div>
              </form>
            </Panel>
            {tokenSaved && <Health reloadKey={reloadKey} />}
          </div>
          <Pages connected={tokenSaved} reloadKey={reloadKey} />
          <AdAccounts connected={tokenSaved} reloadKey={reloadKey} />
          <MetaAppSettings product="leads" fields={[["leadgen", "Object: Page. Sends every new lead."]]} />
          <DeliveryLog source="META_LEAD_AD" description="The last 100 lead notifications from Meta for your pages." emptyText="No lead received yet. Subscribe a page, then use Meta’s Lead Ads Testing Tool."
            action={<Button variant="outline" size="sm" onClick={requeue}><RotateCw /> Retry failed</Button>} />
        </>
      )}
    </DetailShell>
  );
}
