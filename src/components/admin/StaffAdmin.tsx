"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2, Pencil, Trash2, KeyRound, Crown, User, X } from "lucide-react";
import type { StaffMember, StaffRole } from "@/lib/data/staff";
import { createStaffAction, updateStaffAction, deleteStaffAction } from "@/app/admin/actions";
import { cn } from "@/lib/utils";

export default function StaffAdmin({ staff }: { staff: StaffMember[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState<StaffMember | null>(null);
  const [adding, setAdding] = useState(false);

  const toggle = (s: StaffMember) =>
    startTransition(async () => {
      await updateStaffAction(s.id, { active: !s.active });
      router.refresh();
    });
  const del = (s: StaffMember) => {
    if (!confirm(`Supprimer ${s.name} ? Son historique d'activité est conservé.`)) return;
    startTransition(async () => {
      await deleteStaffAction(s.id);
      router.refresh();
    });
  };

  return (
    <div>
      <div className="mb-5 flex justify-end">
        <button onClick={() => setAdding(true)} className="btn-primary">
          <Plus className="h-4 w-4" /> Ajouter un membre
        </button>
      </div>

      {staff.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-white p-10 text-center text-sm text-muted">
          Aucun membre. Ajoutez votre équipe : chacun aura son code PIN pour se connecter.
        </div>
      ) : (
        <div className="space-y-2.5">
          {staff.map((s) => (
            <div key={s.id} className={cn("flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl border bg-white p-4", s.active ? "border-line" : "border-line opacity-60")}>
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-sm font-semibold text-white" style={{ background: s.color }}>
                {s.name.trim().charAt(0).toUpperCase() || "?"}
              </span>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 font-semibold text-ink">
                  {s.name}
                  {s.role === "owner" ? <Crown className="h-3.5 w-3.5 text-accent" /> : <User className="h-3.5 w-3.5 text-muted" />}
                </p>
                <p className="text-xs text-muted">{s.role === "owner" ? "Propriétaire" : "Équipe"}</p>
              </div>
              <button onClick={() => toggle(s)} disabled={pending} className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", s.active ? "bg-green-100 text-green-700" : "bg-sand text-muted")}>
                {s.active ? "Actif" : "Inactif"}
              </button>
              <button onClick={() => setEditing(s)} className="grid h-8 w-8 place-items-center rounded-lg border border-line text-muted hover:text-ink"><Pencil className="h-4 w-4" /></button>
              <button onClick={() => del(s)} disabled={pending} className="grid h-8 w-8 place-items-center rounded-lg border border-red-200 text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
            </div>
          ))}
        </div>
      )}

      {(adding || editing) && (
        <StaffModal
          member={editing}
          pending={pending}
          onClose={() => {
            setAdding(false);
            setEditing(null);
          }}
          onSave={(data) =>
            startTransition(async () => {
              try {
                if (editing) await updateStaffAction(editing.id, data);
                else await createStaffAction({ name: data.name!, pin: data.pin!, role: data.role!, color: data.color });
                setAdding(false);
                setEditing(null);
                router.refresh();
              } catch (e: any) {
                alert(e?.message ?? "Erreur");
              }
            })
          }
        />
      )}
    </div>
  );
}

const COLORS = ["#17171B", "#1E5BFF", "#9b87f5", "#E7B567", "#22c55e", "#ef4444", "#0ea5e9", "#D4A24A"];

function StaffModal({
  member,
  pending,
  onClose,
  onSave,
}: {
  member: StaffMember | null;
  pending: boolean;
  onClose: () => void;
  onSave: (d: { name?: string; pin?: string; role?: StaffRole; color?: string }) => void;
}) {
  const [name, setName] = useState(member?.name ?? "");
  const [pin, setPin] = useState("");
  const [role, setRole] = useState<StaffRole>(member?.role ?? "staff");
  const [color, setColor] = useState(member?.color ?? "#17171B");
  const isNew = !member;

  return (
    <div className="fixed inset-0 z-[80] grid place-items-center p-4">
      <div className="absolute inset-0 bg-ink/40" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-3xl border border-line bg-white p-6 shadow-pop sm:p-8">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-ink">{isNew ? "Nouveau membre" : `Modifier ${member!.name}`}</h2>
          <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full border border-line text-muted hover:text-ink"><X className="h-5 w-5" /></button>
        </div>

        <div className="space-y-4">
          <L label="Nom"><input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Prénom Nom" /></L>
          <L label={isNew ? "Code PIN (4 à 8 chiffres)" : "Nouveau PIN (laisser vide = inchangé)"}>
            <div className="relative">
              <KeyRound className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input className="input pl-10 tracking-[0.3em]" inputMode="numeric" value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 8))} placeholder="••••" />
            </div>
          </L>
          <L label="Rôle">
            <select className="input" value={role} onChange={(e) => setRole(e.target.value as StaffRole)}>
              <option value="staff">Équipe (accès opérationnel)</option>
              <option value="owner">Propriétaire (accès complet)</option>
            </select>
          </L>
          <L label="Couleur">
            <div className="flex flex-wrap gap-2">
              {COLORS.map((c) => (
                <button key={c} type="button" onClick={() => setColor(c)} className={cn("h-8 w-8 rounded-full ring-2 ring-offset-2", color === c ? "ring-ink" : "ring-transparent")} style={{ background: c }} />
              ))}
            </div>
          </L>
        </div>

        <div className="mt-7 flex justify-end gap-3">
          <button onClick={onClose} className="btn-outline">Annuler</button>
          <button
            onClick={() => onSave({ name, role, color, pin: pin || undefined })}
            disabled={pending || !name.trim() || (isNew && pin.length < 4)}
            className="btn-primary"
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enregistrer"}
          </button>
        </div>
      </div>
    </div>
  );
}

function L({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-muted">{label}</span>
      {children}
    </label>
  );
}
