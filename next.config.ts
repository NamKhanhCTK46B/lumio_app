import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// Trỏ tới `src/i18n/request.ts` để next-intl auto-discover config.
const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Build standalone server.js + minimal node_modules — cần cho Dockerfile production.
  output: "standalone",
  // Không bundle các native Node.js packages của Google Cloud vào client build.
  serverExternalPackages: [
    "@google-cloud/speech",
    "@google-cloud/text-to-speech",
  ],
};

export default withNextIntl(nextConfig);
