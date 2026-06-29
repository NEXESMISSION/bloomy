import AdminShell from "@/components/admin/AdminShell";
import SettingsForm from "@/components/admin/SettingsForm";
import { getSettings } from "@/lib/data/settings";

export const dynamic = "force-dynamic";

export default async function ParametresPage() {
  const settings = await getSettings();
  return (
    <AdminShell>
      <div className="mb-7">
        <h1 className="text-2xl font-semibold text-ink sm:text-3xl">Paramètres</h1>
        <p className="mt-1 text-sm text-muted">Livraison, contact et bandeau d'annonce de la boutique.</p>
      </div>
      <SettingsForm settings={settings} />
    </AdminShell>
  );
}
