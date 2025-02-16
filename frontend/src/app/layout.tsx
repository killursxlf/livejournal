"use client";

import "./globals.css";
import { SessionProvider } from "next-auth/react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Toaster } from "@/components/ui/toaster";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>
        <SessionProvider>
          <Header />
          <main>{children}</main>
          <Toaster />
          <Footer />
        </SessionProvider>
      </body>
    </html>
  );
}
