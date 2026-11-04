import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  // Server-only packages kept out of the bundler (native/CommonJS heavy).
  serverExternalPackages: ["pg", "@langchain/langgraph-checkpoint-postgres"],
  images: { remotePatterns: [{ protocol: "https", hostname: "**" }] },
  // Posters read the Barlow TTFs from disk at runtime; tracing does not see readFile paths.
  outputFileTracingIncludes: { "/api/poster/**": ["./src/server/posters/fonts/**"] },
};

export default withNextIntl(nextConfig);
