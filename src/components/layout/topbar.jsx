"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Search, Building2, Bell, User, Settings, LogOut, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/auth/auth-context";

const MOCK_NOTIFICATIONS = [
  { id: 1, title: "New lead assigned", desc: "Aditya Narayan — Apex Tech", time: "2m ago", unread: true },
  { id: 2, title: "Follow-up overdue", desc: "Meera Kulkarni — 3 hrs past due", time: "1h ago", unread: true },
  { id: 3, title: "Deal moved to Proposal", desc: "Kavita Nair — Zenith Retail", time: "2h ago", unread: false },
  { id: 4, title: "WhatsApp delivered", desc: "Rajeshwar Iyer — Trident Eng.", time: "3h ago", unread: false },
];

export function Topbar() {
  const { user, logout } = useAuth();
  const initials = user?.initials || "U";
  const unreadCount = MOCK_NOTIFICATIONS.filter((n) => n.unread).length;

  return (
    <header suppressHydrationWarning className="h-14 bg-card border-b border-border px-6 flex items-center justify-between sticky top-0 z-10 shrink-0">
      {/* Left: Search input */}
      <div className="flex items-center w-full max-w-md">
        <div className="relative w-full">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search leads, deals, contacts… (Ctrl+K)"
            className="pl-8 h-8 text-xs bg-background border-border focus-visible:ring-1 focus-visible:ring-primary rounded-md"
            readOnly
            suppressHydrationWarning
          />
        </div>
      </div>

      {/* Right: Tenant pill, Notifications, User Avatar */}
      <div className="flex items-center gap-2">
        {/* Tenant Switcher Pill */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-background border border-border text-xs font-medium text-foreground">
          <Building2 className="h-3.5 w-3.5 text-primary shrink-0" />
          <span>{user?.tenantName || user?.companyName || "SmoothSales Workspace"}</span>
        </div>

        {/* Notifications Bell */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button suppressHydrationWarning className="relative h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent border border-transparent hover:border-border transition-all">
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-primary ring-2 ring-card" />
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="flex items-center justify-between">
              <span className="font-bold text-sm">Notifications</span>
              {unreadCount > 0 && (
                <Badge className="text-[10px] h-5 px-1.5 bg-primary text-primary-foreground">{unreadCount} new</Badge>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {MOCK_NOTIFICATIONS.map((n) => (
              <DropdownMenuItem key={n.id} className="flex flex-col items-start gap-0.5 py-2.5 cursor-pointer">
                <div className="flex items-center justify-between w-full gap-2">
                  <span className={`text-xs font-semibold ${n.unread ? "text-foreground" : "text-muted-foreground"}`}>
                    {n.unread && <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary mr-1.5 mb-0.5" />}
                    {n.title}
                  </span>
                  <span className="text-[10px] text-muted-foreground shrink-0">{n.time}</span>
                </div>
                <span className="text-[11px] text-muted-foreground pl-3">{n.desc}</span>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/notifications" className="text-xs text-center text-primary font-semibold justify-center cursor-pointer">
                View all notifications
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Avatar Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button suppressHydrationWarning className="flex items-center gap-1.5 h-8 px-1.5 rounded-lg hover:bg-accent border border-transparent hover:border-border transition-all">
              <Avatar className="h-6 w-6 border border-border">
                <AvatarFallback className="text-[10px] font-bold bg-primary text-primary-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel className="font-normal">
              <p className="text-xs font-bold text-foreground">{user?.name || "User"}</p>
              <p className="text-[11px] text-muted-foreground">{user?.email}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="text-xs cursor-pointer">
              <Link href="/profile" className="flex items-center gap-2">
                <User className="h-3.5 w-3.5" />
                My Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="text-xs cursor-pointer">
              <Link href="/settings" className="flex items-center gap-2">
                <Settings className="h-3.5 w-3.5" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="text-xs text-destructive focus:text-destructive cursor-pointer flex items-center gap-2">
              <LogOut className="h-3.5 w-3.5" />
              Log Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
