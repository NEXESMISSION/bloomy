import AdminShell from "@/components/admin/AdminShell";
import StaffAdmin from "@/components/admin/StaffAdmin";
import { listStaff } from "@/lib/data/staff";
import { getCurrentStaff } from "@/lib/staffSession";
import { isSupabaseConfigured } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function EquipePage() {
  const me = await getCurrentStaff();
  const staff = await listStaff();

  return (
    <AdminShell>
      <div className="mb-7">
        <h1 className="text-2xl font-semibold text-ink sm:text-3xl">Équipe</h1>
        <p className="mt-1 text-sm text-muted">
          Donnez à chaque membre un code PIN pour se connecter. Chaque action est tracée (qui a fait quoi).
        </p>
      </div>

      {!isSupabaseConfigured ? (
        <div className="rounded-2xl border border-line bg-sand p-6 text-sm text-ink">
          Cette fonctionnalité nécessite Supabase.
        </div>
      ) : me?.role !== "owner" ? (
        <div className="rounded-2xl border border-line bg-sand p-6 text-sm text-ink">
          La gestion de l'équipe est réservée au propriétaire.
        </div>
      ) : (
        <StaffAdmin staff={staff} />
      )}
    </AdminShell>
  );
}
