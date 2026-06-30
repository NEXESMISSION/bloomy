import { supabaseAdmin } from "@/lib/supabase";

export type ContactMessage = {
  id: string;
  created_at: string;
  name: string;
  phone: string;
  email: string | null;
  message: string;
  handled: boolean;
};

function map(r: any): ContactMessage {
  return {
    id: r.id,
    created_at: r.created_at,
    name: r.name,
    phone: r.phone,
    email: r.email ?? null,
    message: r.message,
    handled: !!r.handled,
  };
}

export async function createContactMessage(input: {
  name: string;
  phone: string;
  email?: string | null;
  message: string;
}): Promise<void> {
  const db = supabaseAdmin();
  if (!db) return; // mode démo : pas de persistance
  const { error } = await db.from("contact_messages").insert({
    name: input.name.trim().slice(0, 80),
    phone: input.phone.trim().slice(0, 30),
    email: input.email?.trim() ? input.email.trim().slice(0, 120) : null,
    message: input.message.trim().slice(0, 2000),
  });
  if (error) throw new Error(error.message);
}

export async function listContactMessages(): Promise<ContactMessage[]> {
  const db = supabaseAdmin();
  if (!db) return [];
  const { data } = await db.from("contact_messages").select("*").order("created_at", { ascending: false }).limit(500);
  return (data ?? []).map(map);
}

export async function setContactHandled(id: string, handled: boolean): Promise<void> {
  const db = supabaseAdmin();
  if (!db) return;
  const { error } = await db.from("contact_messages").update({ handled }).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteContactMessage(id: string): Promise<void> {
  const db = supabaseAdmin();
  if (!db) return;
  const { error } = await db.from("contact_messages").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
