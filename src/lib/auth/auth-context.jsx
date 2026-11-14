"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { authApi } from "@/lib/api/auth";
import { setAuthTokens, clearAuthTokens } from "@/lib/api/client";
import { ROLES, normalizeRole } from "@/lib/auth/permissions";

const AUTH_SESSION_KEY = "smoothsales_auth_user";
const PENDING_OTP_KEY = "smoothsales_pending_otp";

function mapAuthResponse(res) {
  if (!res) return null;
  const fullName = res.fullName || `${res.firstName || ""} ${res.lastName || ""}`.trim();
  const nameParts = fullName.split(" ").filter(Boolean);
  // Normalize role from backend (e.g. "ROLE_AGENT", "AGENT", "agent") → canonical ROLES value
  const rawRole = res.role || (res.roles ? res.roles.split(",")[0] : "");
  const role = normalizeRole(rawRole) || ROLES.SALES_USER;
  return {
    id: res.userId,
    email: res.email,
    name: fullName,
    fullName,
    initials: nameParts.map((p) => p[0]).join("").slice(0, 2).toUpperCase() || "U",
    role,
    title: res.designation || role || "Team Member",
    phone: res.phone,
    designation: res.designation,
    avatarUrl: res.avatarUrl,
    permissions: res.permissions ? Array.from(res.permissions) : [],
    avatarColor: "bg-primary text-primary-foreground",
  };
}

const AuthContext = createContext({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  pendingOtpUser: null,
  login: async () => {},
  verifyOtp: async () => {},
  resendOtp: async () => {},
  logout: () => {},
  updateUser: () => {},
  switchDemoRole: () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [pendingOtpUser, setPendingOtpUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(AUTH_SESSION_KEY);
      if (stored) setUser(JSON.parse(stored));
      const pending = localStorage.getItem(PENDING_OTP_KEY);
      if (pending) setPendingOtpUser(JSON.parse(pending));
    } catch {}
    setIsLoading(false);
  }, []);

  const persistUser = (u) => {
    setUser(u);
    try { if (u) localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(u)); else localStorage.removeItem(AUTH_SESSION_KEY); } catch {}
  };

  /**
   * Step 1: POST /auth/login
   * If requireOtp=true → store pending user, caller navigates to /verify-otp
   * If requireOtp=false → tokens returned immediately, login complete
   */
  const login = async (email, password) => {
    try {
      const res = await authApi.login(email, password);

      if (res.requireOtp) {
        // Backend sent OTP to email — store pending state
        const pending = { email, name: res.fullName || email.split("@")[0], role: res.role || ROLES.SALES_USER };
        setPendingOtpUser(pending);
        try { localStorage.setItem(PENDING_OTP_KEY, JSON.stringify(pending)); } catch {}
        return { requireOtp: true };
      }

      // No OTP required — tokens in response
      setAuthTokens({ accessToken: res.accessToken, refreshToken: res.refreshToken });
      const mapped = mapAuthResponse(res);
      persistUser(mapped);
      return { requireOtp: false, user: mapped };
    } catch (err) {
      throw err;
    }
  };

  /**
   * Step 2: POST /auth/verify-otp
   */
  const verifyOtp = async (otpCode) => {
    if (!otpCode || otpCode.length !== 6) throw new Error("Please enter a valid 6-digit code.");

    const email = pendingOtpUser?.email;
    if (!email) throw new Error("Session expired. Please login again.");

    const res = await authApi.verifyOtp(email, otpCode);
    setAuthTokens({ accessToken: res.accessToken, refreshToken: res.refreshToken });
    const mapped = mapAuthResponse(res);
    persistUser(mapped);
    setPendingOtpUser(null);
    try { localStorage.removeItem(PENDING_OTP_KEY); } catch {}
    return { success: true, user: mapped };
  };

  const resendOtp = async () => {
    if (!pendingOtpUser?.email) throw new Error("No pending OTP session.");
    await authApi.resendOtp(pendingOtpUser.email);
    return { success: true };
  };

  const logout = useCallback(async () => {
    try { await authApi.logout(); } catch {}
    clearAuthTokens();
    persistUser(null);
    setPendingOtpUser(null);
    try { localStorage.removeItem(PENDING_OTP_KEY); } catch {}
  }, []);

  const updateUser = useCallback((updates) => {
    setUser((prev) => {
      const updated = { ...prev, ...updates };
      try { localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(updated)); } catch {}
      return updated;
    });
  }, []);

  const switchDemoRole = () => {};

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, pendingOtpUser, login, verifyOtp, resendOtp, logout, updateUser, switchDemoRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
