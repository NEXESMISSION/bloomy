import { supabaseAdmin } from "@/lib/supabase";
import { localGetBanners, localSaveBanners, withStoreLock } from "@/lib/data/localStore";
import type { Banner } from "@/lib/types";

function mapBanner(r: any): Banner {
  return {
    id: r.id,
    created_at: r.created_at,
    image: r.image,
    title: r.title ?? null,
    subtitle: r.subtitle ?? null,
    cta_label: r.cta_label ?? null,
    cta_href: r.cta_href ?? null,
    sort_order: Number(r.sort_order ?? 0),
    active: r.active ?? true,
  };
}

export async function listBanners(): Promise<Banner[]> {
  const db = supabaseAdmin();
  if (!db) return (await localGetBanners()).sort((a, b) => a.sort_order - b.sort_order);
  const { data } = await db.from("banners").select("*").order("sort_order", { ascending: true });
  return (data ?? []).map(mapBanner);
}

export async function getActiveBanners(): Promise<Banner[]> {
  return (await listBanners()).filter((b) => b.active && b.image);
}

/* ─────────────── admin ─────────────── */

export type BannerInput = Omit<Banner, "id" | "created_at"> & { id?: string };

export async function upsertBanner(input: BannerInput): Promise<Banner> {
  const db = supabaseAdmin();
  if (!db) {
    return withStoreLock(async () => {
      const banners = await localGetBanners();
      if (input.id) {
        const idx = banners.findIndex((b) => b.id === input.id);
        if (idx >= 0) {
          banners[idx] = { ...banners[idx], ...input, id: input.id } as Banner;
          await localSaveBanners(banners);
          return banners[idx];
        }
      }
      const created = { ...input, id: crypto.randomUUID(), created_at: new Date().toISOString() } as Banner;
      banners.push(created);
      await localSaveBanners(banners);
      return created;
    });
  }
  const row: any = {
    image: input.image,
    title: input.title,
    subtitle: input.subtitle,
    cta_label: input.cta_label,
    cta_href: input.cta_href,
    sort_order: input.sort_order,
    active: input.active,
  };
  if (input.id) row.id = input.id;
  const { data, error } = await db.from("banners").upsert(row).select("*").single();
  if (error) throw new Error(error.message);
  return mapBanner(data);
}

export async function deleteBanner(id: string): Promise<void> {
  const db = supabaseAdmin();
  if (!db) {
    return withStoreLock(async () => {
      await localSaveBanners((await localGetBanners()).filter((b) => b.id !== id));
    });
  }
  const { error } = await db.from("banners").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
