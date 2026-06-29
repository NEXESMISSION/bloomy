import AdminShell from "@/components/admin/AdminShell";
import ReviewsAdmin from "@/components/admin/ReviewsAdmin";
import { listReviews } from "@/lib/data/reviews";
import { getAllProducts } from "@/lib/data/products";

export const dynamic = "force-dynamic";

export default async function AvisPage() {
  const [reviews, products] = await Promise.all([listReviews(), getAllProducts()]);
  return (
    <AdminShell>
      <div className="mb-7">
        <h1 className="text-2xl font-semibold text-ink sm:text-3xl">Avis clients</h1>
        <p className="mt-1 text-sm text-muted">Validez ou rejetez les avis avant leur publication sur les fiches produit.</p>
      </div>
      <ReviewsAdmin reviews={reviews} products={products} />
    </AdminShell>
  );
}
