import { getProducts } from "@/lib/data/products";
import { getActiveBanners } from "@/lib/data/banners";
import { getApprovedReviewsAll } from "@/lib/data/reviews";
import { getSettings } from "@/lib/data/settings";
import Hero from "@/components/sections/Hero";
import TrustStrip from "@/components/sections/TrustStrip";
import Collection from "@/components/sections/Collection";
import Testimonials from "@/components/sections/Testimonials";
import FAQ from "@/components/sections/FAQ";

export default async function HomePage() {
  const [products, banners, settings] = await Promise.all([
    getProducts(),
    getActiveBanners(),
    getSettings(),
  ]);
  const reviews = settings.reviews_enabled ? await getApprovedReviewsAll(6) : [];
  return (
    <>
      <Hero banners={banners} />
      <TrustStrip />
      <Collection products={products} />
      <Testimonials reviews={reviews} />
      <FAQ />
    </>
  );
}
