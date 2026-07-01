import AdminShell from "@/components/admin/AdminShell";
import DepotTabs from "@/components/admin/DepotTabs";
import ConsignmentShopsAdmin from "@/components/admin/ConsignmentShopsAdmin";
import { listShops } from "@/lib/data/consignment";

export const dynamic = "force-dynamic";

export default async function DepotBoutiquesPage() {
  const shops = await listShops();
  return (
    <AdminShell variant="crm">
      <div className="mb-7">
        <h1 className="text-2xl font-semibold text-ink sm:text-3xl">Boutiques (dépôt-vente)</h1>
        <p className="mt-1 text-sm text-muted">Les points de vente où vous posez vos displays. Ouvrez une boutique pour compter &amp; réapprovisionner.</p>
      </div>
      <DepotTabs />
      <ConsignmentShopsAdmin shops={shops} />
    </AdminShell>
  );
}
