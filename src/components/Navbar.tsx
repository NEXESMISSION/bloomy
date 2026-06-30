"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, ShoppingBag, X, User } from "lucide-react";
import { useCart } from "@/context/cart";
import { site } from "@/lib/site";
import { cn } from "@/lib/utils";

export default function Navbar({ announcement, customerName }: { announcement?: string; customerName?: string | null }) {
  const { count, open } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => setMenuOpen(false), [pathname]);

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md">
      {announcement && (
        <div className="bg-ink px-4 py-2 text-center text-[11px] font-medium tracking-wide text-white">
          {announcement}
        </div>
      )}

      <nav className="container-bloomy flex h-14 items-center justify-between border-b border-line sm:h-16">
        {/* gauche : menu mobile */}
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="-ml-2 grid h-10 w-10 place-items-center rounded-full text-ink md:hidden"
          aria-label="Menu"
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        {/* liens desktop (gauche) */}
        <div className="hidden items-center gap-7 md:flex">
          {site.nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "text-sm transition-colors",
                pathname === item.href ? "text-ink" : "text-muted hover:text-ink",
              )}
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* logo centré */}
        <Link
          href="/"
          className="absolute left-1/2 -translate-x-1/2"
          aria-label="Bloomy — accueil"
        >
          <Image
            src="/brand/bloomy-wordmark-dark.png"
            alt="Bloomy"
            width={1163}
            height={533}
            priority
            className="h-8 w-auto sm:h-10"
          />
        </Link>

        {/* droite : compte + panier */}
        <div className="-mr-2 flex items-center">
          <Link
            href="/compte"
            className="relative grid h-10 w-10 place-items-center rounded-full text-ink"
            aria-label="Mon compte"
            title={customerName ? `Mon compte (${customerName})` : "Mon compte"}
          >
            <User className="h-[19px] w-[19px]" />
            {customerName && (
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-green-500 ring-2 ring-white" />
            )}
          </Link>
          <button
            onClick={open}
            className="relative grid h-10 w-10 place-items-center rounded-full text-ink"
            aria-label="Panier"
          >
            <ShoppingBag className="h-[19px] w-[19px]" />
            {count > 0 && (
              <span className="absolute right-0.5 top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-ink px-1 text-[10px] font-bold text-white">
                {count}
              </span>
            )}
          </button>
        </div>
      </nav>

      {/* menu mobile */}
      {menuOpen && (
        <div className="border-b border-line bg-white md:hidden">
          <div className="container-bloomy flex flex-col py-2">
            {site.nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="border-b border-line/60 py-3 text-[15px] text-ink last:border-0"
              >
                {item.label}
              </Link>
            ))}
            <Link href="/compte" className="flex items-center gap-2 py-3 text-[15px] font-medium text-ink">
              <User className="h-4 w-4" />
              {customerName ? `Mon compte (${customerName.split(" ")[0]})` : "Mon compte / Connexion"}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
