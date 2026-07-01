import Link from "next/link";
import { Store, Boxes, Package, TrendingUp, Coins, Wallet, Trophy, TriangleAlert, ArrowRight, ClipboardList } from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import DepotTabs from "@/components/admin/DepotTabs";
import { getConsignmentDashboard, listShops } from "@/lib/data/consignment";
import { formatTND, cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const STATUS: Record<string, { label: string; cls: string }> = {
  active: { label: "Active", cls: "bg-green-100 text-green-700" },
  paused: { label: "En pause", cls: "bg-amber-100 text-amber-700" },
  removed: { label: "Retirée", cls: "bg-sand text-muted" },
};

export default async function DepotDashboard() {
  const [d, shops] = await Promise.all([getConsignmentDashboard(), listShops()]);
  const activeShops = shops.filter((s) => s.status !== "removed");

  return (
    <AdminShell variant="crm">
      <div className="mb-7">
        <h1 className="text-2xl font-semibold text-ink sm:text-3xl">Dépôt-vente</h1>
        <p className="mt-1 text-sm text-muted">Vos displays en boutiques, les ventes et les commissions — en un coup d'œil.</p>
      </div>
      <DepotTabs />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat icon={Store} label="Boutiques actives" value={d.activeShops} />
        <Stat icon={Boxes} label="Displays posés" value={d.activeDisplays} />
        <Stat icon={Package} label="Flacons en boutiques" value={d.bottlesInShops} />
        <Stat icon={TrendingUp} label="Vendus ce mois" value={d.soldThisMonth} accent />
        <Stat icon={Coins} label="CA ce mois" value={formatTND(d.revenueThisMonth)} />
        <Stat icon={Wallet} label="Encaissé ce mois" value={formatTND(d.collectedThisMonth)} />
        <Stat icon={Coins} label="Commission boutiques" value={formatTND(d.commissionThisMonth)} />
        <Stat icon={Package} label="Total boutiques suivies" value={shops.length} />
      </div>

      {/* Best / worst + low stock */}
      <div className="mt-5 grid gap-3 lg:grid-cols-3">
        <div className="rounded-2xl border border-line bg-white p-5">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted"><Trophy className="h-4 w-4 text-amber-500" /> Meilleure vente</p>
          <p className="mt-2 text-lg font-semibold text-ink">{d.best ? d.best.name : "—"}</p>
          {d.best && <p className="text-sm text-muted">{d.best.sold} flacons vendus (total)</p>}
        </div>
        <div className="rounded-2xl border border-line bg-white p-5">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted"><TrendingUp className="h-4 w-4 rotate-180 text-muted" /> Vente la plus lente</p>
          <p className="mt-2 text-lg font-semibold text-ink">{d.worst ? d.worst.name : "—"}</p>
          {d.worst && <p className="text-sm text-muted">{d.worst.sold} flacons vendus (total)</p>}
        </div>
        <div className={cn("rounded-2xl border p-5", d.lowStock.length ? "border-red-200 bg-red-50" : "border-line bg-white")}>
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted"><TriangleAlert className={cn("h-4 w-4", d.lowStock.length ? "text-red-600" : "text-muted")} /> Stock entrepôt bas</p>
          {d.lowStock.length === 0 ? (
            <p className="mt-2 text-sm text-muted">Tout va bien 👍</p>
          ) : (
            <ul className="mt-2 space-y-1 text-sm text-ink">
              {d.lowStock.map((p) => <li key={p.name} className="flex justify-between"><span>{p.name}</span><span className="font-semibold text-red-600">{p.warehouse_stock}</span></li>)}
            </ul>
          )}
        </div>
      </div>

      {/* Shops quick-count list */}
      <div className="mt-7">
        <h2 className="mb-3 flex items-center gap-2 font-semibold text-ink"><ClipboardList className="h-5 w-5" /> Boutiques — compter & réapprovisionner</h2>
        {activeShops.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line bg-white p-8 text-center text-sm text-muted">
            Aucune boutique. <Link href="/crm/depot/boutiques" className="font-semibold text-ink underline">Ajoutez votre première boutique →</Link>
          </div>
        ) : (
          <div className="space-y-2.5">
            {activeShops.map((s) => {
              const st = STATUS[s.status] ?? STATUS.active;
              const pl = s.placement;
              return (
                <Link key={s.id} href={`/crm/depot/boutiques/${s.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl border border-line bg-white p-4 transition hover:border-ink/30">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-sand text-sm font-semibold text-ink">{s.name.trim().charAt(0).toUpperCase() || "?"}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-ink">{s.name}</p>
                    <p className="truncate text-xs text-muted">{[s.governorate, s.location].filter(Boolean).join(" · ") || "—"}</p>
                  </div>
                  <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", st.cls)}>{st.label}</span>
                  {pl ? (
                    <span className="text-sm text-muted">{pl.display_code ?? "Display"} · <span className="font-semibold text-ink">{pl.total_current}</span>/{pl.total_full} flacons</span>
                  ) : (
                    <span className="rounded-full bg-sand px-2.5 py-1 text-xs text-muted">Aucun display</span>
                  )}
                  <span className="inline-flex items-center gap-1 rounded-lg bg-ink px-3 py-1.5 text-xs font-semibold text-white">
                    {pl ? "Compter" : "Poser"} <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </AdminShell>
  );
}

function Stat({ icon: Icon, label, value, accent }: { icon: any; label: string; value: React.ReactNode; accent?: boolean }) {
  return (
    <div className={cn("rounded-2xl border p-4", accent ? "border-ink bg-ink text-white" : "border-line bg-white")}>
      <Icon className={cn("h-5 w-5", accent ? "text-white/80" : "text-muted")} strokeWidth={1.7} />
      <p className={cn("mt-2 text-2xl font-semibold", accent ? "text-white" : "text-ink")}>{value}</p>
      <p className={cn("text-xs", accent ? "text-white/80" : "text-muted")}>{label}</p>
    </div>
  );
}
