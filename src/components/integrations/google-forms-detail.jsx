"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Eye, KeyRound, Plus, RefreshCw, RotateCw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { usersApi } from "@/lib/api/customers";
import {
  createGoogleAdsIntegration, deleteGoogleAdsIntegration, getGoogleAdsEvents, getGoogleAdsMappings, getGoogleAdsStats,
  listGoogleAdsIntegrations, regenerateGoogleAdsKey, reprocessGoogleAdsEvent, saveGoogleAdsMappings, updateGoogleAdsIntegration,
} from "@/lib/api/google-ads";
import { Confirm, CopyField, DetailShell, Empty, LoadError, Panel, PayloadDialog, Rows, Saving, Status, ago, when } from "./shared";

const EVENT = {
  RECEIVED: ["info", "Received"], PROCESSED: ["success", "Lead created"], FAILED: ["destructive", "Failed"], TEST: ["muted", "Test"], PAUSED: ["muted", "Paused"],
};
const TARGETS = [["name", "Full name"], ["firstName", "First name"], ["lastName", "Last name"], ["phone", "Phone"], ["email", "Email"], ["city", "City"], ["company", "Company"], ["notes", "Notes"]];
const AUTO = "auto";

const userName = (u) => u.fullName || [u.firstName, u.lastName].filter(Boolean).join(" ") || u.name || u.email;

function KeyDialog({ item, onClose }) {
  return (
    <Dialog open={!!item} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Copy these into Google Ads</DialogTitle>
          <DialogDescription>In the lead form: Export leads → Other data integration options → Webhook integration. The key is shown only now.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 min-w-0">
          <CopyField label="Webhook URL" value={item?.webhookUrl} />
          <CopyField label="Key" value={item?.googleKey} />
        </div>
        <DialogFooter><Button size="sm" onClick={onClose}>I saved the key</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CreateDialog({ open, onOpenChange, users, onCreated }) {
  const [name, setName] = useState("");
  const [owner, setOwner] = useState(AUTO);
  const [saving, setSaving] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const created = await createGoogleAdsIntegration({ name: name.trim(), defaultOwnerId: owner === AUTO ? null : owner });
      setName("");
      setOwner(AUTO);
      onOpenChange(false);
      onCreated(created);
    } catch (err) {
      toast.error(err?.message || "Could not create the webhook");
    } finally {
      setSaving(false);
    }
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={submit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Connect a Google Ads account</DialogTitle>
            <DialogDescription>You get a webhook URL and key for its lead forms.</DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="gf-name" className="text-xs">Name</Label>
            <Input id="gf-name" required maxLength={100} value={name} onChange={(e) => setName(e.target.value)} placeholder="Main Google Ads account" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="gf-owner" className="text-xs">Assign leads to</Label>
            <OwnerSelect id="gf-owner" users={users} value={owner} onChange={setOwner} />
          </div>
          <DialogFooter><Button type="submit" size="sm" disabled={saving || !name.trim()}><Saving on={saving} /> Create webhook</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function OwnerSelect({ id, users, value, onChange, disabled }) {
  const known = value === AUTO || users.some((u) => u.id === value);
  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger id={id} className="h-8 text-xs"><SelectValue /></SelectTrigger>
      <SelectContent>
        <SelectItem value={AUTO}>Assignment rules</SelectItem>
        {users.map((u) => <SelectItem key={u.id} value={u.id}>{userName(u)}</SelectItem>)}
        {!known && <SelectItem value={value}>Current owner</SelectItem>}
      </SelectContent>
    </Select>
  );
}

function Mappings({ id }) {
  const [state, setState] = useState("loading");
  const [items, setItems] = useState([]);
  const [saving, setSaving] = useState(false);
  const load = useCallback(async () => {
    try {
      const list = await getGoogleAdsMappings(id);
      setItems((list || []).map((m) => ({ ...m, formId: m.formId ?? "", fields: Object.entries(m.fieldMapping || {}) })));
      setState("ready");
    } catch {
      setState("error");
    }
  }, [id]);
  useEffect(() => { load(); }, [load]);

  const patch = (i, p) => setItems((s) => s.map((m, j) => (j === i ? { ...m, ...p } : m)));
  const save = async () => {
    if (items.some((m) => !String(m.formId).trim())) { toast.error("Every rule needs a form ID"); return; }
    setSaving(true);
    try {
      await saveGoogleAdsMappings(id, items.map((m) => ({
        formId: Number(m.formId), campaignId: m.campaignId ?? null, label: m.label || null,
        fieldMapping: Object.fromEntries(m.fields.filter(([k]) => k.trim()).map(([k, v]) => [k.trim(), v])),
      })));
      toast.success("Field rules saved");
      await load();
    } catch (e) {
      toast.error(e?.message || "Could not save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Panel id="gmap" title="Custom questions" description="Standard answers (name, phone, email, city, company) are matched automatically. Other answers go to the lead’s notes unless you map them here."
      action={state === "ready" && <Button size="sm" onClick={save} disabled={saving}><Saving on={saving} /> Save</Button>}>
      {state === "loading" && <Rows count={2} />}
      {state === "error" && <LoadError message="Could not load field rules." onRetry={load} />}
      {state === "ready" && (
        <div className="space-y-4">
          {items.length === 0 && <Empty>No rules. All custom answers are saved as notes.</Empty>}
          {items.map((m, i) => (
            <div key={i} className="rounded-md border border-border p-3 space-y-2">
              <div className="flex items-end gap-2">
                <div className="flex-1 space-y-1.5"><Label htmlFor={`gm-${i}`} className="text-xs">Form ID</Label>
                  <Input id={`gm-${i}`} inputMode="numeric" value={m.formId} onChange={(e) => patch(i, { formId: e.target.value.replace(/\D/g, "") })} className="h-8 text-xs font-mono" /></div>
                <Button type="button" variant="ghost" size="icon" className="h-8 w-8" aria-label="Remove form rule" onClick={() => setItems((s) => s.filter((_, j) => j !== i))}><Trash2 /></Button>
              </div>
              {m.fields.map(([k, v], x) => (
                <div key={x} className="flex items-center gap-2">
                  <Input aria-label="Question or column ID" value={k} onChange={(e) => patch(i, { fields: m.fields.map((p, y) => (y === x ? [e.target.value, p[1]] : p)) })} placeholder="Question or column ID" className="h-8 text-xs" />
                  <Select value={v} onValueChange={(nv) => patch(i, { fields: m.fields.map((p, y) => (y === x ? [p[0], nv] : p)) })}>
                    <SelectTrigger className="h-8 w-32 shrink-0 text-xs" aria-label="Lead field"><SelectValue /></SelectTrigger>
                    <SelectContent>{TARGETS.map(([t, l]) => <SelectItem key={t} value={t}>{l}</SelectItem>)}</SelectContent>
                  </Select>
                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0" aria-label="Remove field" onClick={() => patch(i, { fields: m.fields.filter((_, y) => y !== x) })}><Trash2 /></Button>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={() => patch(i, { fields: [...m.fields, ["", "notes"]] })}><Plus /> Add field</Button>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={() => setItems((s) => [...s, { formId: "", fields: [["", "notes"]] }])}><Plus /> Add form</Button>
        </div>
      )}
    </Panel>
  );
}

function Events({ id, onChanged }) {
  const [state, setState] = useState("loading");
  const [data, setData] = useState({ content: [], totalElements: 0, totalPages: 0 });
  const [status, setStatus] = useState("ALL");
  const [page, setPage] = useState(0);
  const [open, setOpen] = useState(null);
  const [busy, setBusy] = useState(null);

  const load = useCallback(async () => {
    try {
      const r = await getGoogleAdsEvents(id, { status, page, size: 20 });
      setData({ content: r?.content || r?.items || [], totalPages: r?.totalPages ?? r?.page?.totalPages ?? 1 });
      setState("ready");
    } catch {
      setState("error");
    }
  }, [id, status, page]);
  useEffect(() => { load(); }, [load]);

  const retry = async (eventId) => {
    setBusy(eventId);
    try {
      const r = await reprocessGoogleAdsEvent(id, eventId);
      if (r?.success) toast.success("Lead created");
      else toast.error("Still not usable. See the reason in the list.");
      await load();
      onChanged();
    } catch (e) {
      toast.error(e?.message || "Could not process it again");
    } finally {
      setBusy(null);
    }
  };

  return (
    <Panel id="gev" title="Submissions" description="Everything Google sent. Failed ones are retried automatically."
      action={
        <div className="flex items-center gap-2">
          <Select value={status} onValueChange={(v) => { setStatus(v); setPage(0); }}>
            <SelectTrigger className="h-8 w-32 text-xs" aria-label="Filter by status"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="ALL">All</SelectItem>{Object.entries(EVENT).map(([k, [, l]]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}</SelectContent>
          </Select>
          <Button variant="outline" size="icon" className="h-8 w-8" aria-label="Refresh" onClick={() => { load(); onChanged(); }}><RefreshCw /></Button>
        </div>
      }>
      {state === "loading" && <Rows />}
      {state === "error" && <LoadError message="Could not load submissions." onRetry={load} />}
      {state === "ready" && data.content.length === 0 && <Empty>{status === "ALL" ? "Nothing yet. Press “Send test data” in the Google Ads lead form to check the connection." : "None with this status."}</Empty>}
      {state === "ready" && data.content.length > 0 && (
        <ul className="divide-y divide-border border-y border-border">
          {data.content.map((e) => {
            const [tone, label] = EVENT[e.status] || ["muted", e.status];
            return (
              <li key={e.id} className="py-2 grid gap-x-4 gap-y-1 sm:grid-cols-[8rem_1fr_auto] items-center">
                <Status tone={tone}>{label}</Status>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground"><span title={when(e.createdAt)}>{ago(e.createdAt)}</span>{e.formId && <> · form <span className="font-mono">{e.formId}</span></>}{e.gclid && " · click ID"}
                    {e.crmLeadId && <> · <Link className="underline underline-offset-2 hover:text-foreground" href={`/leads/customers/${e.crmLeadId}`}>Open lead</Link></>}</p>
                  {e.errorMessage && <p className="text-xs text-foreground break-words">{e.errorMessage}</p>}
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => setOpen(e)}><Eye /> View</Button>
                  {["FAILED", "PAUSED"].includes(e.status) && <Button variant="outline" size="sm" disabled={busy === e.id} onClick={() => retry(e.id)}>{busy === e.id ? <Saving on /> : <RotateCw />} Create lead</Button>}
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {data.totalPages > 1 && (
        <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground">
          <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>Previous</Button>
          <span className="tabular">{page + 1} of {data.totalPages}</span>
          <Button variant="outline" size="sm" disabled={page + 1 >= data.totalPages} onClick={() => setPage(page + 1)}>Next</Button>
        </div>
      )}
      <PayloadDialog event={open} onClose={() => setOpen(null)} />
    </Panel>
  );
}

function Account({ item, users, onChanged, onKey }) {
  const [stats, setStats] = useState(null);
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState(item.name);

  useEffect(() => { setName(item.name); }, [item.name]);
  const loadStats = useCallback(() => { getGoogleAdsStats(item.id).then(setStats).catch(() => setStats(null)); }, [item.id]);
  useEffect(() => { loadStats(); }, [loadStats]);

  const run = async (work, message) => {
    setBusy(true);
    try {
      const r = await work();
      if (message) toast.success(message);
      await onChanged();
      return r;
    } catch (e) {
      toast.error(e?.message || "Could not save");
    } finally {
      setBusy(false);
    }
  };
  const update = (body, message) => run(() => updateGoogleAdsIntegration(item.id, body), message);

  return (
    <div className="space-y-4 min-w-0">
      <Panel id="gacc" title={item.name}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-2 text-xs font-medium text-foreground">
              <Switch checked={item.status === "ACTIVE"} disabled={busy} onCheckedChange={(on) => update({ status: on ? "ACTIVE" : "PAUSED" }, on ? "Lead capture is on" : "Lead capture is paused")} /> Capture leads
            </label>
            <Confirm trigger={<Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Delete this webhook" disabled={busy}><Trash2 /></Button>}
              title={`Delete ${item.name}?`} action="Delete" onConfirm={() => run(() => deleteGoogleAdsIntegration(item.id), "Webhook deleted")}
              description="Google can no longer deliver leads to this webhook, and its submission history is deleted. Leads already created are kept." />
          </div>
        }>
        <dl className="flex flex-wrap gap-x-6 gap-y-2 text-xs">
          {[["Today", stats?.leadsToday], ["7 days", stats?.leads7d], ["30 days", stats?.leads30d], ["All time", stats?.totalLeads], ["Failed", stats?.failureCount]].map(([k, v]) => (
            <div key={k} className="flex items-baseline gap-1.5"><dt className="text-muted-foreground">{k}</dt><dd className="font-semibold tabular text-foreground">{v ?? "–"}</dd></div>
          ))}
          <div className="text-muted-foreground">last lead {item.lastLeadAt ? ago(item.lastLeadAt) : "never"}</div>
        </dl>
        <div className="grid gap-3 md:grid-cols-2">
          <CopyField label="Webhook URL" value={item.webhookUrl} />
          <div className="flex items-end gap-2 min-w-0">
            <div className="flex-1 min-w-0"><CopyField label="Key" value={item.googleKeyHint} canCopy={false} /></div>
            <Confirm trigger={<Button variant="outline" size="sm" disabled={busy}><KeyRound /> New key</Button>}
              title="Create a new key?" action="Create new key" onConfirm={async () => { const r = await run(() => regenerateGoogleAdsKey(item.id)); if (r) onKey(r); }}
              description="The current key stops working immediately. Update it in every Google Ads lead form that uses this webhook." />
          </div>
          <form className="space-y-1.5" onSubmit={(e) => { e.preventDefault(); update({ name: name.trim() }, "Name saved"); }}>
            <Label htmlFor="ga-name" className="text-xs">Name</Label>
            <div className="flex gap-2">
              <Input id="ga-name" value={name} maxLength={100} onChange={(e) => setName(e.target.value)} className="h-8 text-xs" />
              <Button type="submit" variant="outline" size="sm" disabled={busy || !name.trim() || name.trim() === item.name}>Save</Button>
            </div>
          </form>
          <div className="space-y-1.5">
            <Label htmlFor="ga-owner" className="text-xs">Assign leads to</Label>
            <OwnerSelect id="ga-owner" users={users} disabled={busy} value={item.defaultOwnerId || AUTO}
              onChange={(v) => update(v === AUTO ? { clearDefaultOwner: true } : { defaultOwnerId: v }, "Saved")} />
          </div>
        </div>
      </Panel>
      <Events key={`e-${item.id}`} id={item.id} onChanged={loadStats} />
      <Mappings key={`m-${item.id}`} id={item.id} />
    </div>
  );
}

export function GoogleFormsDetail() {
  const [state, setState] = useState("loading");
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [users, setUsers] = useState([]);
  const [creating, setCreating] = useState(false);
  const [shownKey, setShownKey] = useState(null);

  const load = useCallback(async () => {
    try {
      const list = await listGoogleAdsIntegrations();
      setItems(Array.isArray(list) ? list : []);
      setState("ready");
    } catch {
      setState("error");
    }
  }, []);
  useEffect(() => {
    load();
    usersApi.assignable().then((r) => setUsers(Array.isArray(r) ? r : r?.content || r?.items || [])).catch(() => setUsers([]));
  }, [load]);

  const current = items.find((i) => i.id === selected) || items[0];
  const status = state !== "ready" ? null : !items.length ? "not_configured" : items.some((i) => i.status === "ACTIVE") ? "connected" : "disabled";

  return (
    <DetailShell integrationKey="google_ads" title="Google Ads Lead Forms" status={status}
      description="Leads from Google Ads lead form assets, with campaign, form and click ID."
      actions={<Button size="sm" onClick={() => setCreating(true)}><Plus /> Connect account</Button>}>
      {state === "loading" && <Rows count={6} />}
      {state === "error" && <LoadError message="Could not load Google Ads accounts." onRetry={load} />}
      {state === "ready" && !current && <Empty>No Google Ads account yet. Connect one to get a webhook URL and key for its lead forms.</Empty>}
      {state === "ready" && current && (
        <>
          {items.length > 1 && (
            <div className="max-w-xs space-y-1.5">
              <Label htmlFor="gf-acc" className="text-xs">Account</Label>
              <Select value={current.id} onValueChange={setSelected}>
                <SelectTrigger id="gf-acc" className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>{items.map((i) => <SelectItem key={i.id} value={i.id}>{i.name}{i.status !== "ACTIVE" ? " (paused)" : ""}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          )}
          <Account key={current.id} item={current} users={users} onChanged={load} onKey={setShownKey} />
        </>
      )}
      <CreateDialog open={creating} onOpenChange={setCreating} users={users} onCreated={(c) => { setSelected(c.id); setShownKey(c); load(); }} />
      <KeyDialog item={shownKey} onClose={() => setShownKey(null)} />
    </DetailShell>
  );
}
