"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Send, Upload, FileText, Search } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { whatsappTemplatesApi, whatsappSendApi, countVariables } from "@/lib/api/whatsapp";
import { TemplatePreview } from "./template-preview";
import { cn } from "@/lib/utils";

const MEDIA_ACCEPT = { IMAGE: "image/jpeg,image/png", VIDEO: "video/mp4,video/3gpp", DOCUMENT: ".pdf,application/pdf" };

/**
 * Pick an approved template, fill its variables and send it to one contact. Templates are the
 * only way to message someone outside the 24-hour window.
 */
export function SendTemplateDialog({ open, onOpenChange, accountId, contact, onSent }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [values, setValues] = useState([]);
  const [headerValue, setHeaderValue] = useState("");
  const [media, setMedia] = useState({ id: null, name: "", link: "", uploading: false });
  const [buttonValues, setButtonValues] = useState({});
  const [sending, setSending] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setLoadError(null);
    whatsappTemplatesApi.getApproved(accountId)
      .then((list) => setTemplates(list))
      .catch((e) => setLoadError(e?.message || "Could not load templates"))
      .finally(() => setLoading(false));
  }, [open, accountId]);

  const selected = useMemo(() => templates.find((t) => t.id === selectedId) || null, [templates, selectedId]);
  const isAuth = String(selected?.category || "").toUpperCase() === "AUTHENTICATION";
  const varCount = selected ? (isAuth ? 1 : countVariables(selected.bodyText)) : 0;
  const headerType = String(selected?.headerType || "NONE").toUpperCase();
  const needsMedia = ["IMAGE", "VIDEO", "DOCUMENT"].includes(headerType);
  const needsHeaderVar = headerType === "TEXT" && String(selected?.headerText || "").includes("{{1}}");
  const dynamicButtons = (selected?.buttons || [])
    .map((b, i) => ({ ...b, index: i }))
    .filter((b) => !isAuth && ((b.type === "URL" && String(b.value || "").includes("{{1}}")) || b.type === "COPY_CODE"));

  const choose = (t) => {
    setSelectedId(t.id);
    const n = String(t.category).toUpperCase() === "AUTHENTICATION" ? 1 : countVariables(t.bodyText);
    // {{1}} is usually the name: prefill it, leave the rest for the agent.
    setValues(Array.from({ length: n }, (_, i) => (i === 0 && n > 0 && String(t.category).toUpperCase() !== "AUTHENTICATION" ? contact?.firstName || contact?.name || "" : "")));
    setHeaderValue("");
    setMedia({ id: null, name: "", link: "", uploading: false });
    setButtonValues({});
  };

  const filtered = templates.filter((t) => {
    const q = query.trim().toLowerCase();
    return !q || (t.displayName || "").toLowerCase().includes(q) || (t.templateName || "").toLowerCase().includes(q);
  });

  const uploadMedia = async (file) => {
    if (!file) return;
    setMedia((m) => ({ ...m, uploading: true }));
    try {
      const res = await whatsappSendApi.uploadMedia(file, accountId);
      setMedia({ id: res.mediaId, name: file.name, link: "", uploading: false });
    } catch (e) {
      setMedia((m) => ({ ...m, uploading: false }));
      toast.error(e?.message || "Upload failed");
    }
  };

  const missing = !selected
    || values.slice(0, varCount).some((v) => !String(v || "").trim())
    || (needsHeaderVar && !headerValue.trim())
    || (needsMedia && !media.id && !/^https:\/\//.test(media.link))
    || dynamicButtons.some((b) => !String(buttonValues[b.index] || "").trim());

  const send = async () => {
    if (missing) return;
    setSending(true);
    try {
      const message = await whatsappSendApi.sendTemplate({
        customerId: contact?.customerId,
        phone: contact?.phone,
        name: contact?.name,
        templateId: selected.id,
        variables: values.slice(0, varCount),
        headerVariable: needsHeaderVar ? headerValue : undefined,
        headerMedia: needsMedia ? media.id || media.link : undefined,
        buttonVariables: buttonValues,
        accountId,
      });
      if (String(message?.status).toUpperCase() === "FAILED") {
        toast.error(message.failureReason || "WhatsApp rejected the message");
      } else {
        toast.success(`"${selected.displayName}" sent`);
      }
      onSent?.(message);
      onOpenChange(false);
      setSelectedId(null);
    } catch (e) {
      toast.error(e?.message || "Could not send the template");
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-5 py-4 border-b border-border text-left">
          <DialogTitle className="text-base font-semibold">Send a template</DialogTitle>
          <DialogDescription>
            Approved templates can be sent any time — they also reopen the 24-hour chat window when the customer replies.
          </DialogDescription>
        </DialogHeader>

        <div className="grid md:grid-cols-[240px_1fr] min-h-[420px] max-h-[70vh]">
          {/* Template list */}
          <div className="border-b md:border-b-0 md:border-r border-border flex flex-col min-h-0">
            <div className="p-3 border-b border-border">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" aria-hidden />
                <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search templates" className="h-8 pl-8 text-xs" aria-label="Search templates" />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto max-h-48 md:max-h-none" role="listbox" aria-label="Approved templates">
              {loading ? (
                <div className="p-3 space-y-2">{[0, 1, 2, 3].map((i) => <div key={i} className="h-10 rounded-md bg-muted animate-pulse" />)}</div>
              ) : loadError ? (
                <p className="p-4 text-xs text-destructive">{loadError}</p>
              ) : filtered.length === 0 ? (
                <p className="p-4 text-xs text-muted-foreground">
                  {templates.length === 0 ? "No approved templates for this number yet. Create one under WhatsApp → Templates." : "No template matches."}
                </p>
              ) : filtered.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  role="option"
                  aria-selected={t.id === selectedId}
                  onClick={() => choose(t)}
                  className={cn("w-full text-left px-3 py-2 border-b border-border/60 transition-colors focus-visible:outline-none focus-visible:bg-accent",
                    t.id === selectedId ? "bg-accent text-accent-foreground" : "hover:bg-muted/60")}
                >
                  <p className="text-xs font-medium truncate">{t.displayName || t.templateName}</p>
                  <p className="text-2xs text-muted-foreground uppercase tracking-wide">{t.category} · {t.language}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Fill + preview */}
          <div className="overflow-y-auto p-4">
            {!selected ? (
              <div className="h-full flex items-center justify-center text-center text-xs text-muted-foreground px-6">
                Choose a template on the left to fill in its values.
              </div>
            ) : (
              <div className="grid lg:grid-cols-2 gap-4">
                <div className="space-y-3">
                  {needsHeaderVar && (
                    <div className="space-y-1.5">
                      <Label htmlFor="tpl-header" className="text-xs">Header {"{{1}}"}</Label>
                      <Input id="tpl-header" value={headerValue} onChange={(e) => setHeaderValue(e.target.value)} className="h-8 text-xs" />
                    </div>
                  )}
                  {needsMedia && (
                    <div className="space-y-1.5">
                      <Label className="text-xs">Header {headerType.toLowerCase()}</Label>
                      <input ref={fileRef} type="file" accept={MEDIA_ACCEPT[headerType]} className="hidden" onChange={(e) => uploadMedia(e.target.files?.[0])} />
                      <Button type="button" variant="outline" size="sm" className="w-full justify-start text-xs" onClick={() => fileRef.current?.click()} disabled={media.uploading}>
                        {media.uploading ? <Loader2 className="animate-spin" /> : media.id ? <FileText /> : <Upload />}
                        {media.id ? media.name : `Upload ${headerType.toLowerCase()}`}
                      </Button>
                      {!media.id && (
                        <Input value={media.link} onChange={(e) => setMedia((m) => ({ ...m, link: e.target.value }))} placeholder="…or paste a public https:// link" className="h-8 text-xs" />
                      )}
                    </div>
                  )}
                  {Array.from({ length: varCount }, (_, i) => (
                    <div key={i} className="space-y-1.5">
                      <Label htmlFor={`tpl-var-${i}`} className="text-xs">
                        {isAuth ? "One-time code" : <>Value for <span className="font-mono">{`{{${i + 1}}}`}</span></>}
                      </Label>
                      <Input
                        id={`tpl-var-${i}`}
                        value={values[i] || ""}
                        onChange={(e) => setValues((v) => { const n = [...v]; n[i] = e.target.value; return n; })}
                        placeholder={selected.variableSamples?.[i] ? `e.g. ${selected.variableSamples[i]}` : ""}
                        className="h-8 text-xs"
                      />
                    </div>
                  ))}
                  {dynamicButtons.map((b) => (
                    <div key={b.index} className="space-y-1.5">
                      <Label htmlFor={`tpl-btn-${b.index}`} className="text-xs">
                        {b.type === "COPY_CODE" ? "Offer code" : `Link ending for “${b.text}”`}
                      </Label>
                      <Input
                        id={`tpl-btn-${b.index}`}
                        value={buttonValues[b.index] || ""}
                        onChange={(e) => setButtonValues((s) => ({ ...s, [b.index]: e.target.value }))}
                        placeholder={b.type === "URL" ? String(b.value).replace("{{1}}", "…") : "SAVE20"}
                        className="h-8 text-xs font-mono"
                      />
                    </div>
                  ))}
                  {varCount === 0 && !needsMedia && !needsHeaderVar && dynamicButtons.length === 0 && (
                    <p className="text-xs text-muted-foreground">This template has nothing to fill in.</p>
                  )}
                </div>
                <TemplatePreview template={selected} values={values} headerValue={headerValue} headerMediaName={media.name} compact />
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="px-5 py-3 border-t border-border">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button size="sm" onClick={send} disabled={missing || sending}>
            {sending ? <Loader2 className="animate-spin" /> : <Send />}
            Send template
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
