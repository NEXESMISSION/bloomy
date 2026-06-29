import { getProducts } from "@/lib/data/products";
import Hero from "@/components/sections/Hero";
import TrustStrip from "@/components/sections/TrustStrip";
import Collection from "@/components/sections/Collection";
import FAQ from "@/components/sections/FAQ";

export default async function HomePage() {
  const products = await getProducts();
  return (
    <>
      <Hero />
      <TrustStrip />
      <Collection products={products} />
      <FAQ />
    </>
  );
}
