"use server";

import { createOrder } from "@/lib/data/orders";
import { validateCode } from "@/lib/data/discounts";
import { createReview } from "@/lib/data/reviews";
import { getProductBySlug } from "@/lib/data/products";
import { getSettings } from "@/lib/data/settings";
import { GOUVERNORATS } from "@/lib/tunisia";
import { clientErrorMessage } from "@/lib/errors";
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
    // Le produit doit exister : on dérive product_id/slug du serveur (jamais
    // les valeurs du client) pour éviter les avis sur des produits fantômes.
    const product = await getProductBySlug((input.product_slug ?? "").trim());
    if (!product) return { ok: false, error: "Produit introuvable." };
    await createReview({
      product_id: product.id,
      product_slug: product.slug,
      author_name: input.author_name,
      rating: input.rating,
      comment: input.comment,
    });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: clientErrorMessage(e) };
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
    const name = (input.customer_name ?? "").trim().slice(0, 80);
    if (name.length < 2) return { ok: false, error: "Veuillez saisir votre nom complet." };

    const phone = (input.phone ?? "").replace(/[\s.-]/g, "");
    if (!/^(\+?216)?[0-9]{8}$/.test(phone)) {
      return { ok: false, error: "Numéro de téléphone invalide (8 chiffres)." };
    }

    if (!input.governorate || !GOUVERNORATS.includes(input.governorate)) {
      return { ok: false, error: "Veuillez choisir un gouvernorat." };
    }
    const address = (input.address ?? "").trim();
    if (address.length < 5) {
      return { ok: false, error: "Veuillez saisir une adresse de livraison complète." };
    }
    if (!Array.isArray(input.items) || input.items.length === 0) {
      return { ok: false, error: "Votre panier est vide." };
    }
    if (input.items.length > 50) return { ok: false, error: "Trop d'articles dans la commande." };

    // La boutique publique ne commande QUE des produits du catalogue (avec id) :
    // on rejette tout article « libre » (nom/prix arbitraires injectables) et on
    // borne quantités + longueurs de texte. Le prix est de toute façon re-calculé
    // côté serveur dans createOrder à partir du produit.
    const items = input.items
      .filter((it) => it && it.product_id)
      .map((it) => ({
        product_id: it.product_id,
        name: String(it.name ?? "").slice(0, 120),
        unit_price: Number(it.unit_price) || 0,
        quantity: Math.min(100, Math.max(1, Math.floor(Number(it.quantity) || 1))),
      }));
    if (!items.length) return { ok: false, error: "Votre panier est vide." };

    const order = await createOrder({
      ...input,
      customer_name: name,
      phone,
      city: (input.city ?? "").trim().slice(0, 80),
      address: address.slice(0, 300),
      notes: input.notes ? String(input.notes).slice(0, 1000) : undefined,
      source: input.source ? String(input.source).slice(0, 120) : undefined,
      items,
    });
    return { ok: true, orderNumber: order.order_number };
  } catch (e) {
    return { ok: false, error: clientErrorMessage(e, "Une erreur est survenue. Réessayez.") };
  }
}
