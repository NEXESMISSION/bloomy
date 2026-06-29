"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Star, Check, X, Trash2 } from "lucide-react";
import type { Product, Review, ReviewStatus } from "@/lib/types";
import { moderateReview, removeReview } from "@/app/admin/actions";
import { formatDateFR, cn } from "@/lib/utils";

const TABS: { value: ReviewStatus | "all"; label: string }[] = [
  { value: "pending", label: "En attente" },
  { value: "approved", label: "Approuvés" },
  { value: "rejected", label: "Rejetés" },
  { value: "all", label: "Tous" },
];

const STATUS_STYLE: Record<ReviewStatus, string> = {
  pending: "bg-amber-100 text-amber-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};
const STATUS_LABEL: Record<ReviewStatus, string> = {
  pending: "En attente",
  approved: "Approuvé",
  rejected: "Rejeté",
};

export default function ReviewsAdmin({ reviews, products }: { reviews: Review[]; products: Product[] }) {
  const router = useRouter();
  const [filter, setFilter] = useState<ReviewStatus | "all">("pending");
  const [pending, startTransition] = useTransition();

  const nameBySlug = useMemo(() => {
    const m = new Map<string, string>();
    products.forEach((p) => m.set(p.slug, p.name));
    return m;
  }, [products]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: reviews.length, pending: 0, approved: 0, rejected: 0 };
    reviews.forEach((r) => (c[r.status] = (c[r.status] ?? 0) + 1));
    return c;
  }, [reviews]);

  const filtered = filter === "all" ? reviews : reviews.filter((r) => r.status === filter);

  const act = (fn: () => Promise<void>) => startTransition(async () => { await fn(); router.refresh(); });

  return (
    <div>
      <div className="mb-5 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setFilter(t.value)}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-xs font-medium transition",
              filter === t.value ? "border-ink bg-ink text-white" : "border-line bg-white text-muted hover:text-ink",
            )}
          >
            {t.label} ({counts[t.value] ?? 0})
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-line bg-white py-16 text-center text-muted">Aucun avis.</div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((r) => (
            <div key={r.id} className="rounded-2xl border border-line bg-white p-4">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <span className="font-semibold text-ink">{r.author_name}</span>
                <span className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={cn("h-4 w-4", i < r.rating ? "fill-accent text-accent" : "text-line")} />
                  ))}
                </span>
                <span className="rounded-full bg-sand px-2.5 py-0.5 text-xs text-muted">
                  {nameBySlug.get(r.product_slug) ?? r.product_slug}
                </span>
                <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", STATUS_STYLE[r.status])}>
                  {STATUS_LABEL[r.status]}
                </span>
                <span className="ml-auto text-xs text-muted">{formatDateFR(r.created_at)}</span>
              </div>
              <p className="mt-2 text-sm text-ink">{r.comment}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {r.status !== "approved" && (
                  <button onClick={() => act(() => moderateReview(r.id, "approved"))} disabled={pending}
                    className="flex items-center gap-1.5 rounded-lg border border-green-200 px-3 py-1.5 text-sm text-green-700 transition hover:bg-green-50">
                    <Check className="h-4 w-4" /> Approuver
                  </button>
                )}
                {r.status !== "rejected" && (
                  <button onClick={() => act(() => moderateReview(r.id, "rejected"))} disabled={pending}
                    className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-sm text-muted transition hover:bg-sand hover:text-ink">
                    <X className="h-4 w-4" /> Rejeter
                  </button>
                )}
                <button onClick={() => { if (confirm("Supprimer cet avis ?")) act(() => removeReview(r.id)); }} disabled={pending}
                  className="flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-600 transition hover:bg-red-50">
                  <Trash2 className="h-4 w-4" /> Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
