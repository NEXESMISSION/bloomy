"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Plus, Loader2, X, Trash2, PackageX, Boxes, ClipboardList, Check, Hammer } from "lucide-react";
import type { Product } from "@/lib/types";
import type { RestockRequest, RestockStatus } from "@/lib/data/restock";
import { createRestockAction, setRestockStatusAction, removeRestockAction } from "@/app/admin/backoffice-actions";
import { formatDateFR, cn } from "@/lib/utils";

const LOW = 5;
const COLS: { key: RestockStatus; label: string; icon: any }[] = [
  { key: "a_faire", label: "À préparer", icon: ClipboardList },
  { key: "en_cours", label: "En cours", icon: Hammer },
  { key: "fait", label: "Terminé", icon: Check },
];

export default function StockAdmin({ products, restock, staffById }: { products: Product[]; restock: RestockRequest[]; staffById: Record<string, string> }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [adding, setAdding] = useState<{ product_id: string | null; product_name: string } | null>(null);

  const lowCount = products.filter((p) => p.stock <= LOW).length;

  const move = (id: string, status: RestockStatus) => start(async () => { await setRestockStatusAction(id, status); router.refresh(); });
  const del = (id: string) => start(async () => { await removeRestockAction(id); router.refresh(); });

  return (
    <div className="space-y-8">
      {/* Réappro — demandes à l'équipe */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold text-ink">Réapprovisionnement</h2>
          <button onClick={() => setAdding({ product_id: null, product_name: "" })} className="btn-primary px-4 py-2 text-sm"><Plus className="h-4 w-4" /> Demander un réappro</button>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {COLS.map((col) => {
            const items = restock.filter((r) => r.status === col.key);
            return (
              <div key={col.key} className="rounded-2xl border border-line bg-white">
                <div className="flex items-center gap-2 border-b border-line px-4 py-3 text-sm font-semibold text-ink">
                  <col.icon className="h-4 w-4 text-muted" /> {col.label} <span className="ml-auto text-muted">{items.length}</span>
                </div>
                <div className="space-y-2 p-3">
                  {items.length === 0 ? (
                    <p className="py-4 text-center text-xs text-muted">—</p>
                  ) : (
                    items.map((r) => (
                      <div key={r.id} className="rounded-xl border border-line p-3">
                        <p className="text-sm font-medium text-ink">{r.product_name} {r.quantity > 0 && <span className="text-muted">×{r.quantity}</span>}</p>
                        {r.note && <p className="mt-0.5 text-xs text-muted">{r.note}</p>}
                        <p className="mt-1 text-[11px] text-muted">{r.requested_by ? staffById[r.requested_by] ?? "Équipe" : "Propriétaire"} · {formatDateFR(r.created_at)}</p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {col.key !== "a_faire" && <button onClick={() => move(r.id, "a_faire")} className="rounded-md border border-line px-2 py-1 text-[11px] text-muted hover:text-ink">À préparer</button>}
                          {col.key !== "en_cours" && <button onClick={() => move(r.id, "en_cours")} className="rounded-md border border-line px-2 py-1 text-[11px] text-muted hover:text-ink">En cours</button>}
                          {col.key !== "fait" && <button onClick={() => move(r.id, "fait")} className="rounded-md bg-ink px-2 py-1 text-[11px] font-medium text-white">Terminé (+stock)</button>}
                          <button onClick={() => del(r.id)} className="ml-auto text-red-500 hover:text-red-700"><Trash2 className="h-3.5 w-3.5" /></button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Stock produits */}
      <section>
        <div className="mb-3 flex items-center gap-2">
          <Boxes className="h-5 w-5 text-muted" />
          <h2 className="font-semibold text-ink">Stock</h2>
          {lowCount > 0 && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">{lowCount} en stock faible</span>}
        </div>
        <div className="overflow-hidden rounded-2xl border border-line bg-white">
          <div className="divide-y divide-line">
            {products.map((p) => {
              const low = p.stock <= LOW;
              return (
                <div key={p.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="relative h-10 w-9 shrink-0 overflow-hidden rounded-lg bg-surface">
                    <Image src={p.image} alt={p.name} fill className="object-contain" sizes="36px" />
                  </div>
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink">{p.name}</span>
                  <span className={cn("flex items-center gap-1 text-sm font-semibold", p.stock === 0 ? "text-red-600" : low ? "text-amber-600" : "text-ink")}>
                    {p.stock === 0 && <PackageX className="h-4 w-4" />}
                    {p.stock} u.
                  </span>
                  <button onClick={() => setAdding({ product_id: p.id, product_name: p.name })} className="rounded-lg border border-line px-2.5 py-1.5 text-xs text-muted hover:text-ink">Réappro</button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {adding && (
        <RestockModal init={adding} products={products} pending={pending} onClose={() => setAdding(null)} onSave={(input) => start(async () => { try { await createRestockAction(input); setAdding(null); router.refresh(); } catch (e: any) { alert(e?.message ?? "Erreur"); } })} />
      )}
    </div>
  );
}

function RestockModal({ init, products, pending, onClose, onSave }: { init: { product_id: string | null; product_name: string }; products: Product[]; pending: boolean; onClose: () => void; onSave: (input: { product_id: string | null; product_name: string; quantity: number; note: string }) => void }) {
  const [productId, setProductId] = useState(init.product_id ?? "");
  const [name, setName] = useState(init.product_name);
  const [quantity, setQuantity] = useState(10);
  const [note, setNote] = useState("");

  const pick = (pid: string) => {
    setProductId(pid);
    const p = products.find((x) => x.id === pid);
    if (p) setName(p.name);
  };

  return (
    <div className="fixed inset-0 z-[80] grid place-items-center p-4">
      <div className="absolute inset-0 bg-ink/40" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-3xl border border-line bg-white p-6 shadow-pop sm:p-8">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-ink">Demander un réappro</h2>
          <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full border border-line text-muted hover:text-ink"><X className="h-5 w-5" /></button>
        </div>
        <div className="space-y-4">
          <L label="Produit du catalogue">
            <select className="input" value={productId} onChange={(e) => pick(e.target.value)}>
              <option value="">Autre / hors catalogue…</option>
              {products.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.stock} en stock)</option>)}
            </select>
          </L>
          <L label="Nom du produit"><input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex : Sauvage 50ml" /></L>
          <L label="Quantité à préparer"><input type="number" className="input" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} /></L>
          <L label="Note pour l'équipe (optionnel)"><input className="input" value={note} onChange={(e) => setNote(e.target.value)} /></L>
        </div>
        <div className="mt-7 flex justify-end gap-3">
          <button onClick={onClose} className="btn-outline">Annuler</button>
          <button onClick={() => onSave({ product_id: productId || null, product_name: name, quantity, note })} disabled={pending || !name.trim()} className="btn-primary">{pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Demander"}</button>
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
