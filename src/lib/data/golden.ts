import { randomBytes } from "crypto";
import { supabaseAdmin } from "@/lib/supabase";
import type { GoldenBatch, GoldenBatchStats, GoldenTicket, GoldenPublicState } from "@/lib/types";

/* ─────────── helpers ─────────── */

/** Jeton secret non devinable (160 bits, base64url ≈ 27 caractères). */
function newToken(): string {
  return randomBytes(20).toString("base64url");
}

function mapBatch(r: any): GoldenBatch {
  return {
    id: r.id,
    created_at: r.created_at,
    name: r.name,
    prize_label: r.prize_label,
    ticket_count: Number(r.ticket_count ?? 0),
    winner_count: Number(r.winner_count ?? 1),
    claim_days: Number(r.claim_days ?? 7),
    active: r.active ?? true,
  };
}

function mapTicket(r: any): GoldenTicket {
  return {
    id: r.id,
    created_at: r.created_at,
    batch_id: r.batch_id,
    token: r.token,
    is_winner: !!r.is_winner,
    revealed: !!r.revealed,
    scanned_at: r.scanned_at ?? null,
    won_at: r.won_at ?? null,
    claim_deadline: r.claim_deadline ?? null,
    claimed: !!r.claimed,
    claimed_at: r.claimed_at ?? null,
    claimer_name: r.claimer_name ?? null,
    claimer_phone: r.claimer_phone ?? null,
    expired: !!r.expired,
  };
}

/* ─────────── admin : création & lecture ─────────── */

export async function createGoldenBatch(input: {
  name: string;
  prize_label: string;
  ticket_count: number;
  winner_count: number;
  claim_days: number;
}): Promise<GoldenBatch> {
  const db = supabaseAdmin();
  if (!db) throw new Error("Supabase requis pour les Golden Tickets.");

  const count = Math.max(1, Math.min(5000, Math.floor(input.ticket_count)));
  const winners = Math.max(1, Math.min(count, Math.floor(input.winner_count)));
  const claimDays = Math.max(1, Math.min(60, Math.floor(input.claim_days)));

  const { data: batchRow, error: bErr } = await db
    .from("golden_batches")
    .insert({
      name: input.name.trim() || "Golden Ticket",
      prize_label: input.prize_label.trim() || "Cadeau",
      ticket_count: count,
      winner_count: winners,
      claim_days: claimDays,
      active: true,
    })
    .select("*")
    .single();
  if (bErr || !batchRow) throw new Error(bErr?.message ?? "Création du lot impossible.");

  // Quels index sont gagnants (choisis aléatoirement, côté serveur).
  const winnerIdx = new Set<number>();
  while (winnerIdx.size < winners) winnerIdx.add(Math.floor(Math.random() * count));

  const rows = Array.from({ length: count }, (_, i) => ({
    batch_id: batchRow.id,
    token: newToken(),
    is_winner: winnerIdx.has(i),
  }));

  // Insertion par lots (évite des requêtes trop volumineuses).
  for (let i = 0; i < rows.length; i += 500) {
    const { error } = await db.from("golden_tickets").insert(rows.slice(i, i + 500));
    if (error) throw new Error(error.message);
  }

  return mapBatch(batchRow);
}

export async function listGoldenBatches(): Promise<GoldenBatchStats[]> {
  const db = supabaseAdmin();
  if (!db) return [];
  const { data: batches } = await db.from("golden_batches").select("*").order("created_at", { ascending: false });
  if (!batches?.length) return [];
  const { data: tickets } = await db
    .from("golden_tickets")
    .select("batch_id, revealed, claimed, is_winner, expired");
  const all = tickets ?? [];
  return batches.map((b: any) => {
    const t = all.filter((x: any) => x.batch_id === b.id);
    return {
      ...mapBatch(b),
      scanned: t.filter((x: any) => x.revealed).length,
      claimed: t.filter((x: any) => x.claimed).length,
      active_wins: t.filter((x: any) => x.is_winner && !x.expired).length,
      expired: t.filter((x: any) => x.expired).length,
    };
  });
}

export async function getGoldenBatch(id: string): Promise<GoldenBatch | null> {
  const db = supabaseAdmin();
  if (!db) return null;
  const { data } = await db.from("golden_batches").select("*").eq("id", id).maybeSingle();
  return data ? mapBatch(data) : null;
}

export async function getGoldenTickets(batchId: string): Promise<GoldenTicket[]> {
  const db = supabaseAdmin();
  if (!db) return [];
  const { data } = await db
    .from("golden_tickets")
    .select("*")
    .eq("batch_id", batchId)
    .order("created_at", { ascending: true });
  return (data ?? []).map(mapTicket);
}

export async function setGoldenBatchActive(id: string, active: boolean): Promise<void> {
  const db = supabaseAdmin();
  if (!db) return;
  await db.from("golden_batches").update({ active }).eq("id", id);
}

export async function deleteGoldenBatch(id: string): Promise<void> {
  const db = supabaseAdmin();
  if (!db) return;
  await db.from("golden_batches").delete().eq("id", id); // cascade supprime les tickets
}

/* ─────────── expiration & réattribution ─────────── */

/**
 * Tout gain révélé mais non réclamé après le délai est perdu, puis réattribué
 * à un ticket encore NON utilisé (non scanné) du même lot, choisi au hasard.
 * Idempotent ; exécuté paresseusement à chaque scan + à l'ouverture de l'admin.
 */
export async function processGoldenExpiries(batchId: string): Promise<number> {
  const db = supabaseAdmin();
  if (!db) return 0;
  const nowIso = new Date().toISOString();

  const { data: expiredRows } = await db
    .from("golden_tickets")
    .select("id")
    .eq("batch_id", batchId)
    .eq("is_winner", true)
    .eq("revealed", true)
    .eq("claimed", false)
    .eq("expired", false)
    .lt("claim_deadline", nowIso);

  const expired = expiredRows ?? [];
  for (const row of expired) {
    // Marque le gain comme perdu.
    await db.from("golden_tickets").update({ is_winner: false, expired: true }).eq("id", row.id);

    // Réattribue à un ticket non utilisé, au hasard.
    const { data: pool } = await db
      .from("golden_tickets")
      .select("id")
      .eq("batch_id", batchId)
      .eq("revealed", false)
      .eq("is_winner", false)
      .eq("expired", false);
    if (pool && pool.length) {
      const pick = pool[Math.floor(Math.random() * pool.length)];
      await db.from("golden_tickets").update({ is_winner: true }).eq("id", pick.id);
    }
  }
  return expired.length;
}

/* ─────────── public : révélation & réclamation (sécurisé) ─────────── */

async function fetchByToken(token: string) {
  const db = supabaseAdmin();
  if (!db) return null;
  const { data: ticket } = await db.from("golden_tickets").select("*").eq("token", token).maybeSingle();
  if (!ticket) return null;
  const { data: batch } = await db.from("golden_batches").select("*").eq("id", ticket.batch_id).maybeSingle();
  if (!batch) return null;
  return { ticket: mapTicket(ticket), batch: mapBatch(batch) };
}

function publicStateOf(ticket: GoldenTicket, batch: GoldenBatch): GoldenPublicState {
  if (!batch.active) return { status: "ended" };
  if (!ticket.revealed) return { status: "unrevealed", prizeLabel: batch.prize_label };
  if (ticket.expired) return { status: "expired" };
  if (!ticket.is_winner) return { status: "loser" };
  return { status: "winner", prizeLabel: batch.prize_label, deadline: ticket.claim_deadline, claimed: ticket.claimed };
}

/** État affichable au chargement de la page (NE révèle jamais le gain). */
export async function getGoldenPublicState(token: string): Promise<GoldenPublicState> {
  const found = await fetchByToken(token);
  if (!found) return { status: "invalid" };
  await processGoldenExpiries(found.batch.id).catch(() => {});
  const refreshed = await fetchByToken(token);
  if (!refreshed) return { status: "invalid" };
  return publicStateOf(refreshed.ticket, refreshed.batch);
}

export type RevealResult =
  | { ok: false; reason: GoldenPublicState["status"] }
  | { ok: true; winner: boolean; prizeLabel: string; deadline: string | null };

/** Révélation ATOMIQUE : seul le premier scan révèle ; aucune fuite avant clic. */
export async function revealGoldenTicket(token: string): Promise<RevealResult> {
  const db = supabaseAdmin();
  if (!db) return { ok: false, reason: "invalid" };

  const found = await fetchByToken(token);
  if (!found) return { ok: false, reason: "invalid" };
  if (!found.batch.active) return { ok: false, reason: "ended" };

  await processGoldenExpiries(found.batch.id).catch(() => {});

  // Déjà révélé ? On renvoie l'état stocké (pas de re-révélation).
  const current = await fetchByToken(token);
  if (!current) return { ok: false, reason: "invalid" };
  if (current.ticket.revealed) {
    const st = publicStateOf(current.ticket, current.batch);
    if (st.status === "winner") return { ok: true, winner: true, prizeLabel: st.prizeLabel, deadline: st.deadline };
    if (st.status === "loser") return { ok: true, winner: false, prizeLabel: current.batch.prize_label, deadline: null };
    return { ok: false, reason: st.status };
  }

  const isWinner = current.ticket.is_winner;
  const nowIso = new Date().toISOString();
  const update: any = { revealed: true, scanned_at: nowIso };
  if (isWinner) {
    update.won_at = nowIso;
    update.claim_deadline = new Date(Date.now() + current.batch.claim_days * 86400000).toISOString();
  }

  // Conditionnel `revealed=false` → garantit une seule révélation (anti-course).
  const { data: updated } = await db
    .from("golden_tickets")
    .update(update)
    .eq("token", token)
    .eq("revealed", false)
    .select("*");

  if (!updated || updated.length === 0) {
    // Un autre scan a gagné la course : renvoyer l'état désormais stocké.
    const after = await fetchByToken(token);
    if (after?.ticket.revealed) {
      const st = publicStateOf(after.ticket, after.batch);
      if (st.status === "winner") return { ok: true, winner: true, prizeLabel: st.prizeLabel, deadline: st.deadline };
      if (st.status === "loser") return { ok: true, winner: false, prizeLabel: after.batch.prize_label, deadline: null };
      return { ok: false, reason: st.status };
    }
    return { ok: false, reason: "invalid" };
  }

  const row = mapTicket(updated[0]);
  return { ok: true, winner: row.is_winner, prizeLabel: current.batch.prize_label, deadline: row.claim_deadline };
}

export type ClaimResult = { ok: true; prizeLabel: string } | { ok: false; error: string };

/** Réclamation ATOMIQUE : impossible de réclamer deux fois ou hors délai. */
export async function claimGoldenTicket(token: string, name: string, phone: string): Promise<ClaimResult> {
  const db = supabaseAdmin();
  if (!db) return { ok: false, error: "Service indisponible." };

  const cleanName = (name || "").trim();
  const cleanPhone = (phone || "").replace(/[\s.\-]/g, "");
  if (cleanName.length < 2) return { ok: false, error: "Veuillez saisir votre nom." };
  if (!/^(\+?216)?[0-9]{8}$/.test(cleanPhone)) return { ok: false, error: "Numéro de téléphone invalide (8 chiffres)." };

  const found = await fetchByToken(token);
  if (!found) return { ok: false, error: "Ticket invalide." };
  if (!found.batch.active) return { ok: false, error: "Cet événement est terminé." };

  const nowIso = new Date().toISOString();
  const { data: updated } = await db
    .from("golden_tickets")
    .update({ claimed: true, claimed_at: nowIso, claimer_name: cleanName, claimer_phone: cleanPhone })
    .eq("token", token)
    .eq("is_winner", true)
    .eq("revealed", true)
    .eq("claimed", false)
    .gt("claim_deadline", nowIso)
    .select("*");

  if (updated && updated.length) return { ok: true, prizeLabel: found.batch.prize_label };

  // Échec → diagnostiquer la raison.
  const after = await fetchByToken(token);
  if (!after) return { ok: false, error: "Ticket invalide." };
  if (after.ticket.claimed) return { ok: false, error: "Ce lot a déjà été réclamé." };
  if (!after.ticket.is_winner || after.ticket.expired) return { ok: false, error: "Le délai de réclamation est dépassé." };
  return { ok: false, error: "Réclamation impossible." };
}
