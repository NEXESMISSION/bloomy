-- ╔══════════════════════════════════════════════════════════════╗
-- ║  Bloomy — Migration 04 : roulette (prix + %), comptes clients,  ║
-- ║  gains. Sélection pondérée (non aléatoire), réglée par l'admin. ║
-- ╚══════════════════════════════════════════════════════════════╝

-- Comptes clients (téléphone + mot de passe)
create table if not exists customers (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  name          text not null,
  phone         text unique not null,
  email         text,
  password_hash text not null
);
alter table customers enable row level security;

-- Prix de la roulette
create table if not exists roulette_prizes (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz not null default now(),
  label        text not null,
  type         text not null default 'code',   -- 'code' | 'product' | 'none'
  code         text,                            -- code promo accordé (type=code)
  product_name text,                            -- libellé du cadeau (type=product)
  weight       numeric not null default 1,      -- probabilité relative (% = weight / somme)
  color        text not null default '#1f2937',
  active       boolean not null default true,
  sort_order   integer not null default 0
);
alter table roulette_prizes enable row level security;

-- Gains (qui a gagné quoi)
create table if not exists roulette_wins (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  prize_id    uuid references roulette_prizes(id) on delete set null,
  prize_label text not null,
  type        text not null,
  code        text,
  customer_id uuid references customers(id) on delete set null,
  phone       text,
  claimed     boolean not null default false
);
alter table roulette_wins enable row level security;
create index if not exists roulette_wins_created_idx on roulette_wins (created_at desc);

-- Réglage on/off
insert into settings (key, value) values ('roulette_enabled', 'true')
on conflict (key) do nothing;

-- Prix de démarrage (les poids = % puisqu'ils totalisent 100)
insert into roulette_prizes (label, type, code, product_name, weight, color, sort_order) values
  ('-10%', 'code', 'BLOOMY10', null, 30, '#1f2937', 1),
  ('Rien cette fois', 'none', null, null, 30, '#9ca3af', 2),
  ('-15%', 'code', 'INSTA15', null, 22, '#b45309', 3),
  ('-20%', 'code', 'TIKTOK20', null, 13, '#0f766e', 4),
  ('Parfum offert 🎁', 'product', null, 'Parfum surprise 50ml', 5, '#7c2d12', 5)
on conflict do nothing;
