"use client";

import React, { useEffect, useState } from "react";
import { ArrowDownToLine, FileText } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { documentKind, downloadLeadDocument, formatFileSize } from "@/lib/document-store";

// In-browser preview for images, PDFs, audio, video and text; other types fall back to download.
export function DocumentPreviewDialog({ document, onOpenChange }) {
  const [url, setUrl] = useState(null);
  const [text, setText] = useState("");
  const kind = documentKind(document);

  useEffect(() => {
    if (!document?.blob) { setUrl(null); return undefined; }
    const objectUrl = URL.createObjectURL(document.blob);
    setUrl(objectUrl);
    if (kind === "text") document.blob.text().then((value) => setText(value.slice(0, 20000))).catch(() => setText(""));
    return () => URL.revokeObjectURL(objectUrl);
  }, [document, kind]);

  return (
    <Dialog open={Boolean(document)} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92vh] flex-col gap-3 sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 truncate pr-6 text-sm font-bold"><FileText className="h-4 w-4 shrink-0 text-primary" /><span className="truncate">{document?.filename}</span></DialogTitle>
          <DialogDescription className="text-[11px]">
            {document?.leadName} · {document?.category || "Other"} · {formatFileSize(document?.size)} · {document?.uploadedAt ? new Date(document.uploadedAt).toLocaleString() : ""}
          </DialogDescription>
        </DialogHeader>
        <div className="flex min-h-[320px] flex-1 items-center justify-center overflow-auto rounded-lg border border-border bg-muted/30">
          {!url ? <p className="text-xs text-muted-foreground">This saved document has no file data.</p>
            : kind === "image" ? <img src={url} alt={document.filename} className="max-h-[70vh] max-w-full object-contain" />
            : kind === "pdf" ? <iframe src={url} title={document.filename} className="h-[70vh] w-full rounded-lg" />
            : kind === "audio" ? <audio src={url} controls autoPlay className="w-full max-w-md" />
            : kind === "video" ? <video src={url} controls className="max-h-[70vh] max-w-full" />
            : kind === "text" ? <pre className="h-[70vh] w-full overflow-auto whitespace-pre-wrap p-4 text-left font-mono text-[11px]">{text}</pre>
            : <div className="space-y-2 p-8 text-center"><p className="text-xs text-muted-foreground">Preview isn’t available for this file type.</p><Button size="sm" className="h-8 gap-1 text-xs" onClick={() => downloadLeadDocument(document)}><ArrowDownToLine className="h-3.5 w-3.5" />Download to open</Button></div>}
        </div>
        <div className="flex justify-end"><Button variant="outline" size="sm" className="h-8 gap-1 text-xs" disabled={!document?.blob} onClick={() => downloadLeadDocument(document)}><ArrowDownToLine className="h-3.5 w-3.5" />Download</Button></div>
      </DialogContent>
    </Dialog>
  );
}
