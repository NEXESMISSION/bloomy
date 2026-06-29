"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search, Phone, MapPin, ChevronDown, Trash2, StickyNote, Package, Download, Tag, Radar } from "lucide-react";
import type { Order, OrderStatus } from "@/lib/types";
import { ORDER_STATUSES } from "@/lib/types";
import StatusBadge from "@/components/admin/StatusBadge";
import { setOrderStatus, removeOrder } from "@/app/admin/actions";
import { formatTND, formatDateFR, cn } from "@/lib/utils";

export default function OrdersAdmin({ orders }: { orders: Order[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<OrderStatus | "all">("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: orders.length };
    ORDER_STATUSES.forEach((s) => (c[s.value] = orders.filter((o) => o.status === s.value).length));
    return c;
  }, [orders]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders.filter((o) => {
      const matchStatus = filter === "all" || o.status === filter;
      const matchQuery =
        !q ||
        o.order_number.toLowerCase().includes(q) ||
        o.customer_name.toLowerCase().includes(q) ||
        o.phone.includes(q) ||
        (o.source ?? "").toLowerCase().includes(q) ||
        (o.discount_code ?? "").toLowerCase().includes(q);
      return matchStatus && matchQuery;
    });
  }, [orders, filter, query]);

  const exportCsv = () => {
    const head = ["N°", "Date", "Client", "Téléphone", "Gouvernorat", "Ville", "Adresse", "Articles", "Sous-total", "Réduction", "Code", "Livraison", "Total", "Source", "Statut"];
    const rows = filtered.map((o) => [
      o.order_number, o.created_at, o.customer_name, o.phone, o.governorate, o.city, o.address,
      o.items.map((i) => `${i.name} x${i.quantity}`).join(" | "),
      o.subtotal, o.discount_amount, o.discount_code ?? "", o.delivery_fee, o.total, o.source ?? "", o.status,
    ]);
    const csv = [head, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "commandes-bloomy.csv"; a.click(); URL.revokeObjectURL(url);
  };

  const changeStatus = (id: string, status: OrderStatus) =>
    startTransition(async () => { await setOrderStatus(id, status); router.refresh(); });

  const del = (id: string) => {
    if (!confirm("Supprimer définitivement cette commande ?")) return;
    startTransition(async () => { await removeOrder(id); router.refresh(); });
  };

  return (
    <div>
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="N° commande, nom, téléphone…" className="input py-2.5 pl-10" />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <Chip label={`Toutes (${counts.all})`} active={filter === "all"} onClick={() => setFilter("all")} />
          {ORDER_STATUSES.map((s) => (
            <Chip key={s.value} label={`${s.label} (${counts[s.value]})`} active={filter === s.value} onClick={() => setFilter(s.value)} />
          ))}
        </div>
        <button onClick={exportCsv} className="btn-outline shrink-0 px-4 py-2 text-sm">
          <Download className="h-4 w-4" /> Export CSV
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-line bg-white py-16 text-center text-muted">Aucune commande.</div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((o) => {
            const isOpen = expanded === o.id;
            return (
              <div key={o.id} className={cn("overflow-hidden rounded-2xl border bg-white", isOpen ? "border-ink/30" : "border-line")}>
                <button onClick={() => setExpanded(isOpen ? null : o.id)} className="flex w-full flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3.5 text-left">
                  <span className="font-semibold text-ink">{o.order_number}</span>
                  <span className="min-w-0 flex-1 truncate text-sm text-muted">{o.customer_name}</span>
                  <span className="hidden text-xs text-muted sm:block">{formatDateFR(o.created_at)}</span>
                  <span className="font-semibold text-ink">{formatTND(o.total)}</span>
                  <StatusBadge status={o.status} />
                  <ChevronDown className={cn("h-4 w-4 text-muted transition-transform", isOpen && "rotate-180")} />
                </button>

                {isOpen && (
                  <div className="border-t border-line bg-sand px-4 py-4">
                    <div className="grid gap-5 md:grid-cols-[1.2fr_1fr]">
                      <div>
                        <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
                          <Package className="h-3.5 w-3.5" /> Articles
                        </p>
                        <div className="space-y-1.5">
                          {o.items.map((it, i) => (
                            <div key={i} className="flex justify-between text-sm">
                              <span className="text-ink">{it.name} <span className="text-muted">× {it.quantity}</span></span>
                              <span className="text-ink">{formatTND(it.unit_price * it.quantity)}</span>
                            </div>
                          ))}
                        </div>
                        <div className="mt-3 space-y-1 border-t border-line pt-3 text-sm">
                          <div className="flex justify-between text-muted"><span>Sous-total</span><span>{formatTND(o.subtotal)}</span></div>
                          {o.discount_amount > 0 && (
                            <div className="flex justify-between text-ink"><span>Réduction {o.discount_code ? `(${o.discount_code})` : ""}</span><span>−{formatTND(o.discount_amount)}</span></div>
                          )}
                          <div className="flex justify-between text-muted"><span>Livraison</span><span>{o.delivery_fee === 0 ? "Offerte" : formatTND(o.delivery_fee)}</span></div>
                          <div className="flex justify-between font-semibold text-ink"><span>Total</span><span>{formatTND(o.total)}</span></div>
                        </div>
                      </div>

                      <div className="space-y-2.5 text-sm">
                        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">Client</p>
                        <a href={`tel:${o.phone}`} className="flex items-center gap-2 text-ink underline-offset-2 hover:underline"><Phone className="h-4 w-4" /> {o.phone}</a>
                        <p className="flex items-start gap-2 text-ink"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted" />{[o.address, o.city, o.governorate].filter(Boolean).join(", ")}</p>
                        {o.notes && <p className="flex items-start gap-2 text-muted"><StickyNote className="mt-0.5 h-4 w-4 shrink-0" />{o.notes}</p>}
                        {(o.discount_code || (o.source && o.source.trim())) && (
                          <div className="flex flex-wrap gap-2 pt-1">
                            {o.discount_code && <span className="inline-flex items-center gap-1 rounded-full border border-line bg-white px-2 py-0.5 text-xs text-ink"><Tag className="h-3 w-3" /> {o.discount_code}</span>}
                            {o.source && o.source.trim() && <span className="inline-flex items-center gap-1 rounded-full border border-line bg-white px-2 py-0.5 text-xs text-muted"><Radar className="h-3 w-3" /> {o.source}</span>}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
                      <label className="flex items-center gap-2 text-sm text-muted">
                        Statut :
                        <select value={o.status} disabled={pending} onChange={(e) => changeStatus(o.id, e.target.value as OrderStatus)} className="rounded-lg border border-line bg-white px-3 py-1.5 text-sm text-ink outline-none focus:border-ink/60">
                          {ORDER_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                        </select>
                      </label>
                      <button onClick={() => del(o.id)} disabled={pending} className="flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-600 transition hover:bg-red-50">
                        <Trash2 className="h-4 w-4" /> Supprimer
                      </button>
                    </div>
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

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={cn("shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium transition", active ? "border-ink bg-ink text-white" : "border-line bg-white text-muted hover:text-ink")}>
      {label}
    </button>
  );
}
