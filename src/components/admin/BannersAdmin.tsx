"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Eye, EyeOff, X, Loader2, ImagePlus } from "lucide-react";
import type { Banner } from "@/lib/types";
import { saveBanner, removeBanner, uploadImage } from "@/app/admin/actions";
import { cn } from "@/lib/utils";

const BLANK: Banner = {
  id: "",
  image: "",
  mobile_image: "",
  title: "",
  subtitle: "",
  cta_label: "",
  cta_href: "",
  sort_order: 0,
  active: true,
};

export default function BannersAdmin({ banners }: { banners: Banner[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<Banner | null>(null);
  const [pending, startTransition] = useTransition();

  const del = (b: Banner) => {
    if (!confirm("Supprimer cette bannière ?")) return;
    startTransition(async () => {
      await removeBanner(b.id);
      router.refresh();
    });
  };
  const toggleActive = (b: Banner) =>
    startTransition(async () => {
      await saveBanner({ ...b, active: !b.active });
      router.refresh();
    });

  return (
    <div>
      <div className="mb-5 flex items-center justify-between gap-3">
        <p className="text-sm text-muted">
          Les bannières défilent automatiquement en haut de la page d’accueil.
        </p>
        <button
          onClick={() => setEditing({ ...BLANK, sort_order: banners.length })}
          className="btn-primary shrink-0"
        >
          <Plus className="h-4 w-4" /> Nouvelle bannière
        </button>
      </div>

      {banners.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-white p-10 text-center text-sm text-muted">
          Aucune bannière. Ajoutez-en une pour personnaliser le haut de votre page d’accueil.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {banners.map((b) => (
            <div key={b.id} className="overflow-hidden rounded-2xl border border-line bg-white">
              <div className="relative aspect-[16/9] bg-surface">
                {b.image && <Image src={b.image} alt={b.title ?? ""} fill className="object-contain" sizes="400px" />}
                {!b.active && (
                  <span className="absolute left-2 top-2 rounded-full bg-ink/80 px-2 py-0.5 text-[11px] font-semibold text-white">
                    Masquée
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between gap-3 p-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-ink">{b.title || "Sans titre"}</p>
                  <p className="truncate text-xs text-muted">{b.subtitle || b.cta_href || "—"}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <button
                    onClick={() => toggleActive(b)}
                    disabled={pending}
                    className={cn(
                      "grid h-8 w-8 place-items-center rounded-lg border",
                      b.active ? "border-line text-ink" : "border-line text-muted",
                    )}
                    title={b.active ? "Masquer" : "Afficher"}
                  >
                    {b.active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </button>
                  <button onClick={() => setEditing(b)} className="grid h-8 w-8 place-items-center rounded-lg border border-line text-muted hover:text-ink">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => del(b)} disabled={pending} className="grid h-8 w-8 place-items-center rounded-lg border border-red-200 text-red-600 hover:bg-red-50">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <BannerModal
          banner={editing}
          pending={pending}
          onClose={() => setEditing(null)}
          onSave={(input) =>
            startTransition(async () => {
              await saveBanner(input);
              setEditing(null);
              router.refresh();
            })
          }
        />
      )}
    </div>
  );
}

function BannerModal({
  banner,
  pending,
  onClose,
  onSave,
}: {
  banner: Banner;
  pending: boolean;
  onClose: () => void;
  onSave: (b: Banner) => void;
}) {
  const [form, setForm] = useState<Banner>(banner);
  const isNew = !banner.id;
  const set = (patch: Partial<Banner>) => setForm((f) => ({ ...f, ...patch }));

  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState<string | null>(null);
  const upload = async (file: File, field: "image" | "mobile_image") => {
    setUploadErr(null);
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await uploadImage(fd);
    setUploading(false);
    if (res.ok) set({ [field]: res.url });
    else setUploadErr(res.error);
  };

  return (
    <div className="fixed inset-0 z-[80] grid place-items-center p-4">
      <div className="absolute inset-0 bg-ink/40" onClick={onClose} />
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-line bg-white p-6 shadow-pop sm:p-8">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-ink">{isNew ? "Nouvelle bannière" : "Modifier la bannière"}</h2>
          <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full border border-line text-muted hover:text-ink">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <L label="Image desktop · paysage 16:7 (≈ 1920×840)">
              <div className="relative mb-2 aspect-[16/7] w-full overflow-hidden rounded-xl bg-surface">
                {form.image && <Image src={form.image} alt="" fill className="object-cover" sizes="420px" />}
              </div>
              <label className="btn-outline inline-flex w-full cursor-pointer justify-center">
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
                Téléverser
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (f) await upload(f, "image");
                    e.target.value = "";
                  }}
                />
              </label>
              <input className="input mt-2" value={form.image} onChange={(e) => set({ image: e.target.value })} placeholder="ou URL d'image" />
            </L>

            <L label="Image mobile · portrait 4:5 (≈ 1080×1350) — optionnel">
              <div className="relative mx-auto mb-2 aspect-[4/5] w-1/2 overflow-hidden rounded-xl bg-surface sm:w-full">
                {(form.mobile_image || form.image) && (
                  <Image src={form.mobile_image || form.image} alt="" fill className="object-cover" sizes="240px" />
                )}
              </div>
              <label className="btn-outline inline-flex w-full cursor-pointer justify-center">
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
                Téléverser
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (f) await upload(f, "mobile_image");
                    e.target.value = "";
                  }}
                />
              </label>
              <input
                className="input mt-2"
                value={form.mobile_image ?? ""}
                onChange={(e) => set({ mobile_image: e.target.value })}
                placeholder="vide = utilise l'image desktop"
              />
            </L>
          </div>
          {uploadErr && <p className="text-xs text-red-600">{uploadErr}</p>}

          <L label="Titre (facultatif)">
            <input className="input" value={form.title ?? ""} onChange={(e) => set({ title: e.target.value })} />
          </L>
          <L label="Sous-titre (facultatif)">
            <input className="input" value={form.subtitle ?? ""} onChange={(e) => set({ subtitle: e.target.value })} />
          </L>
          <div className="grid grid-cols-2 gap-4">
            <L label="Texte du bouton">
              <input className="input" value={form.cta_label ?? ""} onChange={(e) => set({ cta_label: e.target.value })} placeholder="Découvrir" />
            </L>
            <L label="Lien du bouton">
              <input className="input" value={form.cta_href ?? ""} onChange={(e) => set({ cta_href: e.target.value })} placeholder="/boutique" />
            </L>
          </div>
          <L label="Ordre d'affichage">
            <input type="number" className="input" value={form.sort_order} onChange={(e) => set({ sort_order: Number(e.target.value) })} />
          </L>
          <Toggle label="Afficher cette bannière" checked={form.active} onChange={(v) => set({ active: v })} />
        </div>

        <div className="mt-7 flex justify-end gap-3">
          <button onClick={onClose} className="btn-outline">Annuler</button>
          <button onClick={() => onSave(form)} disabled={pending || !form.image} className="btn-primary">
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
