import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getCurrentStaff } from "@/lib/staffSession";

export const metadata: Metadata = {
  title: "Admin · Bloomy",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = headers().get("x-pathname") || "";
  // Re-valide l'identité côté serveur sur chaque page protégée (sauf le login) :
  // un membre supprimé/désactivé (getCurrentStaff → null) perd l'accès immédiatement,
  // sans attendre l'expiration du cookie (7 jours).
  if (pathname !== "/admin/login") {
    const me = await getCurrentStaff();
    if (!me) redirect("/admin/login");
  }
  return <div className="min-h-screen bg-white text-ink">{children}</div>;
}
