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

/** Crée un jeton de session signé et horodaté (utilisé à la connexion). */
export async function createSessionToken(): Promise<string> {
  const secret = getSecret();
  if (!secret) {
    throw new Error(
      "ADMIN_SESSION_SECRET doit être défini en production (valeur forte et aléatoire).",
    );
  }
  const issuedAt = Date.now().toString();
  const sig = await hmacHex(issuedAt, secret);
  return `${issuedAt}.${sig}`;
}

/** Vérifie l'email + le mot de passe du compte admin (définis en .env). */
export function verifyCredentials(email: string, password: string): boolean {
  const expectedEmail = (process.env.ADMIN_EMAIL || "admin@bloomy.tn").trim().toLowerCase();
  const expectedPassword = process.env.ADMIN_PASSWORD || "bloomy-admin";
  return (
    email.trim().toLowerCase() === expectedEmail &&
    password.length > 0 &&
    password === expectedPassword
  );
}

/** Vérifie la signature ET l'expiration du jeton de session. */
export async function isValidSession(cookieValue: string | undefined): Promise<boolean> {
  if (!cookieValue) return false;
  const secret = getSecret();
  if (!secret) return false;

  const dot = cookieValue.indexOf(".");
  if (dot <= 0) return false;
  const issuedAt = cookieValue.slice(0, dot);
  const sig = cookieValue.slice(dot + 1);

  const ts = Number(issuedAt);
  if (!Number.isFinite(ts) || ts <= 0) return false;
  if (Date.now() - ts > SESSION_MAX_AGE_MS) return false;

  const expected = await hmacHex(issuedAt, secret);
  return timingSafeEqual(sig, expected);
}
