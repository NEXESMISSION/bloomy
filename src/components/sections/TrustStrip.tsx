import { Truck, ShieldCheck, BadgeCheck } from "lucide-react";

const ITEMS = [
  { icon: Truck, title: "Livraison 24–72h", sub: "Partout en Tunisie" },
  { icon: ShieldCheck, title: "Paiement à la livraison", sub: "Payez en recevant" },
  { icon: BadgeCheck, title: "Authentique · 50 ml", sub: "Longue tenue" },
];

export default function TrustStrip() {
  return (
    <section className="border-y border-line bg-sand">
      <div className="container-bloomy grid divide-y divide-line sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        {ITEMS.map((i) => (
          <div key={i.title} className="flex items-center gap-3 py-5 sm:justify-center">
            <i.icon className="h-5 w-5 shrink-0 text-ink" strokeWidth={1.6} />
            <div>
              <p className="text-sm font-semibold text-ink">{i.title}</p>
              <p className="text-xs text-muted">{i.sub}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
