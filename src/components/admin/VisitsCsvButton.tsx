"use client";

import { Download } from "lucide-react";

export type VisitRow = { date: string; shop: string; sold: number; revenue: number; commission: number; collected: number };

export default function VisitsCsvButton({ rows }: { rows: VisitRow[] }) {
  if (!rows.length) return null;

  const exportCsv = () => {
    const head = ["Date", "Boutique", "Vendus", "CA", "Commission", "Encaissé"];
    // Anti-injection de formule (nom de boutique saisi à la main).
    const cell = (c: unknown) => {
      let s = String(c ?? "");
      if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
      return `"${s.replace(/"/g, '""')}"`;
    };
    const body = rows.map((r) => [String(r.date).slice(0, 10), r.shop, r.sold, r.revenue, r.commission, r.collected]);
    const csv = [head, ...body].map((r) => r.map(cell).join(",")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "visites-depot-bloomy.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <button onClick={exportCsv} className="btn-outline shrink-0"><Download className="h-4 w-4" /> Export CSV</button>
  );
}
