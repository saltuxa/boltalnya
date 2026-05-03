import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Болтальня - Просто болтаем.",
  description: "Быстрый и минималистичный мессенджер для неформального общения.",
  manifest: "/manifest.webmanifest",
  applicationName: "Болтальня",
  appleWebApp: {
    capable: true,
    title: "Болтальня",
    statusBarStyle: "black-translucent"
  }
};

export const viewport: Viewport = {
  themeColor: "#0F0F0F",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
