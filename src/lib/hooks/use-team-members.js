"use client";

import { useState, useEffect, useCallback } from "react";
import { isApiMode } from "@/lib/api/client";
import { usersApi } from "@/lib/api/customers";
import { DEFAULT_REPS } from "@/lib/leads-workspace";

// Normalizes a backend user/staff record into the rep shape used across the app.
function mapUserToRep(user) {
  const name = user.fullName || user.name || `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Unknown";
  const nameParts = name.split(/\s+/).filter(Boolean);
  return {
    id: user.id || user.userId,
    name,
    initials: nameParts.map((p) => p[0]).join("").slice(0, 2).toUpperCase() || "??",
    role: user.designation || user.role || "Sales Rep",
    email: user.email || "",
    phone: user.phone || "",
    avatarColor: "bg-primary/10 text-primary",
  };
}

let _cachedReps = null;
let _cacheTs = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Returns the team member list.
 * - API mode: fetches from /users/assignable (cached for 5 min)
 * - Local mode: returns DEFAULT_REPS
 */
export function useTeamMembers() {
  const api = isApiMode();
  const [reps, setReps] = useState(() => {
    if (!api) return DEFAULT_REPS;
    if (_cachedReps && Date.now() - _cacheTs < CACHE_TTL) return _cachedReps;
    return [];
  });
  const [isLoading, setIsLoading] = useState(api && !_cachedReps);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!api) { setReps(DEFAULT_REPS); return; }
    if (_cachedReps && Date.now() - _cacheTs < CACHE_TTL) { setReps(_cachedReps); return; }
    setIsLoading(true);
    try {
      const users = await usersApi.assignable();
      const mapped = (Array.isArray(users) ? users : users?.content || []).map(mapUserToRep);
      _cachedReps = mapped.length ? mapped : (api ? [] : DEFAULT_REPS);
      _cacheTs = Date.now();
      setReps(_cachedReps);
      setError(null);
    } catch (err) {
      setError(err);
      // In local mode fall back to DEFAULT_REPS; in API mode show empty so no mock data leaks
      setReps(api ? [] : DEFAULT_REPS);
    } finally {
      setIsLoading(false);
    }
  }, [api]);

  useEffect(() => { load(); }, [load]);

  return { reps, isLoading, error, reload: load };
}
