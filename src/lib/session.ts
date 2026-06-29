import { cookies } from "next/headers";
import { ADMIN_COOKIE, isValidSession } from "@/lib/auth";

/** Vrai si la requête courante possède une session admin valide. */
export async function isAdmin(): Promise<boolean> {
  return isValidSession(cookies().get(ADMIN_COOKIE)?.value);
}

/** À appeler au début de chaque Server Action sensible. */
export async function requireAdmin(): Promise<void> {
  if (!(await isAdmin())) {
    throw new Error("Non autorisé. Veuillez vous reconnecter.");
  }
}
