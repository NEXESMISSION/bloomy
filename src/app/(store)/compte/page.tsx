import type { Metadata } from "next";
import Link from "next/link";
import { Package, Gift, Ticket, ShoppingBag } from "lucide-react";
import CustomerAuth from "@/components/CustomerAuth";
import CustomerLogout from "@/components/CustomerLogout";
import { getCurrentCustomer } from "@/lib/customerSession";
import { listOrdersByCustomer } from "@/lib/data/orders";
import { listWinsByCustomer } from "@/lib/data/roulette";
import { formatTND, formatDateFR } from "@/lib/utils";
import { ORDER_STATUSES } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Mon compte",
  robots: { index: false, follow: false },
};

export default async function ComptePage() {
  const customer = await getCurrentCustomer();

  if (!customer) {
    return (
      <div className="container-bloomy py-12 sm:py-16">
        <CustomerAuth />
      </div>
    );
  }

  const [orders, wins] = await Promise.all([
    listOrdersByCustomer(customer.id, customer.phone),
    listWinsByCustomer(customer.id),
  ]);
  const prizeWins = wins.filter((w) => w.type !== "none");

  return (
    <div className="container-bloomy py-10 sm:py-14">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="eyebrow">Mon compte</span>
          <h1 className="mt-2 text-3xl sm:text-4xl">Bonjour {customer.name.split(" ")[0]} 👋</h1>
          <p className="mt-2 text-sm text-muted">{customer.phone}{customer.email ? ` · ${customer.email}` : ""}</p>
        </div>
        <CustomerLogout />
      </div>

      {/* Gains de la roue de la chance */}
      <section className="mb-8">
        <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-ink"><Gift className="h-5 w-5" /> Mes gains</h2>
        {prizeWins.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line bg-white p-6 text-sm text-muted">
            Pas encore de gain. Tentez votre chance avec la roue 🎁 (bouton en bas à droite du site).
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {prizeWins.map((w) => (
              <div key={w.id} className="flex items-center gap-3 rounded-2xl border border-line bg-white p-4">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-ink/5 text-ink">
                  {w.type === "code" ? <Ticket className="h-5 w-5" /> : <Gift className="h-5 w-5" />}
                </span>
                <div className="min-w-0">
                  <p className="font-semibold text-ink">{w.prize_label}</p>
                  {w.type === "code" && w.code ? (
                    <p className="mt-0.5 font-mono text-sm tracking-wider text-ink">{w.code}</p>
                  ) : (
                    <p className="text-xs text-muted">Notre équipe vous contactera pour la remise.</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Historique des commandes */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-ink"><Package className="h-5 w-5" /> Mes commandes</h2>
        {orders.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line bg-white p-8 text-center text-sm text-muted">
            <ShoppingBag className="mx-auto mb-2 h-6 w-6 text-muted" />
            Aucune commande pour l'instant.
            <div className="mt-4"><Link href="/boutique" className="btn-primary">Découvrir la boutique</Link></div>
          </div>
        ) : (
          <div className="space-y-2.5">
            {orders.map((o) => {
              const st = ORDER_STATUSES.find((s) => s.value === o.status);
              return (
                <div key={o.id} className="rounded-2xl border border-line bg-white p-4">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                    <Link href={`/commande/${o.order_number}`} className="font-semibold text-ink underline-offset-2 hover:underline">{o.order_number}</Link>
                    <span className="text-xs text-muted">{formatDateFR(o.created_at)}</span>
                    <span className="ml-auto font-semibold text-ink">{formatTND(o.total)}</span>
                    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium" style={{ background: `${st?.color}1a`, color: st?.color }}>
                      {st?.label ?? o.status}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-muted">{o.items.map((it) => `${it.name} ×${it.quantity}`).join(" · ")}</p>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
