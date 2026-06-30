"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Check } from "lucide-react";
import type { ShopSettings } from "@/lib/types";
import { saveSettings } from "@/app/admin/actions";
import { cn } from "@/lib/utils";

export default function SettingsForm({ settings }: { settings: ShopSettings }) {
  const router = useRouter();
  const [form, setForm] = useState<ShopSettings>(settings);
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const set = (patch: Partial<ShopSettings>) => setForm((f) => ({ ...f, ...patch }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      await saveSettings(form);
      setSaved(true);
      router.refresh();
      setTimeout(() => setSaved(false), 2500);
    });
  };

  return (
    <form onSubmit={submit} className="max-w-2xl space-y-6">
      <div className="rounded-2xl border border-line bg-white p-6">
        <h2 className="mb-4 font-semibold text-ink">Livraison</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-muted">Frais de livraison (DT)</span>
            <input type="number" step="0.001" className="input" value={form.delivery_fee} onChange={(e) => set({ delivery_fee: Number(e.target.value) })} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-muted">Livraison offerte à partir de (DT)</span>
            <input type="number" step="0.001" className="input" value={form.free_delivery_threshold} onChange={(e) => set({ free_delivery_threshold: Number(e.target.value) })} />
          </label>
        </div>
      </div>

      <div className="rounded-2xl border border-line bg-white p-6">
        <h2 className="mb-4 font-semibold text-ink">Contact</h2>
        <p className="mb-4 text-xs text-muted">
          Ces coordonnées s'affichent automatiquement partout sur le site (pied de page, page contact,
          bouton WhatsApp). Saisissez les numéros au format local à 8 chiffres (ex&nbsp;: 58415520).
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-muted">Téléphone principal (WhatsApp)</span>
            <input className="input" inputMode="tel" value={form.shop_phone} onChange={(e) => set({ shop_phone: e.target.value })} placeholder="58415520" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-muted">Téléphone secondaire</span>
            <input className="input" inputMode="tel" value={form.shop_phone_2} onChange={(e) => set({ shop_phone_2: e.target.value })} placeholder="58415506" />
          </label>
          <label className="block sm:col-span-2">
            <span className="mb-1.5 block text-xs font-medium text-muted">Email de contact</span>
            <input className="input" type="email" value={form.shop_email} onChange={(e) => set({ shop_email: e.target.value })} placeholder="bloomy.tn@gmail.com" />
          </label>
        </div>
      </div>

      <div className="rounded-2xl border border-line bg-white p-6">
        <h2 className="mb-4 font-semibold text-ink">Réseaux sociaux</h2>
        <p className="mb-4 text-xs text-muted">Liens affichés dans le pied de page (laisser vide = icône masquée).</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-muted">Instagram (URL)</span>
            <input className="input" type="url" value={form.shop_instagram} onChange={(e) => set({ shop_instagram: e.target.value })} placeholder="https://instagram.com/votre_page" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-muted">Facebook (URL)</span>
            <input className="input" type="url" value={form.shop_facebook} onChange={(e) => set({ shop_facebook: e.target.value })} placeholder="https://facebook.com/votre_page" />
          </label>
        </div>
      </div>

      <div className="rounded-2xl border border-line bg-white p-6">
        <h2 className="mb-4 font-semibold text-ink">Notifications Telegram</h2>
        <p className="mb-4 text-xs text-muted">
          Recevez une alerte Telegram à chaque commande &amp; message. 1) Sur Telegram, écrivez à
          <strong> @BotFather</strong> → <code>/newbot</code> pour créer un bot et copier son <em>token</em>.
          2) Écrivez à <strong>@userinfobot</strong> pour obtenir votre <em>chat id</em>. 3) Démarrez une
          conversation avec votre bot. Laissez vide pour désactiver.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-muted">Bot token</span>
            <input className="input" value={form.telegram_token} onChange={(e) => set({ telegram_token: e.target.value })} placeholder="123456:ABC-..." />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-muted">Chat ID</span>
            <input className="input" inputMode="numeric" value={form.telegram_chat} onChange={(e) => set({ telegram_chat: e.target.value })} placeholder="123456789" />
          </label>
        </div>
      </div>

      <div className="rounded-2xl border border-line bg-white p-6">
        <h2 className="mb-4 font-semibold text-ink">Pixels publicitaires</h2>
        <p className="mb-4 text-xs text-muted">
          Pour mesurer vos pubs Instagram/Facebook &amp; TikTok et faire du reciblage. Collez l'identifiant du
          pixel (laisser vide = désactivé). L'événement « achat » est envoyé automatiquement à la confirmation de commande.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-muted">Meta (Facebook) Pixel ID</span>
            <input className="input" inputMode="numeric" value={form.fb_pixel} onChange={(e) => set({ fb_pixel: e.target.value })} placeholder="1234567890" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-muted">TikTok Pixel ID</span>
            <input className="input" value={form.tiktok_pixel} onChange={(e) => set({ tiktok_pixel: e.target.value })} placeholder="CXXXXXXXXXXXXXXXXX" />
          </label>
        </div>
      </div>

      <div className="rounded-2xl border border-line bg-white p-6">
        <h2 className="mb-4 font-semibold text-ink">Bandeau d'annonce</h2>
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-muted">Texte affiché en haut du site (vide = masqué)</span>
          <input className="input" value={form.announcement} onChange={(e) => set({ announcement: e.target.value })} placeholder="Ex : Livraison offerte dès 99 DT" />
        </label>
      </div>

      <div className="rounded-2xl border border-line bg-white p-6">
        <h2 className="mb-4 font-semibold text-ink">Avis clients</h2>
        <button
          type="button"
          onClick={() => set({ reviews_enabled: !form.reviews_enabled })}
          className="flex items-center gap-3 text-sm text-ink"
        >
          <span className={cn("relative h-6 w-11 rounded-full transition", form.reviews_enabled ? "bg-ink" : "bg-line")}>
            <span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all", form.reviews_enabled ? "left-[22px]" : "left-0.5")} />
          </span>
          Activer les avis sur les fiches produit
        </button>
      </div>

      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending} className="btn-primary">
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enregistrer"}
        </button>
        {saved && <span className="flex items-center gap-1.5 text-sm text-green-600"><Check className="h-4 w-4" /> Enregistré</span>}
      </div>
    </form>
  );
}
