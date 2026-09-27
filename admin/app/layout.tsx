import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Daily Bread Admin",
  description: "Daily Bread administration workspace.",
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/favicon.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#f7f6f2] antialiased">{children}</body>
    </html>
  );
}
