"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, ArrowRight } from "lucide-react";
import type { ShopWithPlacement } from "@/lib/data/consignment";
import { cn } from "@/lib/utils";

const STATUS: Record<string, { label: string; cls: string }> = {
  active: { label: "Active", cls: "bg-green-100 text-green-700" },
  paused: { label: "En pause", cls: "bg-amber-100 text-amber-700" },
};

function daysSince(last: string | null): number | null {
  if (!last) return null;
  return Math.floor((Date.now() - new Date(last).getTime()) / 86400000);
}
function visitLabel(last: string | null): string {
  const d = daysSince(last);
  if (d === null) return "Jamais visitée";
  if (d <= 0) return "Vue aujourd'hui";
  if (d === 1) return "Vue hier";
  return `Vue il y a ${d} j`;
}
function isDue(last: string | null): boolean {
  const d = daysSince(last);
  return d === null || d >= 7;
}

export default function DepotShopList({ shops }: { shops: ShopWithPlacement[] }) {
  const [q, setQ] = useState("");
  const list = useMemo(() => {
    const query = q.trim().toLowerCase();
    return shops
      .filter((s) => s.status !== "removed")
      .filter((s) => !query || `${s.name} ${s.governorate ?? ""} ${s.location ?? ""} ${s.owner_name ?? ""}`.toLowerCase().includes(query))
      // à visiter (jamais vue / plus vieux) en premier
      .sort((a, b) => (a.last_visit ? new Date(a.last_visit).getTime() : 0) - (b.last_visit ? new Date(b.last_visit).getTime() : 0));
  }, [shops, q]);

  if (shops.filter((s) => s.status !== "removed").length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-line bg-white p-8 text-center text-sm text-muted">
        Aucune boutique. <Link href="/crm/depot/boutiques" className="font-semibold text-ink underline">Ajoutez votre première boutique →</Link>
      </div>
    );
  }

  return (
    <div>
      <div className="relative mb-3 max-w-sm">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Chercher une boutique…" className="input py-2.5 pl-10" />
      </div>
      <div className="space-y-2.5">
        {list.map((s) => {
          const st = STATUS[s.status] ?? STATUS.active;
          const pl = s.placement;
          const due = isDue(s.last_visit);
          return (
            <Link key={s.id} href={`/crm/depot/boutiques/${s.id}`} className={cn("flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl border bg-white p-4 transition hover:border-ink/30", due ? "border-ink/20" : "border-line")}>
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-sand text-sm font-semibold text-ink">{s.name.trim().charAt(0).toUpperCase() || "?"}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-ink">{s.name}</p>
                <p className="truncate text-xs text-muted">{visitLabel(s.last_visit)}{(s.governorate || s.location) ? ` · ${[s.governorate, s.location].filter(Boolean).join(" ")}` : ""}</p>
              </div>
              {due && <span className="rounded-full bg-ink px-2.5 py-1 text-xs font-semibold text-white">À visiter</span>}
              <span className={cn("hidden rounded-full px-2.5 py-1 text-xs font-semibold sm:inline", st.cls)}>{st.label}</span>
              {pl ? (
                <span className="text-sm text-muted"><span className="font-semibold text-ink">{pl.total_current}</span>/{pl.total_full}</span>
              ) : (
                <span className="rounded-full bg-sand px-2.5 py-1 text-xs text-muted">Aucun display</span>
              )}
              <span className="inline-flex items-center gap-1 rounded-lg bg-ink px-3 py-1.5 text-xs font-semibold text-white">{pl ? "Compter" : "Poser"} <ArrowRight className="h-3.5 w-3.5" /></span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
