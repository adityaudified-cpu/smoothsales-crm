"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Settings2,
  ExternalLink,
  Zap,
  SlidersHorizontal,
  Trash2,
  Loader2,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getIntegrationLogo } from "./brand-logos";

export function IntegrationCard({
  item,
  onToggle,
  onConfigure,
  onTest,
  onDisconnect,
  isTesting = false,
}) {
  const isConnected = item.status === "connected" || (item.enabled && item.configured);
  const displayName = item.displayName || item.name || item.key;
  const detailHref = item.key === "google_ads" ? "/integrations/google_ads" : `/integrations/${item.key}`;

  return (
    <div
      className={cn(
        "group relative flex flex-col justify-between p-5 rounded-2xl bg-card border transition-all duration-200 shadow-xs hover:shadow-md min-w-0 overflow-hidden",
        isConnected
          ? "border-emerald-500/40 hover:border-emerald-500/60 bg-gradient-to-b from-card to-emerald-500/[0.02]"
          : "border-border hover:border-border/80"
      )}
    >
      <div className="space-y-3.5 min-w-0">
        {/* Top Bar with Icon, Title & Switch */}
        <div className="flex items-start justify-between gap-3 min-w-0">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Link href={detailHref} className="shrink-0" title={`View ${displayName} Details`}>
              <div className="w-11 h-11 rounded-xl bg-card border border-border/80 p-2 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform cursor-pointer hover:border-primary/50">
                {getIntegrationLogo(item.key, "h-6 w-6")}
              </div>
            </Link>
            <div className="min-w-0 flex-1">
              <Link href={detailHref} className="hover:underline block">
                <h3
                  className="font-heading font-bold text-sm text-foreground truncate cursor-pointer"
                  title={displayName}
                >
                  {displayName}
                </h3>
              </Link>
              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                <span className="text-[10px] font-mono text-muted-foreground uppercase font-semibold">
                  {item.category || "General"}
                </span>
                {item.tag && (
                  <>
                    <span className="text-muted-foreground/40 text-[9px]">•</span>
                    <span className="text-[10px] font-mono text-primary font-medium truncate max-w-[150px]">
                      {item.tag}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="shrink-0 pt-0.5">
            <Switch
              checked={item.enabled || isConnected}
              onCheckedChange={() => onToggle?.(item.key, item.enabled)}
              aria-label={`Toggle ${displayName}`}
            />
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 min-h-[36px]">
          {item.description || "Streamline inbound lead generation and automate customer sync."}
        </p>

        {/* Status Strip */}
        <div className="pt-2 text-[11px] flex items-center justify-between text-muted-foreground border-t border-border/40 min-w-0">
          <div className="flex items-center gap-1.5 truncate">
            {isConnected ? (
              <>
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span className="font-semibold text-emerald-600 dark:text-emerald-400 truncate">
                  Active &amp; Connected
                </span>
              </>
            ) : (
              <>
                <span className="h-2 w-2 rounded-full bg-muted-foreground/30 shrink-0" />
                <span className="truncate">Not Connected</span>
              </>
            )}
          </div>

          {item.lastTestedAt && (
            <span className="font-mono text-[10px] text-muted-foreground shrink-0 ml-2">
              Verified {new Date(item.lastTestedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
        </div>
      </div>

      {/* Footer Action */}
      <div className="pt-3 mt-3 border-t border-border/40 flex items-center justify-between gap-1.5 min-w-0">
        <div className="flex items-center gap-1 shrink-0">
          {(isConnected || item.configured) && onTest && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onTest(item.key)}
              disabled={isTesting}
              className="h-8 text-xs gap-1 font-medium text-muted-foreground hover:text-foreground px-2"
              title="Run live connection test"
            >
              {isTesting ? (
                <Loader2 className="h-3 w-3 animate-spin text-primary" />
              ) : (
                <Zap className="h-3 w-3 text-amber-500" />
              )}
              Test
            </Button>
          )}
          <Link href={detailHref}>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs gap-1 font-medium text-muted-foreground hover:text-foreground px-2"
            >
              <ExternalLink className="h-3 w-3" />
              Details
            </Button>
          </Link>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {item.key === "whatsapp" ? (
            <Button
              size="sm"
              onClick={() => onConfigure?.(item)}
              className="h-8 text-xs gap-1.5 font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs px-2.5"
            >
              Manage Numbers
              <ArrowRight className="h-3 w-3" />
            </Button>
          ) : isConnected ? (
            <div className="flex items-center gap-1">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                    title="More options"
                  >
                    <SlidersHorizontal className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuItem
                    onClick={() => onConfigure?.(item)}
                    className="text-xs gap-2 cursor-pointer"
                  >
                    <Settings2 className="h-3.5 w-3.5 text-muted-foreground" />
                    Configure Settings
                  </DropdownMenuItem>
                  {onTest && (
                    <DropdownMenuItem
                      onClick={() => onTest(item.key)}
                      className="text-xs gap-2 cursor-pointer"
                    >
                      <Zap className="h-3.5 w-3.5 text-amber-500" />
                      Test Connection
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => onDisconnect?.(item.key)}
                    className="text-xs gap-2 text-rose-600 focus:text-rose-600 focus:bg-rose-50 dark:focus:bg-rose-950/40 cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Disconnect
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                variant="secondary"
                size="sm"
                onClick={() => onConfigure?.(item)}
                className="h-8 text-xs gap-1.5 font-semibold shadow-xs px-2.5 border border-border/60 hover:bg-secondary/80"
              >
                <Settings2 className="h-3.5 w-3.5 text-muted-foreground" />
                Configure
              </Button>
            </div>
          ) : (
            <Button
              size="sm"
              onClick={() => onConfigure?.(item)}
              className="h-8 text-xs gap-1.5 font-semibold bg-primary text-primary-foreground shadow-xs px-3 hover:bg-primary/90"
            >
              Connect
              <ArrowRight className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
