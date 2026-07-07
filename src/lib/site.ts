/** Constantes de marque & configuration du site Bloomy. */

/** Domaine canonique de production (sitemap, liens canoniques, Open Graph, QR).
 *  Google rejette un sitemap dont les URLs ne sont pas sur le même hôte que le
 *  fichier sitemap (erreur « URL not allowed »). En production on ne fait donc
 *  JAMAIS confiance à une URL localhost ou *.vercel.app. */
const CANONICAL_URL = "https://bloomy.best";

function resolveSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/+$/, "");
  const isProd = process.env.NODE_ENV === "production";

  if (!raw) return isProd ? CANONICAL_URL : "http://localhost:3000";
  if (!isProd) return raw;

  // En production : refuser localhost et les préversions Vercel, qui
  // empoisonneraient le sitemap et les liens canoniques.
  let host = "";
  try {
    host = new URL(raw).hostname;
  } catch {
    return CANONICAL_URL; // valeur non parseable → on retombe sur le vrai domaine
  }
  const isBadHost = host === "localhost" || host.endsWith(".vercel.app");
  return isBadHost ? CANONICAL_URL : raw;
}

export const site = {
  name: "Bloomy",
  tagline: "Bloom Boldly. Spray Confidence.",
  taglineFr: "Affirme ton style. Vaporise ta confiance.",
  description:
    "Bloomy — sprays parfumés pour homme. Des sillages audacieux, frais et inoubliables. Livraison partout en Tunisie, paiement à la livraison.",
  // Le téléphone et l'email NE sont PAS ici : ils sont pilotés depuis le super
  // admin (table `settings` → shop_phone / shop_phone_2 / shop_email) et lus via
  // getSettings(). Voir src/lib/phone.ts pour le formatage / liens WhatsApp.
  url: resolveSiteUrl(),
  // Les liens réseaux sociaux sont pilotés depuis le super admin
  // (settings → shop_instagram / shop_facebook), affichés via le pied de page.
  nav: [
    { label: "Accueil", href: "/" },
    { label: "Boutique", href: "/boutique" },
    { label: "À propos", href: "/a-propos" },
    { label: "Contact", href: "/contact" },
  ],
} as const;
