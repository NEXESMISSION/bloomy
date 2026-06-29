import { promises as fs } from "fs";
import path from "path";
import { SEED_PRODUCTS } from "./seed";
import type { Banner, DiscountCode, Order, Product, Review, RoulettePrize, RouletteWin } from "@/lib/types";

/**
 * Stockage local sur fichier (.data/*.json) utilisé UNIQUEMENT en mode démo,
 * quand Supabase n'est pas configuré. Permet de tester tout le tunnel de
 * commande et l'admin en local. En production, Supabase prend le relais.
 */
const DIR = path.join(process.cwd(), ".data");
const PRODUCTS_FILE = path.join(DIR, "products.json");
const ORDERS_FILE = path.join(DIR, "orders.json");
const CODES_FILE = path.join(DIR, "discounts.json");
const SETTINGS_FILE = path.join(DIR, "settings.json");
const REVIEWS_FILE = path.join(DIR, "reviews.json");
const CUSTOMERS_FILE = path.join(DIR, "customers.json");
const PRIZES_FILE = path.join(DIR, "roulette_prizes.json");
const WINS_FILE = path.join(DIR, "roulette_wins.json");
const BANNERS_FILE = path.join(DIR, "banners.json");

async function ensureDir() {
  await fs.mkdir(DIR, { recursive: true });
}

/**
 * Verrou en mémoire (file d'attente) pour sérialiser les lecture-modification-
 * écriture du store local et éviter les écritures concurrentes qui se perdent.
 */
let chain: Promise<unknown> = Promise.resolve();
export function withStoreLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = chain.then(fn, fn);
  chain = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

async function readJson<T>(file: string, fallback: T): Promise<T> {
  try {
    const txt = await fs.readFile(file, "utf8");
    return JSON.parse(txt) as T;
  } catch {
    return fallback;
  }
}

async function writeJson(file: string, data: unknown) {
  // Best-effort : sur un FS en lecture seule (Vercel sans Supabase), on n'échoue pas.
  try {
    await ensureDir();
    await fs.writeFile(file, JSON.stringify(data, null, 2), "utf8");
  } catch {}
}

export async function localGetProducts(): Promise<Product[]> {
  const existing = await readJson<Product[] | null>(PRODUCTS_FILE, null);
  if (existing && existing.length) return existing;
  await writeJson(PRODUCTS_FILE, SEED_PRODUCTS);
  return SEED_PRODUCTS;
}

export async function localSaveProducts(products: Product[]) {
  await writeJson(PRODUCTS_FILE, products);
}

export async function localGetOrders(): Promise<Order[]> {
  return readJson<Order[]>(ORDERS_FILE, []);
}

export async function localSaveOrders(orders: Order[]) {
  await writeJson(ORDERS_FILE, orders);
}

export async function localGetCodes(): Promise<DiscountCode[]> {
  return readJson<DiscountCode[]>(CODES_FILE, []);
}

export async function localSaveCodes(codes: DiscountCode[]) {
  await writeJson(CODES_FILE, codes);
}

export async function localGetSettings(): Promise<Record<string, string>> {
  return readJson<Record<string, string>>(SETTINGS_FILE, {});
}

export async function localSaveSettings(s: Record<string, string>) {
  await writeJson(SETTINGS_FILE, s);
}

export async function localGetReviews(): Promise<Review[]> {
  return readJson<Review[]>(REVIEWS_FILE, []);
}

export async function localSaveReviews(reviews: Review[]) {
  await writeJson(REVIEWS_FILE, reviews);
}

export async function localGetCustomers(): Promise<any[]> {
  return readJson<any[]>(CUSTOMERS_FILE, []);
}
export async function localSaveCustomers(c: any[]) {
  await writeJson(CUSTOMERS_FILE, c);
}
export async function localGetPrizes(): Promise<RoulettePrize[]> {
  return readJson<RoulettePrize[]>(PRIZES_FILE, []);
}
export async function localSavePrizes(p: RoulettePrize[]) {
  await writeJson(PRIZES_FILE, p);
}
export async function localGetWins(): Promise<RouletteWin[]> {
  return readJson<RouletteWin[]>(WINS_FILE, []);
}
export async function localSaveWins(w: RouletteWin[]) {
  await writeJson(WINS_FILE, w);
}
export async function localGetBanners(): Promise<Banner[]> {
  return readJson<Banner[]>(BANNERS_FILE, []);
}
export async function localSaveBanners(b: Banner[]) {
  await writeJson(BANNERS_FILE, b);
}
