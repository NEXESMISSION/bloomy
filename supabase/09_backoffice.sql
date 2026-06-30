-- ╔══════════════════════════════════════════════════════════════╗
-- ║  Bloomy — Migration 09 : Back-office (gestion réelle)            ║
-- ║  Équipe (PIN), clients/boutiques (+photo), ventes, encaissements ║
-- ║  (argent à récupérer), inventaire, demandes de réappro, notes,   ║
-- ║  journal d'activité (qui a fait quoi). Multi-utilisateurs.       ║
-- ║  Apply: node scripts/db.cjs supabase/09_backoffice.sql          ║
-- ╚══════════════════════════════════════════════════════════════╝

create extension if not exists "pgcrypto";

-- ─────────── Équipe : chaque membre a un code PIN ───────────
create table if not exists staff_members (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  name        text not null,
  pin_hash    text not null,                      -- scrypt(PIN) — jamais le PIN en clair
  role        text not null default 'staff',      -- 'owner' | 'staff'
  color       text default '#17171B',
  active      boolean not null default true
);

-- ─────────── Clients : particuliers ET boutiques (offline) ───────────
create table if not exists clients (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  kind          text not null default 'particulier', -- 'particulier' | 'boutique'
  name          text not null,
  phone         text,
  email         text,
  governorate   text,
  city          text,
  address       text,
  photo_url     text,                                 -- photo du lieu/boutique (pour s'en souvenir)
  location_note text,
  credit_limit  numeric(10,3) not null default 0,
  tags          text[] not null default '{}',
  notes         text,
  created_by    uuid references staff_members(id) on delete set null
);
create index if not exists clients_phone_idx on clients (phone);
create index if not exists clients_kind_idx on clients (kind);

-- ─────────── Ventes (en ligne, en boutique, en gros) ───────────
create table if not exists sales (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz not null default now(),
  sale_number     text,
  client_id       uuid references clients(id) on delete set null,
  channel         text not null default 'boutique',   -- 'en_ligne' | 'boutique' | 'gros'
  status          text not null default 'completee',  -- 'completee' | 'annulee'
  subtotal        numeric(10,3) not null default 0,
  discount        numeric(10,3) not null default 0,
  total           numeric(10,3) not null default 0,
  amount_paid     numeric(10,3) not null default 0,   -- miroir = SUM(payments)
  pay_status      text not null default 'impayee',    -- 'payee' | 'partielle' | 'impayee'
  notes           text,
  sold_by         uuid references staff_members(id) on delete set null,
  created_by      uuid references staff_members(id) on delete set null
);
create index if not exists sales_client_idx on sales (client_id);
create index if not exists sales_created_idx on sales (created_at desc);

create table if not exists sale_items (
  id          uuid primary key default gen_random_uuid(),
  sale_id     uuid not null references sales(id) on delete cascade,
  product_id  uuid references products(id) on delete set null,
  name        text not null,
  unit_price  numeric(10,3) not null default 0,
  cost_price  numeric(10,3),
  quantity    integer not null default 1
);
create index if not exists sale_items_sale_idx on sale_items (sale_id);

-- ─────────── Encaissements (argent à récupérer = total − payé) ───────────
create table if not exists payments (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  sale_id     uuid references sales(id) on delete cascade,
  client_id   uuid references clients(id) on delete set null,
  amount      numeric(10,3) not null,
  method      text not null default 'espece',
  note        text,
  received_by uuid references staff_members(id) on delete set null
);
create index if not exists payments_client_idx on payments (client_id);
create index if not exists payments_sale_idx on payments (sale_id);

-- ─────────── Inventaire : on étend products + demandes de réappro ───────────
alter table products add column if not exists cost_price          numeric(10,3);
alter table products add column if not exists low_stock_threshold integer not null default 5;

create table if not exists restock_requests (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz not null default now(),
  product_id   uuid references products(id) on delete set null,
  product_name text not null,
  quantity     integer not null default 0,
  status       text not null default 'a_faire',   -- 'a_faire' | 'en_cours' | 'fait'
  note         text,
  requested_by uuid references staff_members(id) on delete set null,
  done_at      timestamptz
);
create index if not exists restock_status_idx on restock_requests (status);

-- ─────────── Notes (sur n'importe quoi) ───────────
create table if not exists notes (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  entity_type text not null,                       -- 'client' | 'sale' | 'general'
  entity_id   uuid,
  body        text not null,
  author_id   uuid references staff_members(id) on delete set null,
  author_name text
);
create index if not exists notes_entity_idx on notes (entity_type, entity_id);

-- ─────────── Journal d'activité (qui a fait quoi / qui a dit quoi) ───────────
create table if not exists activity_log (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  actor_id    uuid,
  actor_name  text,
  action      text not null,
  entity_type text,
  entity_id   uuid,
  detail      text
);
create index if not exists activity_created_idx on activity_log (created_at desc);
