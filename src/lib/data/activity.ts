import { supabaseAdmin } from "@/lib/supabase";

export type Activity = {
  id: string;
  created_at: string;
  actor_id: string | null;
  actor_name: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  detail: string | null;
};

/** Enregistre « qui a fait quoi ». Best-effort (n'interrompt jamais l'action). */
export async function logActivity(a: {
  actorId?: string | null;
  actorName?: string | null;
  action: string;
  entityType?: string;
  entityId?: string | null;
  detail?: string;
}): Promise<void> {
  const db = supabaseAdmin();
  if (!db) return;
  try {
    await db.from("activity_log").insert({
      // "owner" n'est pas un uuid d'équipe → actor_id null, mais on garde le nom.
      actor_id: a.actorId && a.actorId !== "owner" ? a.actorId : null,
      actor_name: a.actorName ?? null,
      action: a.action,
      entity_type: a.entityType ?? null,
      entity_id: a.entityId ?? null,
      detail: a.detail ?? null,
    });
  } catch {
    /* le journal ne doit jamais bloquer une opération */
  }
}

export async function listActivity(limit = 200): Promise<Activity[]> {
  const db = supabaseAdmin();
  if (!db) return [];
  const { data } = await db.from("activity_log").select("*").order("created_at", { ascending: false }).limit(limit);
  return (data ?? []) as Activity[];
}
