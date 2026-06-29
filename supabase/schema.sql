-- ╔══════════════════════════════════════════════════════════════╗
-- ║  Bloomy — Schéma Supabase (PostgreSQL)                          ║
-- ║  À exécuter dans : Supabase Dashboard > SQL Editor > New query  ║
-- ╚══════════════════════════════════════════════════════════════╝

create extension if not exists "pgcrypto";

-- ─────────────────────────── PRODUITS ───────────────────────────
create table if not exists products (
  id               uuid primary key default gen_random_uuid(),
  created_at       timestamptz not null default now(),
  slug             text unique not null,
  name             text not null,
  tagline          text default '',
  description      text default '',
  price            numeric(10,3) not null default 0,
  compare_at_price numeric(10,3),
  size_ml          integer not null default 50,
  accent           text default '#1E5BFF',
  family           text default '',
  notes_top        text[] default '{}',
  notes_heart      text[] default '{}',
  notes_base       text[] default '{}',
  moods            text[] default '{}',
  image            text default '/products/midnight-edge.png',
  is_featured      boolean not null default false,
  is_best_seller   boolean not null default false,
  is_active        boolean not null default true,
  stock            integer not null default 0,
  sort_order       integer not null default 0
);

create index if not exists products_active_idx on products (is_active, sort_order);

-- ─────────────────────────── COMMANDES ──────────────────────────
create table if not exists orders (
  id             uuid primary key default gen_random_uuid(),
  created_at     timestamptz not null default now(),
  order_number   text unique not null,
  customer_name  text not null,
  phone          text not null,
  governorate    text not null,
  city           text not null,
  address        text not null,
  notes          text,
  status         text not null default 'nouvelle',
  subtotal       numeric(10,3) not null default 0,
  delivery_fee   numeric(10,3) not null default 0,
  total          numeric(10,3) not null default 0
);

create index if not exists orders_created_idx on orders (created_at desc);
create index if not exists orders_status_idx on orders (status);

create table if not exists order_items (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null references orders(id) on delete cascade,
  product_id  uuid references products(id) on delete set null,
  name        text not null,
  unit_price  numeric(10,3) not null default 0,
  quantity    integer not null default 1
);

create index if not exists order_items_order_idx on order_items (order_id);

-- ─────────────────────────────── RLS ────────────────────────────
-- La clé "service_role" (utilisée côté serveur par l'app) contourne
-- toujours la RLS. On expose donc UNIQUEMENT la lecture publique des
-- produits actifs ; les commandes restent inaccessibles en public.
alter table products    enable row level security;
alter table orders      enable row level security;
alter table order_items enable row level security;

drop policy if exists "products_public_read" on products;
create policy "products_public_read"
  on products for select
  using (is_active = true);

-- (aucune policy publique sur orders / order_items :
--  tout passe par le serveur avec la clé service_role)

-- ─────────────────────────── DONNÉES SEED ───────────────────────
insert into products
  (id, slug, name, tagline, description, price, compare_at_price, size_ml, accent, family,
   notes_top, notes_heart, notes_base, moods, image, is_featured, is_best_seller, is_active, stock, sort_order)
values
  ('11111111-1111-1111-1111-111111111111','midnight-edge','Midnight Edge',
   'L''audace, une fois la nuit tombée.',
   'Un sillage profond et magnétique pensé pour les soirées qui ne s''oublient pas. Bergamote vibrante, lavande racée, ambre et bois de oud.',
   29.900, 39.900, 50, '#1E5BFF', 'Ambré Boisé',
   '{"Bergamote","Poivre noir"}','{"Lavande","Sauge sclarée"}','{"Ambre","Bois de oud","Vétiver"}',
   '{"Nuit","Audacieux","Intense"}','/products/midnight-edge.png', true, true, true, 48, 1),

  ('22222222-2222-2222-2222-222222222222','ocean-drift','Ocean Drift',
   'Une bouffée d''air marin.',
   'La fraîcheur du large enfermée dans un flacon. Agrumes pétillants, sel marin et néroli, musc blanc lumineux et bois flotté.',
   27.900, null, 50, '#21C7D0', 'Aromatique Aquatique',
   '{"Agrumes","Menthe aquatique"}','{"Sel marin","Néroli"}','{"Musc blanc","Bois flotté"}',
   '{"Frais","Sport","Énergie"}','/products/ocean-drift.png', true, false, true, 52, 2),

  ('33333333-3333-3333-3333-333333333333','urban-legend','Urban Legend',
   'Le sillage qui marque les esprits.',
   'Pour celui qui laisse une trace partout où il passe. Cardamome épicée, cuir et iris, vétiver, patchouli et fève tonka.',
   31.900, 42.000, 50, '#E7B567', 'Cuiré Épicé',
   '{"Cardamome","Pamplemousse"}','{"Cuir","Iris"}','{"Vétiver","Patchouli","Fève tonka"}',
   '{"Signature","Élégant","Soir"}','/products/urban-legend.png', false, true, true, 37, 3),

  ('44444444-4444-4444-4444-444444444444','blue-vibe','Blue Vibe',
   'La fraîcheur décontractée du quotidien.',
   'Le compagnon de tous les jours, propre et lumineux. Citron et pomme verte, lavande et géranium, cèdre et musc enveloppant.',
   26.900, null, 50, '#3B82F6', 'Frais Boisé',
   '{"Citron","Pomme verte"}','{"Lavande","Géranium"}','{"Cèdre","Musc"}',
   '{"Quotidien","Décontracté","Propre"}','/products/blue-vibe.png', true, false, true, 60, 4),

  ('55555555-5555-5555-5555-555555555555','iron-spirit','Iron Spirit',
   'La force tranquille.',
   'Une assurance qui n''a pas besoin d''élever la voix. Gingembre et poivre rose, encens et cardamome minérale, santal et ambre gris.',
   32.900, null, 50, '#AAB4C4', 'Boisé Minéral',
   '{"Gingembre","Poivre rose"}','{"Encens","Cardamome"}','{"Santal","Ambre gris","Cèdre"}',
   '{"Puissant","Charismatique","Affaires"}','/products/iron-spirit.png', false, false, true, 41, 5)
on conflict (id) do nothing;
