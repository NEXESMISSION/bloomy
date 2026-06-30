"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Home, Compass } from "lucide-react";

const REDIRECT_S = 6;

export default function NotFound() {
  const router = useRouter();
  const [count, setCount] = useState(REDIRECT_S);

  useEffect(() => {
    const tick = setInterval(() => setCount((c) => Math.max(0, c - 1)), 1000);
    const go = setTimeout(() => router.replace("/"), REDIRECT_S * 1000);
    return () => {
      clearInterval(tick);
      clearTimeout(go);
    };
  }, [router]);

  return (
    <main className="grid min-h-[100svh] place-items-center bg-sand px-5">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md rounded-3xl border border-line bg-white p-8 text-center shadow-soft sm:p-10"
      >
        <Image src="/brand/bloomy-wordmark-dark.png" alt="Bloomy" width={1163} height={533} className="mx-auto h-6 w-auto" />

        <div className="mx-auto mt-8 grid h-16 w-16 place-items-center rounded-2xl bg-sand text-muted">
          <Compass className="h-8 w-8" />
        </div>

        <p className="mt-5 font-display text-5xl font-semibold leading-none text-ink">404</p>
        <h1 className="mt-3 text-xl font-semibold text-ink">Cette page n’existe pas (ou plus)</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Le lien est peut-être expiré ou incorrect. Pas d’inquiétude, on vous ramène à l’accueil.
        </p>

        <Link href="/" className="btn-primary mt-7 w-full">
          <Home className="h-4 w-4" /> Retour à l’accueil
        </Link>

        <p className="mt-3 text-xs text-muted">Redirection automatique dans {count}&nbsp;s…</p>
      </motion.div>
    </main>
  );
}
