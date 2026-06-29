import { supabaseAdmin } from "@/lib/supabase";
import { localGetReviews, localSaveReviews, withStoreLock } from "@/lib/data/localStore";
import type { NewReviewInput, Review, ReviewStatus } from "@/lib/types";

function mapReview(r: any): Review {
  return {
    id: r.id,
    created_at: r.created_at,
    product_id: r.product_id ?? null,
    product_slug: r.product_slug,
    author_name: r.author_name,
    rating: Number(r.rating),
    comment: r.comment ?? "",
    status: r.status,
  };
}

export async function createReview(input: NewReviewInput): Promise<Review> {
  const rating = Math.max(1, Math.min(5, Math.round(input.rating)));
  const row = {
    product_id: input.product_id,
    product_slug: input.product_slug,
    author_name: input.author_name.trim().slice(0, 60),
    rating,
    comment: input.comment.trim().slice(0, 1000),
    status: "pending" as ReviewStatus,
  };
  const db = supabaseAdmin();
  if (!db) {
    const review: Review = { id: crypto.randomUUID(), created_at: new Date().toISOString(), ...row };
    return withStoreLock(async () => {
      const all = await localGetReviews();
      all.unshift(review);
      await localSaveReviews(all);
      return review;
    });
  }
  const { data, error } = await db.from("reviews").insert(row).select("*").single();
  if (error) throw new Error(error.message);
  return mapReview(data);
}

/** Avis approuvés d'un produit (public). */
export async function getApprovedReviews(slug: string): Promise<Review[]> {
  const db = supabaseAdmin();
  if (!db) {
    return (await localGetReviews())
      .filter((r) => r.product_slug === slug && r.status === "approved")
      .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  }
  const { data } = await db
    .from("reviews")
    .select("*")
    .eq("product_slug", slug)
    .eq("status", "approved")
    .order("created_at", { ascending: false });
  return (data ?? []).map(mapReview);
}

/** Avis approuvés tous produits confondus (pour la page d'accueil). */
export async function getApprovedReviewsAll(limit = 12): Promise<Review[]> {
  const db = supabaseAdmin();
  if (!db) {
    return (await localGetReviews())
      .filter((r) => r.status === "approved")
      .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
      .slice(0, limit);
  }
  const { data } = await db
    .from("reviews")
    .select("*")
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []).map(mapReview);
}

export async function getReviewStats(slug: string): Promise<{ count: number; avg: number }> {
  const reviews = await getApprovedReviews(slug);
  if (!reviews.length) return { count: 0, avg: 0 };
  const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
  return { count: reviews.length, avg: Math.round(avg * 10) / 10 };
}

/* ───────────────────────── ADMIN ───────────────────────── */

export async function listReviews(): Promise<Review[]> {
  const db = supabaseAdmin();
  if (!db) {
    return (await localGetReviews()).sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  }
  const { data } = await db.from("reviews").select("*").order("created_at", { ascending: false });
  return (data ?? []).map(mapReview);
}

export async function setReviewStatus(id: string, status: ReviewStatus): Promise<void> {
  const db = supabaseAdmin();
  if (!db) {
    return withStoreLock(async () => {
      const all = await localGetReviews();
      const idx = all.findIndex((r) => r.id === id);
      if (idx >= 0) {
        all[idx].status = status;
        await localSaveReviews(all);
      }
    });
  }
  const { error } = await db.from("reviews").update({ status }).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteReview(id: string): Promise<void> {
  const db = supabaseAdmin();
  if (!db) {
    return withStoreLock(async () => {
      await localSaveReviews((await localGetReviews()).filter((r) => r.id !== id));
    });
  }
  const { error } = await db.from("reviews").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
