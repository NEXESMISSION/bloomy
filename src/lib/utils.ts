import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Product } from "@/lib/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Texte "Inspiré de …" extrait de la tagline (sinon, la famille olfactive). */
export function inspirationOf(p: Product): string {
  const parts = p.tagline.split("—");
  return parts.length > 1 ? parts[parts.length - 1].trim().replace(/\.$/, "") : p.family;
}

/**
 * Formate un prix en dinars tunisiens.
 * Le dinar a 3 décimales (millimes). Ex: 29.9 -> "29,900 DT".
 */
export function formatTND(dinars: number): string {
  const fixed = (Math.round(dinars * 1000) / 1000).toFixed(3);
  return fixed.replace(".", ",") + " DT";
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/**
 * Numéro de commande lisible ET non devinable : BLM-XXXXXXXX.
 * 8 caractères tirés au sort (alphabet sans caractères ambigus) =>
 * ~10^12 combinaisons, ce qui empêche l'énumération des commandes.
 */
export function generateOrderNumber(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sans O/0/I/1/L
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += alphabet[bytes[i] % alphabet.length];
  return `BLM-${s}`;
}

export function formatDateFR(iso: string): string {
  try {
    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}
