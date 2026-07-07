/**
 * Limiteur de débit best-effort, en mémoire (par instance de serveur).
 *
 * ⚠️ IMPORTANT : sur un hébergement serverless (Vercel), la mémoire n'est NI
 * partagée entre instances NI durable. Ceci freine donc les rafales naïves
 * (un même client qui martèle une instance « chaude ») mais n'est PAS un quota
 * fiable et distribué. Pour un vrai anti-abus, brancher un store partagé
 * (Vercel KV / Upstash / une table Supabase avec compteur). Suffisant ici en
 * défense superficielle sur des endpoints déjà protégés par jeton.
 */
type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

/** true = autorisé, false = quota dépassé. Fenêtre glissante simple. */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const cur = buckets.get(key);
  if (!cur || now > cur.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (cur.count >= limit) return false;
  cur.count += 1;
  return true;
}
