import { supabaseAdmin } from "@/lib/supabase";
import { localGetOrders, localSaveOrders, withStoreLock } from "@/lib/data/localStore";
import { getProductById } from "@/lib/data/products";
import { getSettings } from "@/lib/data/settings";
import { validateCode, redeemCode } from "@/lib/data/discounts";
import { generateOrderNumber } from "@/lib/utils";
import { UserError } from "@/lib/errors";
import type { NewOrderInput, Order, OrderItem, OrderStatus } from "@/lib/types";

function mapOrderRow(o: any): Omit<Order, "items"> {
  return {
    id: o.id,
    order_number: o.order_number,
    created_at: o.created_at,
    customer_name: o.customer_name,
    phone: o.phone,
    governorate: o.governorate,
    city: o.city,
    address: o.address,
    notes: o.notes ?? null,
    status: o.status,
    subtotal: Number(o.subtotal),
    discount_code: o.discount_code ?? null,
    discount_amount: Number(o.discount_amount ?? 0),
    delivery_fee: Number(o.delivery_fee),
    total: Number(o.total),
    source: o.source ?? null,
    customer_id: o.customer_id ?? null,
  };
}

function mapItemRow(it: any): OrderItem {
  return {
    product_id: it.product_id ?? null,
    name: it.name,
    unit_price: Number(it.unit_price),
    quantity: Number(it.quantity),
  };
}

/** Prix/nom AUTORITAIRES côté serveur : jamais le prix envoyé par le navigateur. */
async function priceItems(input: NewOrderInput["items"]): Promise<OrderItem[]> {
  const out: OrderItem[] = [];
  for (const it of input) {
    const quantity = Math.max(1, Math.floor(Number(it.quantity) || 1));
    if (it.product_id) {
      const product = await getProductById(it.product_id);
      if (!product || !product.is_active) throw new UserError(`Produit indisponible : ${it.name}`);
      if (product.stock <= 0) throw new UserError(`Rupture de stock : ${product.name}`);
      out.push({ product_id: product.id, name: product.name, unit_price: product.price, quantity });
    } else {
      out.push({ product_id: null, name: it.name, unit_price: Number(it.unit_price) || 0, quantity });
    }
  }
  return out;
}

/** Crée une commande (paiement à la livraison) avec code promo + suivi de source. */
export async function createOrder(input: NewOrderInput): Promise<Order> {
  if (!input.items.length) throw new UserError("Votre panier est vide.");
  const items = await priceItems(input.items);
  const subtotal = items.reduce((s, it) => s + it.unit_price * it.quantity, 0);
  const settings = await getSettings();

  let discount_code: string | null = null;
  let discount_amount = 0;
  let source = (input.source ?? "").trim();

  if (input.code && input.code.trim()) {
    const v = await validateCode(input.code.trim(), subtotal);
    if (!v.ok || !v.code) throw new UserError(v.message);
    const redeemed = await redeemCode(v.code.code);
    if (!redeemed) throw new UserError("Ce code n'est plus disponible.");
    discount_amount = v.discount;
    discount_code = v.code.code;
    if (v.code.source) source = v.code.source; // la source du code prime (suivi des leads)
  }

  const delivery_fee = subtotal >= settings.free_delivery_threshold ? 0 : settings.delivery_fee;
  const total = Math.max(0, subtotal - discount_amount) + delivery_fee;
  const order_number = generateOrderNumber();
  const created_at = new Date().toISOString();

  const base = {
    order_number,
    customer_name: input.customer_name,
    phone: input.phone,
    governorate: input.governorate,
    city: input.city,
    address: input.address,
    notes: input.notes ?? null,
    status: "nouvelle" as OrderStatus,
    subtotal,
    discount_code,
    discount_amount,
    delivery_fee,
    total,
    source,
    customer_id: input.customer_id ?? null,
  };

  const db = supabaseAdmin();
  if (!db) {
    const order: Order = { id: crypto.randomUUID(), created_at, ...base, items };
    return withStoreLock(async () => {
      const orders = await localGetOrders();
      orders.unshift(order);
      await localSaveOrders(orders);
      return order;
    });
  }

  const { data: orderRow, error: orderErr } = await db
    .from("orders")
    .insert(base)
    .select("*")
    .single();
  if (orderErr || !orderRow) throw new Error(orderErr?.message ?? "Erreur commande");

  const itemRows = items.map((it) => ({ order_id: orderRow.id, ...it }));
  const { error: itemsErr } = await db.from("order_items").insert(itemRows);
  if (itemsErr) throw new Error(itemsErr.message);

  // Décrémente le stock (ATOMIQUE) pour chaque produit du catalogue commandé.
  for (const it of items) {
    if (it.product_id) await db.rpc("adjust_stock", { p_id: it.product_id, p_delta: -Math.abs(it.quantity) });
  }

  return { ...mapOrderRow(orderRow), items };
}

export async function getOrderByNumber(orderNumber: string): Promise<Order | null> {
  const db = supabaseAdmin();
  if (!db) {
    return (await localGetOrders()).find((o) => o.order_number === orderNumber) ?? null;
  }
  const { data: order } = await db
    .from("orders")
    .select("*")
    .eq("order_number", orderNumber)
    .maybeSingle();
  if (!order) return null;
  const { data: items } = await db.from("order_items").select("*").eq("order_id", order.id);
  return { ...mapOrderRow(order), items: (items ?? []).map(mapItemRow) };
}

/** Commandes d'un client connecté : rattachées au compte OU passées avec le
 *  même téléphone avant la création du compte. */
export async function listOrdersByCustomer(customerId: string, phone?: string): Promise<Order[]> {
  const db = supabaseAdmin();
  if (!db) {
    return (await localGetOrders())
      .filter((o) => o.customer_id === customerId || (!!phone && o.phone === phone))
      .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  }
  let query = db.from("orders").select("*");
  query = phone ? query.or(`customer_id.eq.${customerId},phone.eq.${phone}`) : query.eq("customer_id", customerId);
  const { data: orders } = await query.order("created_at", { ascending: false });
  if (!orders?.length) return [];
  const ids = orders.map((o: any) => o.id);
  const { data: items } = await db.from("order_items").select("*").in("order_id", ids);
  return orders.map((o: any) => ({
    ...mapOrderRow(o),
    items: (items ?? []).filter((it: any) => it.order_id === o.id).map(mapItemRow),
  }));
}

/* ───────────────────────── ADMIN ───────────────────────── */

export async function listOrders(): Promise<Order[]> {
  const db = supabaseAdmin();
  if (!db) return localGetOrders();
  const { data: orders } = await db
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });
  if (!orders) return [];
  const { data: items } = await db.from("order_items").select("*");
  return orders.map((o) => ({
    ...mapOrderRow(o),
    items: (items ?? []).filter((it: any) => it.order_id === o.id).map(mapItemRow),
  }));
}

export async function updateOrderStatus(id: string, status: OrderStatus): Promise<void> {
  const db = supabaseAdmin();
  if (!db) {
    return withStoreLock(async () => {
      const orders = await localGetOrders();
      const idx = orders.findIndex((o) => o.id === id);
      if (idx >= 0) {
        orders[idx].status = status;
        await localSaveOrders(orders);
      }
    });
  }
  const { data: cur } = await db.from("orders").select("status").eq("id", id).maybeSingle();
  const oldStatus = cur?.status;
  const { error } = await db.from("orders").update({ status }).eq("id", id);
  if (error) throw new Error(error.message);
  // Annuler restaure le stock ; ré-activer une commande annulée le re-décrémente.
  if (oldStatus && oldStatus !== status && (status === "annulee" || oldStatus === "annulee")) {
    const sign = status === "annulee" ? 1 : -1;
    const { data: its } = await db.from("order_items").select("product_id,quantity").eq("order_id", id);
    for (const it of its ?? []) {
      if (it.product_id) await db.rpc("adjust_stock", { p_id: it.product_id, p_delta: sign * Math.abs(Number(it.quantity)) });
    }
  }
}

export async function deleteOrder(id: string): Promise<void> {
  const db = supabaseAdmin();
  if (!db) {
    return withStoreLock(async () => {
      await localSaveOrders((await localGetOrders()).filter((o) => o.id !== id));
    });
  }
  // Restaure le stock (sauf si déjà annulée : son stock a déjà été restauré).
  const { data: cur } = await db.from("orders").select("status").eq("id", id).maybeSingle();
  if (cur && cur.status !== "annulee") {
    const { data: its } = await db.from("order_items").select("product_id,quantity").eq("order_id", id);
    for (const it of its ?? []) {
      if (it.product_id) await db.rpc("adjust_stock", { p_id: it.product_id, p_delta: Math.abs(Number(it.quantity)) });
    }
  }
  await db.from("order_items").delete().eq("order_id", id);
  const { error } = await db.from("orders").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export type AdminStats = {
  total: number;
  nouvelles: number;
  revenue: number;
  livrees: number;
};

export async function getStats(): Promise<AdminStats> {
  const orders = await listOrders();
  return {
    total: orders.length,
    nouvelles: orders.filter((o) => o.status === "nouvelle").length,
    livrees: orders.filter((o) => o.status === "livree").length,
    revenue: orders
      .filter((o) => o.status !== "annulee")
      .reduce((sum, o) => sum + Number(o.total), 0),
  };
}

export type DayPoint = { date: string; label: string; orders: number; revenue: number };
export type TopProduct = { name: string; quantity: number; revenue: number };
export type Analytics = {
  daily: DayPoint[];
  byStatus: Record<OrderStatus, number>;
  topProducts: TopProduct[];
  avgOrder: number;
  toCollect: number; // CA des commandes non livrées et non annulées (à encaisser)
};

/** Statistiques détaillées pour le tableau de bord. */
export async function getAnalytics(days = 14): Promise<Analytics> {
  const orders = await listOrders();

  // Série journalière (N derniers jours, jours vides inclus).
  const daily: DayPoint[] = [];
  const buckets = new Map<string, { orders: number; revenue: number }>();
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    // Libellé dérivé de la MÊME clé UTC que le bucket (évite le décalage d'un jour
    // entre l'axe en heure locale et les commandes regroupées en UTC).
    const [, mm, dd] = key.split("-");
    buckets.set(key, { orders: 0, revenue: 0 });
    daily.push({ date: key, label: `${Number(dd)}/${Number(mm)}`, orders: 0, revenue: 0 });
  }
  for (const o of orders) {
    if (o.status === "annulee") continue;
    const key = String(o.created_at).slice(0, 10);
    const b = buckets.get(key);
    if (b) {
      b.orders += 1;
      b.revenue += Number(o.total);
    }
  }
  for (const point of daily) {
    const b = buckets.get(point.date)!;
    point.orders = b.orders;
    point.revenue = b.revenue;
  }

  const byStatus = { nouvelle: 0, confirmee: 0, expediee: 0, livree: 0, annulee: 0 } as Record<OrderStatus, number>;
  for (const o of orders) byStatus[o.status] = (byStatus[o.status] ?? 0) + 1;

  // Top produits (quantité vendue), hors commandes annulées.
  const prodMap = new Map<string, { quantity: number; revenue: number }>();
  for (const o of orders) {
    if (o.status === "annulee") continue;
    for (const it of o.items) {
      const cur = prodMap.get(it.name) ?? { quantity: 0, revenue: 0 };
      cur.quantity += Number(it.quantity);
      cur.revenue += Number(it.unit_price) * Number(it.quantity);
      prodMap.set(it.name, cur);
    }
  }
  const topProducts = Array.from(prodMap.entries())
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  const valid = orders.filter((o) => o.status !== "annulee");
  const revenue = valid.reduce((s, o) => s + Number(o.total), 0);
  const avgOrder = valid.length ? revenue / valid.length : 0;
  const toCollect = orders
    .filter((o) => o.status === "nouvelle" || o.status === "confirmee" || o.status === "expediee")
    .reduce((s, o) => s + Number(o.total), 0);

  return { daily, byStatus, topProducts, avgOrder, toCollect };
}

/** Agrégation par source / code (suivi des leads). */
export type SourceStat = { key: string; orders: number; revenue: number; codes: Set<string> };

export async function getSourceBreakdown(): Promise<
  { source: string; orders: number; revenue: number }[]
> {
  const orders = await listOrders();
  const map = new Map<string, { orders: number; revenue: number }>();
  for (const o of orders) {
    if (o.status === "annulee") continue;
    const key = (o.source && o.source.trim()) || (o.discount_code ? `Code ${o.discount_code}` : "Direct");
    const cur = map.get(key) ?? { orders: 0, revenue: 0 };
    cur.orders += 1;
    cur.revenue += Number(o.total);
    map.set(key, cur);
  }
  return Array.from(map.entries())
    .map(([source, v]) => ({ source, ...v }))
    .sort((a, b) => b.orders - a.orders);
}
