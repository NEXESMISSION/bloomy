import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "À propos",
  description: "L'histoire de Bloomy — des parfums accessibles, inspirés des grands classiques.",
};

const VALUES = [
  { title: "Audace", text: "Des sillages qui osent." },
  { title: "Qualité", text: "Une vraie tenue, soignée." },
  { title: "Accessible", text: "Le bon prix, toujours." },
  { title: "Local", text: "Conçu en Tunisie." },
];

export default function AProposPage() {
  return (
    <div className="container-bloomy py-12 sm:py-16">
      <div className="mx-auto max-w-2xl text-center">
        <span className="eyebrow">Notre histoire</span>
        <h1 className="mt-3 text-4xl sm:text-5xl">Le parfum, accessible.</h1>
        <p className="mx-auto mt-5 max-w-xl text-[15px] leading-relaxed text-muted">
          Bloomy est née d'une idée simple : chacun mérite un parfum qui lui ressemble, sans payer
          le prix fort. On recrée les sillages des plus grands, avec exigence et au juste prix.
        </p>
      </div>

      <div className="relative mt-12 aspect-[16/9] overflow-hidden rounded-3xl bg-surface">
        <Image src="/photos/lineup.png" alt="La collection Bloomy" fill className="object-contain" sizes="1100px" />
      </div>

      <div className="mx-auto mt-12 grid max-w-3xl gap-5 sm:grid-cols-4">
        {VALUES.map((v) => (
          <div key={v.title}>
            <p className="text-lg font-semibold text-ink">{v.title}</p>
            <p className="mt-1 text-sm text-muted">{v.text}</p>
          </div>
        ))}
      </div>

      <div className="mt-12 text-center">
        <Link href="/boutique" className="btn-primary">Découvrir la collection</Link>
      </div>
    </div>
  );
}
