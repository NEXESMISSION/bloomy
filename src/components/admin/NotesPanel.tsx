"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Send, Trash2, StickyNote } from "lucide-react";
import type { Note } from "@/lib/data/notes";
import { addNoteAction, removeNoteAction } from "@/app/admin/backoffice-actions";
import { formatDateFR } from "@/lib/utils";

export default function NotesPanel({ entityType, entityId, notes }: { entityType: string; entityId: string | null; notes: Note[] }) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [pending, start] = useTransition();

  const add = () => {
    if (!body.trim()) return;
    start(async () => {
      await addNoteAction({ entity_type: entityType, entity_id: entityId, body });
      setBody("");
      router.refresh();
    });
  };
  const del = (id: string) =>
    start(async () => {
      await removeNoteAction(id);
      router.refresh();
    });

  return (
    <div>
      <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
        <StickyNote className="h-3.5 w-3.5" /> Notes
      </p>
      <div className="flex gap-2">
        <input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="Ajouter une note…"
          className="input py-2"
        />
        <button onClick={add} disabled={pending || !body.trim()} className="btn-primary shrink-0 px-3 py-2">
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </button>
      </div>
      <div className="mt-3 space-y-2">
        {notes.length === 0 ? (
          <p className="text-xs text-muted">Aucune note.</p>
        ) : (
          notes.map((n) => (
            <div key={n.id} className="rounded-xl bg-white px-3 py-2 text-sm">
              <p className="text-ink">{n.body}</p>
              <div className="mt-1 flex items-center justify-between text-[11px] text-muted">
                <span>
                  {n.author_name ?? "—"} · {formatDateFR(n.created_at)}
                </span>
                <button onClick={() => del(n.id)} className="text-red-500 hover:text-red-700">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
