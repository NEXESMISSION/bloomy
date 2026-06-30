"use server";

import { revalidatePath } from "next/cache";
import { requireSuperAdmin } from "@/lib/staffSession";
import { logActivity } from "@/lib/data/activity";
import { deleteCustomer } from "@/lib/data/customers";

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
