"use client";

import { useMemo, useState } from "react";
import { Search, Phone, MapPin, ChevronDown, Repeat, Wallet, HandCoins, UserCheck, ShoppingBag } from "lucide-react";
import type { Client } from "@/lib/data/clients";
import StatusBadge from "@/components/admin/StatusBadge";
import { formatTND, formatDateFR, cn } from "@/lib/utils";

export default function ClientsAdmin({ clients }: { clients: Client[] }) {
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        c.city.toLowerCase().includes(q) ||
        c.governorate.toLowerCase().includes(q),
    );
  }, [clients, query]);

  const totals = useMemo(
    () => ({
      count: clients.length,
      repeat: clients.filter((c) => c.orders > 1).length,
      revenue: clients.reduce((s, c) => s + c.spent, 0),
      pending: clients.reduce((s, c) => s + c.pending, 0),
    }),
    [clients],
  );

  return (
    <div>
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={UserCheck} label="Clients" value={String(totals.count)} />
        <Stat icon={Repeat} label="Clients fidèles" value={String(totals.repeat)} />
        <Stat icon={Wallet} label="Chiffre d'affaires" value={formatTND(totals.revenue)} />
        <Stat icon={HandCoins} label="À encaisser" value={formatTND(totals.pending)} />
      </div>

      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Nom, téléphone, ville…"
          className="input py-2.5 pl-10"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-line bg-white py-16 text-center text-muted">Aucun client.</div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((c) => {
            const isOpen = expanded === c.phone;
            return (
              <div key={c.phone} className={cn("overflow-hidden rounded-2xl border bg-white", isOpen ? "border-ink/30" : "border-line")}>
                <button onClick={() => setExpanded(isOpen ? null : c.phone)} className="flex w-full flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3.5 text-left">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-ink text-sm font-semibold text-white">
                    {c.name.trim().charAt(0).toUpperCase() || "?"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1.5 font-semibold text-ink">
                      {c.name}
                      {c.orders > 1 && (
                        <span className="rounded-full bg-sand px-1.5 py-0.5 text-[10px] font-medium text-muted">×{c.orders}</span>
                      )}
                      {c.hasAccount && <UserCheck className="h-3.5 w-3.5 text-accent" />}
                    </p>
                    <p className="truncate text-xs text-muted">
                      {c.phone}
                      {(c.city || c.governorate) && ` · ${[c.city, c.governorate].filter(Boolean).join(", ")}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-ink">{formatTND(c.spent)}</p>
                    {c.pending > 0 && <p className="text-xs text-amber-600">{formatTND(c.pending)} à encaisser</p>}
                  </div>
                  <ChevronDown className={cn("h-4 w-4 text-muted transition-transform", isOpen && "rotate-180")} />
                </button>

                {isOpen && (
                  <div className="border-t border-line bg-sand px-4 py-4">
                    <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
                      <a href={`tel:${c.phone}`} className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-ink"><Phone className="h-3.5 w-3.5" /> Appeler</a>
                      {(c.city || c.governorate) && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-muted"><MapPin className="h-3.5 w-3.5" /> {[c.city, c.governorate].filter(Boolean).join(", ")}</span>
                      )}
                      {c.sources.map((s) => (
                        <span key={s} className="rounded-full bg-white px-2.5 py-1 text-muted">{s}</span>
                      ))}
                    </div>

                    {c.orderList.length === 0 ? (
                      <p className="text-sm text-muted">Compte créé, aucune commande pour le moment.</p>
                    ) : (
                      <div className="space-y-1.5">
                        <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
                          <ShoppingBag className="h-3.5 w-3.5" /> {c.orderList.length} commande(s)
                        </p>
                        {c.orderList.map((o) => (
                          <div key={o.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-white px-3 py-2 text-sm">
                            <span className="font-medium text-ink">{o.order_number}</span>
                            <span className="text-muted">{formatDateFR(o.created_at)}</span>
                            <span className="truncate text-muted">{o.items.map((it) => `${it.name} ×${it.quantity}`).join(", ")}</span>
                            <span className="font-semibold text-ink">{formatTND(o.total)}</span>
                            <StatusBadge status={o.status} />
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
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-line bg-white p-5">
      <Icon className="h-5 w-5 text-muted" strokeWidth={1.6} />
      <p className="mt-3 text-2xl font-semibold text-ink">{value}</p>
      <p className="text-sm text-muted">{label}</p>
    </div>
  );
}
