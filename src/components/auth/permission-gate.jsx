"use client";

import React from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { can } from "@/lib/auth/permissions";

/**
 * PermissionGate conditionally renders children only if the current user
 * has authorization to perform `action` on `resource`.
 *
 * @example
 * <PermissionGate action="delete" resource="leads" fallback={<DisabledBtn />}>
 *   <Button onClick={handleDelete}>Delete</Button>
 * </PermissionGate>
 */
export function PermissionGate({
  action,
  resource,
  fallback = null,
  children,
}) {
  const { user } = useAuth();

  const isAllowed = can(user, action, resource);

  if (!isAllowed) {
    return fallback;
  }

  return <>{children}</>;
}
