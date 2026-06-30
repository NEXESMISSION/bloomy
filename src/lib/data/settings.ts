import { supabaseAdmin } from "@/lib/supabase";
import { localGetSettings, localSaveSettings } from "@/lib/data/localStore";
import { DELIVERY_FEE, FREE_DELIVERY_THRESHOLD } from "@/lib/types";
import type { ShopSettings } from "@/lib/types";

const DEFAULTS: ShopSettings = {
  delivery_fee: DELIVERY_FEE,
  free_delivery_threshold: FREE_DELIVERY_THRESHOLD,
  // Coordonnées pilotées depuis /admin/parametres (jamais codées en dur).
  shop_phone: "58415520",
  shop_phone_2: "58415506",
  shop_email: "bloomy.tn@gmail.com",
  shop_instagram: "",
  shop_facebook: "",
  telegram_token: "",
  telegram_chat: "",
  fb_pixel: "",
  tiktok_pixel: "",
  announcement: "🚚 Livraison partout en Tunisie · Paiement à la livraison",
  reviews_enabled: true,
  roulette_enabled: true,
};

function num(v: any, fallback: number) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function fromMap(map: Record<string, string>): ShopSettings {
  return {
    delivery_fee: num(map.delivery_fee, DEFAULTS.delivery_fee),
    free_delivery_threshold: num(map.free_delivery_threshold, DEFAULTS.free_delivery_threshold),
    shop_phone: map.shop_phone || DEFAULTS.shop_phone,
    shop_phone_2: map.shop_phone_2 || DEFAULTS.shop_phone_2,
    shop_email: map.shop_email || DEFAULTS.shop_email,
    shop_instagram: map.shop_instagram ?? DEFAULTS.shop_instagram,
    shop_facebook: map.shop_facebook ?? DEFAULTS.shop_facebook,
    telegram_token: map.telegram_token ?? DEFAULTS.telegram_token,
    telegram_chat: map.telegram_chat ?? DEFAULTS.telegram_chat,
    fb_pixel: map.fb_pixel ?? DEFAULTS.fb_pixel,
    tiktok_pixel: map.tiktok_pixel ?? DEFAULTS.tiktok_pixel,
    announcement: map.announcement ?? DEFAULTS.announcement,
    reviews_enabled: map.reviews_enabled !== "false",
    roulette_enabled: map.roulette_enabled !== "false",
  };
}

export async function getSettings(): Promise<ShopSettings> {
  const db = supabaseAdmin();
  if (!db) return fromMap(await localGetSettings());
  const { data, error } = await db.from("settings").select("*");
  if (error || !data) return DEFAULTS;
  const map = Object.fromEntries(data.map((r: any) => [r.key, r.value]));
  return fromMap(map);
}

export async function updateSettings(patch: Partial<ShopSettings>): Promise<void> {
  const entries = Object.entries(patch).filter(([, v]) => v !== undefined);
  const db = supabaseAdmin();
  if (!db) {
    const map = await localGetSettings();
    for (const [k, v] of entries) map[k] = String(v);
    await localSaveSettings(map);
    return;
  }
  const rows = entries.map(([key, value]) => ({ key, value: String(value) }));
  const { error } = await db.from("settings").upsert(rows);
  if (error) throw new Error(error.message);
}
