import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NPS Command Center — Atlas",
  description:
    "Real-time National Park hike readiness dashboard powered by Atlas. Monitor weather, alerts, and safety conditions across all active parks.",
  keywords: [
    "National Parks",
    "NPS",
    "hike readiness",
    "trail safety",
    "weather alerts",
  ],
  authors: [{ name: "Atlas Project" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
