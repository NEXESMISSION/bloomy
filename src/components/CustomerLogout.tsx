"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Loader2 } from "lucide-react";
import { logoutCustomer } from "@/app/account-actions";

export default function CustomerLogout() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <button
      onClick={() => startTransition(async () => { await logoutCustomer(); router.replace("/"); router.refresh(); })}
      disabled={pending}
      className="inline-flex items-center gap-2 rounded-xl border border-line px-3.5 py-2 text-sm text-muted transition hover:text-ink"
    >
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />} Se déconnecter
    </button>
  );
}
