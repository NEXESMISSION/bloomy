import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { site } from "@/lib/site";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} — Parfums pour homme`,
    template: `%s · ${site.name}`,
  },
  description: site.description,
  keywords: ["Bloomy", "parfum homme", "eau de toilette", "Tunisie", "Sauvage", "Bleu de Chanel"],
  openGraph: {
    title: `${site.name} — Parfums pour homme`,
    description: site.description,
    type: "website",
    locale: "fr_TN",
  },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${inter.variable}`} style={{ ["--font-display" as any]: "var(--font-sans)" }}>
      <body>{children}</body>
    </html>
  );
}
