import type { Metadata, Viewport } from "next";
import "./globals.css";
import { THEME_INIT_SCRIPT } from "@/lib/utils/theme";

export const metadata: Metadata = {
  title: "MiPo · מי פה",
  description: "מעקב בקשות חופשה לצוות",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="he" dir="rtl" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
