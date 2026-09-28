import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs/config";

const nextConfig: NextConfig = {
  // Sentry server config is imported by instrumentation.ts; keep it out of client bundles.
  serverExternalPackages: ["@node-rs/argon2", "pg"],
};

// Sentry only activates when a DSN is configured (see .env.example).
export default process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN
  ? withSentryConfig(nextConfig, {
      silent: true,
      // Source-map upload needs SENTRY_AUTH_TOKEN, SENTRY_ORG and SENTRY_PROJECT; skipped when absent.
      sourcemaps: { disable: !process.env.SENTRY_AUTH_TOKEN },
      telemetry: false,
    })
  : nextConfig;
