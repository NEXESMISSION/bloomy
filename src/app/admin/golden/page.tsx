import AdminShell from "@/components/admin/AdminShell";
import GoldenAdmin from "@/components/admin/GoldenAdmin";
import { listGoldenBatches, processGoldenExpiries } from "@/lib/data/golden";
import { isSupabaseConfigured } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function GoldenPage() {
  const batches = await listGoldenBatches();
  // Réconciliation paresseuse des expirations à l'ouverture de l'admin.
  await Promise.all(batches.filter((b) => b.active).map((b) => processGoldenExpiries(b.id).catch(() => 0)));
  const fresh = await listGoldenBatches();

  return (
    <AdminShell>
      <div className="mb-7">
        <h1 className="text-2xl font-semibold text-ink sm:text-3xl">Golden Ticket</h1>
        <p className="mt-1 text-sm text-muted">
          Générez des QR codes uniques et sécurisés. Un gagnant tiré au sort ; si le gain n’est pas réclamé à temps,
          il est réattribué automatiquement à un autre ticket.
        </p>
      </div>

      {!isSupabaseConfigured ? (
        <div className="rounded-2xl border border-line bg-sand p-6 text-sm text-ink">
          Cette fonctionnalité nécessite Supabase (base de données). Configurez vos clés pour l’activer.
        </div>
      ) : (
        <GoldenAdmin batches={fresh} />
      )}
    </AdminShell>
  );
}
