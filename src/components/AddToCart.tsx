"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import type { Product } from "@/lib/types";
import { useCart } from "@/context/cart";

export default function AddToCart({
  product,
  withQty = false,
  withBuyNow = false,
}: {
  product: Product;
  withQty?: boolean;
  withBuyNow?: boolean;
}) {
  const { add } = useCart();
  const router = useRouter();
  const [qty, setQty] = useState(1);

  const out = product.stock <= 0;

  const buyNow = () => {
    add(product, qty);
    router.push("/commander");
  };

  if (out) {
    return (
      <button disabled className="btn-outline w-full cursor-not-allowed opacity-60">
        Rupture de stock
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      {withQty && (
        <div className="flex items-center justify-center rounded-full border border-line">
          <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="grid h-11 w-11 place-items-center text-ink" aria-label="Diminuer">
            <Minus className="h-4 w-4" />
          </button>
          <span className="w-8 text-center text-base font-semibold text-ink">{qty}</span>
          <button onClick={() => setQty((q) => q + 1)} className="grid h-11 w-11 place-items-center text-ink" aria-label="Augmenter">
            <Plus className="h-4 w-4" />
          </button>
        </div>
      )}

      <button onClick={() => add(product, qty)} className="btn-outline flex-1">
        Ajouter au panier
      </button>

      {withBuyNow && (
        <button onClick={buyNow} className="btn-primary flex-1">
          Commander
        </button>
      )}
    </div>
  );
}
