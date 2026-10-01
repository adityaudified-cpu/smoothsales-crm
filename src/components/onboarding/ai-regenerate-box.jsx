"use client";

import React, { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function AiRegenerateBox({
  title = "Want different options? Describe what you need:",
  placeholder = "e.g. We focus on luxury residential clients with high budgets and require site visit confirmations.",
  buttonLabel = "Regenerate with AI",
  onRegenerate,
  className = "",
}) {
  const [prompt, setPrompt] = useState("");
  const [isRegenerating, setIsRegenerating] = useState(false);

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    // Simulate AI synthesis
    await new Promise((resolve) => setTimeout(resolve, 1100));
    setIsRegenerating(false);
    if (onRegenerate) {
      onRegenerate(prompt);
    }
  };

  return (
    <div
      className={`rounded-xl border border-dashed border-primary/35 bg-primary/[0.03] p-4 sm:p-5 space-y-3.5 transition-colors hover:border-primary/50 ${className}`}
    >
      <div className="flex items-center gap-2">
        <div className="p-1 rounded-md bg-primary/10 text-primary">
          <Sparkles className="h-4 w-4" />
        </div>
        <label className="text-xs sm:text-sm font-semibold text-foreground">
          {title}
        </label>
      </div>

      <Textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder={placeholder}
        className="min-h-[72px] text-xs resize-none bg-background/80 border-border focus-visible:ring-primary/40 placeholder:text-muted-foreground/70"
      />

      <div className="flex justify-end">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isRegenerating}
          onClick={handleRegenerate}
          className="gap-2 border-primary/30 text-primary hover:bg-primary/10 hover:text-primary transition-all text-xs font-semibold"
        >
          {isRegenerating ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
              <span>Analyzing & Refining...</span>
            </>
          ) : (
            <>
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span>{buttonLabel}</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
