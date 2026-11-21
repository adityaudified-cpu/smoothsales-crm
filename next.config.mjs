/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  transpilePackages: ["@smoothsales/ui", "@smoothsales/lib"],
  async rewrites() {
    return [
      {
        source: "/api/wa-bridge/:path*",
        destination: "https://crm.smoothsales.in/api/wa-bridge/:path*",
      },
      {
        source: "/api/:path*",
        destination: "http://127.0.0.1:8080/api/:path*",
      },
    ];
  },
};

export default nextConfig;
