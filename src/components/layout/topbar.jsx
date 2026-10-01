"use client";

import React from "react";
import { Search, Building2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/lib/auth/auth-context";

export function Topbar() {
  const { user } = useAuth();
  const initials = user?.initials || "U";
  const avatarColor = user?.avatarColor || "bg-primary text-primary-foreground";

  return (
    <header className="h-14 bg-card border-b border-border px-6 flex items-center justify-between sticky top-0 z-10 shrink-0">
      {/* Left: Search input */}
      <div className="flex items-center w-full max-w-md">
        <div className="relative w-full">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search leads, deals, contacts…"
            className="pl-8 h-8 text-xs bg-background border-border focus-visible:ring-1 focus-visible:ring-primary rounded-md"
            readOnly
          />
        </div>
      </div>

      {/* Right: Tenant pill & User Avatar */}
      <div className="flex items-center gap-3">
        {/* Tenant Switcher Pill */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-background border border-border text-xs font-medium text-foreground">
          <Building2 className="h-3.5 w-3.5 text-primary shrink-0" />
          <span>Jaipur Interiors</span>
        </div>

        {/* User Avatar with Initials */}
        <Avatar className="h-8 w-8 border border-border">
          <AvatarFallback className={`text-xs font-semibold ${avatarColor}`}>
            {initials}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
