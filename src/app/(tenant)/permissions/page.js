"use client";

import React, { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { rolesApi } from "@/lib/api/users";
import { toast } from "sonner";
import {
  ShieldCheck,
  Lock,
  Plus,
  Save,
  Trash2,
  Loader2,
  RefreshCw,
  Pencil,
} from "lucide-react";

// All available permissions from backend PermissionConstants
const ALL_PERMISSIONS = [
  { group: "Dashboard", perms: ["DASHBOARD_VIEW", "MONITORING_VIEW"] },
  { group: "Customers", perms: ["CUSTOMERS_VIEW", "CUSTOMERS_CREATE", "CUSTOMERS_EDIT", "CUSTOMERS_DELETE"] },
  { group: "Leads", perms: ["LEADS_VIEW", "LEADS_CREATE", "LEADS_EDIT", "LEADS_DELETE", "LEADS_ASSIGN", "LEADS_IMPORT", "LEADS_SYNC_META"] },
  { group: "Campaigns", perms: ["CAMPAIGNS_VIEW", "CAMPAIGNS_CREATE", "CAMPAIGNS_MANAGE"] },
  { group: "Calls", perms: ["CALLS_VIEW", "CALLS_MANAGE"] },
  { group: "WhatsApp", perms: ["WHATSAPP_VIEW", "WHATSAPP_SEND", "WHATSAPP_MANAGE"] },
  { group: "Reminders & Docs", perms: ["REMINDERS_VIEW", "REMINDERS_MANAGE", "DOCUMENTS_VIEW", "DOCUMENTS_MANAGE"] },
  { group: "Reports", perms: ["REPORTS_VIEW"] },
  { group: "Users & Roles", perms: ["USERS_VIEW", "USERS_CREATE", "USERS_EDIT", "USERS_DELETE", "ROLES_VIEW", "ROLES_CREATE", "ROLES_EDIT", "ROLES_DELETE"] },
  { group: "Settings", perms: ["SETTINGS_VIEW", "SETTINGS_EDIT"] },
];

const SYSTEM_ROLE_NAMES = ["ADMIN", "BRANCH_HEAD", "MANAGER", "TEAM_LEADER", "AGENT"];

function isSystemRole(name = "") {
  const normalized = name.toUpperCase().replace("ROLE_", "");
  return SYSTEM_ROLE_NAMES.includes(normalized);
}

function formatPermLabel(perm) {
  return perm.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function PermissionsPage() {
  const [roles, setRoles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [editTarget, setEditTarget] = useState(null);

  // Form state
  const [roleName, setRoleName] = useState("");
  const [roleDesc, setRoleDesc] = useState("");
  const [require2fa, setRequire2fa] = useState(false);
  const [selectedPerms, setSelectedPerms] = useState(new Set());

  const loadRoles = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await rolesApi.list();
      setRoles(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(err.message || "Failed to load roles.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRoles();
  }, [loadRoles]);

  const openCreate = () => {
    setEditTarget(null);
    setRoleName("");
    setRoleDesc("");
    setRequire2fa(false);
    setSelectedPerms(new Set());
    setIsDialogOpen(true);
  };

  const openEdit = (role) => {
    setEditTarget(role);
    setRoleName(role.name || "");
    setRoleDesc(role.description || "");
    setRequire2fa(role.require2fa || false);
    setSelectedPerms(new Set(role.permissions || []));
    setIsDialogOpen(true);
  };

  const togglePerm = (perm) => {
    setSelectedPerms((prev) => {
      const next = new Set(prev);
      if (next.has(perm)) next.delete(perm);
      else next.add(perm);
      return next;
    });
  };

  const toggleGroup = (perms) => {
    const allSelected = perms.every((p) => selectedPerms.has(p));
    setSelectedPerms((prev) => {
      const next = new Set(prev);
      if (allSelected) perms.forEach((p) => next.delete(p));
      else perms.forEach((p) => next.add(p));
      return next;
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!roleName.trim()) {
      toast.error("Role name is required.");
      return;
    }
    setIsSaving(true);
    try {
      const body = {
        name: roleName.trim(),
        description: roleDesc.trim(),
        require2fa,
        permissions: Array.from(selectedPerms),
      };
      if (editTarget) {
        await rolesApi.update(editTarget.id, body);
        toast.success(`Role "${roleName}" updated!`);
      } else {
        await rolesApi.create(body);
        toast.success(`Role "${roleName}" created!`);
      }
      setIsDialogOpen(false);
      loadRoles();
    } catch (err) {
      toast.error(err.message || "Failed to save role.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await rolesApi.remove(deleteTarget.id);
      toast.success(`Role "${deleteTarget.name}" deleted.`);
      setDeleteTarget(null);
      loadRoles();
    } catch (err) {
      toast.error(err.message || "Failed to delete role.");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Permissions & Roles"
        subtitle="Create and manage roles with granular permission sets for your team."
      >
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs px-2.5 py-1 bg-muted/60 font-mono">
            {roles.length} Roles
          </Badge>
        </div>
      </PageHeader>

      <div className="flex justify-end gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={loadRoles}
          disabled={isLoading}
          className="h-8 gap-1.5 text-xs"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
        </Button>
        <Button
          size="sm"
          onClick={openCreate}
          className="h-8 gap-1.5 text-xs bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
        >
          <Plus className="h-3.5 w-3.5" />
          New Role
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground text-xs gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading roles...
        </div>
      ) : roles.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground text-xs">
          No roles found. Create your first role.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {roles.map((role) => {
            const locked = isSystemRole(role.name);
            const permCount = role.permissions?.length || 0;

            return (
              <Card
                key={role.id}
                className={`p-5 bg-card border rounded-md shadow-xs flex flex-col justify-between transition-all ${
                  locked ? "border-border/60 bg-muted/20" : "border-border hover:border-primary/40"
                }`}
              >
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3 pb-3 border-b border-border">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <h3 className="font-heading font-extrabold text-base text-foreground">
                          {role.name}
                        </h3>
                        {locked ? (
                          <Badge variant="outline" className="text-[10px] gap-1 bg-muted text-muted-foreground border-border font-semibold">
                            <Lock className="h-3 w-3" />
                            System
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20 font-semibold">
                            Custom
                          </Badge>
                        )}
                        {role.require2fa && (
                          <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200 font-semibold">
                            2FA Required
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {role.description || "No description"} •{" "}
                        <span className="font-mono">{permCount} permissions</span>
                      </p>
                    </div>
                    <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                      <ShieldCheck className="h-4 w-4" />
                    </div>
                  </div>

                  {/* Permission preview */}
                  {permCount > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {(role.permissions || []).slice(0, 6).map((p) => (
                        <span key={p} className="text-[10px] px-1.5 py-0.5 rounded bg-muted border border-border text-muted-foreground font-mono">
                          {p}
                        </span>
                      ))}
                      {permCount > 6 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted border border-border text-muted-foreground">
                          +{permCount - 6} more
                        </span>
                      )}
                    </div>
                  )}

                  {locked && (
                    <div className="p-2.5 rounded bg-muted/40 border border-border flex items-start gap-2 text-[11px] text-muted-foreground">
                      <Lock className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                      <span>System roles have fixed permissions and cannot be modified.</span>
                    </div>
                  )}
                </div>

                <div className="pt-4 mt-4 border-t border-border flex justify-end gap-2">
                  {locked ? (
                    <Button disabled variant="outline" size="sm" className="h-8 text-xs gap-1.5 opacity-60">
                      <Lock className="h-3 w-3" />
                      Non-Editable
                    </Button>
                  ) : (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setDeleteTarget(role)}
                        className="h-8 text-xs gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/5"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => openEdit(role)}
                        className="h-8 text-xs gap-1.5 bg-primary text-primary-foreground font-semibold"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </Button>
                    </>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create / Edit Role Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
          <form onSubmit={handleSave} className="space-y-4 text-xs">
            <DialogHeader>
              <DialogTitle className="font-heading font-extrabold text-base">
                {editTarget ? "Edit Role" : "Create New Role"}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Define a role name and assign granular permissions.
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="space-y-1">
                <Label className="text-xs">Role Name</Label>
                <Input
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                  placeholder="e.g. Field Sales Agent"
                  required
                  className="h-8 text-xs bg-background"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Description</Label>
                <Input
                  value={roleDesc}
                  onChange={(e) => setRoleDesc(e.target.value)}
                  placeholder="Brief description"
                  className="h-8 text-xs bg-background"
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-muted/30 border border-border rounded-md">
              <div>
                <p className="text-xs font-semibold text-foreground">Require 2FA</p>
                <p className="text-[10px] text-muted-foreground">Users with this role must verify via OTP on login.</p>
              </div>
              <Switch checked={require2fa} onCheckedChange={setRequire2fa} />
            </div>

            {/* Permissions */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold">Permissions ({selectedPerms.size} selected)</Label>
                <button
                  type="button"
                  onClick={() => {
                    const all = ALL_PERMISSIONS.flatMap((g) => g.perms);
                    if (selectedPerms.size === all.length) setSelectedPerms(new Set());
                    else setSelectedPerms(new Set(all));
                  }}
                  className="text-[11px] text-primary hover:underline font-medium"
                >
                  {selectedPerms.size === ALL_PERMISSIONS.flatMap((g) => g.perms).length ? "Deselect All" : "Select All"}
                </button>
              </div>

              <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                {ALL_PERMISSIONS.map(({ group, perms }) => {
                  const allGroupSelected = perms.every((p) => selectedPerms.has(p));
                  const someGroupSelected = perms.some((p) => selectedPerms.has(p));
                  return (
                    <div key={group} className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => toggleGroup(perms)}
                          className={`text-[11px] font-bold px-2 py-0.5 rounded border transition-colors ${
                            allGroupSelected
                              ? "bg-primary/10 text-primary border-primary/30"
                              : someGroupSelected
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : "bg-muted text-muted-foreground border-border"
                          }`}
                        >
                          {group}
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1.5 pl-2">
                        {perms.map((perm) => (
                          <button
                            key={perm}
                            type="button"
                            onClick={() => togglePerm(perm)}
                            className={`text-[10px] px-2 py-0.5 rounded border font-mono transition-colors ${
                              selectedPerms.has(perm)
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-background text-muted-foreground border-border hover:border-primary/40"
                            }`}
                          >
                            {formatPermLabel(perm)}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSaving}
                className="bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5"
              >
                {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                {editTarget ? "Save Changes" : "Create Role"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="font-heading font-extrabold text-base">
              Delete Role &quot;{deleteTarget?.name}&quot;?
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              This will permanently delete the role. Users assigned this role will lose their permissions.
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-2">
            <Button variant="outline" size="sm" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 gap-1.5"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
