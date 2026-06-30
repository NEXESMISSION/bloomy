import crypto from "crypto";

/** Auth client (compte) — téléphone + mot de passe, cookie signé. Runtime Node. */
export const CUSTOMER_COOKIE = "bloomy_customer";
const SECRET = process.env.ADMIN_SESSION_SECRET || "dev-secret-bloomy-local-only";

export function hashPassword(pw: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(pw, salt, 32).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPasswordHash(pw: string, stored: string): boolean {
  const [salt, hash] = (stored || "").split(":");
  if (!salt || !hash) return false;
  const test = crypto.scryptSync(pw, salt, 32).toString("hex");
  const a = Buffer.from(hash, "hex");
  const b = Buffer.from(test, "hex");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function sign(id: string): string {
  return crypto.createHmac("sha256", SECRET).update(id).digest("hex");
}

export function customerToken(id: string): string {
  return `${id}.${sign(id)}`;
}

export function customerIdFromCookie(cookie: string | undefined): string | null {
  if (!cookie) return null;
  const dot = cookie.indexOf(".");
  if (dot <= 0) return null;
  const id = cookie.slice(0, dot);
  const sig = cookie.slice(dot + 1);
  const expected = sign(id);
  if (sig.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  return id;
}

/**
 * Canonicalise un numéro tunisien vers sa forme locale à 8 chiffres.
 * « +216 58 415 520 », « 21658415520 » et « 58415520 » donnent tous « 58415520 »,
 * pour que la mise en correspondance commande↔compte et l'unicité du téléphone
 * (un seul compte par numéro) fonctionnent quel que soit le format saisi.
 */
export function normalizePhone(phone: string): string {
  let d = (phone || "").replace(/[\s.\-+]/g, "");
  if (d.length === 11 && d.startsWith("216")) d = d.slice(3);
  return d;
}
