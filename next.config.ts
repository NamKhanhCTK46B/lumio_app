import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// Trỏ tới `src/i18n/request.ts` để next-intl auto-discover config.
const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Build standalone server.js + minimal node_modules — cần cho Dockerfile production.
  output: "standalone",
};

export default withNextIntl(nextConfig);
