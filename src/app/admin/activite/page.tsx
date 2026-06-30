import AdminShell from "@/components/admin/AdminShell";
import { listActivity } from "@/lib/data/activity";
import { getCurrentStaff } from "@/lib/staffSession";
import { formatDateFR } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ActivitePage() {
  const me = await getCurrentStaff();
  const items = me?.role === "owner" ? await listActivity(300) : [];

  return (
    <AdminShell>
      <div className="mb-7">
        <h1 className="text-2xl font-semibold text-ink sm:text-3xl">Activité</h1>
        <p className="mt-1 text-sm text-muted">Qui a fait quoi, et quand. Journal complet de l'équipe.</p>
      </div>

      {me?.role !== "owner" ? (
        <div className="rounded-2xl border border-line bg-sand p-6 text-sm text-ink">
          Le journal d'activité est réservé au propriétaire.
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-white p-10 text-center text-sm text-muted">
          Aucune activité enregistrée pour le moment.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-line bg-white">
          <div className="divide-y divide-line">
            {items.map((a) => (
              <div key={a.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 text-sm">
                <span className="font-semibold text-ink">{a.actor_name ?? "—"}</span>
                <span className="text-muted">{a.action}</span>
                {a.detail && <span className="text-ink">· {a.detail}</span>}
                <span className="ml-auto text-xs text-muted">{formatDateFR(a.created_at)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </AdminShell>
  );
}
