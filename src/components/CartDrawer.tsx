"use client";

import Link from "next/link";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { useCart } from "@/context/cart";
import { formatTND } from "@/lib/utils";

export default function CartDrawer() {
  const { items, isOpen, close, setQty, remove, subtotal, deliveryFee, total, count, freeThreshold } =
    useCart();
  const remaining = Math.max(0, freeThreshold - subtotal);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
            className="fixed inset-0 z-[60] bg-ink/30 backdrop-blur-sm"
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 z-[61] flex h-full w-full max-w-md flex-col bg-white"
          >
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <h2 className="flex items-center gap-2 text-base font-semibold text-ink">
                Panier <span className="text-muted">({count})</span>
              </h2>
              <button onClick={close} className="grid h-9 w-9 place-items-center rounded-full text-ink hover:bg-sand" aria-label="Fermer">
                <X className="h-5 w-5" />
              </button>
            </div>

            {items.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
                <ShoppingBag className="h-8 w-8 text-muted" strokeWidth={1.4} />
                <p className="text-muted">Votre panier est vide.</p>
                <Link href="/boutique" onClick={close} className="btn-primary">
                  Découvrir les parfums
                </Link>
              </div>
            ) : (
              <>
                <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
                  {subtotal < freeThreshold && (
                    <div className="rounded-xl bg-sand px-4 py-3 text-xs text-ink">
                      Plus que <strong>{formatTND(remaining)}</strong> pour la livraison offerte.
                    </div>
                  )}
                  {items.map((item) => (
                    <div key={item.id} className="flex gap-3">
                      <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-xl bg-surface">
                        <Image src={item.image} alt={item.name} fill className="object-contain" sizes="64px" />
                      </div>
                      <div className="flex flex-1 flex-col">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-semibold text-ink">{item.name}</p>
                          <button onClick={() => remove(item.id)} className="text-muted hover:text-ink" aria-label="Retirer">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        <p className="text-xs text-muted">{formatTND(item.price)}</p>
                        <div className="mt-auto flex items-center justify-between">
                          <div className="flex items-center rounded-full border border-line">
                            <button onClick={() => setQty(item.id, item.quantity - 1)} className="grid h-8 w-8 place-items-center text-ink" aria-label="Moins">
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                            <span className="w-7 text-center text-sm font-semibold text-ink">{item.quantity}</span>
                            <button onClick={() => setQty(item.id, item.quantity + 1)} className="grid h-8 w-8 place-items-center text-ink" aria-label="Plus">
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <p className="text-sm font-semibold text-ink">{formatTND(item.price * item.quantity)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-3 border-t border-line px-5 py-5">
                  <div className="flex justify-between text-sm text-muted">
                    <span>Sous-total</span>
                    <span>{formatTND(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-muted">
                    <span>Livraison</span>
                    <span>{deliveryFee === 0 ? "Offerte" : formatTND(deliveryFee)}</span>
                  </div>
                  <div className="flex justify-between border-t border-line pt-3 text-base font-semibold text-ink">
                    <span>Total</span>
                    <span>{formatTND(total)}</span>
                  </div>
                  <Link href="/commander" onClick={close} className="btn-primary w-full">
                    Commander
                  </Link>
                  <p className="text-center text-[11px] text-muted">Paiement à la livraison · Sans paiement en ligne</p>
                </div>
              </>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
