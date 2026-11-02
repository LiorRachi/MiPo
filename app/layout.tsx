import type { Metadata, Viewport } from "next";
import "./globals.css";
import ServiceWorkerRegister from "@/components/shared/ServiceWorkerRegister";
import { LIGHT_THEME_COLOR, THEME_INIT_SCRIPT } from "@/lib/utils/theme";

export const metadata: Metadata = {
  title: "MiPo · מי פה",
  description: "מעקב בקשות חופשה לצוות",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Static SSR fallback for the one instant before THEME_INIT_SCRIPT (below)
  // resolves and overwrites it with the real light/dark value — light
  // matches :root's own default background in globals.css.
  themeColor: LIGHT_THEME_COLOR,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="he" dir="rtl" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body>
        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  );
}
