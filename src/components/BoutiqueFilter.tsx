"use client";

import { useMemo, useState } from "react";
import type { Product } from "@/lib/types";
import ProductCard from "@/components/ProductCard";
import { cn } from "@/lib/utils";

export default function BoutiqueFilter({ products }: { products: Product[] }) {
  const [gender, setGender] = useState("all");
  const [season, setSeason] = useState("all");
  const [type, setType] = useState("all");
  const [packsOnly, setPacksOnly] = useState(false);

  const types = useMemo(
    () => Array.from(new Set(products.map((p) => p.product_type).filter(Boolean))) as string[],
    [products],
  );
  const hasGender = useMemo(() => products.some((p) => p.gender === "homme" || p.gender === "femme"), [products]);
  const hasSeason = useMemo(() => products.some((p) => p.season === "ete" || p.season === "hiver"), [products]);
  const hasPacks = useMemo(() => products.some((p) => p.is_pack), [products]);

  const list = useMemo(
    () =>
      products.filter((p) => {
        if (gender !== "all" && p.gender !== gender && p.gender !== "mixte") return false;
        if (season !== "all" && p.season !== season && p.season !== "toutes") return false;
        if (type !== "all" && p.product_type !== type) return false;
        if (packsOnly && !p.is_pack) return false;
        return true;
      }),
    [products, gender, season, type, packsOnly],
  );

  return (
    <div>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
        {hasGender && (
          <Group value={gender} onChange={setGender} options={[["all", "Tous"], ["homme", "Homme"], ["femme", "Femme"]]} />
        )}
        {hasSeason && (
          <Group value={season} onChange={setSeason} options={[["all", "Toutes saisons"], ["ete", "Été"], ["hiver", "Hiver"]]} />
        )}
        {types.map((t) => (
          <Chip key={t} active={type === t} onClick={() => setType(type === t ? "all" : t)}>{t}</Chip>
        ))}
        {hasPacks && <Chip active={packsOnly} onClick={() => setPacksOnly((v) => !v)}>Packs</Chip>}
      </div>

      {list.length === 0 ? (
        <p className="mt-12 text-center text-muted">Aucun produit pour ce filtre.</p>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-9 sm:gap-x-6 lg:grid-cols-4">
          {list.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </div>
  );
}

function Group({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: [string, string][] }) {
  return (
    <div className="inline-flex rounded-full border border-line bg-white p-0.5">
      {options.map(([v, label]) => (
        <button
          key={v}
          onClick={() => onChange(v)}
          className={cn("rounded-full px-3 py-1.5 text-xs font-medium transition", value === v ? "bg-ink text-white" : "text-muted hover:text-ink")}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn("rounded-full border px-3.5 py-2 text-xs font-medium transition", active ? "border-ink bg-ink text-white" : "border-line bg-white text-muted hover:text-ink")}
    >
      {children}
    </button>
  );
}
