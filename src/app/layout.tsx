import type { Metadata } from "next";

import { Suspense } from "react";
import { Geist, Geist_Mono } from "next/font/google";

import "../index.css";
import Providers from "@/components/providers";
import { getToken } from "@/lib/auth-server";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "better-issues",
  description: "A premium issue tracker for small teams",
};

async function AuthenticatedProviders({ children }: { children: React.ReactNode }) {
  const token = await getToken();
  return <Providers initialToken={token}>{children}</Providers>;
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Suspense>
          <AuthenticatedProviders>{children}</AuthenticatedProviders>
        </Suspense>
      </body>
    </html>
  );
}
