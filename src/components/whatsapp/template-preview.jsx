"use client";

import { ExternalLink, Phone, Reply, Copy, Image as ImageIcon, Video, FileText, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

const BUTTON_ICON = { URL: ExternalLink, PHONE_NUMBER: Phone, QUICK_REPLY: Reply, COPY_CODE: Copy, OTP: Copy };
const HEADER_ICON = { IMAGE: ImageIcon, VIDEO: Video, DOCUMENT: FileText, LOCATION: MapPin };

/** Replaces {{n}} with values[n-1], keeping unfilled placeholders visible. */
export function fillVariables(text, values = []) {
  return String(text || "").replace(/\{\{(\d+)\}\}/g, (m, n) => {
    const v = values[Number(n) - 1];
    return v != null && String(v).trim() !== "" ? String(v) : m;
  });
}

/** WhatsApp-style rendering of *bold*, _italic_, ~strike~ and ```mono```. */
export function WaText({ text }) {
  const parts = String(text || "").split(/(\*[^*\n]+\*|_[^_\n]+_|~[^~\n]+~|```[^`]+```)/g);
  return parts.map((p, i) => {
    if (/^\*[^*]+\*$/.test(p)) return <strong key={i}>{p.slice(1, -1)}</strong>;
    if (/^_[^_]+_$/.test(p)) return <em key={i}>{p.slice(1, -1)}</em>;
    if (/^~[^~]+~$/.test(p)) return <s key={i}>{p.slice(1, -1)}</s>;
    if (/^```[^`]+```$/.test(p)) return <code key={i} className="font-mono text-[0.92em]">{p.slice(3, -3)}</code>;
    return <span key={i}>{p}</span>;
  });
}

/**
 * Template as the customer sees it. Accepts the API template shape (bodyText, headerType…)
 * or builder form values.
 */
export function TemplatePreview({ template, values = [], headerValue, headerMediaName, className, compact }) {
  if (!template) return null;
  const headerType = String(template.headerType || "NONE").toUpperCase();
  const auth = String(template.category || "").toUpperCase() === "AUTHENTICATION";
  const body = auth
    ? `${fillVariables("*{{1}}* is your verification code.", values)}${template.addSecurityRecommendation ? " For your security, do not share this code." : ""}`
    : fillVariables(template.bodyText || template.body || "", values);
  const footer = auth
    ? (template.codeExpirationMinutes ? `This code expires in ${template.codeExpirationMinutes} minutes.` : null)
    : template.footerText || template.footer;
  const buttons = auth ? [{ type: "OTP", text: template.buttons?.[0]?.text || "Copy code" }] : template.buttons || [];
  const HeaderIcon = HEADER_ICON[headerType];

  return (
    <div className={cn("rounded-lg border border-border bg-muted/50 p-3", className)}>
      <div className={cn("rounded-lg rounded-tl-sm bg-card shadow-panel max-w-[300px]", compact ? "text-xs" : "text-[13px]")}>
        {HeaderIcon && (
          <div className="m-1 mb-0 h-28 rounded-md bg-muted flex flex-col items-center justify-center gap-1 text-muted-foreground">
            <HeaderIcon className="h-6 w-6" aria-hidden />
            <span className="text-2xs uppercase tracking-wide">{headerMediaName || headerType.toLowerCase()}</span>
          </div>
        )}
        <div className="px-2.5 pt-2 pb-1.5 space-y-1">
          {headerType === "TEXT" && template.headerText && (
            <p className="font-semibold text-foreground">{fillVariables(template.headerText, [headerValue])}</p>
          )}
          <p className="text-foreground whitespace-pre-wrap leading-relaxed break-words">
            {body ? <WaText text={body} /> : <span className="text-muted-foreground">Message body…</span>}
          </p>
          {footer && <p className="text-2xs text-muted-foreground">{footer}</p>}
        </div>
        {buttons.length > 0 && (
          <div className="border-t border-border divide-y divide-border">
            {buttons.map((b, i) => {
              const Icon = BUTTON_ICON[String(b.type || "").toUpperCase()] || Reply;
              return (
                <div key={i} className="flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-info">
                  <Icon className="h-3.5 w-3.5" aria-hidden />
                  {String(b.type).toUpperCase() === "COPY_CODE" ? "Copy offer code" : b.text || "Button"}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
