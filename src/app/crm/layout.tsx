import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentStaff } from "@/lib/staffSession";

export const metadata: Metadata = {
  title: "Gestion · Bloomy",
  robots: { index: false, follow: false },
};

export default async function CrmLayout({ children }: { children: React.ReactNode }) {
  // Re-valide l'identité côté serveur : un membre supprimé/désactivé perd l'accès
  // immédiatement (le cookie signé seul ne suffit pas).
  const me = await getCurrentStaff();
  if (!me) redirect("/admin/login");
  return <>{children}</>;
}
