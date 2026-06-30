import { supabaseAdmin } from "@/lib/supabase";

export type RestockStatus = "a_faire" | "en_cours" | "fait";
export type RestockRequest = {
  id: string;
  created_at: string;
  product_id: string | null;
  product_name: string;
  quantity: number;
  status: RestockStatus;
  note: string | null;
  requested_by: string | null;
  done_at: string | null;
};

function map(r: any): RestockRequest {
  return {
    id: r.id,
    created_at: r.created_at,
    product_id: r.product_id ?? null,
    product_name: r.product_name,
    quantity: Number(r.quantity ?? 0),
    status: r.status === "fait" ? "fait" : r.status === "en_cours" ? "en_cours" : "a_faire",
    note: r.note ?? null,
    requested_by: r.requested_by ?? null,
    done_at: r.done_at ?? null,
  };
}

export async function listRestock(): Promise<RestockRequest[]> {
  const db = supabaseAdmin();
  if (!db) return [];
  const { data } = await db.from("restock_requests").select("*").order("created_at", { ascending: false });
  return (data ?? []).map(map);
}

export async function createRestock(input: {
  product_id: string | null;
  product_name: string;
  quantity: number;
  note?: string;
  actorId?: string | null;
}): Promise<RestockRequest> {
  const db = supabaseAdmin();
  if (!db) throw new Error("Supabase requis.");
  if (!input.product_name.trim()) throw new Error("Indiquez le produit.");
  const { data, error } = await db
    .from("restock_requests")
    .insert({
      product_id: input.product_id,
      product_name: input.product_name.trim(),
      quantity: Math.max(0, Math.floor(Number(input.quantity) || 0)),
      status: "a_faire",
      note: input.note ?? null,
      requested_by: input.actorId ?? null,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return map(data);
}

/** Change le statut. Quand "fait", on réapprovisionne le stock du produit. */
export async function setRestockStatus(id: string, status: RestockStatus): Promise<void> {
  const db = supabaseAdmin();
  if (!db) return;
  const { data: req } = await db.from("restock_requests").select("*").eq("id", id).maybeSingle();
  if (!req) return;
  const becomingDone = status === "fait" && req.status !== "fait";
  await db
    .from("restock_requests")
    .update({ status, done_at: status === "fait" ? new Date().toISOString() : null })
    .eq("id", id);
  if (becomingDone && req.product_id && Number(req.quantity) > 0) {
    // Réapprovisionnement ATOMIQUE (évite la perte d'incrément concurrente).
    await db.rpc("adjust_stock", { p_id: req.product_id, p_delta: Math.abs(Number(req.quantity)) });
  }
}

export async function deleteRestock(id: string): Promise<void> {
  const db = supabaseAdmin();
  if (!db) return;
  await db.from("restock_requests").delete().eq("id", id);
}
