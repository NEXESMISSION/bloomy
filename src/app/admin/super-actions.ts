"use server";

import crypto from "crypto";
import { revalidatePath } from "next/cache";
import { requireSuperAdmin } from "@/lib/staffSession";
import { logActivity } from "@/lib/data/activity";
import { deleteCustomer, setCustomerPassword } from "@/lib/data/customers";

/** Actions réservées au SUPER ADMIN (compte e-mail/mot de passe). */

export async function deleteCustomerAction(id: string, name?: string) {
  const me = await requireSuperAdmin();
  await deleteCustomer(id);
  await logActivity({
    actorId: me.id,
    actorName: me.name,
    action: "Compte client supprimé",
    entityType: "customer",
    entityId: id,
    detail: name,
  });
  revalidatePath("/admin/systeme");
}

/** Réinitialise le mot de passe d'un client et renvoie le nouveau (à communiquer
 *  au client). Pas d'email/SMS requis — adapté au modèle COD où l'équipe appelle. */
export async function resetCustomerPasswordAction(id: string, name?: string): Promise<{ password: string }> {
  const me = await requireSuperAdmin();
  const password = crypto.randomBytes(4).toString("hex"); // 8 caractères
  await setCustomerPassword(id, password);
  await logActivity({
    actorId: me.id,
    actorName: me.name,
    action: "Réinitialisation mot de passe client",
    entityType: "customer",
    entityId: id,
    detail: name,
  });
  revalidatePath("/admin/systeme");
  return { password };
}
