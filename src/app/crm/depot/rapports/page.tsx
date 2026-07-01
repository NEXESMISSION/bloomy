import Link from "next/link";
import { TrendingUp, Coins, Wallet, Package, Trophy, Store, MapPin } from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import DepotTabs from "@/components/admin/DepotTabs";
import { getConsignmentReports } from "@/lib/data/consignment";
import { formatTND, cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DepotRapportsPage() {
  const r = await getConsignmentReports();
  const hasData = r.totalSold > 0;
  const maxScent = Math.max(1, ...r.scents.map((s) => s.sold));
  const maxShop = Math.max(1, ...r.shops.map((s) => s.sold));
  const maxGov = Math.max(1, ...r.govs.map((g) => g.sold));

  return (
    <AdminShell variant="crm">
      <div className="mb-7">
        <h1 className="text-2xl font-semibold text-ink sm:text-3xl">Rapports</h1>
        <p className="mt-1 text-sm text-muted">Qu'est-ce qui se vend, quelles boutiques valent le coup, quelle ville performe.</p>
      </div>
      <DepotTabs />

      {!hasData ? (
        <div className="rounded-2xl border border-dashed border-line bg-white p-10 text-center text-sm text-muted">
          Pas encore de données. Enregistrez quelques <Link href="/crm/depot/boutiques" className="font-semibold text-ink underline">visites</Link> et les rapports apparaîtront ici.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Kpi icon={Package} label="Flacons vendus (total)" value={r.totalSold} accent />
            <Kpi icon={Coins} label="Chiffre d'affaires" value={formatTND(r.totalRevenue)} />
            <Kpi icon={TrendingUp} label="Commission boutiques" value={formatTND(r.totalCommission)} />
            <Kpi icon={Wallet} label="Encaissé (vous)" value={formatTND(r.totalCollected)} />
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <Section title="Meilleures ventes — parfums" icon={Trophy}>
              {r.scents.map((s, i) => (
                <BarRow key={s.name} rank={i + 1} label={s.name} value={s.sold} sub={`${s.sold} vendus · ${formatTND(s.revenue)}`} pct={(s.sold / maxScent) * 100} />
              ))}
            </Section>

            <Section title="Boutiques les plus performantes" icon={Store}>
              {r.shops.map((s, i) => (
                <BarRow key={s.id} rank={i + 1} label={s.name} value={s.sold}
                  sub={`${s.sold} vendus · commission ${formatTND(s.commission)} · encaissé ${formatTND(s.collected)}`}
                  pct={(s.sold / maxShop) * 100} href={`/crm/depot/boutiques/${s.id}`} />
              ))}
            </Section>

            <Section title="Performance par gouvernorat" icon={MapPin}>
              {r.govs.map((g) => (
                <BarRow key={g.governorate} label={g.governorate} value={g.sold} sub={`${g.sold} vendus · ${formatTND(g.revenue)}`} pct={(g.sold / maxGov) * 100} />
              ))}
            </Section>

            <div className="rounded-2xl border border-line bg-white p-5">
              <p className="flex items-center gap-1.5 text-sm font-semibold text-ink"><Trophy className="h-4 w-4 text-amber-500" /> À retenir</p>
              <ul className="mt-3 space-y-2 text-sm text-muted">
                {r.scents[0] && <li>🥇 Meilleur parfum : <b className="text-ink">{r.scents[0].name}</b> ({r.scents[0].sold} vendus)</li>}
                {r.scents.length > 1 && <li>🐌 Le plus lent : <b className="text-ink">{r.scents[r.scents.length - 1].name}</b> ({r.scents[r.scents.length - 1].sold} vendus)</li>}
                {r.shops[0] && <li>🏆 Meilleure boutique : <b className="text-ink">{r.shops[0].name}</b> ({r.shops[0].sold} vendus)</li>}
                {r.shops.length > 1 && <li>⚠️ À surveiller : <b className="text-ink">{r.shops[r.shops.length - 1].name}</b> ({r.shops[r.shops.length - 1].sold} vendus) — vaut-elle le display&nbsp;?</li>}
                {r.govs[0] && <li>📍 Meilleure zone : <b className="text-ink">{r.govs[0].governorate}</b></li>}
              </ul>
            </div>
          </div>
        </>
      )}
    </AdminShell>
  );
}

function Kpi({ icon: Icon, label, value, accent }: { icon: any; label: string; value: React.ReactNode; accent?: boolean }) {
  return (
    <div className={cn("rounded-2xl border p-4", accent ? "border-ink bg-ink text-white" : "border-line bg-white")}>
      <Icon className={cn("h-5 w-5", accent ? "text-white/80" : "text-muted")} strokeWidth={1.7} />
      <p className={cn("mt-2 text-2xl font-semibold", accent ? "text-white" : "text-ink")}>{value}</p>
      <p className={cn("text-xs", accent ? "text-white/80" : "text-muted")}>{label}</p>
    </div>
  );
}

function Section({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-line bg-white p-5">
      <p className="mb-4 flex items-center gap-1.5 text-sm font-semibold text-ink"><Icon className="h-4 w-4 text-muted" /> {title}</p>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function BarRow({ rank, label, value, sub, pct, href }: { rank?: number; label: string; value: number; sub: string; pct: number; href?: string }) {
  const inner = (
    <>
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="truncate text-sm font-medium text-ink">{rank ? `${rank}. ` : ""}{label}</span>
        <span className="shrink-0 text-xs text-muted">{sub}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-sand">
        <div className="h-full rounded-full bg-ink" style={{ width: `${Math.max(4, pct)}%` }} />
      </div>
    </>
  );
  return href ? <Link href={href} className="block transition hover:opacity-80">{inner}</Link> : <div>{inner}</div>;
}
