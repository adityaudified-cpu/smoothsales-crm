"use client";

import React, { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { useAuth } from "@/lib/auth/auth-context";
import { hasRouteAccess } from "@/lib/auth/permissions";
import { AccessDenied } from "@/components/auth/access-denied";

export default function TenantLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  // Check role-based route access
  const isAllowed = user ? hasRouteAccess(user, pathname) : true;

  return (
    <div className="flex min-h-screen bg-background text-foreground antialiased w-full">
      {/* Dynamic Left Sidebar (Collapsible & Compact) */}
      <Sidebar />

      {/* Scrollable Main Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        <Topbar />
        <main className="p-6 max-w-[1700px] w-full mx-auto flex-1">
          {!isAllowed ? <AccessDenied targetRoute={pathname} /> : children}
        </main>
      </div>
    </div>
  );
}

