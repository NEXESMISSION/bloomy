import type { Metadata } from "next";
import { Phone, Mail, MessageCircle, MapPin, Clock } from "lucide-react";
import ContactForm from "@/components/ContactForm";
import { getSettings } from "@/lib/data/settings";
import { phoneDisplay, telHref, whatsappHref } from "@/lib/phone";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Contact",
  description: "Une question ? Contactez l'équipe Bloomy.",
};

export default async function ContactPage() {
  const settings = await getSettings();
  const cards = [
    settings.shop_phone && { icon: Phone, title: "Téléphone", value: phoneDisplay(settings.shop_phone), href: telHref(settings.shop_phone) },
    settings.shop_phone_2 && { icon: Phone, title: "Téléphone (2)", value: phoneDisplay(settings.shop_phone_2), href: telHref(settings.shop_phone_2) },
    settings.shop_phone && { icon: MessageCircle, title: "WhatsApp", value: "Discuter", href: whatsappHref(settings.shop_phone, "Bonjour Bloomy 👋") },
    settings.shop_email && { icon: Mail, title: "Email", value: settings.shop_email, href: `mailto:${settings.shop_email}` },
  ].filter(Boolean) as { icon: typeof Phone; title: string; value: string; href: string }[];
  return (
    <div className="container-bloomy py-12 sm:py-16">
      <div className="text-center">
        <span className="eyebrow">Contact</span>
        <h1 className="mt-3 text-4xl sm:text-5xl">On est à votre écoute</h1>
        <p className="mx-auto mt-3 max-w-md text-muted">Une question sur un parfum, une commande ou une livraison ?</p>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <div className="space-y-3">
          {cards.map((c) => (
            <a key={c.title} href={c.href} target={c.href.startsWith("http") ? "_blank" : undefined} rel="noreferrer"
               className="flex items-center gap-4 rounded-2xl border border-line p-4 transition hover:bg-sand">
              <c.icon className="h-5 w-5 text-ink" strokeWidth={1.5} />
              <div>
                <p className="text-xs text-muted">{c.title}</p>
                <p className="font-semibold text-ink">{c.value}</p>
              </div>
            </a>
          ))}
          <div className="space-y-2 rounded-2xl bg-sand p-4 text-sm text-muted">
            <p className="flex items-center gap-2"><MapPin className="h-4 w-4" /> Tunis, Tunisie</p>
            <p className="flex items-center gap-2"><Clock className="h-4 w-4" /> Lun – Sam · 9h – 19h</p>
          </div>
        </div>
        <ContactForm />
      </div>
    </div>
  );
}
