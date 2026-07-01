"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Store, Boxes, PackageCheck, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { label: "Tableau", href: "/crm/depot", icon: LayoutDashboard, exact: true },
  { label: "Boutiques", href: "/crm/depot/boutiques", icon: Store },
  { label: "Rapports", href: "/crm/depot/rapports", icon: BarChart3 },
  { label: "Displays", href: "/crm/depot/displays", icon: Boxes },
  { label: "Produits", href: "/crm/depot/produits", icon: PackageCheck },
];

export default function DepotTabs() {
  const p = usePathname();
  return (
    <div className="mb-6 flex flex-wrap gap-2">
      {TABS.map((t) => {
        const active = t.exact ? p === t.href : p.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium transition",
              active ? "border-ink bg-ink text-white" : "border-line bg-white text-muted hover:text-ink",
            )}
          >
            <t.icon className="h-4 w-4" /> {t.label}
          </Link>
        );
      })}
    </div>
  );
}
