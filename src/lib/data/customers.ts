import { supabaseAdmin } from "@/lib/supabase";
import { localGetCustomers, localSaveCustomers, withStoreLock } from "@/lib/data/localStore";
import { hashPassword, verifyPasswordHash, normalizePhone } from "@/lib/customerAuth";
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
      if (all.some((c) => c.phone === phone)) throw new Error("Ce numéro a déjà un compte.");
      const created = { id: crypto.randomUUID(), created_at: new Date().toISOString(), ...row };
      all.push(created);
      await localSaveCustomers(all);
      return publicCustomer(created);
    });
  }
  const exists = await db.from("customers").select("id").eq("phone", phone).maybeSingle();
  if (exists.data) throw new Error("Ce numéro a déjà un compte.");
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
