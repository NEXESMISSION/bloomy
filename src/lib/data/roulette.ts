import { supabaseAdmin } from "@/lib/supabase";
import {
  localGetPrizes,
  localSavePrizes,
  localGetWins,
  localSaveWins,
  withStoreLock,
} from "@/lib/data/localStore";
import type { RoulettePrize, RouletteWin } from "@/lib/types";

function mapPrize(r: any): RoulettePrize {
  return {
    id: r.id,
    created_at: r.created_at,
    label: r.label,
    type: r.type === "product" ? "product" : r.type === "none" ? "none" : "code",
    code: r.code ?? null,
    product_name: r.product_name ?? null,
    weight: Number(r.weight ?? 0),
    color: r.color ?? "#1f2937",
    active: r.active ?? true,
    sort_order: Number(r.sort_order ?? 0),
  };
}

function mapWin(r: any): RouletteWin {
  return {
    id: r.id,
    created_at: r.created_at,
    prize_id: r.prize_id ?? null,
    prize_label: r.prize_label,
    type: r.type,
    code: r.code ?? null,
    customer_id: r.customer_id ?? null,
    phone: r.phone ?? null,
    claimed: !!r.claimed,
  };
}

export async function listPrizes(): Promise<RoulettePrize[]> {
  const db = supabaseAdmin();
  if (!db) return (await localGetPrizes()).sort((a, b) => a.sort_order - b.sort_order);
  const { data } = await db.from("roulette_prizes").select("*").order("sort_order", { ascending: true });
  return (data ?? []).map(mapPrize);
}

export async function getActivePrizes(): Promise<RoulettePrize[]> {
  return (await listPrizes()).filter((p) => p.active);
}

/** Tirage pondéré (les % sont fixés par l'admin via weight). */
export async function spinForPrize(): Promise<RoulettePrize | null> {
  const prizes = await getActivePrizes();
  if (!prizes.length) return null;
  const total = prizes.reduce((s, p) => s + Math.max(0, p.weight), 0);
  if (total <= 0) return prizes[0];
  let r = Math.random() * total;
  for (const p of prizes) {
    r -= Math.max(0, p.weight);
    if (r <= 0) return p;
  }
  return prizes[prizes.length - 1];
}

export async function recordWin(prize: RoulettePrize): Promise<RouletteWin> {
  const row = {
    prize_id: prize.id,
    prize_label: prize.label,
    type: prize.type,
    code: prize.code,
    customer_id: null as string | null,
    phone: null as string | null,
    claimed: false,
  };
  const db = supabaseAdmin();
  if (!db) {
    const win: RouletteWin = { id: crypto.randomUUID(), created_at: new Date().toISOString(), ...row };
    return withStoreLock(async () => {
      const all = await localGetWins();
      all.unshift(win);
      await localSaveWins(all);
      return win;
    });
  }
  const { data, error } = await db.from("roulette_wins").insert(row).select("*").single();
  if (error) throw new Error(error.message);
  return mapWin(data);
}

export async function claimWin(winId: string, customerId: string, phone: string): Promise<void> {
  const db = supabaseAdmin();
  if (!db) {
    return withStoreLock(async () => {
      const all = await localGetWins();
      const idx = all.findIndex((w) => w.id === winId);
      if (idx >= 0) {
        all[idx] = { ...all[idx], customer_id: customerId, phone, claimed: true };
        await localSaveWins(all);
      }
    });
  }
  const { error } = await db
    .from("roulette_wins")
    .update({ customer_id: customerId, phone, claimed: true })
    .eq("id", winId);
  if (error) throw new Error(error.message);
}

export async function listWins(): Promise<RouletteWin[]> {
  const db = supabaseAdmin();
  if (!db) return localGetWins();
  const { data } = await db.from("roulette_wins").select("*").order("created_at", { ascending: false });
  return (data ?? []).map(mapWin);
}

/* ─────────────── admin ─────────────── */

export type PrizeInput = Omit<RoulettePrize, "id" | "created_at"> & { id?: string };

export async function upsertPrize(input: PrizeInput): Promise<RoulettePrize> {
  const db = supabaseAdmin();
  if (!db) {
    return withStoreLock(async () => {
      const prizes = await localGetPrizes();
      if (input.id) {
        const idx = prizes.findIndex((p) => p.id === input.id);
        if (idx >= 0) {
          prizes[idx] = { ...prizes[idx], ...input, id: input.id } as RoulettePrize;
          await localSavePrizes(prizes);
          return prizes[idx];
        }
      }
      const created = { ...input, id: crypto.randomUUID(), created_at: new Date().toISOString() } as RoulettePrize;
      prizes.push(created);
      await localSavePrizes(prizes);
      return created;
    });
  }
  const row: any = {
    label: input.label,
    type: input.type,
    code: input.code,
    product_name: input.product_name,
    weight: input.weight,
    color: input.color,
    active: input.active,
    sort_order: input.sort_order,
  };
  if (input.id) row.id = input.id;
  const { data, error } = await db.from("roulette_prizes").upsert(row).select("*").single();
  if (error) throw new Error(error.message);
  return mapPrize(data);
}

export async function deletePrize(id: string): Promise<void> {
  const db = supabaseAdmin();
  if (!db) {
    return withStoreLock(async () => {
      await localSavePrizes((await localGetPrizes()).filter((p) => p.id !== id));
    });
  }
  const { error } = await db.from("roulette_prizes").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
