import { supabaseAdmin } from "@/lib/supabase";
import { localGetCustomers, localSaveCustomers, withStoreLock } from "@/lib/data/localStore";
import { hashPassword, verifyPasswordHash, normalizePhone } from "@/lib/customerAuth";
import { UserError } from "@/lib/errors";
import type { Customer } from "@/lib/types";

function publicCustomer(r: any): Customer {
  return { id: r.id, created_at: r.created_at, name: r.name, phone: r.phone, email: r.email ?? null };
}

export type SignupInput = { name: string; phone: string; email?: string; password: string };

export async function createCustomer(input: SignupInput): Promise<Customer> {
  const phone = normalizePhone(input.phone);
  const row = {
    name: input.name.trim().slice(0, 80),
    phone,
    email: input.email?.trim() || null,
    password_hash: hashPassword(input.password),
  };
  const db = supabaseAdmin();
  if (!db) {
    return withStoreLock(async () => {
      const all = await localGetCustomers();
      if (all.some((c) => c.phone === phone)) throw new UserError("Ce numéro a déjà un compte.");
      const created = { id: crypto.randomUUID(), created_at: new Date().toISOString(), ...row };
      all.push(created);
      await localSaveCustomers(all);
      return publicCustomer(created);
    });
  }
  const exists = await db.from("customers").select("id").eq("phone", phone).maybeSingle();
  if (exists.data) throw new UserError("Ce numéro a déjà un compte.");
  const { data, error } = await db.from("customers").insert(row).select("*").single();
  if (error) throw new Error(error.message);
  return publicCustomer(data);
}

export async function authenticateCustomer(phone: string, password: string): Promise<Customer | null> {
  const p = normalizePhone(phone);
  const db = supabaseAdmin();
  if (!db) {
    const c = (await localGetCustomers()).find((x) => x.phone === p);
    if (!c || !verifyPasswordHash(password, c.password_hash)) return null;
    return publicCustomer(c);
  }
  const { data } = await db.from("customers").select("*").eq("phone", p).maybeSingle();
  if (!data || !verifyPasswordHash(password, data.password_hash)) return null;
  return publicCustomer(data);
}

export async function getCustomerById(id: string): Promise<Customer | null> {
  const db = supabaseAdmin();
  if (!db) {
    const c = (await localGetCustomers()).find((x) => x.id === id);
    return c ? publicCustomer(c) : null;
  }
  const { data } = await db.from("customers").select("*").eq("id", id).maybeSingle();
  return data ? publicCustomer(data) : null;
}

/* ───────────────────────── SUPER ADMIN ───────────────────────── */

export type CustomerWithStats = Customer & {
  orders_count: number;
  wins_count: number;
  last_order: string | null;
};

/** Tous les comptes clients + stats (commandes rattachées par téléphone, gains roulette). */
export async function listCustomersWithStats(): Promise<CustomerWithStats[]> {
  const db = supabaseAdmin();
  if (!db) {
    return (await localGetCustomers()).map((c) => ({
      ...publicCustomer(c),
      orders_count: 0,
      wins_count: 0,
      last_order: null,
    }));
  }
  const [{ data: customers }, { data: orders }, { data: wins }] = await Promise.all([
    db.from("customers").select("id,created_at,name,phone,email").order("created_at", { ascending: false }),
    db.from("orders").select("phone,created_at"),
    db.from("roulette_wins").select("customer_id"),
  ]);

  const ordersByPhone = new Map<string, { count: number; last: string | null }>();
  for (const o of orders ?? []) {
    const p = normalizePhone(o.phone || "");
    if (!p) continue;
    const cur = ordersByPhone.get(p) ?? { count: 0, last: null };
    cur.count += 1;
    if (!cur.last || o.created_at > cur.last) cur.last = o.created_at;
    ordersByPhone.set(p, cur);
  }
  const winsByCustomer = new Map<string, number>();
  for (const w of wins ?? []) {
    if (w.customer_id) winsByCustomer.set(w.customer_id, (winsByCustomer.get(w.customer_id) ?? 0) + 1);
  }

  return (customers ?? []).map((r: any) => {
    const c = publicCustomer(r);
    const ob = ordersByPhone.get(normalizePhone(c.phone || "")) ?? { count: 0, last: null };
    return { ...c, orders_count: ob.count, wins_count: winsByCustomer.get(c.id) ?? 0, last_order: ob.last };
  });
}

export async function deleteCustomer(id: string): Promise<void> {
  const db = supabaseAdmin();
  if (!db) {
    return withStoreLock(async () => {
      await localSaveCustomers((await localGetCustomers()).filter((c) => c.id !== id));
    });
  }
  const { error } = await db.from("customers").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

/** Réinitialise le mot de passe d'un client (super admin) — pas d'email requis. */
export async function setCustomerPassword(id: string, newPassword: string): Promise<void> {
  const db = supabaseAdmin();
  if (!db) {
    return withStoreLock(async () => {
      const all = await localGetCustomers();
      const idx = all.findIndex((c) => c.id === id);
      if (idx >= 0) {
        all[idx].password_hash = hashPassword(newPassword);
        await localSaveCustomers(all);
      }
    });
  }
  const { error } = await db.from("customers").update({ password_hash: hashPassword(newPassword) }).eq("id", id);
  if (error) throw new Error(error.message);
}
