"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2, Trash2, Boxes, MapPin } from "lucide-react";
import type { DisplayWithLocation, DisplayStatus } from "@/lib/data/consignment";
import { createDisplayAction, deleteDisplayAction } from "@/app/admin/consignment-actions";
import { cn } from "@/lib/utils";

const STATUS: Record<DisplayStatus, { label: string; cls: string }> = {
  available: { label: "Disponible", cls: "bg-green-100 text-green-700" },
  placed: { label: "Posé", cls: "bg-blue-100 text-blue-700" },
  removed: { label: "Retiré", cls: "bg-sand text-muted" },
};

export default function DisplaysAdmin({ displays, nextCode }: { displays: DisplayWithLocation[]; nextCode: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const create = () =>
    startTransition(async () => {
      const res = await createDisplayAction({});
      if (!res.ok) alert(res.error);
      router.refresh();
    });
  const del = (d: DisplayWithLocation) => {
    if (d.status === "placed") { alert("Ce display est posé dans une boutique — retirez-le d'abord."); return; }
    if (!confirm(`Supprimer ${d.code} ? (réservé au propriétaire)`)) return;
    startTransition(async () => { try { await deleteDisplayAction(d.id, d.code); router.refresh(); } catch (e: any) { alert(e?.message ?? "Erreur"); } });
  };

  return (
    <div>
      <div className="mb-5 flex items-center justify-between gap-3">
        <p className="text-sm text-muted">Prochain code : <span className="font-semibold text-ink">{nextCode}</span></p>
        <button onClick={create} disabled={pending} className="btn-primary">{pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Plus className="h-4 w-4" /> Créer un display</>}</button>
      </div>

      {displays.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-white p-8 text-center text-sm text-muted">
          Rien à faire ici pour l'instant 👍<br />
          Un code display (DISPLAY-001…) est créé <b>automatiquement</b> quand vous posez des flacons dans une boutique.
          Cette page sert juste à voir où se trouve chaque boîte.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {displays.map((d) => {
            const st = STATUS[d.status];
            return (
              <div key={d.id} className="rounded-2xl border border-line bg-white p-4">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 font-semibold text-ink"><Boxes className="h-5 w-5 text-muted" /> {d.code}</span>
                  <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", st.cls)}>{st.label}</span>
                </div>
                <p className="mt-3 flex items-center gap-1.5 text-sm text-muted">
                  <MapPin className="h-4 w-4" /> {d.shop_name ? d.shop_name : "En stock (non posé)"}
                </p>
                {d.status !== "placed" && (
                  <button onClick={() => del(d)} disabled={pending} className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-red-200 py-2 text-sm text-red-600 transition hover:bg-red-50">
                    <Trash2 className="h-4 w-4" /> Supprimer
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
