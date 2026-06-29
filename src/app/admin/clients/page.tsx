import AdminShell from "@/components/admin/AdminShell";
import ClientsAdmin from "@/components/admin/ClientsAdmin";
import { getClients } from "@/lib/data/clients";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  const clients = await getClients();
  return (
    <AdminShell>
      <div className="mb-7">
        <h1 className="text-2xl font-semibold text-ink sm:text-3xl">Clients</h1>
        <p className="mt-1 text-sm text-muted">
          Votre CRM : chaque client, son historique de commandes, son chiffre d'affaires et ce qu'il
          reste à encaisser.
        </p>
      </div>
      <ClientsAdmin clients={clients} />
    </AdminShell>
  );
}
