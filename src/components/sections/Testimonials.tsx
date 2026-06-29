import { Star, Quote } from "lucide-react";
import type { Review } from "@/lib/types";
import { Reveal } from "@/components/ui/Reveal";

function Stars({ rating, className = "" }: { rating: number; className?: string }) {
  return (
    <div className={`flex gap-0.5 ${className}`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={i < rating ? "h-4 w-4 fill-accent text-accent" : "h-4 w-4 text-line"}
          strokeWidth={1.6}
        />
      ))}
    </div>
  );
}

export default function Testimonials({ reviews }: { reviews: Review[] }) {
  if (!reviews.length) return null;

  const avg = Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10;

  return (
    <section className="border-t border-line bg-sand py-16 sm:py-20">
      <div className="container-bloomy">
        <Reveal>
          <div className="text-center">
            <span className="eyebrow">Ils nous font confiance</span>
            <h2 className="mt-3 text-3xl sm:text-4xl">Ce que disent nos clients</h2>
            <div className="mt-4 flex items-center justify-center gap-3">
              <Stars rating={Math.round(avg)} />
              <span className="text-sm text-muted">
                <span className="font-semibold text-ink">{avg}/5</span> · {reviews.length} avis
              </span>
            </div>
          </div>
        </Reveal>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {reviews.slice(0, 6).map((r, i) => (
            <Reveal key={r.id} delay={(i % 3) * 0.08}>
              <figure className="relative h-full rounded-2xl border border-line bg-white p-6">
                <Quote className="absolute right-5 top-5 h-6 w-6 text-line" />
                <Stars rating={r.rating} />
                <blockquote className="mt-3 text-sm leading-relaxed text-ink">“{r.comment}”</blockquote>
                <figcaption className="mt-4 flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-ink text-sm font-semibold text-white">
                    {r.author_name.trim().charAt(0).toUpperCase()}
                  </span>
                  <span className="text-sm font-semibold text-ink">{r.author_name}</span>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
