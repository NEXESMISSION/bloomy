"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search, Trash2, Phone, Mail, ShoppingBag, Gift } from "lucide-react";
import type { CustomerWithStats } from "@/lib/data/customers";
import { deleteCustomerAction } from "@/app/admin/super-actions";
import { formatDateFR, cn } from "@/lib/utils";
import { phoneDisplay } from "@/lib/phone";

export default function CustomersAdmin({ customers }: { customers: CustomerWithStats[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [pending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.phone ?? "").includes(q) ||
        (c.email ?? "").toLowerCase().includes(q),
    );
  }, [customers, query]);

  const del = (c: CustomerWithStats) => {
    if (!confirm(`Supprimer le compte de ${c.name} ? Cette action est définitive.`)) return;
    startTransition(async () => {
      try {
        await deleteCustomerAction(c.id, c.name);
        router.refresh();
      } catch (e: any) {
        alert(e?.message ?? "Erreur");
      }
    });
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Nom, téléphone, email…" className="input py-2.5 pl-10" />
        </div>
        <span className="shrink-0 text-sm text-muted">{filtered.length} compte{filtered.length > 1 ? "s" : ""}</span>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-white p-10 text-center text-sm text-muted">
          Aucun compte client.
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((c) => (
            <div key={c.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl border border-line bg-white p-4">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-ink text-sm font-semibold text-white">
                {c.name.trim().charAt(0).toUpperCase() || "?"}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-ink">{c.name}</p>
                <p className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted">
                  {c.phone && <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" />{phoneDisplay(c.phone)}</span>}
                  {c.email && <span className="inline-flex items-center gap-1"><Mail className="h-3 w-3" />{c.email}</span>}
                </p>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-sand px-2.5 py-1 text-xs text-ink" title="Commandes (par téléphone)">
                <ShoppingBag className="h-3 w-3" /> {c.orders_count}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-sand px-2.5 py-1 text-xs text-ink" title="Gains roulette">
                <Gift className="h-3 w-3" /> {c.wins_count}
              </span>
              <span className="hidden text-xs text-muted sm:block">Inscrit {c.created_at ? formatDateFR(c.created_at) : "—"}</span>
              <button
                onClick={() => del(c)}
                disabled={pending}
                className={cn("grid h-8 w-8 place-items-center rounded-lg border border-red-200 text-red-600 transition hover:bg-red-50", pending && "opacity-50")}
                title="Supprimer le compte"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
