import { supabaseAdmin } from "@/lib/supabase";
import { hashPassword, verifyPasswordHash } from "@/lib/customerAuth";
import { verifyCredentials as verifyEnvCredentials } from "@/lib/auth";

/**
 * Identifiants du SUPER ADMIN (compte e-mail/mot de passe) stockés en base
 * (table `settings`, accessible uniquement via la clé service_role). Permet de
 * définir/roter le mot de passe SANS variable d'environnement ni redéploiement.
 * Repli sur ADMIN_EMAIL / ADMIN_PASSWORD (env) pour le dev local.
 */

async function dbCredentials(): Promise<{ email: string; passwordHash: string } | null> {
  const db = supabaseAdmin();
  if (!db) return null;
  const { data } = await db
    .from("settings")
    .select("key,value")
    .in("key", ["admin_email", "admin_password_hash"]);
  if (!data) return null;
  const map = Object.fromEntries(data.map((r: any) => [r.key, r.value]));
  if (!map.admin_email || !map.admin_password_hash) return null;
  return { email: String(map.admin_email), passwordHash: String(map.admin_password_hash) };
}

/** Comparaison à temps constant (évite la fuite d'info par timing). */
function eqConstTime(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

/** Vrai si l'email + mot de passe correspondent au propriétaire. */
export async function verifyOwnerCredentials(email: string, password: string): Promise<boolean> {
  const creds = await dbCredentials();
  if (creds) {
    const emailOk = eqConstTime(email.trim().toLowerCase(), creds.email.trim().toLowerCase());
    const passOk = password.length > 0 && verifyPasswordHash(password, creds.passwordHash);
    return emailOk && passOk;
  }
  // Aucun identifiant en base → repli sur l'environnement (dev / rétro-compat).
  return verifyEnvCredentials(email, password);
}

/** Définit (ou remplace) l'email + mot de passe du propriétaire en base. */
export async function setOwnerCredentials(email: string, password: string): Promise<void> {
  const db = supabaseAdmin();
  if (!db) throw new Error("Supabase requis pour définir les identifiants admin.");
  const rows = [
    { key: "admin_email", value: email.trim().toLowerCase() },
    { key: "admin_password_hash", value: hashPassword(password) },
  ];
  const { error } = await db.from("settings").upsert(rows);
  if (error) throw new Error(error.message);
}
