"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  LayoutDashboard,
  Users,
  Kanban,
  GitBranch,
  UsersRound,
  ShieldCheck,
  Plug,
  BarChart3,
  Settings,
  PanelLeftOpen,
  ChevronsLeft,
  ChevronsRight,
  LogOut,
  ChevronDown,
  Check,
  CalendarCheck,
  TrendingUp,
  Bell,
  MessageCircle,
  Bot,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/lib/auth/auth-context";
import { hasPermission, getRoleLabel, ROLES } from "@/lib/auth/permissions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const SIDEBAR_STORAGE_KEY = "smoothsales_sidebar_collapsed";

const sidebarStore = {
  getSnapshot: () => {
    if (typeof window === "undefined") return false;
    try {
      return localStorage.getItem(SIDEBAR_STORAGE_KEY) === "true";
    } catch {
      return false;
    }
  },
  getServerSnapshot: () => false,
  subscribe: (callback) => {
    if (typeof window === "undefined") return () => {};
    window.addEventListener("storage", callback);
    window.addEventListener("smoothsales-sidebar-toggle", callback);
    return () => {
      window.removeEventListener("storage", callback);
      window.removeEventListener("smoothsales-sidebar-toggle", callback);
    };
  },
  toggle: () => {
    try {
      const current = sidebarStore.getSnapshot();
      const next = !current;
      localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next));
      window.dispatchEvent(new Event("smoothsales-sidebar-toggle"));
    } catch {}
  },
};

export function Sidebar() {
  const pathname = usePathname();
  const isCollapsed = React.useSyncExternalStore(
    sidebarStore.subscribe,
    sidebarStore.getSnapshot,
    sidebarStore.getServerSnapshot
  );

  const toggleSidebar = React.useCallback(() => {
    sidebarStore.toggle();
  }, []);

  // Keyboard shortcut Ctrl+B or Cmd+B to toggle sidebar
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        toggleSidebar();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleSidebar]);

  const { user, logout, switchDemoRole } = useAuth();
  const [leadsExpanded, setLeadsExpanded] = useState(true);
  const [waExpanded, setWaExpanded] = useState(false);

  // Auto-expand WhatsApp group when on a WhatsApp route
  useEffect(() => {
    if (pathname?.startsWith("/whatsapp")) setWaExpanded(true);
  }, [pathname]);

  // Each item has a `permission` field — null means accessible to all authenticated users.
  // hasPermission() checks user.permissions[] from JWT first (works for custom roles),
  // then falls back to static role matrix for demo/offline mode.
  const allNavSections = [
    {
      label: "WORKSPACE",
      items: [
        { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, permission: "DASHBOARD_VIEW" },
        {
          name: "Leads",
          href: "/leads/active",
          icon: Users,
          badge: "24",
          isGroup: true,
          permission: "LEADS_VIEW",
          subItems: [
            { name: "Active Leads", href: "/leads/active" },
            { name: "Worked Leads", href: "/leads/worked" },
            { name: "Customers", href: "/leads/customers" },
            { name: "Businesses", href: "/leads/businesses" },
            { name: "Documents", href: "/leads/documents" },
            { name: "Segments & Lists", href: "/leads/segments" },
            { name: "Distributions", href: "/leads/distributions" },
          ],
        },
        { name: "Deals & Pipeline", href: "/deals", icon: Kanban, badge: "8", permission: "CUSTOMERS_EDIT" },
        { name: "Activities", href: "/activities", icon: CalendarCheck, permission: "CALLS_VIEW" },
        { name: "Forecasting", href: "/forecasting", icon: TrendingUp, permission: "MONITORING_VIEW" },
        {
          name: "WhatsApp",
          href: "/whatsapp/chat",
          icon: MessageCircle,
          isGroup: true,
          groupKey: "whatsapp",
          permission: "WHATSAPP_VIEW",
          subItems: [
            { name: "Connect", href: "/whatsapp/connect" },
            { name: "Live Chat", href: "/whatsapp/chat" },
            { name: "Campaigns", href: "/whatsapp/campaigns" },
            { name: "Templates", href: "/whatsapp/templates" },
            { name: "AI Agent", href: "/whatsapp/ai-agent" },
            { name: "Automation", href: "/whatsapp/automation" },
          ],
        },
        { name: "Distribution Rules", href: "/distribution-rules", icon: GitBranch, permission: "LEADS_ASSIGN" },
        { name: "Teams & Users", href: "/teams", icon: UsersRound, permission: "USERS_VIEW" },
        { name: "Permissions", href: "/permissions", icon: ShieldCheck, permission: "ROLES_VIEW" },
      ],
    },
    {
      label: "SYSTEM",
      items: [
        { name: "Integrations", href: "/integrations", icon: Plug, permission: null },
        { name: "Reports", href: "/reports", icon: BarChart3, permission: "REPORTS_VIEW" },
        { name: "Notifications", href: "/notifications", icon: Bell, permission: null },
        { name: "Settings", href: "/settings", icon: Settings, permission: "SETTINGS_VIEW" },
      ],
    },
  ];

  // Filter by permission — works for system roles AND custom roles
  const navSections = allNavSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => hasPermission(user, item.permission)),
    }))
    .filter((section) => section.items.length > 0);

  return (
    <TooltipProvider delayDuration={150}>
      <aside
        suppressHydrationWarning
        className={cn(
          "bg-card border-r border-border flex flex-col h-screen select-none shrink-0 sticky top-0 transition-[width] duration-300 ease-in-out z-20 relative",
          isCollapsed ? "w-[72px]" : "w-[256px]"
        )}
      >
        {/* Floating Border Collapse/Expand Button positioned on outer edge */}
        <Tooltip delayDuration={200}>
          <TooltipTrigger asChild>
            <button
              suppressHydrationWarning
              onClick={toggleSidebar}
              aria-label={isCollapsed ? "Expand sidebar (Ctrl+B)" : "Collapse sidebar (Ctrl+B)"}
              className="absolute -right-3 top-4 z-40 h-6 w-6 rounded-full bg-card border border-border shadow-sm flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent hover:border-primary/50 transition-all duration-200 cursor-pointer group hover:scale-110 active:scale-95"
            >
              {isCollapsed ? (
                <ChevronsRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 text-foreground" />
              ) : (
                <ChevronsLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5 text-foreground" />
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" sideOffset={10} className="font-medium text-xs">
            {isCollapsed ? "Expand sidebar (Ctrl+B)" : "Collapse sidebar (Ctrl+B)"}
          </TooltipContent>
        </Tooltip>

        {/* Brand Header */}
        <div
          className={cn(
            "h-14 border-b border-border flex items-center transition-all",
            isCollapsed ? "justify-center px-0" : "justify-start px-4"
          )}
        >
          {isCollapsed ? (
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <button
                  suppressHydrationWarning
                  onClick={toggleSidebar}
                  className="h-9 w-9 rounded-xl overflow-hidden border border-border shadow-xs flex items-center justify-center group relative cursor-pointer ring-1 ring-border hover:ring-primary/40 transition-all mx-auto bg-white"
                  aria-label="Expand sidebar"
                >
                  <img
                    src="/images/smoothsales-logo.jpg"
                    alt="SmoothSales Logo"
                    className="w-full h-full object-cover group-hover:opacity-20 transition-opacity"
                  />
                  <PanelLeftOpen className="h-4 w-4 absolute opacity-0 group-hover:opacity-100 transition-opacity text-foreground" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={14}>
                Expand sidebar (Ctrl+B)
              </TooltipContent>
            </Tooltip>
          ) : (
            <Link
              href="/dashboard"
              className="flex items-center gap-2.5 group overflow-hidden"
            >
              <div className="h-8 w-8 rounded-xl overflow-hidden border border-border shadow-xs shrink-0 group-hover:scale-105 transition-transform bg-white">
                <img
                  src="/images/smoothsales-logo.jpg"
                  alt="SmoothSales Logo"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex items-center gap-2 truncate">
                <span className="font-heading font-extrabold text-[15px] tracking-tight text-foreground truncate">
                  SmoothSales
                </span>
                <span className="text-[10px] font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded-md border border-primary/15 tracking-wider shrink-0">
                  CRM
                </span>
              </div>
            </Link>
          )}
        </div>

        {/* Grouped Nav Sections */}
        <div
          className={cn(
            "flex-1 overflow-y-auto py-3 sidebar-scrollbar space-y-4 pb-16",
            isCollapsed ? "px-2" : "px-3"
          )}
        >
          {navSections.map((section, idx) => (
            <div key={section.label} className="space-y-1">
              {/* Section Header or Divider */}
              {isCollapsed ? (
                idx > 0 && <div className="h-px bg-border/50 mx-2 my-2.5" />
              ) : (
                <div className="px-2.5 pt-2 pb-1 text-[10.5px] font-bold text-muted-foreground/60 uppercase tracking-wider">
                  {section.label}
                </div>
              )}

              {/* Items List */}
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isLeadsGroup = item.isGroup && item.name === "Leads";
                  const isWaGroup = item.isGroup && item.groupKey === "whatsapp";
                  const isItemActive =
                    item.href === "/dashboard"
                      ? pathname === "/dashboard"
                      : pathname === item.href ||
                        (pathname?.startsWith("/leads") && item.name === "Leads") ||
                        (pathname?.startsWith("/whatsapp") && item.groupKey === "whatsapp") ||
                        (pathname?.startsWith(item.href) && pathname !== "/dashboard");

                  if (isWaGroup && !isCollapsed) {
                    return (
                      <div key={item.name} className="space-y-0.5">
                        <div
                          className={cn(
                            "relative flex items-center justify-between px-3 py-2 rounded-lg text-[13px] font-medium transition-all group select-none cursor-pointer",
                            isItemActive
                              ? "bg-primary/10 text-primary font-semibold shadow-2xs border border-primary/20"
                              : "text-muted-foreground hover:bg-secondary/70 hover:text-foreground border border-transparent"
                          )}
                          onClick={() => setWaExpanded(!waExpanded)}
                        >
                          {isItemActive && (
                            <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-primary rounded-r-full" />
                          )}
                          <Link
                            href={item.href}
                            onClick={(e) => { e.stopPropagation(); setWaExpanded(true); }}
                            className="flex items-center gap-3 flex-1 min-w-0"
                          >
                            <MessageCircle className={cn("shrink-0 h-4 w-4 transition-transform duration-200 group-hover:scale-105", isItemActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                            <span className="truncate">{item.name}</span>
                          </Link>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setWaExpanded(!waExpanded); }}
                            className="p-0.5 text-muted-foreground hover:text-foreground rounded"
                          >
                            <ChevronDown className={cn("h-3.5 w-3.5 transition-transform duration-200", waExpanded ? "rotate-0" : "-rotate-90")} />
                          </button>
                        </div>
                        {waExpanded && (
                          <div className="pl-7 pr-1 py-1 space-y-0.5 border-l border-border/70 ml-5 my-0.5 animate-in fade-in-50 duration-150">
                            {item.subItems.map((sub) => {
                              const isSubActive = pathname === sub.href || pathname?.startsWith(sub.href + "/");
                              return (
                                <Link
                                  key={sub.href}
                                  href={sub.href}
                                  className={cn(
                                    "flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[12px] transition-colors",
                                    isSubActive
                                      ? "bg-accent text-accent-foreground font-semibold shadow-2xs"
                                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                                  )}
                                >
                                  {sub.name === "AI Agent" && <Bot className="h-3 w-3 shrink-0" />}
                                  <span className="truncate">{sub.name}</span>
                                </Link>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  }

                  if (isLeadsGroup && !isCollapsed) {
                    return (
                      <div key={item.name} className="space-y-0.5">
                        <div
                          className={cn(
                            "relative flex items-center justify-between px-3 py-2 rounded-lg text-[13px] font-medium transition-all group select-none cursor-pointer",
                            isItemActive
                              ? "bg-primary/10 text-primary font-semibold shadow-2xs border border-primary/20"
                              : "text-muted-foreground hover:bg-secondary/70 hover:text-foreground border border-transparent"
                          )}
                          onClick={() => setLeadsExpanded(!leadsExpanded)}
                        >
                          {isItemActive && (
                            <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-primary rounded-r-full" />
                          )}

                          <Link
                            href={item.href}
                            onClick={(e) => {
                              e.stopPropagation();
                              setLeadsExpanded(true);
                            }}
                            className="flex items-center gap-3 flex-1 min-w-0"
                          >
                            <Icon
                              className={cn(
                                "shrink-0 transition-transform duration-200 group-hover:scale-105 h-4 w-4",
                                isItemActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                              )}
                            />
                            <span className="truncate">{item.name}</span>
                          </Link>

                          <div className="flex items-center gap-1.5 ml-auto">
                            {item.badge && (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/15">
                                {item.badge}
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setLeadsExpanded(!leadsExpanded);
                              }}
                              className="p-0.5 text-muted-foreground hover:text-foreground rounded"
                            >
                              <ChevronDown
                                className={cn(
                                  "h-3.5 w-3.5 transition-transform duration-200",
                                  leadsExpanded ? "rotate-0" : "-rotate-90"
                                )}
                              />
                            </button>
                          </div>
                        </div>

                        {/* Expandable Sub-items */}
                        {leadsExpanded && (
                          <div className="pl-7 pr-1 py-1 space-y-0.5 border-l border-border/70 ml-5 my-0.5 animate-in fade-in-50 duration-150">
                            {item.subItems.map((sub) => {
                              const isSubActive =
                                pathname === sub.href ||
                                (sub.href === "/leads/active" && pathname === "/leads");

                              return (
                                <Link
                                  key={sub.href}
                                  href={sub.href}
                                  className={cn(
                                    "flex items-center justify-between px-2.5 py-1.5 rounded-md text-[12px] transition-colors relative",
                                    isSubActive
                                      ? "bg-accent text-accent-foreground font-semibold shadow-2xs"
                                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                                  )}
                                >
                                  <span className="truncate">{sub.name}</span>
                                  {sub.href === "/leads/active" && (
                                    <span className="text-[9.5px] px-1.5 py-0.2 rounded-full bg-primary/10 text-primary font-mono font-semibold">
                                      24
                                    </span>
                                  )}
                                </Link>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  }

                  const linkContent = (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "relative flex items-center transition-all group outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                        isCollapsed
                          ? "h-10 w-10 mx-auto justify-center rounded-xl"
                          : "gap-3 px-3 py-2 rounded-lg text-[13px] font-medium",
                        isItemActive
                          ? "bg-primary/10 text-primary font-semibold shadow-2xs border border-primary/20"
                          : "text-muted-foreground hover:bg-secondary/70 hover:text-foreground border border-transparent"
                      )}
                    >
                      {/* Active indicator bar on expanded */}
                      {isItemActive && !isCollapsed && (
                        <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-primary rounded-r-full" />
                      )}

                      {/* Micro notification dot in compact mode */}
                      {isCollapsed && item.badge && !isItemActive && (
                        <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary ring-2 ring-card" />
                      )}

                      <Icon
                        className={cn(
                          "shrink-0 transition-transform duration-200 group-hover:scale-105",
                          isCollapsed ? "h-[18px] w-[18px]" : "h-4 w-4",
                          isItemActive
                            ? "text-primary"
                            : "text-muted-foreground group-hover:text-foreground"
                        )}
                      />

                      {!isCollapsed && (
                        <>
                          <span className="truncate">{item.name}</span>
                          {item.badge && (
                            <span className="ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/15">
                              {item.badge}
                            </span>
                          )}
                        </>
                      )}
                    </Link>
                  );

                  if (isCollapsed) {
                    return (
                      <Tooltip key={item.href} delayDuration={0}>
                        <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                        <TooltipContent
                          side="right"
                          sideOffset={14}
                          className="font-medium text-xs px-2.5 py-1 bg-foreground text-background shadow-md flex items-center gap-2"
                        >
                          <span>{item.name}</span>
                          {item.badge && (
                            <span className="text-[10px] font-bold px-1.5 py-0.2 bg-primary text-primary-foreground rounded-full">
                              {item.badge}
                            </span>
                          )}
                        </TooltipContent>
                      </Tooltip>
                    );
                  }

                  return linkContent;
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Minimal Enterprise User Profile at Footer with Role Switcher & Logout */}
        <div
          className={cn(
            "border-t border-border mt-auto transition-all bg-card/70 backdrop-blur-xs",
            isCollapsed ? "p-2" : "p-2.5"
          )}
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              {isCollapsed ? (
                <button
                  suppressHydrationWarning
                  className="relative h-10 w-10 mx-auto flex items-center justify-center rounded-xl bg-secondary/60 hover:bg-secondary border border-border/80 transition-all cursor-pointer group"
                >
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="text-[11px] font-bold bg-primary text-primary-foreground">
                      {user?.initials || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="absolute bottom-1 right-1 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-card" />
                </button>
              ) : (
                <button
                  suppressHydrationWarning
                  className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-secondary/70 border border-transparent hover:border-border/60 transition-all cursor-pointer group text-left"
                >
                  <div className="relative shrink-0">
                    <Avatar className="h-8 w-8 border border-border">
                      <AvatarFallback className="text-xs font-bold bg-primary text-primary-foreground">
                        {user?.initials || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-card" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                      {user?.name || "User"}
                    </p>
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-primary font-bold bg-primary/10 px-1.5 py-0.2 rounded">
                        {user?.role || "User"}
                      </span>
                    </div>
                  </div>
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground shrink-0 transition-transform group-hover:translate-y-0.5" />
                </button>
              )}
            </DropdownMenuTrigger>
            <DropdownMenuContent
              side={isCollapsed ? "right" : "top"}
              align={isCollapsed ? "end" : "start"}
              sideOffset={12}
              className="w-56"
            >
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-xs font-bold leading-none text-foreground">{user?.name}</p>
                  <p className="text-[11px] leading-none text-muted-foreground">{user?.email}</p>
                </div>
              </DropdownMenuLabel>
              
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild className="text-xs cursor-pointer">
                <Link href="/settings" className="flex items-center gap-2">
                  <Settings className="h-3.5 w-3.5" />
                  <span>Account Settings</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={logout}
                className="text-xs text-destructive focus:text-destructive cursor-pointer flex items-center gap-2"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Log Out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>
    </TooltipProvider>
  );
}


