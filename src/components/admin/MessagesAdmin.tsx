"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Phone, Mail, Check, RotateCcw, Trash2, Inbox } from "lucide-react";
import type { ContactMessage } from "@/lib/data/contact";
import { markMessageHandled, removeMessage } from "@/app/admin/actions";
import { phoneDisplay, telHref, whatsappHref } from "@/lib/phone";
import { formatDateFR, cn } from "@/lib/utils";

export default function MessagesAdmin({ messages }: { messages: ContactMessage[] }) {
  const router = useRouter();
  const [filter, setFilter] = useState<"all" | "new" | "handled">("new");
  const [pending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    if (filter === "new") return messages.filter((m) => !m.handled);
    if (filter === "handled") return messages.filter((m) => m.handled);
    return messages;
  }, [messages, filter]);

  const act = (fn: () => Promise<void>) => startTransition(async () => { await fn(); router.refresh(); });
  const newCount = messages.filter((m) => !m.handled).length;

  return (
    <div>
      <div className="mb-5 flex items-center gap-2">
        {[
          { id: "new" as const, label: `Nouveaux (${newCount})` },
          { id: "handled" as const, label: "Traités" },
          { id: "all" as const, label: "Tous" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setFilter(t.id)}
            className={cn("rounded-full border px-3.5 py-1.5 text-xs font-medium transition", filter === t.id ? "border-ink bg-ink text-white" : "border-line bg-white text-muted hover:text-ink")}
          >
            {t.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-white p-10 text-center text-sm text-muted">
          <Inbox className="mx-auto mb-2 h-6 w-6" /> Aucun message.
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((m) => (
            <div key={m.id} className={cn("rounded-2xl border bg-white p-4", m.handled ? "border-line opacity-70" : "border-ink/30")}>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="font-semibold text-ink">{m.name}</span>
                <a href={telHref(m.phone)} className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink"><Phone className="h-3.5 w-3.5" />{phoneDisplay(m.phone)}</a>
                {m.email && <a href={`mailto:${m.email}`} className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink"><Mail className="h-3.5 w-3.5" />{m.email}</a>}
                <span className="ml-auto text-xs text-muted">{formatDateFR(m.created_at)}</span>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm text-ink">{m.message}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-line pt-3">
                <a href={whatsappHref(m.phone, `Bonjour ${m.name}, c'est Bloomy 👋`)} target="_blank" rel="noreferrer" className="rounded-lg border border-line px-3 py-1.5 text-xs text-ink hover:bg-sand">Répondre sur WhatsApp</a>
                {m.handled ? (
                  <button onClick={() => act(() => markMessageHandled(m.id, false))} disabled={pending} className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-xs text-muted hover:text-ink"><RotateCcw className="h-3.5 w-3.5" /> Rouvrir</button>
                ) : (
                  <button onClick={() => act(() => markMessageHandled(m.id, true))} disabled={pending} className="inline-flex items-center gap-1.5 rounded-lg border border-green-200 px-3 py-1.5 text-xs text-green-700 hover:bg-green-50"><Check className="h-3.5 w-3.5" /> Marquer traité</button>
                )}
                <button onClick={() => { if (confirm("Supprimer ce message ?")) act(() => removeMessage(m.id)); }} disabled={pending} className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50"><Trash2 className="h-3.5 w-3.5" /> Supprimer</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
