"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, X, Loader2 } from "lucide-react";
import type { RoulettePrize, RouletteWin } from "@/lib/types";
import { savePrize, removePrize, saveSettings } from "@/app/admin/actions";
import { formatDateFR, cn } from "@/lib/utils";

const BLANK: RoulettePrize = {
  id: "", label: "", type: "code", code: "", product_name: "", weight: 10,
  color: "#1f2937", active: true, sort_order: 0,
};

export default function RouletteAdmin({
  prizes,
  wins,
  enabled,
}: {
  prizes: RoulettePrize[];
  wins: RouletteWin[];
  enabled: boolean;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState<RoulettePrize | null>(null);
  const [pending, startTransition] = useTransition();
  const [on, setOn] = useState(enabled);

  const total = useMemo(
    () => prizes.filter((p) => p.active).reduce((s, p) => s + Math.max(0, p.weight), 0),
    [prizes],
  );

  const toggleEnabled = () =>
    startTransition(async () => {
      setOn(!on);
      await saveSettings({ roulette_enabled: !on });
      router.refresh();
    });

  const del = (p: RoulettePrize) => {
    if (!confirm(`Supprimer le lot « ${p.label} » ?`)) return;
    startTransition(async () => { await removePrize(p.id); router.refresh(); });
  };

  return (
    <div className="space-y-8">
      {/* activation */}
      <div className="flex items-center justify-between rounded-2xl border border-line bg-white p-5">
        <div>
          <p className="font-semibold text-ink">Roue de la chance</p>
          <p className="text-sm text-muted">Affiche la roulette aux visiteurs (popup à la 1ère visite + bouton flottant).</p>
        </div>
        <button onClick={toggleEnabled} disabled={pending} className={cn("relative h-7 w-12 rounded-full transition", on ? "bg-ink" : "bg-line")}>
          <span className={cn("absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all", on ? "left-[22px]" : "left-0.5")} />
        </button>
      </div>

      {/* lots */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold text-ink">Lots & probabilités</h2>
          <button onClick={() => setEditing({ ...BLANK })} className="btn-primary"><Plus className="h-4 w-4" /> Nouveau lot</button>
        </div>
        <div className="overflow-hidden rounded-2xl border border-line bg-white">
          <div className="divide-y divide-line">
            {prizes.map((p) => {
              const pct = total > 0 && p.active ? Math.round((p.weight / total) * 100) : 0;
              return (
                <div key={p.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                  <span className="h-5 w-5 shrink-0 rounded-full" style={{ background: p.color }} />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-ink">{p.label}</p>
                    <p className="text-xs text-muted">
                      {p.type === "code" ? `Code ${p.code}` : p.type === "product" ? `Cadeau : ${p.product_name}` : "Aucun lot"}
                      {!p.active && " · inactif"}
                    </p>
                  </div>
                  <div className="w-28 text-right">
                    <span className="font-semibold text-ink">{pct}%</span>
                    <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-sand">
                      <div className="h-full rounded-full bg-ink" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    <button onClick={() => setEditing(p)} className="grid h-8 w-8 place-items-center rounded-lg border border-line text-muted hover:text-ink"><Pencil className="h-4 w-4" /></button>
                    <button onClick={() => del(p)} disabled={pending} className="grid h-8 w-8 place-items-center rounded-lg border border-red-200 text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <p className="mt-2 text-xs text-muted">Le % de chaque lot = son poids ÷ somme des poids actifs (total : {total}).</p>
      </div>

      {/* gains */}
      <div>
        <h2 className="mb-3 font-semibold text-ink">Gagnants ({wins.length})</h2>
        {wins.length === 0 ? (
          <div className="rounded-2xl border border-line bg-white py-12 text-center text-muted">Aucun gain pour le moment.</div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-line bg-white">
            <div className="divide-y divide-line">
              {wins.map((w) => (
                <div key={w.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm">
                  <span className="font-medium text-ink">{w.prize_label}</span>
                  {w.code && <span className="rounded-full bg-sand px-2 py-0.5 text-xs text-muted">{w.code}</span>}
                  {w.phone ? <a href={`tel:${w.phone}`} className="text-ink">{w.phone}</a> : <span className="text-muted/60">non réclamé</span>}
                  <span className={cn("rounded-full px-2 py-0.5 text-xs", w.claimed ? "bg-green-100 text-green-700" : "bg-sand text-muted")}>
                    {w.claimed ? "Réclamé" : "En attente"}
                  </span>
                  <span className="text-xs text-muted">{formatDateFR(w.created_at)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {editing && (
        <PrizeModal
          prize={editing}
          pending={pending}
          onClose={() => setEditing(null)}
          onSave={(input) => startTransition(async () => { await savePrize(input); setEditing(null); router.refresh(); })}
        />
      )}
    </div>
  );
}

function PrizeModal({ prize, pending, onClose, onSave }: { prize: RoulettePrize; pending: boolean; onClose: () => void; onSave: (p: RoulettePrize) => void }) {
  const [form, setForm] = useState<RoulettePrize>(prize);
  const set = (patch: Partial<RoulettePrize>) => setForm((f) => ({ ...f, ...patch }));
  const isNew = !prize.id;

  return (
    <div className="fixed inset-0 z-[80] grid place-items-center p-4">
      <div className="absolute inset-0 bg-ink/40" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-3xl border border-line bg-white p-6 shadow-pop sm:p-8">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-ink">{isNew ? "Nouveau lot" : "Modifier le lot"}</h2>
          <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full border border-line text-muted hover:text-ink"><X className="h-5 w-5" /></button>
        </div>
        <div className="space-y-4">
          <L label="Libellé (affiché sur la roue)"><input className="input" value={form.label} onChange={(e) => set({ label: e.target.value })} placeholder="Ex : -10%" /></L>
          <L label="Type de lot">
            <select className="input" value={form.type} onChange={(e) => set({ type: e.target.value as any })}>
              <option value="code">Code promo</option>
              <option value="product">Cadeau / produit</option>
              <option value="none">Aucun (rejoue)</option>
            </select>
          </L>
          {form.type === "code" && (
            <L label="Code modèle (chaque gagnant reçoit un code UNIQUE à usage unique)">
              <input className="input uppercase" value={form.code ?? ""} onChange={(e) => set({ code: e.target.value.toUpperCase() })} placeholder="Ex : BLOOMY10" />
              <span className="mt-1 block text-xs text-muted">La remise de ce code est copiée. Le gagnant obtient un code dédié (max. 1 utilisation), pas ce code-ci.</span>
            </L>
          )}
          {form.type === "product" && <L label="Nom du cadeau"><input className="input" value={form.product_name ?? ""} onChange={(e) => set({ product_name: e.target.value })} placeholder="Ex : Parfum 50ml offert" /></L>}
          <div className="grid grid-cols-2 gap-4">
            <L label="Poids (probabilité)"><input type="number" className="input" value={form.weight} onChange={(e) => set({ weight: Number(e.target.value) })} /></L>
            <L label="Couleur">
              <div className="flex items-center gap-2">
                <input type="color" value={form.color} onChange={(e) => set({ color: e.target.value })} className="h-10 w-12 rounded-lg border border-line" />
                <input className="input" value={form.color} onChange={(e) => set({ color: e.target.value })} />
              </div>
            </L>
          </div>
          <L label="Ordre d'affichage"><input type="number" className="input" value={form.sort_order} onChange={(e) => set({ sort_order: Number(e.target.value) })} /></L>
          <button type="button" onClick={() => set({ active: !form.active })} className="flex items-center gap-2 text-sm text-ink">
            <span className={cn("relative h-6 w-11 rounded-full transition", form.active ? "bg-ink" : "bg-line")}>
              <span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all", form.active ? "left-[22px]" : "left-0.5")} />
            </span>
            Lot actif
          </button>
        </div>
        <div className="mt-7 flex justify-end gap-3">
          <button onClick={onClose} className="btn-outline">Annuler</button>
          <button onClick={() => onSave(form)} disabled={pending || !form.label.trim()} className="btn-primary">
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enregistrer"}
          </button>
        </div>
      </div>
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
