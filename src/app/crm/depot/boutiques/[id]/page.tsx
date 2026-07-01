import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import ShopDetail from "@/components/admin/ShopDetail";
import { getShop, getActivePlacement, listDisplays, listConsignmentProducts, listVisits } from "@/lib/data/consignment";

export const dynamic = "force-dynamic";

export default async function ShopDetailPage({ params }: { params: { id: string } }) {
  const shop = await getShop(params.id);
  if (!shop) notFound();
  const [placement, displays, products, visits] = await Promise.all([
    getActivePlacement(params.id),
    listDisplays(),
    listConsignmentProducts(false),
    listVisits(params.id, 30),
  ]);
  const availableDisplays = displays.filter((d) => d.status === "available");

  return (
    <AdminShell variant="crm">
      <Link href="/crm/depot/boutiques" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted transition hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> Toutes les boutiques
      </Link>
      <ShopDetail
        shop={shop}
        placement={placement}
        availableDisplays={availableDisplays}
        products={products}
        visits={visits}
      />
    </AdminShell>
  );
}
