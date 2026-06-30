"use client";

import { useMemo, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Search, Plus, Pencil, Trash2, Phone, MapPin, ChevronDown, Loader2, X, ImagePlus,
  Store, User, HandCoins, Wallet, Users, ShoppingBag,
} from "lucide-react";
import type { ClientWithStats, ClientInput, ClientKind } from "@/lib/data/clients";
import type { Note } from "@/lib/data/notes";
import { saveClientAction, removeClientAction, recordPaymentAction } from "@/app/admin/backoffice-actions";
import { uploadImage } from "@/app/admin/actions";
import NotesPanel from "@/components/admin/NotesPanel";
import { formatTND, formatDateFR, cn } from "@/lib/utils";

const BLANK: ClientInput = {
  kind: "particulier", name: "", phone: "", email: "", governorate: "", city: "", address: "",
  photo_url: "", location_note: "", credit_limit: 0, tags: [], notes: "",
};

export default function ClientsAdmin({ clients, notesByClient }: { clients: ClientWithStats[]; notesByClient: Record<string, Note[]> }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<"all" | ClientKind>("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [editing, setEditing] = useState<ClientInput | null>(null);
  const [paying, setPaying] = useState<ClientWithStats | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return clients.filter(
      (c) =>
        (kind === "all" || c.kind === kind) &&
        (!q || c.name.toLowerCase().includes(q) || (c.phone ?? "").includes(q) || (c.city ?? "").toLowerCase().includes(q)),
    );
  }, [clients, query, kind]);

  const totals = useMemo(
    () => ({
      count: clients.length,
      shops: clients.filter((c) => c.kind === "boutique").length,
      toCollect: clients.reduce((s, c) => s + c.balance, 0),
      sales: clients.reduce((s, c) => s + c.total_sales, 0),
    }),
    [clients],
  );

  const del = (c: ClientWithStats) => {
    if (!confirm(`Supprimer ${c.name} ?`)) return;
    start(async () => {
      await removeClientAction(c.id, c.name);
      router.refresh();
    });
  };

  return (
    <div>
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={Users} label="Clients" value={String(totals.count)} />
        <Stat icon={Store} label="Boutiques" value={String(totals.shops)} />
        <Stat icon={Wallet} label="Ventes totales" value={formatTND(totals.sales)} />
        <Stat icon={HandCoins} label="À récupérer" value={formatTND(totals.toCollect)} highlight={totals.toCollect > 0} />
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Nom, téléphone, ville…" className="input py-2.5 pl-10" />
        </div>
        <div className="flex items-center gap-2">
          {(["all", "particulier", "boutique"] as const).map((k) => (
            <button key={k} onClick={() => setKind(k)} className={cn("rounded-full border px-3 py-1.5 text-xs font-medium", kind === k ? "border-ink bg-ink text-white" : "border-line bg-white text-muted hover:text-ink")}>
              {k === "all" ? "Tous" : k === "particulier" ? "Particuliers" : "Boutiques"}
            </button>
          ))}
          <button onClick={() => setEditing({ ...BLANK })} className="btn-primary shrink-0"><Plus className="h-4 w-4" /> Nouveau</button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-white py-16 text-center text-muted">Aucun client.</div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((c) => {
            const open = expanded === c.id;
            return (
              <div key={c.id} className={cn("overflow-hidden rounded-2xl border bg-white", open ? "border-ink/30" : "border-line")}>
                <button onClick={() => setExpanded(open ? null : c.id)} className="flex w-full flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3.5 text-left">
                  <span className="relative grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-xl bg-sand text-ink">
                    {c.photo_url ? <Image src={c.photo_url} alt="" fill className="object-cover" sizes="44px" /> : c.kind === "boutique" ? <Store className="h-5 w-5" /> : <User className="h-5 w-5" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1.5 font-semibold text-ink">
                      {c.name}
                      <span className="rounded-full bg-sand px-1.5 py-0.5 text-[10px] font-medium text-muted">{c.kind === "boutique" ? "Boutique" : "Particulier"}</span>
                    </p>
                    <p className="truncate text-xs text-muted">{[c.phone, c.city].filter(Boolean).join(" · ") || "—"}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-ink">{formatTND(c.total_sales)}</p>
                    {c.balance > 0 && <p className="text-xs font-medium text-amber-600">{formatTND(c.balance)} à récupérer</p>}
                  </div>
                  <ChevronDown className={cn("h-4 w-4 text-muted transition-transform", open && "rotate-180")} />
                </button>

                {open && (
                  <div className="border-t border-line bg-sand px-4 py-4">
                    <div className="grid gap-5 lg:grid-cols-[1.1fr_1fr]">
                      <div className="space-y-3">
                        {c.photo_url && (
                          <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl bg-white">
                            <Image src={c.photo_url} alt={c.name} fill className="object-cover" sizes="500px" />
                          </div>
                        )}
                        <div className="flex flex-wrap gap-2 text-xs">
                          {c.phone && <a href={`tel:${c.phone}`} className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-ink"><Phone className="h-3.5 w-3.5" /> {c.phone}</a>}
                          {(c.city || c.governorate || c.address) && <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-muted"><MapPin className="h-3.5 w-3.5" /> {[c.address, c.city, c.governorate].filter(Boolean).join(", ")}</span>}
                          {c.tags.map((t) => <span key={t} className="rounded-full bg-white px-2.5 py-1 text-muted">{t}</span>)}
                        </div>
                        {c.location_note && <p className="text-sm text-muted">📍 {c.location_note}</p>}
                        <div className="flex flex-wrap items-center gap-3 rounded-xl bg-white p-3 text-sm">
                          <span className="flex items-center gap-1.5 text-muted"><ShoppingBag className="h-4 w-4" /> {c.sales_count} vente(s)</span>
                          <span className="text-muted">Acheté : <b className="text-ink">{formatTND(c.total_sales)}</b></span>
                          <span className="text-muted">Payé : <b className="text-ink">{formatTND(c.total_paid)}</b></span>
                          <span className={cn(c.balance > 0 ? "text-amber-700" : "text-green-700")}>Solde : <b>{formatTND(c.balance)}</b></span>
                        </div>
                        <div className="flex gap-2">
                          {c.balance > 0 && <button onClick={() => setPaying(c)} className="btn-primary px-4 py-2 text-sm"><HandCoins className="h-4 w-4" /> Encaisser</button>}
                          <button onClick={() => setEditing({ ...c })} className="btn-outline px-4 py-2 text-sm"><Pencil className="h-4 w-4" /> Modifier</button>
                          <button onClick={() => del(c)} disabled={pending} className="grid h-9 w-9 place-items-center rounded-lg border border-red-200 text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </div>
                      <NotesPanel entityType="client" entityId={c.id} notes={notesByClient[c.id] ?? []} />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {editing && (
        <ClientModal client={editing} pending={pending} onClose={() => setEditing(null)} onSave={(data) => start(async () => { try { await saveClientAction(data); setEditing(null); router.refresh(); } catch (e: any) { alert(e?.message ?? "Erreur"); } })} />
      )}
      {paying && (
        <PaymentModal client={paying} pending={pending} onClose={() => setPaying(null)} onSave={(amount, note) => start(async () => { try { await recordPaymentAction({ client_id: paying.id, amount, note }); setPaying(null); router.refresh(); } catch (e: any) { alert(e?.message ?? "Erreur"); } })} />
      )}
    </div>
  );
}

function Stat({ icon: Icon, label, value, highlight }: { icon: any; label: string; value: string; highlight?: boolean }) {
  return (
    <div className={cn("rounded-2xl border p-5", highlight ? "border-amber-200 bg-amber-50/60" : "border-line bg-white")}>
      <Icon className={cn("h-5 w-5", highlight ? "text-amber-600" : "text-muted")} strokeWidth={1.6} />
      <p className="mt-3 text-2xl font-semibold text-ink">{value}</p>
      <p className="text-sm text-muted">{label}</p>
    </div>
  );
}

function ClientModal({ client, pending, onClose, onSave }: { client: ClientInput; pending: boolean; onClose: () => void; onSave: (c: ClientInput) => void }) {
  const [form, setForm] = useState<ClientInput>(client);
  const set = (p: Partial<ClientInput>) => setForm((f) => ({ ...f, ...p }));
  const [uploading, setUploading] = useState(false);
  const isNew = !client.id;

  const upload = async (file: File) => {
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await uploadImage(fd);
    setUploading(false);
    if (res.ok) set({ photo_url: res.url });
    else alert(res.error);
  };

  return (
    <div className="fixed inset-0 z-[80] grid place-items-center p-4">
      <div className="absolute inset-0 bg-ink/40" onClick={onClose} />
      <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-line bg-white p-6 shadow-pop sm:p-8">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-ink">{isNew ? "Nouveau client" : `Modifier ${client.name}`}</h2>
          <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full border border-line text-muted hover:text-ink"><X className="h-5 w-5" /></button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <L label="Type" full>
            <div className="grid grid-cols-2 gap-2">
              {(["particulier", "boutique"] as const).map((k) => (
                <button key={k} type="button" onClick={() => set({ kind: k })} className={cn("flex items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-medium", form.kind === k ? "border-ink bg-ink text-white" : "border-line text-muted")}>
                  {k === "boutique" ? <Store className="h-4 w-4" /> : <User className="h-4 w-4" />}
                  {k === "boutique" ? "Boutique" : "Particulier"}
                </button>
              ))}
            </div>
          </L>
          <L label="Nom" full><input className="input" value={form.name} onChange={(e) => set({ name: e.target.value })} placeholder={form.kind === "boutique" ? "Nom de la boutique" : "Prénom Nom"} /></L>
          <L label="Photo du lieu (optionnel)" full>
            <div className="flex items-start gap-3">
              <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-xl bg-surface">
                {form.photo_url && <Image src={form.photo_url} alt="" fill className="object-cover" sizes="112px" />}
              </div>
              <label className="btn-outline inline-flex cursor-pointer">
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />} Photo
                <input type="file" accept="image/*" className="hidden" onChange={async (e) => { const f = e.target.files?.[0]; if (f) await upload(f); e.target.value = ""; }} />
              </label>
            </div>
          </L>
          <L label="Téléphone"><input className="input" value={form.phone ?? ""} onChange={(e) => set({ phone: e.target.value })} /></L>
          <L label="Email"><input className="input" value={form.email ?? ""} onChange={(e) => set({ email: e.target.value })} /></L>
          <L label="Gouvernorat"><input className="input" value={form.governorate ?? ""} onChange={(e) => set({ governorate: e.target.value })} /></L>
          <L label="Ville"><input className="input" value={form.city ?? ""} onChange={(e) => set({ city: e.target.value })} /></L>
          <L label="Adresse" full><input className="input" value={form.address ?? ""} onChange={(e) => set({ address: e.target.value })} /></L>
          <L label="Repère / note de lieu (pour s'en souvenir)" full><input className="input" value={form.location_note ?? ""} onChange={(e) => set({ location_note: e.target.value })} placeholder="à côté de la pharmacie…" /></L>
          <L label="Étiquettes (virgules)" full><input className="input" value={form.tags.join(", ")} onChange={(e) => set({ tags: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} placeholder="VIP, revendeur…" /></L>
        </div>

        <div className="mt-7 flex justify-end gap-3">
          <button onClick={onClose} className="btn-outline">Annuler</button>
          <button onClick={() => onSave(form)} disabled={pending || !form.name.trim()} className="btn-primary">{pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enregistrer"}</button>
        </div>
      </div>
    </div>
  );
}

function PaymentModal({ client, pending, onClose, onSave }: { client: ClientWithStats; pending: boolean; onClose: () => void; onSave: (amount: number, note: string) => void }) {
  const [amount, setAmount] = useState(client.balance);
  const [note, setNote] = useState("");
  return (
    <div className="fixed inset-0 z-[80] grid place-items-center p-4">
      <div className="absolute inset-0 bg-ink/40" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-3xl border border-line bg-white p-6 shadow-pop">
        <h2 className="text-lg font-semibold text-ink">Encaisser — {client.name}</h2>
        <p className="mt-1 text-sm text-muted">Solde dû : <b className="text-amber-700">{formatTND(client.balance)}</b></p>
        <div className="mt-4 space-y-3">
          <L label="Montant reçu (DT)"><input type="number" step="0.001" className="input" value={amount} onChange={(e) => setAmount(Number(e.target.value))} autoFocus /></L>
          <L label="Note (optionnel)"><input className="input" value={note} onChange={(e) => setNote(e.target.value)} /></L>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="btn-outline">Annuler</button>
          <button onClick={() => onSave(amount, note)} disabled={pending || !(amount > 0)} className="btn-primary">{pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Encaisser"}</button>
        </div>
      </div>
    </div>
  );
}

function L({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <label className={cn("block", full && "sm:col-span-2")}>
      <span className="mb-1.5 block text-xs font-medium text-muted">{label}</span>
      {children}
    </label>
  );
}
