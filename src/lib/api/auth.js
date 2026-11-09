import { apiRequest, setAuthTokens, clearAuthTokens } from "./client";

export const authApi = {
  // POST /auth/login — returns { requireOtp, accessToken, ... }
  login: (email, password) =>
    apiRequest("/auth/login", { method: "POST", body: { email, password } }),

  // POST /auth/verify-otp — returns full AuthResponse with tokens
  verifyOtp: (email, otp) =>
    apiRequest("/auth/verify-otp", { method: "POST", body: { email, otp } }),

  // POST /auth/refresh
  refresh: (refreshToken) =>
    apiRequest("/auth/refresh", { query: { refreshToken }, method: "POST" }),

  // POST /auth/forgot-password
  forgotPassword: (email) =>
    apiRequest("/auth/forgot-password", { method: "POST", body: { email } }),

  // POST /auth/resend-otp
  resendOtp: (email) =>
    apiRequest("/auth/resend-otp", { method: "POST", body: { email } }),

  // POST /auth/reset-password
  resetPassword: (token, newPassword) =>
    apiRequest("/auth/reset-password", { method: "POST", body: { token, newPassword } }),

  // GET /auth/me
  me: () => apiRequest("/auth/me"),

  // PUT /auth/me
  updateProfile: (data) =>
    apiRequest("/auth/me", { method: "PUT", body: data }),

  // POST /auth/logout
  logout: () => apiRequest("/auth/logout", { method: "POST" }),

  // Helpers
  saveTokens: setAuthTokens,
  clearTokens: clearAuthTokens,
};
