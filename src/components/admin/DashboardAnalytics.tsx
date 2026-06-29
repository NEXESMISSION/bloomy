import { ORDER_STATUSES } from "@/lib/types";
import type { Analytics } from "@/lib/data/orders";
import { formatTND } from "@/lib/utils";

export default function DashboardAnalytics({ analytics }: { analytics: Analytics }) {
  const { daily, byStatus, topProducts } = analytics;
  const maxRev = Math.max(1, ...daily.map((d) => d.revenue));
  const totalStatus = Math.max(1, Object.values(byStatus).reduce((a, b) => a + b, 0));
  const maxQty = Math.max(1, ...topProducts.map((p) => p.quantity));

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-2">
      {/* Chiffre d'affaires sur 14 jours */}
      <div className="rounded-2xl border border-line bg-white p-5 lg:col-span-2">
        <h2 className="font-semibold text-ink">Chiffre d'affaires — 14 derniers jours</h2>
        <div className="mt-5 flex h-40 items-end gap-1.5">
          {daily.map((d) => (
            <div
              key={d.date}
              className="group relative flex flex-1 flex-col items-center justify-end"
              title={`${d.label} · ${d.orders} commande(s) · ${formatTND(d.revenue)}`}
            >
              <div
                className="w-full rounded-t-md bg-ink/80 transition-all duration-300 group-hover:bg-ink"
                style={{ height: `${(d.revenue / maxRev) * 100}%`, minHeight: d.revenue > 0 ? "6px" : "2px" }}
              />
            </div>
          ))}
        </div>
        <div className="mt-2 flex gap-1.5">
          {daily.map((d, i) => (
            <span key={d.date} className="flex-1 text-center text-[10px] text-muted">
              {i % 2 === 0 ? d.label : ""}
            </span>
          ))}
        </div>
      </div>

      {/* Répartition par statut */}
      <div className="rounded-2xl border border-line bg-white p-5">
        <h2 className="font-semibold text-ink">Commandes par statut</h2>
        <div className="mt-4 flex h-3 overflow-hidden rounded-full bg-sand">
          {ORDER_STATUSES.map((s) => {
            const n = byStatus[s.value] ?? 0;
            if (!n) return null;
            return <div key={s.value} style={{ width: `${(n / totalStatus) * 100}%`, background: s.color }} title={`${s.label} : ${n}`} />;
          })}
        </div>
        <div className="mt-4 space-y-2">
          {ORDER_STATUSES.map((s) => (
            <div key={s.value} className="flex items-center gap-2 text-sm">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: s.color }} />
              <span className="flex-1 text-muted">{s.label}</span>
              <span className="font-semibold text-ink">{byStatus[s.value] ?? 0}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Top produits */}
      <div className="rounded-2xl border border-line bg-white p-5">
        <h2 className="font-semibold text-ink">Produits les plus vendus</h2>
        {topProducts.length === 0 ? (
          <p className="mt-6 text-center text-sm text-muted">Pas encore de ventes.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {topProducts.map((p) => (
              <div key={p.name}>
                <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                  <span className="truncate text-ink">{p.name}</span>
                  <span className="shrink-0 font-semibold text-ink">
                    {p.quantity} <span className="font-normal text-muted">u.</span>
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-sand">
                  <div className="h-full rounded-full bg-ink" style={{ width: `${(p.quantity / maxQty) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
