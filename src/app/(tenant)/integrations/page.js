"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, RefreshCw, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getIntegrationLogo } from "@/components/integrations/brand-logos";
import { DeliveryLog } from "@/components/integrations/delivery-log";
import { Empty, IntegrationStatus, LoadError, Rows, ago } from "@/components/integrations/shared";
import { UniversalConfigModal } from "@/components/integrations/universal-config-modal";
import { listIntegrations, saveIntegration } from "@/lib/api/integrations";
import { INTEGRATION_CATALOG } from "@/lib/integrations-catalog";
import { cn } from "@/lib/utils";

// The ad loop: leads come in from three places, results go back to two.
const AD_LOOP = [
  { heading: "Leads in", keys: ["meta_ads", "google_ads", "website"] },
  { heading: "Results back to ads", keys: ["meta_capi", "google_oci"] },
];
const MAIN = new Set(AD_LOOP.flatMap((g) => g.keys));
const DESCRIBE = {
  meta_ads: "Facebook and Instagram lead forms",
  google_ads: "Google Ads lead form assets",
  website: "Forms and landing pages, with UTM and click tracking",
  meta_capi: "Reports lead stages to Meta",
  google_oci: "Uploads lead stages to Google Ads",
};
const CATEGORIES = [["all", "All"], ["Portals", "Portals"], ["Forms", "Forms"], ["Messaging", "Messaging"], ["Telephony", "Telephony"], ["Payments", "Payments"], ["Productivity", "Productivity"], ["Ads", "Ads"]];

function activity(item) {
  if (item.lastEventAt) return `${item.key === "meta_capi" || item.key === "google_oci" ? "Last sent" : "Last lead"} ${ago(item.lastEventAt)}`;
  if (item.status === "connected") return "No activity yet";
  return null;
}

function LoopRow({ item }) {
  const note = item.status === "error" ? item.lastTestMessage : activity(item);
  return (
    <li>
      <Link href={`/integrations/${item.key}`}
        className="group grid grid-cols-[auto_1fr_auto] sm:grid-cols-[auto_1fr_9rem_auto] items-center gap-x-3 gap-y-1 px-4 py-3 hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring">
        <span className="h-9 w-9 rounded-md border border-border bg-card grid place-items-center" aria-hidden>{getIntegrationLogo(item.key, "h-5 w-5")}</span>
        <span className="min-w-0">
          <span className="block text-sm font-medium text-foreground">{item.name}</span>
          <span className="block text-xs text-muted-foreground">{DESCRIBE[item.key]}</span>
          {note && <span className="block text-xs text-foreground break-words">{note}</span>}
          <span className="sm:hidden"><IntegrationStatus status={item.status} /></span>
        </span>
        <span className="hidden sm:block"><IntegrationStatus status={item.status} /></span>
        <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden />
      </Link>
    </li>
  );
}

export default function IntegrationsPage() {
  const router = useRouter();
  const [state, setState] = useState("loading"); // loading | ready | error | forbidden
  const [items, setItems] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState("all");
  const [category, setCategory] = useState("all");
  const [query, setQuery] = useState("");
  const [onlyConnected, setOnlyConnected] = useState(false);
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const list = await listIntegrations();
      setItems(Array.isArray(list) ? list : []);
      setState("ready");
    } catch (e) {
      setState(e?.status === 403 ? "forbidden" : "error");
    } finally {
      setRefreshing(false);
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  const byKey = useMemo(() => new Map(items.map((i) => [i.key, i])), [items]);
  const others = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items
      .filter((i) => !MAIN.has(i.key))
      .map((i) => {
        const c = INTEGRATION_CATALOG.find((x) => x.key === i.key);
        return { ...c, ...i, displayName: i.name, description: c?.description || "" };
      })
      .filter((i) => category === "all" || i.category === category)
      .filter((i) => !onlyConnected || i.status === "connected")
      .filter((i) => !q || i.name.toLowerCase().includes(q) || i.description.toLowerCase().includes(q));
  }, [items, query, category, onlyConnected]);

  const open = (item) => {
    if (item.key === "whatsapp") router.push("/whatsapp/connect");
    else setSelected(item);
  };

  const save = async (key, payload, close = false) => {
    setSaving(true);
    try {
      await saveIntegration(key, payload);
      toast.success("Saved");
      if (close) setSelected(null);
      await load();
    } catch (e) {
      toast.error(e?.message || "Could not save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5 pb-16 max-w-6xl">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">Integrations</h1>
          <p className="text-sm text-muted-foreground">Bring leads in from your ads and website, and tell the ad platforms which ones became customers.</p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={refreshing}><RefreshCw className={cn(refreshing && "animate-spin")} /> Refresh</Button>
      </header>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="all">Integrations</TabsTrigger>
          <TabsTrigger value="log">Delivery log</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-6">
          {state === "loading" && <Rows count={7} />}
          {state === "error" && <LoadError message="Could not load integrations." onRetry={load} />}
          {state === "forbidden" && <Empty>You do not have access to integrations. Ask a workspace admin.</Empty>}
          {state === "ready" && (
            <>
              <div className="grid gap-4 lg:grid-cols-[3fr_2fr] items-start">
                {AD_LOOP.map((group) => (
                  <section key={group.heading} aria-label={group.heading} className="rounded-lg border border-border bg-card overflow-hidden">
                    <h2 className="px-4 py-2.5 border-b border-border text-2xs font-medium uppercase tracking-wider text-muted-foreground">{group.heading}</h2>
                    <ul className="divide-y divide-border">
                      {group.keys.map((k) => byKey.get(k)).filter(Boolean).map((item) => <LoopRow key={item.key} item={item} />)}
                    </ul>
                  </section>
                ))}
              </div>

              <section aria-labelledby="more-h" className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 id="more-h" className="text-sm font-semibold text-foreground">More integrations</h2>
                  <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-56">
                      <Search className="absolute left-2.5 top-2 h-4 w-4 text-muted-foreground" aria-hidden />
                      <Input type="search" aria-label="Search integrations" placeholder="Search" value={query} onChange={(e) => setQuery(e.target.value)} className="h-8 pl-8 text-xs" />
                    </div>
                    <Button variant={onlyConnected ? "secondary" : "outline"} size="sm" aria-pressed={onlyConnected} onClick={() => setOnlyConnected((v) => !v)}>Connected only</Button>
                  </div>
                </div>
                <div className="flex gap-1 overflow-x-auto pb-1" role="group" aria-label="Category">
                  {CATEGORIES.map(([id, label]) => (
                    <button key={id} type="button" aria-pressed={category === id} onClick={() => setCategory(id)}
                      className={cn("rounded-md px-2.5 py-1 text-xs font-medium whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        category === id ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground")}>{label}</button>
                  ))}
                </div>
                {others.length === 0 ? <Empty>No integration matches.</Empty> : (
                  <ul className="rounded-lg border border-border bg-card divide-y divide-border">
                    {others.map((item) => (
                      <li key={item.key} className="flex items-center gap-3 px-4 py-2.5">
                        <span className="h-8 w-8 shrink-0 grid place-items-center" aria-hidden>{getIntegrationLogo(item.key, "h-5 w-5")}</span>
                        <div className="min-w-0 flex-1">
                          <Link href={`/integrations/${item.key}`} className="text-sm font-medium text-foreground hover:underline rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{item.name}</Link>
                          <p className="text-xs text-muted-foreground line-clamp-1">{item.description}</p>
                          <span className="sm:hidden"><IntegrationStatus status={item.status} /></span>
                        </div>
                        <span className="hidden sm:block w-32"><IntegrationStatus status={item.status} /></span>
                        <Button variant="outline" size="sm" disabled={!item.available} onClick={() => open(item)}>{item.key === "whatsapp" ? "Manage" : item.configured ? "Settings" : "Set up"}</Button>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </>
          )}
        </TabsContent>

        <TabsContent value="log">
          {tab === "log" && <DeliveryLog showSource title="Delivery log" description="The last 100 webhook deliveries from Meta, your website and other lead sources. Google Ads submissions are on the Google Ads page." emptyText="Nothing received yet." />}
        </TabsContent>
      </Tabs>

      {selected && (
        <UniversalConfigModal integration={selected} isOpen onClose={() => setSelected(null)} onSave={save} saving={saving} />
      )}
    </div>
  );
}
