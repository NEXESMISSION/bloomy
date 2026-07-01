"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Loader2, Pencil, X, Phone, MapPin, ArrowRight } from "lucide-react";
import type { ShopWithPlacement, ShopInput, ShopStatus } from "@/lib/data/consignment";
import { saveShopAction, setShopStatusAction } from "@/app/admin/consignment-actions";
import { cn } from "@/lib/utils";

const STATUS: Record<ShopStatus, { label: string; cls: string }> = {
  active: { label: "Active", cls: "bg-green-100 text-green-700" },
  paused: { label: "En pause", cls: "bg-amber-100 text-amber-700" },
  removed: { label: "Retirée", cls: "bg-sand text-muted" },
};
const NEXT: Record<ShopStatus, ShopStatus> = { active: "paused", paused: "active", removed: "active" };

type Form = Partial<ShopInput>;

export default function ConsignmentShopsAdmin({ shops }: { shops: ShopWithPlacement[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState<Form | null>(null);

  const cycle = (s: ShopWithPlacement) =>
    startTransition(async () => { await setShopStatusAction(s.id, NEXT[s.status]); router.refresh(); });

  return (
    <div>
      <div className="mb-5 flex justify-end">
        <button onClick={() => setEditing({ name: "", status: "active" })} className="btn-primary"><Plus className="h-4 w-4" /> Nouvelle boutique</button>
      </div>

      {shops.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-white p-10 text-center text-sm text-muted">Aucune boutique. Ajoutez votre premier point de vente.</div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {shops.map((s) => {
            const st = STATUS[s.status];
            const pl = s.placement;
            return (
              <div key={s.id} className={cn("rounded-2xl border bg-white p-4", s.status === "removed" ? "border-line opacity-60" : "border-line")}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-ink">{s.name}</p>
                    {s.owner_name && <p className="truncate text-xs text-muted">{s.owner_name}</p>}
                  </div>
                  <button onClick={() => cycle(s)} disabled={pending} className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", st.cls)}>{st.label}</button>
                </div>
                <div className="mt-2 space-y-1 text-sm text-muted">
                  {s.phone && <p className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> {s.phone}</p>}
                  {(s.location || s.governorate) && <p className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {[s.governorate, s.location].filter(Boolean).join(" · ")}</p>}
                </div>
                <div className="mt-3 rounded-xl bg-sand px-3 py-2 text-sm">
                  {pl ? (
                    <span className="text-muted">{pl.display_code ?? "Display"} · <span className="font-semibold text-ink">{pl.total_current}</span>/{pl.total_full} flacons</span>
                  ) : (
                    <span className="text-muted">Aucun display posé</span>
                  )}
                </div>
                <div className="mt-3 flex gap-2">
                  <Link href={`/crm/depot/boutiques/${s.id}`} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-ink py-2 text-sm font-semibold text-white transition hover:bg-ink-80">
                    {pl ? "Compter / gérer" : "Poser un display"} <ArrowRight className="h-4 w-4" />
                  </Link>
                  <button onClick={() => setEditing({ ...s })} className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-line text-muted hover:text-ink"><Pencil className="h-4 w-4" /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {editing && (
        <Modal
          form={editing}
          pending={pending}
          onClose={() => setEditing(null)}
          onSave={(f) => startTransition(async () => {
            const res = await saveShopAction(f as ShopInput);
            if (res.ok) { setEditing(null); router.refresh(); } else alert(res.error);
          })}
        />
      )}
    </div>
  );
}

function Modal({ form, pending, onClose, onSave }: { form: Form; pending: boolean; onClose: () => void; onSave: (f: Form) => void }) {
  const [f, setF] = useState<Form>(form);
  const set = (patch: Form) => setF((x) => ({ ...x, ...patch }));
  return (
    <div className="fixed inset-0 z-[80] grid place-items-center p-4">
      <div className="absolute inset-0 bg-ink/40" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-3xl border border-line bg-white p-6 shadow-pop">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-ink">{f.id ? "Modifier la boutique" : "Nouvelle boutique"}</h2>
          <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full border border-line text-muted hover:text-ink"><X className="h-5 w-5" /></button>
        </div>
        <div className="space-y-3">
          <L label="Nom de la boutique"><input className="input" value={f.name ?? ""} onChange={(e) => set({ name: e.target.value })} placeholder="Beauty Center Ariana" /></L>
          <div className="grid grid-cols-2 gap-3">
            <L label="Propriétaire"><input className="input" value={f.owner_name ?? ""} onChange={(e) => set({ owner_name: e.target.value })} /></L>
            <L label="Téléphone"><input className="input" inputMode="tel" value={f.phone ?? ""} onChange={(e) => set({ phone: e.target.value })} /></L>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <L label="Gouvernorat"><input className="input" value={f.governorate ?? ""} onChange={(e) => set({ governorate: e.target.value })} placeholder="Ariana" /></L>
            <L label="Adresse / lieu"><input className="input" value={f.location ?? ""} onChange={(e) => set({ location: e.target.value })} /></L>
          </div>
          {f.id && (
            <L label="Statut">
              <select className="input" value={f.status ?? "active"} onChange={(e) => set({ status: e.target.value as ShopStatus })}>
                <option value="active">Active</option>
                <option value="paused">En pause</option>
                <option value="removed">Retirée</option>
              </select>
            </L>
          )}
          <L label="Notes"><input className="input" value={f.notes ?? ""} onChange={(e) => set({ notes: e.target.value })} /></L>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="btn-outline">Annuler</button>
          <button onClick={() => onSave(f)} disabled={pending || !f.name?.trim()} className="btn-primary">{pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enregistrer"}</button>
        </div>
      </div>
    </div>
  );
}

function L({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-1 block text-xs font-medium text-muted">{label}</span>{children}</label>;
}
