"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Phone,
  Building2,
  MapPin,
  Plus,
  Search,
  Download,
  Users,
  MessageCircle,
  Eye,
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle,
  MoreHorizontal,
  RotateCw,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { customersApi } from "@/lib/api/customers";
import { formatDistanceToNowStrict, parseISO, isValid } from "date-fns";

const STATUS_CFG = {
  ACTIVE:   { label: "Active",   cls: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30", dot: "bg-emerald-500" },
  AT_RISK:  { label: "At Risk",  cls: "bg-amber-500/10 text-amber-600 border-amber-500/30",   dot: "bg-amber-500" },
  CHURNED:  { label: "Churned",  cls: "bg-rose-500/10 text-rose-600 border-rose-500/30",      dot: "bg-rose-500" },
  INACTIVE: { label: "Inactive", cls: "bg-muted text-muted-foreground border-border",          dot: "bg-muted-foreground" },
};

const TIER_CFG = {
  Enterprise:   "bg-violet-500/10 text-violet-600 border-violet-500/25",
  "Mid-Market": "bg-sky-500/10 text-sky-600 border-sky-500/25",
  SMB:          "bg-slate-500/10 text-slate-600 border-slate-500/25",
};

function formatINR(val) {
  if (!val || isNaN(val)) return "—";
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(val));
}

function formatLastContact(isoString) {
  if (!isoString) return "—";
  try {
    const d = typeof isoString === "string" ? parseISO(isoString) : new Date(isoString);
    if (!isValid(d)) return "—";
    return formatDistanceToNowStrict(d, { addSuffix: true });
  } catch {
    return "—";
  }
}

function getInitials(name = "") {
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase() || "??";
}

const PAGE_SIZE = 15;

export default function CustomersPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [tierFilter, setTierFilter] = useState("all");
  const [ownerFilter, setOwnerFilter] = useState("all");
  const [page, setPage] = useState(1);

  const loadCustomers = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await customersApi.list({ size: 500 });
      // customersApi.list returns unwrapped page: { items, total, ... } or raw array
      const raw = Array.isArray(result) ? result : (result?.items || []);
      // Normalize CustomerResponse → shape the customers table expects
      const normalized = raw.map((c) => ({
        id: c.id,
        fullName: c.fullName || [c.firstName, c.lastName].filter(Boolean).join(" ") || "Unknown",
        businessName: c.company || "",
        designation: c.designation || "",
        phone: c.phone || "",
        email: c.email || "",
        city: c.preferredLocation || "",
        status: c.status === "FRESH" || c.status === "SHUFFLED" || c.status === "LEAD" ? "ACTIVE" : (c.status || "ACTIVE"),
        tier: c.priority === "HIGH" ? "Enterprise" : c.priority === "MEDIUM" ? "Mid-Market" : "SMB",
        totalRevenue: c.totalValue || 0,
        totalDeals: c.totalCalls || 0,
        lastActivityAt: c.lastInteraction || c.updatedAt || c.createdAt,
        assignedTo: c.assignedStaffName ? { name: c.assignedStaffName } : null,
        source: c.sourceDetail || c.source || "",
      }));
      setCustomers(normalized);
    } catch (err) {
      console.error("Failed to load customers:", err);
      setCustomers([]);
      toast.error("Failed to load customer records from server");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadCustomers(); }, [loadCustomers]);

  const owners = useMemo(() => [...new Set(customers.map((c) => c.assignedTo?.name).filter(Boolean))], [customers]);

  const filtered = useMemo(() => {
    return customers.filter((c) => {
      const name = c.fullName || c.name || "";
      const company = c.businessName || c.company || "";
      if (search) {
        const q = search.toLowerCase();
        if (!name.toLowerCase().includes(q) && !company.toLowerCase().includes(q) && !(c.email || "").toLowerCase().includes(q) && !(c.phone || "").includes(q)) return false;
      }
      if (statusFilter !== "all" && c.status !== statusFilter) return false;
      if (tierFilter !== "all" && c.tier !== tierFilter) return false;
      if (ownerFilter !== "all" && c.assignedTo?.name !== ownerFilter) return false;
      return true;
    });
  }, [customers, search, statusFilter, tierFilter, ownerFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const stats = useMemo(() => ({
    total: customers.length,
    active: customers.filter((c) => c.status === "ACTIVE").length,
    atRisk: customers.filter((c) => c.status === "AT_RISK").length,
    churned: customers.filter((c) => c.status === "CHURNED").length,
  }), [customers]);

  const hasActiveFilters = search || statusFilter !== "all" || tierFilter !== "all" || ownerFilter !== "all";

  const handleClearFilters = () => { setSearch(""); setStatusFilter("all"); setTierFilter("all"); setOwnerFilter("all"); setPage(1); };

  const handleCall = (e, c) => {
    e.stopPropagation();
    const phone = (c.phone || "").replace(/[^\d+]/g, "");
    if (!phone) return toast.error("No phone number");
    toast.success(`Dialing ${c.fullName || c.name}...`);
    window.location.assign(`tel:${phone}`);
  };

  const handleWhatsApp = (e, c) => {
    e.stopPropagation();
    const phone = (c.phone || "").replace(/\D/g, "");
    if (!phone) return toast.error("No phone number");
    window.open(`https://wa.me/${phone}`, "_blank", "noopener,noreferrer");
  };

  const handleRowClick = (c) => {
    router.push(`/leads/customers/${c.id}`);
  };

  return (
    <div className="flex flex-col gap-3 pb-10 w-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold text-foreground tracking-tight">Customers</h1>
          <p className="text-[11px] text-muted-foreground">
            {isLoading ? "Loading..." : `${customers.length} total customers · converted from leads`}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <Button variant="outline" size="sm" className="h-7 text-xs px-2.5 gap-1.5 font-semibold rounded-lg" onClick={loadCustomers} disabled={isLoading}>
            <RotateCw className={`h-3 w-3 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" className="h-7 text-xs px-2.5 gap-1.5 font-semibold rounded-lg" onClick={() => toast.success("Exporting customers...")}>
            <Download className="h-3 w-3" />
            Export
          </Button>
          <Button size="sm" className="h-7 text-xs px-2.5 gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-2xs rounded-lg" onClick={() => toast.info("Add Customer — coming soon")}>
            <Plus className="h-3 w-3" />
            Add Customer
          </Button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {[
          { label: "Total Customers", value: stats.total, icon: Users, color: "text-primary", bg: "bg-primary/10" },
          { label: "Active", value: stats.active, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-500/10" },
          { label: "At Risk", value: stats.atRisk, icon: AlertCircle, color: "text-amber-600", bg: "bg-amber-500/10" },
          { label: "Churned", value: stats.churned, icon: Clock, color: "text-rose-600", bg: "bg-rose-500/10" },
        ].map((s) => (
          <div key={s.label} className="flex items-center gap-2.5 p-2.5 rounded-xl border border-border bg-card">
            <div className={`h-8 w-8 rounded-lg ${s.bg} flex items-center justify-center shrink-0`}>
              <s.icon className={`h-4 w-4 ${s.color}`} />
            </div>
            <div>
              <p className="text-lg font-extrabold font-mono leading-none text-foreground">{isLoading ? "—" : s.value}</p>
              <p className="text-[10.5px] text-muted-foreground mt-0.5">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 p-2 rounded-xl border border-border bg-card">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Search name, company, email, phone..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="pl-8 pr-7 h-7 text-xs bg-background" />
          {search && (
            <button type="button" onClick={() => { setSearch(""); setPage(1); }} className="absolute right-2 top-1.5 text-muted-foreground hover:text-foreground">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="h-7 w-32 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="AT_RISK">At Risk</SelectItem>
            <SelectItem value="CHURNED">Churned</SelectItem>
            <SelectItem value="INACTIVE">Inactive</SelectItem>
          </SelectContent>
        </Select>
        <Select value={tierFilter} onValueChange={(v) => { setTierFilter(v); setPage(1); }}>
          <SelectTrigger className="h-7 w-32 text-xs"><SelectValue placeholder="Tier" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tiers</SelectItem>
            <SelectItem value="Enterprise">Enterprise</SelectItem>
            <SelectItem value="Mid-Market">Mid-Market</SelectItem>
            <SelectItem value="SMB">SMB</SelectItem>
          </SelectContent>
        </Select>
        <Select value={ownerFilter} onValueChange={(v) => { setOwnerFilter(v); setPage(1); }}>
          <SelectTrigger className="h-7 w-36 text-xs"><SelectValue placeholder="Owner" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Owners</SelectItem>
            {owners.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="ml-auto flex items-center gap-2">
          {hasActiveFilters && (
            <button type="button" onClick={handleClearFilters} className="text-[11px] text-primary hover:underline font-medium flex items-center gap-1">
              <X className="h-3 w-3" /> Clear filters
            </button>
          )}
          <span className="text-[11px] text-muted-foreground font-medium">{filtered.length} result{filtered.length !== 1 ? "s" : ""}</span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">
                <th className="py-2.5 px-3">Customer</th>
                <th className="py-2.5 px-3">Company & Role</th>
                <th className="py-2.5 px-3">Phone</th>
                <th className="py-2.5 px-3">Location</th>
                <th className="py-2.5 px-3">Tier</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Total Value</th>
                <th className="py-2.5 px-3 text-center">Deals</th>
                <th className="py-2.5 px-3">Owner</th>
                <th className="py-2.5 px-3">Last Contact</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {isLoading ? (
                <tr>
                  <td colSpan={11} className="py-14 text-center text-xs text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      <span>Loading customers...</span>
                    </div>
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-14 text-center text-xs text-muted-foreground">
                    <div className="flex flex-col items-center gap-1.5 max-w-sm mx-auto">
                      <p className="font-semibold text-foreground text-sm">No customers found</p>
                      <p className="text-[11px] text-muted-foreground">
                        {customers.length === 0
                          ? "Customers converted from leads will automatically appear here."
                          : "No customers match your search and filter criteria."}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginated.map((c) => {
                  const name = c.fullName || c.name || "Unknown";
                  const company = c.businessName || c.company || "—";
                  const statusKey = c.status || "INACTIVE";
                  const sc = STATUS_CFG[statusKey] || STATUS_CFG.INACTIVE;
                  const tc = TIER_CFG[c.tier] || TIER_CFG.SMB;
                  const revenue = c.totalRevenue ?? c.totalValue;
                  return (
                    <tr
                      key={c.id}
                      className="hover:bg-muted/30 transition-colors cursor-pointer group"
                      onClick={() => handleRowClick(c)}
                    >
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2.5">
                          <Avatar className="h-7 w-7 border border-border shrink-0">
                            <AvatarFallback className="text-[10px] font-bold bg-primary/10 text-primary">
                              {getInitials(name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold text-foreground text-xs leading-tight hover:text-primary">{name}</p>
                            <p className="text-[10.5px] text-muted-foreground truncate max-w-[160px]">{c.email || "—"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1.5">
                          <Building2 className="h-3 w-3 text-muted-foreground shrink-0" />
                          <div>
                            <p className="font-medium text-foreground text-xs leading-tight">{company}</p>
                            <p className="text-[10.5px] text-muted-foreground">{c.designation || "—"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-foreground whitespace-nowrap">{c.phone || "—"}</td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1 text-muted-foreground text-[11px]">
                          <MapPin className="h-3 w-3 shrink-0" />
                          {c.city || "—"}
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        {c.tier ? (
                          <Badge variant="outline" className={`text-[10px] font-semibold ${tc}`}>{c.tier}</Badge>
                        ) : <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10.5px] font-semibold border ${sc.cls}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${sc.dot}`} />
                          {sc.label}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-foreground text-xs whitespace-nowrap">
                        {formatINR(revenue)}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full text-[10.5px] font-bold font-mono bg-primary/10 text-primary border border-primary/20">
                          {c.totalDeals ?? c.deals ?? 0}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-[11px] text-foreground whitespace-nowrap">
                        {c.assignedTo?.name || "—"}
                      </td>
                      <td className="py-2.5 px-3 text-[11px] text-muted-foreground whitespace-nowrap">
                        {formatLastContact(c.lastActivityAt || c.lastContact)}
                      </td>
                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button type="button" onClick={(e) => handleCall(e, c)} title="Call" className="p-1.5 rounded text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40">
                            <Phone className="h-3.5 w-3.5" />
                          </button>
                          <button type="button" onClick={(e) => handleWhatsApp(e, c)} title="WhatsApp" className="p-1.5 rounded text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40">
                            <MessageCircle className="h-3.5 w-3.5" />
                          </button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button type="button" onClick={(e) => e.stopPropagation()} className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted">
                                <MoreHorizontal className="h-3.5 w-3.5" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40 text-xs">
                              <DropdownMenuItem className="gap-2 text-xs cursor-pointer" onSelect={() => handleRowClick(c)}>
                                <Eye className="h-3.5 w-3.5" /> View Profile
                              </DropdownMenuItem>
                              <DropdownMenuItem className="gap-2 text-xs cursor-pointer" onSelect={(e) => { e.stopPropagation(); toast.info("Edit coming soon"); }}>
                                <Edit2 className="h-3.5 w-3.5" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="gap-2 text-xs text-destructive focus:text-destructive cursor-pointer" onSelect={(e) => { e.stopPropagation(); toast.error("Delete coming soon"); }}>
                                <Trash2 className="h-3.5 w-3.5" /> Remove
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-2.5 border-t border-border bg-muted/20 text-[11px] text-muted-foreground">
            <span>Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}</span>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-2 py-1 rounded border border-border bg-background hover:bg-muted disabled:opacity-40 text-xs font-medium">Prev</button>
              <span className="px-2 font-semibold text-foreground">{page} / {totalPages}</span>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-2 py-1 rounded border border-border bg-background hover:bg-muted disabled:opacity-40 text-xs font-medium">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
