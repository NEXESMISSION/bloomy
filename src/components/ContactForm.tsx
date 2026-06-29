"use client";

import { useState } from "react";

export default function ContactForm() {
  const [sent, setSent] = useState(false);
  return (
    <form
      onSubmit={(e) => { e.preventDefault(); setSent(true); }}
      className="space-y-4 rounded-2xl border border-line p-6"
    >
      <h2 className="text-lg font-semibold text-ink">Écrivez-nous</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <input required placeholder="Nom" className="input" />
        <input required type="tel" placeholder="Téléphone" className="input" />
      </div>
      <input type="email" placeholder="Email (facultatif)" className="input" />
      <textarea required rows={4} placeholder="Votre message…" className="input resize-none" />
      <button type="submit" className="btn-primary w-full">{sent ? "Message envoyé !" : "Envoyer"}</button>
      {sent && <p className="text-center text-sm text-green-600">Merci ! On vous répond vite.</p>}
    </form>
  );
}
