import AdminShell from "@/components/admin/AdminShell";
import SalesAdmin from "@/components/admin/SalesAdmin";
import { listSales } from "@/lib/data/sales";
import { listClients } from "@/lib/data/clients";
import { getProducts } from "@/lib/data/products";
import { isSupabaseConfigured } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function VentesPage() {
  const [sales, clients, products] = await Promise.all([listSales(), listClients(), getProducts()]);

  return (
    <AdminShell>
      <div className="mb-7">
        <h1 className="text-2xl font-semibold text-ink sm:text-3xl">Ventes</h1>
        <p className="mt-1 text-sm text-muted">
          Enregistrez vos ventes (boutique, gros, en ligne). Le stock se met à jour et le solde dû est suivi.
        </p>
      </div>
      {!isSupabaseConfigured ? (
        <div className="rounded-2xl border border-line bg-sand p-6 text-sm text-ink">Cette fonctionnalité nécessite Supabase.</div>
      ) : (
        <SalesAdmin sales={sales} clients={clients.map((c) => ({ id: c.id, name: c.name }))} products={products} />
      )}
    </AdminShell>
  );
}
