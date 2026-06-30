import { cookies } from "next/headers";
import { ADMIN_COOKIE, actorIdFromSession } from "@/lib/auth";
import { getStaffById } from "@/lib/data/staff";

export type CurrentStaff = { id: string; name: string; role: "owner" | "staff" };

/** Le membre connecté (propriétaire ou équipe via PIN), ou null. */
export async function getCurrentStaff(): Promise<CurrentStaff | null> {
  const cookie = cookies().get(ADMIN_COOKIE)?.value;
  const actor = await actorIdFromSession(cookie);
  if (!actor) return null;
  if (actor === "owner") return { id: "owner", name: "Propriétaire", role: "owner" };
  const staff = await getStaffById(actor);
  if (!staff) return null; // membre supprimé/désactivé → accès retiré
  return { id: staff.id, name: staff.name, role: staff.role };
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
