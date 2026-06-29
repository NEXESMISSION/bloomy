"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { optimizeToWebp } from "@/lib/image";
import { ADMIN_COOKIE, createSessionToken, verifyCredentials } from "@/lib/auth";
import { requireAdmin } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase";
import { updateOrderStatus, deleteOrder } from "@/lib/data/orders";
import { upsertProduct, deleteProduct, type ProductInput } from "@/lib/data/products";
import { upsertCode, deleteCode, type DiscountInput } from "@/lib/data/discounts";
import { updateSettings } from "@/lib/data/settings";
import { setReviewStatus, deleteReview } from "@/lib/data/reviews";
import { upsertPrize, deletePrize, type PrizeInput } from "@/lib/data/roulette";
import type { OrderStatus, ReviewStatus, ShopSettings } from "@/lib/types";

export async function login(
  email: string,
  password: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!verifyCredentials(email, password)) {
    return { ok: false, error: "Email ou mot de passe incorrect." };
  }
  const token = await createSessionToken();
  cookies().set(ADMIN_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return { ok: true };
}

export async function logout() {
  cookies().delete(ADMIN_COOKIE);
}

export async function setOrderStatus(id: string, status: OrderStatus) {
  await requireAdmin();
  await updateOrderStatus(id, status);
  revalidatePath("/admin");
  revalidatePath("/admin/commandes");
}

export async function removeOrder(id: string) {
  await requireAdmin();
  await deleteOrder(id);
  revalidatePath("/admin");
  revalidatePath("/admin/commandes");
}

export async function saveProduct(input: ProductInput) {
  await requireAdmin();
  const product = await upsertProduct(input);
  revalidatePath("/admin/produits");
  revalidatePath("/boutique");
  revalidatePath("/");
  return product;
}

export async function removeProduct(id: string) {
  await requireAdmin();
  await deleteProduct(id);
  revalidatePath("/admin/produits");
  revalidatePath("/boutique");
  revalidatePath("/");
}

/** Upload + optimisation (WebP, redimensionné) d'une image produit vers Supabase Storage. */
export async function uploadProductImage(
  formData: FormData,
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  await requireAdmin();
  const file = formData.get("file") as File | null;
  if (!file || typeof file === "string") return { ok: false, error: "Aucun fichier." };
  const db = supabaseAdmin();
  if (!db) return { ok: false, error: "Stockage indisponible — configurez Supabase." };
  try {
    const input = Buffer.from(await file.arrayBuffer());
    const optimized = await optimizeToWebp(input, { maxWidth: 1400, maxHeight: 1800, quality: 80 });
    const name = `${crypto.randomUUID()}.webp`;
    const { error } = await db.storage
      .from("product-images")
      .upload(name, optimized, { contentType: "image/webp", upsert: false });
    if (error) return { ok: false, error: error.message };
    const { data } = db.storage.from("product-images").getPublicUrl(name);
    return { ok: true, url: data.publicUrl };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? "Échec de l'upload de l'image." };
  }
}

/* ─────────────── Codes promo ─────────────── */

export async function saveCode(input: DiscountInput) {
  await requireAdmin();
  const code = await upsertCode(input);
  revalidatePath("/admin/codes");
  return code;
}

export async function removeCode(id: string) {
  await requireAdmin();
  await deleteCode(id);
  revalidatePath("/admin/codes");
}

/* ─────────────── Paramètres ─────────────── */

export async function saveSettings(patch: Partial<ShopSettings>) {
  await requireAdmin();
  await updateSettings(patch);
  revalidatePath("/admin/parametres");
  revalidatePath("/", "layout");
}

/* ─────────────── Avis clients ─────────────── */

export async function moderateReview(id: string, status: ReviewStatus) {
  await requireAdmin();
  await setReviewStatus(id, status);
  revalidatePath("/admin/avis");
}

export async function removeReview(id: string) {
  await requireAdmin();
  await deleteReview(id);
  revalidatePath("/admin/avis");
}

/* ─────────────── Roulette ─────────────── */

export async function savePrize(input: PrizeInput) {
  await requireAdmin();
  const prize = await upsertPrize(input);
  revalidatePath("/admin/roulette");
  revalidatePath("/", "layout");
  return prize;
}

export async function removePrize(id: string) {
  await requireAdmin();
  await deletePrize(id);
  revalidatePath("/admin/roulette");
  revalidatePath("/", "layout");
}
