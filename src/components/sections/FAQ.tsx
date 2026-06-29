"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, Minus } from "lucide-react";

const FAQS = [
  {
    q: "Comment se passe le paiement ?",
    a: "Aucun paiement en ligne. Vous payez en espèces à la livraison, une fois votre colis reçu. Simple et sans risque.",
  },
  {
    q: "Quels sont les délais de livraison ?",
    a: "Nous livrons partout en Tunisie sous 24 à 72h. Après votre commande, nous vous appelons pour confirmer.",
  },
  {
    q: "Combien coûte la livraison ?",
    a: "7 DT partout en Tunisie, et offerte dès 99 DT d'achat.",
  },
  {
    q: "Les parfums sont-ils de bonne qualité ?",
    a: "Oui. Nos eaux de toilette 50 ml sont conçues avec soin pour offrir une vraie tenue, à un prix accessible.",
  },
  {
    q: "Puis-je échanger un produit ?",
    a: "Si un article ne convient pas ou arrive abîmé, contactez-nous sous 48h : on trouve une solution rapidement.",
  },
];

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section className="container-bloomy py-16 sm:py-20">
      <div className="mx-auto max-w-3xl">
        <div className="text-center">
          <span className="eyebrow">Questions fréquentes</span>
          <h2 className="mt-3 text-3xl sm:text-4xl">On répond à tout.</h2>
        </div>

        <div className="mt-10 divide-y divide-line border-y border-line">
          {FAQS.map((f, i) => {
            const isOpen = open === i;
            return (
              <div key={i}>
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full items-center justify-between gap-4 py-5 text-left"
                >
                  <span className="text-[15px] font-medium text-ink">{f.q}</span>
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-line text-ink">
                    {isOpen ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                  </span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <p className="pb-5 text-sm leading-relaxed text-muted">{f.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
