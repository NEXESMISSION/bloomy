import { supabaseAdmin } from "@/lib/supabase";
import { listOrders } from "@/lib/data/orders";
import type { Order } from "@/lib/types";

/** Fiche client agrégée (CRM) construite à partir des commandes + comptes. */
export type Client = {
  phone: string;
  name: string;
  city: string;
  governorate: string;
  orders: number; // commandes non annulées
  spent: number; // total encaissé + à encaisser (hors annulées)
  collected: number; // commandes livrées
  pending: number; // à encaisser (confirmées/expédiées/nouvelles)
  lastOrder: string | null;
  sources: string[];
  hasAccount: boolean;
  orderList: Order[];
};

const digits = (p: string) => (p || "").replace(/\D/g, "");
const phoneKey = (p: string) => {
  const d = digits(p);
  return d.length > 8 ? d.slice(-8) : d;
};

export async function getClients(): Promise<Client[]> {
  const orders = await listOrders();
  const map = new Map<string, Client>();

  for (const o of orders) {
    const key = phoneKey(o.phone);
    if (!key) continue;
    let c = map.get(key);
    if (!c) {
      c = {
        phone: o.phone,
        name: o.customer_name,
        city: o.city,
        governorate: o.governorate,
        orders: 0,
        spent: 0,
        collected: 0,
        pending: 0,
        lastOrder: null,
        sources: [],
        hasAccount: false,
        orderList: [],
      };
      map.set(key, c);
    }
    c.orderList.push(o);
    if (o.status !== "annulee") {
      c.orders += 1;
      c.spent += Number(o.total);
      if (o.status === "livree") c.collected += Number(o.total);
      else c.pending += Number(o.total);
    }
    const src = (o.source && o.source.trim()) || (o.discount_code ? `Code ${o.discount_code}` : "");
    if (src && !c.sources.includes(src)) c.sources.push(src);
    // La commande la plus récente porte les coordonnées affichées.
    if (!c.lastOrder || o.created_at > c.lastOrder) {
      c.lastOrder = o.created_at;
      c.name = o.customer_name;
      c.city = o.city;
      c.governorate = o.governorate;
      c.phone = o.phone;
    }
  }

  // Fusionne les comptes clients (inscrits via la roulette).
  const db = supabaseAdmin();
  if (db) {
    const { data } = await db.from("customers").select("name, phone");
    for (const cust of data ?? []) {
      const key = phoneKey(cust.phone);
      if (!key) continue;
      const c = map.get(key);
      if (c) {
        c.hasAccount = true;
      } else {
        map.set(key, {
          phone: cust.phone,
          name: cust.name,
          city: "",
          governorate: "",
          orders: 0,
          spent: 0,
          collected: 0,
          pending: 0,
          lastOrder: null,
          sources: [],
          hasAccount: true,
          orderList: [],
        });
      }
    }
  }

  const clients = Array.from(map.values());
  clients.forEach((c) => c.orderList.sort((a, b) => (a.created_at < b.created_at ? 1 : -1)));
  clients.sort((a, b) => b.spent - a.spent || (b.lastOrder ?? "").localeCompare(a.lastOrder ?? ""));
  return clients;
}
