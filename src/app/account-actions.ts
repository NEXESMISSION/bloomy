"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { CUSTOMER_COOKIE, customerToken } from "@/lib/customerAuth";
import { createCustomer, authenticateCustomer, type SignupInput } from "@/lib/data/customers";
import { spinForPrize, recordWin, claimWin } from "@/lib/data/roulette";
import { getSettings } from "@/lib/data/settings";
import { getCurrentCustomer } from "@/lib/customerSession";

function setCustomerCookie(id: string) {
  cookies().set(CUSTOMER_COOKIE, customerToken(id), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export type SpinResult =
  | { ok: true; winId: string; prizeId: string; label: string; type: string; code: string | null; productName: string | null }
  | { ok: false; error: string };

export async function spin(): Promise<SpinResult> {
  try {
    const s = await getSettings();
    if (!s.roulette_enabled) return { ok: false, error: "La roulette est désactivée." };
    const prize = await spinForPrize();
    if (!prize) return { ok: false, error: "Aucun lot disponible." };
    const win = await recordWin(prize);
    return {
      ok: true,
      winId: win.id,
      prizeId: prize.id,
      label: prize.label,
      type: prize.type,
      code: prize.code,
      productName: prize.product_name,
    };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? "Une erreur est survenue." };
  }
}

export type AuthResult = { ok: true; name: string } | { ok: false; error: string };

export async function signup(input: SignupInput & { winId?: string }): Promise<AuthResult> {
  try {
    if (!input.name?.trim() || input.name.trim().length < 2) return { ok: false, error: "Veuillez saisir votre nom." };
    const phone = (input.phone || "").replace(/[\s.\-]/g, "");
    if (!/^(\+?216)?[0-9]{8}$/.test(phone)) return { ok: false, error: "Numéro de téléphone invalide (8 chiffres)." };
    if (!input.password || input.password.length < 4) return { ok: false, error: "Mot de passe trop court (4 caractères min)." };
    const customer = await createCustomer({ ...input, phone });
    setCustomerCookie(customer.id);
    if (input.winId) {
      try { await claimWin(input.winId, customer.id, customer.phone); } catch {}
    }
    revalidatePath("/", "layout");
    return { ok: true, name: customer.name };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? "Une erreur est survenue." };
  }
}

export async function login(input: { phone: string; password: string; winId?: string }): Promise<AuthResult> {
  try {
    const customer = await authenticateCustomer(input.phone, input.password);
    if (!customer) return { ok: false, error: "Numéro ou mot de passe incorrect." };
    setCustomerCookie(customer.id);
    if (input.winId) {
      try { await claimWin(input.winId, customer.id, customer.phone); } catch {}
    }
    revalidatePath("/", "layout");
    return { ok: true, name: customer.name };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? "Une erreur est survenue." };
  }
}

export async function claimCurrentWin(winId: string): Promise<{ ok: boolean }> {
  const c = await getCurrentCustomer();
  if (!c) return { ok: false };
  try {
    await claimWin(winId, c.id, c.phone);
  } catch {}
  return { ok: true };
}

export async function logoutCustomer() {
  cookies().delete(CUSTOMER_COOKIE);
  revalidatePath("/", "layout");
}
