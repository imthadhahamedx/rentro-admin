// app/layout.tsx
// Root layout — applies globals.css (Roboto + Tailwind v4 + CSS variables)
// and wraps the whole app in AuthProvider so useAuth() works on every page.

import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/AuthContext";

export const metadata: Metadata = {
  title: "Rentro",
  description: "Rentro management for Staff, Admin and Super Admin",
};

export default function RootLayout({children,}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className="h-full">
      <body className="min-h-full flex flex-col" style={{ fontFamily: "var(--font-sans)" }}>
      <AuthProvider>{children}</AuthProvider></body>
    </html>
  );
}
