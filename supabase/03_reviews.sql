-- ╔══════════════════════════════════════════════════════════════╗
-- ║  Bloomy — Migration 03 : avis clients (modérés) + réglage on/off ║
-- ╚══════════════════════════════════════════════════════════════╝

create table if not exists reviews (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz not null default now(),
  product_id   uuid references products(id) on delete cascade,
  product_slug text not null,
  author_name  text not null,
  rating       integer not null check (rating between 1 and 5),
  comment      text not null default '',
  status       text not null default 'pending'  -- pending | approved | rejected
);
create index if not exists reviews_slug_status_idx on reviews (product_slug, status);
create index if not exists reviews_status_idx on reviews (status, created_at desc);

alter table reviews enable row level security;
-- aucune policy publique : tout passe par le serveur (service_role)

insert into settings (key, value) values ('reviews_enabled', 'true')
on conflict (key) do nothing;
