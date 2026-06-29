"use server";

import { revealGoldenTicket, claimGoldenTicket, type RevealResult, type ClaimResult } from "@/lib/data/golden";

export async function revealTicket(token: string): Promise<RevealResult> {
  try {
    return await revealGoldenTicket(token);
  } catch {
    return { ok: false, reason: "invalid" };
  }
}

export async function claimTicket(token: string, name: string, phone: string): Promise<ClaimResult> {
  try {
    return await claimGoldenTicket(token, name, phone);
  } catch (e: any) {
    return { ok: false, error: e?.message ?? "Une erreur est survenue." };
  }
}
