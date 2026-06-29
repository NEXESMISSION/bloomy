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

export function normalizePhone(phone: string): string {
  return phone.replace(/[\s.\-]/g, "");
}
