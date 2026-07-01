"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Minus, Plus, Loader2, PackagePlus, RotateCcw, Trash2, Coins, Phone, MapPin, History, Boxes, Check, QrCode, ArrowLeft } from "lucide-react";
import type { CShop, Placement, DisplayWithLocation, CProduct, Visit } from "@/lib/data/consignment";
import { createPlacementAction, removePlacementAction, recordVisitAction } from "@/app/admin/consignment-actions";
import { formatTND, formatDateFR, cn } from "@/lib/utils";

export default function ShopDetail({
  shop, placement, availableDisplays, products, visits,
}: {
  shop: CShop;
  placement: Placement | null;
  availableDisplays: DisplayWithLocation[];
  products: CProduct[];
  visits: Visit[];
}) {
  const totalSold = visits.reduce((s, v) => s + v.total_sold, 0);
  const totalCommission = visits.reduce((s, v) => s + v.commission_total, 0);
  const totalCollected = visits.reduce((s, v) => s + v.amount_collected, 0);
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl border border-line bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-ink">{shop.name}</h1>
            {shop.owner_name && <p className="text-sm text-muted">{shop.owner_name}</p>}
          </div>
          <div className="flex items-center gap-2">
            <Link href={`/crm/depot/boutiques/${shop.id}/qr`} className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs font-medium text-ink transition hover:bg-sand" title="QR à coller sur le display">
              <QrCode className="h-4 w-4" /> QR
            </Link>
            <span className={cn("rounded-full px-3 py-1 text-xs font-semibold",
              shop.status === "active" ? "bg-green-100 text-green-700" : shop.status === "paused" ? "bg-amber-100 text-amber-700" : "bg-sand text-muted")}>
              {shop.status === "active" ? "Active" : shop.status === "paused" ? "En pause" : "Retirée"}
            </span>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted">
          {shop.phone && <a href={`tel:${shop.phone}`} className="flex items-center gap-1.5 hover:text-ink"><Phone className="h-4 w-4" /> {shop.phone}</a>}
          {(shop.location || shop.governorate) && <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" /> {[shop.governorate, shop.location].filter(Boolean).join(" · ")}</span>}
        </div>
      </div>

      {visits.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <MiniStat label="Vendus (total)" value={totalSold} />
          <MiniStat label="Visites" value={visits.length} />
          <MiniStat label="Commission versée" value={formatTND(totalCommission)} />
          <MiniStat label="Encaissé (total)" value={formatTND(totalCollected)} />
        </div>
      )}

      {placement ? (
        <CountPanel shop={shop} placement={placement} />
      ) : (
        <PlacePanel shop={shop} availableDisplays={availableDisplays} products={products} />
      )}

      {/* History */}
      <div>
        <h2 className="mb-3 flex items-center gap-2 font-semibold text-ink"><History className="h-5 w-5" /> Historique des visites</h2>
        {visits.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-line bg-white p-6 text-center text-sm text-muted">Aucune visite enregistrée.</p>
        ) : (
          <div className="space-y-2">
            {visits.map((v) => (
              <div key={v.id} className="rounded-2xl border border-line bg-white p-4">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                  <span className="text-xs text-muted">{formatDateFR(v.visited_at)}</span>
                  <span className="font-semibold text-ink">{v.total_sold} vendus</span>
                  <span className="text-muted">CA {formatTND(v.revenue)}</span>
                  <span className="text-muted">Commission {formatTND(v.commission_total)}</span>
                  <span className="ml-auto font-semibold text-ink">Encaissé {formatTND(v.amount_collected)}</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted">
                  {v.items.filter((i) => i.sold > 0 || i.refilled > 0).map((i, idx) => (
                    <span key={idx}>{i.name}: <b className="text-ink">-{i.sold}</b>{i.refilled > 0 && <span className="text-green-600"> (+{i.refilled})</span>}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────── Poser un display ─────────── */
function PlacePanel({ shop, availableDisplays, products }: { shop: CShop; availableDisplays: DisplayWithLocation[]; products: CProduct[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [displayId, setDisplayId] = useState<string>("");
  const [qty, setQty] = useState<Record<string, number>>(() => Object.fromEntries(products.map((p) => [p.id, 5])));
  const total = Object.values(qty).reduce((s, n) => s + (n || 0), 0);

  const submit = () =>
    start(async () => {
      const items = products.map((p) => ({ product_id: p.id, qty: qty[p.id] || 0 })).filter((i) => i.qty > 0);
      const res = await createPlacementAction({ shop_id: shop.id, display_id: displayId || null, items });
      if (res.ok) router.refresh(); else alert(res.error);
    });

  if (products.length === 0) {
    return <div className="rounded-2xl border border-dashed border-line bg-white p-8 text-center text-sm text-muted">Créez d'abord des produits dans l'onglet <b>Produits</b>.</div>;
  }

  return (
    <div className="rounded-2xl border border-line bg-white p-5">
      <h2 className="flex items-center gap-2 font-semibold text-ink"><PackagePlus className="h-5 w-5" /> Poser un display</h2>
      {availableDisplays.length > 0 && (
        <label className="mt-4 block">
          <span className="mb-1 block text-xs font-medium text-muted">Boîte display</span>
          <select className="input" value={displayId} onChange={(e) => setDisplayId(e.target.value)}>
            <option value="">Nouveau display (code auto)</option>
            {availableDisplays.map((d) => <option key={d.id} value={d.id}>Réutiliser {d.code}</option>)}
          </select>
        </label>
      )}
      <p className="mt-4 mb-2 text-xs font-medium text-muted">Combien de flacons par parfum ?</p>
      <div className="space-y-2">
        {products.map((p) => (
          <div key={p.id} className="flex items-center justify-between gap-3 rounded-xl bg-sand px-3 py-2">
            <span className="text-sm font-medium text-ink">{p.name}</span>
            <Stepper value={qty[p.id] || 0} onChange={(v) => setQty((q) => ({ ...q, [p.id]: v }))} />
          </div>
        ))}
      </div>
      <button onClick={submit} disabled={pending || total === 0} className="btn-primary mt-5 w-full">
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : `Poser le display · ${total} flacons`}
      </button>
    </div>
  );
}

/* ─────────── Comptage / visite (le cœur) ─────────── */
function CountPanel({ shop, placement }: { shop: CShop; placement: Placement }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [remaining, setRemaining] = useState<Record<string, number>>(
    () => Object.fromEntries(placement.items.map((i) => [i.product_id ?? i.id, i.current_qty])),
  );
  const [refill, setRefill] = useState(true);
  const [collectedStr, setCollectedStr] = useState("");
  const [showCollect, setShowCollect] = useState(false);
  const [saved, setSaved] = useState<{ sold: number; commission: number; collect: number } | null>(null);

  const calc = useMemo(() => {
    let sold = 0, revenue = 0, commission = 0, refillTotal = 0;
    const rows = placement.items.map((i) => {
      const key = i.product_id ?? i.id;
      const rem = Math.max(0, Math.min(i.current_qty, remaining[key] ?? i.current_qty));
      const s = Math.max(0, i.current_qty - rem);
      sold += s; revenue += s * i.selling_price; commission += s * i.commission_per_sale;
      const rf = refill ? Math.max(0, i.full_qty - rem) : 0;
      refillTotal += rf;
      return { i, rem, s, rf };
    });
    revenue = Math.round(revenue * 1000) / 1000;
    commission = Math.round(commission * 1000) / 1000;
    return { rows, sold, revenue, commission, collect: Math.max(0, Math.round((revenue - commission) * 1000) / 1000), refillTotal };
  }, [placement.items, remaining, refill]);

  const save = () =>
    start(async () => {
      const res = await recordVisitAction({
        shop_id: shop.id,
        placement_id: placement.id,
        counts: placement.items.filter((i) => i.product_id).map((i) => ({ product_id: i.product_id as string, remaining: Math.max(0, Math.min(i.current_qty, remaining[i.product_id as string] ?? i.current_qty)) })),
        refill,
        amount_collected: collectedStr.trim() === "" ? null : Number(collectedStr),
      });
      if (res.ok) {
        setSaved({ sold: calc.sold, commission: calc.commission, collect: collectedStr.trim() === "" ? calc.collect : Number(collectedStr) || 0 });
        router.refresh();
      } else alert(res.error);
    });

  const removeDisplay = () => {
    if (!confirm("Retirer le display de cette boutique ? Les flacons restants seront renvoyés à l'entrepôt.")) return;
    start(async () => { await removePlacementAction(placement.id, shop.id, true); router.refresh(); });
  };

  if (saved) {
    return (
      <div className="rounded-2xl border border-green-200 bg-green-50 p-6 text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-green-100 text-green-600"><Check className="h-7 w-7" /></span>
        <h2 className="mt-3 text-xl font-semibold text-ink">Visite enregistrée ✅</h2>
        <div className="mt-4 flex justify-center gap-8">
          <div><p className="text-2xl font-bold text-ink">{saved.sold}</p><p className="text-xs text-muted">vendus</p></div>
          <div><p className="text-2xl font-bold text-ink">{formatTND(saved.commission)}</p><p className="text-xs text-muted">commission</p></div>
          <div><p className="text-2xl font-bold text-green-700">{formatTND(saved.collect)}</p><p className="text-xs text-muted">encaissé</p></div>
        </div>
        <div className="mt-6 flex justify-center gap-3">
          <button onClick={() => setSaved(null)} className="btn-outline">Recompter</button>
          <Link href="/crm/depot/boutiques" className="btn-primary"><ArrowLeft className="h-4 w-4" /> Boutique suivante</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-line bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 font-semibold text-ink"><Boxes className="h-5 w-5" /> {placement.display_code ?? "Display"} · comptage</h2>
        <span className="text-sm text-muted"><b className="text-ink">{placement.total_current}</b>/{placement.total_full} flacons avant visite</span>
      </div>
      <p className="mt-1 text-sm text-muted">Comptez ce qu'il <b>reste</b> de chaque parfum. Le système calcule le reste.</p>

      <div className="mt-4 space-y-2">
        {calc.rows.map(({ i, rem, s, rf }) => {
          const key = i.product_id ?? i.id;
          return (
            <div key={key} className="rounded-xl border border-line px-3 py-2.5">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">{i.product_name}</p>
                  <p className="text-xs text-muted">plein : {i.full_qty} · avant : {i.current_qty}</p>
                </div>
                <Stepper value={rem} max={i.current_qty} onChange={(v) => setRemaining((r) => ({ ...r, [key]: v }))} />
              </div>
              <div className="mt-1.5 flex items-center gap-3 text-xs">
                <span className={cn("font-semibold", s > 0 ? "text-ink" : "text-muted")}>Vendu : {s}</span>
                {refill && rf > 0 && <span className="text-green-600">Réappro : +{rf}</span>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Live totals */}
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Tot label="Vendus" value={calc.sold} accent />
        <Tot label="CA" value={formatTND(calc.revenue)} />
        <Tot label="Commission boutique" value={formatTND(calc.commission)} />
        <Tot label="Vous encaissez" value={formatTND(collectedStr.trim() === "" ? calc.collect : Number(collectedStr) || 0)} strong />
      </div>

      <label className="mt-4 flex cursor-pointer items-center gap-3 text-sm text-ink">
        <span className={cn("relative h-6 w-11 rounded-full transition", refill ? "bg-ink" : "bg-line")}>
          <span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all", refill ? "left-[22px]" : "left-0.5")} />
        </span>
        <span className="flex items-center gap-1.5"><RotateCcw className="h-4 w-4" /> Réapprovisionner à plein ({calc.refillTotal} flacons depuis l'entrepôt)</span>
        <input type="checkbox" className="hidden" checked={refill} onChange={(e) => setRefill(e.target.checked)} />
      </label>

      <div className="mt-4">
        {!showCollect ? (
          <button type="button" onClick={() => setShowCollect(true)} className="text-sm text-muted underline underline-offset-2 hover:text-ink">
            Vous encaissez {formatTND(collectedStr.trim() === "" ? calc.collect : Number(collectedStr) || 0)} · ajuster
          </button>
        ) : (
          <label className="block max-w-xs">
            <span className="mb-1 block text-xs font-medium text-muted">Montant encaissé</span>
            <input className="input" inputMode="decimal" placeholder={formatTND(calc.collect)} value={collectedStr} onChange={(e) => setCollectedStr(e.target.value)} />
          </label>
        )}
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <button onClick={save} disabled={pending} className="btn-primary flex-1 sm:flex-none">
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Coins className="h-4 w-4" /> Enregistrer la visite</>}
        </button>
        <button onClick={removeDisplay} disabled={pending} className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 px-4 py-2 text-sm text-red-600 transition hover:bg-red-50">
          <Trash2 className="h-4 w-4" /> Retirer le display
        </button>
      </div>
    </div>
  );
}

/* ─────────── petits composants ─────────── */
function Stepper({ value, onChange, max }: { value: number; onChange: (v: number) => void; max?: number }) {
  const clamp = (v: number) => Math.max(0, max != null ? Math.min(max, v) : v);
  return (
    <div className="flex items-center rounded-full border border-line bg-white">
      <button type="button" onClick={() => onChange(clamp(value - 1))} className="grid h-9 w-9 place-items-center text-ink"><Minus className="h-4 w-4" /></button>
      <input
        value={value}
        onChange={(e) => onChange(clamp(Math.floor(Number(e.target.value.replace(/\D/g, "")) || 0)))}
        onFocus={(e) => e.currentTarget.select()}
        inputMode="numeric"
        className="w-12 border-0 bg-transparent text-center text-lg font-bold text-ink outline-none"
      />
      <button type="button" onClick={() => onChange(clamp(value + 1))} className="grid h-9 w-9 place-items-center text-ink"><Plus className="h-4 w-4" /></button>
    </div>
  );
}
function Tot({ label, value, accent, strong }: { label: string; value: React.ReactNode; accent?: boolean; strong?: boolean }) {
  return (
    <div className={cn("rounded-xl border p-3 text-center", accent ? "border-ink bg-ink text-white" : strong ? "border-ink/30 bg-sand" : "border-line bg-white")}>
      <p className={cn("text-lg font-semibold", accent ? "text-white" : "text-ink")}>{value}</p>
      <p className={cn("text-[10px] uppercase tracking-wide", accent ? "text-white/80" : "text-muted")}>{label}</p>
    </div>
  );
}
function MiniStat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-line bg-white p-3 text-center">
      <p className="text-lg font-semibold text-ink">{value}</p>
      <p className="text-[10px] uppercase tracking-wide text-muted">{label}</p>
    </div>
  );
}
