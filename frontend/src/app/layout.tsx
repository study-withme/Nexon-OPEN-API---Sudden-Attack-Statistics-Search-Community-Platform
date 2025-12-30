import type { Metadata } from "next";
import { Geist, Geist_Mono, Bai_Jamjuree } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { TopNav } from "@/components/layout/TopNav";
import { Footer } from "@/components/layout/Footer";
import { CookieConsent } from "@/components/layout/CookieConsent";
import { NexonAnalytics } from "@/components/analytics/NexonAnalytics";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const display = Bai_Jamjuree({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "SA DATABASE",
  description: "Sudden Attack stats & community",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${display.variable} antialiased theme-sadb`}
      >
        {/* Nexon Open API Analytics: 클라이언트 사이드에서 지연 로드 */}
        <NexonAnalytics />
        <Providers>
          <div className="min-h-screen flex flex-col relative">
            <TopNav />
            <main className="flex-1 relative z-0">{children}</main>
            <Footer />
            <CookieConsent />
          </div>
        </Providers>
      </body>
    </html>
  );
}
