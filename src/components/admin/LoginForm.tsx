"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, AlertCircle, Mail, Lock, KeyRound } from "lucide-react";
import { login } from "@/app/admin/actions";

export default function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await login(email, password, pin);
    if (res.ok) {
      router.replace(params.get("from") || "/admin");
      router.refresh();
    } else {
      setError(res.error);
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen place-items-center bg-sand px-5">
      <form onSubmit={submit} className="w-full max-w-sm rounded-3xl border border-line bg-white p-8 shadow-soft">
        <div className="flex flex-col items-center text-center">
          <Image src="/brand/bloomy-wordmark-dark.png" alt="Bloomy" width={1163} height={533} className="h-7 w-auto" />
          <h1 className="mt-6 text-xl font-semibold text-ink">Espace de gestion</h1>
          <p className="mt-1 text-sm text-muted">Connectez-vous pour continuer.</p>
        </div>

        <div className="mt-7 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm text-muted">Email</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                type="email"
                autoComplete="username"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vous@email.com"
                className="input pl-10"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm text-muted">Mot de passe</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input pl-10"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm text-muted">Code PIN</label>
            <div className="relative">
              <KeyRound className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                type="password"
                inputMode="numeric"
                autoComplete="off"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 8))}
                placeholder="••••"
                className="input pl-10 tracking-[0.3em]"
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
            <AlertCircle className="h-4 w-4 shrink-0" /> {error}
          </div>
        )}

        <button type="submit" disabled={loading} className="btn-primary mt-6 w-full">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Se connecter"}
        </button>
      </form>
    </div>
  );
}
