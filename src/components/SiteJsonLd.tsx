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
        "@type": "Organization",
        "@id": `${url}/#organization`,
        name: "Bloomy",
        url: `${url}/`,
        logo: `${url}/brand/bloomy-wordmark-dark.png`,
        description: site.description,
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
