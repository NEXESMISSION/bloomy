"use server";

import { createOrder } from "@/lib/data/orders";
import { validateCode } from "@/lib/data/discounts";
import { createReview } from "@/lib/data/reviews";
import { getSettings } from "@/lib/data/settings";
import { GOUVERNORATS } from "@/lib/tunisia";
import type { NewOrderInput, NewReviewInput } from "@/lib/types";

export async function submitReview(
  input: NewReviewInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const settings = await getSettings();
    if (!settings.reviews_enabled) return { ok: false, error: "Les avis sont désactivés." };
    if (!input.author_name?.trim() || input.author_name.trim().length < 2) {
      return { ok: false, error: "Veuillez indiquer votre nom." };
    }
    if (!(input.rating >= 1 && input.rating <= 5)) {
      return { ok: false, error: "Veuillez choisir une note." };
    }
    if (!input.comment?.trim() || input.comment.trim().length < 3) {
      return { ok: false, error: "Veuillez écrire un commentaire." };
    }
    await createReview(input);
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? "Une erreur est survenue." };
  }
}

export type DiscountPreview = {
  ok: boolean;
  message: string;
  discount: number;
  type: "percent" | "fixed" | null;
  value: number;
  min_subtotal: number;
};

/** Aperçu d'un code promo au checkout (la validation finale a lieu à la commande). */
export async function validateDiscount(code: string, subtotal: number): Promise<DiscountPreview> {
  const v = await validateCode(code, subtotal);
  return {
    ok: v.ok,
    message: v.message,
    discount: v.discount,
    type: v.code?.type ?? null,
    value: v.code?.value ?? 0,
    min_subtotal: v.code?.min_subtotal ?? 0,
  };
}

export type PlaceOrderResult =
  | { ok: true; orderNumber: string }
  | { ok: false; error: string };

export async function placeOrder(input: NewOrderInput): Promise<PlaceOrderResult> {
  try {
    const name = input.customer_name?.trim() ?? "";
    if (name.length < 2) return { ok: false, error: "Veuillez saisir votre nom complet." };

    const phone = (input.phone ?? "").replace(/[\s.-]/g, "");
    if (!/^(\+?216)?[0-9]{8}$/.test(phone)) {
      return { ok: false, error: "Numéro de téléphone invalide (8 chiffres)." };
    }

    if (!input.governorate || !GOUVERNORATS.includes(input.governorate)) {
      return { ok: false, error: "Veuillez choisir un gouvernorat." };
    }
    if (!input.address?.trim() || input.address.trim().length < 5) {
      return { ok: false, error: "Veuillez saisir une adresse de livraison complète." };
    }
    if (!input.items?.length) return { ok: false, error: "Votre panier est vide." };

    const order = await createOrder({ ...input, customer_name: name, phone });
    return { ok: true, orderNumber: order.order_number };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? "Une erreur est survenue. Réessayez." };
  }
}
