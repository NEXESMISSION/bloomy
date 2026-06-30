import { supabaseAdmin } from "@/lib/supabase";
import { generateOrderNumber } from "@/lib/utils";

export type SaleChannel = "boutique" | "gros" | "en_ligne";
export type SaleStatus = "completee" | "annulee";
export type PayStatus = "payee" | "partielle" | "impayee";

export type SaleItem = { product_id: string | null; name: string; unit_price: number; quantity: number };
export type Sale = {
  id: string;
  created_at: string;
  sale_number: string | null;
  client_id: string | null;
  channel: SaleChannel;
  status: SaleStatus;
  subtotal: number;
  discount: number;
  total: number;
  amount_paid: number;
  pay_status: PayStatus;
  notes: string | null;
  sold_by: string | null;
  items: SaleItem[];
};
export type Payment = {
  id: string;
  created_at: string;
  sale_id: string | null;
  client_id: string | null;
  amount: number;
  method: string;
  note: string | null;
};

function payStatus(total: number, paid: number): PayStatus {
  if (paid >= total - 0.0005) return "payee";
  if (paid > 0) return "partielle";
  return "impayee";
}
function mapItem(r: any): SaleItem {
  return { product_id: r.product_id ?? null, name: r.name, unit_price: Number(r.unit_price), quantity: Number(r.quantity) };
}
function mapSale(r: any, items: any[]): Sale {
  return {
    id: r.id,
    created_at: r.created_at,
    sale_number: r.sale_number ?? null,
    client_id: r.client_id ?? null,
    channel: r.channel,
    status: r.status === "annulee" ? "annulee" : "completee",
    subtotal: Number(r.subtotal),
    discount: Number(r.discount ?? 0),
    total: Number(r.total),
    amount_paid: Number(r.amount_paid ?? 0),
    pay_status: r.pay_status,
    notes: r.notes ?? null,
    sold_by: r.sold_by ?? null,
    items: items.map(mapItem),
  };
}

export async function listSales(): Promise<Sale[]> {
  const db = supabaseAdmin();
  if (!db) return [];
  const { data: sales } = await db.from("sales").select("*").order("created_at", { ascending: false });
  if (!sales?.length) return [];
  const { data: items } = await db.from("sale_items").select("*");
  return sales.map((s: any) => mapSale(s, (items ?? []).filter((it: any) => it.sale_id === s.id)));
}

export async function getSale(id: string): Promise<Sale | null> {
  const db = supabaseAdmin();
  if (!db) return null;
  const { data: s } = await db.from("sales").select("*").eq("id", id).maybeSingle();
  if (!s) return null;
  const { data: items } = await db.from("sale_items").select("*").eq("sale_id", id);
  return mapSale(s, items ?? []);
}

export async function createSale(input: {
  client_id: string | null;
  channel: SaleChannel;
  items: SaleItem[];
  discount?: number;
  notes?: string;
  paid_now?: number;
  actorId?: string | null;
}): Promise<Sale> {
  const db = supabaseAdmin();
  if (!db) throw new Error("Supabase requis.");
  const items = input.items.filter((i) => i.name?.trim() && Number(i.quantity) > 0);
  if (!items.length) throw new Error("Ajoutez au moins un article.");

  const subtotal = items.reduce((s, i) => s + Number(i.unit_price) * Number(i.quantity), 0);
  const discount = Math.max(0, Number(input.discount) || 0);
  const total = Math.max(0, Math.round((subtotal - discount) * 1000) / 1000);
  const paid = Math.min(total, Math.max(0, Number(input.paid_now) || 0));

  const { data: saleRow, error } = await db
    .from("sales")
    .insert({
      sale_number: generateOrderNumber(),
      client_id: input.client_id,
      channel: input.channel,
      status: "completee",
      subtotal,
      discount,
      total,
      amount_paid: paid,
      pay_status: payStatus(total, paid),
      notes: input.notes ?? null,
      sold_by: input.actorId ?? null,
      created_by: input.actorId ?? null,
    })
    .select("*")
    .single();
  if (error || !saleRow) throw new Error(error?.message ?? "Erreur lors de la vente.");

  await db.from("sale_items").insert(
    items.map((i) => ({ sale_id: saleRow.id, product_id: i.product_id, name: i.name.trim(), unit_price: i.unit_price, quantity: i.quantity })),
  );

  // Décrémente le stock des produits du catalogue — ATOMIQUE (anti-survente / lost-update).
  for (const i of items) {
    if (!i.product_id) continue;
    await db.rpc("adjust_stock", { p_id: i.product_id, p_delta: -Math.abs(Number(i.quantity)) });
  }

  if (paid > 0) {
    await db.from("payments").insert({ sale_id: saleRow.id, client_id: input.client_id, amount: paid, method: "espece", received_by: input.actorId ?? null });
  }

  return (await getSale(saleRow.id))!;
}

export async function cancelSale(id: string): Promise<void> {
  const db = supabaseAdmin();
  if (!db) return;
  const { data: sale } = await db.from("sales").select("status").eq("id", id).maybeSingle();
  if (!sale || sale.status === "annulee") return;
  // Restaure le stock — ATOMIQUE.
  const { data: items } = await db.from("sale_items").select("product_id,quantity").eq("sale_id", id);
  for (const i of items ?? []) {
    if (!i.product_id) continue;
    await db.rpc("adjust_stock", { p_id: i.product_id, p_delta: Math.abs(Number(i.quantity)) });
  }
  await db.from("sales").update({ status: "annulee" }).eq("id", id);
}

export async function recordPayment(input: {
  sale_id?: string | null;
  client_id: string | null;
  amount: number;
  method?: string;
  note?: string;
  actorId?: string | null;
}): Promise<void> {
  const db = supabaseAdmin();
  if (!db) return;
  const amount = Math.round(Number(input.amount) * 1000) / 1000;
  if (!(amount > 0)) throw new Error("Montant invalide.");
  await db.from("payments").insert({
    sale_id: input.sale_id ?? null,
    client_id: input.client_id ?? null,
    amount,
    method: input.method ?? "espece",
    note: input.note ?? null,
    received_by: input.actorId ?? null,
  });
  // Met à jour le statut de paiement de la vente si rattaché.
  if (input.sale_id) {
    const { data: pays } = await db.from("payments").select("amount").eq("sale_id", input.sale_id);
    const paid = (pays ?? []).reduce((s: number, p: any) => s + Number(p.amount), 0);
    const { data: sale } = await db.from("sales").select("total").eq("id", input.sale_id).maybeSingle();
    if (sale) {
      // amount_paid borné au total (le statut reste « payee » en cas de surpaiement).
      const clamped = Math.min(Number(sale.total), paid);
      await db.from("sales").update({ amount_paid: clamped, pay_status: payStatus(Number(sale.total), paid) }).eq("id", input.sale_id);
    }
  }
}

export async function listPayments(clientId?: string): Promise<Payment[]> {
  const db = supabaseAdmin();
  if (!db) return [];
  let q = db.from("payments").select("*").order("created_at", { ascending: false });
  if (clientId) q = q.eq("client_id", clientId);
  const { data } = await q;
  return (data ?? []) as Payment[];
}
