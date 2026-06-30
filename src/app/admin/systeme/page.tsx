import AdminShell from "@/components/admin/AdminShell";
import SuperAdmin from "@/components/admin/SuperAdmin";
import { getCurrentStaff } from "@/lib/staffSession";
import { listStaff } from "@/lib/data/staff";
import { listCustomersWithStats } from "@/lib/data/customers";
import { listActivity } from "@/lib/data/activity";
import { getStats } from "@/lib/data/orders";

export const dynamic = "force-dynamic";

export default async function SystemePage() {
  const me = await getCurrentStaff();

  return (
    <AdminShell variant="store">
      <div className="mb-7">
        <h1 className="text-2xl font-semibold text-ink sm:text-3xl">Super Admin</h1>
        <p className="mt-1 text-sm text-muted">Contrôle total : comptes équipe &amp; clients, et journal d'activité complet.</p>
      </div>

      {!me?.isSuperAdmin ? (
        <div className="rounded-2xl border border-line bg-sand p-6 text-sm text-ink">
          Cet espace est réservé au <strong>super administrateur</strong> (le compte principal). Les autres membres
          n'y ont pas accès.
        </div>
      ) : (
        <SuperAdminLoader />
      )}
    </AdminShell>
  );
}

async function SuperAdminLoader() {
  const [staff, customers, activity, stats] = await Promise.all([
    listStaff(),
    listCustomersWithStats(),
    listActivity(500),
    getStats(),
  ]);
  return (
    <SuperAdmin
      staff={staff}
      customers={customers}
      activity={activity}
      stats={{ orders: stats.total, revenue: stats.revenue }}
    />
  );
}
