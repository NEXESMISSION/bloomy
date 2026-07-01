-- ╔══════════════════════════════════════════════════════════════╗
-- ║  Bloomy — Migration 19 : CRM multi-utilisateur (dépôt-vente)      ║
-- ║  Assignation d'une boutique à un commercial + demandes de         ║
-- ║  production (labo) pour les produits dépôt-vente. Réutilise        ║
-- ║  staff_members (PIN/rôles) et activity_log déjà présents.          ║
-- ║  Apply: node scripts/db.cjs supabase/19_crm_roles.sql              ║
-- ╚══════════════════════════════════════════════════════════════╝

-- Chaque boutique dépôt-vente peut être assignée à un commercial (staff).
alter table consignment_shops add column if not exists assigned_to uuid references staff_members(id) on delete set null;
create index if not exists consignment_shops_assigned_idx on consignment_shops (assigned_to);

-- Demandes de production au labo (réappro des parfums dépôt-vente).
create table if not exists production_requests (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz not null default now(),
  product_id   uuid references consignment_products(id) on delete set null,
  product_name text not null,
  quantity     integer not null default 0,
  status       text not null default 'demande',   -- demande | en_cours | recu
  note         text,
  requested_by uuid references staff_members(id) on delete set null,
  done_at      timestamptz
);
create index if not exists production_requests_status_idx on production_requests (status);

alter table production_requests enable row level security;
revoke all on production_requests from anon, authenticated;
