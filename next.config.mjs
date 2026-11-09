/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  transpilePackages: ["@smoothsales/ui", "@smoothsales/lib"],
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.INTERNAL_API_URL || "http://localhost:8080/api"}/:path*`,
      },
    ];
  },
};

export default nextConfig;
