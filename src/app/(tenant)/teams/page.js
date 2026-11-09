"use client";

import React, { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, MoreHorizontal, Loader2, RefreshCw } from "lucide-react";
import { usersApi, rolesApi } from "@/lib/api/users";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const DEFAULT_ROLE_OPTIONS = [
  { value: "AGENT", label: "Sales Agent" },
  { value: "TEAM_LEADER", label: "Team Leader" },
  { value: "BRANCH_HEAD", label: "Branch Head / Manager" },
  { value: "ADMIN", label: "Admin" },
];

const ROLE_DISPLAY_LABELS = {
  ADMIN: "Admin",
  BRANCH_HEAD: "Branch Head",
  MANAGER: "Branch Head",
  TEAM_LEADER: "Team Leader",
  AGENT: "Sales Agent",
};

function getRoleDisplayLabel(role = "") {
  const normalized = role.toUpperCase().replace("ROLE_", "");
  return ROLE_DISPLAY_LABELS[normalized] || normalized.replace(/_/g, " ");
}

function getInitials(name = "") {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "U";
}

function getRoleBadgeClass(role = "") {
  const r = role.toLowerCase();
  if (r.includes("admin")) return "bg-purple-50 text-purple-800 border-purple-300";
  if (r.includes("manager") || r.includes("branch")) return "bg-emerald-50 text-emerald-800 border-emerald-300";
  if (r.includes("leader")) return "bg-amber-50 text-amber-800 border-amber-300";
  return "bg-muted text-foreground border-border";
}

function getStatusDot(active) {
  return active
    ? <span className="h-2 w-2 rounded-full bg-green-500 shrink-0" />
    : <span className="h-2 w-2 rounded-full bg-neutral-400 shrink-0" />;
}

export default function TeamsAndUsersPage() {
  const [users, setUsers] = useState([]);
  const [roleOptions, setRoleOptions] = useState(DEFAULT_ROLE_OPTIONS);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editUser, setEditUser] = useState(null);

  // Invite form state
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [invitePhone, setInvitePhone] = useState("");
  const [inviteRole, setInviteRole] = useState("AGENT");
  const [inviteDesignation, setInviteDesignation] = useState("");
  const [inviteReportsTo, setInviteReportsTo] = useState("");

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const [usersResult, rolesResult] = await Promise.allSettled([
        usersApi.list({ page: 0, size: 200 }),
        rolesApi.list(),
      ]);
      if (usersResult.status === "fulfilled") {
        setUsers(usersResult.value.items || []);
      } else {
        toast.error(usersResult.reason?.message || "Failed to load users.");
      }
      if (rolesResult.status === "fulfilled" && Array.isArray(rolesResult.value) && rolesResult.value.length > 0) {
        setRoleOptions(
          rolesResult.value.map((r) => ({ value: r.name.toUpperCase(), label: r.name }))
        );
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const resetInviteForm = () => {
    setInviteName("");
    setInviteEmail("");
    setInvitePhone("");
    setInviteRole("AGENT");
    setInviteDesignation("");
    setInviteReportsTo("");
    setEditUser(null);
  };

  const handleOpenInvite = () => {
    resetInviteForm();
    setIsAddUserOpen(true);
  };

  const handleOpenEdit = (user) => {
    setEditUser(user);
    setInviteName(user.fullName || "");
    setInviteEmail(user.email || "");
    setInvitePhone(user.phone || "");
    setInviteRole((user.role || "AGENT").toUpperCase().replace("ROLE_", ""));
    setInviteDesignation(user.designation || "");
    setInviteReportsTo(user.reportsToId || "");
    setIsAddUserOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inviteName.trim() || !inviteEmail.trim()) {
      toast.error("Name and email are required.");
      return;
    }
    setIsSubmitting(true);
    try {
      if (editUser) {
        // Update existing user
        const nameParts = inviteName.trim().split(" ");
        const firstName = nameParts[0];
        const lastName = nameParts.slice(1).join(" ") || "."; // backend @NotBlank — use "." if single name
        await usersApi.update(editUser.id, {
          firstName,
          lastName,
          email: inviteEmail,
          phone: invitePhone,
          role: inviteRole.toUpperCase(),
          reportsToId: inviteReportsTo || null,
          twoFactorEnabled: editUser.twoFactorEnabled || false,
        });
        toast.success(`${inviteName} updated successfully!`);
      } else {
        // Invite new user — role sent uppercase to match seeded role names (ADMIN, AGENT, TEAM_LEADER etc.)
        await usersApi.invite({
          name: inviteName,
          email: inviteEmail,
          phone: invitePhone,
          role: inviteRole.toUpperCase(),
          designation: inviteDesignation,
          reportsToId: inviteReportsTo || null,
        });
        toast.success(`Invite sent to ${inviteEmail}!`);
      }
      setIsAddUserOpen(false);
      resetInviteForm();
      loadUsers();
    } catch (err) {
      toast.error(err.message || "Operation failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (user) => {
    const newActive = !user.active;
    // Optimistic update
    setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, active: newActive } : u));
    try {
      await usersApi.setStatus(user.id, newActive);
      toast.success(`${user.fullName} ${newActive ? "activated" : "deactivated"}.`);
    } catch (err) {
      // Revert
      setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, active: !newActive } : u));
      toast.error(err.message || "Failed to update status.");
    }
  };

  // Group users by role for "Teams" tab
  const roleGroups = users.reduce((acc, u) => {
    const role = getRoleDisplayLabel(u.role || "Agent");
    if (!acc[role]) acc[role] = [];
    acc[role].push(u);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <PageHeader
        title="Teams & Users"
        subtitle="Manage your team members, roles, and access"
      />

      <Tabs defaultValue="users" className="w-full space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-2">
          <TabsList className="bg-muted/60 p-1 border border-border">
            <TabsTrigger value="users" className="text-xs font-medium">
              Users ({users.length})
            </TabsTrigger>
            <TabsTrigger value="teams" className="text-xs font-medium">
              By Role ({Object.keys(roleGroups).length})
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={loadUsers}
              disabled={isLoading}
              className="h-8 gap-1.5 text-xs font-medium"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", isLoading && "animate-spin")} />
            </Button>
            <Button
              size="sm"
              onClick={handleOpenInvite}
              className="h-8 gap-1.5 text-xs bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Invite User</span>
            </Button>
          </div>
        </div>

        {/* Users Tab */}
        <TabsContent value="users" className="m-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground text-xs gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading users...
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground text-xs">
              No users found. Invite your first team member.
            </div>
          ) : (
            <Card className="bg-card border border-border rounded-lg overflow-hidden shadow-none">
              <Table>
                <TableHeader className="bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground">
                  <TableRow>
                    <TableHead className="py-2.5 px-4">Name</TableHead>
                    <TableHead className="py-2.5 px-4">Role</TableHead>
                    <TableHead className="py-2.5 px-4">Designation</TableHead>
                    <TableHead className="py-2.5 px-4">Reports To</TableHead>
                    <TableHead className="py-2.5 px-4">Status</TableHead>
                    <TableHead className="py-2.5 px-4">Active</TableHead>
                    <TableHead className="py-2.5 px-4 text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="text-xs divide-y divide-border">
                  {users.map((user) => {
                    const displayRole = getRoleDisplayLabel(user.role || "Agent");
                    return (
                      <TableRow key={user.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell className="py-2.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <Avatar className="h-7 w-7 border border-border">
                              <AvatarFallback className="text-[10px] font-semibold bg-primary text-primary-foreground">
                                {getInitials(user.fullName)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-semibold text-foreground leading-tight">
                                {user.fullName}
                                {user.pendingInvite && (
                                  <span className="ml-1.5 text-[9px] font-semibold text-amber-600 bg-amber-50 border border-amber-200 px-1 py-0.5 rounded">
                                    Pending
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-muted-foreground font-mono">{user.email}</div>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell className="py-2.5 px-4">
                          <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-semibold border", getRoleBadgeClass(displayRole))}>
                            {displayRole}
                          </span>
                        </TableCell>

                        <TableCell className="py-2.5 px-4 text-muted-foreground">
                          {user.designation || "—"}
                        </TableCell>

                        <TableCell className="py-2.5 px-4 text-muted-foreground">
                          {user.reportsToName || "—"}
                        </TableCell>

                        <TableCell className="py-2.5 px-4">
                          <div className="inline-flex items-center gap-1.5 font-medium text-foreground">
                            {getStatusDot(user.active)}
                            <span>{user.active ? "Active" : "Inactive"}</span>
                          </div>
                        </TableCell>

                        <TableCell className="py-2.5 px-4">
                          <Switch
                            checked={user.active}
                            onCheckedChange={() => handleToggleStatus(user)}
                          />
                        </TableCell>

                        <TableCell className="py-2.5 px-4 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground">
                                <MoreHorizontal className="h-3.5 w-3.5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="text-xs">
                              <DropdownMenuItem onClick={() => handleOpenEdit(user)}>
                                Edit Details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className={user.active ? "text-destructive" : "text-green-600"}
                                onClick={() => handleToggleStatus(user)}
                              >
                                {user.active ? "Deactivate" : "Activate"}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>

        {/* By Role Tab */}
        <TabsContent value="teams" className="m-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground text-xs gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading...
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(roleGroups).map(([role, members]) => {
                const overflowCount = Math.max(0, members.length - 4);
                return (
                  <Card key={role} className="p-4 bg-card border border-border shadow-none rounded-md space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-heading font-bold text-sm text-foreground">{role}</h3>
                        <span className="text-xs text-muted-foreground">Role Group</span>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-accent text-accent-foreground border border-border">
                        {members.length} {members.length === 1 ? "Member" : "Members"}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-border flex items-center gap-1.5">
                      <div className="flex -space-x-2 overflow-hidden">
                        {members.slice(0, 4).map((member) => (
                          <Avatar key={member.id} className="h-7 w-7 border-2 border-card ring-0">
                            <AvatarFallback className="text-[9px] font-semibold bg-primary text-primary-foreground">
                              {getInitials(member.fullName)}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                      </div>
                      {overflowCount > 0 && (
                        <span className="text-[11px] text-muted-foreground font-medium pl-1">
                          +{overflowCount} more
                        </span>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Invite / Edit User Dialog */}
      <Dialog open={isAddUserOpen} onOpenChange={(open) => { if (!open) resetInviteForm(); setIsAddUserOpen(open); }}>
        <DialogContent className="sm:max-w-[500px]">
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <DialogHeader>
              <DialogTitle className="font-heading font-extrabold text-base">
                {editUser ? "Edit User" : "Invite Team Member"}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                {editUser
                  ? "Update this user's details and role."
                  : "Send an invite email to provision a new team member."}
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="space-y-1">
                <Label className="text-xs">Full Name</Label>
                <Input
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  required
                  className="h-8 text-xs bg-background"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Work Email</Label>
                <Input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="rahul@company.com"
                  required
                  className="h-8 text-xs bg-background"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Phone</Label>
                <Input
                  value={invitePhone}
                  onChange={(e) => setInvitePhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="h-8 text-xs bg-background font-mono"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Role</Label>
                <Select value={inviteRole} onValueChange={setInviteRole}>
                  <SelectTrigger className="h-8 text-xs bg-background">
                    <SelectValue placeholder="Select Role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roleOptions.map((r) => (
                      <SelectItem key={r.value} value={r.value} className="text-xs">
                        {getRoleDisplayLabel(r.value) !== r.value ? getRoleDisplayLabel(r.value) : r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Designation</Label>
                <Input
                  value={inviteDesignation}
                  onChange={(e) => setInviteDesignation(e.target.value)}
                  placeholder="e.g. Sales Executive"
                  className="h-8 text-xs bg-background"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Reports To (Optional)</Label>
                <Select value={inviteReportsTo} onValueChange={setInviteReportsTo}>
                  <SelectTrigger className="h-8 text-xs bg-background">
                    <SelectValue placeholder="Select Manager" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="" className="text-xs">None (Direct)</SelectItem>
                    {users
                      .filter((u) => u.id !== editUser?.id)
                      .map((u) => (
                        <SelectItem key={u.id} value={u.id} className="text-xs">
                          {u.fullName} ({(u.role || "").replace("ROLE_", "")})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => { resetInviteForm(); setIsAddUserOpen(false); }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting}
                className="bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5"
              >
                {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {editUser ? "Save Changes" : "Send Invite"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
