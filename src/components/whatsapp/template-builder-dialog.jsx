"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Plus, Trash2, Loader2, Upload, ExternalLink, Send, Save, Braces, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { whatsappTemplatesApi, countVariables, templateManagerUrl } from "@/lib/api/whatsapp";
import { TemplatePreview } from "./template-preview";
import { accountName } from "@/app/(tenant)/whatsapp/wa-accounts-context";
import { cn } from "@/lib/utils";

export const TEMPLATE_LANGUAGES = [
  ["en", "English"], ["en_US", "English (US)"], ["en_GB", "English (UK)"], ["hi", "Hindi"], ["mr", "Marathi"],
  ["gu", "Gujarati"], ["bn", "Bengali"], ["pa", "Punjabi"], ["ta", "Tamil"], ["te", "Telugu"], ["kn", "Kannada"],
  ["ml", "Malayalam"], ["ur", "Urdu"], ["ar", "Arabic"],
];

const CATEGORIES = [
  { value: "MARKETING", label: "Marketing", hint: "Offers, announcements, re-engagement" },
  { value: "UTILITY", label: "Utility", hint: "Updates on something the customer asked for" },
  { value: "AUTHENTICATION", label: "Authentication", hint: "One-time passcodes" },
];

const HEADER_TYPES = [
  ["NONE", "None"], ["TEXT", "Text"], ["IMAGE", "Image"], ["VIDEO", "Video"], ["DOCUMENT", "Document"], ["LOCATION", "Location"],
];

const MEDIA_ACCEPT = { IMAGE: "image/jpeg,image/png", VIDEO: "video/mp4", DOCUMENT: "application/pdf" };

const BUTTON_TYPES = [
  { type: "QUICK_REPLY", label: "Quick reply", max: 10 },
  { type: "URL", label: "Visit website", max: 2 },
  { type: "PHONE_NUMBER", label: "Call phone", max: 1 },
  { type: "COPY_CODE", label: "Copy offer code", max: 1 },
];

const EMPTY = {
  accountId: "", category: "MARKETING", displayName: "", templateName: "", language: "en",
  headerType: "NONE", headerText: "", headerExample: "", headerHandle: "", headerFileName: "",
  bodyText: "", variableSamples: [], footerText: "", buttons: [],
  addSecurityRecommendation: true, codeExpirationMinutes: "", otpButtonText: "Copy code",
};

const slug = (s) => String(s || "").toLowerCase().trim().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "").slice(0, 100);

function fromTemplate(t, fallbackAccount) {
  const auth = String(t.category).toUpperCase() === "AUTHENTICATION";
  return {
    ...EMPTY,
    accountId: fallbackAccount || "",
    category: String(t.category || "MARKETING").toUpperCase(),
    displayName: t.displayName || t.templateName,
    templateName: t.templateName,
    language: t.language || "en",
    headerType: String(t.headerType || "NONE").toUpperCase(),
    headerText: t.headerText || "",
    headerExample: t.headerExample || "",
    headerHandle: "",
    headerFileName: t.hasHeaderSample ? "Sample on file" : "",
    bodyText: auth ? "" : t.bodyText || "",
    variableSamples: t.variableSamples || [],
    footerText: t.footerText || "",
    buttons: auth ? [] : (t.buttons || []).map((b) => ({ type: b.type, text: b.text || "", value: b.value || "", example: b.example || "" })),
    addSecurityRecommendation: Boolean(t.addSecurityRecommendation),
    codeExpirationMinutes: t.codeExpirationMinutes ?? "",
    otpButtonText: auth ? t.buttons?.[0]?.text || "Copy code" : "Copy code",
  };
}

/**
 * Create or edit a WhatsApp template. Submitting sends it straight to Meta for review; the
 * result arrives through the template webhook.
 */
export function TemplateBuilderDialog({ open, onOpenChange, accounts = [], defaultAccountId, template, copyFrom, onSaved }) {
  const editing = Boolean(template?.id);
  const [form, setForm] = useState(EMPTY);
  const [nameTouched, setNameTouched] = useState(false);
  const [saving, setSaving] = useState(null);
  const [uploading, setUploading] = useState(false);
  const bodyRef = useRef(null);
  const fileRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const fallback = defaultAccountId || accounts[0]?.id || "";
    if (template) setForm(fromTemplate(template, fallback));
    else if (copyFrom) setForm({ ...fromTemplate(copyFrom, fallback), displayName: `${copyFrom.displayName} copy`, templateName: `${copyFrom.templateName}_copy` });
    else setForm({ ...EMPTY, accountId: fallback });
    setNameTouched(Boolean(template || copyFrom));
  }, [open, template, copyFrom, defaultAccountId, accounts]);

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  const auth = form.category === "AUTHENTICATION";
  const varCount = auth ? 1 : countVariables(form.bodyText);
  const account = accounts.find((a) => a.id === form.accountId);
  const mediaHeader = ["IMAGE", "VIDEO", "DOCUMENT"].includes(form.headerType);

  const insertVariable = () => {
    const el = bodyRef.current;
    const token = `{{${varCount + 1}}}`;
    const start = el?.selectionStart ?? form.bodyText.length;
    const end = el?.selectionEnd ?? form.bodyText.length;
    const next = form.bodyText.slice(0, start) + token + form.bodyText.slice(end);
    set({ bodyText: next.slice(0, 1024) });
    requestAnimationFrame(() => { el?.focus(); el?.setSelectionRange(start + token.length, start + token.length); });
  };

  const addButton = (type) => set({ buttons: [...form.buttons, { type, text: "", value: "", example: "" }] });
  const updateButton = (i, patch) => set({ buttons: form.buttons.map((b, j) => (j === i ? { ...b, ...patch } : b)) });
  const removeButton = (i) => set({ buttons: form.buttons.filter((_, j) => j !== i) });
  const countType = (t) => form.buttons.filter((b) => b.type === t).length;

  const uploadSample = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const { handle } = await whatsappTemplatesApi.uploadHeaderSample(file, form.accountId || undefined);
      set({ headerHandle: handle, headerFileName: file.name });
      toast.success("Sample uploaded to Meta");
    } catch (e) {
      toast.error(e?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const problems = useMemo(() => {
    const p = [];
    if (!form.displayName.trim()) p.push("Give the template a name");
    if (!/^[a-z0-9_]+$/.test(form.templateName)) p.push("Meta name may use only lowercase letters, digits and _");
    if (!auth && !form.bodyText.trim()) p.push("Write the message body");
    if (!auth) {
      for (let i = 1; i <= varCount; i++) if (!form.bodyText.includes(`{{${i}}}`)) { p.push(`Variables must be numbered in order — {{${i}}} is missing`); break; }
      if (form.headerType === "TEXT" && !form.headerText.trim()) p.push("Write the header text");
      form.buttons.forEach((b, i) => {
        if (b.type !== "COPY_CODE" && !b.text.trim()) p.push(`Button ${i + 1} needs a label`);
        if (b.type === "URL" && !/^https?:\/\/.+/.test(b.value)) p.push(`Button ${i + 1} needs a URL starting with https://`);
        if (b.type === "PHONE_NUMBER" && !/^\+\d{8,15}$/.test(b.value.replace(/[\s-]/g, ""))) p.push(`Button ${i + 1} needs a phone number like +919876543210`);
      });
    }
    return p;
  }, [form, auth, varCount]);

  const submitProblems = useMemo(() => {
    const p = [...problems];
    if (!auth) {
      for (let i = 0; i < varCount; i++) if (!String(form.variableSamples[i] || "").trim()) { p.push("Add a sample for every variable — Meta rejects templates without them"); break; }
      if (mediaHeader && !form.headerHandle && !(editing && form.headerFileName)) p.push(`Upload a sample ${form.headerType.toLowerCase()} for the header`);
      if (form.headerType === "TEXT" && form.headerText.includes("{{1}}") && !form.headerExample.trim()) p.push("Add a sample for the header variable");
      form.buttons.forEach((b, i) => {
        if ((b.type === "URL" && b.value.includes("{{1}}") && !b.example.trim()) || (b.type === "COPY_CODE" && !b.example.trim())) p.push(`Button ${i + 1} needs an example`);
      });
    }
    return p;
  }, [problems, form, auth, varCount, mediaHeader, editing]);

  const payload = (saveDraft) => ({
    accountId: form.accountId || undefined,
    templateName: form.templateName,
    displayName: form.displayName.trim(),
    language: form.language,
    category: form.category,
    headerType: auth ? "NONE" : form.headerType,
    headerText: form.headerType === "TEXT" ? form.headerText : null,
    headerExample: form.headerType === "TEXT" ? form.headerExample : null,
    headerHandle: mediaHeader ? form.headerHandle || null : null,
    bodyText: auth ? "{{1}}" : form.bodyText,
    variableSamples: form.variableSamples.slice(0, varCount),
    footerText: auth ? null : form.footerText || null,
    buttons: auth ? [{ type: "OTP", text: form.otpButtonText || "Copy code" }] : form.buttons,
    addSecurityRecommendation: form.addSecurityRecommendation,
    codeExpirationMinutes: auth && form.codeExpirationMinutes !== "" ? Number(form.codeExpirationMinutes) : null,
    saveDraft,
  });

  const save = async (saveDraft) => {
    const list = saveDraft ? problems : submitProblems;
    if (list.length) return toast.error(list[0]);
    setSaving(saveDraft ? "draft" : "submit");
    try {
      let result = editing
        ? await whatsappTemplatesApi.update(template.id, payload(saveDraft))
        : await whatsappTemplatesApi.create(payload(saveDraft));
      // Editing a draft only changes it locally; submitting it is a separate step.
      if (editing && !saveDraft && String(result?.status).toUpperCase() === "DRAFT") {
        result = await whatsappTemplatesApi.submit(template.id);
      }
      if (String(result?.status).toUpperCase() === "REJECTED" && result.rejectedReason) {
        toast.error(`Meta refused it: ${result.rejectedReason}`);
      } else {
        toast.success(saveDraft ? "Draft saved" : editing ? "Changes sent to Meta for review" : "Submitted to Meta for review");
      }
      onSaved?.(result);
      onOpenChange(false);
    } catch (e) {
      toast.error(e?.message || "Could not save the template");
    } finally {
      setSaving(null);
    }
  };

  const previewTemplate = {
    ...form,
    buttons: auth ? [{ type: "OTP", text: form.otpButtonText }] : form.buttons,
    bodyText: form.bodyText,
    codeExpirationMinutes: form.codeExpirationMinutes,
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-5 py-4 border-b border-border text-left">
          <DialogTitle className="text-base font-semibold">{editing ? "Edit template" : "New WhatsApp template"}</DialogTitle>
          <DialogDescription className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span>Meta reviews every template before it can be sent — usually within minutes, up to 24 hours.</span>
            <a href={account?.templateManagerUrl || templateManagerUrl(account?.wabaId)} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm">
              Open in Meta WhatsApp Manager <ExternalLink className="h-3 w-3" aria-hidden />
            </a>
          </DialogDescription>
        </DialogHeader>

        <div className="grid lg:grid-cols-[1fr_320px] max-h-[72vh] overflow-y-auto lg:overflow-hidden">
          <div className="p-5 space-y-5 lg:overflow-y-auto lg:max-h-[72vh]">
            {/* Basics */}
            <section className="space-y-3" aria-labelledby="tb-basics">
              <h3 id="tb-basics" className="text-2xs font-medium uppercase tracking-wider text-muted-foreground">Basics</h3>
              <div className="grid sm:grid-cols-2 gap-3">
                {accounts.length > 1 && (
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label className="text-xs">WhatsApp number (template is created in its business account)</Label>
                    <Select value={form.accountId} onValueChange={(v) => set({ accountId: v })} disabled={editing}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Choose a number" /></SelectTrigger>
                      <SelectContent>{accounts.map((a) => <SelectItem key={a.id} value={a.id} className="text-xs">{accountName(a)}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label htmlFor="tb-display" className="text-xs">Name</Label>
                  <Input id="tb-display" value={form.displayName} maxLength={100}
                    onChange={(e) => set({ displayName: e.target.value, ...(nameTouched ? {} : { templateName: slug(e.target.value) }) })}
                    placeholder="Site visit reminder" className="h-8 text-xs" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="tb-name" className="text-xs">Meta template name</Label>
                  <Input id="tb-name" value={form.templateName} disabled={editing}
                    onChange={(e) => { setNameTouched(true); set({ templateName: slug(e.target.value) }); }}
                    placeholder="site_visit_reminder" className="h-8 text-xs font-mono" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Language</Label>
                  <Select value={form.language} onValueChange={(v) => set({ language: v })} disabled={editing}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>{TEMPLATE_LANGUAGES.map(([v, l]) => <SelectItem key={v} value={v} className="text-xs">{l} <span className="font-mono text-muted-foreground">{v}</span></SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2" role="radiogroup" aria-label="Category">
                {CATEGORIES.map((c) => (
                  <button key={c.value} type="button" role="radio" aria-checked={form.category === c.value}
                    onClick={() => set({ category: c.value })}
                    className={cn("text-left rounded-md border px-3 py-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      form.category === c.value ? "border-primary bg-accent" : "border-border hover:bg-muted/60")}>
                    <span className="block text-xs font-semibold">{c.label}</span>
                    <span className="block text-2xs text-muted-foreground">{c.hint}</span>
                  </button>
                ))}
              </div>
            </section>

            {auth ? (
              <section className="space-y-3" aria-labelledby="tb-auth">
                <h3 id="tb-auth" className="text-2xs font-medium uppercase tracking-wider text-muted-foreground">One-time passcode</h3>
                <p className="text-xs text-muted-foreground">Meta writes the message text for authentication templates. You choose these options:</p>
                <label className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2">
                  <span className="text-xs">Add “For your security, do not share this code.”</span>
                  <Switch checked={form.addSecurityRecommendation} onCheckedChange={(v) => set({ addSecurityRecommendation: v })} />
                </label>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="tb-exp" className="text-xs">Code expires after (minutes, optional)</Label>
                    <Input id="tb-exp" type="number" min={1} max={90} value={form.codeExpirationMinutes} onChange={(e) => set({ codeExpirationMinutes: e.target.value })} className="h-8 text-xs" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="tb-otp" className="text-xs">Copy button label</Label>
                    <Input id="tb-otp" maxLength={25} value={form.otpButtonText} onChange={(e) => set({ otpButtonText: e.target.value })} className="h-8 text-xs" />
                  </div>
                </div>
              </section>
            ) : (
              <>
                {/* Header */}
                <section className="space-y-3" aria-labelledby="tb-header">
                  <h3 id="tb-header" className="text-2xs font-medium uppercase tracking-wider text-muted-foreground">Header <span className="normal-case tracking-normal">(optional)</span></h3>
                  <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Header type">
                    {HEADER_TYPES.map(([v, l]) => (
                      <button key={v} type="button" role="radio" aria-checked={form.headerType === v} onClick={() => set({ headerType: v })}
                        className={cn("h-7 px-3 rounded-md border text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          form.headerType === v ? "border-primary bg-accent text-accent-foreground font-medium" : "border-border hover:bg-muted/60")}>{l}</button>
                    ))}
                  </div>
                  {form.headerType === "TEXT" && (
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="tb-htext" className="text-xs">Header text <span className="text-muted-foreground tabular">{form.headerText.length}/60</span></Label>
                        <Input id="tb-htext" maxLength={60} value={form.headerText} onChange={(e) => set({ headerText: e.target.value })} placeholder="Your quote is ready, {{1}}" className="h-8 text-xs" />
                      </div>
                      {form.headerText.includes("{{1}}") && (
                        <div className="space-y-1.5">
                          <Label htmlFor="tb-hex" className="text-xs">Sample for {"{{1}}"}</Label>
                          <Input id="tb-hex" value={form.headerExample} onChange={(e) => set({ headerExample: e.target.value })} placeholder="Rahul" className="h-8 text-xs" />
                        </div>
                      )}
                    </div>
                  )}
                  {mediaHeader && (
                    <div className="flex flex-wrap items-center gap-3">
                      <input ref={fileRef} type="file" accept={MEDIA_ACCEPT[form.headerType]} className="hidden" onChange={(e) => uploadSample(e.target.files?.[0])} />
                      <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
                        {uploading ? <Loader2 className="animate-spin" /> : form.headerHandle ? <CheckCircle2 className="text-success" /> : <Upload />}
                        {form.headerFileName || `Upload sample ${form.headerType.toLowerCase()}`}
                      </Button>
                      <p className="text-2xs text-muted-foreground">Meta reviews with this sample. You choose the real file each time you send.</p>
                    </div>
                  )}
                </section>

                {/* Body */}
                <section className="space-y-2" aria-labelledby="tb-body">
                  <div className="flex items-center justify-between">
                    <h3 id="tb-body" className="text-2xs font-medium uppercase tracking-wider text-muted-foreground">Body</h3>
                    <Button type="button" variant="ghost" size="sm" className="h-7 text-xs" onClick={insertVariable}>
                      <Braces /> Add variable
                    </Button>
                  </div>
                  <Textarea ref={bodyRef} id="tb-bodytext" value={form.bodyText} maxLength={1024} rows={6}
                    onChange={(e) => set({ bodyText: e.target.value })}
                    placeholder={"Hi {{1}}, your site visit at {{2}} is confirmed for tomorrow.\nReply YES to confirm."}
                    className="text-[13px] leading-relaxed" aria-describedby="tb-body-help" />
                  <p id="tb-body-help" className="text-2xs text-muted-foreground flex justify-between gap-2">
                    <span>Use *bold*, _italic_, ~strike~. Variables are filled per customer when sending.</span>
                    <span className="tabular shrink-0">{form.bodyText.length}/1024</span>
                  </p>
                  {varCount > 0 && (
                    <div className="grid sm:grid-cols-2 gap-2 rounded-md border border-border p-3">
                      <p className="sm:col-span-2 text-2xs text-muted-foreground">Sample values — Meta's reviewers see these.</p>
                      {Array.from({ length: varCount }, (_, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <span className="font-mono text-2xs text-muted-foreground w-10 shrink-0">{`{{${i + 1}}}`}</span>
                          <Input value={form.variableSamples[i] || ""} aria-label={`Sample for variable ${i + 1}`}
                            onChange={(e) => { const s = [...form.variableSamples]; s[i] = e.target.value; set({ variableSamples: s }); }}
                            placeholder={i === 0 ? "Rahul" : "Sample"} className="h-8 text-xs" />
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                {/* Footer */}
                <section className="space-y-1.5">
                  <Label htmlFor="tb-footer" className="text-2xs font-medium uppercase tracking-wider text-muted-foreground">Footer <span className="normal-case tracking-normal">(optional)</span></Label>
                  <Input id="tb-footer" maxLength={60} value={form.footerText} onChange={(e) => set({ footerText: e.target.value })} placeholder="Reply STOP to opt out" className="h-8 text-xs" />
                </section>

                {/* Buttons */}
                <section className="space-y-2" aria-labelledby="tb-buttons">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 id="tb-buttons" className="text-2xs font-medium uppercase tracking-wider text-muted-foreground">Buttons <span className="normal-case tracking-normal">(up to 10)</span></h3>
                    <div className="flex flex-wrap gap-1.5">
                      {BUTTON_TYPES.map((b) => (
                        <Button key={b.type} type="button" variant="outline" size="sm" className="h-7 text-xs"
                          disabled={form.buttons.length >= 10 || countType(b.type) >= b.max} onClick={() => addButton(b.type)}>
                          <Plus /> {b.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                  {form.buttons.length === 0 && <p className="text-xs text-muted-foreground">No buttons. Quick replies make it easy for customers to answer.</p>}
                  {form.buttons.map((b, i) => (
                    <div key={i} className="rounded-md border border-border p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium">{BUTTON_TYPES.find((t) => t.type === b.type)?.label}</span>
                        <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => removeButton(i)} aria-label={`Remove button ${i + 1}`}>
                          <Trash2 />
                        </Button>
                      </div>
                      <div className="grid sm:grid-cols-2 gap-2">
                        {b.type !== "COPY_CODE" && (
                          <Input value={b.text} maxLength={25} onChange={(e) => updateButton(i, { text: e.target.value })} placeholder="Button label" aria-label="Button label" className="h-8 text-xs" />
                        )}
                        {b.type === "URL" && (
                          <Input value={b.value} onChange={(e) => updateButton(i, { value: e.target.value })} placeholder="https://site.com/p/{{1}}" aria-label="Website URL" className="h-8 text-xs font-mono" />
                        )}
                        {b.type === "PHONE_NUMBER" && (
                          <Input value={b.value} onChange={(e) => updateButton(i, { value: e.target.value })} placeholder="+919876543210" aria-label="Phone number" className="h-8 text-xs font-mono" />
                        )}
                        {((b.type === "URL" && b.value.includes("{{1}}")) || b.type === "COPY_CODE") && (
                          <Input value={b.example} onChange={(e) => updateButton(i, { example: e.target.value })}
                            placeholder={b.type === "URL" ? "Example: https://site.com/p/123" : "Example code: SAVE20"} aria-label="Example" className="h-8 text-xs font-mono sm:col-span-2" />
                        )}
                      </div>
                      {b.type === "URL" && <p className="text-2xs text-muted-foreground">End the URL with {"{{1}}"} to add a different ending per customer.</p>}
                    </div>
                  ))}
                </section>
              </>
            )}
          </div>

          {/* Preview */}
          <aside className="border-t lg:border-t-0 lg:border-l border-border bg-muted/30 p-5 space-y-3 lg:overflow-y-auto lg:max-h-[72vh]" aria-label="Preview">
            <h3 className="text-2xs font-medium uppercase tracking-wider text-muted-foreground">Preview</h3>
            <TemplatePreview template={previewTemplate} values={form.variableSamples} headerValue={form.headerExample} headerMediaName={form.headerFileName} />
            {submitProblems.length > 0 && (
              <ul className="space-y-1 text-2xs text-muted-foreground list-disc pl-4" aria-label="Before submitting">
                {submitProblems.slice(0, 4).map((p) => <li key={p}>{p}</li>)}
              </ul>
            )}
          </aside>
        </div>

        <DialogFooter className="px-5 py-3 border-t border-border">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
          {(!editing || String(template?.status).toUpperCase() === "DRAFT") && (
            <Button variant="secondary" size="sm" onClick={() => save(true)} disabled={Boolean(saving)}>
              {saving === "draft" ? <Loader2 className="animate-spin" /> : <Save />} Save draft
            </Button>
          )}
          <Button size="sm" onClick={() => save(false)} disabled={Boolean(saving)}>
            {saving === "submit" ? <Loader2 className="animate-spin" /> : <Send />}
            {editing && String(template?.status).toUpperCase() !== "DRAFT" ? "Save & resubmit to Meta" : "Submit to Meta"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
