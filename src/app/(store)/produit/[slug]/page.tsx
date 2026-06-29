import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Truck, ShieldCheck, RotateCcw, ChevronRight, Star } from "lucide-react";
import { getProductBySlug, getProducts } from "@/lib/data/products";
import { getApprovedReviews, getReviewStats } from "@/lib/data/reviews";
import { getSettings } from "@/lib/data/settings";
import { formatTND, inspirationOf, formatDateFR, cn } from "@/lib/utils";
import AddToCart from "@/components/AddToCart";
import ProductCard from "@/components/ProductCard";
import ReviewForm from "@/components/ReviewForm";
import ProductGallery from "@/components/ProductGallery";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const product = await getProductBySlug(params.slug);
  if (!product) return { title: "Produit introuvable" };
  return { title: product.name, description: `${product.tagline} 50ml.` };
}

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const product = await getProductBySlug(params.slug);
  if (!product) notFound();

  const all = await getProducts();
  const related = all.filter((p) => p.slug !== product.slug).slice(0, 4);
  const [reviews, stats, settings] = await Promise.all([
    getApprovedReviews(product.slug),
    getReviewStats(product.slug),
    getSettings(),
  ]);
  const images = [product.image, ...(product.gallery ?? [])].filter(
    (v, i, a) => v && a.indexOf(v) === i,
  );
  const discount =
    product.compare_at_price && product.compare_at_price > product.price
      ? Math.round((1 - product.price / product.compare_at_price) * 100)
      : 0;
  const tiers = [
    { label: "Tête", notes: product.notes_top },
    { label: "Cœur", notes: product.notes_heart },
    { label: "Fond", notes: product.notes_base },
  ];

  return (
    <div className="container-bloomy py-6 sm:py-10">
      <nav className="flex items-center gap-1.5 py-3 text-xs text-muted">
        <Link href="/" className="hover:text-ink">Accueil</Link>
        <ChevronRight className="h-3 w-3" />
        <Link href="/boutique" className="hover:text-ink">Boutique</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-ink">{product.name}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
        {/* visuel */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="relative">
            <ProductGallery images={images} alt={product.name} />
            {discount > 0 && (
              <span className="absolute left-4 top-4 z-10 rounded-full bg-ink px-3 py-1 text-xs font-semibold text-white">−{discount}%</span>
            )}
          </div>
        </div>

        {/* infos */}
        <div>
          <p className="eyebrow">{inspirationOf(product)}</p>
          <h1 className="mt-2 text-3xl sm:text-4xl">{product.name}</h1>
          {stats.count > 0 ? (
            <div className="mt-3 flex items-center gap-2 text-sm text-muted">
              <span className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={cn("h-3.5 w-3.5", i < Math.round(stats.avg) ? "fill-accent text-accent" : "text-line")} />
                ))}
              </span>
              {stats.avg.toFixed(1).replace(".", ",")} · {stats.count} avis
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted">Pas encore d'avis</p>
          )}

          <div className="mt-5 flex items-baseline gap-3">
            <span className="text-3xl font-semibold text-ink">{formatTND(product.price)}</span>
            {product.compare_at_price && <span className="text-lg text-muted line-through">{formatTND(product.compare_at_price)}</span>}
          </div>

          <p className="mt-5 max-w-prose text-[15px] leading-relaxed text-muted">{product.description}</p>

          <div className="mt-7"><AddToCart product={product} withQty withBuyNow /></div>

          <div className="mt-6 grid grid-cols-3 gap-3 border-y border-line py-5 text-center">
            {[
              { icon: Truck, t: "Livraison 24–72h" },
              { icon: ShieldCheck, t: "Paiement livraison" },
              { icon: RotateCcw, t: "Échange facile" },
            ].map((b) => (
              <div key={b.t} className="flex flex-col items-center gap-2">
                <b.icon className="h-5 w-5 text-ink" strokeWidth={1.5} />
                <span className="text-[11px] leading-tight text-muted">{b.t}</span>
              </div>
            ))}
          </div>

          {/* composition */}
          <div className="mt-6">
            <h2 className="text-sm font-semibold text-ink">Pyramide olfactive · {product.family}</h2>
            <div className="mt-4 space-y-3">
              {tiers.map((t) => (
                <div key={t.label} className="flex items-start gap-4">
                  <span className="w-12 shrink-0 pt-0.5 text-xs font-semibold uppercase tracking-wide text-muted">{t.label}</span>
                  <div className="flex flex-wrap gap-2">
                    {t.notes.map((n) => (
                      <span key={n} className="rounded-full border border-line px-2.5 py-1 text-xs text-ink">{n}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* avis */}
      {settings.reviews_enabled && (
        <section className="border-t border-line py-12 sm:py-16">
          <h2 className="text-2xl sm:text-3xl">Avis clients</h2>
          <div className="mt-8 grid gap-8 lg:grid-cols-[1.3fr_1fr] lg:gap-12">
            <div className="space-y-5">
              {reviews.length === 0 ? (
                <p className="text-muted">Aucun avis pour le moment. Soyez le premier à donner le vôtre !</p>
              ) : (
                reviews.map((r) => (
                  <div key={r.id} className="border-b border-line pb-5 last:border-0">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold text-ink">{r.author_name}</p>
                      <span className="text-xs text-muted">{formatDateFR(r.created_at)}</span>
                    </div>
                    <div className="mt-1 flex">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={cn("h-4 w-4", i < r.rating ? "fill-accent text-accent" : "text-line")} />
                      ))}
                    </div>
                    <p className="mt-2 text-[15px] leading-relaxed text-muted">{r.comment}</p>
                  </div>
                ))
              )}
            </div>
            <div>
              <ReviewForm productId={product.id} productSlug={product.slug} />
            </div>
          </div>
        </section>
      )}

      {/* liés */}
      <section className="py-16 sm:py-20">
        <h2 className="text-2xl sm:text-3xl">Vous aimerez aussi</h2>
        <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-9 sm:gap-x-6 lg:grid-cols-4">
          {related.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>
    </div>
  );
}
