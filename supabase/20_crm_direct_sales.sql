-- ╔══════════════════════════════════════════════════════════════╗
-- ║  Bloomy — Migration 20 : Ventes directes du CRM                   ║
-- ║  Un commercial peut vendre sur place (flacons / packs) à une      ║
-- ║  boutique, encaisser une partie, et le solde restant est suivi.   ║
-- ║  Réutilise consignment_shops (boutiques) + consignment_products.  ║
-- ║  Apply: node scripts/db.cjs supabase/20_crm_direct_sales.sql      ║
-- ╚══════════════════════════════════════════════════════════════╝

-- Une vente directe (sur place) rattachée à une boutique + le commercial.
create table if not exists crm_sales (
  id         uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  shop_id    uuid references consignment_shops(id) on delete set null,
  sold_by    uuid references staff_members(id) on delete set null,
  total      numeric not null default 0,
  note       text
);
create index if not exists crm_sales_shop_idx   on crm_sales (shop_id);
create index if not exists crm_sales_soldby_idx on crm_sales (sold_by);
create index if not exists crm_sales_date_idx   on crm_sales (created_at desc);

-- Les lignes de la vente (snapshot du nom + prix au moment de la vente).
create table if not exists crm_sale_items (
  id           uuid primary key default gen_random_uuid(),
  sale_id      uuid references crm_sales(id) on delete cascade,
  product_id   uuid references consignment_products(id) on delete set null,
  product_name text not null,
  unit_price   numeric not null default 0,
  quantity     integer not null default 1,
  line_total   numeric not null default 0
);
create index if not exists crm_sale_items_sale_idx on crm_sale_items (sale_id);

-- Encaissements (le paiement initial d'une vente + tout paiement ultérieur).
-- Solde d'une boutique = Σ ventes.total − Σ paiements.amount.
create table if not exists crm_payments (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  shop_id     uuid references consignment_shops(id) on delete cascade,
  sale_id     uuid references crm_sales(id) on delete set null,
  amount      numeric not null default 0,
  received_by uuid references staff_members(id) on delete set null,
  note        text
);
create index if not exists crm_payments_shop_idx on crm_payments (shop_id);

alter table crm_sales      enable row level security;
alter table crm_sale_items enable row level security;
alter table crm_payments   enable row level security;
revoke all on crm_sales      from anon, authenticated;
revoke all on crm_sale_items from anon, authenticated;
revoke all on crm_payments   from anon, authenticated;
