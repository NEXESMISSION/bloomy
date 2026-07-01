"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2, Pencil, Trash2, PackagePlus, X } from "lucide-react";
import type { InventoryRow, CProductInput } from "@/lib/data/consignment";
import { saveConsignmentProductAction, deleteConsignmentProductAction, addWarehouseStockAction } from "@/app/admin/consignment-actions";
import { formatTND, cn } from "@/lib/utils";

type Form = Partial<CProductInput>;
const EMPTY: Form = { name: "", sku: "", size_ml: 50, cost_price: 0, selling_price: 0, commission_per_sale: 0.5, warehouse_stock: 0, active: true };

export default function ConsignmentProductsAdmin({ products }: { products: InventoryRow[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState<Form | null>(null);

  const recv = (p: InventoryRow) => {
    const v = prompt(`Recevoir combien de flacons « ${p.name} » à l'entrepôt ?`, "20");
    const qty = Math.floor(Number(v));
    if (!qty || qty <= 0) return;
    startTransition(async () => { await addWarehouseStockAction(p.id, qty, p.name); router.refresh(); });
  };
  const del = (p: InventoryRow) => {
    if (!confirm(`Supprimer « ${p.name} » ? (réservé au propriétaire)`)) return;
    startTransition(async () => { try { await deleteConsignmentProductAction(p.id, p.name); router.refresh(); } catch (e: any) { alert(e?.message ?? "Erreur"); } });
  };

  return (
    <div>
      <div className="mb-5 flex justify-end">
        <button onClick={() => setEditing({ ...EMPTY })} className="btn-primary"><Plus className="h-4 w-4" /> Nouveau produit</button>
      </div>

      {products.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-white p-10 text-center text-sm text-muted">Aucun produit. Créez vos parfums (ex : Bloomy Vanilla).</div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {products.map((p) => (
            <div key={p.id} className={cn("rounded-2xl border bg-white p-4", p.active ? "border-line" : "border-line opacity-60")}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-ink">{p.name} <span className="text-xs font-normal text-muted">{p.size_ml} ml</span></p>
                  {p.sku && <p className="text-xs text-muted">SKU {p.sku}</p>}
                </div>
                <div className="flex gap-1">
                  <button onClick={() => setEditing({ ...p })} className="grid h-8 w-8 place-items-center rounded-lg border border-line text-muted hover:text-ink"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => del(p)} disabled={pending} className="grid h-8 w-8 place-items-center rounded-lg border border-red-200 text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                <Box label="Coût" value={formatTND(p.cost_price)} />
                <Box label="Vente" value={formatTND(p.selling_price)} />
                <Box label="Commission" value={formatTND(p.commission_per_sale)} />
              </div>
              <div className="mt-2 grid grid-cols-3 gap-2 text-center text-xs">
                <Box label="Entrepôt" value={p.warehouse_stock} strong />
                <Box label="En boutiques" value={p.in_shops} />
                <Box label="Total" value={p.total} />
              </div>
              <button onClick={() => recv(p)} disabled={pending} className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-line py-2 text-sm text-ink transition hover:bg-sand">
                <PackagePlus className="h-4 w-4" /> Recevoir du stock
              </button>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <Modal
          form={editing}
          pending={pending}
          onClose={() => setEditing(null)}
          onSave={(f) => startTransition(async () => {
            const res = await saveConsignmentProductAction(f as CProductInput);
            if (res.ok) { setEditing(null); router.refresh(); } else alert(res.error);
          })}
        />
      )}
    </div>
  );
}

function Box({ label, value, strong }: { label: string; value: React.ReactNode; strong?: boolean }) {
  return (
    <div className="rounded-lg bg-sand py-1.5">
      <p className={cn("font-semibold", strong ? "text-ink" : "text-ink")}>{value}</p>
      <p className="text-[10px] uppercase tracking-wide text-muted">{label}</p>
    </div>
  );
}

function Modal({ form, pending, onClose, onSave }: { form: Form; pending: boolean; onClose: () => void; onSave: (f: Form) => void }) {
  const [f, setF] = useState<Form>(form);
  const set = (patch: Form) => setF((x) => ({ ...x, ...patch }));
  const num = (v: string) => (v === "" ? 0 : Number(v));
  return (
    <div className="fixed inset-0 z-[80] grid place-items-center p-4">
      <div className="absolute inset-0 bg-ink/40" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-3xl border border-line bg-white p-6 shadow-pop">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-ink">{f.id ? "Modifier le produit" : "Nouveau produit"}</h2>
          <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full border border-line text-muted hover:text-ink"><X className="h-5 w-5" /></button>
        </div>
        <div className="space-y-3">
          <L label="Nom"><input className="input" value={f.name ?? ""} onChange={(e) => set({ name: e.target.value })} placeholder="Bloomy Vanilla" /></L>
          <div className="grid grid-cols-2 gap-3">
            <L label="SKU"><input className="input" value={f.sku ?? ""} onChange={(e) => set({ sku: e.target.value })} placeholder="VAN50" /></L>
            <L label="Taille (ml)"><input type="number" className="input" value={f.size_ml ?? 0} onChange={(e) => set({ size_ml: num(e.target.value) })} /></L>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <L label="Coût (DT)"><input type="number" step="0.001" className="input" value={f.cost_price ?? 0} onChange={(e) => set({ cost_price: num(e.target.value) })} /></L>
            <L label="Vente (DT)"><input type="number" step="0.001" className="input" value={f.selling_price ?? 0} onChange={(e) => set({ selling_price: num(e.target.value) })} /></L>
            <L label="Comm. (DT)"><input type="number" step="0.001" className="input" value={f.commission_per_sale ?? 0} onChange={(e) => set({ commission_per_sale: num(e.target.value) })} /></L>
          </div>
          {!f.id && <L label="Stock entrepôt initial"><input type="number" className="input" value={f.warehouse_stock ?? 0} onChange={(e) => set({ warehouse_stock: num(e.target.value) })} /></L>}
          <label className="flex items-center gap-2 text-sm text-ink">
            <input type="checkbox" checked={f.active ?? true} onChange={(e) => set({ active: e.target.checked })} /> Actif
          </label>
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
