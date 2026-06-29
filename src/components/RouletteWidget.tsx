"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Gift, X, Loader2, Check, Copy } from "lucide-react";
import type { RoulettePrize } from "@/lib/types";
import { spin, signup, login, claimCurrentWin, type SpinResult } from "@/app/account-actions";
import { cn } from "@/lib/utils";

const SEEN_KEY = "bloomy_roulette_seen";
const PLAY_KEY = "bloomy_roulette_play"; // {result, claimed} — 1 seul tour autorisé

function ptOnCircle(cx: number, cy: number, r: number, degFromTop: number) {
  const a = ((degFromTop - 90) * Math.PI) / 180;
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
}

export default function RouletteWidget({ prizes, isLoggedIn }: { prizes: RoulettePrize[]; isLoggedIn: boolean }) {
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<"spin" | "result">("spin");
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<SpinResult | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [played, setPlayed] = useState(false);
  const [loggedIn, setLoggedIn] = useState(isLoggedIn);
  const timer = useRef<any>(null);

  const savePlay = (res: SpinResult, claimed: boolean) => {
    try { localStorage.setItem(PLAY_KEY, JSON.stringify({ result: res, claimed })); } catch {}
  };

  useEffect(() => {
    if (!prizes.length) return;
    try {
      const raw = localStorage.getItem(PLAY_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        if (saved?.result) {
          setResult(saved.result);
          setPhase("result");
          setPlayed(true);
          setRevealed(!!saved.claimed || saved.result.type === "none");
        }
      } else if (!localStorage.getItem(SEEN_KEY)) {
        const t = setTimeout(() => setOpen(true), 1200);
        return () => clearTimeout(t);
      }
    } catch {}
  }, [prizes.length]);

  if (!prizes.length) return null;

  const n = prizes.length;
  const seg = 360 / n;

  const close = () => {
    setOpen(false);
    try { localStorage.setItem(SEEN_KEY, "1"); } catch {}
  };

  const markClaimed = () => {
    setRevealed(true);
    setLoggedIn(true);
    if (result) savePlay(result, true);
  };

  const onSpin = async () => {
    if (spinning || played) return;
    setSpinning(true);
    const res = await spin();
    if (!res.ok) {
      setSpinning(false);
      setResult(res);
      setPhase("result");
      return;
    }
    setPlayed(true);
    savePlay(res, false);
    const idx = Math.max(0, prizes.findIndex((p) => p.id === res.prizeId));
    const targetCenter = idx * seg + seg / 2;
    const base = rotation - (rotation % 360);
    let next = base + 360 * 6 + (360 - targetCenter);
    if (next <= rotation) next += 360;
    setRotation(next);

    timer.current = setTimeout(async () => {
      setSpinning(false);
      setResult(res);
      setPhase("result");
      if (loggedIn && res.type !== "none") {
        await claimCurrentWin(res.winId);
        setRevealed(true);
        savePlay(res, true);
      }
    }, 4900);
  };

  return (
    <>
      <motion.button
        onClick={() => setOpen(true)}
        initial={{ opacity: 0, y: 16, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.4 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-ink px-4 py-3 text-sm font-semibold text-white shadow-pop hover:bg-ink-80"
        aria-label="Roue de la chance"
      >
        <span className="relative grid place-items-center">
          <Gift className="h-5 w-5" />
          {!played && (
            <span className="absolute -right-1.5 -top-1.5 flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-accent" />
            </span>
          )}
        </span>
        <span className="hidden sm:inline">{played ? "Mon lot" : "Tentez votre chance"}</span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-4"
          >
            <div onClick={close} className="absolute inset-0 bg-ink/50 backdrop-blur-sm" />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 24 }}
              transition={{ type: "spring", duration: 0.5, bounce: 0.18 }}
              className="relative z-10 max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-paper p-6 sm:rounded-3xl sm:p-8"
            >
              <button onClick={close} className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full border border-line text-ink hover:bg-sand" aria-label="Fermer">
                <X className="h-5 w-5" />
              </button>

              <div className="text-center">
                <span className="eyebrow">Roue de la chance</span>
                <h2 className="mt-2 text-2xl font-semibold text-ink">{played ? "Votre lot" : "Tournez & gagnez 🎉"}</h2>
                {!played && <p className="mt-1 text-xs text-muted">Un seul tour par personne.</p>}
              </div>

              <div className="relative mx-auto mt-6 h-64 w-64">
                <div className="absolute left-1/2 top-[-6px] z-10 -translate-x-1/2">
                  <div className="h-0 w-0 border-l-[10px] border-r-[10px] border-t-[16px] border-l-transparent border-r-transparent border-t-ink" />
                </div>
                <div
                  className="h-full w-full rounded-full shadow-card ring-4 ring-ink/90"
                  style={{
                    transform: `rotate(${rotation}deg)`,
                    transition: spinning ? "transform 4.8s cubic-bezier(0.17,0.67,0.16,1)" : "none",
                    willChange: "transform",
                  }}
                >
                  <svg viewBox="0 0 200 200" className="h-full w-full">
                    {prizes.map((p, i) => {
                      const mid = i * seg + seg / 2;
                      const [x1, y1] = ptOnCircle(100, 100, 100, i * seg);
                      const [x2, y2] = ptOnCircle(100, 100, 100, (i + 1) * seg);
                      const large = seg > 180 ? 1 : 0;
                      // Label radiates from the centre and is flipped upright on the left half.
                      const [lx, ly] = ptOnCircle(100, 100, 60, mid);
                      const flip = mid > 90 && mid < 270 ? 180 : 0;
                      return (
                        <g key={p.id}>
                          <path d={`M100,100 L${x1},${y1} A100,100 0 ${large} 1 ${x2},${y2} Z`} fill={p.color} stroke="#fff" strokeWidth="1.5" />
                          <text
                            x={lx}
                            y={ly}
                            fill="#fff"
                            fontSize="9"
                            fontWeight="700"
                            textAnchor="middle"
                            dominantBaseline="middle"
                            transform={`rotate(${mid + flip} ${lx} ${ly})`}
                          >
                            {p.label.slice(0, 14)}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </div>
                <div className="absolute left-1/2 top-1/2 grid h-10 w-10 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-ink text-white">
                  <Gift className="h-5 w-5" />
                </div>
              </div>

              {phase === "spin" && !played && (
                <button onClick={onSpin} disabled={spinning} className="btn-primary mt-6 w-full">
                  {spinning ? <Loader2 className="h-4 w-4 animate-spin" /> : "Tourner la roue"}
                </button>
              )}

              {phase === "result" && result && (
                <Result result={result} revealed={revealed} onClaimed={markClaimed} />
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function Result({ result, revealed, onClaimed }: { result: SpinResult; revealed: boolean; onClaimed: () => void }) {
  if (!result.ok) {
    return <p className="mt-6 text-center text-sm text-red-600">{result.error}</p>;
  }
  if (result.type === "none") {
    return (
      <div className="mt-6 text-center">
        <p className="text-lg font-semibold text-ink">Pas de chance cette fois 😅</p>
        <p className="mt-1 text-sm text-muted">Merci d'avoir tenté votre chance !</p>
      </div>
    );
  }
  return (
    <div className="mt-6 text-center">
      <p className="text-lg font-semibold text-ink">🎉 Vous avez gagné : {result.label}</p>
      {revealed ? (
        <RevealedPrize result={result} />
      ) : (
        <>
          <p className="mt-1 text-sm text-muted">Créez votre compte (ou connectez-vous) pour récupérer votre lot.</p>
          <AccountForm winId={result.winId} onSuccess={onClaimed} />
        </>
      )}
    </div>
  );
}

function RevealedPrize({ result }: { result: SpinResult & { ok: true } }) {
  const [copied, setCopied] = useState(false);
  if (result.type === "product") {
    return (
      <div className="mt-3">
        <p className="text-sm text-ink">{result.productName ?? "Cadeau"} 🎁</p>
        <p className="mt-1 text-sm text-muted">Notre équipe vous contactera pour vous le remettre.</p>
      </div>
    );
  }
  return (
    <div className="mt-3">
      <p className="text-sm text-muted">Votre code promo :</p>
      <button
        onClick={() => { navigator.clipboard?.writeText(result.code ?? ""); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
        className="mx-auto mt-2 flex items-center gap-2 rounded-xl border-2 border-dashed border-ink/30 bg-sand px-5 py-3 text-xl font-bold tracking-widest text-ink"
      >
        {result.code}
        {copied ? <Check className="h-5 w-5 text-green-600" /> : <Copy className="h-4 w-4 text-muted" />}
      </button>
      <p className="mt-2 text-xs text-muted">À utiliser au moment de la commande.</p>
    </div>
  );
}

function AccountForm({ winId, onSuccess }: { winId: string; onSuccess: () => void }) {
  const [mode, setMode] = useState<"signup" | "login">("signup");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = mode === "signup" ? await signup({ name, phone, password, winId }) : await login({ phone, password, winId });
    setLoading(false);
    if (res.ok) onSuccess();
    else setError(res.error);
  };

  return (
    <form onSubmit={submit} className="mt-4 space-y-3 text-left">
      {mode === "signup" && <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Votre nom" className="input" required />}
      <input value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" placeholder="Téléphone" className="input" required />
      <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Mot de passe" className="input" required />
      {error && <p className="text-xs text-red-600">{error}</p>}
      <button type="submit" disabled={loading} className="btn-primary w-full">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : mode === "signup" ? "Créer mon compte & récupérer" : "Se connecter & récupérer"}
      </button>
      <button type="button" onClick={() => setMode(mode === "signup" ? "login" : "signup")} className="w-full text-center text-xs text-muted hover:text-ink">
        {mode === "signup" ? "Déjà un compte ? Se connecter" : "Pas de compte ? S'inscrire"}
      </button>
    </form>
  );
}
