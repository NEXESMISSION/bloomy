/** Constantes de marque & configuration du site Bloomy. */
export const site = {
  name: "Bloomy",
  tagline: "Bloom Boldly. Spray Confidence.",
  taglineFr: "Affirme ton style. Vaporise ta confiance.",
  description:
    "Bloomy — sprays parfumés pour homme. Des sillages audacieux, frais et inoubliables. Livraison partout en Tunisie, paiement à la livraison.",
  // Le téléphone et l'email NE sont PAS ici : ils sont pilotés depuis le super
  // admin (table `settings` → shop_phone / shop_phone_2 / shop_email) et lus via
  // getSettings(). Voir src/lib/phone.ts pour le formatage / liens WhatsApp.
  url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  // Les liens réseaux sociaux sont pilotés depuis le super admin
  // (settings → shop_instagram / shop_facebook), affichés via le pied de page.
  nav: [
    { label: "Accueil", href: "/" },
    { label: "Boutique", href: "/boutique" },
    { label: "À propos", href: "/a-propos" },
    { label: "Contact", href: "/contact" },
  ],
} as const;
