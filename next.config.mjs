/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  transpilePackages: ["@smoothsales/ui", "@smoothsales/lib"],
};

export default nextConfig;
