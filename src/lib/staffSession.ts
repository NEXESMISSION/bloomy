import { cookies } from "next/headers";
import { ADMIN_COOKIE, actorIdFromSession } from "@/lib/auth";
import { getStaffById } from "@/lib/data/staff";

export type CurrentStaff = {
  id: string;
  name: string;
  role: "owner" | "staff";
  /** Le SUPER ADMIN = le compte e-mail/mot de passe (saif@gmail.com), id "owner".
   *  Les membres d'équipe (même rôle "owner") ont un UUID : ils ne le sont PAS. */
  isSuperAdmin: boolean;
};

/** Le membre connecté (super admin ou équipe via PIN), ou null. */
export async function getCurrentStaff(): Promise<CurrentStaff | null> {
  const cookie = cookies().get(ADMIN_COOKIE)?.value;
  const actor = await actorIdFromSession(cookie);
  if (!actor) return null;
  if (actor === "owner") return { id: "owner", name: "Super Admin", role: "owner", isSuperAdmin: true };
  const staff = await getStaffById(actor);
  if (!staff) return null; // membre supprimé/désactivé → accès retiré
  return { id: staff.id, name: staff.name, role: staff.role, isSuperAdmin: false };
}

export async function requireStaff(): Promise<CurrentStaff> {
  const s = await getCurrentStaff();
  if (!s) throw new Error("Non autorisé. Veuillez vous reconnecter.");
  return s;
}

export async function requireOwner(): Promise<CurrentStaff> {
  const s = await requireStaff();
  if (s.role !== "owner") throw new Error("Action réservée au propriétaire.");
  return s;
}

/** Réservé au SUPER ADMIN (le compte e-mail/mot de passe). */
export async function requireSuperAdmin(): Promise<CurrentStaff> {
  const s = await requireStaff();
  if (!s.isSuperAdmin) throw new Error("Action réservée au super administrateur.");
  return s;
}
