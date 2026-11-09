"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Users,
  CheckCircle,
  Building,
  FileText,
  Layers,
  Share2,
} from "lucide-react";

export const LEADS_NAV_TABS = [
  { id: "active", label: "Active Leads", href: "/leads/active", icon: Users },
  { id: "worked", label: "Worked Leads", href: "/leads/worked", icon: CheckCircle },
  { id: "businesses", label: "Businesses", href: "/leads/businesses", icon: Building },
  { id: "documents", label: "Documents", href: "/leads/documents", icon: FileText },
  { id: "segments", label: "Segments / Lists", href: "/leads/segments", icon: Layers },
  { id: "distributions", label: "Distributions", href: "/leads/distributions", icon: Share2 },
];

export function LeadsSecondaryNav() {
  const pathname = usePathname();

  return (
    <div className="w-full bg-[#0a2f26] border-b border-[#134e40] text-emerald-100 shadow-sm shrink-0">
      <div className="max-w-[1700px] mx-auto px-4 md:px-6 flex items-center justify-between overflow-x-auto no-scrollbar h-11">
        <nav className="flex items-center gap-1.5 min-w-max py-1">
          {LEADS_NAV_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive =
              pathname === tab.href ||
              (tab.id === "active" && (pathname === "/leads" || pathname === "/leads/active"));

            return (
              <Link
                key={tab.id}
                href={tab.href}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150 select-none",
                  isActive
                    ? "bg-[#185344] text-white font-semibold shadow-xs ring-1 ring-emerald-400/30"
                    : "text-emerald-200/75 hover:text-white hover:bg-[#0f3d32]"
                )}
              >
                <Icon
                  className={cn(
                    "h-3.5 w-3.5",
                    isActive ? "text-emerald-300" : "text-emerald-300/70"
                  )}
                />
                <span>{tab.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
