import Link from "next/link";
import Image from "next/image";
import { Instagram, Facebook, Lock } from "lucide-react";
import type { ShopSettings } from "@/lib/types";
import { phoneDisplay, telHref } from "@/lib/phone";

export default function Footer({ settings }: { settings: ShopSettings }) {
  return (
    <footer className="mt-20 border-t border-line bg-sand">
      <div className="container-bloomy grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.1fr]">
        <div>
          <Image src="/brand/bloomy-wordmark-dark.png" alt="Bloomy" width={1163} height={533} className="h-6 w-auto" />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">
            Parfums pour homme inspirés des grands classiques. Livraison partout en Tunisie,
            paiement à la livraison.
          </p>
          {(settings.shop_instagram || settings.shop_facebook) && (
            <div className="mt-5 flex gap-3">
              {settings.shop_instagram && (
                <a href={settings.shop_instagram} target="_blank" rel="noreferrer" className="grid h-9 w-9 place-items-center rounded-full border border-line text-ink transition hover:bg-white" aria-label="Instagram">
                  <Instagram className="h-[18px] w-[18px]" />
                </a>
              )}
              {settings.shop_facebook && (
                <a href={settings.shop_facebook} target="_blank" rel="noreferrer" className="grid h-9 w-9 place-items-center rounded-full border border-line text-ink transition hover:bg-white" aria-label="Facebook">
                  <Facebook className="h-[18px] w-[18px]" />
                </a>
              )}
            </div>
          )}
        </div>

        <FooterCol
          title="Boutique"
          links={[
            { label: "Tous les parfums", href: "/boutique" },
            { label: "Mon compte", href: "/compte" },
          ]}
        />
        <FooterCol
          title="Maison"
          links={[
            { label: "À propos", href: "/a-propos" },
            { label: "Contact", href: "/contact" },
            { label: "Livraison & retours", href: "/livraison-retours" },
            { label: "Confidentialité", href: "/confidentialite" },
            { label: "CGV", href: "/cgv" },
          ]}
        />

        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-ink">Contact</h4>
          <ul className="mt-4 space-y-2 text-sm text-muted">
            {settings.shop_phone && (
              <li><a href={telHref(settings.shop_phone)} className="transition hover:text-ink">{phoneDisplay(settings.shop_phone)}</a></li>
            )}
            {settings.shop_phone_2 && (
              <li><a href={telHref(settings.shop_phone_2)} className="transition hover:text-ink">{phoneDisplay(settings.shop_phone_2)}</a></li>
            )}
            {settings.shop_email && (
              <li><a href={`mailto:${settings.shop_email}`} className="transition hover:text-ink">{settings.shop_email}</a></li>
            )}
            <li>Tunis, Tunisie</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-line">
        <div className="container-bloomy flex flex-col items-center justify-between gap-2 py-5 text-xs text-muted sm:flex-row">
          <p>© {new Date().getFullYear()} Bloomy. Tous droits réservés.</p>
          <div className="flex items-center gap-4">
            <span>Paiement à la livraison</span>
            <Link href="/admin/login" className="inline-flex items-center gap-1 transition hover:text-ink">
              <Lock className="h-3 w-3" /> Admin
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <div>
      <h4 className="text-xs font-semibold uppercase tracking-wider text-ink">{title}</h4>
      <ul className="mt-4 space-y-2 text-sm">
        {links.map((l) => (
          <li key={l.label}>
            <Link href={l.href} className="text-muted transition hover:text-ink">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
