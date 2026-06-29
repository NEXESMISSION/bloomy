import type { Metadata } from "next";
import { getProducts } from "@/lib/data/products";
import ProductCard from "@/components/ProductCard";

export const metadata: Metadata = {
  title: "Boutique",
  description: "Tous les parfums Bloomy pour homme. 50ml, paiement à la livraison.",
};

export default async function BoutiquePage() {
  const products = await getProducts();
  return (
    <div className="container-bloomy py-10 sm:py-14">
      <div className="text-center">
        <span className="eyebrow">La collection</span>
        <h1 className="mt-3 text-3xl sm:text-5xl">La boutique</h1>
        <p className="mx-auto mt-3 max-w-md text-muted">
          Quatre eaux de toilette inspirées des plus grands. Paiement à la livraison.
        </p>
      </div>
      <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-9 sm:gap-x-6 lg:grid-cols-4">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </div>
  );
}
