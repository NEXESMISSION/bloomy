import { Truck, ShieldCheck, BadgeCheck } from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";

const ITEMS = [
  { icon: Truck, title: "Livraison 24–72h", sub: "Partout en Tunisie" },
  { icon: ShieldCheck, title: "Paiement à la livraison", sub: "Payez en recevant" },
  { icon: BadgeCheck, title: "Authentique · 50 ml", sub: "Longue tenue" },
];

export default function TrustStrip() {
  return (
    <section className="border-y border-line bg-sand">
      <div className="container-bloomy grid divide-y divide-line sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        {ITEMS.map((i, idx) => (
          <Reveal key={i.title} delay={idx * 0.08} y={14}>
            <div className="flex items-center gap-4 py-7 sm:justify-center sm:py-8">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-line bg-white text-ink">
                <i.icon className="h-5 w-5" strokeWidth={1.6} />
              </span>
              <div>
                <p className="text-sm font-semibold text-ink">{i.title}</p>
                <p className="mt-0.5 text-xs text-muted">{i.sub}</p>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
