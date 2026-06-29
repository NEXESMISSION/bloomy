import { supabaseAdmin } from "@/lib/supabase";
import { localGetCodes, localSaveCodes, withStoreLock } from "@/lib/data/localStore";
import { formatTND } from "@/lib/utils";
import type { DiscountCode, DiscountType } from "@/lib/types";

function mapCode(r: any): DiscountCode {
  return {
    id: r.id,
    created_at: r.created_at,
    code: r.code,
    type: r.type === "fixed" ? "fixed" : "percent",
    value: Number(r.value),
    max_uses: r.max_uses != null ? Number(r.max_uses) : null,
    used_count: Number(r.used_count ?? 0),
    min_subtotal: Number(r.min_subtotal ?? 0),
    source: r.source ?? "",
    active: r.active ?? true,
    expires_at: r.expires_at ?? null,
  };
}

export function computeDiscount(c: DiscountCode, subtotal: number): number {
  if (subtotal < c.min_subtotal) return 0;
  const raw = c.type === "percent" ? (subtotal * c.value) / 100 : c.value;
  return Math.min(Math.round(raw * 1000) / 1000, subtotal);
}

/* ───────────────────────── lecture ───────────────────────── */

export async function listCodes(): Promise<DiscountCode[]> {
  const db = supabaseAdmin();
  if (!db) return (await localGetCodes()).sort((a, b) => a.code.localeCompare(b.code));
  const { data, error } = await db
    .from("discount_codes")
    .select("*")
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data.map(mapCode);
}

export async function getCodeByCode(code: string): Promise<DiscountCode | null> {
  const norm = code.trim().toUpperCase();
  const db = supabaseAdmin();
  if (!db) {
    return (await localGetCodes()).find((c) => c.code.toUpperCase() === norm) ?? null;
  }
  const { data } = await db.from("discount_codes").select("*").ilike("code", norm).maybeSingle();
  return data ? mapCode(data) : null;
}

export type CodeValidation = {
  ok: boolean;
  message: string;
  discount: number;
  code?: DiscountCode;
};

/** Validation (sans incrément) — utilisée au checkout pour l'aperçu et par createOrder. */
export async function validateCode(code: string, subtotal: number): Promise<CodeValidation> {
  const c = await getCodeByCode(code);
  if (!c) return { ok: false, message: "Code invalide.", discount: 0 };
  if (!c.active) return { ok: false, message: "Ce code n'est plus actif.", discount: 0 };
  if (c.expires_at && new Date(c.expires_at).getTime() < Date.now()) {
    return { ok: false, message: "Ce code a expiré.", discount: 0 };
  }
  if (c.max_uses != null && c.used_count >= c.max_uses) {
    return { ok: false, message: "Ce code a atteint sa limite d'utilisation.", discount: 0 };
  }
  if (subtotal < c.min_subtotal) {
    return {
      ok: false,
      message: `Minimum ${formatTND(c.min_subtotal)} d'achat requis pour ce code.`,
      discount: 0,
    };
  }
  const discount = computeDiscount(c, subtotal);
  const label = c.type === "percent" ? `-${c.value}%` : `-${formatTND(c.value)}`;
  return { ok: true, message: `Code appliqué (${label}) : -${formatTND(discount)}`, discount, code: c };
}

/** Incrément atomique du compteur d'utilisation (respecte la limite). */
export async function redeemCode(code: string): Promise<boolean> {
  const db = supabaseAdmin();
  if (!db) {
    return withStoreLock(async () => {
      const codes = await localGetCodes();
      const c = codes.find((x) => x.code.toUpperCase() === code.trim().toUpperCase());
      if (!c || !c.active) return false;
      if (c.expires_at && new Date(c.expires_at).getTime() < Date.now()) return false;
      if (c.max_uses != null && c.used_count >= c.max_uses) return false;
      c.used_count += 1;
      await localSaveCodes(codes);
      return true;
    });
  }
  const { data, error } = await db.rpc("redeem_discount", { p_code: code });
  if (error) return false;
  return data === true;
}

/* ───────────────────────── admin ───────────────────────── */

export type DiscountInput = Omit<DiscountCode, "id" | "created_at" | "used_count"> & {
  id?: string;
  used_count?: number;
};

export async function upsertCode(input: DiscountInput): Promise<DiscountCode> {
  const code = input.code.trim().toUpperCase();
  const db = supabaseAdmin();
  if (!db) {
    return withStoreLock(async () => {
      const codes = await localGetCodes();
      if (input.id) {
        const idx = codes.findIndex((c) => c.id === input.id);
        if (idx >= 0) {
          codes[idx] = { ...codes[idx], ...input, code, id: input.id } as DiscountCode;
          await localSaveCodes(codes);
          return codes[idx];
        }
      }
      // Création : dédoublonnage sur le code (met à jour si déjà présent).
      const existing = codes.findIndex((c) => c.code.toUpperCase() === code);
      if (existing >= 0) {
        codes[existing] = { ...codes[existing], ...input, code, id: codes[existing].id } as DiscountCode;
        await localSaveCodes(codes);
        return codes[existing];
      }
      const created: DiscountCode = {
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
        code,
        type: input.type,
        value: input.value,
        max_uses: input.max_uses,
        used_count: input.used_count ?? 0,
        min_subtotal: input.min_subtotal,
        source: input.source,
        active: input.active,
        expires_at: input.expires_at,
      };
      codes.push(created);
      await localSaveCodes(codes);
      return created;
    });
  }
  const fields = {
    code,
    type: input.type,
    value: input.value,
    max_uses: input.max_uses,
    min_subtotal: input.min_subtotal,
    source: input.source,
    active: input.active,
    expires_at: input.expires_at,
  };

  // Édition → update par id. Création → upsert sur `code` : un même code ne peut
  // JAMAIS être dupliqué (s'il existe déjà, il est mis à jour au lieu d'en créer un 2e).
  if (input.id) {
    const { data, error } = await db.from("discount_codes").update(fields).eq("id", input.id).select("*").single();
    if (error) throw new Error(error.message);
    return mapCode(data);
  }
  const { data, error } = await db
    .from("discount_codes")
    .upsert(fields, { onConflict: "code" })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return mapCode(data);
}

export async function deleteCode(id: string): Promise<void> {
  const db = supabaseAdmin();
  if (!db) {
    return withStoreLock(async () => {
      await localSaveCodes((await localGetCodes()).filter((c) => c.id !== id));
    });
  }
  const { error } = await db.from("discount_codes").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

/* ───────────────────────── codes à usage unique ───────────────────────── */

// Sans caractères ambigus (O/0, I/L/1) pour faciliter la saisie.
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
function randomChars(n: number): string {
  let s = "";
  for (let i = 0; i < n; i++) s += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  return s;
}

/**
 * Crée un code promo UNIQUE à usage unique (max_uses = 1). Utilisé par la
 * roulette pour que chaque gagnant reçoive son propre code non partageable.
 */
export async function mintSingleUseCode(opts: {
  type: DiscountType;
  value: number;
  min_subtotal?: number;
  source?: string;
  expiresInDays?: number;
}): Promise<DiscountCode> {
  const prefix = `BL${Math.round(opts.value)}`;
  for (let attempt = 0; attempt < 8; attempt++) {
    const candidate = `${prefix}${randomChars(5)}`.toUpperCase();
    if (await getCodeByCode(candidate)) continue; // collision (rare) → réessaie
    return upsertCode({
      code: candidate,
      type: opts.type,
      value: opts.value,
      max_uses: 1,
      min_subtotal: opts.min_subtotal ?? 0,
      source: opts.source ?? "Roulette",
      active: true,
      expires_at: opts.expiresInDays
        ? new Date(Date.now() + opts.expiresInDays * 86400000).toISOString()
        : null,
    });
  }
  throw new Error("Impossible de générer un code unique.");
}
