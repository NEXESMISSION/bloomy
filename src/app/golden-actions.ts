"use server";

import { headers } from "next/headers";
import { revealGoldenTicket, claimGoldenTicket, type RevealResult, type ClaimResult } from "@/lib/data/golden";
import { clientErrorMessage } from "@/lib/errors";
import { rateLimit } from "@/lib/rateLimit";

/** Clé de limitation = IP du client (via l'en-tête proxy) + un préfixe d'action. */
function clientKey(prefix: string): string {
  const ip = (headers().get("x-forwarded-for") || "").split(",")[0].trim() || "unknown";
  return `${prefix}:${ip}`;
}

export async function revealTicket(token: string): Promise<RevealResult> {
  // Anti-abus léger : une IP ne peut pas marteler la révélation (30 / minute).
  if (!rateLimit(clientKey("golden-reveal"), 30, 60_000)) {
    return { ok: false, reason: "invalid" };
  }
  try {
    return await revealGoldenTicket(token);
  } catch {
    return { ok: false, reason: "invalid" };
  }
}

export async function claimTicket(token: string, name: string, phone: string): Promise<ClaimResult> {
  // Anti-abus léger : 10 tentatives de réclamation / minute / IP.
  if (!rateLimit(clientKey("golden-claim"), 10, 60_000)) {
    return { ok: false, error: "Trop de tentatives. Réessayez dans un instant." };
  }
  try {
    return await claimGoldenTicket(token, name, phone);
  } catch (e) {
    return { ok: false, error: clientErrorMessage(e) };
  }
}
