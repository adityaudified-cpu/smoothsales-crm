/** @type {import('next').NextConfig} */
const BACKEND_URL = (process.env.INTERNAL_API_URL || "http://localhost:8080/api").replace(/\/$/, "");

const nextConfig = {
  output: "standalone",
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${BACKEND_URL}/:path*` }];
  },
};

export default nextConfig;
