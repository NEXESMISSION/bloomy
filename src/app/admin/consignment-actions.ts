"use server";

import { revalidatePath } from "next/cache";
import { requireStaff, requireOwner } from "@/lib/staffSession";
import { logActivity } from "@/lib/data/activity";
import { clientErrorMessage } from "@/lib/errors";
import {
  upsertConsignmentProduct, deleteConsignmentProduct, addWarehouseStock, type CProductInput,
  upsertShop, setShopStatus, type ShopInput, type ShopStatus,
  createDisplay, deleteDisplay,
  createPlacement, removePlacement,
  recordVisit, type VisitInput,
} from "@/lib/data/consignment";

async function actor() {
  const me = await requireStaff();
  return { me, actorId: me.id === "owner" ? null : me.id };
}
function refreshAll() {
  revalidatePath("/crm/depot");
  revalidatePath("/crm/depot/boutiques", "layout");
  revalidatePath("/crm/depot/produits");
  revalidatePath("/crm/depot/displays");
}

/* ─────────── Produits ─────────── */

export async function saveConsignmentProductAction(input: CProductInput) {
  const { me } = await actor();
  try {
    const p = await upsertConsignmentProduct(input);
    await logActivity({ actorId: me.id, actorName: me.name, action: input.id ? "Produit dépôt modifié" : "Produit dépôt créé", entityType: "c_product", entityId: p.id, detail: p.name });
    refreshAll();
    return { ok: true as const, product: p };
  } catch (e) {
    return { ok: false as const, error: clientErrorMessage(e) };
  }
}

export async function deleteConsignmentProductAction(id: string, name?: string) {
  const me = await requireOwner();
  await deleteConsignmentProduct(id);
  await logActivity({ actorId: me.id, actorName: me.name, action: "Produit dépôt supprimé", entityType: "c_product", entityId: id, detail: name });
  refreshAll();
}

export async function addWarehouseStockAction(id: string, qty: number, name?: string) {
  const { me } = await actor();
  await addWarehouseStock(id, Math.floor(Number(qty) || 0));
  await logActivity({ actorId: me.id, actorName: me.name, action: "Réception entrepôt", entityType: "c_product", entityId: id, detail: `${name ?? ""} +${qty}` });
  refreshAll();
}

/* ─────────── Boutiques ─────────── */

export async function saveShopAction(input: ShopInput) {
  const { me } = await actor();
  try {
    const s = await upsertShop(input);
    await logActivity({ actorId: me.id, actorName: me.name, action: input.id ? "Boutique modifiée" : "Boutique ajoutée", entityType: "c_shop", entityId: s.id, detail: s.name });
    refreshAll();
    return { ok: true as const, shop: s };
  } catch (e) {
    return { ok: false as const, error: clientErrorMessage(e) };
  }
}

export async function setShopStatusAction(id: string, status: ShopStatus) {
  const { me } = await actor();
  await setShopStatus(id, status);
  await logActivity({ actorId: me.id, actorName: me.name, action: "Statut boutique", entityType: "c_shop", entityId: id, detail: status });
  refreshAll();
}

/* ─────────── Displays ─────────── */

export async function createDisplayAction(input: { code?: string; notes?: string }) {
  const { me } = await actor();
  try {
    const d = await createDisplay(input);
    await logActivity({ actorId: me.id, actorName: me.name, action: "Display créé", entityType: "display", entityId: d.id, detail: d.code });
    refreshAll();
    return { ok: true as const, display: d };
  } catch (e) {
    return { ok: false as const, error: clientErrorMessage(e) };
  }
}

export async function deleteDisplayAction(id: string, code?: string) {
  const me = await requireOwner();
  await deleteDisplay(id);
  await logActivity({ actorId: me.id, actorName: me.name, action: "Display supprimé", entityType: "display", entityId: id, detail: code });
  refreshAll();
}

/* ─────────── Placements ─────────── */

export async function createPlacementAction(input: { shop_id: string; display_id: string | null; items: { product_id: string; qty: number }[] }) {
  const { me } = await actor();
  try {
    await createPlacement(input);
    await logActivity({ actorId: me.id, actorName: me.name, action: "Display posé", entityType: "c_shop", entityId: input.shop_id });
    refreshAll();
    revalidatePath(`/crm/depot/boutiques/${input.shop_id}`);
    return { ok: true as const };
  } catch (e) {
    return { ok: false as const, error: clientErrorMessage(e) };
  }
}

export async function removePlacementAction(placementId: string, shopId: string, returnToWarehouse: boolean) {
  const { me } = await actor();
  await removePlacement(placementId, returnToWarehouse);
  await logActivity({ actorId: me.id, actorName: me.name, action: "Display retiré", entityType: "c_shop", entityId: shopId });
  refreshAll();
  revalidatePath(`/crm/depot/boutiques/${shopId}`);
}

/* ─────────── Visites ─────────── */

export async function recordVisitAction(input: VisitInput & { shop_id: string }) {
  const { me, actorId } = await actor();
  try {
    const visit = await recordVisit({ ...input, actorId });
    await logActivity({ actorId: me.id, actorName: me.name, action: "Visite / comptage", entityType: "c_shop", entityId: input.shop_id, detail: `${visit.total_sold} vendus · ${visit.commission_total} DT commission` });
    refreshAll();
    revalidatePath(`/crm/depot/boutiques/${input.shop_id}`);
    return { ok: true as const, visit };
  } catch (e) {
    return { ok: false as const, error: clientErrorMessage(e) };
  }
}
