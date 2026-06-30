import type { Metadata } from "next";
import CheckoutForm from "@/components/CheckoutForm";
import { getCurrentCustomer } from "@/lib/customerSession";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Commander",
  description: "Finalisez votre commande Bloomy — paiement à la livraison, partout en Tunisie.",
};

export default async function CommanderPage() {
  const customer = await getCurrentCustomer();
  return <CheckoutForm customer={customer ? { name: customer.name, phone: customer.phone } : null} />;
}
