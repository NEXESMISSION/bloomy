"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";

/**
 * Indicateur global de navigation (les pages sont rendues à la demande, donc
 * un changement de route peut prendre un instant). Affiche une fine barre de
 * progression + un cercle de chargement dès le clic, et disparaît quand la
 * nouvelle page est montée (changement de pathname).
 */
export default function NavProgress() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const guard = useRef<ReturnType<typeof setTimeout> | null>(null);

  // La nouvelle page est rendue → on cache l'indicateur.
  useEffect(() => {
    setLoading(false);
    if (guard.current) clearTimeout(guard.current);
  }, [pathname]);

  useEffect(() => {
    const start = () => {
      setLoading(true);
      if (guard.current) clearTimeout(guard.current);
      guard.current = setTimeout(() => setLoading(false), 12000); // garde-fou
    };

    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as HTMLElement)?.closest?.("a") as HTMLAnchorElement | null;
      if (!a) return;
      const href = a.getAttribute("href");
      if (!href || a.target === "_blank" || a.hasAttribute("download")) return;
      if (href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;
      let url: URL;
      try {
        url = new URL(href, window.location.href);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;
      start();
    };

    const onPopState = () => start();

    document.addEventListener("click", onClick, true);
    window.addEventListener("popstate", onPopState);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("popstate", onPopState);
    };
  }, []);

  return (
    <AnimatePresence>
      {loading && (
        <>
          <motion.div
            key="bar"
            className="fixed left-0 top-0 z-[100] h-[3px] rounded-r-full bg-accent shadow-[0_0_8px_rgba(212,162,74,0.6)]"
            initial={{ width: "0%" }}
            animate={{ width: ["0%", "40%", "70%", "85%"] }}
            transition={{ duration: 2, times: [0, 0.3, 0.65, 1], ease: "easeOut" }}
            exit={{ width: "100%", opacity: 0, transition: { duration: 0.25 } }}
          />
          <motion.div
            key="spinner"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="pointer-events-none fixed inset-0 z-[100] grid place-items-center"
            aria-hidden
          >
            <div className="grid h-[68px] w-[68px] place-items-center rounded-2xl bg-paper/95 shadow-pop backdrop-blur">
              <span className="block h-8 w-8 animate-spin rounded-full border-[3px] border-line border-t-accent" />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
