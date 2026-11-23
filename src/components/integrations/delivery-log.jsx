"use client";

import { useCallback, useEffect, useState } from "react";
import { Eye, RefreshCw, RotateCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { listWebhookAudit, reprocessWebhook } from "@/lib/api/integrations";
import { Empty, LoadError, Panel, PayloadDialog, Rows, Saving, Status, ago, when } from "./shared";

const STATUS = {
  RECEIVED: ["info", "Received"],
  PROCESSING: ["info", "Processing"],
  PROCESSED: ["success", "Done"],
  FAILED: ["warning", "Retrying"],
  FAILED_PERMANENT: ["destructive", "Failed"],
};

/** Last 100 webhook deliveries of one source (or all). */
export function DeliveryLog({ source, title = "Deliveries", description, emptyText, showSource = false, action }) {
  const [state, setState] = useState("loading");
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState("ALL");
  const [refreshing, setRefreshing] = useState(false);
  const [open, setOpen] = useState(null);
  const [retrying, setRetrying] = useState(null);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await listWebhookAudit(source);
      setItems(Array.isArray(res) ? res : []);
      setState("ready");
    } catch (e) {
      setState(e?.status === 403 ? "forbidden" : "error");
    } finally {
      setRefreshing(false);
    }
  }, [source]);
  useEffect(() => { load(); }, [load]);

  const retry = async (id) => {
    setRetrying(id);
    try {
      const r = await reprocessWebhook(id);
      if (r?.success) toast.success("Lead created");
      else toast.error("Still not usable. See the reason in the list.");
      await load();
    } catch (e) {
      toast.error(e?.message || "Could not process it again");
    } finally {
      setRetrying(null);
    }
  };

  const failed = (s) => s === "FAILED" || s === "FAILED_PERMANENT";
  const shown = items.filter((e) => filter === "ALL" || (filter === "FAILED" ? failed(e.status) : e.status === filter));

  return (
    <Panel id="dlog" title={title} description={description}
      action={
        <div className="flex flex-wrap items-center gap-2">
          {action}
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="h-8 w-28 text-xs" aria-label="Filter by status"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All</SelectItem>
              <SelectItem value="PROCESSED">Done</SelectItem>
              <SelectItem value="FAILED">Failed</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" className="h-8 w-8" aria-label="Refresh" onClick={load} disabled={refreshing}>
            <RefreshCw className={refreshing ? "animate-spin" : undefined} />
          </Button>
        </div>
      }>
      {state === "loading" && <Rows />}
      {state === "error" && <LoadError message="Could not load deliveries." onRetry={load} />}
      {state === "forbidden" && <Empty>Only admins can see what was received.</Empty>}
      {state === "ready" && shown.length === 0 && <Empty>{filter === "ALL" ? emptyText || "Nothing received yet." : "None with this status."}</Empty>}
      {state === "ready" && shown.length > 0 && (
        <ul className="divide-y divide-border border-y border-border">
          {shown.map((e) => {
            const [tone, label] = STATUS[e.status] || ["muted", e.status];
            return (
              <li key={e.id} className="py-2 grid gap-x-4 gap-y-1 sm:grid-cols-[7rem_1fr_auto] items-center">
                <Status tone={tone}>{label}</Status>
                <div className="min-w-0">
                  <p className="text-sm text-foreground">
                    {showSource && <span className="font-mono text-xs mr-2">{e.source?.toLowerCase()}</span>}
                    <span className="text-muted-foreground" title={when(e.receivedAt)}>{ago(e.receivedAt)}</span>
                  </p>
                  {e.error && <p className="text-xs text-foreground break-words">{e.error}</p>}
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => setOpen(e)}><Eye /> View</Button>
                  {failed(e.status) && e.source !== "META_LEAD_AD" && (
                    <Button variant="outline" size="sm" disabled={retrying === e.id} onClick={() => retry(e.id)}>
                      {retrying === e.id ? <Saving on /> : <RotateCw />} Retry
                    </Button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <PayloadDialog event={open} onClose={() => setOpen(null)} />
    </Panel>
  );
}
