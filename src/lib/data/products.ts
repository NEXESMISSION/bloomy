import { supabaseAdmin } from "@/lib/supabase";
import { localGetProducts, localSaveProducts, withStoreLock } from "@/lib/data/localStore";
import { slugify } from "@/lib/utils";
import type { Product } from "@/lib/types";

function mapRow(row: any): Product {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    tagline: row.tagline ?? "",
    description: row.description ?? "",
    price: Number(row.price),
    compare_at_price: row.compare_at_price != null ? Number(row.compare_at_price) : null,
    size_ml: row.size_ml ?? 50,
    accent: row.accent ?? "#1E5BFF",
    family: row.family ?? "",
    gender: row.gender ?? "mixte",
    season: row.season ?? "toutes",
    product_type: row.product_type ?? null,
    is_pack: !!row.is_pack,
    pack_size: row.pack_size != null ? Number(row.pack_size) : null,
    notes_top: row.notes_top ?? [],
    notes_heart: row.notes_heart ?? [],
    notes_base: row.notes_base ?? [],
    moods: row.moods ?? [],
    image: row.image ?? "/products/sauvage.png",
    gallery: row.gallery ?? [],
    is_featured: !!row.is_featured,
    is_best_seller: !!row.is_best_seller,
    is_active: row.is_active ?? true,
    stock: row.stock ?? 0,
    sort_order: row.sort_order ?? 0,
    created_at: row.created_at,
  };
}

/** Tous les produits actifs (boutique publique). */
export async function getProducts(): Promise<Product[]> {
  const db = supabaseAdmin();
  if (!db) {
    return (await localGetProducts())
      .filter((p) => p.is_active)
      .sort((a, b) => a.sort_order - b.sort_order);
  }
  const { data, error } = await db
    .from("products")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  // Supabase configuré mais en erreur : NE PAS servir le catalogue de démo
  // (prix/stock figés) — on journalise et on renvoie vide pour ne pas masquer la panne.
  if (error || !data) {
    console.error("[getProducts] Supabase error:", error?.message);
    return [];
  }
  return data.map(mapRow);
}

/** Tous les produits, actifs ou non (admin). */
export async function getAllProducts(): Promise<Product[]> {
  const db = supabaseAdmin();
  if (!db) return (await localGetProducts()).sort((a, b) => a.sort_order - b.sort_order);
  const { data, error } = await db
    .from("products")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error || !data) {
    console.error("[getAllProducts] Supabase error:", error?.message);
    return [];
  }
  return data.map(mapRow);
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const db = supabaseAdmin();
  if (!db) return (await localGetProducts()).find((p) => p.slug === slug) ?? null;
  const { data, error } = await db.from("products").select("*").eq("slug", slug).maybeSingle();
  if (error || !data) return null;
  return mapRow(data);
}

export async function getProductById(id: string): Promise<Product | null> {
  const db = supabaseAdmin();
  if (!db) return (await localGetProducts()).find((p) => p.id === id) ?? null;
  const { data, error } = await db.from("products").select("*").eq("id", id).maybeSingle();
  if (error || !data) return null;
  return mapRow(data);
}

export async function getFeatured(): Promise<Product[]> {
  return (await getProducts()).filter((p) => p.is_featured);
}

export async function getBestSellers(): Promise<Product[]> {
  return (await getProducts()).filter((p) => p.is_best_seller);
}

/* ───────────────────────── ADMIN (mutations) ───────────────────────── */

export type ProductInput = Omit<Product, "id" | "created_at"> & { id?: string };

export async function upsertProduct(input: ProductInput): Promise<Product> {
  const slug = input.slug?.trim() ? slugify(input.slug) : slugify(input.name);
  const payload = { ...input, slug };
  const db = supabaseAdmin();

  if (!db) {
    return withStoreLock(async () => {
      const products = await localGetProducts();
      if (input.id) {
        const idx = products.findIndex((p) => p.id === input.id);
        if (idx >= 0) {
          const updated = { ...products[idx], ...payload, id: input.id } as Product;
          products[idx] = updated;
          await localSaveProducts(products);
          return updated;
        }
        // id fourni mais introuvable -> on insère (sémantique "upsert")
      }
      const created: Product = {
        ...(payload as Omit<Product, "id">),
        id: input.id || crypto.randomUUID(),
        created_at: new Date().toISOString(),
      };
      products.push(created);
      await localSaveProducts(products);
      return created;
    });
  }

  const row = {
    ...(input.id ? { id: input.id } : {}),
    slug,
    name: input.name,
    tagline: input.tagline,
    description: input.description,
    price: input.price,
    compare_at_price: input.compare_at_price,
    size_ml: input.size_ml,
    accent: input.accent,
    family: input.family,
    gender: input.gender ?? "mixte",
    season: input.season ?? "toutes",
    product_type: input.product_type ?? null,
    is_pack: input.is_pack ?? false,
    pack_size: input.pack_size ?? null,
    notes_top: input.notes_top,
    notes_heart: input.notes_heart,
    notes_base: input.notes_base,
    moods: input.moods,
    image: input.image,
    gallery: input.gallery ?? [],
    is_featured: input.is_featured,
    is_best_seller: input.is_best_seller,
    is_active: input.is_active,
    stock: input.stock,
    sort_order: input.sort_order,
  };
  const { data, error } = await db.from("products").upsert(row).select("*").single();
  if (error) throw new Error(error.message);
  return mapRow(data);
}

export async function deleteProduct(id: string): Promise<void> {
  const db = supabaseAdmin();
  if (!db) {
    return withStoreLock(async () => {
      const products = (await localGetProducts()).filter((p) => p.id !== id);
      await localSaveProducts(products);
    });
  }
  const { error } = await db.from("products").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
