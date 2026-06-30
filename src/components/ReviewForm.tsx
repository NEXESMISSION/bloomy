"use client";

import { useState } from "react";
import { Star, Loader2, Check, AlertCircle } from "lucide-react";
import { submitReview } from "@/app/actions";
import { cn } from "@/lib/utils";

export default function ReviewForm({
  productId,
  productSlug,
}: {
  productId: string | null;
  productSlug: string;
}) {
  const [name, setName] = useState("");
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [hp, setHp] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await submitReview({
      product_id: productId,
      product_slug: productSlug,
      author_name: name,
      rating,
      comment,
      hp,
    });
    setLoading(false);
    if (res.ok) {
      setSent(true);
      setName("");
      setRating(0);
      setComment("");
    } else {
      setError(res.error);
    }
  };

  if (sent) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-line bg-sand p-5 text-sm text-ink">
        <Check className="h-5 w-5 shrink-0 text-green-600" />
        Merci pour votre avis ! Il sera publié après validation.
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-line bg-paper p-5">
      <input type="text" name="company" tabIndex={-1} autoComplete="off" aria-hidden="true" value={hp} onChange={(e) => setHp(e.target.value)} className="hidden" />
      <p className="font-semibold text-ink">Laisser un avis</p>

      <div className="mt-3 flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <button
            key={i}
            type="button"
            onClick={() => setRating(i)}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(0)}
            aria-label={`${i} étoile${i > 1 ? "s" : ""}`}
            className="p-0.5"
          >
            <Star className={cn("h-6 w-6 transition", (hover || rating) >= i ? "fill-accent text-accent" : "text-line")} />
          </button>
        ))}
      </div>

      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Votre nom"
        className="input mt-3"
      />
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={3}
        placeholder="Partagez votre expérience…"
        className="input mt-3 resize-none"
      />

      {error && (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-red-600">
          <AlertCircle className="h-3.5 w-3.5" /> {error}
        </p>
      )}

      <button type="submit" disabled={loading} className="btn-primary mt-4">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Publier mon avis"}
      </button>
    </form>
  );
}
