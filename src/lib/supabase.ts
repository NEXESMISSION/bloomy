import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/** Vrai si les variables Supabase sont présentes (sinon : mode démo local). */
export const isSupabaseConfigured = Boolean(url && serviceKey);

let _admin: SupabaseClient | null = null;

/**
 * Client Supabase côté serveur avec la clé service_role.
 * À n'utiliser QUE dans des Server Components / Server Actions / Route Handlers.
 * Retourne null si Supabase n'est pas configuré.
 */
export function supabaseAdmin(): SupabaseClient | null {
  if (!url || !serviceKey) return null;
  if (!_admin) {
    _admin = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      // Empêche Next.js de mettre en cache les lectures : l'admin et la
      // boutique affichent toujours des données fraîches.
      global: {
        fetch: (input: any, init?: any) => fetch(input, { ...init, cache: "no-store" }),
      },
    });
  }
  return _admin;
}
