import AdminShell from "@/components/admin/AdminShell";
import DepotTabs from "@/components/admin/DepotTabs";
import DisplaysAdmin from "@/components/admin/DisplaysAdmin";
import { listDisplays, nextDisplayCode } from "@/lib/data/consignment";

export const dynamic = "force-dynamic";

export default async function DepotDisplaysPage() {
  const [displays, next] = await Promise.all([listDisplays(), nextDisplayCode()]);
  return (
    <AdminShell variant="crm">
      <div className="mb-7">
        <h1 className="text-2xl font-semibold text-ink sm:text-3xl">Displays</h1>
        <p className="mt-1 text-sm text-muted">Chaque présentoir a son code. Vous savez toujours où se trouve chaque display.</p>
      </div>
      <DepotTabs />
      <DisplaysAdmin displays={displays} nextCode={next} />
    </AdminShell>
  );
}
