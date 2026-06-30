import AdminShell from "@/components/admin/AdminShell";
import ClientsAdmin from "@/components/admin/ClientsAdmin";
import { listClients } from "@/lib/data/clients";
import { listNotes, type Note } from "@/lib/data/notes";
import { isSupabaseConfigured } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  const [clients, notes] = await Promise.all([listClients(), listNotes("client")]);
  const notesByClient: Record<string, Note[]> = {};
  for (const n of notes) {
    if (!n.entity_id) continue;
    (notesByClient[n.entity_id] ??= []).push(n);
  }

  return (
    <AdminShell variant="crm">
      <div className="mb-7">
        <h1 className="text-2xl font-semibold text-ink sm:text-3xl">Clients & Boutiques</h1>
        <p className="mt-1 text-sm text-muted">
          Vos clients et points de vente : coordonnées, photo du lieu, historique, solde dû et notes.
        </p>
      </div>
      {!isSupabaseConfigured ? (
        <div className="rounded-2xl border border-line bg-sand p-6 text-sm text-ink">Cette fonctionnalité nécessite Supabase.</div>
      ) : (
        <ClientsAdmin clients={clients} notesByClient={notesByClient} />
      )}
    </AdminShell>
  );
}
