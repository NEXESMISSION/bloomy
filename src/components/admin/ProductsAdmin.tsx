"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Star, Eye, EyeOff, X, Loader2, ImagePlus } from "lucide-react";
import type { Product } from "@/lib/types";
import { saveProduct, removeProduct, uploadProductImage } from "@/app/admin/actions";
import { formatTND, cn } from "@/lib/utils";

const BLANK: Product = {
  id: "", slug: "", name: "", tagline: "", description: "", price: 0, compare_at_price: null,
  size_ml: 50, accent: "#17171B", family: "", notes_top: [], notes_heart: [], notes_base: [],
  moods: [], image: "/products/sauvage.png", gallery: [], is_featured: false, is_best_seller: false,
  is_active: true, stock: 0, sort_order: 0,
  gender: "mixte", season: "toutes", product_type: null, is_pack: false, pack_size: null,
};

const IMAGE_OPTIONS = [
  "/products/most-wanted.png",
  "/products/imagination.png",
  "/products/sauvage.png",
  "/products/bleu-de-chanel.png",
];

export default function ProductsAdmin({ products }: { products: Product[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<Product | null>(null);
  const [pending, startTransition] = useTransition();

  const del = (p: Product) => {
    if (!confirm(`Supprimer « ${p.name} » ?`)) return;
    startTransition(async () => { await removeProduct(p.id); router.refresh(); });
  };
  const toggleActive = (p: Product) =>
    startTransition(async () => { await saveProduct({ ...p, is_active: !p.is_active }); router.refresh(); });

  return (
    <div>
      <div className="mb-5 flex justify-end">
        <button onClick={() => setEditing({ ...BLANK })} className="btn-primary"><Plus className="h-4 w-4" /> Nouveau produit</button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-line bg-white">
        <div className="hidden grid-cols-[60px_1fr_120px_100px_90px_110px] gap-3 border-b border-line px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted md:grid">
          <span></span><span>Produit</span><span>Prix</span><span>Stock</span><span>Statut</span><span className="text-right">Actions</span>
        </div>
        <div className="divide-y divide-line">
          {products.map((p) => (
            <div key={p.id} className="grid grid-cols-2 items-center gap-3 px-4 py-3 md:grid-cols-[60px_1fr_120px_100px_90px_110px]">
              <div className="relative h-12 w-10 overflow-hidden rounded-lg bg-surface">
                <Image src={p.image} alt={p.name} fill className="object-contain" sizes="40px" />
              </div>
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 truncate font-semibold text-ink">
                  {p.name}{p.is_best_seller && <Star className="h-3.5 w-3.5 fill-ink text-ink" />}
                </p>
                <p className="truncate text-xs text-muted">{p.family}</p>
              </div>
              <span className="text-sm text-ink">{formatTND(p.price)}</span>
              <span className={cn("text-sm", p.stock > 0 ? "text-muted" : "text-red-600")}>{p.stock} u.</span>
              <button onClick={() => toggleActive(p)} disabled={pending} className={cn("flex w-fit items-center gap-1 rounded-full px-2 py-1 text-xs font-medium", p.is_active ? "bg-green-100 text-green-700" : "bg-sand text-muted")}>
                {p.is_active ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}{p.is_active ? "Actif" : "Masqué"}
              </button>
              <div className="flex justify-end gap-1.5">
                <button onClick={() => setEditing(p)} className="grid h-8 w-8 place-items-center rounded-lg border border-line text-muted hover:text-ink"><Pencil className="h-4 w-4" /></button>
                <button onClick={() => del(p)} disabled={pending} className="grid h-8 w-8 place-items-center rounded-lg border border-red-200 text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {editing && (
        <ProductModal product={editing} pending={pending} onClose={() => setEditing(null)}
          onSave={(input) => startTransition(async () => { await saveProduct(input); setEditing(null); router.refresh(); })} />
      )}
    </div>
  );
}

function ProductModal({ product, pending, onClose, onSave }: { product: Product; pending: boolean; onClose: () => void; onSave: (p: Product) => void; }) {
  const [form, setForm] = useState<Product>(product);
  const isNew = !product.id;
  const set = (patch: Partial<Product>) => setForm((f) => ({ ...f, ...patch }));
  const list = (v: string) => v.split(",").map((s) => s.trim()).filter(Boolean);

  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState<string | null>(null);
  const upload = async (file: File): Promise<string | null> => {
    setUploadErr(null);
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await uploadProductImage(fd);
    setUploading(false);
    if (res.ok) return res.url;
    setUploadErr(res.error);
    return null;
  };

  return (
    <div className="fixed inset-0 z-[80] grid place-items-center p-4">
      <div className="absolute inset-0 bg-ink/40" onClick={onClose} />
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-line bg-white p-6 shadow-pop sm:p-8">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-ink">{isNew ? "Nouveau produit" : `Modifier · ${product.name}`}</h2>
          <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full border border-line text-muted hover:text-ink"><X className="h-5 w-5" /></button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <L label="Nom" full><input className="input" value={form.name} onChange={(e) => set({ name: e.target.value })} /></L>
          <L label="Accroche (tagline)" full><input className="input" value={form.tagline} onChange={(e) => set({ tagline: e.target.value })} /></L>
          <L label="Description" full><textarea rows={3} className="input resize-none" value={form.description} onChange={(e) => set({ description: e.target.value })} /></L>
          <L label="Famille olfactive"><input className="input" value={form.family} onChange={(e) => set({ family: e.target.value })} /></L>
          <L label="Genre">
            <select className="input" value={form.gender} onChange={(e) => set({ gender: e.target.value })}>
              <option value="mixte">Mixte</option>
              <option value="homme">Homme</option>
              <option value="femme">Femme</option>
            </select>
          </L>
          <L label="Saison">
            <select className="input" value={form.season} onChange={(e) => set({ season: e.target.value })}>
              <option value="toutes">Toutes saisons</option>
              <option value="ete">Été</option>
              <option value="hiver">Hiver</option>
            </select>
          </L>
          <L label="Type / collection (libre)"><input className="input" value={form.product_type ?? ""} onChange={(e) => set({ product_type: e.target.value || null })} placeholder="Français, Oriental…" /></L>
          <L label="Pack (offre multi-flacons) ?">
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => set({ is_pack: !form.is_pack })} className={cn("relative h-6 w-11 rounded-full transition", form.is_pack ? "bg-ink" : "bg-line")}>
                <span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all", form.is_pack ? "left-[22px]" : "left-0.5")} />
              </button>
              {form.is_pack && (
                <input type="number" min={2} className="input w-28" value={form.pack_size ?? ""} onChange={(e) => set({ pack_size: e.target.value ? Number(e.target.value) : null })} placeholder="Nb flacons" />
              )}
            </div>
          </L>
          <L label="Image principale" full>
            <div className="flex items-start gap-3">
              <div className="relative h-24 w-20 shrink-0 overflow-hidden rounded-xl bg-surface">
                {form.image && <Image src={form.image} alt="" fill className="object-contain" sizes="80px" />}
              </div>
              <div className="flex-1">
                <label className="btn-outline inline-flex cursor-pointer">
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
                  Téléverser
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (f) { const url = await upload(f); if (url) set({ image: url }); }
                      e.target.value = "";
                    }}
                  />
                </label>
                <input className="input mt-2" value={form.image} onChange={(e) => set({ image: e.target.value })} placeholder="ou collez une URL d'image" />
              </div>
            </div>
          </L>
          <L label="Galerie (images supplémentaires — défilent sur la fiche)" full>
            <div className="flex flex-wrap gap-2">
              {(form.gallery ?? []).map((g, i) => (
                <div key={i} className="relative h-20 w-16 overflow-hidden rounded-lg bg-surface">
                  <Image src={g} alt="" fill className="object-contain" sizes="64px" />
                  <button
                    type="button"
                    onClick={() => set({ gallery: (form.gallery ?? []).filter((_, j) => j !== i) })}
                    className="absolute right-0.5 top-0.5 grid h-5 w-5 place-items-center rounded-full bg-ink/80 text-white"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              <label className="grid h-20 w-16 cursor-pointer place-items-center rounded-lg border border-dashed border-line text-muted transition hover:border-ink hover:text-ink">
                {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (f) { const url = await upload(f); if (url) set({ gallery: [...(form.gallery ?? []), url] }); }
                    e.target.value = "";
                  }}
                />
              </label>
            </div>
            {uploadErr && <p className="mt-2 text-xs text-red-600">{uploadErr}</p>}
          </L>
          <L label="Prix (DT)"><input type="number" step="0.001" className="input" value={form.price} onChange={(e) => set({ price: Number(e.target.value) })} /></L>
          <L label="Prix barré (DT, facultatif)"><input type="number" step="0.001" className="input" value={form.compare_at_price ?? ""} onChange={(e) => set({ compare_at_price: e.target.value ? Number(e.target.value) : null })} /></L>
          <L label="Stock"><input type="number" className="input" value={form.stock} onChange={(e) => set({ stock: Number(e.target.value) })} /></L>
          <L label="Ordre d'affichage"><input type="number" className="input" value={form.sort_order} onChange={(e) => set({ sort_order: Number(e.target.value) })} /></L>
          <L label="Notes de tête (virgules)" full><input className="input" value={form.notes_top.join(", ")} onChange={(e) => set({ notes_top: list(e.target.value) })} /></L>
          <L label="Notes de cœur" full><input className="input" value={form.notes_heart.join(", ")} onChange={(e) => set({ notes_heart: list(e.target.value) })} /></L>
          <L label="Notes de fond" full><input className="input" value={form.notes_base.join(", ")} onChange={(e) => set({ notes_base: list(e.target.value) })} /></L>
          <L label="Humeurs (virgules)" full><input className="input" value={form.moods.join(", ")} onChange={(e) => set({ moods: list(e.target.value) })} /></L>
        </div>

        <div className="mt-4 flex flex-wrap gap-4">
          <Toggle label="En vedette" checked={form.is_featured} onChange={(v) => set({ is_featured: v })} />
          <Toggle label="Best-seller" checked={form.is_best_seller} onChange={(v) => set({ is_best_seller: v })} />
          <Toggle label="Actif" checked={form.is_active} onChange={(v) => set({ is_active: v })} />
        </div>

        <div className="mt-7 flex justify-end gap-3">
          <button onClick={onClose} className="btn-outline">Annuler</button>
          <button onClick={() => onSave(form)} disabled={pending || !form.name} className="btn-primary">
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

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!checked)} className="flex items-center gap-2 text-sm text-ink">
      <span className={cn("relative h-6 w-11 rounded-full transition", checked ? "bg-ink" : "bg-line")}>
        <span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all", checked ? "left-[22px]" : "left-0.5")} />
      </span>
      {label}
    </button>
  );
}
