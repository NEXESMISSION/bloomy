/**
 * Erreur « sûre » à afficher au client. Les actions publiques ne renvoient le
 * message au navigateur QUE s'il s'agit d'une UserError (message volontaire,
 * traduit). Toute autre erreur (ex. message brut de Supabase révélant le schéma)
 * est journalisée côté serveur et remplacée par un message générique.
 */
export class UserError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UserError";
  }
}

/** Message à montrer au client : le vrai message si UserError, sinon générique. */
export function clientErrorMessage(e: unknown, fallback = "Une erreur est survenue. Réessayez."): string {
  if (e instanceof UserError) return e.message;
  // Journalise l'erreur réelle côté serveur sans la divulguer.
  console.error("[action error]", e);
  return fallback;
}
