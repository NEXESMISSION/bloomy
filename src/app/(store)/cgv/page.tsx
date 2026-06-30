import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Conditions générales de vente",
  description: "Les conditions générales de vente de la boutique Bloomy.",
};

export default function CgvPage() {
  return (
    <div className="container-bloomy max-w-3xl py-12 sm:py-16">
      <span className="eyebrow">Légal</span>
      <h1 className="mt-3 text-4xl sm:text-5xl">Conditions générales de vente</h1>
      <div className="mt-8 space-y-6 text-sm leading-relaxed text-muted">
        <Section title="1. Objet">
          Les présentes conditions régissent les ventes réalisées sur le site Bloomy. Toute commande implique l'acceptation pleine et
          entière de ces conditions.
        </Section>
        <Section title="2. Produits">
          Nos parfums sont des eaux de toilette inspirées de grands classiques ; ce sont des créations Bloomy et non les marques
          originales. Les visuels sont non contractuels.
        </Section>
        <Section title="3. Prix">
          Les prix sont indiqués en dinars tunisiens (TND), toutes taxes comprises. Les frais de livraison éventuels sont précisés au
          moment de la commande.
        </Section>
        <Section title="4. Commande & confirmation">
          Toute commande est confirmée par un appel téléphonique de notre équipe. Une commande non confirmable (numéro injoignable)
          peut être annulée.
        </Section>
        <Section title="5. Paiement">
          Le paiement s'effectue <strong>à la livraison</strong>, en espèces, à la réception du colis.
        </Section>
        <Section title="6. Livraison & retours">
          Les modalités sont détaillées sur la page{" "}
          <Link href="/livraison-retours" className="text-ink underline underline-offset-2">Livraison &amp; Retours</Link>.
        </Section>
        <Section title="7. Données personnelles">
          Le traitement de vos données est décrit dans notre{" "}
          <Link href="/confidentialite" className="text-ink underline underline-offset-2">politique de confidentialité</Link>.
        </Section>
        <Section title="8. Contact">
          Pour toute réclamation,{" "}
          <Link href="/contact" className="text-ink underline underline-offset-2">contactez-nous</Link>.
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="mb-1.5 text-base font-semibold text-ink">{title}</h2>
      <p>{children}</p>
    </div>
  );
}
