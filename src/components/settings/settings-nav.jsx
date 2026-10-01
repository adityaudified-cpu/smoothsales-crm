"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Settings, Palette, Globe } from "lucide-react";

export function SettingsNav() {
  const pathname = usePathname();

  const tabs = [
    { name: "General Settings", href: "/settings", icon: Settings },
    { name: "Branding & Theme", href: "/settings/branding", icon: Palette },
    { name: "Custom Domain", href: "/settings/domain", icon: Globe },
  ];

  return (
    <div className="flex items-center gap-1 border-b border-border pb-1 overflow-x-auto">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = pathname === tab.href;

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-md transition-colors shrink-0",
              isActive
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            <span>{tab.name}</span>
          </Link>
        );
      })}
    </div>
  );
}
