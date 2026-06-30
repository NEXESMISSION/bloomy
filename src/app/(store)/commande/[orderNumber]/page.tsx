import Link from "next/link";
import { Phone, MapPin, ArrowRight } from "lucide-react";
import { getOrderByNumber } from "@/lib/data/orders";
import { getSettings } from "@/lib/data/settings";
import { formatTND } from "@/lib/utils";
import { telHref } from "@/lib/phone";
import SuccessCheck from "@/components/SuccessCheck";
import ClearCart from "@/components/ClearCart";
import PixelPurchase from "@/components/PixelPurchase";

export const dynamic = "force-dynamic";

export default async function ConfirmationPage({ params }: { params: { orderNumber: string } }) {
  const [order, settings] = await Promise.all([
    getOrderByNumber(params.orderNumber),
    getSettings(),
  ]);

  if (!order) {
    return (
      <div className="container-bloomy flex min-h-[70vh] flex-col items-center justify-center gap-5 py-24 text-center">
        <h1 className="text-3xl">Commande introuvable</h1>
        <p className="max-w-sm text-muted">Le numéro <strong className="text-ink">{params.orderNumber}</strong> ne correspond à aucune commande.</p>
        <Link href="/boutique" className="btn-primary">Retour à la boutique</Link>
      </div>
    );
  }

  const steps = [
    { title: "Commande reçue", text: "Nous préparons votre colis." },
    { title: "Appel de confirmation", text: "On vous contacte pour valider." },
    { title: "Livraison & paiement", text: "Payez en recevant le colis." },
  ];

  return (
    <div className="container-bloomy py-12 sm:py-16">
      <ClearCart />
      <PixelPurchase value={order.total} orderNumber={order.order_number} />
      <div className="mx-auto max-w-xl text-center">
        <div className="flex justify-center"><SuccessCheck /></div>
        <h1 className="mt-6 text-3xl sm:text-4xl">Merci, c'est noté !</h1>
        <p className="mt-3 text-muted">
          Votre commande <span className="font-semibold text-ink">{order.order_number}</span> est
          enregistrée. Notre équipe vous appellera pour confirmer.
        </p>
      </div>

      <div className="mx-auto mt-10 max-w-xl space-y-5">
        <div className="grid gap-3 sm:grid-cols-3">
          {steps.map((s, i) => (
            <div key={i} className="rounded-2xl bg-sand p-4 text-center">
              <div className="mx-auto grid h-7 w-7 place-items-center rounded-full bg-ink text-xs font-bold text-white">{i + 1}</div>
              <p className="mt-3 text-sm font-semibold text-ink">{s.title}</p>
              <p className="mt-1 text-xs text-muted">{s.text}</p>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-line p-5 sm:p-6">
          <h2 className="text-base font-semibold text-ink">Détail de la commande</h2>
          <div className="mt-4 space-y-2">
            {order.items.map((it, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-muted">{it.name} <span className="text-muted/70">× {it.quantity}</span></span>
                <span className="font-semibold text-ink">{formatTND(it.unit_price * it.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 space-y-2 border-t border-line pt-4 text-sm">
            <div className="flex justify-between text-muted"><span>Sous-total</span><span>{formatTND(order.subtotal)}</span></div>
            {order.discount_amount > 0 && (
              <div className="flex justify-between text-ink"><span>Réduction{order.discount_code ? ` (${order.discount_code})` : ""}</span><span>−{formatTND(order.discount_amount)}</span></div>
            )}
            <div className="flex justify-between text-muted"><span>Livraison</span><span>{order.delivery_fee === 0 ? "Offerte" : formatTND(order.delivery_fee)}</span></div>
            <div className="flex justify-between border-t border-line pt-2 text-base font-semibold text-ink"><span>Total à payer à la livraison</span><span>{formatTND(order.total)}</span></div>
          </div>
          <div className="mt-5 grid gap-2 border-t border-line pt-4 text-sm text-muted sm:grid-cols-2">
            <p className="flex items-center gap-2"><Phone className="h-4 w-4" /> {order.phone}</p>
            <p className="flex items-center gap-2"><MapPin className="h-4 w-4" /> {[order.city, order.governorate].filter(Boolean).join(", ")}</p>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/boutique" className="btn-primary group w-full sm:w-auto">
            Continuer mes achats
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
          {settings.shop_phone && (
            <a href={telHref(settings.shop_phone)} className="btn-outline w-full sm:w-auto">Nous appeler</a>
          )}
        </div>
      </div>
    </div>
  );
}
