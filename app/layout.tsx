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
  // Draws content edge-to-edge under the Android gesture nav bar — that bar
  // otherwise has no dynamic color of its own and falls back to the
  // installed PWA's static manifest theme_color, which can't track
  // light/dark mode. With this, .tabbar's own (theme-aware) background
  // shows through instead — see its env(safe-area-inset-bottom) padding.
  viewportFit: "cover",
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
