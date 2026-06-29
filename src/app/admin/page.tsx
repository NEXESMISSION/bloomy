import Link from "next/link";
import { ShoppingCart, Sparkles, Truck, Wallet, ArrowRight, Database, Radar, Receipt, HandCoins, PackageX } from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import StatusBadge from "@/components/admin/StatusBadge";
import DashboardAnalytics from "@/components/admin/DashboardAnalytics";
import { listOrders, getStats, getSourceBreakdown, getAnalytics } from "@/lib/data/orders";
import { getProducts } from "@/lib/data/products";
import { isSupabaseConfigured } from "@/lib/supabase";
import { formatTND, formatDateFR } from "@/lib/utils";

export const dynamic = "force-dynamic";

const LOW_STOCK = 5;

export default async function AdminDashboard() {
  const [stats, orders, sources, analytics, products] = await Promise.all([
    getStats(),
    listOrders(),
    getSourceBreakdown(),
    getAnalytics(14),
    getProducts(),
  ]);
  const recent = orders.slice(0, 6);
  const maxSourceOrders = Math.max(1, ...sources.map((s) => s.orders));
  const lowStock = products.filter((p) => p.stock <= LOW_STOCK).sort((a, b) => a.stock - b.stock);

  const cards = [
    { label: "Commandes", value: stats.total, icon: ShoppingCart },
    { label: "Nouvelles", value: stats.nouvelles, icon: Sparkles },
    { label: "Livrées", value: stats.livrees, icon: Truck },
    { label: "Chiffre d'affaires", value: formatTND(stats.revenue), icon: Wallet },
    { label: "Panier moyen", value: formatTND(analytics.avgOrder), icon: Receipt },
    { label: "À encaisser", value: formatTND(analytics.toCollect), icon: HandCoins },
  ];

  return (
    <AdminShell>
      <div className="mb-7">
        <h1 className="text-2xl font-semibold text-ink sm:text-3xl">Tableau de bord</h1>
        <p className="mt-1 text-sm text-muted">Vue d'ensemble de votre boutique.</p>
      </div>

      {!isSupabaseConfigured && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-line bg-sand p-4 text-sm text-ink">
          <Database className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-semibold">Mode démo (données locales)</p>
            <p className="text-muted">Ajoutez vos clés Supabase dans <code className="rounded bg-white px-1">.env.local</code> pour activer la base de données.</p>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl border border-line bg-white p-5">
            <c.icon className="h-5 w-5 text-muted" strokeWidth={1.6} />
            <p className="mt-4 text-2xl font-semibold text-ink sm:text-3xl">{c.value}</p>
            <p className="text-sm text-muted">{c.label}</p>
          </div>
        ))}
      </div>

      <DashboardAnalytics analytics={analytics} />

      {lowStock.length > 0 && (
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50/60">
          <div className="flex items-center gap-2 border-b border-amber-200 px-5 py-4">
            <PackageX className="h-5 w-5 text-amber-600" strokeWidth={1.6} />
            <h2 className="font-semibold text-ink">Stock faible</h2>
          </div>
          <div className="divide-y divide-amber-200/70">
            {lowStock.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                <span className="truncate text-ink">{p.name}</span>
                <span className={p.stock === 0 ? "font-semibold text-red-600" : "font-semibold text-amber-700"}>
                  {p.stock === 0 ? "Rupture" : `${p.stock} restant(s)`}
                </span>
              </div>
            ))}
          </div>
          <Link href="/admin/produits" className="flex items-center gap-1 px-5 py-3 text-sm text-muted hover:text-ink">
            Gérer les stocks <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}

      <div className="mt-6 rounded-2xl border border-line bg-white">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="font-semibold text-ink">Dernières commandes</h2>
          <Link href="/admin/commandes" className="flex items-center gap-1 text-sm text-muted hover:text-ink">
            Tout voir <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        {recent.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-muted">Aucune commande pour le moment.</p>
        ) : (
          <div className="divide-y divide-line">
            {recent.map((o) => (
              <div key={o.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 text-sm">
                <div className="flex min-w-0 flex-col">
                  <span className="font-semibold text-ink">{o.order_number}</span>
                  <span className="truncate text-muted">{o.customer_name} · {[o.city, o.governorate].filter(Boolean).join(", ")}</span>
                </div>
                <span className="hidden text-muted sm:block">{formatDateFR(o.created_at)}</span>
                <span className="font-semibold text-ink">{formatTND(o.total)}</span>
                <StatusBadge status={o.status} />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6 rounded-2xl border border-line bg-white">
        <div className="flex items-center gap-2 border-b border-line px-5 py-4">
          <Radar className="h-5 w-5 text-muted" strokeWidth={1.6} />
          <h2 className="font-semibold text-ink">D'où viennent vos clients</h2>
        </div>
        {sources.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-muted">
            Pas encore de données. Créez des codes promo avec une source (Instagram, TikTok…) pour suivre vos leads.
          </p>
        ) : (
          <div className="space-y-3 p-5">
            {sources.map((s) => (
              <div key={s.source} className="flex items-center gap-3">
                <span className="w-28 shrink-0 truncate text-sm text-ink">{s.source}</span>
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-sand">
                  <div className="h-full rounded-full bg-ink" style={{ width: `${(s.orders / maxSourceOrders) * 100}%` }} />
                </div>
                <span className="w-14 shrink-0 text-right text-sm font-semibold text-ink">{s.orders}</span>
                <span className="w-24 shrink-0 text-right text-sm text-muted">{formatTND(s.revenue)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminShell>
  );
}
