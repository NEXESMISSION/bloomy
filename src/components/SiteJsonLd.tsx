import { site } from "@/lib/site";
import { phoneIntl } from "@/lib/phone";
import type { ShopSettings } from "@/lib/types";

/** Données structurées Organization + WebSite (schema.org) — comprises par Google
 *  ET les moteurs d'IA (ChatGPT, Perplexity…) pour identifier & citer la marque. */
export default function SiteJsonLd({ settings }: { settings: ShopSettings }) {
  const url = site.url.replace(/\/$/, "");
  const sameAs = [settings.shop_instagram, settings.shop_facebook].filter(Boolean);
  const hasContact = settings.shop_phone || settings.shop_email;

  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": ["Organization", "OnlineStore"],
        "@id": `${url}/#organization`,
        name: "Bloomy",
        legalName: "Bloomy",
        url: `${url}/`,
        logo: {
          "@type": "ImageObject",
          url: `${url}/icons/icon-512.png`,
          width: 512,
          height: 512,
        },
        image: `${url}/og.png`,
        description: site.description,
        slogan: site.taglineFr,
        foundingDate: "2026",
        areaServed: { "@type": "Country", name: "Tunisia" },
        knowsLanguage: ["fr", "ar"],
        ...(settings.shop_email ? { email: settings.shop_email } : {}),
        ...(settings.shop_phone ? { telephone: `+${phoneIntl(settings.shop_phone)}` } : {}),
        ...(sameAs.length ? { sameAs } : {}),
        ...(hasContact
          ? {
              contactPoint: {
                "@type": "ContactPoint",
                contactType: "customer service",
                ...(settings.shop_phone ? { telephone: `+${phoneIntl(settings.shop_phone)}` } : {}),
                ...(settings.shop_email ? { email: settings.shop_email } : {}),
                areaServed: "TN",
                availableLanguage: ["fr", "ar"],
              },
            }
          : {}),
        address: { "@type": "PostalAddress", addressCountry: "TN", addressLocality: "Tunis" },
      },
      {
        "@type": "WebSite",
        "@id": `${url}/#website`,
        url: `${url}/`,
        name: "Bloomy",
        description: site.description,
        inLanguage: "fr-TN",
        publisher: { "@id": `${url}/#organization` },
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
