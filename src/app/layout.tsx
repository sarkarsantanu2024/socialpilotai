import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SocialPilot AI — Facebook marketing on autopilot",
  description:
    "Generate, schedule, publish, analyse and promote Facebook content with AI. Built for small businesses.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#244fdb",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
