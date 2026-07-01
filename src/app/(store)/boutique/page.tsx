import type { Metadata } from "next";
import { getProducts } from "@/lib/data/products";
import BoutiqueFilter from "@/components/BoutiqueFilter";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Boutique",
  description: "Tous les parfums Bloomy — homme & femme, toutes saisons. Paiement à la livraison.",
};

export default async function BoutiquePage() {
  const products = await getProducts();
  return (
    <div className="container-bloomy py-10 sm:py-14">
      <div className="text-center">
        <span className="eyebrow">La collection</span>
        <h1 className="mt-3 text-3xl sm:text-5xl">La boutique</h1>
        <p className="mx-auto mt-3 max-w-md text-muted">
          Nos parfums inspirés des plus grands. Paiement à la livraison, partout en Tunisie.
        </p>
      </div>
      <BoutiqueFilter products={products} />
    </div>
  );
}
