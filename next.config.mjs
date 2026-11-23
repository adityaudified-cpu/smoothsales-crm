/** @type {import('next').NextConfig} */
// Backend base (with /api context path). Override with INTERNAL_API_URL in Docker / production.
const BACKEND_URL = (process.env.INTERNAL_API_URL || "http://127.0.0.1:8080/api").replace(/\/$/, "");

const nextConfig = {
  output: "standalone",
  transpilePackages: ["@smoothsales/ui", "@smoothsales/lib"],
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${BACKEND_URL}/:path*` }];
  },
};

export default nextConfig;
