import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { siteConfig } from "@/common/site-config";
import { Navbar } from "@/components/frontend/layout/navbar";
import { Footer } from "@/components/frontend/layout/footer";
import { WhatsAppButton } from "@/components/frontend/layout/whatsapp-button";
import { CookieConsent } from "@/components/frontend/layout/cookie-consent";
import { ToastProvider } from "@/components/common/toast";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plusjakarta",
  weight: ["500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} | ${siteConfig.brand} — Laboratory Reagents & Fine Chemicals`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: [
    "laboratory chemicals India",
    "fine chemicals manufacturer",
    "chemical exporter Mumbai",
    "AR LR HPLC grade reagents",
    "Quanta Chem",
    "specialty chemicals supplier",
  ],
  authors: [{ name: siteConfig.name }],
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: siteConfig.url,
    siteName: siteConfig.name,
    title: `${siteConfig.name} | ${siteConfig.brand}`,
    description: siteConfig.description,
    images: [{ url: "/images/hero/hero-1.jpg", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.name} | ${siteConfig.brand}`,
    description: siteConfig.description,
  },
  robots: { index: true, follow: true },
  icons: { icon: "/images/logo/logo-a-mark.png" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${plusJakarta.variable}`}>
      <body className="flex min-h-screen flex-col font-sans">
        <ToastProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
          <WhatsAppButton />
          <CookieConsent />
        </ToastProvider>
      </body>
    </html>
  );
}
