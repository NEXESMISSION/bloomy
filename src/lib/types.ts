export type Product = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  price: number; // dinars
  compare_at_price: number | null;
  size_ml: number;
  accent: string; // couleur d'accent (hex) pour les effets de carte
  family: string; // famille olfactive
  gender: string; // homme | femme | mixte
  season: string; // ete | hiver | toutes
  product_type: string | null; // libellé libre (Français, Oriental…)
  is_pack: boolean; // vrai = produit "pack" (offre multi-flacons)
  pack_size: number | null; // nb de flacons si pack
  notes_top: string[];
  notes_heart: string[];
  notes_base: string[];
  moods: string[];
  image: string;
  gallery?: string[];
  is_featured: boolean;
  is_best_seller: boolean;
  is_active: boolean;
  stock: number;
  sort_order: number;
  created_at?: string;
};

export type OrderStatus =
  | "nouvelle"
  | "confirmee"
  | "expediee"
  | "livree"
  | "annulee";

export type OrderItem = {
  product_id: string | null;
  name: string;
  unit_price: number;
  quantity: number;
};

export type Order = {
  id: string;
  order_number: string;
  created_at: string;
  customer_name: string;
  phone: string;
  governorate: string;
  city: string;
  address: string;
  notes: string | null;
  status: OrderStatus;
  subtotal: number;
  discount_code: string | null;
  discount_amount: number;
  delivery_fee: number;
  total: number;
  source: string | null;
  customer_id: string | null;
  items: OrderItem[];
};

export type NewOrderInput = {
  customer_name: string;
  phone: string;
  governorate: string;
  city: string;
  address: string;
  notes?: string;
  code?: string;
  source?: string;
  customer_id?: string | null; // défini côté serveur (client connecté), jamais par le navigateur
  items: { product_id: string | null; name: string; unit_price: number; quantity: number }[];
};

export type DiscountType = "percent" | "fixed";

export type DiscountCode = {
  id: string;
  created_at?: string;
  code: string;
  type: DiscountType;
  value: number;
  max_uses: number | null;
  used_count: number;
  min_subtotal: number;
  source: string;
  active: boolean;
  expires_at: string | null;
};

export type ShopSettings = {
  delivery_fee: number;
  free_delivery_threshold: number;
  shop_phone: string; // numéro principal (= WhatsApp)
  shop_phone_2: string; // numéro secondaire
  shop_email: string; // email de contact
  shop_instagram: string; // URL Instagram (vide = masqué)
  shop_facebook: string; // URL Facebook (vide = masqué)
  telegram_token: string; // bot token Telegram (notifications) — vide = désactivé
  telegram_chat: string; // chat id Telegram destinataire
  fb_pixel: string; // ID Meta/Facebook Pixel (vide = masqué)
  tiktok_pixel: string; // ID TikTok Pixel (vide = masqué)
  announcement: string;
  reviews_enabled: boolean;
  roulette_enabled: boolean;
};

export type Customer = {
  id: string;
  created_at?: string;
  name: string;
  phone: string;
  email: string | null;
};

export type RoulettePrizeType = "code" | "product" | "none";

export type RoulettePrize = {
  id: string;
  created_at?: string;
  label: string;
  type: RoulettePrizeType;
  code: string | null;
  product_name: string | null;
  weight: number;
  color: string;
  active: boolean;
  sort_order: number;
};

export type RouletteWin = {
  id: string;
  created_at: string;
  prize_id: string | null;
  prize_label: string;
  type: RoulettePrizeType;
  code: string | null;
  customer_id: string | null;
  phone: string | null;
  claimed: boolean;
};

export type Banner = {
  id: string;
  created_at?: string;
  image: string; // image desktop (large / paysage)
  mobile_image: string | null; // image mobile dédiée (portrait), optionnelle
  title: string | null;
  subtitle: string | null;
  cta_label: string | null;
  cta_href: string | null;
  sort_order: number;
  active: boolean;
};

export type GoldenBatch = {
  id: string;
  created_at?: string;
  name: string;
  prize_label: string;
  ticket_count: number;
  winner_count: number;
  claim_days: number;
  active: boolean;
};

export type GoldenBatchStats = GoldenBatch & {
  scanned: number;
  claimed: number;
  active_wins: number;
  expired: number;
};

export type GoldenTicket = {
  id: string;
  created_at?: string;
  batch_id: string;
  token: string;
  is_winner: boolean;
  revealed: boolean;
  scanned_at: string | null;
  won_at: string | null;
  claim_deadline: string | null;
  claimed: boolean;
  claimed_at: string | null;
  claimer_name: string | null;
  claimer_phone: string | null;
  expired: boolean;
};

/** État public d'un ticket (jamais `is_winner` avant la révélation). */
export type GoldenPublicState =
  | { status: "invalid" }
  | { status: "ended" }
  | { status: "unrevealed"; prizeLabel: string }
  | { status: "loser" }
  | { status: "winner"; prizeLabel: string; deadline: string | null; claimed: boolean }
  | { status: "expired" };

export type ReviewStatus = "pending" | "approved" | "rejected";

export type Review = {
  id: string;
  created_at: string;
  product_id: string | null;
  product_slug: string;
  author_name: string;
  rating: number;
  comment: string;
  status: ReviewStatus;
};

export type NewReviewInput = {
  product_id: string | null;
  product_slug: string;
  author_name: string;
  rating: number;
  comment: string;
};

export const ORDER_STATUSES: { value: OrderStatus; label: string; color: string }[] = [
  { value: "nouvelle", label: "Nouvelle", color: "#1E5BFF" },
  { value: "confirmee", label: "Confirmée", color: "#9b87f5" },
  { value: "expediee", label: "Expédiée", color: "#E7B567" },
  { value: "livree", label: "Livrée", color: "#22c55e" },
  { value: "annulee", label: "Annulée", color: "#ef4444" },
];

export const DELIVERY_FEE = 7; // dinars
export const FREE_DELIVERY_THRESHOLD = 99; // livraison offerte au-dessus
