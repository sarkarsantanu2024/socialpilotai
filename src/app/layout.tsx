import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

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
    <html lang="en" className={jakarta.variable}>
      <body>{children}</body>
    </html>
  );
}
