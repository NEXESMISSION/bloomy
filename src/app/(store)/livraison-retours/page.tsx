import type { Metadata } from "next";
import Link from "next/link";
import { getSettings } from "@/lib/data/settings";
import { formatTND } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Livraison & Retours",
  description: "Délais, frais de livraison et conditions de retour chez Bloomy.",
};

export default async function LivraisonRetoursPage() {
  const s = await getSettings();
  return (
    <div className="container-bloomy max-w-3xl py-12 sm:py-16">
      <span className="eyebrow">Informations</span>
      <h1 className="mt-3 text-4xl sm:text-5xl">Livraison &amp; Retours</h1>
      <div className="mt-8 space-y-6 text-sm leading-relaxed text-muted">
        <Section title="Livraison partout en Tunisie">
          Nous livrons dans les 24 gouvernorats. Délai habituel : <strong>24 à 72 h</strong> après confirmation de votre commande
          par téléphone.
        </Section>

        <Section title="Frais de livraison">
          Les frais s'élèvent à <strong>{formatTND(s.delivery_fee)}</strong>.{" "}
          {s.free_delivery_threshold > 0 && (
            <>La livraison est <strong>offerte</strong> à partir de <strong>{formatTND(s.free_delivery_threshold)}</strong> d'achat.</>
          )}
        </Section>

        <Section title="Paiement à la livraison">
          Vous payez <strong>en espèces, à la réception</strong> du colis. Aucun paiement en ligne n'est requis. Vérifiez votre
          produit devant le livreur.
        </Section>

        <Section title="Retours & échanges">
          Si un produit est <strong>endommagé ou non conforme</strong>, refusez-le à la livraison ou contactez-nous sous{" "}
          <strong>48 h</strong>. Pour des raisons d'hygiène, un parfum ouvert/utilisé ne peut être ni repris ni échangé, sauf défaut.
        </Section>

        <Section title="Une question ?">
          Notre équipe est là pour vous —{" "}
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
