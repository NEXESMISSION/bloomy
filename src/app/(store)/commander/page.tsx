import type { Metadata } from "next";
import CheckoutForm from "@/components/CheckoutForm";

export const metadata: Metadata = {
  title: "Commander",
  description: "Finalisez votre commande Bloomy — paiement à la livraison, partout en Tunisie.",
};

export default function CommanderPage() {
  return <CheckoutForm />;
}
