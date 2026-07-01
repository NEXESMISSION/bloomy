import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

/** Crawlers d'IA générative (ChatGPT, Claude, Perplexity, Gemini, etc.).
 *  On les AUTORISE explicitement pour que la marque soit lue & citée par les IA. */
const AI_BOTS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "anthropic-ai",
  "Claude-Web",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "Applebot-Extended",
  "Bytespider",
  "CCBot",
  "cohere-ai",
  "Meta-ExternalAgent",
];

export default function robots(): MetadataRoute.Robots {
  const base = site.url.replace(/\/$/, "");
  const privatePaths = ["/admin", "/commande/", "/compte"];
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: privatePaths },
      // Accès explicite des IA à tout le contenu public (hors espaces privés).
      ...AI_BOTS.map((userAgent) => ({ userAgent, allow: "/", disallow: privatePaths })),
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
