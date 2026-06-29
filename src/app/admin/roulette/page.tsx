import AdminShell from "@/components/admin/AdminShell";
import RouletteAdmin from "@/components/admin/RouletteAdmin";
import { listPrizes, listWins } from "@/lib/data/roulette";
import { getSettings } from "@/lib/data/settings";

export const dynamic = "force-dynamic";

export default async function RoulettePage() {
  const [prizes, wins, settings] = await Promise.all([listPrizes(), listWins(), getSettings()]);
  return (
    <AdminShell>
      <div className="mb-7">
        <h1 className="text-2xl font-semibold text-ink sm:text-3xl">Roue de la chance</h1>
        <p className="mt-1 text-sm text-muted">
          Gérez les lots et leur probabilité (vous contrôlez le %), activez/désactivez la roue et
          suivez les gagnants.
        </p>
      </div>
      <RouletteAdmin prizes={prizes} wins={wins} enabled={settings.roulette_enabled} />
    </AdminShell>
  );
}
