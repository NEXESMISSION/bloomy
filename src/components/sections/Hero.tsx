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

export default function Hero({ banners }: { banners: Banner[] }) {
  const slides = banners.length ? banners : [DEFAULT_BANNER];
  const [[index, dir], setState] = useState<[number, number]>([0, 0]);
  const paused = useRef(false);

  const go = (target: number, d: number) =>
    setState([(target + slides.length) % slides.length, d]);

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
              <Image
                src={slide.image}
                alt={slide.title ?? "Bannière Bloomy"}
                fill
                priority={index === 0}
                sizes="(max-width:640px) 100vw, 1100px"
                className="object-contain"
              />

              {(slide.title || slide.subtitle || slide.cta_label) && (
                <div className="absolute inset-x-0 bottom-0 p-4 sm:inset-y-0 sm:right-auto sm:flex sm:items-center sm:p-10">
                  <motion.div
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease, delay: 0.15 }}
                    className="max-w-md rounded-2xl bg-paper/85 p-5 backdrop-blur-md sm:p-6"
                  >
                    {slide.title && (
                      <h1 className="text-2xl font-semibold leading-tight text-ink sm:text-4xl">{slide.title}</h1>
                    )}
                    {slide.subtitle && <p className="mt-2 text-sm text-muted sm:text-[15px]">{slide.subtitle}</p>}
                    {slide.cta_label && slide.cta_href && (
                      <Link href={slide.cta_href} className="btn-primary group mt-4 w-full sm:w-auto">
                        {slide.cta_label}
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </Link>
                    )}
                  </motion.div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {slides.length > 1 && (
            <>
              <button
                onClick={() => go(index - 1, -1)}
                aria-label="Précédent"
                className="absolute left-3 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-line bg-paper/80 text-ink backdrop-blur transition hover:bg-paper sm:grid"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={() => go(index + 1, 1)}
                aria-label="Suivant"
                className="absolute right-3 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-line bg-paper/80 text-ink backdrop-blur transition hover:bg-paper sm:grid"
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
                      i === index ? "w-5 bg-ink" : "w-2 bg-ink/30 hover:bg-ink/50",
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
