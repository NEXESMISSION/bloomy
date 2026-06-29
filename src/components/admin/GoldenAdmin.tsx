"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Ticket, Plus, Loader2, QrCode, Power, Trash2, RefreshCw, Gift, ScanLine, CheckCircle2, Clock } from "lucide-react";
import type { GoldenBatchStats } from "@/lib/types";
import {
  createGoldenBatchAction,
  toggleGoldenBatchAction,
  removeGoldenBatchAction,
  processGoldenExpiriesAction,
} from "@/app/admin/actions";
import { cn } from "@/lib/utils";

export default function GoldenAdmin({ batches }: { batches: GoldenBatchStats[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState({ name: "", prize_label: "", ticket_count: 100, winner_count: 1, claim_days: 7 });
  const [creating, setCreating] = useState(false);

  const create = () => {
    if (!form.name.trim() || !form.prize_label.trim()) return;
    setCreating(true);
    startTransition(async () => {
      await createGoldenBatchAction(form);
      setCreating(false);
      setForm({ name: "", prize_label: "", ticket_count: 100, winner_count: 1, claim_days: 7 });
      router.refresh();
    });
  };

  return (
    <div className="space-y-8">
      {/* Création d'un lot */}
      <div className="rounded-2xl border border-line bg-white p-5 sm:p-6">
        <h2 className="flex items-center gap-2 font-semibold text-ink">
          <Plus className="h-4 w-4" /> Nouvel événement
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <L label="Nom de l'événement">
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex : Ramadan 2026" />
          </L>
          <L label="Lot à gagner">
            <input className="input" value={form.prize_label} onChange={(e) => setForm({ ...form, prize_label: e.target.value })} placeholder="Ex : 100 DT, Parfum offert…" />
          </L>
          <L label="Nombre de QR codes">
            <input type="number" min={1} max={5000} className="input" value={form.ticket_count} onChange={(e) => setForm({ ...form, ticket_count: Number(e.target.value) })} />
          </L>
          <L label="Nombre de gagnants">
            <input type="number" min={1} className="input" value={form.winner_count} onChange={(e) => setForm({ ...form, winner_count: Number(e.target.value) })} />
          </L>
          <L label="Délai de réclamation (jours)">
            <input type="number" min={1} max={60} className="input" value={form.claim_days} onChange={(e) => setForm({ ...form, claim_days: Number(e.target.value) })} />
          </L>
          <div className="flex items-end">
            <button onClick={create} disabled={pending || creating || !form.name.trim() || !form.prize_label.trim()} className="btn-primary w-full">
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Ticket className="h-4 w-4" />}
              Générer les QR codes
            </button>
          </div>
        </div>
        <p className="mt-3 text-xs text-muted">
          Chaque QR code est unique et impossible à deviner. Après génération, imprimez-les puis distribuez-les.
        </p>
      </div>

      {/* Liste des lots */}
      {batches.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-white p-10 text-center text-sm text-muted">
          Aucun événement pour le moment.
        </div>
      ) : (
        <div className="space-y-4">
          {batches.map((b) => (
            <div key={b.id} className={cn("rounded-2xl border bg-white p-5", b.active ? "border-line" : "border-line opacity-70")}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-ink">{b.name}</h3>
                    {!b.active && <span className="rounded-full bg-sand px-2 py-0.5 text-[11px] font-medium text-muted">Terminé</span>}
                  </div>
                  <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted">
                    <Gift className="h-3.5 w-3.5" /> {b.prize_label} · {b.winner_count} gagnant(s) · {b.claim_days} j pour réclamer
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Link href={`/admin/golden/${b.id}/print`} target="_blank" className="btn-outline px-3 py-2 text-sm">
                    <QrCode className="h-4 w-4" /> QR codes
                  </Link>
                  <button onClick={() => startTransition(async () => { await processGoldenExpiriesAction(b.id); router.refresh(); })} disabled={pending} className="grid h-9 w-9 place-items-center rounded-lg border border-line text-muted hover:text-ink" title="Traiter les expirations">
                    <RefreshCw className="h-4 w-4" />
                  </button>
                  <button onClick={() => startTransition(async () => { await toggleGoldenBatchAction(b.id, !b.active); router.refresh(); })} disabled={pending} className="grid h-9 w-9 place-items-center rounded-lg border border-line text-muted hover:text-ink" title={b.active ? "Terminer l'événement" : "Réactiver"}>
                    <Power className="h-4 w-4" />
                  </button>
                  <button onClick={() => { if (confirm(`Supprimer « ${b.name} » et tous ses QR codes ?`)) startTransition(async () => { await removeGoldenBatchAction(b.id); router.refresh(); }); }} disabled={pending} className="grid h-9 w-9 place-items-center rounded-lg border border-red-200 text-red-600 hover:bg-red-50" title="Supprimer">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Stat icon={Ticket} label="QR codes" value={b.ticket_count} />
                <Stat icon={ScanLine} label="Scannés" value={b.scanned} />
                <Stat icon={CheckCircle2} label="Réclamés" value={b.claimed} />
                <Stat icon={Clock} label="Gains actifs" value={b.active_wins} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function L({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-muted">{label}</span>
      {children}
    </label>
  );
}

function Stat({ icon: Icon, label, value }: { icon: any; label: string; value: number }) {
  return (
    <div className="rounded-xl bg-sand px-3 py-2.5">
      <Icon className="h-4 w-4 text-muted" strokeWidth={1.6} />
      <p className="mt-1 text-lg font-semibold text-ink">{value}</p>
      <p className="text-xs text-muted">{label}</p>
    </div>
  );
}
