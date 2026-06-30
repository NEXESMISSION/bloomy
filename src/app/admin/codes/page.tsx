import AdminShell from "@/components/admin/AdminShell";
import CodesAdmin from "@/components/admin/CodesAdmin";
import { listCodes } from "@/lib/data/discounts";
import { listOrders } from "@/lib/data/orders";

export const dynamic = "force-dynamic";

export default async function CodesPage() {
  const [allCodes, orders] = await Promise.all([listCodes(), listOrders()]);
  // Les codes à usage unique générés par la roulette (un par gagnant) ne sont
  // PAS des codes marketing : on les masque ici pour éviter les "doublons".
  const codes = allCodes.filter((c) => c.source !== "Roulette");
  const wonCount = allCodes.length - codes.length;

  return (
    <AdminShell>
      <div className="mb-7">
        <h1 className="text-2xl font-semibold text-ink sm:text-3xl">Codes promo</h1>
        <p className="mt-1 text-sm text-muted">
          Créez des codes, limitez leur nombre d'utilisations, suivez qui les utilise et d'où
          viennent vos clients.
        </p>
        {wonCount > 0 && (
          <p className="mt-2 text-xs text-muted">
            {wonCount} code{wonCount > 1 ? "s" : ""} à usage unique gagné{wonCount > 1 ? "s" : ""} via la roulette
            {" "}ne {wonCount > 1 ? "sont" : "est"} pas affiché{wonCount > 1 ? "s" : ""} ici (voir Roulette → gagnants).
          </p>
        )}
      </div>
      <CodesAdmin codes={codes} orders={orders} />
    </AdminShell>
  );
}
