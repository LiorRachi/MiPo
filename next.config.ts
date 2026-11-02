import type { NextConfig } from "next";

// Next's own hydration/runtime scripts are inline, and there's no
// nonce-based setup here — 'unsafe-inline' is the tradeoff that keeps the
// app working without one (a stricter nonce-based CSP is a possible future
// upgrade). connect-src includes the Supabase project URL since every
// fetch/auth call goes straight to it from the browser.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// React's dev-mode error overlay reconstructs stack traces with eval() —
// never used in production, so 'unsafe-eval' only applies to the dev CSP.
const isDev = process.env.NODE_ENV !== "production";

const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  `connect-src 'self'${supabaseUrl ? ` ${supabaseUrl}` : ""}`,
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
].join("; ");

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          { key: "Content-Security-Policy", value: CONTENT_SECURITY_POLICY },
        ],
      },
    ];
  },
};

export default nextConfig;
