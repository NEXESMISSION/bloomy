"use client";

import { useState, useTransition } from "react";
import { Loader2, AlertCircle, Check } from "lucide-react";
import { submitContactMessage } from "@/app/actions";

export default function ContactForm() {
  const [form, setForm] = useState({ name: "", phone: "", email: "", message: "", hp: "" });
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await submitContactMessage(form);
      if (res.ok) {
        setSent(true);
        setForm({ name: "", phone: "", email: "", message: "", hp: "" });
      } else {
        setError(res.error);
      }
    });
  };

  if (sent) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-line p-8 text-center">
        <span className="grid h-12 w-12 place-items-center rounded-full bg-green-100 text-green-600"><Check className="h-6 w-6" /></span>
        <h2 className="text-lg font-semibold text-ink">Message envoyé !</h2>
        <p className="text-sm text-muted">Merci ! Notre équipe vous répond très vite.</p>
        <button onClick={() => setSent(false)} className="btn-outline mt-2">Envoyer un autre message</button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-2xl border border-line p-6">
      {/* honeypot anti-bot : caché aux humains, rempli par les bots */}
      <input type="text" name="company" tabIndex={-1} autoComplete="off" aria-hidden="true" value={form.hp} onChange={set("hp")} className="hidden" />
      <h2 className="text-lg font-semibold text-ink">Écrivez-nous</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <input required value={form.name} onChange={set("name")} placeholder="Nom" className="input" />
        <input required type="tel" inputMode="tel" value={form.phone} onChange={set("phone")} placeholder="Téléphone" className="input" />
      </div>
      <input type="email" value={form.email} onChange={set("email")} placeholder="Email (facultatif)" className="input" />
      <textarea required rows={4} value={form.message} onChange={set("message")} placeholder="Votre message…" className="input resize-none" />
      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}
      <button type="submit" disabled={pending} className="btn-primary w-full">
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Envoyer"}
      </button>
    </form>
  );
}
