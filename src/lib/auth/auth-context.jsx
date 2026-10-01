"use client";

import React, { createContext, useContext, useState } from "react";
import { ROLES } from "@/lib/auth/permissions";

const AUTH_SESSION_KEY = "smoothsales_auth_user";
const PENDING_OTP_KEY = "smoothsales_pending_otp";

export const DEMO_ACCOUNTS = [
  {
    email: "admin@smoothsales.ai",
    password: "password123",
    name: "Vikram Singhania",
    initials: "VS",
    role: ROLES.ADMIN,
    title: "Tenant Administrator",
    avatarColor: "bg-purple-600 text-white",
  },
  {
    email: "manager@smoothsales.ai",
    password: "password123",
    name: "Pooja Deshmukh",
    initials: "PD",
    role: ROLES.MANAGER,
    title: "Regional Sales Manager",
    avatarColor: "bg-emerald-600 text-white",
  },
  {
    email: "teamleader@smoothsales.ai",
    password: "password123",
    name: "Rohan Varma",
    initials: "RV",
    role: ROLES.TEAM_LEADER,
    title: "Floor Team Leader",
    avatarColor: "bg-amber-600 text-white",
  },
  {
    email: "aarav.sharma@smoothsales.ai",
    password: "password123",
    name: "Aarav Sharma",
    initials: "AS",
    role: ROLES.SALES_USER,
    title: "Inside Sales Telecaller",
    avatarColor: "bg-blue-600 text-white",
  },
];

const AuthContext = createContext({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  pendingOtpUser: null,
  login: async () => {},
  verifyOtp: async () => {},
  resendOtp: async () => {},
  logout: () => {},
  switchDemoRole: () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    if (typeof window === "undefined") return DEMO_ACCOUNTS[0];
    try {
      const storedUser = localStorage.getItem(AUTH_SESSION_KEY);
      return storedUser ? JSON.parse(storedUser) : DEMO_ACCOUNTS[0];
    } catch {
      return DEMO_ACCOUNTS[0];
    }
  });

  const [pendingOtpUser, setPendingOtpUser] = useState(() => {
    if (typeof window === "undefined") return null;
    try {
      const storedOtp = localStorage.getItem(PENDING_OTP_KEY);
      return storedOtp ? JSON.parse(storedOtp) : null;
    } catch {
      return null;
    }
  });

  const [isLoading, setIsLoading] = useState(false);

  /**
   * Step 1: User submits Work Email + Password.
   * If valid, sets pendingOtpUser and returns true (ready to navigate to /verify-otp).
   */
  const login = async (email, password) => {
    // Check demo accounts first
    const matchedAccount = DEMO_ACCOUNTS.find(
      (a) => a.email.toLowerCase() === email.toLowerCase()
    );

    const targetUser = matchedAccount || {
      email,
      name: email.split("@")[0].replace(".", " "),
      initials: email.slice(0, 2).toUpperCase(),
      role: ROLES.SALES_USER,
      title: "Team Member",
      avatarColor: "bg-blue-600 text-white",
    };

    // Store pending OTP session
    setPendingOtpUser(targetUser);
    try {
      localStorage.setItem(PENDING_OTP_KEY, JSON.stringify(targetUser));
    } catch {}

    return { success: true, user: targetUser };
  };

  /**
   * Step 2: User enters 6-digit OTP.
   * On success, sets active session and clears pending state.
   */
  const verifyOtp = async (otpCode) => {
    if (!otpCode || otpCode.length !== 6) {
      throw new Error("Please enter a valid 6-digit verification code.");
    }

    // Accepts demo code '123456' or any 6-digit code for testing
    const verifiedUser = pendingOtpUser || user || DEMO_ACCOUNTS[0];

    setUser(verifiedUser);
    setPendingOtpUser(null);

    try {
      localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(verifiedUser));
      localStorage.removeItem(PENDING_OTP_KEY);
    } catch {}

    return { success: true, user: verifiedUser };
  };

  const resendOtp = async () => {
    return { success: true, message: "A new OTP code has been sent to your work email." };
  };

  const logout = () => {
    setUser(null);
    setPendingOtpUser(null);
    try {
      localStorage.removeItem(AUTH_SESSION_KEY);
      localStorage.removeItem(PENDING_OTP_KEY);
    } catch {}
  };

  /**
   * Fast Demo Role Switcher for instant live permission testing
   */
  const switchDemoRole = (role) => {
    const matched = DEMO_ACCOUNTS.find((a) => a.role === role) || {
      ...user,
      role,
    };
    setUser(matched);
    try {
      localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(matched));
    } catch {}
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        pendingOtpUser,
        login,
        verifyOtp,
        resendOtp,
        logout,
        switchDemoRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
