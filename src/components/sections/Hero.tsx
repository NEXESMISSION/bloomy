"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import type { Banner } from "@/lib/types";
import { cn } from "@/lib/utils";

const ease = [0.22, 1, 0.36, 1] as const;

// Bannière par défaut quand l'admin n'en a configuré aucune.
const DEFAULT_BANNER: Banner = {
  id: "default",
  image: "/photos/lineup.png",
  mobile_image: null,
  title: "Vos parfums préférés, à prix Bloomy.",
  subtitle: "Quatre eaux de toilette inspirées des plus grands · Livraison partout en Tunisie.",
  cta_label: "Découvrir la collection",
  cta_href: "/boutique",
  sort_order: 0,
  active: true,
};

const variants = {
  enter: (d: number) => ({ opacity: 0, x: d > 0 ? 60 : -60 }),
  center: { opacity: 1, x: 0 },
  exit: (d: number) => ({ opacity: 0, x: d > 0 ? -60 : 60 }),
};

function Slide({ slide, priority }: { slide: Banner; priority: boolean }) {
  const hasText = !!(slide.title || slide.subtitle || slide.cta_label);
  const alt = slide.title ?? "Bannière Bloomy";
  // Image desktop (paysage) + image mobile dédiée (portrait, sinon repli desktop).
  // Les `sizes` à 0px côté masqué évitent de télécharger l'image cachée.
  const picture = (
    <>
      <Image
        src={slide.image}
        alt={alt}
        fill
        priority={priority}
        sizes="(max-width:640px) 0px, 1200px"
        className="hidden object-cover sm:block"
      />
      <Image
        src={slide.mobile_image || slide.image}
        alt={alt}
        fill
        priority={priority}
        sizes="(max-width:640px) 100vw, 0px"
        className="object-cover sm:hidden"
      />
    </>
  );

  return (
    <div className="absolute inset-0">
      {/* Image plein cadre. Cliquable si un lien est défini et qu'il n'y a pas de bouton. */}
      {slide.cta_href && !hasText ? (
        <Link href={slide.cta_href} className="absolute inset-0">
          {picture}
        </Link>
      ) : (
        picture
      )}

      {hasText && (
        <>
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/20 to-transparent sm:bg-gradient-to-r sm:from-ink/75 sm:via-ink/25 sm:to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-5 sm:inset-y-0 sm:right-auto sm:flex sm:max-w-lg sm:items-center sm:p-12">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease, delay: 0.12 }}
            >
              {slide.title && (
                <h1 className="font-display text-2xl font-semibold leading-tight text-white drop-shadow-sm sm:text-5xl">
                  {slide.title}
                </h1>
              )}
              {slide.subtitle && <p className="mt-2 max-w-md text-sm text-white/85 sm:text-base">{slide.subtitle}</p>}
              {slide.cta_label && slide.cta_href && (
                <Link
                  href={slide.cta_href}
                  className="group mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-[0.95rem] font-semibold text-ink transition hover:bg-white/90 sm:w-auto"
                >
                  {slide.cta_label}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              )}
            </motion.div>
          </div>
        </>
      )}
    </div>
  );
}

export default function Hero({ banners }: { banners: Banner[] }) {
  const slides = banners.length ? banners : [DEFAULT_BANNER];
  const [[index, dir], setState] = useState<[number, number]>([0, 0]);
  const paused = useRef(false);

  const go = (target: number, d: number) => setState([(target + slides.length) % slides.length, d]);

  useEffect(() => {
    if (slides.length <= 1) return;
    const id = setInterval(() => {
      if (!paused.current) setState(([i]) => [(i + 1) % slides.length, 1]);
    }, 5000);
    return () => clearInterval(id);
  }, [slides.length]);

  const slide = slides[Math.min(index, slides.length - 1)];

  return (
    <section className="container-bloomy pt-6 sm:pt-10">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease }}
        onMouseEnter={() => (paused.current = true)}
        onMouseLeave={() => (paused.current = false)}
        className="relative overflow-hidden rounded-3xl bg-surface"
      >
        <div className="relative aspect-[4/5] w-full sm:aspect-[16/7]">
          <AnimatePresence initial={false} custom={dir}>
            <motion.div
              key={slide.id}
              custom={dir}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.6, ease }}
              className="absolute inset-0"
            >
              <Slide slide={slide} priority={index === 0} />
            </motion.div>
          </AnimatePresence>

          {slides.length > 1 && (
            <>
              <button
                onClick={() => go(index - 1, -1)}
                aria-label="Précédent"
                className="absolute left-3 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-white/40 bg-ink/30 text-white backdrop-blur transition hover:bg-ink/50 sm:grid"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={() => go(index + 1, 1)}
                aria-label="Suivant"
                className="absolute right-3 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-white/40 bg-ink/30 text-white backdrop-blur transition hover:bg-ink/50 sm:grid"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
              <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
                {slides.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => go(i, i > index ? 1 : -1)}
                    aria-label={`Bannière ${i + 1}`}
                    className={cn(
                      "h-2 rounded-full transition-all",
                      i === index ? "w-5 bg-white" : "w-2 bg-white/50 hover:bg-white/80",
                    )}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </motion.div>
    </section>
  );
}
