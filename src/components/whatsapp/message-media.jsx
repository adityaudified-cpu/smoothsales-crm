"use client";

import { useEffect, useRef, useState } from "react";
import { FileText, Download, ImageOff, Loader2, MapPin, Play } from "lucide-react";
import { whatsappInboxApi } from "@/lib/api/whatsapp";
import { cn } from "@/lib/utils";

/**
 * Attachment of a chat message. Files are private, so they are fetched with the user's token
 * (only when scrolled into view) and shown from an object URL.
 */
export function MessageMedia({ messageId, mediaType, localUrl, caption, outbound }) {
  const type = String(mediaType || "").toUpperCase();
  const [url, setUrl] = useState(localUrl || null);
  const [state, setState] = useState(localUrl ? "ready" : "idle");
  const ref = useRef(null);

  useEffect(() => {
    if (localUrl || !messageId || type === "LOCATION") return;
    const node = ref.current;
    if (!node) return;
    const controller = new AbortController();
    let objectUrl = null;
    const load = () => {
      setState("loading");
      whatsappInboxApi.mediaUrl(messageId, controller.signal)
        .then((u) => { objectUrl = u; setUrl(u); setState("ready"); })
        .catch((e) => { if (e?.name !== "AbortError") setState("error"); });
    };
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) { io.disconnect(); load(); }
    }, { rootMargin: "200px" });
    io.observe(node);
    return () => {
      io.disconnect();
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [messageId, localUrl, type]);

  const frame = "rounded-md overflow-hidden mb-1.5";

  if (type === "LOCATION") {
    return (
      <div className="flex items-center gap-1.5 mb-1">
        <MapPin className="h-4 w-4 shrink-0" aria-hidden />
        <span className="text-xs">Location shared</span>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className={cn(frame, "flex items-center gap-2 px-3 py-2 text-xs border", outbound ? "border-primary-foreground/20" : "border-border bg-muted/40")}>
        <ImageOff className="h-4 w-4 shrink-0" aria-hidden />
        Attachment unavailable (Meta keeps media for 30 days)
      </div>
    );
  }

  if (type === "IMAGE") {
    return (
      <div ref={ref} className={cn(frame, "w-[240px] max-w-full bg-muted/40")}>
        {url ? (
          <a href={url} target="_blank" rel="noopener noreferrer" aria-label="Open image">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt={caption || "Image"} className="w-full max-h-[320px] object-cover" />
          </a>
        ) : (
          <div className="h-40 flex items-center justify-center" aria-busy="true">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" aria-label="Loading image" />
          </div>
        )}
      </div>
    );
  }

  if (type === "VIDEO") {
    return (
      <div ref={ref} className={cn(frame, "w-[260px] max-w-full bg-muted/40")}>
        {url ? <video controls src={url} className="w-full max-h-[320px]" /> : (
          <div className="h-40 flex items-center justify-center"><Play className="h-5 w-5 text-muted-foreground" aria-label="Video loading" /></div>
        )}
      </div>
    );
  }

  if (type === "AUDIO") {
    return (
      <div ref={ref} className="mb-1.5 w-[240px] max-w-full">
        {url ? <audio controls src={url} className="w-full h-9" /> : <div className="h-9 rounded-md bg-muted/40" />}
      </div>
    );
  }

  // DOCUMENT and anything else downloadable
  const name = (caption || "Document").split("\n")[0];
  return (
    <div ref={ref} className={cn(frame, "flex items-center gap-2.5 px-3 py-2 border min-w-[200px]",
      outbound ? "border-primary-foreground/25 bg-primary-foreground/10" : "border-border bg-muted/40")}>
      <FileText className="h-5 w-5 shrink-0" aria-hidden />
      <span className="text-xs font-medium truncate flex-1">{name}</span>
      {url ? (
        <a href={url} download={name} className="p-1 rounded hover:bg-foreground/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label={`Download ${name}`}>
          <Download className="h-4 w-4" />
        </a>
      ) : state === "loading" ? <Loader2 className="h-4 w-4 animate-spin" aria-label="Loading" /> : null}
    </div>
  );
}
