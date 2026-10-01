"use client";

import React, { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MOCK_ROLE_PERMISSIONS,
  VISIBILITY_SCOPE_OPTIONS,
  REASSIGNMENT_PERMISSION_OPTIONS,
} from "@/lib/mock-data/role-permissions";
import { toast } from "sonner";
import {
  ShieldCheck,
  Lock,
  Users,
  Eye,
  UserCheck,
  Save,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from "lucide-react";

export default function PermissionsPage() {
  const [roleConfigs, setRoleConfigs] = useState(MOCK_ROLE_PERMISSIONS);

  const handleScopeChange = (roleKey, newScope) => {
    setRoleConfigs((prev) =>
      prev.map((r) =>
        r.role === roleKey ? { ...r, visibilityScope: newScope } : r
      )
    );
  };

  const handleReassignmentChange = (roleKey, newPerm) => {
    setRoleConfigs((prev) =>
      prev.map((r) =>
        r.role === roleKey ? { ...r, reassignmentPermission: newPerm } : r
      )
    );
  };

  const handleSaveRole = (roleItem) => {
    toast.success(`Permissions saved for ${roleItem.role}`, {
      description: `Visibility: ${
        VISIBILITY_SCOPE_OPTIONS.find((s) => s.value === roleItem.visibilityScope)?.label
      } · Reassignment: ${
        REASSIGNMENT_PERMISSION_OPTIONS.find((p) => p.value === roleItem.reassignmentPermission)?.label
      }`,
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Permissions & Visibility"
        subtitle="Control organizational access boundaries, lead visibility scopes, and manual reassignment rights by role."
      >
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs px-2.5 py-1 bg-muted/60 font-mono">
            4 Configured Roles
          </Badge>
        </div>
      </PageHeader>

      {/* Role Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {roleConfigs.map((item) => {
          const isLocked = item.isLocked;

          const currentScopeObj =
            VISIBILITY_SCOPE_OPTIONS.find(
              (o) => o.value === item.visibilityScope
            ) || VISIBILITY_SCOPE_OPTIONS[0];

          const currentReassignObj =
            REASSIGNMENT_PERMISSION_OPTIONS.find(
              (o) => o.value === item.reassignmentPermission
            ) || REASSIGNMENT_PERMISSION_OPTIONS[0];

          return (
            <Card
              key={item.role}
              className={`p-5 bg-card border rounded-md shadow-xs flex flex-col justify-between transition-all ${
                isLocked
                  ? "border-border/60 bg-muted/20 opacity-95"
                  : "border-border hover:border-primary/40"
              }`}
            >
              <div className="space-y-4">
                {/* Role Header */}
                <div className="flex items-start justify-between gap-3 pb-3 border-b border-border">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <h3 className="font-heading font-extrabold text-base text-foreground">
                        {item.role}
                      </h3>
                      {isLocked ? (
                        <Badge
                          variant="outline"
                          className="text-[10px] gap-1 bg-muted text-muted-foreground border-border font-semibold"
                        >
                          <Lock className="h-3 w-3 text-muted-foreground" />
                          <span>System Fixed</span>
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="text-[10px] bg-primary/10 text-primary border-primary/20 font-semibold"
                        >
                          Configurable
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground font-medium">
                      {item.title} • <span className="font-mono">{item.userCount} active users</span>
                    </div>
                  </div>

                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed">
                  {item.description}
                </p>

                {/* Scope & Permissions Controls */}
                <div className="space-y-4 pt-1">
                  {/* 1. Lead Visibility Scope */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                        <Eye className="h-3.5 w-3.5 text-primary" />
                        <span>Lead Visibility Scope</span>
                      </label>
                    </div>

                    <Select
                      disabled={isLocked}
                      value={item.visibilityScope}
                      onValueChange={(val) => handleScopeChange(item.role, val)}
                    >
                      <SelectTrigger className="h-9 text-xs bg-background">
                        <SelectValue placeholder="Select visibility scope" />
                      </SelectTrigger>
                      <SelectContent>
                        {VISIBILITY_SCOPE_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value} className="text-xs">
                            <span className="font-medium">{opt.label}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <p className="text-[11px] text-muted-foreground leading-tight">
                      {currentScopeObj.description}
                    </p>
                  </div>

                  {/* 2. Reassignment Permission */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                        <UserCheck className="h-3.5 w-3.5 text-primary" />
                        <span>Reassignment Permission</span>
                      </label>
                    </div>

                    <Select
                      disabled={isLocked}
                      value={item.reassignmentPermission}
                      onValueChange={(val) =>
                        handleReassignmentChange(item.role, val)
                      }
                    >
                      <SelectTrigger className="h-9 text-xs bg-background">
                        <SelectValue placeholder="Select reassignment permission" />
                      </SelectTrigger>
                      <SelectContent>
                        {REASSIGNMENT_PERMISSION_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value} className="text-xs">
                            <span className="font-medium">{opt.label}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <p className="text-[11px] text-muted-foreground leading-tight">
                      {currentReassignObj.description}
                    </p>
                  </div>
                </div>

                {isLocked && (
                  <div className="p-2.5 rounded bg-muted/40 border border-border flex items-start gap-2 text-[11px] text-muted-foreground">
                    <Lock className="h-3.5 w-3.5 shrink-0 mt-0.5 text-muted-foreground" />
                    <span>
                      Administrator permissions are fixed to unrestricted access across all leads and users to ensure unblockable audit control.
                    </span>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <div className="pt-4 mt-4 border-t border-border flex justify-end">
                {isLocked ? (
                  <Button
                    disabled
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs gap-1.5 opacity-60"
                  >
                    <Lock className="h-3 w-3" />
                    <span>Non-Editable</span>
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => handleSaveRole(item)}
                    className="h-8 text-xs gap-1.5 bg-primary text-primary-foreground font-semibold"
                  >
                    <Save className="h-3.5 w-3.5" />
                    <span>Save Changes</span>
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
