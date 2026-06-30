"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, AlertCircle, User, Phone, Mail, Lock } from "lucide-react";
import { signup, login } from "@/app/account-actions";

export default function CustomerAuth({ redirect }: { redirect?: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<"signup" | "login">("signup");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res =
        mode === "signup"
          ? await signup({ name, phone, email: email || undefined, password })
          : await login({ phone, password });
      if (res.ok) {
        router.replace(redirect || "/compte");
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  };

  return (
    <div className="mx-auto max-w-md">
      <div className="mb-6 text-center">
        <span className="eyebrow">Mon compte</span>
        <h1 className="mt-3 text-3xl sm:text-4xl">{mode === "signup" ? "Créer un compte" : "Se connecter"}</h1>
        <p className="mx-auto mt-3 max-w-sm text-sm text-muted">
          Suivez vos commandes et gardez vos gains de la roue de la chance au même endroit.
        </p>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-2 rounded-2xl bg-sand p-1.5">
        <button
          type="button"
          onClick={() => { setMode("signup"); setError(null); }}
          className={`rounded-xl py-2.5 text-sm font-semibold transition ${mode === "signup" ? "bg-white text-ink shadow-sm" : "text-muted"}`}
        >
          Inscription
        </button>
        <button
          type="button"
          onClick={() => { setMode("login"); setError(null); }}
          className={`rounded-xl py-2.5 text-sm font-semibold transition ${mode === "login" ? "bg-white text-ink shadow-sm" : "text-muted"}`}
        >
          Connexion
        </button>
      </div>

      <form onSubmit={submit} className="space-y-3">
        {mode === "signup" && (
          <Field icon={User}><input className="input pl-10" value={name} onChange={(e) => setName(e.target.value)} placeholder="Votre nom" required /></Field>
        )}
        <Field icon={Phone}><input className="input pl-10" type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Téléphone (8 chiffres)" required /></Field>
        {mode === "signup" && (
          <Field icon={Mail}><input className="input pl-10" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email (facultatif)" /></Field>
        )}
        <Field icon={Lock}><input className="input pl-10" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={mode === "signup" ? "Mot de passe (6 caractères min)" : "Mot de passe"} required /></Field>

        {error && (
          <div className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
            <AlertCircle className="h-4 w-4 shrink-0" /> {error}
          </div>
        )}

        <button type="submit" disabled={pending} className="btn-primary w-full">
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : mode === "signup" ? "Créer mon compte" : "Se connecter"}
        </button>
      </form>
    </div>
  );
}

function Field({ icon: Icon, children }: { icon: typeof User; children: React.ReactNode }) {
  return (
    <div className="relative">
      <Icon className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
      {children}
    </div>
  );
}
