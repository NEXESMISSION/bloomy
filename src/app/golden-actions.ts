"use server";

import { revealGoldenTicket, claimGoldenTicket, type RevealResult, type ClaimResult } from "@/lib/data/golden";
import { clientErrorMessage } from "@/lib/errors";

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
  } catch (e) {
    return { ok: false, error: clientErrorMessage(e) };
  }
}
