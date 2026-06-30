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
import { upsertBanner, deleteBanner, type BannerInput } from "@/lib/data/banners";
import {
  createGoldenBatch,
  setGoldenBatchActive,
  deleteGoldenBatch,
  processGoldenExpiries,
} from "@/lib/data/golden";
import { authenticateByPin, createStaff, updateStaff, deleteStaff, type StaffRole } from "@/lib/data/staff";
import { logActivity } from "@/lib/data/activity";
import { requireOwner, getCurrentStaff, type CurrentStaff } from "@/lib/staffSession";
import type { OrderStatus, ReviewStatus, ShopSettings } from "@/lib/types";

/** Identifie l'admin connecté (super admin OU équipe) et bloque si non connecté.
 *  Remplace requireAdmin pour les mutations afin de TRACER qui fait quoi. */
async function adminActor(): Promise<CurrentStaff> {
  const me = await getCurrentStaff();
  if (!me) throw new Error("Non autorisé. Veuillez vous reconnecter.");
  return me;
}

/** Écrit une ligne au journal d'activité au nom de l'acteur. */
async function audit(me: CurrentStaff, action: string, entityType?: string, entityId?: string | null, detail?: string) {
  await logActivity({ actorId: me.id, actorName: me.name, action, entityType, entityId, detail });
}

/** Qui suis-je ? (pour l'UI : nom, rôle, super admin). null si non connecté. */
export async function whoami(): Promise<{ name: string; role: "owner" | "staff"; isSuperAdmin: boolean } | null> {
  const me = await getCurrentStaff();
  return me ? { name: me.name, role: me.role, isSuperAdmin: me.isSuperAdmin } : null;
}

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
  await logActivity({ actorId: "owner", actorName: "Super Admin", action: "Connexion (super admin)" });
  return { ok: true };
}

export async function logout() {
  cookies().delete(ADMIN_COOKIE);
}

/* ─────────────── Équipe (connexion PIN + gestion) ─────────────── */

function setSessionCookie(token: string) {
  cookies().set(ADMIN_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function staffLogin(pin: string): Promise<{ ok: true; name: string } | { ok: false; error: string }> {
  const staff = await authenticateByPin(pin);
  if (!staff) return { ok: false, error: "Code PIN incorrect." };
  setSessionCookie(await createSessionToken(staff.id));
  await logActivity({ actorId: staff.id, actorName: staff.name, action: "Connexion" });
  return { ok: true, name: staff.name };
}

export async function createStaffAction(input: { name: string; pin: string; role: StaffRole; color?: string }) {
  const me = await requireOwner();
  const s = await createStaff(input);
  await logActivity({ actorId: me.id, actorName: me.name, action: "Ajout d'un membre", entityType: "staff", entityId: s.id, detail: `${s.name} (${s.role})` });
  revalidatePath("/crm/equipe");
  return s;
}

export async function updateStaffAction(id: string, patch: { name?: string; role?: StaffRole; color?: string; active?: boolean; pin?: string }) {
  const me = await requireOwner();
  await updateStaff(id, patch);
  await logActivity({ actorId: me.id, actorName: me.name, action: "Modification d'un membre", entityType: "staff", entityId: id });
  revalidatePath("/crm/equipe");
}

export async function deleteStaffAction(id: string) {
  const me = await requireOwner();
  await deleteStaff(id);
  await logActivity({ actorId: me.id, actorName: me.name, action: "Suppression d'un membre", entityType: "staff", entityId: id });
  revalidatePath("/crm/equipe");
}

export async function setOrderStatus(id: string, status: OrderStatus) {
  const me = await adminActor();
  await updateOrderStatus(id, status);
  await audit(me, "Statut commande modifié", "order", id, status);
  revalidatePath("/admin");
  revalidatePath("/admin/commandes");
}

export async function removeOrder(id: string) {
  const me = await adminActor();
  await deleteOrder(id);
  await audit(me, "Commande supprimée", "order", id);
  revalidatePath("/admin");
  revalidatePath("/admin/commandes");
}

export async function saveProduct(input: ProductInput) {
  const me = await adminActor();
  const product = await upsertProduct(input);
  await audit(me, input.id ? "Produit modifié" : "Produit créé", "product", product.id, product.name);
  revalidatePath("/admin/produits");
  revalidatePath("/boutique");
  revalidatePath("/");
  return product;
}

export async function removeProduct(id: string) {
  const me = await adminActor();
  await deleteProduct(id);
  await audit(me, "Produit supprimé", "product", id);
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
  if (file.size > 8 * 1024 * 1024) return { ok: false, error: "Image trop lourde (max 8 Mo)." };
  if (!file.type.startsWith("image/")) return { ok: false, error: "Fichier image invalide." };
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

/** Upload générique optimisé (bannières, etc.) — plus large pour le plein écran. */
export async function uploadImage(
  formData: FormData,
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  await requireAdmin();
  const file = formData.get("file") as File | null;
  if (!file || typeof file === "string") return { ok: false, error: "Aucun fichier." };
  if (file.size > 8 * 1024 * 1024) return { ok: false, error: "Image trop lourde (max 8 Mo)." };
  if (!file.type.startsWith("image/")) return { ok: false, error: "Fichier image invalide." };
  const db = supabaseAdmin();
  if (!db) return { ok: false, error: "Stockage indisponible — configurez Supabase." };
  try {
    const input = Buffer.from(await file.arrayBuffer());
    const optimized = await optimizeToWebp(input, { maxWidth: 1920, maxHeight: 1920, quality: 82 });
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
  const me = await adminActor();
  const code = await upsertCode(input);
  await audit(me, input.id ? "Code promo modifié" : "Code promo créé", "discount_code", code.id, code.code);
  revalidatePath("/admin/codes");
  return code;
}

export async function removeCode(id: string) {
  const me = await adminActor();
  await deleteCode(id);
  await audit(me, "Code promo supprimé", "discount_code", id);
  revalidatePath("/admin/codes");
}

/* ─────────────── Paramètres ─────────────── */

export async function saveSettings(patch: Partial<ShopSettings>) {
  const me = await adminActor();
  await updateSettings(patch);
  await audit(me, "Paramètres modifiés", "settings", null, Object.keys(patch).join(", "));
  revalidatePath("/admin/parametres");
  revalidatePath("/", "layout");
}

/* ─────────────── Avis clients ─────────────── */

export async function moderateReview(id: string, status: ReviewStatus) {
  const me = await adminActor();
  await setReviewStatus(id, status);
  await audit(me, "Avis modéré", "review", id, status);
  revalidatePath("/admin/avis");
}

export async function removeReview(id: string) {
  const me = await adminActor();
  await deleteReview(id);
  await audit(me, "Avis supprimé", "review", id);
  revalidatePath("/admin/avis");
}

/* ─────────────── Roulette ─────────────── */

export async function savePrize(input: PrizeInput) {
  const me = await adminActor();
  const prize = await upsertPrize(input);
  await audit(me, input.id ? "Lot roulette modifié" : "Lot roulette créé", "roulette_prize", prize.id, prize.label);
  revalidatePath("/admin/roulette");
  revalidatePath("/", "layout");
  return prize;
}

export async function removePrize(id: string) {
  const me = await adminActor();
  await deletePrize(id);
  await audit(me, "Lot roulette supprimé", "roulette_prize", id);
  revalidatePath("/admin/roulette");
  revalidatePath("/", "layout");
}

/* ─────────────── Bannières (hero) ─────────────── */

export async function saveBanner(input: BannerInput) {
  const me = await adminActor();
  const banner = await upsertBanner(input);
  await audit(me, input.id ? "Bannière modifiée" : "Bannière créée", "banner", banner.id);
  revalidatePath("/admin/bannieres");
  revalidatePath("/");
  return banner;
}

export async function removeBanner(id: string) {
  const me = await adminActor();
  await deleteBanner(id);
  await audit(me, "Bannière supprimée", "banner", id);
  revalidatePath("/admin/bannieres");
  revalidatePath("/");
}

/* ─────────────── Golden Tickets ─────────────── */

export async function createGoldenBatchAction(input: {
  name: string;
  prize_label: string;
  ticket_count: number;
  winner_count: number;
  claim_days: number;
}) {
  const me = await adminActor();
  const batch = await createGoldenBatch(input);
  await audit(me, "Lot Golden Ticket créé", "golden_batch", batch.id, batch.name);
  revalidatePath("/admin/golden");
  return batch;
}

export async function toggleGoldenBatchAction(id: string, active: boolean) {
  const me = await adminActor();
  await setGoldenBatchActive(id, active);
  await audit(me, active ? "Golden Ticket activé" : "Golden Ticket désactivé", "golden_batch", id);
  revalidatePath("/admin/golden");
}

export async function removeGoldenBatchAction(id: string) {
  const me = await adminActor();
  await deleteGoldenBatch(id);
  await audit(me, "Lot Golden Ticket supprimé", "golden_batch", id);
  revalidatePath("/admin/golden");
}

export async function processGoldenExpiriesAction(id: string) {
  await requireAdmin();
  const n = await processGoldenExpiries(id);
  revalidatePath("/admin/golden");
  return n;
}
