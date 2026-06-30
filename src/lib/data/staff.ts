import { supabaseAdmin } from "@/lib/supabase";
import { hashPassword, verifyPasswordHash } from "@/lib/customerAuth";

export type StaffRole = "owner" | "staff";
export type StaffMember = {
  id: string;
  created_at?: string;
  name: string;
  role: StaffRole;
  color: string;
  active: boolean;
};

const COLS = "id,created_at,name,role,color,active";

function map(r: any): StaffMember {
  return {
    id: r.id,
    created_at: r.created_at,
    name: r.name,
    role: r.role === "owner" ? "owner" : "staff",
    color: r.color ?? "#17171B",
    active: r.active ?? true,
  };
}

export async function listStaff(): Promise<StaffMember[]> {
  const db = supabaseAdmin();
  if (!db) return [];
  const { data } = await db.from("staff_members").select(COLS).order("created_at", { ascending: true });
  return (data ?? []).map(map);
}

export async function getStaffById(id: string): Promise<StaffMember | null> {
  const db = supabaseAdmin();
  if (!db) return null;
  const { data } = await db.from("staff_members").select(COLS).eq("id", id).eq("active", true).maybeSingle();
  return data ? map(data) : null;
}

export async function createStaff(input: { name: string; pin: string; role: StaffRole; color?: string }): Promise<StaffMember> {
  const db = supabaseAdmin();
  if (!db) throw new Error("Supabase requis pour l'équipe.");
  if (!input.name.trim()) throw new Error("Veuillez saisir un nom.");
  if (!/^\d{4,8}$/.test(input.pin)) throw new Error("Le PIN doit comporter 4 à 8 chiffres.");
  // Un PIN identifie une personne : il doit être unique parmi l'équipe active.
  const { data: actives } = await db.from("staff_members").select("pin_hash").eq("active", true);
  for (const s of actives ?? []) if (verifyPasswordHash(input.pin, s.pin_hash)) throw new Error("Ce PIN est déjà utilisé.");
  const { data, error } = await db
    .from("staff_members")
    .insert({ name: input.name.trim(), pin_hash: hashPassword(input.pin), role: input.role, color: input.color ?? "#17171B", active: true })
    .select(COLS)
    .single();
  if (error) throw new Error(error.message);
  return map(data);
}

export async function updateStaff(
  id: string,
  patch: { name?: string; role?: StaffRole; color?: string; active?: boolean; pin?: string },
): Promise<void> {
  const db = supabaseAdmin();
  if (!db) return;
  const row: any = {};
  if (patch.name != null) row.name = patch.name.trim();
  if (patch.role != null) row.role = patch.role;
  if (patch.color != null) row.color = patch.color;
  if (patch.active != null) row.active = patch.active;
  if (patch.pin) {
    if (!/^\d{4,8}$/.test(patch.pin)) throw new Error("Le PIN doit comporter 4 à 8 chiffres.");
    row.pin_hash = hashPassword(patch.pin);
  }
  const { error } = await db.from("staff_members").update(row).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteStaff(id: string): Promise<void> {
  const db = supabaseAdmin();
  if (!db) return;
  await db.from("staff_members").delete().eq("id", id);
}

/** Authentifie par PIN : renvoie le membre actif correspondant, sinon null. */
export async function authenticateByPin(pin: string): Promise<StaffMember | null> {
  const db = supabaseAdmin();
  if (!db) return null;
  if (!/^\d{4,8}$/.test(pin)) return null;
  const { data } = await db.from("staff_members").select(`${COLS},pin_hash`).eq("active", true);
  for (const s of data ?? []) if (verifyPasswordHash(pin, (s as any).pin_hash)) return map(s);
  return null;
}
