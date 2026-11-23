"use client";

import React, { useEffect, useState } from "react";
import {
  Plus, RefreshCw, MoreHorizontal, Star, ShieldCheck, Pencil, KeyRound, ExternalLink, Unplug,
  AlertTriangle, Smartphone, Cloud, Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useWaAccounts } from "../wa-accounts-context";
import { whatsappAccountsApi, whatsappTemplatesApi, whatsappInboxApi } from "@/lib/api/whatsapp";
import { MetaAppSettings } from "@/components/whatsapp/meta-app-settings";
import { ConnectNumberDialog } from "@/components/whatsapp/connect-number-dialog";
import { cn } from "@/lib/utils";

const WEBHOOK_FIELDS = [
  ["messages", "Incoming messages and delivery ticks"],
  ["smb_message_echoes", "Replies typed in the WhatsApp Business app (coexistence)"],
  ["message_template_status_update", "Template approved / rejected"],
  ["message_template_quality_update", "Template quality changes"],
  ["template_category_update", "Template category changes"],
];

const STATUS_TONE = {
  CONNECTED: "text-success",
  ERROR: "text-destructive",
  DISCONNECTED: "text-muted-foreground",
};

const QUALITY_TONE = { GREEN: "text-success", YELLOW: "text-foreground", RED: "text-destructive" };

function NumberRow({ acc, onChanged, onRename, onToken, onDisconnect }) {
  const [busy, setBusy] = useState(null);
  const run = async (key, fn, ok) => {
    setBusy(key);
    try { await fn(); toast.success(ok); onChanged(); } catch (e) { toast.error(e?.message || "Action failed"); } finally { setBusy(null); }
  };
  const TypeIcon = acc.connectionType === "BUSINESS_APP" ? Smartphone : Cloud;
  return (
    <li className="grid grid-cols-[1fr_auto] sm:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,1fr)_auto] gap-x-4 gap-y-1 items-center px-4 py-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm font-semibold truncate">{acc.label}</span>
          {acc.isDefault && (
            <span className="inline-flex items-center gap-1 rounded-sm bg-accent px-1.5 py-0.5 text-2xs font-medium text-accent-foreground">
              <Star className="h-3 w-3" aria-hidden /> Default
            </span>
          )}
        </div>
        <p className="font-mono text-xs text-muted-foreground tabular truncate">{acc.number || acc.phoneNumberId}</p>
      </div>
      <div className="hidden sm:block text-xs space-y-0.5">
        <p className="flex items-center gap-1.5">
          <TypeIcon className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
          {acc.connectionType === "BUSINESS_APP" ? "Business app + CRM" : "Cloud API"}
        </p>
        <p className="text-muted-foreground">{acc.verifiedName || "—"}</p>
      </div>
      <div className="hidden sm:block text-xs space-y-0.5">
        <p className={cn("font-medium", STATUS_TONE[acc.status])}>
          {acc.status === "CONNECTED" ? "Connected" : acc.status === "ERROR" ? "Needs attention" : acc.status}
        </p>
        <p className="text-muted-foreground">
          Quality <span className={cn("font-medium", QUALITY_TONE[acc.qualityRating] || "")}>{acc.qualityRating || "—"}</span>
          {acc.messagingLimit && <> · {acc.messagingLimit.replace("TIER_", "").replace("_", " ")}/day</>}
        </p>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={`Actions for ${acc.label}`} disabled={Boolean(busy)}>
            {busy ? <Loader2 className="animate-spin" /> : <MoreHorizontal />}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {!acc.isDefault && (
            <DropdownMenuItem onClick={() => run("default", () => whatsappAccountsApi.makeDefault(acc.id), "Default number changed")}>
              <Star className="h-4 w-4" /> Make default
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={() => run("verify", () => whatsappAccountsApi.verify(acc.id), "Checked with Meta")}>
            <ShieldCheck className="h-4 w-4" /> Re-check with Meta
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onRename(acc)}><Pencil className="h-4 w-4" /> Rename</DropdownMenuItem>
          <DropdownMenuItem onClick={() => onToken(acc)}><KeyRound className="h-4 w-4" /> Replace access token</DropdownMenuItem>
          <DropdownMenuItem asChild>
            <a href={acc.templateManagerUrl} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-4 w-4" /> Templates in Meta</a>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => onDisconnect(acc)}>
            <Unplug className="h-4 w-4" /> Disconnect
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {(acc.lastError || !acc.webhookSubscribed) && (
        <p className="col-span-full flex items-start gap-1.5 text-2xs text-foreground">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-warning" aria-hidden />
          {acc.lastError || "App is not subscribed to this business account's webhooks yet — use “Re-check with Meta”."}
        </p>
      )}
    </li>
  );
}

export default function WhatsAppConnectPage() {
  const { accounts, isLoading, error, refreshAccounts } = useWaAccounts();
  const [connectOpen, setConnectOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [renaming, setRenaming] = useState(null);
  const [tokenFor, setTokenFor] = useState(null);
  const [disconnecting, setDisconnecting] = useState(null);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    whatsappInboxApi.settings().then(setSettings).catch(() => setSettings({ inboundAutoLead: false, error: true }));
  }, []);

  const syncTemplates = async () => {
    setSyncing(true);
    try {
      const list = await whatsappTemplatesApi.syncAll();
      toast.success(`${list.length} templates synced from Meta`);
    } catch (e) {
      toast.error(e?.message || "Template sync failed");
    } finally {
      setSyncing(false);
    }
  };

  const saveDialog = async () => {
    setSaving(true);
    try {
      if (renaming) {
        await whatsappAccountsApi.rename(renaming.id, draft);
        toast.success("Number renamed");
        setRenaming(null);
      } else if (tokenFor) {
        await whatsappAccountsApi.updateToken(tokenFor.id, draft);
        toast.success("Token replaced");
        setTokenFor(null);
      } else if (disconnecting) {
        await whatsappAccountsApi.disconnect(disconnecting.id);
        toast.success(`${disconnecting.label} disconnected`);
        setDisconnecting(null);
      }
      setDraft("");
      refreshAccounts();
    } catch (e) {
      toast.error(e?.message || "Action failed");
    } finally {
      setSaving(false);
    }
  };

  const toggleAutoLead = async (v) => {
    const prev = settings;
    setSettings((s) => ({ ...s, inboundAutoLead: v }));
    try {
      setSettings(await whatsappInboxApi.updateSettings({ inboundAutoLead: v }));
    } catch (e) {
      setSettings(prev);
      toast.error(e?.message || "Only admins can change this");
    }
  };

  const dialogOpen = Boolean(renaming || tokenFor || disconnecting);

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">WhatsApp numbers</h1>
            <p className="text-sm text-muted-foreground">Connect as many numbers as you need — each gets its own inbox channel, templates and campaigns.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={syncTemplates} disabled={syncing || accounts.length === 0}>
              <RefreshCw className={cn(syncing && "animate-spin")} /> Sync templates
            </Button>
            <Button size="sm" onClick={() => setConnectOpen(true)}><Plus /> Connect number</Button>
          </div>
        </header>

        {/* Numbers */}
        <section className="rounded-lg border border-border bg-card" aria-labelledby="numbers-h">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h2 id="numbers-h" className="text-sm font-semibold">Connected numbers <span className="text-muted-foreground font-normal tabular">({accounts.length})</span></h2>
          </div>
          {isLoading ? (
            <ul className="divide-y divide-border" aria-busy="true">
              {[0, 1].map((i) => (
                <li key={i} className="px-4 py-3 flex items-center gap-4">
                  <div className="space-y-1.5 flex-1"><div className="h-3.5 w-40 rounded bg-muted animate-pulse" /><div className="h-3 w-28 rounded bg-muted animate-pulse" /></div>
                  <div className="h-8 w-8 rounded bg-muted animate-pulse" />
                </li>
              ))}
            </ul>
          ) : error ? (
            <div className="px-4 py-8 text-center space-y-2">
              <p className="text-sm text-destructive">{error}</p>
              <Button variant="outline" size="sm" onClick={refreshAccounts}>Retry</Button>
            </div>
          ) : accounts.length === 0 ? (
            <div className="px-4 py-10 text-center space-y-3">
              <p className="text-sm font-medium">No WhatsApp number connected</p>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">Connect your WhatsApp Business app number (keeps working on your phone) or a Cloud API number to chat, send templates and run campaigns.</p>
              <Button size="sm" onClick={() => setConnectOpen(true)}><Plus /> Connect number</Button>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {accounts.map((acc) => (
                <NumberRow key={acc.id} acc={acc} onChanged={refreshAccounts}
                  onRename={(a) => { setDraft(a.label); setRenaming(a); }}
                  onToken={(a) => { setDraft(""); setTokenFor(a); }}
                  onDisconnect={(a) => setDisconnecting(a)} />
              ))}
            </ul>
          )}
        </section>

        <div className="grid lg:grid-cols-[1.4fr_1fr] gap-6">
          <MetaAppSettings fields={WEBHOOK_FIELDS} />

          {/* Inbox rules */}
          <section className="rounded-lg border border-border bg-card p-4 space-y-3" aria-labelledby="rules-h">
            <h2 id="rules-h" className="text-sm font-semibold">New people who message you</h2>
            <label className="flex items-start justify-between gap-4">
              <span className="space-y-0.5">
                <span className="block text-xs font-medium">Add to leads automatically</span>
                <span className="block text-2xs text-muted-foreground">
                  Off: they wait in the inbox as contacts and an agent chooses “Add to leads” or “Not a lead”. Click-to-WhatsApp ad replies are always leads.
                </span>
              </span>
              <Switch checked={Boolean(settings?.inboundAutoLead)} onCheckedChange={toggleAutoLead} disabled={!settings} aria-label="Add new WhatsApp contacts to leads automatically" />
            </label>
          </section>
        </div>
      </div>

      <ConnectNumberDialog open={connectOpen} onOpenChange={setConnectOpen} onConnected={() => refreshAccounts()} />

      <Dialog open={dialogOpen} onOpenChange={(v) => { if (!v) { setRenaming(null); setTokenFor(null); setDisconnecting(null); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader className="text-left">
            <DialogTitle className="text-base font-semibold">
              {renaming ? "Rename number" : tokenFor ? "Replace access token" : `Disconnect ${disconnecting?.label}?`}
            </DialogTitle>
            <DialogDescription>
              {disconnecting
                ? "Chats and campaign history stay in the CRM. You can connect the number again later."
                : tokenFor ? "Paste a new permanent System User token. It is checked with Meta before saving." : "Shown to your team in the inbox and campaign builder."}
            </DialogDescription>
          </DialogHeader>
          {!disconnecting && (
            <div className="space-y-1.5">
              <Label htmlFor="num-dialog-input" className="text-xs">{renaming ? "Name" : "Access token"}</Label>
              <Input id="num-dialog-input" value={draft} onChange={(e) => setDraft(e.target.value)} type={tokenFor ? "password" : "text"}
                autoComplete="off" className={cn("h-9 text-sm", tokenFor && "font-mono")} />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => { setRenaming(null); setTokenFor(null); setDisconnecting(null); }}>Cancel</Button>
            <Button size="sm" variant={disconnecting ? "destructive" : "default"} onClick={saveDialog} disabled={saving || (!disconnecting && !draft.trim())}>
              {saving && <Loader2 className="animate-spin" />} {disconnecting ? "Disconnect" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
