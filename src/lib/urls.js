const isDev = process.env.NODE_ENV !== "production";
const ROOT_DOMAIN = "smoothsales.ai";

export const urls = {
  marketing: (path = "/") => isDev ? `http://localhost:3000${path}` : `https://${ROOT_DOMAIN}${path}`,
  crm: (path = "/") => isDev ? `http://localhost:3001${path}` : `https://app.${ROOT_DOMAIN}${path}`,
  admin: (path = "/") => isDev ? `http://localhost:3002${path}` : `https://admin.${ROOT_DOMAIN}${path}`,
  partners: (path = "/") => isDev ? `http://localhost:3003${path}` : `https://partners.${ROOT_DOMAIN}${path}`,
};
