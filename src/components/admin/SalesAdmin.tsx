"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2, X, ChevronDown, Trash2, Wallet, HandCoins, ShoppingCart, Ban } from "lucide-react";
import type { Sale, SaleChannel, SaleItem } from "@/lib/data/sales";
import type { Product } from "@/lib/types";
import { createSaleAction, cancelSaleAction, recordPaymentAction } from "@/app/admin/backoffice-actions";
import { formatTND, formatDateFR, cn } from "@/lib/utils";

type Lite = { id: string; name: string };
const CHANNELS: { value: SaleChannel; label: string }[] = [
  { value: "boutique", label: "Boutique" },
  { value: "gros", label: "Gros / revendeur" },
  { value: "en_ligne", label: "En ligne" },
];
const PAY = { payee: { label: "Payée", cls: "bg-green-100 text-green-700" }, partielle: { label: "Partielle", cls: "bg-amber-100 text-amber-700" }, impayee: { label: "Impayée", cls: "bg-red-100 text-red-700" } } as const;

export default function SalesAdmin({ sales, clients, products }: { sales: Sale[]; clients: Lite[]; products: Product[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [creating, setCreating] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [paying, setPaying] = useState<Sale | null>(null);

  const clientName = useMemo(() => Object.fromEntries(clients.map((c) => [c.id, c.name])), [clients]);
  const totals = useMemo(() => {
    const valid = sales.filter((s) => s.status !== "annulee");
    return {
      revenue: valid.reduce((s, x) => s + x.total, 0),
      toCollect: valid.reduce((s, x) => s + Math.max(0, x.total - x.amount_paid), 0),
      count: valid.length,
    };
  }, [sales]);

  return (
    <div>
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Stat icon={ShoppingCart} label="Ventes" value={String(totals.count)} />
        <Stat icon={Wallet} label="Chiffre d'affaires" value={formatTND(totals.revenue)} />
        <Stat icon={HandCoins} label="À récupérer" value={formatTND(totals.toCollect)} highlight={totals.toCollect > 0} />
      </div>

      <div className="mb-4 flex justify-end">
        <button onClick={() => setCreating(true)} className="btn-primary"><Plus className="h-4 w-4" /> Nouvelle vente</button>
      </div>

      {sales.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-white py-16 text-center text-muted">Aucune vente enregistrée.</div>
      ) : (
        <div className="space-y-2.5">
          {sales.map((s) => {
            const open = expanded === s.id;
            const balance = Math.max(0, s.total - s.amount_paid);
            const cancelled = s.status === "annulee";
            return (
              <div key={s.id} className={cn("overflow-hidden rounded-2xl border bg-white", open ? "border-ink/30" : "border-line", cancelled && "opacity-60")}>
                <button onClick={() => setExpanded(open ? null : s.id)} className="flex w-full flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3.5 text-left">
                  <span className="font-semibold text-ink">{s.sale_number}</span>
                  <span className="min-w-0 flex-1 truncate text-sm text-muted">{s.client_id ? clientName[s.client_id] ?? "Client" : "Client de passage"} · {CHANNELS.find((c) => c.value === s.channel)?.label}</span>
                  <span className="hidden text-xs text-muted sm:block">{formatDateFR(s.created_at)}</span>
                  <span className="font-semibold text-ink">{formatTND(s.total)}</span>
                  {cancelled ? <span className="rounded-full bg-sand px-2 py-0.5 text-xs text-muted">Annulée</span> : <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", PAY[s.pay_status].cls)}>{PAY[s.pay_status].label}</span>}
                  <ChevronDown className={cn("h-4 w-4 text-muted transition-transform", open && "rotate-180")} />
                </button>
                {open && (
                  <div className="border-t border-line bg-sand px-4 py-4">
                    <div className="space-y-1.5">
                      {s.items.map((it, i) => (
                        <div key={i} className="flex justify-between text-sm">
                          <span className="text-ink">{it.name} <span className="text-muted">× {it.quantity}</span></span>
                          <span className="text-ink">{formatTND(it.unit_price * it.quantity)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 space-y-1 border-t border-line pt-3 text-sm">
                      {s.discount > 0 && <div className="flex justify-between text-muted"><span>Remise</span><span>−{formatTND(s.discount)}</span></div>}
                      <div className="flex justify-between font-semibold text-ink"><span>Total</span><span>{formatTND(s.total)}</span></div>
                      <div className="flex justify-between text-muted"><span>Payé</span><span>{formatTND(s.amount_paid)}</span></div>
                      {balance > 0 && <div className="flex justify-between font-medium text-amber-700"><span>Reste à payer</span><span>{formatTND(balance)}</span></div>}
                    </div>
                    {s.notes && <p className="mt-2 text-sm text-muted">📝 {s.notes}</p>}
                    {!cancelled && (
                      <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-4">
                        {balance > 0 && <button onClick={() => setPaying(s)} className="btn-primary px-4 py-2 text-sm"><HandCoins className="h-4 w-4" /> Encaisser</button>}
                        <button onClick={() => { if (confirm("Annuler cette vente ? Le stock sera restauré.")) start(async () => { await cancelSaleAction(s.id); router.refresh(); }); }} disabled={pending} className="flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-sm text-red-600 hover:bg-red-50"><Ban className="h-4 w-4" /> Annuler</button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {creating && (
        <SaleModal clients={clients} products={products} pending={pending} onClose={() => setCreating(false)} onSave={(input) => start(async () => { try { await createSaleAction(input); setCreating(false); router.refresh(); } catch (e: any) { alert(e?.message ?? "Erreur"); } })} />
      )}
      {paying && (
        <PayModal sale={paying} pending={pending} onClose={() => setPaying(null)} onSave={(amount) => start(async () => { try { await recordPaymentAction({ sale_id: paying.id, client_id: paying.client_id, amount }); setPaying(null); router.refresh(); } catch (e: any) { alert(e?.message ?? "Erreur"); } })} />
      )}
    </div>
  );
}

function Stat({ icon: Icon, label, value, highlight }: { icon: any; label: string; value: string; highlight?: boolean }) {
  return (
    <div className={cn("rounded-2xl border p-5", highlight ? "border-amber-200 bg-amber-50/60" : "border-line bg-white")}>
      <Icon className={cn("h-5 w-5", highlight ? "text-amber-600" : "text-muted")} strokeWidth={1.6} />
      <p className="mt-3 text-2xl font-semibold text-ink">{value}</p>
      <p className="text-sm text-muted">{label}</p>
    </div>
  );
}

function SaleModal({ clients, products, pending, onClose, onSave }: { clients: Lite[]; products: Product[]; pending: boolean; onClose: () => void; onSave: (input: { client_id: string | null; channel: SaleChannel; items: SaleItem[]; discount: number; notes: string; paid_now: number }) => void }) {
  const [clientId, setClientId] = useState<string>("");
  const [channel, setChannel] = useState<SaleChannel>("boutique");
  const [items, setItems] = useState<SaleItem[]>([{ product_id: null, name: "", unit_price: 0, quantity: 1 }]);
  const [discount, setDiscount] = useState(0);
  const [paidNow, setPaidNow] = useState(0);
  const [notes, setNotes] = useState("");

  const subtotal = items.reduce((s, i) => s + Number(i.unit_price) * Number(i.quantity), 0);
  const total = Math.max(0, subtotal - discount);

  const setItem = (idx: number, patch: Partial<SaleItem>) => setItems((arr) => arr.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  const pickProduct = (idx: number, pid: string) => {
    if (!pid) { setItem(idx, { product_id: null }); return; }
    const p = products.find((x) => x.id === pid);
    if (p) setItem(idx, { product_id: p.id, name: p.name, unit_price: p.price });
  };

  return (
    <div className="fixed inset-0 z-[80] grid place-items-center p-4">
      <div className="absolute inset-0 bg-ink/40" onClick={onClose} />
      <div className="relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-line bg-white p-6 shadow-pop sm:p-8">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-ink">Nouvelle vente</h2>
          <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full border border-line text-muted hover:text-ink"><X className="h-5 w-5" /></button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <L label="Client">
            <select className="input" value={clientId} onChange={(e) => setClientId(e.target.value)}>
              <option value="">Client de passage</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </L>
          <L label="Canal">
            <select className="input" value={channel} onChange={(e) => setChannel(e.target.value as SaleChannel)}>
              {CHANNELS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </L>
        </div>

        <div className="mt-4">
          <p className="mb-2 text-xs font-medium text-muted">Articles</p>
          <div className="space-y-2">
            {items.map((it, i) => (
              <div key={i} className="flex flex-wrap items-center gap-2">
                <select className="input flex-1" value={it.product_id ?? ""} onChange={(e) => pickProduct(i, e.target.value)}>
                  <option value="">Article libre…</option>
                  {products.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.stock} en stock)</option>)}
                </select>
                <input className="input w-32" placeholder="Nom" value={it.name} onChange={(e) => setItem(i, { name: e.target.value })} />
                <input type="number" step="0.001" className="input w-24" placeholder="Prix" value={it.unit_price} onChange={(e) => setItem(i, { unit_price: Number(e.target.value) })} />
                <input type="number" className="input w-16" value={it.quantity} onChange={(e) => setItem(i, { quantity: Number(e.target.value) })} />
                <button onClick={() => setItems((a) => a.filter((_, j) => j !== i))} className="grid h-9 w-9 place-items-center rounded-lg border border-line text-muted hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
              </div>
            ))}
          </div>
          <button onClick={() => setItems((a) => [...a, { product_id: null, name: "", unit_price: 0, quantity: 1 }])} className="mt-2 text-sm font-medium text-ink hover:underline">+ Ajouter un article</button>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <L label="Remise (DT)"><input type="number" step="0.001" className="input" value={discount} onChange={(e) => setDiscount(Number(e.target.value))} /></L>
          <L label="Payé maintenant (DT)"><input type="number" step="0.001" className="input" value={paidNow} onChange={(e) => setPaidNow(Number(e.target.value))} /></L>
          <div className="flex flex-col justify-end">
            <p className="text-sm text-muted">Total</p>
            <p className="text-2xl font-semibold text-ink">{formatTND(total)}</p>
          </div>
        </div>
        <L label="Note (optionnel)"><input className="input mt-2" value={notes} onChange={(e) => setNotes(e.target.value)} /></L>

        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="btn-outline">Annuler</button>
          <button onClick={() => onSave({ client_id: clientId || null, channel, items, discount, notes, paid_now: paidNow })} disabled={pending || total <= 0} className="btn-primary">{pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enregistrer la vente"}</button>
        </div>
      </div>
    </div>
  );
}

function PayModal({ sale, pending, onClose, onSave }: { sale: Sale; pending: boolean; onClose: () => void; onSave: (amount: number) => void }) {
  const balance = Math.max(0, sale.total - sale.amount_paid);
  const [amount, setAmount] = useState(balance);
  return (
    <div className="fixed inset-0 z-[80] grid place-items-center p-4">
      <div className="absolute inset-0 bg-ink/40" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-3xl border border-line bg-white p-6 shadow-pop">
        <h2 className="text-lg font-semibold text-ink">Encaisser — {sale.sale_number}</h2>
        <p className="mt-1 text-sm text-muted">Reste à payer : <b className="text-amber-700">{formatTND(balance)}</b></p>
        <L label="Montant reçu (DT)"><input type="number" step="0.001" className="input mt-3" value={amount} onChange={(e) => setAmount(Number(e.target.value))} autoFocus /></L>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="btn-outline">Annuler</button>
          <button onClick={() => onSave(amount)} disabled={pending || !(amount > 0)} className="btn-primary">{pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Encaisser"}</button>
        </div>
      </div>
    </div>
  );
}

function L({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-muted">{label}</span>
      {children}
    </label>
  );
}
