"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Gift, Loader2, Sparkles, Clock, Check, Ticket, XCircle, Phone, User } from "lucide-react";
import type { GoldenPublicState } from "@/lib/types";
import { revealTicket, claimTicket } from "@/app/golden-actions";
import { celebrate } from "@/lib/confetti";
import { formatDateFR } from "@/lib/utils";

type View = "intro" | "revealing" | "loser" | "winner" | "claimed" | "invalid" | "ended" | "expired";

const ease = [0.22, 1, 0.36, 1] as const;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function viewFrom(s: GoldenPublicState): View {
  switch (s.status) {
    case "unrevealed":
      return "intro";
    case "winner":
      return s.claimed ? "claimed" : "winner";
    default:
      return s.status as View;
  }
}

export default function GoldenReveal({ token, initial }: { token: string; initial: GoldenPublicState }) {
  const [view, setView] = useState<View>(viewFrom(initial));
  const [prize, setPrize] = useState<string>(
    initial.status === "winner" || initial.status === "unrevealed" ? initial.prizeLabel : "",
  );
  const [deadline, setDeadline] = useState<string | null>(initial.status === "winner" ? initial.deadline : null);

  const onReveal = async () => {
    setView("revealing");
    const [res] = await Promise.all([revealTicket(token), sleep(1800)]);
    if (!res.ok) {
      setView(res.reason === "ended" ? "ended" : res.reason === "expired" ? "expired" : "invalid");
      return;
    }
    if (res.winner) {
      setPrize(res.prizeLabel);
      setDeadline(res.deadline);
      setView("winner");
      celebrate();
    } else {
      setView("loser");
    }
  };

  return (
    <main
      className="grid min-h-[100svh] place-items-center p-5"
      style={{ background: "radial-gradient(circle at 50% -10%, #2c2c34 0%, #17171b 55%)" }}
    >
      <div className="w-full max-w-md">
        <div className="mb-6 flex justify-center">
          <Image src="/brand/bloomy-wordmark-dark.png" alt="Bloomy" width={1163} height={533} className="h-6 w-auto opacity-90 invert" />
        </div>

        <div className="overflow-hidden rounded-3xl bg-paper p-7 text-center shadow-pop sm:p-9">
          <AnimatePresence mode="wait">
            {view === "intro" && (
              <motion.div key="intro" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4, ease }}>
                <Badge>Golden Ticket</Badge>
                <motion.div
                  animate={{ y: [0, -8, 0], rotate: [-3, 3, -3] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  className="mx-auto mt-5 grid h-24 w-24 place-items-center rounded-3xl bg-gradient-to-br from-accent to-[#b8842f] text-white shadow-pop"
                >
                  <Ticket className="h-12 w-12" />
                </motion.div>
                <h1 className="mt-6 font-display text-3xl font-semibold text-ink">Suis-je chanceux&nbsp;?</h1>
                <p className="mt-2 text-sm text-muted">
                  Vous tenez peut-être le ticket gagnant. Un seul moyen de le savoir…
                </p>
                <button onClick={onReveal} className="btn-primary mt-7 w-full">
                  <Sparkles className="h-4 w-4" /> Découvrir
                </button>
              </motion.div>
            )}

            {view === "revealing" && (
              <motion.div key="revealing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="py-6">
                <motion.div
                  animate={{ rotate: 360, scale: [1, 1.12, 1] }}
                  transition={{ rotate: { duration: 1.1, repeat: Infinity, ease: "linear" }, scale: { duration: 0.8, repeat: Infinity } }}
                  className="mx-auto grid h-24 w-24 place-items-center rounded-full bg-gradient-to-br from-accent to-[#b8842f] text-white shadow-pop"
                >
                  <Gift className="h-12 w-12" />
                </motion.div>
                <p className="mt-7 text-lg font-semibold text-ink">On vérifie votre ticket…</p>
                <p className="mt-1 text-sm text-muted">Croisez les doigts 🤞</p>
              </motion.div>
            )}

            {view === "winner" && (
              <motion.div key="winner" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, ease }}>
                <motion.div
                  initial={{ rotate: -10, scale: 0.6 }}
                  animate={{ rotate: 0, scale: 1 }}
                  transition={{ type: "spring", bounce: 0.5, duration: 0.8 }}
                  className="mx-auto grid h-24 w-24 place-items-center rounded-3xl bg-gradient-to-br from-accent to-[#b8842f] text-white shadow-pop"
                >
                  <Gift className="h-12 w-12" />
                </motion.div>
                <p className="mt-6 text-sm font-semibold uppercase tracking-[0.2em] text-accent">Félicitations&nbsp;!</p>
                <h1 className="mt-1 font-display text-2xl font-semibold text-ink">Vous avez gagné</h1>
                <p className="mt-2 text-3xl font-bold text-ink">{prize}</p>
                {deadline && (
                  <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-sand px-3 py-1 text-xs text-muted">
                    <Clock className="h-3.5 w-3.5" /> À réclamer avant le {formatDateFR(deadline)}
                  </p>
                )}
                <ClaimForm token={token} onClaimed={() => setView("claimed")} />
              </motion.div>
            )}

            {view === "claimed" && (
              <motion.div key="claimed" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-green-100 text-green-600">
                  <Check className="h-10 w-10" />
                </div>
                <h1 className="mt-5 font-display text-2xl font-semibold text-ink">Lot réclamé&nbsp;!</h1>
                <p className="mt-2 text-sm text-muted">
                  Notre équipe vous contactera très vite pour vous remettre votre lot{prize ? ` : ${prize}` : ""}. Merci&nbsp;!
                </p>
                <StoreLink />
              </motion.div>
            )}

            {view === "loser" && (
              <motion.div key="loser" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-sand text-muted">
                  <Ticket className="h-10 w-10" />
                </div>
                <h1 className="mt-5 font-display text-2xl font-semibold text-ink">Pas de chance cette fois 😅</h1>
                <p className="mt-2 text-sm text-muted">Ce ticket n’est pas gagnant. Merci d’avoir tenté votre chance&nbsp;!</p>
                <StoreLink />
              </motion.div>
            )}

            {(view === "invalid" || view === "ended" || view === "expired") && (
              <motion.div key="err" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-sand text-muted">
                  <XCircle className="h-10 w-10" />
                </div>
                <h1 className="mt-5 font-display text-2xl font-semibold text-ink">
                  {view === "ended" ? "Événement terminé" : view === "expired" ? "Délai dépassé" : "Ticket invalide"}
                </h1>
                <p className="mt-2 text-sm text-muted">
                  {view === "ended"
                    ? "Cet événement est clôturé. Restez à l’affût du prochain&nbsp;!"
                    : view === "expired"
                      ? "Le délai de réclamation de ce lot est écoulé."
                      : "Ce QR code n’est pas reconnu."}
                </p>
                <StoreLink />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </main>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block rounded-full bg-ink px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white">
      {children}
    </span>
  );
}

function StoreLink() {
  return (
    <Link href="/" className="btn-outline mt-6 w-full">
      Découvrir Bloomy
    </Link>
  );
}

function ClaimForm({ token, onClaimed }: { token: string; onClaimed: () => void }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await claimTicket(token, name, phone);
    setLoading(false);
    if (res.ok) {
      celebrate();
      onClaimed();
    } else {
      setError(res.error);
    }
  };

  return (
    <form onSubmit={submit} className="mt-6 space-y-3 text-left">
      <p className="text-center text-sm font-medium text-ink">Réclamez votre lot&nbsp;:</p>
      <div className="relative">
        <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Votre nom" className="input pl-10" required />
      </div>
      <div className="relative">
        <Phone className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" placeholder="Téléphone" className="input pl-10" required />
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <button type="submit" disabled={loading} className="btn-primary w-full">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Réclamer mon lot 🎁"}
      </button>
    </form>
  );
}
