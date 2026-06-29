"use client";

import { useEffect } from "react";
import { useCart } from "@/context/cart";

/** Vide le panier à l'arrivée sur la page de confirmation (sans flash "panier vide"). */
export default function ClearCart() {
  const { clear } = useCart();
  useEffect(() => {
    clear();
  }, [clear]);
  return null;
}
