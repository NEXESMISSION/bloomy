import AdminShell from "@/components/admin/AdminShell";
import ProductsAdmin from "@/components/admin/ProductsAdmin";
import { getAllProducts } from "@/lib/data/products";

export const dynamic = "force-dynamic";

export default async function ProduitsPage() {
  const products = await getAllProducts();
  return (
    <AdminShell>
      <div className="mb-7">
        <h1 className="text-2xl font-semibold text-ink sm:text-3xl">Produits</h1>
        <p className="mt-1 text-sm text-muted">Ajoutez, modifiez et gérez votre catalogue de parfums.</p>
      </div>
      <ProductsAdmin products={products} />
    </AdminShell>
  );
}
