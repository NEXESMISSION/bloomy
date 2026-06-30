"use client";

import { useMemo, useState } from "react";
import { LayoutDashboard, UserCog, Users, History, Search, ShieldCheck } from "lucide-react";
import type { StaffMember } from "@/lib/data/staff";
import type { CustomerWithStats } from "@/lib/data/customers";
import type { Activity } from "@/lib/data/activity";
import StaffAdmin from "@/components/admin/StaffAdmin";
import CustomersAdmin from "@/components/admin/CustomersAdmin";
import { formatDateFR, cn } from "@/lib/utils";

type Tab = "overview" | "team" | "customers" | "log";

export default function SuperAdmin({
  staff,
  customers,
  activity,
  stats,
}: {
  staff: StaffMember[];
  customers: CustomerWithStats[];
  activity: Activity[];
  stats: { orders: number; revenue: number };
}) {
  const [tab, setTab] = useState<Tab>("overview");

  const activeStaff = staff.filter((s) => s.active).length;
  const cards = [
    { label: "Comptes équipe", value: `${activeStaff}/${staff.length}`, hint: "actifs / total", icon: UserCog, tab: "team" as Tab },
    { label: "Comptes clients", value: customers.length, hint: "inscrits", icon: Users, tab: "customers" as Tab },
    { label: "Commandes", value: stats.orders, hint: `${stats.revenue.toFixed(3)} DT`, icon: LayoutDashboard, tab: null },
    { label: "Journal", value: activity.length, hint: "événements récents", icon: History, tab: "log" as Tab },
  ];

  const tabs: { id: Tab; label: string; icon: typeof Users }[] = [
    { id: "overview", label: "Vue d'ensemble", icon: LayoutDashboard },
    { id: "team", label: "Comptes équipe", icon: UserCog },
    { id: "customers", label: "Comptes clients", icon: Users },
    { id: "log", label: "Journal complet", icon: History },
  ];

  return (
    <div>
      <div className="mb-6 flex items-start gap-3 rounded-2xl border border-ink/15 bg-ink/[0.03] p-4">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-ink" />
        <p className="text-sm text-ink">
          <span className="font-semibold">Espace Super Admin</span> — réservé à votre compte. Vous contrôlez ici tous
          les comptes (équipe &amp; clients) et consultez le journal complet de toutes les actions.
        </p>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition",
              tab === t.id ? "border-ink bg-ink text-white" : "border-line bg-white text-muted hover:text-ink",
            )}
          >
            <t.icon className="h-4 w-4" /> {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((c) => (
            <button
              key={c.label}
              onClick={() => c.tab && setTab(c.tab)}
              disabled={!c.tab}
              className={cn(
                "rounded-2xl border border-line bg-white p-5 text-left transition",
                c.tab ? "hover:border-ink/30 hover:shadow-sm" : "cursor-default",
              )}
            >
              <c.icon className="h-5 w-5 text-muted" />
              <p className="mt-3 text-2xl font-semibold text-ink">{c.value}</p>
              <p className="text-sm text-ink">{c.label}</p>
              <p className="text-xs text-muted">{c.hint}</p>
            </button>
          ))}
        </div>
      )}

      {tab === "team" && <StaffAdmin staff={staff} />}
      {tab === "customers" && <CustomersAdmin customers={customers} />}
      {tab === "log" && <ActivityLog items={activity} />}
    </div>
  );
}

function ActivityLog({ items }: { items: Activity[] }) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (a) =>
        (a.actor_name ?? "").toLowerCase().includes(q) ||
        a.action.toLowerCase().includes(q) ||
        (a.detail ?? "").toLowerCase().includes(q) ||
        (a.entity_type ?? "").toLowerCase().includes(q),
    );
  }, [items, query]);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Filtrer : auteur, action, détail…" className="input py-2.5 pl-10" />
        </div>
        <span className="shrink-0 text-sm text-muted">{filtered.length} événement{filtered.length > 1 ? "s" : ""}</span>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-white p-10 text-center text-sm text-muted">
          Aucun événement.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-line bg-white">
          <div className="divide-y divide-line">
            {filtered.map((a) => (
              <div key={a.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 text-sm">
                <span className="font-semibold text-ink">{a.actor_name ?? "—"}</span>
                <span className="text-muted">{a.action}</span>
                {a.entity_type && <span className="rounded-full bg-sand px-2 py-0.5 text-[11px] text-muted">{a.entity_type}</span>}
                {a.detail && <span className="truncate text-ink">· {a.detail}</span>}
                <span className="ml-auto shrink-0 text-xs text-muted">{formatDateFR(a.created_at)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
