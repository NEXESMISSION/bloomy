"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Tag,
  Star,
  Gift,
  Images,
  Settings,
  ExternalLink,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { logout } from "@/app/admin/actions";
import { cn } from "@/lib/utils";

const NAV = [
  { label: "Tableau de bord", href: "/admin", icon: LayoutDashboard },
  { label: "Bannières", href: "/admin/bannieres", icon: Images },
  { label: "Commandes", href: "/admin/commandes", icon: ShoppingCart },
  { label: "Produits", href: "/admin/produits", icon: Package },
  { label: "Codes promo", href: "/admin/codes", icon: Tag },
  { label: "Roulette", href: "/admin/roulette", icon: Gift },
  { label: "Avis", href: "/admin/avis", icon: Star },
  { label: "Paramètres", href: "/admin/parametres", icon: Settings },
];

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const doLogout = async () => {
    await logout();
    router.replace("/admin/login");
    router.refresh();
  };

  const Sidebar = (
    <div className="flex h-full flex-col gap-2 p-4">
      <Link href="/admin" className="mb-4 flex items-center gap-2 px-2 py-2">
        <Image src="/brand/bloomy-wordmark-dark.png" alt="Bloomy" width={1163} height={533} className="h-5 w-auto" />
        <span className="rounded-md bg-ink px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">Admin</span>
      </Link>

      <nav className="flex flex-col gap-1">
        {NAV.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                active ? "bg-ink text-white" : "text-muted hover:bg-white hover:text-ink",
              )}
            >
              <item.icon className="h-[18px] w-[18px]" strokeWidth={1.7} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-1 border-t border-line pt-3">
        <a href="/" target="_blank" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted transition hover:bg-white hover:text-ink">
          <ExternalLink className="h-[18px] w-[18px]" /> Voir le site
        </a>
        <button onClick={doLogout} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-red-600 transition hover:bg-red-50">
          <LogOut className="h-[18px] w-[18px]" /> Déconnexion
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-64 shrink-0 border-r border-line bg-sand lg:block">
        <div className="sticky top-0 h-screen">{Sidebar}</div>
      </aside>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-ink/30" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-64 border-r border-line bg-sand">{Sidebar}</aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-line px-4 py-3 lg:hidden">
          <button onClick={() => setOpen(true)} className="grid h-10 w-10 place-items-center rounded-xl border border-line">
            <Menu className="h-5 w-5" />
          </button>
          <Image src="/brand/bloomy-wordmark-dark.png" alt="Bloomy" width={1163} height={533} className="h-5 w-auto" />
          <div className="w-10" />
        </header>
        <main className="flex-1 p-5 sm:p-8">{children}</main>
      </div>
    </div>
  );
}
