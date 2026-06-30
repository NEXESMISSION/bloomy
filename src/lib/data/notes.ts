import { supabaseAdmin } from "@/lib/supabase";

export type Note = {
  id: string;
  created_at: string;
  entity_type: string; // 'client' | 'sale' | 'general'
  entity_id: string | null;
  body: string;
  author_id: string | null;
  author_name: string | null;
};

export async function listNotes(entityType: string, entityId?: string | null): Promise<Note[]> {
  const db = supabaseAdmin();
  if (!db) return [];
  let q = db.from("notes").select("*").eq("entity_type", entityType).order("created_at", { ascending: false });
  if (entityId !== undefined) {
    q = entityId === null ? q.is("entity_id", null) : q.eq("entity_id", entityId);
  }
  const { data } = await q;
  return (data ?? []) as Note[];
}

export async function addNote(input: {
  entity_type: string;
  entity_id: string | null;
  body: string;
  author_id?: string | null;
  author_name?: string | null;
}): Promise<Note> {
  const db = supabaseAdmin();
  if (!db) throw new Error("Supabase requis.");
  if (!input.body.trim()) throw new Error("Note vide.");
  const { data, error } = await db
    .from("notes")
    .insert({
      entity_type: input.entity_type,
      entity_id: input.entity_id,
      body: input.body.trim(),
      author_id: input.author_id ?? null,
      author_name: input.author_name ?? null,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data as Note;
}

export async function deleteNote(id: string): Promise<void> {
  const db = supabaseAdmin();
  if (!db) return;
  await db.from("notes").delete().eq("id", id);
}
