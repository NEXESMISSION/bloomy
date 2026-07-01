-- ╔══════════════════════════════════════════════════════════════╗
-- ║  Bloomy — Migration 17 : Dépôt-vente (consignation)              ║
-- ║                                                                ║
-- ║  Vous possédez le stock, les boutiques vendent à la commission.  ║
-- ║  On suit : quel display est dans quelle boutique, combien de      ║
-- ║  flacons livrés / restants / vendus, la commission due, les       ║
-- ║  best-sellers. Module SÉPARÉ du catalogue en ligne et des clients. ║
-- ║  RLS activée + zéro accès public (comme le reste).                ║
-- ║  Apply: node scripts/db.cjs supabase/17_consignment.sql           ║
-- ╚══════════════════════════════════════════════════════════════╝

create extension if not exists "pgcrypto";

-- ─────────── Produits en dépôt-vente (marque propre : Vanilla, Ocean…) ───────────
create table if not exists consignment_products (
  id                 uuid primary key default gen_random_uuid(),
  created_at         timestamptz not null default now(),
  name               text not null,
  sku                text,
  size_ml            integer not null default 50,
  cost_price         numeric(10,3) not null default 0,   -- prix de revient
  selling_price      numeric(10,3) not null default 0,   -- prix de vente public
  commission_per_sale numeric(10,3) not null default 0,  -- commission boutique / flacon vendu
  warehouse_stock    integer not null default 0,         -- stock ENTREPÔT (hors boutiques)
  active             boolean not null default true
);

-- ─────────── Boutiques (dépôt-vente) — séparé des `clients` ───────────
create table if not exists consignment_shops (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz not null default now(),
  name         text not null,
  owner_name   text,
  phone        text,
  location     text,
  governorate  text,
  status       text not null default 'active',  -- active | paused | removed
  notes        text
);
create index if not exists consignment_shops_status_idx on consignment_shops (status);

-- ─────────── Displays physiques (boîtes) — suivis par code ───────────
create table if not exists display_boxes (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  code        text unique not null,               -- DISPLAY-001…
  status      text not null default 'available',  -- available | placed | removed
  notes       text
);

-- ─────────── Placement : un display posé dans une boutique ───────────
create table if not exists placements (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  display_id  uuid references display_boxes(id) on delete set null,
  shop_id     uuid references consignment_shops(id) on delete cascade,
  placed_at   timestamptz not null default now(),
  removed_at  timestamptz,
  status      text not null default 'active'       -- active | removed
);
create index if not exists placements_shop_idx on placements (shop_id);
create index if not exists placements_status_idx on placements (status);

-- Flacons d'un placement : cible « plein » + quantité actuelle connue
create table if not exists placement_items (
  id           uuid primary key default gen_random_uuid(),
  placement_id uuid not null references placements(id) on delete cascade,
  product_id   uuid references consignment_products(id) on delete set null,
  full_qty     integer not null default 0,   -- quantité « display plein »
  current_qty  integer not null default 0    -- quantité actuelle (mise à jour à chaque visite)
);
create index if not exists placement_items_placement_idx on placement_items (placement_id);

-- ─────────── Visites (comptage hebdomadaire) ───────────
create table if not exists consignment_visits (
  id               uuid primary key default gen_random_uuid(),
  created_at       timestamptz not null default now(),
  placement_id     uuid references placements(id) on delete set null,
  shop_id          uuid references consignment_shops(id) on delete cascade,
  visited_at       timestamptz not null default now(),
  total_sold       integer not null default 0,
  revenue          numeric(10,3) not null default 0,     -- CA = Σ vendus × prix de vente
  commission_total numeric(10,3) not null default 0,     -- part boutique
  amount_collected numeric(10,3) not null default 0,     -- ce que VOUS encaissez
  notes            text,
  created_by       uuid
);
create index if not exists consignment_visits_shop_idx on consignment_visits (shop_id);
create index if not exists consignment_visits_created_idx on consignment_visits (created_at desc);

create table if not exists consignment_visit_items (
  id         uuid primary key default gen_random_uuid(),
  visit_id   uuid not null references consignment_visits(id) on delete cascade,
  product_id uuid references consignment_products(id) on delete set null,
  remaining  integer not null default 0,   -- comptés restants
  sold       integer not null default 0,   -- vendus depuis la dernière visite
  refilled   integer not null default 0    -- réapprovisionnés ce jour
);
create index if not exists consignment_visit_items_visit_idx on consignment_visit_items (visit_id);

-- ─────────── Sécurité : RLS + retrait des droits publics ───────────
alter table consignment_products     enable row level security;
alter table consignment_shops        enable row level security;
alter table display_boxes            enable row level security;
alter table placements               enable row level security;
alter table placement_items          enable row level security;
alter table consignment_visits       enable row level security;
alter table consignment_visit_items  enable row level security;

revoke all on consignment_products, consignment_shops, display_boxes, placements,
              placement_items, consignment_visits, consignment_visit_items
  from anon, authenticated;
