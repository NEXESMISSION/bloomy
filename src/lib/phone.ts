/**
 * Outils téléphone. Les numéros sont saisis/stockés au format local tunisien
 * (8 chiffres, ex. « 58415520 ») via le super admin. On en dérive ici les
 * formats d'affichage, d'appel (tel:) et WhatsApp (wa.me, international).
 */

export function phoneDigits(phone: string): string {
  return (phone || "").replace(/\D/g, "");
}

/** Forme internationale SANS « + » (pour wa.me / tel). 8 chiffres → préfixe 216. */
export function phoneIntl(phone: string): string {
  const d = phoneDigits(phone);
  if (!d) return "";
  if (d.length === 8) return `216${d}`; // numéro local tunisien
  return d; // déjà international (216…) ou format inattendu : on garde tel quel
}

/** Affichage lisible : « 58 415 520 » (local) ou « +216 58 415 520 ». */
export function phoneDisplay(phone: string): string {
  const d = phoneDigits(phone);
  if (d.length === 8) return d.replace(/(\d{2})(\d{3})(\d{3})/, "$1 $2 $3");
  if (d.length === 11 && d.startsWith("216")) {
    const local = d.slice(3).replace(/(\d{2})(\d{3})(\d{3})/, "$1 $2 $3");
    return `+216 ${local}`;
  }
  return (phone || "").trim();
}

/** Lien d'appel `tel:`. Chaîne vide si numéro inexploitable. */
export function telHref(phone: string): string {
  const intl = phoneIntl(phone);
  return intl ? `tel:+${intl}` : "";
}

/** Lien WhatsApp `wa.me`. Chaîne vide si numéro inexploitable. */
export function whatsappHref(phone: string, message?: string): string {
  const intl = phoneIntl(phone);
  if (intl.length < 8) return "";
  const text = message || "Bonjour Bloomy 👋, j'ai une question sur vos parfums.";
  return `https://wa.me/${intl}?text=${encodeURIComponent(text)}`;
}
