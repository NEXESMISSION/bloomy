import AdminShell from "@/components/admin/AdminShell";
import DepotTabs from "@/components/admin/DepotTabs";
import ConsignmentProductsAdmin from "@/components/admin/ConsignmentProductsAdmin";
import { getInventory } from "@/lib/data/consignment";

export const dynamic = "force-dynamic";

export default async function DepotProduitsPage() {
  const products = await getInventory();
  return (
    <AdminShell variant="crm">
      <div className="mb-7">
        <h1 className="text-2xl font-semibold text-ink sm:text-3xl">Produits dépôt-vente</h1>
        <p className="mt-1 text-sm text-muted">Vos parfums de marque propre : coût, prix, commission et stock entrepôt.</p>
      </div>
      <DepotTabs />
      <ConsignmentProductsAdmin products={products} />
    </AdminShell>
  );
}
