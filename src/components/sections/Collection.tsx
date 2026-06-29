import Link from "next/link";
import type { Product } from "@/lib/types";
import ProductCard from "@/components/ProductCard";

export default function Collection({ products }: { products: Product[] }) {
  return (
    <section id="collection" className="container-bloomy py-16 sm:py-20">
      <div className="flex items-end justify-between gap-4">
        <div>
          <span className="eyebrow">La collection</span>
          <h2 className="mt-2 text-3xl sm:text-4xl">Nos parfums</h2>
        </div>
        <Link href="/boutique" className="link-underline hidden text-sm font-medium sm:inline">
          Tout voir
        </Link>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-9 sm:gap-x-6 lg:grid-cols-4">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>

      <div className="mt-10 text-center sm:hidden">
        <Link href="/boutique" className="btn-outline w-full">
          Tout voir
        </Link>
      </div>
    </section>
  );
}
