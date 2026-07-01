import AdminShell from "@/components/admin/AdminShell";
import MessagesAdmin from "@/components/admin/MessagesAdmin";
import { listContactMessages } from "@/lib/data/contact";

export const dynamic = "force-dynamic";

export default async function MessagesPage() {
  const messages = await listContactMessages();
  return (
    <AdminShell>
      <div className="mb-7">
        <h1 className="text-2xl font-semibold text-ink sm:text-3xl">Messages</h1>
        <p className="mt-1 text-sm text-muted">Les messages reçus via le formulaire de contact du site.</p>
      </div>
      <MessagesAdmin messages={messages} />
    </AdminShell>
  );
}
