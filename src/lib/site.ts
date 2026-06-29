/** Constantes de marque & configuration du site Bloomy. */
export const site = {
  name: "Bloomy",
  tagline: "Bloom Boldly. Spray Confidence.",
  taglineFr: "Affirme ton style. Vaporise ta confiance.",
  description:
    "Bloomy — sprays parfumés pour homme. Des sillages audacieux, frais et inoubliables. Livraison partout en Tunisie, paiement à la livraison.",
  phone: process.env.NEXT_PUBLIC_SHOP_PHONE || "21600000000",
  url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  email: "contact@bloomy.tn",
  social: {
    instagram: "https://instagram.com/bloomy",
    facebook: "https://facebook.com/bloomy",
    tiktok: "https://tiktok.com/@bloomy",
  },
  nav: [
    { label: "Accueil", href: "/" },
    { label: "Boutique", href: "/boutique" },
    { label: "À propos", href: "/a-propos" },
    { label: "Contact", href: "/contact" },
  ],
} as const;

export function whatsappLink(message: string): string {
  const phone = site.phone.replace(/[^0-9]/g, "");
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
