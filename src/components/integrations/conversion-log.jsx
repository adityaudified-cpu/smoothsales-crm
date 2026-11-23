"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { RefreshCw, RotateCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { conversionsApi } from "@/lib/api/integrations";
import { Empty, LoadError, Panel, Rows, STAGES, Saving, Status, ago, stageLabel, when } from "./shared";

const STATUS = {
  PENDING: ["info", "Waiting"],
  SENDING: ["info", "Sending"],
  SENT: ["success", "Sent"],
  FAILED: ["warning", "Retrying"],
  REJECTED: ["destructive", "Rejected"],
  SKIPPED: ["muted", "Skipped"],
};

/** Stage → event/action editor shared by Meta and Google. */
export function StageMap({ value, onChange, columnLabel, placeholder, inputMode, hint }) {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-[8rem_1fr] sm:grid-cols-[12rem_1fr] gap-x-3 text-2xs font-medium uppercase tracking-wider text-muted-foreground">
        <span>When a lead becomes</span><span>{columnLabel}</span>
      </div>
      {STAGES.map(([key, label]) => (
        <div key={key} className="grid grid-cols-[8rem_1fr] sm:grid-cols-[12rem_1fr] items-center gap-x-3">
          <label htmlFor={`sm-${key}`} className="text-sm text-foreground">{label}</label>
          <Input id={`sm-${key}`} inputMode={inputMode} value={value[key] || ""} placeholder={placeholder}
            onChange={(e) => onChange({ ...value, [key]: e.target.value })} className="h-8 text-xs" />
        </div>
      ))}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function ConversionLog({ destination, platform }) {
  const [state, setState] = useState("loading");
  const [data, setData] = useState({ items: [], total: 0, stats: {} });
  const [filter, setFilter] = useState("ALL");
  const [page, setPage] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [retrying, setRetrying] = useState(null);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      setData(await conversionsApi.list(destination, { status: filter === "ALL" ? undefined : filter, page }));
      setState("ready");
    } catch {
      setState("error");
    } finally {
      setRefreshing(false);
    }
  }, [destination, filter, page]);
  useEffect(() => { load(); }, [load]);

  const retry = async (id) => {
    setRetrying(id);
    try {
      await conversionsApi.retry(id);
      toast.success("Queued again");
      await load();
    } catch (e) {
      toast.error(e?.message || "Could not retry");
    } finally {
      setRetrying(null);
    }
  };

  const s = data.stats || {};
  const pages = Math.ceil((data.total || 0) / 25);
  return (
    <Panel id="clog" title="Conversions" description={`Everything reported to ${platform}. A lead reports each event once.`}
      action={
        <div className="flex items-center gap-2">
          <Select value={filter} onValueChange={(v) => { setFilter(v); setPage(0); }}>
            <SelectTrigger className="h-8 w-32 text-xs" aria-label="Filter by status"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All</SelectItem>
              {Object.entries(STATUS).filter(([k]) => k !== "SENDING").map(([k, [, label]]) => <SelectItem key={k} value={k}>{label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" className="h-8 w-8" aria-label="Refresh" onClick={load} disabled={refreshing}>
            <RefreshCw className={refreshing ? "animate-spin" : undefined} />
          </Button>
        </div>
      }>
      {state === "loading" && <Rows />}
      {state === "error" && <LoadError message="Could not load conversions." onRetry={load} />}
      {state === "ready" && (
        <>
          <dl className="flex flex-wrap gap-x-6 gap-y-2 text-xs">
            {[["Sent", s.SENT], ["Waiting", (s.PENDING || 0) + (s.SENDING || 0) + (s.FAILED || 0)], ["Rejected", s.REJECTED], ["Skipped", s.SKIPPED]].map(([k, v]) => (
              <div key={k} className="flex items-baseline gap-1.5">
                <dt className="text-muted-foreground">{k}</dt><dd className="font-semibold tabular text-foreground">{v || 0}</dd>
              </div>
            ))}
            <div className="text-muted-foreground">last 30 days</div>
          </dl>
          {data.items.length === 0 ? (
            <Empty>{filter === "ALL" ? "Nothing yet. Move a lead from this platform to a mapped stage to report the first one." : "No conversions with this status."}</Empty>
          ) : (
            <ul className="divide-y divide-border border-y border-border">
              {data.items.map((e) => {
                const [tone, label] = STATUS[e.status] || ["muted", e.status];
                return (
                  <li key={e.id} className="py-2.5 grid gap-x-4 gap-y-1 sm:grid-cols-[7rem_1fr_auto] items-start">
                    <Status tone={tone}>{label}</Status>
                    <div className="min-w-0 space-y-0.5">
                      <p className="text-sm text-foreground">
                        {stageLabel(e.stage)} <span className="text-muted-foreground">→</span> <span className="font-mono text-xs">{e.eventName}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        <Link className="underline underline-offset-2 hover:text-foreground" href={`/leads/customers/${e.customerId}`}>Open lead</Link>
                        {" · "}<span title={when(e.eventTime)}>{ago(e.eventTime)}</span>
                        {e.attempts > 1 && ` · ${e.attempts} tries`}
                        {e.status === "FAILED" && e.nextAttemptAt && ` · next try ${new Date(e.nextAttemptAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`}
                      </p>
                      {e.error && <p className="text-xs text-foreground break-words">{e.error}</p>}
                    </div>
                    {["REJECTED", "SKIPPED", "FAILED"].includes(e.status) && (
                      <Button variant="outline" size="sm" onClick={() => retry(e.id)} disabled={retrying === e.id}>
                        {retrying === e.id ? <Saving on /> : <RotateCw />} Retry
                      </Button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
          {pages > 1 && (
            <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground">
              <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>Previous</Button>
              <span className="tabular">{page + 1} of {pages}</span>
              <Button variant="outline" size="sm" disabled={page + 1 >= pages} onClick={() => setPage(page + 1)}>Next</Button>
            </div>
          )}
        </>
      )}
    </Panel>
  );
}
