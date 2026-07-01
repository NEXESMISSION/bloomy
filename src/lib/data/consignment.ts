import { supabaseAdmin } from "@/lib/supabase";
import { UserError } from "@/lib/errors";

/* ═══════════════════════════ Types ═══════════════════════════ */

export type CProduct = {
  id: string;
  created_at?: string;
  name: string;
  sku: string | null;
  size_ml: number;
  cost_price: number;
  selling_price: number;
  commission_per_sale: number;
  warehouse_stock: number;
  active: boolean;
};

export type ShopStatus = "active" | "paused" | "removed";
export type CShop = {
  id: string;
  created_at?: string;
  name: string;
  owner_name: string | null;
  phone: string | null;
  location: string | null;
  governorate: string | null;
  status: ShopStatus;
  notes: string | null;
};

export type DisplayStatus = "available" | "placed" | "removed";
export type DisplayBox = {
  id: string;
  created_at?: string;
  code: string;
  status: DisplayStatus;
  notes: string | null;
};

export type PlacementItem = {
  id: string;
  product_id: string | null;
  product_name: string;
  full_qty: number;
  current_qty: number;
  commission_per_sale: number;
  selling_price: number;
};
export type Placement = {
  id: string;
  shop_id: string;
  display_id: string | null;
  display_code: string | null;
  placed_at: string;
  status: "active" | "removed";
  items: PlacementItem[];
  total_current: number;
  total_full: number;
};

export type Visit = {
  id: string;
  created_at: string;
  shop_id: string;
  visited_at: string;
  total_sold: number;
  revenue: number;
  commission_total: number;
  amount_collected: number;
  notes: string | null;
  items: { product_id: string | null; name: string; remaining: number; sold: number; refilled: number }[];
};

/* ═══════════════════════════ Produits ═══════════════════════════ */

function mapProduct(r: any): CProduct {
  return {
    id: r.id, created_at: r.created_at, name: r.name, sku: r.sku ?? null,
    size_ml: Number(r.size_ml ?? 50), cost_price: Number(r.cost_price ?? 0),
    selling_price: Number(r.selling_price ?? 0), commission_per_sale: Number(r.commission_per_sale ?? 0),
    warehouse_stock: Number(r.warehouse_stock ?? 0), active: r.active ?? true,
  };
}

export async function listConsignmentProducts(includeInactive = true): Promise<CProduct[]> {
  const db = supabaseAdmin();
  if (!db) return [];
  let q = db.from("consignment_products").select("*").order("created_at", { ascending: true });
  if (!includeInactive) q = q.eq("active", true);
  const { data } = await q;
  return (data ?? []).map(mapProduct);
}

export type CProductInput = Omit<CProduct, "id" | "created_at"> & { id?: string };
export async function upsertConsignmentProduct(input: CProductInput): Promise<CProduct> {
  const db = supabaseAdmin();
  if (!db) throw new UserError("Supabase requis.");
  if (!input.name.trim()) throw new UserError("Nom du produit requis.");
  const row: any = {
    name: input.name.trim(),
    sku: input.sku?.trim() || null,
    size_ml: Math.max(0, Math.floor(Number(input.size_ml) || 0)),
    cost_price: Math.max(0, Number(input.cost_price) || 0),
    selling_price: Math.max(0, Number(input.selling_price) || 0),
    commission_per_sale: Math.max(0, Number(input.commission_per_sale) || 0),
    warehouse_stock: Math.max(0, Math.floor(Number(input.warehouse_stock) || 0)),
    active: input.active ?? true,
  };
  if (input.id) {
    const { data, error } = await db.from("consignment_products").update(row).eq("id", input.id).select("*").single();
    if (error) throw new Error(error.message);
    return mapProduct(data);
  }
  const { data, error } = await db.from("consignment_products").insert(row).select("*").single();
  if (error) throw new Error(error.message);
  return mapProduct(data);
}

export async function deleteConsignmentProduct(id: string): Promise<void> {
  const db = supabaseAdmin();
  if (!db) return;
  await db.from("consignment_products").delete().eq("id", id);
}

/** Ajoute du stock à l'entrepôt (réception de production). */
export async function addWarehouseStock(id: string, qty: number): Promise<void> {
  const db = supabaseAdmin();
  if (!db) return;
  const { data: p } = await db.from("consignment_products").select("warehouse_stock").eq("id", id).maybeSingle();
  if (!p) return;
  await db.from("consignment_products").update({ warehouse_stock: Math.max(0, Number(p.warehouse_stock) + Math.floor(qty)) }).eq("id", id);
}

async function decWarehouse(db: any, productId: string, qty: number) {
  if (qty <= 0) return;
  const { data: p } = await db.from("consignment_products").select("warehouse_stock").eq("id", productId).maybeSingle();
  if (!p) return;
  await db.from("consignment_products").update({ warehouse_stock: Math.max(0, Number(p.warehouse_stock) - qty) }).eq("id", productId);
}

/* ═══════════════════════════ Boutiques ═══════════════════════════ */

function mapShop(r: any): CShop {
  return {
    id: r.id, created_at: r.created_at, name: r.name, owner_name: r.owner_name ?? null,
    phone: r.phone ?? null, location: r.location ?? null, governorate: r.governorate ?? null,
    status: (["active", "paused", "removed"].includes(r.status) ? r.status : "active") as ShopStatus,
    notes: r.notes ?? null,
  };
}

export type ShopWithPlacement = CShop & { placement: Placement | null };

export async function listShops(): Promise<ShopWithPlacement[]> {
  const db = supabaseAdmin();
  if (!db) return [];
  const { data: shops } = await db.from("consignment_shops").select("*").order("created_at", { ascending: false });
  const out: ShopWithPlacement[] = [];
  for (const s of shops ?? []) {
    out.push({ ...mapShop(s), placement: await getActivePlacement(s.id) });
  }
  return out;
}

export async function getShop(id: string): Promise<CShop | null> {
  const db = supabaseAdmin();
  if (!db) return null;
  const { data } = await db.from("consignment_shops").select("*").eq("id", id).maybeSingle();
  return data ? mapShop(data) : null;
}

export type ShopInput = Omit<CShop, "id" | "created_at" | "status"> & { id?: string; status?: ShopStatus };
export async function upsertShop(input: ShopInput): Promise<CShop> {
  const db = supabaseAdmin();
  if (!db) throw new UserError("Supabase requis.");
  if (!input.name.trim()) throw new UserError("Nom de la boutique requis.");
  const row: any = {
    name: input.name.trim(), owner_name: input.owner_name?.trim() || null,
    phone: input.phone?.trim() || null, location: input.location?.trim() || null,
    governorate: input.governorate?.trim() || null, notes: input.notes?.trim() || null,
    ...(input.status ? { status: input.status } : {}),
  };
  if (input.id) {
    const { data, error } = await db.from("consignment_shops").update(row).eq("id", input.id).select("*").single();
    if (error) throw new Error(error.message);
    return mapShop(data);
  }
  const { data, error } = await db.from("consignment_shops").insert({ ...row, status: input.status ?? "active" }).select("*").single();
  if (error) throw new Error(error.message);
  return mapShop(data);
}

export async function setShopStatus(id: string, status: ShopStatus): Promise<void> {
  const db = supabaseAdmin();
  if (!db) return;
  await db.from("consignment_shops").update({ status }).eq("id", id);
}

/* ═══════════════════════════ Displays ═══════════════════════════ */

function mapDisplay(r: any): DisplayBox {
  return { id: r.id, created_at: r.created_at, code: r.code, status: r.status, notes: r.notes ?? null };
}

export type DisplayWithLocation = DisplayBox & { shop_name: string | null; shop_id: string | null };

export async function listDisplays(): Promise<DisplayWithLocation[]> {
  const db = supabaseAdmin();
  if (!db) return [];
  const { data: displays } = await db.from("display_boxes").select("*").order("code", { ascending: true });
  const { data: placements } = await db.from("placements").select("display_id, shop_id").eq("status", "active");
  const { data: shops } = await db.from("consignment_shops").select("id, name");
  const shopName = new Map((shops ?? []).map((s: any) => [s.id, s.name]));
  const placedAt = new Map((placements ?? []).map((p: any) => [p.display_id, p.shop_id]));
  return (displays ?? []).map((d: any) => {
    const shopId = placedAt.get(d.id) ?? null;
    return { ...mapDisplay(d), shop_id: shopId, shop_name: shopId ? shopName.get(shopId) ?? null : null };
  });
}

/** Prochain code DISPLAY-00N. */
export async function nextDisplayCode(): Promise<string> {
  const db = supabaseAdmin();
  if (!db) return "DISPLAY-001";
  const { data } = await db.from("display_boxes").select("code");
  let max = 0;
  for (const r of data ?? []) {
    const m = /(\d+)/.exec(r.code || "");
    if (m) max = Math.max(max, Number(m[1]));
  }
  return `DISPLAY-${String(max + 1).padStart(3, "0")}`;
}

export async function createDisplay(input: { code?: string; notes?: string }): Promise<DisplayBox> {
  const db = supabaseAdmin();
  if (!db) throw new UserError("Supabase requis.");
  const code = (input.code?.trim() || (await nextDisplayCode())).toUpperCase();
  const { data, error } = await db.from("display_boxes").insert({ code, notes: input.notes?.trim() || null, status: "available" }).select("*").single();
  if (error) throw new UserError(error.message.includes("duplicate") ? "Ce code de display existe déjà." : error.message);
  return mapDisplay(data);
}

export async function deleteDisplay(id: string): Promise<void> {
  const db = supabaseAdmin();
  if (!db) return;
  await db.from("display_boxes").delete().eq("id", id);
}

/* ═══════════════════════════ Placements ═══════════════════════════ */

export async function getActivePlacement(shopId: string): Promise<Placement | null> {
  const db = supabaseAdmin();
  if (!db) return null;
  const { data: p } = await db
    .from("placements")
    .select("*")
    .eq("shop_id", shopId)
    .eq("status", "active")
    .order("placed_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!p) return null;
  const [{ data: items }, { data: display }, { data: prods }] = await Promise.all([
    db.from("placement_items").select("*").eq("placement_id", p.id),
    p.display_id ? db.from("display_boxes").select("code").eq("id", p.display_id).maybeSingle() : Promise.resolve({ data: null }),
    db.from("consignment_products").select("id, name, commission_per_sale, selling_price"),
  ]);
  const pmap = new Map((prods ?? []).map((x: any) => [x.id, x]));
  const mapped: PlacementItem[] = (items ?? []).map((it: any) => {
    const prod = pmap.get(it.product_id);
    return {
      id: it.id, product_id: it.product_id ?? null, product_name: prod?.name ?? "—",
      full_qty: Number(it.full_qty), current_qty: Number(it.current_qty),
      commission_per_sale: Number(prod?.commission_per_sale ?? 0), selling_price: Number(prod?.selling_price ?? 0),
    };
  });
  return {
    id: p.id, shop_id: p.shop_id, display_id: p.display_id ?? null,
    display_code: (display as any)?.code ?? null, placed_at: p.placed_at, status: p.status,
    items: mapped,
    total_current: mapped.reduce((s, i) => s + i.current_qty, 0),
    total_full: mapped.reduce((s, i) => s + i.full_qty, 0),
  };
}

/** Pose un display dans une boutique (décrémente l'entrepôt). */
export async function createPlacement(input: {
  shop_id: string;
  display_id: string | null;
  items: { product_id: string; qty: number }[];
}): Promise<void> {
  const db = supabaseAdmin();
  if (!db) throw new UserError("Supabase requis.");
  const existing = await getActivePlacement(input.shop_id);
  if (existing) throw new UserError("Cette boutique a déjà un display actif. Retirez-le d'abord.");
  const items = input.items.filter((i) => i.product_id && Number(i.qty) > 0);
  if (!items.length) throw new UserError("Ajoutez au moins un flacon au display.");

  // Boîte display : on en crée une AUTOMATIQUEMENT si aucune n'est choisie, pour
  // que l'utilisateur n'ait jamais à passer par l'onglet Displays. Chaque
  // placement a donc toujours un code suivi (DISPLAY-00N).
  let displayId = input.display_id;
  if (displayId) {
    await db.from("display_boxes").update({ status: "placed" }).eq("id", displayId);
  } else {
    const code = await nextDisplayCode();
    const { data: box } = await db.from("display_boxes").insert({ code, status: "placed" }).select("id").single();
    displayId = box?.id ?? null;
  }

  const { data: placement, error } = await db
    .from("placements")
    .insert({ shop_id: input.shop_id, display_id: displayId, status: "active" })
    .select("*")
    .single();
  if (error || !placement) throw new Error(error?.message ?? "Erreur placement.");

  await db.from("placement_items").insert(
    items.map((i) => ({ placement_id: placement.id, product_id: i.product_id, full_qty: Math.floor(i.qty), current_qty: Math.floor(i.qty) })),
  );
  for (const i of items) await decWarehouse(db, i.product_id, Math.floor(i.qty));
}

/** Retire un display d'une boutique (option : renvoyer les flacons restants à l'entrepôt). */
export async function removePlacement(placementId: string, returnToWarehouse = true): Promise<void> {
  const db = supabaseAdmin();
  if (!db) return;
  const { data: p } = await db.from("placements").select("*").eq("id", placementId).maybeSingle();
  if (!p || p.status !== "active") return;
  if (returnToWarehouse) {
    const { data: items } = await db.from("placement_items").select("product_id, current_qty").eq("placement_id", placementId);
    for (const it of items ?? []) {
      if (it.product_id && Number(it.current_qty) > 0) await addWarehouseStock(it.product_id, Number(it.current_qty));
    }
  }
  await db.from("placements").update({ status: "removed", removed_at: new Date().toISOString() }).eq("id", placementId);
  if (p.display_id) await db.from("display_boxes").update({ status: "available" }).eq("id", p.display_id);
}

/* ═══════════════════════════ Visites (le cœur) ═══════════════════════════ */

export type VisitInput = {
  placement_id: string;
  counts: { product_id: string; remaining: number }[];
  refill: boolean;
  amount_collected?: number | null; // null → calcul auto (CA − commission)
  notes?: string;
  actorId?: string | null;
};

/**
 * Enregistre une visite : calcule vendus + commission depuis les restants comptés,
 * met à jour les quantités du display, réapprovisionne l'entrepôt si demandé.
 */
export async function recordVisit(input: VisitInput): Promise<Visit> {
  const db = supabaseAdmin();
  if (!db) throw new UserError("Supabase requis.");
  const placement = await getActivePlacementById(input.placement_id);
  if (!placement) throw new UserError("Placement introuvable ou déjà retiré.");

  const remainingBy = new Map(input.counts.map((c) => [c.product_id, Math.max(0, Math.floor(Number(c.remaining) || 0))]));
  let totalSold = 0, revenue = 0, commission = 0;
  const visitItems: { product_id: string; remaining: number; sold: number; refilled: number }[] = [];

  for (const it of placement.items) {
    if (!it.product_id) continue;
    const remaining = remainingBy.has(it.product_id) ? (remainingBy.get(it.product_id) as number) : it.current_qty;
    const sold = Math.max(0, it.current_qty - remaining);
    totalSold += sold;
    revenue += sold * it.selling_price;
    commission += sold * it.commission_per_sale;

    let refilled = 0;
    let newCurrent = remaining;
    if (input.refill) {
      refilled = Math.max(0, it.full_qty - remaining);
      newCurrent = remaining + refilled;
    }
    await db.from("placement_items").update({ current_qty: newCurrent }).eq("id", it.id);
    if (refilled > 0) await decWarehouse(db, it.product_id, refilled);
    visitItems.push({ product_id: it.product_id, remaining, sold, refilled });
  }

  revenue = Math.round(revenue * 1000) / 1000;
  commission = Math.round(commission * 1000) / 1000;
  const collected =
    input.amount_collected != null && Number.isFinite(input.amount_collected)
      ? Math.max(0, Number(input.amount_collected))
      : Math.max(0, Math.round((revenue - commission) * 1000) / 1000);

  const { data: visit, error } = await db
    .from("consignment_visits")
    .insert({
      placement_id: placement.id, shop_id: placement.shop_id, total_sold: totalSold,
      revenue, commission_total: commission, amount_collected: collected,
      notes: input.notes ?? null, created_by: input.actorId ?? null,
    })
    .select("*")
    .single();
  if (error || !visit) throw new Error(error?.message ?? "Erreur visite.");
  await db.from("consignment_visit_items").insert(visitItems.map((v) => ({ visit_id: visit.id, ...v })));

  const names = new Map(placement.items.map((i) => [i.product_id, i.product_name]));
  return {
    id: visit.id, created_at: visit.created_at, shop_id: visit.shop_id, visited_at: visit.visited_at,
    total_sold: totalSold, revenue, commission_total: commission, amount_collected: collected, notes: visit.notes ?? null,
    items: visitItems.map((v) => ({ ...v, name: names.get(v.product_id) ?? "—" })),
  };
}

async function getActivePlacementById(placementId: string): Promise<Placement | null> {
  const db = supabaseAdmin();
  if (!db) return null;
  const { data: p } = await db.from("placements").select("shop_id").eq("id", placementId).eq("status", "active").maybeSingle();
  if (!p) return null;
  return getActivePlacement(p.shop_id);
}

export async function listVisits(shopId?: string, limit = 100): Promise<Visit[]> {
  const db = supabaseAdmin();
  if (!db) return [];
  let q = db.from("consignment_visits").select("*").order("created_at", { ascending: false }).limit(limit);
  if (shopId) q = q.eq("shop_id", shopId);
  const { data: visits } = await q;
  if (!visits?.length) return [];
  const ids = visits.map((v: any) => v.id);
  const { data: items } = await db.from("consignment_visit_items").select("*").in("visit_id", ids);
  const { data: prods } = await db.from("consignment_products").select("id, name");
  const pname = new Map((prods ?? []).map((p: any) => [p.id, p.name]));
  return visits.map((v: any) => ({
    id: v.id, created_at: v.created_at, shop_id: v.shop_id, visited_at: v.visited_at,
    total_sold: Number(v.total_sold), revenue: Number(v.revenue), commission_total: Number(v.commission_total),
    amount_collected: Number(v.amount_collected), notes: v.notes ?? null,
    items: (items ?? []).filter((it: any) => it.visit_id === v.id).map((it: any) => ({
      product_id: it.product_id ?? null, name: pname.get(it.product_id) ?? "—",
      remaining: Number(it.remaining), sold: Number(it.sold), refilled: Number(it.refilled),
    })),
  }));
}

/* ═══════════════════════════ Inventaire & Dashboard ═══════════════════════════ */

export type InventoryRow = CProduct & { in_shops: number; total: number };
export async function getInventory(): Promise<InventoryRow[]> {
  const db = supabaseAdmin();
  if (!db) return [];
  const products = await listConsignmentProducts(true);
  const { data: items } = await db
    .from("placement_items")
    .select("product_id, current_qty, placement_id, placements!inner(status)")
    .eq("placements.status", "active");
  const inShops = new Map<string, number>();
  for (const it of items ?? []) {
    if (!it.product_id) continue;
    inShops.set(it.product_id, (inShops.get(it.product_id) ?? 0) + Number(it.current_qty));
  }
  return products.map((p) => {
    const s = inShops.get(p.id) ?? 0;
    return { ...p, in_shops: s, total: p.warehouse_stock + s };
  });
}

export const LOW_STOCK_THRESHOLD = 10;

export type ConsignmentDashboard = {
  activeShops: number;
  activeDisplays: number;
  bottlesInShops: number;
  soldThisMonth: number;
  revenueThisMonth: number;
  commissionThisMonth: number;
  collectedThisMonth: number;
  best: { name: string; sold: number } | null;
  worst: { name: string; sold: number } | null;
  lowStock: { name: string; warehouse_stock: number }[];
};

export async function getConsignmentDashboard(): Promise<ConsignmentDashboard> {
  const db = supabaseAdmin();
  if (!db) {
    return { activeShops: 0, activeDisplays: 0, bottlesInShops: 0, soldThisMonth: 0, revenueThisMonth: 0, commissionThisMonth: 0, collectedThisMonth: 0, best: null, worst: null, lowStock: [] };
  }
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const [{ count: activeShops }, { count: activeDisplays }, inv, { data: monthVisits }, { data: allItems }, { data: prods }] = await Promise.all([
    db.from("consignment_shops").select("id", { count: "exact", head: true }).eq("status", "active"),
    db.from("placements").select("id", { count: "exact", head: true }).eq("status", "active"),
    getInventory(),
    db.from("consignment_visits").select("id, total_sold, revenue, commission_total, amount_collected").gte("created_at", monthStart),
    db.from("consignment_visit_items").select("product_id, sold"),
    db.from("consignment_products").select("id, name"),
  ]);

  let soldThisMonth = 0, revenueThisMonth = 0, commissionThisMonth = 0, collectedThisMonth = 0;
  for (const v of monthVisits ?? []) {
    soldThisMonth += Number(v.total_sold);
    revenueThisMonth += Number(v.revenue);
    commissionThisMonth += Number(v.commission_total);
    collectedThisMonth += Number(v.amount_collected);
  }

  const soldBy = new Map<string, number>();
  for (const it of allItems ?? []) {
    if (!it.product_id) continue;
    soldBy.set(it.product_id, (soldBy.get(it.product_id) ?? 0) + Number(it.sold));
  }
  const pname = new Map((prods ?? []).map((p: any) => [p.id, p.name]));
  const ranked = Array.from(soldBy.entries())
    .map(([id, sold]) => ({ name: pname.get(id) ?? "—", sold }))
    .sort((a, b) => b.sold - a.sold);

  return {
    activeShops: activeShops ?? 0,
    activeDisplays: activeDisplays ?? 0,
    bottlesInShops: inv.reduce((s, r) => s + r.in_shops, 0),
    soldThisMonth,
    revenueThisMonth: Math.round(revenueThisMonth * 1000) / 1000,
    commissionThisMonth: Math.round(commissionThisMonth * 1000) / 1000,
    collectedThisMonth: Math.round(collectedThisMonth * 1000) / 1000,
    best: ranked.length ? ranked[0] : null,
    worst: ranked.length ? ranked[ranked.length - 1] : null,
    lowStock: inv.filter((p) => p.active && p.warehouse_stock <= LOW_STOCK_THRESHOLD).map((p) => ({ name: p.name, warehouse_stock: p.warehouse_stock })),
  };
}
