import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Build standalone server.js + minimal node_modules — cần cho Dockerfile production.
  output: "standalone",
};

export default nextConfig;
