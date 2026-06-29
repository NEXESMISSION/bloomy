import { Suspense } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import SourceTracker from "@/components/SourceTracker";
import { CartProvider } from "@/context/cart";
import { getSettings } from "@/lib/data/settings";

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings();
  return (
    <CartProvider
      baseDeliveryFee={settings.delivery_fee}
      freeThreshold={settings.free_delivery_threshold}
    >
      <Suspense>
        <SourceTracker />
      </Suspense>
      <div className="flex min-h-screen flex-col bg-white">
        <Navbar announcement={settings.announcement} />
        <main className="flex-1">{children}</main>
        <Footer />
        <CartDrawer />
      </div>
    </CartProvider>
  );
}
