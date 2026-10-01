"use client";

import React from "react";

/* 
// Secondary Leads Tab Bar (Commented out because all 7 sub-routes are already available in the sidebar)
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const LEADS_SUB_TABS = [
  { id: "active", label: "Active Leads", href: "/leads/active" },
  { id: "worked", label: "Worked Leads", href: "/leads/worked" },
  { id: "businesses", label: "Businesses", href: "/leads/businesses" },
  { id: "documents", label: "Documents", href: "/leads/documents" },
  { id: "segments", label: "Segments & Lists", href: "/leads/segments" },
  { id: "uploads", label: "Uploads", href: "/leads/uploads" },
  { id: "distributions", label: "Distributions", href: "/leads/distributions" },
];
*/

export default function LeadsModuleLayout({ children }) {
  return (
    <div className="w-full flex flex-col flex-1">
      {/* 
      // Secondary horizontal tabs bar commented out:
      // All 7 sub-items (Active, Worked, Businesses, Documents, Segments & Lists, Uploads, Distributions)
      // are already directly accessible from the Sidebar.
      */}
      <div className="flex-1 w-full">{children}</div>
    </div>
  );
}
