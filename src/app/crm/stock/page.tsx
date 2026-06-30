import AdminShell from "@/components/admin/AdminShell";
import StockAdmin from "@/components/admin/StockAdmin";
import { getProducts } from "@/lib/data/products";
import { listRestock } from "@/lib/data/restock";
import { listStaff } from "@/lib/data/staff";
import { isSupabaseConfigured } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function StockPage() {
  const [products, restock, staff] = await Promise.all([getProducts(), listRestock(), listStaff()]);
  const staffById = Object.fromEntries(staff.map((s) => [s.id, s.name]));

  return (
    <AdminShell variant="crm">
      <div className="mb-7">
        <h1 className="text-2xl font-semibold text-ink sm:text-3xl">Stock & Réappro</h1>
        <p className="mt-1 text-sm text-muted">
          Suivez vos stocks et demandez à l'équipe de préparer du réapprovisionnement. « Terminé » remet le stock à jour.
        </p>
      </div>
      {!isSupabaseConfigured ? (
        <div className="rounded-2xl border border-line bg-sand p-6 text-sm text-ink">Cette fonctionnalité nécessite Supabase.</div>
      ) : (
        <StockAdmin products={products} restock={restock} staffById={staffById} />
      )}
    </AdminShell>
  );
}
