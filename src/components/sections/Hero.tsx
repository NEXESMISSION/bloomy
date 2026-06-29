"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

const ease = [0.22, 1, 0.36, 1] as const;

export default function Hero() {
  return (
    <section className="container-bloomy pb-4 pt-10 sm:pt-16">
      <div className="mx-auto max-w-2xl text-center">
        <motion.span
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease }}
          className="eyebrow"
        >
          Eau de toilette · 50 ml
        </motion.span>
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease, delay: 0.05 }}
          className="mt-4 text-4xl leading-[1.05] sm:text-6xl"
        >
          Vos parfums préférés,
          <br />
          <span className="italic text-muted">à prix Bloomy.</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease, delay: 0.12 }}
          className="mx-auto mt-5 max-w-md text-[15px] leading-relaxed text-muted"
        >
          Quatre eaux de toilette inspirées des plus grands. Livraison partout en Tunisie,
          paiement à la livraison.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease, delay: 0.18 }}
          className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row"
        >
          <Link href="/boutique" className="btn-primary group w-full sm:w-auto">
            Découvrir la collection
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <Link href="#collection" className="btn-outline w-full sm:w-auto">
            Voir les parfums
          </Link>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease, delay: 0.2 }}
        className="mt-10 overflow-hidden rounded-3xl bg-surface sm:mt-14"
      >
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="relative mx-auto aspect-[5/4] w-full sm:aspect-[16/8]"
        >
          <Image
            src="/photos/lineup.png"
            alt="La collection Bloomy"
            fill
            priority
            sizes="(max-width:640px) 100vw, 1100px"
            className="object-contain"
          />
        </motion.div>
      </motion.div>
    </section>
  );
}
