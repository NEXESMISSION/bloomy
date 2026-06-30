import { getSettings } from "@/lib/data/settings";

/**
 * Envoie une notification Telegram au propriétaire. Best-effort : ne lève JAMAIS
 * d'erreur et ne bloque jamais l'action appelante. Désactivé tant que le token +
 * le chat id ne sont pas renseignés (super admin → Paramètres → Notifications,
 * ou variables d'env TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID en repli).
 */
export async function notifyTelegram(text: string): Promise<void> {
  try {
    const s = await getSettings();
    const token = (s.telegram_token || process.env.TELEGRAM_BOT_TOKEN || "").trim();
    const chat = (s.telegram_chat || process.env.TELEGRAM_CHAT_ID || "").trim();
    if (!token || !chat) return; // non configuré → silencieux
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chat, text, parse_mode: "HTML", disable_web_page_preview: true }),
      cache: "no-store",
    });
  } catch {
    /* une notification ratée ne doit jamais casser une commande/message */
  }
}
