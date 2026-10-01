"use client";

import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Check, Share2, Sparkles } from "lucide-react";

export function ReferralLinkCard({
  referralLink,
  referralCode,
  title = "Your Unique Referral Link",
  subtitle = "Share this link with your network or embed it in client pitches. All signups are automatically attributed to your account.",
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(referralLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    } catch (err) {
      console.error("Clipboard copy failed:", err);
    }
  };

  return (
    <Card className="border-border bg-card shadow-xs">
      <CardContent className="p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Share2 className="h-4 w-4 text-primary" />
              <h3 className="font-heading font-bold text-sm text-foreground">
                {title}
              </h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {subtitle}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-muted-foreground">Promo Code:</span>
            <Badge variant="outline" className="font-mono text-xs font-bold px-2 py-0.5 bg-muted/40">
              {referralCode}
            </Badge>
          </div>
        </div>

        {/* Link Input + Copy Button */}
        <div className="flex items-center gap-2">
          <Input
            readOnly
            value={referralLink}
            className="font-mono text-xs h-10 bg-muted/30 select-all"
          />
          <Button
            type="button"
            onClick={handleCopy}
            className={`gap-2 h-10 shrink-0 text-xs font-semibold transition-all ${
              copied
                ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                : ""
            }`}
          >
            {copied ? (
              <>
                <Check className="h-4 w-4" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copy Link
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
