"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { CUSTOMER_COOKIE, customerToken, normalizePhone } from "@/lib/customerAuth";
import { createCustomer, authenticateCustomer, type SignupInput } from "@/lib/data/customers";
import { spinForPrize, recordWin, claimWin } from "@/lib/data/roulette";
import { getSettings } from "@/lib/data/settings";
import { getCurrentCustomer } from "@/lib/customerSession";
import { clientErrorMessage } from "@/lib/errors";

function setCustomerCookie(id: string) {
  cookies().set(CUSTOMER_COOKIE, customerToken(id), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

// Verrou serveur « un seul tour par appareil » : le verrou localStorage du
// widget seul était contournable (vider le navigateur → re-tirer à l'infini →
// générer des codes promo en masse). Ce cookie httpOnly empêche cet abus.
// Sa valeur = l'id du gain (winId), ce qui lie aussi la réclamation au device.
const SPIN_COOKIE = "bloomy_spin";

/**
 * Réclame un gain UNIQUEMENT si c'est bien l'appareil qui l'a tiré (le cookie
 * de tour contient le winId). Empêche un client de réclamer le gain d'un autre
 * (IDOR). Silencieux : un échec ne casse pas l'inscription/connexion.
 */
async function claimIfOwned(winId: string | undefined, customerId: string, phone: string) {
  if (!winId) return;
  if (cookies().get(SPIN_COOKIE)?.value !== winId) return;
  try {
    await claimWin(winId, customerId, phone);
  } catch {}
}

export type SpinResult =
  | { ok: true; winId: string; prizeId: string; label: string; type: string; code: string | null; productName: string | null }
  | { ok: false; error: string };

export async function spin(): Promise<SpinResult> {
  try {
    const s = await getSettings();
    if (!s.roulette_enabled) return { ok: false, error: "La roulette est désactivée." };
    if (cookies().get(SPIN_COOKIE)?.value) {
      return { ok: false, error: "Vous avez déjà tenté votre chance 🎁" };
    }
    const prize = await spinForPrize();
    if (!prize) return { ok: false, error: "Aucun lot disponible." };
    const win = await recordWin(prize);
    cookies().set(SPIN_COOKIE, win.id, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 365, // un an
    });
    return {
      ok: true,
      winId: win.id,
      prizeId: prize.id,
      label: prize.label,
      type: prize.type,
      code: win.code, // code UNIQUE à usage unique généré pour ce gain
      productName: prize.product_name,
    };
  } catch (e) {
    return { ok: false, error: clientErrorMessage(e) };
  }
}

export type AuthResult = { ok: true; name: string } | { ok: false; error: string };

export async function signup(input: SignupInput & { winId?: string }): Promise<AuthResult> {
  try {
    if (!input.name?.trim() || input.name.trim().length < 2) return { ok: false, error: "Veuillez saisir votre nom." };
    const phone = normalizePhone(input.phone || "");
    if (!/^[0-9]{8}$/.test(phone)) return { ok: false, error: "Numéro de téléphone invalide (8 chiffres)." };
    if (!input.password || input.password.length < 6) return { ok: false, error: "Mot de passe trop court (6 caractères min)." };
    const customer = await createCustomer({ ...input, phone });
    setCustomerCookie(customer.id);
    await claimIfOwned(input.winId, customer.id, customer.phone);
    revalidatePath("/", "layout");
    return { ok: true, name: customer.name };
  } catch (e) {
    return { ok: false, error: clientErrorMessage(e) };
  }
}

export async function login(input: { phone: string; password: string; winId?: string }): Promise<AuthResult> {
  try {
    const customer = await authenticateCustomer(input.phone, input.password);
    if (!customer) return { ok: false, error: "Numéro ou mot de passe incorrect." };
    setCustomerCookie(customer.id);
    await claimIfOwned(input.winId, customer.id, customer.phone);
    revalidatePath("/", "layout");
    return { ok: true, name: customer.name };
  } catch (e) {
    return { ok: false, error: clientErrorMessage(e) };
  }
}

export async function claimCurrentWin(winId: string): Promise<{ ok: boolean }> {
  const c = await getCurrentCustomer();
  if (!c) return { ok: false };
  await claimIfOwned(winId, c.id, c.phone);
  return { ok: true };
}

export async function logoutCustomer() {
  cookies().delete(CUSTOMER_COOKIE);
  revalidatePath("/", "layout");
}
