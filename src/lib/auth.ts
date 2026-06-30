/**
 * Authentification du super admin — simple et robuste :
 * un seul mot de passe partagé (ADMIN_PASSWORD) + cookie httpOnly signé.
 * Compatible runtime Node ET Edge (middleware) : utilise Web Crypto.
 *
 * Le jeton de session contient un horodatage signé (HMAC) : il expire
 * (7 jours) et n'est donc pas une valeur constante réutilisable à l'infini.
 */
export const ADMIN_COOKIE = "bloomy_admin";

const SESSION_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 7; // 7 jours
const DEV_DEFAULTS = new Set([
  "",
  "dev-secret-bloomy",
  "change-me-to-a-long-random-string",
]);

/**
 * Retourne le secret de signature, ou null si l'on est en production sans
 * secret valide (fail-closed : on refuse alors d'émettre/valider toute session).
 */
function getSecret(): string | null {
  const s = process.env.ADMIN_SESSION_SECRET || "";
  if (process.env.NODE_ENV === "production" && DEV_DEFAULTS.has(s)) return null;
  return s || "dev-secret-bloomy-local-only";
}

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function hmacHex(message: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return toHex(sig);
}

/** Comparaison à temps constant (évite les attaques temporelles). */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

/**
 * Crée un jeton de session signé et horodaté.
 * `actorId` = "owner" (connexion email/mot de passe) ou l'id d'un membre de
 * l'équipe (connexion par PIN). Format : `issuedAt.actorId.sig`.
 */
export async function createSessionToken(actorId = "owner"): Promise<string> {
  const secret = getSecret();
  if (!secret) {
    throw new Error(
      "ADMIN_SESSION_SECRET doit être défini en production (valeur forte et aléatoire).",
    );
  }
  const issuedAt = Date.now().toString();
  const payload = `${issuedAt}.${actorId}`;
  const sig = await hmacHex(payload, secret);
  return `${payload}.${sig}`;
}

/** Mot de passe de dev (ne DOIT jamais servir en production). */
const DEV_DEFAULT_PASSWORD = "bloomy-admin";

/** Vérifie l'email + le mot de passe du compte admin (définis en .env). */
export function verifyCredentials(email: string, password: string): boolean {
  const rawPassword = process.env.ADMIN_PASSWORD || "";
  // Fail-closed : en production, on REFUSE toute connexion si le mot de passe
  // n'est pas défini (ou laissé à la valeur de dev) — pas de défaut exploitable.
  if (
    process.env.NODE_ENV === "production" &&
    (!rawPassword || rawPassword === DEV_DEFAULT_PASSWORD)
  ) {
    return false;
  }
  const expectedEmail = (process.env.ADMIN_EMAIL || "admin@bloomy.tn").trim().toLowerCase();
  const expectedPassword = rawPassword || DEV_DEFAULT_PASSWORD;
  // Comparaison à temps constant (évite la fuite d'info par timing).
  const emailOk = timingSafeEqual(email.trim().toLowerCase(), expectedEmail);
  const passOk = password.length > 0 && timingSafeEqual(password, expectedPassword);
  return emailOk && passOk;
}

/** Vérifie la session et renvoie l'actorId ("owner" ou id équipe), sinon null. */
async function verifySession(cookieValue: string | undefined): Promise<string | null> {
  if (!cookieValue) return null;
  const secret = getSecret();
  if (!secret) return null;

  const parts = cookieValue.split(".");
  let issuedAt: string;
  let actorId: string;
  let sig: string;
  let payload: string;
  if (parts.length === 3) {
    [issuedAt, actorId, sig] = parts;
    payload = `${issuedAt}.${actorId}`;
  } else if (parts.length === 2) {
    // Ancien format (signait uniquement l'horodatage) → propriétaire.
    [issuedAt, sig] = parts;
    actorId = "owner";
    payload = issuedAt;
  } else {
    return null;
  }

  const ts = Number(issuedAt);
  if (!Number.isFinite(ts) || ts <= 0) return null;
  if (Date.now() - ts > SESSION_MAX_AGE_MS) return null;

  const expected = await hmacHex(payload, secret);
  if (!timingSafeEqual(sig, expected)) return null;
  return actorId;
}

/** Vrai si le cookie de session est valide (utilisé par le middleware). */
export async function isValidSession(cookieValue: string | undefined): Promise<boolean> {
  return (await verifySession(cookieValue)) !== null;
}

/** Renvoie l'identifiant de l'acteur connecté ("owner" ou id équipe), ou null. */
export async function actorIdFromSession(cookieValue: string | undefined): Promise<string | null> {
  return verifySession(cookieValue);
}
