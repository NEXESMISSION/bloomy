"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/staffSession";
import { logActivity } from "@/lib/data/activity";
import { upsertClient, deleteClient, type ClientInput } from "@/lib/data/clients";
import { createSale, cancelSale, recordPayment, type SaleChannel, type SaleItem } from "@/lib/data/sales";
import { createRestock, setRestockStatus, deleteRestock, type RestockStatus } from "@/lib/data/restock";
import { addNote, deleteNote } from "@/lib/data/notes";

async function actor() {
  const me = await requireStaff();
  return { me, actorId: me.id === "owner" ? null : me.id };
}

/* ─────────── Clients ─────────── */

export async function saveClientAction(input: ClientInput) {
  const { me, actorId } = await actor();
  const c = await upsertClient(input);
  await logActivity({ actorId: me.id, actorName: me.name, action: input.id ? "Modification client" : "Nouveau client", entityType: "client", entityId: c.id, detail: c.name });
  revalidatePath("/crm/clients");
  return c;
}

export async function removeClientAction(id: string, name?: string) {
  const { me } = await actor();
  await deleteClient(id);
  await logActivity({ actorId: me.id, actorName: me.name, action: "Suppression client", entityType: "client", entityId: id, detail: name });
  revalidatePath("/crm/clients");
}

/* ─────────── Ventes ─────────── */

export async function createSaleAction(input: {
  client_id: string | null;
  channel: SaleChannel;
  items: SaleItem[];
  discount?: number;
  notes?: string;
  paid_now?: number;
}) {
  const { me, actorId } = await actor();
  const sale = await createSale({ ...input, actorId });
  await logActivity({ actorId: me.id, actorName: me.name, action: "Nouvelle vente", entityType: "sale", entityId: sale.id, detail: `${sale.total} DT` });
  revalidatePath("/crm/ventes");
  revalidatePath("/crm/clients");
  revalidatePath("/crm/stock");
  return sale;
}

export async function cancelSaleAction(id: string) {
  const { me } = await actor();
  await cancelSale(id);
  await logActivity({ actorId: me.id, actorName: me.name, action: "Vente annulée", entityType: "sale", entityId: id });
  revalidatePath("/crm/ventes");
  revalidatePath("/crm/clients");
  revalidatePath("/crm/stock");
}

export async function recordPaymentAction(input: { sale_id?: string | null; client_id: string | null; amount: number; method?: string; note?: string }) {
  const { me, actorId } = await actor();
  await recordPayment({ ...input, actorId });
  await logActivity({ actorId: me.id, actorName: me.name, action: "Encaissement", entityType: "payment", entityId: input.client_id, detail: `${input.amount} DT` });
  revalidatePath("/crm/ventes");
  revalidatePath("/crm/clients");
}

/* ─────────── Inventaire / réappro ─────────── */

export async function createRestockAction(input: { product_id: string | null; product_name: string; quantity: number; note?: string }) {
  const { me, actorId } = await actor();
  const r = await createRestock({ ...input, actorId });
  await logActivity({ actorId: me.id, actorName: me.name, action: "Demande de réappro", entityType: "restock", entityId: r.id, detail: `${r.product_name} ×${r.quantity}` });
  revalidatePath("/crm/stock");
  return r;
}

export async function setRestockStatusAction(id: string, status: RestockStatus) {
  const { me } = await actor();
  await setRestockStatus(id, status);
  await logActivity({ actorId: me.id, actorName: me.name, action: status === "fait" ? "Réappro terminée" : "Réappro mise à jour", entityType: "restock", entityId: id });
  revalidatePath("/crm/stock");
  revalidatePath("/admin/produits");
}

export async function removeRestockAction(id: string) {
  const { me } = await actor();
  await deleteRestock(id);
  await logActivity({ actorId: me.id, actorName: me.name, action: "Demande de réappro supprimée", entityType: "restock", entityId: id });
  revalidatePath("/crm/stock");
}

/* ─────────── Notes ─────────── */

export async function addNoteAction(input: { entity_type: string; entity_id: string | null; body: string }) {
  const { me } = await actor();
  const note = await addNote({ ...input, author_id: me.id === "owner" ? null : me.id, author_name: me.name });
  await logActivity({ actorId: me.id, actorName: me.name, action: "Note ajoutée", entityType: input.entity_type, entityId: input.entity_id, detail: input.body.slice(0, 60) });
  revalidatePath("/crm/clients");
  revalidatePath("/crm/ventes");
  return note;
}

export async function removeNoteAction(id: string) {
  const { me } = await actor();
  await deleteNote(id);
  await logActivity({ actorId: me.id, actorName: me.name, action: "Note supprimée", entityType: "note", entityId: id });
  revalidatePath("/crm/clients");
  revalidatePath("/crm/ventes");
}
