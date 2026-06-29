import AdminShell from "@/components/admin/AdminShell";
import CodesAdmin from "@/components/admin/CodesAdmin";
import { listCodes } from "@/lib/data/discounts";
import { listOrders } from "@/lib/data/orders";

export const dynamic = "force-dynamic";

export default async function CodesPage() {
  const [codes, orders] = await Promise.all([listCodes(), listOrders()]);
  return (
    <AdminShell>
      <div className="mb-7">
        <h1 className="text-2xl font-semibold text-ink sm:text-3xl">Codes promo</h1>
        <p className="mt-1 text-sm text-muted">
          Créez des codes, limitez leur nombre d'utilisations, suivez qui les utilise et d'où
          viennent vos clients.
        </p>
      </div>
      <CodesAdmin codes={codes} orders={orders} />
    </AdminShell>
  );
}
