"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Loader2, Minus, Plus, Trash2, AlertCircle, Check, X } from "lucide-react";
import { useCart } from "@/context/cart";
import { GOUVERNORATS } from "@/lib/tunisia";
import { formatTND } from "@/lib/utils";
import { placeOrder, validateDiscount } from "@/app/actions";

type Applied = { code: string; type: "percent" | "fixed" | null; value: number; min_subtotal: number };

function clientDiscount(applied: Applied | null, subtotal: number): number {
  if (!applied) return 0;
  if (subtotal < applied.min_subtotal) return 0;
  const raw = applied.type === "percent" ? (subtotal * applied.value) / 100 : applied.value;
  return Math.min(Math.round(raw * 1000) / 1000, subtotal);
}

export default function CheckoutForm({ customer }: { customer?: { name: string; phone: string } | null }) {
  const { items, subtotal, deliveryFee, setQty, remove } = useCart();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    customer_name: customer?.name ?? "",
    phone: customer?.phone ?? "",
    governorate: "",
    address: "",
  });
  const [code, setCode] = useState("");
  const [applied, setApplied] = useState<Applied | null>(null);
  const [codeMsg, setCodeMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [codeLoading, setCodeLoading] = useState(false);
  const [source, setSource] = useState("");

  useEffect(() => {
    try {
      const s = localStorage.getItem("bloomy_source");
      if (s) setSource(s);
    } catch {}
  }, []);

  const discount = clientDiscount(applied, subtotal);
  const total = Math.max(0, subtotal - discount) + deliveryFee;
  const update = (k: keyof typeof form) => (e: React.ChangeEvent<any>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const applyCode = async () => {
    if (!code.trim()) return;
    setCodeLoading(true);
    const res = await validateDiscount(code.trim(), subtotal);
    setCodeLoading(false);
    if (res.ok) {
      setApplied({ code: code.trim().toUpperCase(), type: res.type, value: res.value, min_subtotal: res.min_subtotal });
      setCodeMsg({ ok: true, text: res.message });
    } else {
      setApplied(null);
      setCodeMsg({ ok: false, text: res.message });
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await placeOrder({
      ...form,
      city: "",
      code: applied?.code,
      source: source || undefined,
      items: items.map((i) => ({ product_id: i.id, name: i.name, unit_price: i.price, quantity: i.quantity })),
    });
    if (res.ok) {
      // on ne vide PAS le panier ici (évite le flash "panier vide") :
      // il est vidé à l'arrivée sur la page de confirmation.
      router.push(`/commande/${res.orderNumber}`);
    } else {
      setError(res.error);
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="container-bloomy flex min-h-[60vh] flex-col items-center justify-center gap-5 py-24 text-center">
        <h1 className="text-2xl sm:text-3xl">Votre panier est vide</h1>
        <p className="max-w-sm text-muted">Ajoutez un parfum pour passer commande.</p>
        <Link href="/boutique" className="btn-primary">Découvrir la gamme</Link>
      </div>
    );
  }

  return (
    <div className="container-bloomy py-10 sm:py-14">
      <div className="mb-8 text-center">
        <h1 className="text-3xl sm:text-4xl">Finaliser la commande</h1>
        <p className="mt-2 text-sm text-muted">On vous rappelle pour confirmer. Paiement à la livraison.</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.25fr_1fr]">
        {/* Formulaire */}
        <form onSubmit={submit} className="order-2 space-y-4 lg:order-1">
          {customer ? (
            <div className="rounded-xl border border-line bg-sand px-4 py-3 text-sm text-ink">
              Connecté en tant que <strong>{customer.name}</strong> — cette commande sera enregistrée dans
              <Link href="/compte" className="font-semibold underline underline-offset-2"> votre compte</Link>.
            </div>
          ) : (
            <div className="rounded-xl border border-line bg-sand px-4 py-3 text-sm text-muted">
              <Link href="/compte" className="font-semibold text-ink underline underline-offset-2">Créez un compte</Link>{" "}
              (ou connectez-vous) pour suivre vos commandes et garder vos gains de la roue de la chance.
            </div>
          )}
          <h2 className="text-lg font-semibold text-ink">Vos coordonnées</h2>
          <div>
            <label className="mb-1.5 block text-sm text-muted">Nom complet</label>
            <input required value={form.customer_name} onChange={update("customer_name")} placeholder="Ex : Mohamed Ben Ali" className="input" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm text-muted">Téléphone</label>
              <input required type="tel" value={form.phone} onChange={update("phone")} placeholder="55 123 456" className="input" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-muted">Gouvernorat</label>
              <select required value={form.governorate} onChange={update("governorate")} className="input appearance-none">
                <option value="" disabled>Choisir…</option>
                {GOUVERNORATS.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm text-muted">Adresse complète</label>
            <input required value={form.address} onChange={update("address")} placeholder="Rue, numéro, immeuble, ville…" className="input" />
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
              <AlertCircle className="h-4 w-4 shrink-0" /> {error}
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Envoi…</> : <>Confirmer · {formatTND(total)}</>}
          </button>
          <p className="text-center text-xs text-muted">Paiement à la livraison · Livraison 24–72h</p>
        </form>

        {/* Récapitulatif */}
        <div className="order-1 lg:order-2">
          <div className="rounded-2xl border border-line bg-sand p-5 sm:sticky sm:top-24">
            <h2 className="text-base font-semibold text-ink">Récapitulatif</h2>
            <div className="mt-4 space-y-4">
              {items.map((item) => (
                <div key={item.id} className="flex gap-3">
                  <div className="relative h-16 w-12 shrink-0 overflow-hidden rounded-lg bg-surface">
                    <Image src={item.image} alt={item.name} fill className="object-contain" sizes="48px" />
                  </div>
                  <div className="flex flex-1 flex-col">
                    <p className="text-sm font-semibold text-ink">{item.name}</p>
                    <p className="text-xs text-muted">{formatTND(item.price)}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <div className="flex items-center rounded-full border border-line bg-white">
                        <button type="button" onClick={() => setQty(item.id, item.quantity - 1)} className="grid h-7 w-7 place-items-center text-ink"><Minus className="h-3 w-3" /></button>
                        <span className="w-6 text-center text-xs font-bold text-ink">{item.quantity}</span>
                        <button type="button" onClick={() => setQty(item.id, item.quantity + 1)} className="grid h-7 w-7 place-items-center text-ink"><Plus className="h-3 w-3" /></button>
                      </div>
                      <button type="button" onClick={() => remove(item.id)} className="text-muted hover:text-ink" aria-label="Retirer"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-ink">{formatTND(item.price * item.quantity)}</p>
                </div>
              ))}
            </div>

            {/* Code promo */}
            <div className="mt-5 border-t border-line pt-4">
              {applied && discount > 0 ? (
                <div className="flex items-center justify-between rounded-xl bg-white px-3 py-2.5 text-sm">
                  <span className="font-semibold text-ink">Code {applied.code}</span>
                  <button type="button" onClick={() => { setApplied(null); setCode(""); setCodeMsg(null); }} className="text-muted hover:text-ink"><X className="h-4 w-4" /></button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), applyCode())}
                    placeholder="Code promo"
                    className="input flex-1 bg-white py-2.5 uppercase placeholder:normal-case"
                  />
                  <button type="button" onClick={applyCode} disabled={codeLoading} className="btn-outline px-4 py-2">
                    {codeLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Appliquer"}
                  </button>
                </div>
              )}
              {codeMsg && (
                <p className={`mt-2 flex items-center gap-1.5 text-xs ${codeMsg.ok ? "text-green-600" : "text-red-600"}`}>
                  {codeMsg.ok ? <Check className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}{codeMsg.text}
                </p>
              )}
            </div>

            <div className="mt-4 space-y-2 border-t border-line pt-4 text-sm">
              <div className="flex justify-between text-muted"><span>Sous-total</span><span>{formatTND(subtotal)}</span></div>
              {discount > 0 && <div className="flex justify-between text-ink"><span>Réduction ({applied?.code})</span><span>−{formatTND(discount)}</span></div>}
              <div className="flex justify-between text-muted"><span>Livraison</span><span>{deliveryFee === 0 ? "Offerte" : formatTND(deliveryFee)}</span></div>
              <div className="flex justify-between border-t border-line pt-2 text-base font-semibold text-ink"><span>Total</span><span>{formatTND(total)}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
