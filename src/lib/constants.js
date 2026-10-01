// Cross-Service Micro-Frontend URL Routing Helpers
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001";
export const ADMIN_URL = process.env.NEXT_PUBLIC_ADMIN_URL || "http://localhost:3002";
export const PARTNERS_URL = process.env.NEXT_PUBLIC_PARTNERS_URL || "http://localhost:3003";
export const MARKETING_URL = process.env.NEXT_PUBLIC_MARKETING_URL || "http://localhost:3000";

export function getAppUrl(path = "") {
  return `${APP_URL}${path}`;
}

export function getAdminUrl(path = "") {
  return `${ADMIN_URL}${path}`;
}

export function getPartnersUrl(path = "") {
  return `${PARTNERS_URL}${path}`;
}

export function getMarketingUrl(path = "") {
  return `${MARKETING_URL}${path}`;
}

export const urls = {
  marketing: (path = "/") => `${MARKETING_URL}${path}`,
  crm: (path = "/") => `${APP_URL}${path}`,
  admin: (path = "/") => `${ADMIN_URL}${path}`,
  partners: (path = "/") => `${PARTNERS_URL}${path}`,
};
