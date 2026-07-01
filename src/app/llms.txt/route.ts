import { getProducts } from "@/lib/data/products";
import { getSettings } from "@/lib/data/settings";
import { site } from "@/lib/site";
import { formatTND } from "@/lib/utils";
import { phoneDisplay } from "@/lib/phone";

export const dynamic = "force-dynamic";

/**
 * /llms.txt — résumé Markdown du site destiné aux moteurs d'IA générative
 * (standard llmstxt.org). Donne aux IA un accès clair et structuré au contenu :
 * marque, catalogue à jour (prix, stock), pages clés et contact.
 */
export async function GET() {
  const url = site.url.replace(/\/$/, "");
  const [products, s] = await Promise.all([getProducts(), getSettings()]);

  const L: string[] = [];
  L.push("# Bloomy");
  L.push("");
  L.push(`> ${site.description}`);
  L.push("");
  L.push(
    "Bloomy est une marque tunisienne de parfums (eaux de toilette) pour homme, inspirés des " +
      "grands classiques. Vente en ligne, livraison partout en Tunisie, paiement à la livraison " +
      "(cash on delivery). Prix en dinars tunisiens (TND).",
  );
  L.push("");
  L.push("## Pages principales");
  L.push(`- [Accueil](${url}/)`);
  L.push(`- [Boutique — tous les parfums](${url}/boutique)`);
  L.push(`- [À propos](${url}/a-propos)`);
  L.push(`- [Contact](${url}/contact)`);
  L.push(`- [Livraison & retours](${url}/livraison-retours)`);
  L.push("");
  L.push("## Catalogue");
  for (const p of products) {
    const compare =
      p.compare_at_price && p.compare_at_price > p.price ? ` (au lieu de ${formatTND(p.compare_at_price)})` : "";
    const stock = p.stock > 0 ? "en stock" : "rupture de stock";
    L.push(
      `- [${p.name}](${url}/produit/${p.slug}) — ${formatTND(p.price)}${compare}, ${p.size_ml} ml, ` +
        `famille ${p.family}, ${stock}. ${p.tagline}`,
    );
  }
  L.push("");
  L.push("## Contact & livraison");
  if (s.shop_phone) {
    const second = s.shop_phone_2 ? ` / ${phoneDisplay(s.shop_phone_2)}` : "";
    L.push(`- Téléphone & WhatsApp : ${phoneDisplay(s.shop_phone)}${second}`);
  }
  if (s.shop_email) L.push(`- Email : ${s.shop_email}`);
  L.push("- Zone de livraison : toute la Tunisie (24 gouvernorats), 24–72 h");
  L.push("- Paiement : à la livraison, en espèces");
  L.push("");

  return new Response(L.join("\n"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
