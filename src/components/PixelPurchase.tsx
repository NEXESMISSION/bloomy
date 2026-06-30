"use client";

import { useEffect } from "react";

/** Envoie l'événement « achat » aux pixels (une fois, à la confirmation). No-op
 *  si les pixels ne sont pas chargés (IDs non configurés). */
export default function PixelPurchase({ value, orderNumber }: { value: number; orderNumber: string }) {
  useEffect(() => {
    const key = `bloomy_purchase_${orderNumber}`;
    try {
      if (sessionStorage.getItem(key)) return; // évite le double-comptage au refresh
      sessionStorage.setItem(key, "1");
    } catch {}
    const w = window as any;
    try { w.fbq?.("track", "Purchase", { value, currency: "TND" }); } catch {}
    try { w.ttq?.track?.("CompletePayment", { value, currency: "TND" }); } catch {}
  }, [value, orderNumber]);
  return null;
}
