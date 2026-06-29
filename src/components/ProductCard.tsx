"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import type { Product } from "@/lib/types";
import { useCart } from "@/context/cart";
import { formatTND, inspirationOf } from "@/lib/utils";
import BottleShot from "@/components/ui/BottleShot";

export default function ProductCard({ product }: { product: Product; index?: number }) {
  const { add } = useCart();
  const discount =
    product.compare_at_price && product.compare_at_price > product.price
      ? Math.round((1 - product.price / product.compare_at_price) * 100)
      : 0;

  return (
    <div className="group">
      <Link href={`/produit/${product.slug}`} className="relative block aspect-[4/5] overflow-hidden rounded-2xl">
        <BottleShot
          src={product.image}
          alt={product.name}
          sizes="(max-width:640px) 50vw, 25vw"
          className="absolute inset-0 transition-transform duration-500 group-hover:scale-[1.03]"
        />
        {discount > 0 && (
          <span className="absolute left-3 top-3 rounded-full bg-ink px-2.5 py-1 text-[11px] font-semibold text-white">
            −{discount}%
          </span>
        )}
      </Link>

      <div className="mt-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link href={`/produit/${product.slug}`}>
              <h3 className="truncate text-[15px] font-semibold text-ink">{product.name}</h3>
            </Link>
            <p className="truncate text-xs text-muted">{inspirationOf(product)}</p>
          </div>
          <button
            onClick={() => add(product)}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-ink text-white transition hover:bg-ink-80 active:scale-95"
            aria-label={`Ajouter ${product.name}`}
          >
            <Plus className="h-[18px] w-[18px]" />
          </button>
        </div>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-[15px] font-semibold text-ink">{formatTND(product.price)}</span>
          {product.compare_at_price && (
            <span className="text-xs text-muted line-through">{formatTND(product.compare_at_price)}</span>
          )}
        </div>
      </div>
    </div>
  );
}
