"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { customersApi } from "@/lib/api/customers";
import { cn } from "@/lib/utils";
import {
  Repeat2,
  Globe,
  FileText,
  Megaphone,
  Calendar,
  Clock,
  Hash,
  Copy,
  Check,
  Loader2,
  ChevronDown,
  ChevronUp,
  Layers,
  CheckCircle2,
  Share2,
} from "lucide-react";
import { format, isValid } from "date-fns";

// ─── Compact Clickable Count Badge in Table Cell ──────────────────────────────
export function OccurrenceCountBadge({ count, customerId, leadName, className }) {
  const [open, setOpen] = useState(false);
  const n = count ?? 1;

  const badgeCls =
    n === 1
      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25 hover:bg-emerald-500/20"
      : n === 2
      ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/20"
      : n === 3
      ? "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30 hover:bg-orange-500/20"
      : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30 hover:bg-rose-500/20";

  const isRepeat = n > 1;

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
        className={cn(
          "inline-flex items-center justify-center min-w-[2rem] h-5.5 px-2 rounded-full border font-bold text-[11px] tabular-nums transition-all select-none cursor-pointer shadow-2xs hover:scale-105 active:scale-95",
          badgeCls,
          className
        )}
        title={
          isRepeat
            ? `${n} touchpoints / inquiries — click to view history`
            : "1 touchpoint / inquiry — click to view history"
        }
      >
        {isRepeat && <Repeat2 className="h-3 w-3 mr-1 shrink-0" />}
        <span>{n}</span>
      </button>

      {open && (
        <LeadAttributionsModal
          open={open}
          onOpenChange={setOpen}
          customerId={customerId}
          leadName={leadName}
          occurrenceCount={n}
        />
      )}
    </>
  );
}

// ─── Clean Helpers for Form Question & Answer Formatting ────────────────────
function formatAnswerKey(key) {
  if (!key) return "";
  return key
    .replace(/[?:]/g, "")
    .replace(/_+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

function formatAnswerValue(val) {
  if (val === null || val === undefined) return "—";
  const str = Array.isArray(val) ? val.join(", ") : String(val);
  if (!str.trim()) return "—";
  if (str.includes("@") || /^\+?\d[\d\s-]{7,}$/.test(str)) {
    return str;
  }
  const cleaned = str.replace(/_+/g, " ").trim();
  if (/^[a-z0-9\s]+$/i.test(cleaned)) {
    return cleaned.replace(/\b\w/g, (c) => c.toUpperCase());
  }
  return cleaned;
}

function formatDateSafe(val) {
  if (!val) return "—";
  try {
    const d = new Date(val);
    if (!isValid(d)) return "—";
    return format(d, "dd MMM yyyy");
  } catch {
    return "—";
  }
}

function formatTimeSafe(val) {
  if (!val) return "—";
  try {
    const d = new Date(val);
    if (!isValid(d)) return "—";
    return format(d, "hh:mm a");
  } catch {
    return "—";
  }
}

// ─── Modal with Multi-Touch Attribution Table ────────────────────────────────
export function LeadAttributionsModal({
  open,
  onOpenChange,
  customerId,
  leadName,
  occurrenceCount,
}) {
  const [attributions, setAttributions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    if (open && customerId) {
      setLoading(true);
      customersApi
        .attributions(customerId)
        .then((res) => {
          if (!active) return;
          const data = res?.data?.data ?? res?.data ?? res ?? [];
          setAttributions(Array.isArray(data) ? data : []);
        })
        .catch(() => {
          if (active) setAttributions([]);
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    } else {
      setAttributions([]);
    }
    return () => {
      active = false;
    };
  }, [open, customerId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl md:max-w-5xl w-[95vw] max-h-[88vh] flex flex-col gap-0 p-0 overflow-hidden shadow-2xl rounded-2xl border border-border bg-card">
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b border-border bg-muted/30 shrink-0">
          <div className="flex items-center justify-between gap-4 pr-6">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-primary/10 text-primary border border-primary/20 shrink-0 shadow-2xs">
                <Repeat2 className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
                  <span>Lead Inbound & Touchpoint History</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                    {occurrenceCount || attributions.length || 1} Touchpoint
                    {(occurrenceCount || attributions.length) !== 1 ? "s" : ""}
                  </span>
                </DialogTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Multi-touch attribution for{" "}
                  <span className="font-semibold text-foreground">
                    {leadName || "Lead"}
                  </span>{" "}
                  across website forms, ads & marketing channels.
                </p>
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-2 shrink-0">
              <span className="text-[11px] font-medium text-muted-foreground bg-background border border-border px-2.5 py-1 rounded-md shadow-2xs">
                Omnichannel Ingestion
              </span>
            </div>
          </div>
        </DialogHeader>

        {/* Table Content Area */}
        <div className="flex-1 overflow-auto bg-background min-h-[260px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm font-medium">Loading touchpoint history table…</p>
            </div>
          ) : attributions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-2 text-muted-foreground">
              <FileText className="h-10 w-10 opacity-30" />
              <p className="text-sm font-semibold">No attribution records found</p>
              <p className="text-xs text-muted-foreground max-w-sm text-center">
                This lead was added directly or does not have recorded multi-channel attribution events yet.
              </p>
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-muted/50 backdrop-blur sticky top-0 z-10 border-b border-border text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4 w-[110px]"># / Status</th>
                    <th className="py-3 px-4 w-[140px]">Inbound Date</th>
                    <th className="py-3 px-4 w-[180px]">Channel & Source</th>
                    <th className="py-3 px-4 w-[220px]">Campaign & Form</th>
                    <th className="py-3 px-4 min-w-[300px]">Submitted Inbound Data</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {attributions.map((attr, idx) => (
                    <AttributionTableRow
                      key={attr.id ?? idx}
                      attr={attr}
                      index={idx}
                      total={attributions.length}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-border bg-muted/20 flex items-center justify-between text-[11px] text-muted-foreground shrink-0">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            <span>
              Each row corresponds to an authenticated inbound inquiry, website form submission, or webhook event.
            </span>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="px-3.5 py-1.5 bg-background border border-border hover:bg-muted text-foreground font-medium rounded-md shadow-2xs text-xs cursor-pointer transition-colors"
          >
            Close
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Table Row Component ───────────────────────────────────────────────────
function AttributionTableRow({ attr, index, total }) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const submittedAt = attr.metaCreatedTime ?? attr.createdAt;
  const isLatest = index === 0;
  const isFirst = index === total - 1 && total > 1;
  const submissionNumber = total - index;

  const rawPlatform = (attr.platform || "WEBSITE").toUpperCase();
  const metaPlatform = (attr.metaPlatform || "").toLowerCase();

  const isInstagram = metaPlatform === "ig" || metaPlatform === "instagram";
  const isFacebook = metaPlatform === "fb" || metaPlatform === "facebook";
  const isWebsite = rawPlatform.includes("WEB") || rawPlatform === "WEBSITE";
  const isGoogle = rawPlatform.includes("GOOGLE");

  const platformLabel = isInstagram
    ? "Instagram"
    : isFacebook
    ? "Facebook"
    : isWebsite
    ? "Website Form"
    : isGoogle
    ? "Google Ads"
    : attr.platform ?? "Inbound";

  const platformBadgeCls = isInstagram
    ? "bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/25"
    : isFacebook
    ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/25"
    : isWebsite
    ? "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/25"
    : isGoogle
    ? "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/25"
    : "bg-muted text-foreground border-border";

  // Parse raw field answers
  let fieldAnswers = [];
  if (attr.rawFieldData) {
    try {
      const raw =
        typeof attr.rawFieldData === "string"
          ? JSON.parse(attr.rawFieldData)
          : attr.rawFieldData;
      if (raw && typeof raw === "object") {
        fieldAnswers = Object.entries(raw)
          .filter(([k, v]) => {
            if (!k) return false;
            const val = Array.isArray(v) ? v[0] : v;
            return val !== undefined && val !== null && String(val).trim() !== "";
          })
          .map(([k, v]) => ({
            key: k,
            label: formatAnswerKey(k),
            value: formatAnswerValue(Array.isArray(v) ? v[0] : v),
          }));
      }
    } catch (_) {}
  }

  const copyId = (e) => {
    e.stopPropagation();
    const idToCopy = attr.metaLeadgenId || attr.id;
    if (!idToCopy) return;
    navigator.clipboard?.writeText(idToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const visibleAnswers = expanded ? fieldAnswers : fieldAnswers.slice(0, 4);
  const hasMoreAnswers = fieldAnswers.length > 4;

  return (
    <tr
      className={cn(
        "hover:bg-muted/40 transition-colors align-top",
        isLatest && "bg-primary/5 dark:bg-primary/10"
      )}
    >
      {/* 1. # & Status */}
      <td className="py-3.5 px-4 whitespace-nowrap">
        <div className="flex flex-col gap-1 items-start">
          <div className="flex items-center gap-1.5">
            <span
              className={cn(
                "inline-flex items-center justify-center h-6 w-6 rounded-full text-xs font-bold shrink-0",
                isLatest
                  ? "bg-primary/15 text-primary border border-primary/30"
                  : "bg-muted text-muted-foreground border border-border"
              )}
            >
              {submissionNumber}
            </span>
            {isLatest ? (
              <span className="inline-flex items-center text-[10px] px-1.5 py-0.5 rounded font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                Latest
              </span>
            ) : isFirst ? (
              <span className="inline-flex items-center text-[10px] px-1.5 py-0.5 rounded font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                First
              </span>
            ) : null}
          </div>
          <span className="text-[10px] text-muted-foreground font-mono">
            Touch #{submissionNumber}
          </span>
        </div>
      </td>

      {/* 2. Submitted At */}
      <td className="py-3.5 px-4 whitespace-nowrap">
        {submittedAt ? (
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-1 text-foreground font-semibold">
              <Calendar className="h-3 w-3 text-muted-foreground shrink-0" />
              <span>{formatDateSafe(submittedAt)}</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <Clock className="h-3 w-3 text-muted-foreground shrink-0" />
              <span>{formatTimeSafe(submittedAt)}</span>
            </div>
          </div>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </td>

      {/* 3. Platform & Page */}
      <td className="py-3.5 px-4">
        <div className="flex flex-col gap-1.5 min-w-[150px]">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className={cn(
                "inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-semibold border",
                platformBadgeCls
              )}
            >
              {isWebsite ? (
                <Globe className="h-2.5 w-2.5 shrink-0" />
              ) : isFacebook || isInstagram ? (
                <Share2 className="h-2.5 w-2.5 shrink-0" />
              ) : (
                <Layers className="h-2.5 w-2.5 shrink-0" />
              )}
              {platformLabel}
            </span>
            {attr.organic && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 font-medium">
                Organic
              </span>
            )}
          </div>

          {attr.pageName && (
            <div className="flex items-start gap-1 text-[11px] text-foreground font-medium leading-tight">
              <Globe className="h-3 w-3 text-muted-foreground shrink-0 mt-0.5" />
              <span className="line-clamp-2" title={attr.pageName}>
                {attr.pageName}
              </span>
            </div>
          )}

          {(attr.metaLeadgenId || attr.id) && (
            <button
              type="button"
              onClick={copyId}
              className="inline-flex items-center gap-1 text-[10px] font-mono text-muted-foreground hover:text-foreground transition-colors w-fit cursor-pointer group"
              title="Click to copy Inbound ID"
            >
              <Hash className="h-2.5 w-2.5 text-muted-foreground" />
              <span className="truncate max-w-[120px]">
                {attr.metaLeadgenId || String(attr.id).slice(0, 8)}
              </span>
              {copied ? (
                <Check className="h-2.5 w-2.5 text-emerald-500" />
              ) : (
                <Copy className="h-2.5 w-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
              )}
            </button>
          )}
        </div>
      </td>

      {/* 4. Campaign & Form */}
      <td className="py-3.5 px-4">
        <div className="flex flex-col gap-1 min-w-[180px]">
          {attr.campaignName ? (
            <div className="flex items-start gap-1.5">
              <Megaphone className="h-3 w-3 text-primary shrink-0 mt-0.5" />
              <span
                className="font-semibold text-foreground leading-tight line-clamp-2"
                title={attr.campaignName}
              >
                {attr.campaignName}
              </span>
            </div>
          ) : (
            <span className="text-muted-foreground italic text-[11px]">
              Direct Inbound
            </span>
          )}

          {attr.formName && (
            <div className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
              <FileText className="h-3 w-3 text-muted-foreground shrink-0 mt-0.5" />
              <span className="line-clamp-1" title={attr.formName}>
                Form: <strong className="font-medium text-foreground">{attr.formName}</strong>
              </span>
            </div>
          )}

          {(attr.adsetName || attr.adName) && (
            <div className="flex items-start gap-1.5 text-[10.5px] text-muted-foreground">
              <Layers className="h-3 w-3 text-muted-foreground shrink-0 mt-0.5" />
              <span className="line-clamp-1" title={attr.adsetName || attr.adName}>
                {attr.adsetName ? `AdSet: ${attr.adsetName}` : `Ad: ${attr.adName}`}
              </span>
            </div>
          )}
        </div>
      </td>

      {/* 5. Submitted Form Answers (Clean Structured Grid) */}
      <td className="py-3.5 px-4">
        {fieldAnswers.length === 0 ? (
          <span className="text-muted-foreground italic text-[11px]">
            No extra form fields recorded
          </span>
        ) : (
          <div className="flex flex-col gap-1.5 max-w-xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 bg-muted/40 border border-border/80 rounded-lg p-2.5">
              {visibleAnswers.map(({ key, label, value }) => (
                <div key={key} className="flex flex-col min-w-0">
                  <span className="text-[9.5px] uppercase font-bold tracking-wide text-muted-foreground truncate">
                    {label}
                  </span>
                  <span className="text-[11.5px] font-medium text-foreground break-words leading-snug">
                    {value}
                  </span>
                </div>
              ))}
            </div>

            {hasMoreAnswers && (
              <button
                type="button"
                onClick={() => setExpanded(!expanded)}
                className="inline-flex items-center gap-1 text-[10px] font-semibold text-primary hover:underline w-fit cursor-pointer self-start"
              >
                {expanded ? (
                  <>
                    Show Less <ChevronUp className="h-2.5 w-2.5" />
                  </>
                ) : (
                  <>
                    +{fieldAnswers.length - 4} More Fields{" "}
                    <ChevronDown className="h-2.5 w-2.5" />
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </td>
    </tr>
  );
}
