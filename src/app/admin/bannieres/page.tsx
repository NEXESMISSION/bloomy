import AdminShell from "@/components/admin/AdminShell";
import BannersAdmin from "@/components/admin/BannersAdmin";
import { listBanners } from "@/lib/data/banners";

export const dynamic = "force-dynamic";

export default async function BannersPage() {
  const banners = await listBanners();
  return (
    <AdminShell>
      <div className="mb-7">
        <h1 className="text-2xl font-semibold text-ink sm:text-3xl">Bannières</h1>
        <p className="mt-1 text-sm text-muted">
          Gérez le carrousel animé en haut de la page d’accueil — images, textes et boutons.
        </p>
      </div>
      <BannersAdmin banners={banners} />
    </AdminShell>
  );
}
