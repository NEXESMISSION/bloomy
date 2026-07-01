import type { Metadata, Viewport } from "next";
import { Inter, Fraunces } from "next/font/google";
import "./globals.css";
import { site } from "@/lib/site";
import NavProgress from "@/components/ui/NavProgress";
import RegisterSW from "@/components/RegisterSW";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

// Refined, restrained serif for headings (default opsz — no WONK/SOFT quirk).
const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} — Parfums pour homme en Tunisie`,
    template: `%s · ${site.name}`,
  },
  description: site.description,
  keywords: [
    "Bloomy", "parfum homme Tunisie", "eau de toilette", "parfum pas cher Tunisie",
    "Sauvage", "Bleu de Chanel", "The Most Wanted", "livraison Tunisie", "paiement à la livraison",
  ],
  applicationName: site.name,
  alternates: { canonical: "/" },
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Bloomy", statusBarStyle: "default" },
  icons: { apple: "/icons/apple-touch-icon.png" },
  openGraph: {
    siteName: site.name,
    title: `${site.name} — Parfums pour homme en Tunisie`,
    description: site.description,
    url: site.url,
    type: "website",
    locale: "fr_TN",
    images: [{ url: "/photos/lineup.png", width: 1200, height: 630, alt: "Bloomy — collection de parfums" }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${site.name} — Parfums pour homme en Tunisie`,
    description: site.description,
    images: ["/photos/lineup.png"],
  },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 } },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${inter.variable} ${fraunces.variable}`}>
      <body>
        <RegisterSW />
        <NavProgress />
        {children}
      </body>
    </html>
  );
}
