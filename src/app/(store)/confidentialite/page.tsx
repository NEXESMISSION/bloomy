import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Politique de confidentialité",
  description: "Comment Bloomy collecte et protège vos données personnelles.",
};

export default function ConfidentialitePage() {
  return (
    <div className="container-bloomy max-w-3xl py-12 sm:py-16">
      <span className="eyebrow">Légal</span>
      <h1 className="mt-3 text-4xl sm:text-5xl">Politique de confidentialité</h1>
      <div className="mt-8 space-y-6 text-sm leading-relaxed text-muted">
        <p>Chez Bloomy, nous respectons votre vie privée. Cette page explique quelles données nous collectons et comment nous les utilisons.</p>

        <Section title="Données que nous collectons">
          Lorsque vous passez commande, nous recueillons votre <strong>nom</strong>, votre <strong>numéro de téléphone</strong>, votre
          <strong> gouvernorat</strong> et votre <strong>adresse de livraison</strong>. Si vous créez un compte, nous conservons aussi
          votre mot de passe sous forme chiffrée (jamais en clair) et, le cas échéant, votre email.
        </Section>

        <Section title="Utilisation des données">
          Vos données servent uniquement à <strong>traiter et livrer vos commandes</strong> (paiement à la livraison), à vous
          contacter pour confirmer une commande, et à améliorer notre service. Nous ne vendons jamais vos données.
        </Section>

        <Section title="Partage">
          Vos coordonnées peuvent être communiquées au <strong>livreur</strong> pour assurer la livraison. En dehors de cela, vos
          données ne sont partagées avec aucun tiers à des fins commerciales.
        </Section>

        <Section title="Cookies & mesure d'audience">
          Le site utilise des cookies techniques (panier, session) et, si activés, des outils de mesure publicitaire (Meta, TikTok)
          pour comprendre l'efficacité de nos campagnes. Vous pouvez les bloquer via votre navigateur.
        </Section>

        <Section title="Vos droits">
          Vous pouvez demander l'accès, la correction ou la suppression de vos données à tout moment en nous{" "}
          <Link href="/contact" className="text-ink underline underline-offset-2">contactant</Link>.
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
