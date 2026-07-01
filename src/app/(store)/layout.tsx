import { Suspense } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import SourceTracker from "@/components/SourceTracker";
import RouletteWidget from "@/components/RouletteWidget";
import WhatsAppButton from "@/components/WhatsAppButton";
import Pixels from "@/components/Pixels";
import SiteJsonLd from "@/components/SiteJsonLd";
import { CartProvider } from "@/context/cart";
import { getSettings } from "@/lib/data/settings";
import { getActivePrizes } from "@/lib/data/roulette";
import { getCurrentCustomer } from "@/lib/customerSession";

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const [settings, prizes, customer] = await Promise.all([
    getSettings(),
    getActivePrizes(),
    getCurrentCustomer(),
  ]);
  return (
    <CartProvider
      baseDeliveryFee={settings.delivery_fee}
      freeThreshold={settings.free_delivery_threshold}
    >
      <Suspense>
        <SourceTracker />
      </Suspense>
      <div className="flex min-h-screen flex-col bg-white">
        <Navbar announcement={settings.announcement} customerName={customer?.name ?? null} />
        <main className="flex-1">{children}</main>
        <Footer settings={settings} />
        <CartDrawer />
      </div>
      {settings.roulette_enabled && <RouletteWidget prizes={prizes} isLoggedIn={!!customer} />}
      <WhatsAppButton phone={settings.shop_phone} />
      <Pixels fb={settings.fb_pixel} tiktok={settings.tiktok_pixel} />
      <SiteJsonLd settings={settings} />
    </CartProvider>
  );
}
