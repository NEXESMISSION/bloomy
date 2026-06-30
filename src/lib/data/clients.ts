import { supabaseAdmin } from "@/lib/supabase";

export type ClientKind = "particulier" | "boutique";

export type Client = {
  id: string;
  created_at?: string;
  kind: ClientKind;
  name: string;
  phone: string | null;
  email: string | null;
  governorate: string | null;
  city: string | null;
  address: string | null;
  photo_url: string | null;
  location_note: string | null;
  credit_limit: number;
  tags: string[];
  notes: string | null;
};

export type ClientWithStats = Client & {
  sales_count: number;
  total_sales: number;
  total_paid: number;
  balance: number; // argent à récupérer = ventes − encaissé
  last_sale: string | null;
};

export type ClientInput = Omit<Client, "id" | "created_at"> & { id?: string };

function map(r: any): Client {
  return {
    id: r.id,
    created_at: r.created_at,
    kind: r.kind === "boutique" ? "boutique" : "particulier",
    name: r.name,
    phone: r.phone ?? null,
    email: r.email ?? null,
    governorate: r.governorate ?? null,
    city: r.city ?? null,
    address: r.address ?? null,
    photo_url: r.photo_url ?? null,
    location_note: r.location_note ?? null,
    credit_limit: Number(r.credit_limit ?? 0),
    tags: Array.isArray(r.tags) ? r.tags : [],
    notes: r.notes ?? null,
  };
}

export async function listClients(): Promise<ClientWithStats[]> {
  const db = supabaseAdmin();
  if (!db) return [];
  const [{ data: clients }, { data: sales }, { data: payments }] = await Promise.all([
    db.from("clients").select("*").order("created_at", { ascending: false }),
    db.from("sales").select("client_id,total,status,created_at"),
    db.from("payments").select("client_id,amount"),
  ]);

  const salesByClient = new Map<string, { count: number; total: number; last: string | null }>();
  for (const s of sales ?? []) {
    if (!s.client_id || s.status === "annulee") continue;
    const cur = salesByClient.get(s.client_id) ?? { count: 0, total: 0, last: null };
    cur.count += 1;
    cur.total += Number(s.total);
    if (!cur.last || s.created_at > cur.last) cur.last = s.created_at;
    salesByClient.set(s.client_id, cur);
  }
  const paidByClient = new Map<string, number>();
  for (const p of payments ?? []) {
    if (!p.client_id) continue;
    paidByClient.set(p.client_id, (paidByClient.get(p.client_id) ?? 0) + Number(p.amount));
  }

  return (clients ?? []).map((r: any) => {
    const c = map(r);
    const s = salesByClient.get(c.id) ?? { count: 0, total: 0, last: null };
    const paid = paidByClient.get(c.id) ?? 0;
    return {
      ...c,
      sales_count: s.count,
      total_sales: s.total,
      total_paid: paid,
      balance: Math.max(0, Math.round((s.total - paid) * 1000) / 1000),
      last_sale: s.last,
    };
  });
}

export async function getClient(id: string): Promise<Client | null> {
  const db = supabaseAdmin();
  if (!db) return null;
  const { data } = await db.from("clients").select("*").eq("id", id).maybeSingle();
  return data ? map(data) : null;
}

export async function upsertClient(input: ClientInput): Promise<Client> {
  const db = supabaseAdmin();
  if (!db) throw new Error("Supabase requis.");
  const row: any = {
    kind: input.kind,
    name: input.name.trim(),
    phone: input.phone,
    email: input.email,
    governorate: input.governorate,
    city: input.city,
    address: input.address,
    photo_url: input.photo_url,
    location_note: input.location_note,
    credit_limit: input.credit_limit ?? 0,
    tags: input.tags ?? [],
    notes: input.notes,
    updated_at: new Date().toISOString(),
  };
  if (input.id) {
    const { data, error } = await db.from("clients").update(row).eq("id", input.id).select("*").single();
    if (error) throw new Error(error.message);
    return map(data);
  }
  const { data, error } = await db.from("clients").insert(row).select("*").single();
  if (error) throw new Error(error.message);
  return map(data);
}

export async function deleteClient(id: string): Promise<void> {
  const db = supabaseAdmin();
  if (!db) return;
  await db.from("clients").delete().eq("id", id);
}
