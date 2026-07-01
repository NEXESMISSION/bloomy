"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

/**
 * Bouton « Retour » intelligent (mobile uniquement).
 *
 * Anti-boucle : on ne fait `router.back()` QUE si l'utilisateur a réellement
 * navigué dans le site pendant cette session (compteur en sessionStorage). Sinon
 * — arrivée directe depuis Google / Instagram / une IA, ou 1re page — on renvoie
 * vers la page PARENT logique (jamais vers l'extérieur, jamais de va-et-vient).
 * Masqué sur l'accueil (rien derrière).
 */

const KEY = "bloomy_navcount";

/** Page parent logique selon le chemin courant (fallback déterministe, sans boucle). */
function parentOf(path: string): string {
  if (path.startsWith("/produit/")) return "/boutique";
  if (path.startsWith("/commander")) return "/boutique";
  if (path.startsWith("/commande/")) return "/";
  if (path.startsWith("/boutique")) return "/";
  return "/"; // contact, à-propos, compte, pages légales…
}

export default function BackButton() {
  const pathname = usePathname();
  const router = useRouter();

  // Compte chaque navigation interne (rend `router.back()` sûr).
  useEffect(() => {
    try {
      const n = Number(sessionStorage.getItem(KEY) || "0");
      sessionStorage.setItem(KEY, String(n + 1));
    } catch {}
  }, [pathname]);

  if (pathname === "/") return null; // pas de retour depuis l'accueil

  const goBack = () => {
    let inAppHistory = false;
    try {
      inAppHistory = Number(sessionStorage.getItem(KEY) || "0") > 1 && window.history.length > 1;
    } catch {}
    if (inAppHistory) router.back();
    else router.push(parentOf(pathname));
  };

  return (
    <div className="md:hidden">
      <div className="container-bloomy pt-3">
        <button
          onClick={goBack}
          aria-label="Retour à la page précédente"
          className="inline-flex items-center gap-1 rounded-full border border-line bg-white px-3.5 py-2 text-sm font-medium text-muted shadow-sm transition hover:text-ink active:scale-95"
        >
          <ChevronLeft className="h-4 w-4" strokeWidth={2} />
          Retour
        </button>
      </div>
    </div>
  );
}
