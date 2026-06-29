import AdminShell from "@/components/admin/AdminShell";
import OrdersAdmin from "@/components/admin/OrdersAdmin";
import { listOrders } from "@/lib/data/orders";

export const dynamic = "force-dynamic";

export default async function CommandesPage() {
  const orders = await listOrders();
  return (
    <AdminShell>
      <div className="mb-7">
        <h1 className="text-2xl font-semibold text-ink sm:text-3xl">Commandes</h1>
        <p className="mt-1 text-sm text-muted">
          Gérez les commandes, mettez à jour leur statut et contactez vos clients.
        </p>
      </div>
      <OrdersAdmin orders={orders} />
    </AdminShell>
  );
}
