"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, X, Loader2, Tag, Users, Phone, Infinity as InfinityIcon } from "lucide-react";
import type { DiscountCode, Order } from "@/lib/types";
import { saveCode, removeCode } from "@/app/admin/actions";
import { formatTND, formatDateFR, cn } from "@/lib/utils";

const BLANK: DiscountCode = {
  id: "", code: "", type: "percent", value: 10, max_uses: null, used_count: 0,
  min_subtotal: 0, source: "", active: true, expires_at: null,
};

export default function CodesAdmin({ codes, orders }: { codes: DiscountCode[]; orders: Order[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<DiscountCode | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const redeemersByCode = useMemo(() => {
    const m = new Map<string, Order[]>();
    for (const o of orders) {
      if (!o.discount_code) continue;
      const k = o.discount_code.toUpperCase();
      m.set(k, [...(m.get(k) ?? []), o]);
    }
    return m;
  }, [orders]);

  const del = (c: DiscountCode) => {
    if (!confirm(`Supprimer le code ${c.code} ?`)) return;
    startTransition(async () => { await removeCode(c.id); router.refresh(); });
  };
  const toggleActive = (c: DiscountCode) =>
    startTransition(async () => { await saveCode({ ...c, active: !c.active }); router.refresh(); });

  return (
    <div>
      <div className="mb-5 flex justify-end">
        <button onClick={() => setEditing({ ...BLANK })} className="btn-primary"><Plus className="h-4 w-4" /> Nouveau code</button>
      </div>

      {codes.length === 0 ? (
        <div className="rounded-2xl border border-line bg-white py-16 text-center text-muted">Aucun code promo.</div>
      ) : (
        <div className="space-y-2.5">
          {codes.map((c) => {
            const redeemers = redeemersByCode.get(c.code.toUpperCase()) ?? [];
            const isOpen = expanded === c.id;
            const pct = c.max_uses ? Math.min(100, (c.used_count / c.max_uses) * 100) : 0;
            return (
              <div key={c.id} className={cn("overflow-hidden rounded-2xl border bg-white", isOpen ? "border-ink/30" : "border-line")}>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-3 p-4">
                  <div className="flex items-center gap-2">
                    <span className="grid h-9 w-9 place-items-center rounded-xl bg-sand text-ink"><Tag className="h-4 w-4" /></span>
                    <div>
                      <p className="font-semibold tracking-wide text-ink">{c.code}</p>
                      <p className="text-xs text-muted">
                        {c.type === "percent" ? `−${c.value}%` : `−${formatTND(c.value)}`}
                        {c.min_subtotal > 0 && ` · min ${formatTND(c.min_subtotal)}`}
                      </p>
                    </div>
                  </div>
                  {c.source && <span className="rounded-full bg-sand px-2.5 py-1 text-xs text-muted">{c.source}</span>}

                  <div className="ml-auto flex items-center gap-4">
                    <div className="min-w-[110px] text-right">
                      <p className="flex items-center justify-end gap-1 text-sm font-semibold text-ink">
                        {c.used_count}<span className="text-muted">/</span>
                        {c.max_uses != null ? c.max_uses : <InfinityIcon className="h-3.5 w-3.5 text-muted" />}
                      </p>
                      {c.max_uses != null && (
                        <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-sand">
                          <div className="h-full rounded-full bg-ink" style={{ width: `${pct}%` }} />
                        </div>
                      )}
                    </div>
                    <button onClick={() => toggleActive(c)} disabled={pending} className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", c.active ? "bg-green-100 text-green-700" : "bg-sand text-muted")}>
                      {c.active ? "Actif" : "Inactif"}
                    </button>
                    <div className="flex gap-1.5">
                      <button onClick={() => setExpanded(isOpen ? null : c.id)} className="grid h-8 w-8 place-items-center rounded-lg border border-line text-muted hover:text-ink" title="Qui a utilisé"><Users className="h-4 w-4" /></button>
                      <button onClick={() => setEditing(c)} className="grid h-8 w-8 place-items-center rounded-lg border border-line text-muted hover:text-ink"><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => del(c)} disabled={pending} className="grid h-8 w-8 place-items-center rounded-lg border border-red-200 text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </div>
                </div>

                {isOpen && (
                  <div className="border-t border-line bg-sand px-4 py-4">
                    <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
                      <Users className="h-3.5 w-3.5" /> {redeemers.length} utilisation{redeemers.length !== 1 ? "s" : ""}
                    </p>
                    {redeemers.length === 0 ? (
                      <p className="text-sm text-muted">Personne n'a encore utilisé ce code.</p>
                    ) : (
                      <div className="space-y-1.5">
                        {redeemers.map((o) => (
                          <div key={o.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-white px-3 py-2 text-sm">
                            <span className="font-medium text-ink">{o.customer_name}</span>
                            <a href={`tel:${o.phone}`} className="flex items-center gap-1 text-ink"><Phone className="h-3.5 w-3.5" /> {o.phone}</a>
                            <span className="text-muted">{[o.city, o.governorate].filter(Boolean).join(", ")}</span>
                            <span className="text-muted">{formatDateFR(o.created_at)}</span>
                            <span className="font-semibold text-ink">{formatTND(o.total)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {editing && (
        <CodeModal code={editing} pending={pending} onClose={() => setEditing(null)}
          onSave={(input) => startTransition(async () => { await saveCode(input); setEditing(null); router.refresh(); })} />
      )}
    </div>
  );
}

function CodeModal({ code, pending, onClose, onSave }: { code: DiscountCode; pending: boolean; onClose: () => void; onSave: (c: DiscountCode) => void; }) {
  const [form, setForm] = useState<DiscountCode>(code);
  const isNew = !code.id;
  const set = (patch: Partial<DiscountCode>) => setForm((f) => ({ ...f, ...patch }));
  const expiresLocal = form.expires_at ? form.expires_at.slice(0, 16) : "";

  return (
    <div className="fixed inset-0 z-[80] grid place-items-center p-4">
      <div className="absolute inset-0 bg-ink/40" onClick={onClose} />
      <div className="relative w-full max-w-lg overflow-y-auto rounded-3xl border border-line bg-white p-6 shadow-pop sm:p-8">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-ink">{isNew ? "Nouveau code promo" : `Modifier ${code.code}`}</h2>
          <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full border border-line text-muted hover:text-ink"><X className="h-5 w-5" /></button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <L label="Code" full><input className="input uppercase tracking-wide" value={form.code} onChange={(e) => set({ code: e.target.value.toUpperCase() })} placeholder="Ex : INSTA15" /></L>
          <L label="Type de réduction">
            <select className="input" value={form.type} onChange={(e) => set({ type: e.target.value as any })}>
              <option value="percent">Pourcentage (%)</option>
              <option value="fixed">Montant fixe (DT)</option>
            </select>
          </L>
          <L label={form.type === "percent" ? "Valeur (%)" : "Valeur (DT)"}><input type="number" step="0.001" className="input" value={form.value} onChange={(e) => set({ value: Number(e.target.value) })} /></L>
          <L label="Limite d'utilisations (vide = illimité)"><input type="number" className="input" value={form.max_uses ?? ""} onChange={(e) => set({ max_uses: e.target.value ? Number(e.target.value) : null })} placeholder="Illimité" /></L>
          <L label="Minimum d'achat (DT)"><input type="number" step="0.001" className="input" value={form.min_subtotal} onChange={(e) => set({ min_subtotal: Number(e.target.value) })} /></L>
          <L label="Source / provenance (suivi des leads)" full><input className="input" value={form.source} onChange={(e) => set({ source: e.target.value })} placeholder="Ex : Instagram, TikTok @influenceur…" /></L>
          <L label="Expiration (facultatif)" full><input type="datetime-local" className="input" value={expiresLocal} onChange={(e) => set({ expires_at: e.target.value ? new Date(e.target.value).toISOString() : null })} /></L>
        </div>

        <button type="button" onClick={() => set({ active: !form.active })} className="mt-4 flex items-center gap-2 text-sm text-ink">
          <span className={cn("relative h-6 w-11 rounded-full transition", form.active ? "bg-ink" : "bg-line")}>
            <span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all", form.active ? "left-[22px]" : "left-0.5")} />
          </span>
          Code actif
        </button>

        <div className="mt-7 flex justify-end gap-3">
          <button onClick={onClose} className="btn-outline">Annuler</button>
          <button onClick={() => onSave(form)} disabled={pending || !form.code.trim()} className="btn-primary">
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enregistrer"}
          </button>
        </div>
      </div>
    </div>
  );
}

function L({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <label className={cn("block", full && "sm:col-span-2")}>
      <span className="mb-1.5 block text-xs font-medium text-muted">{label}</span>
      {children}
    </label>
  );
}
