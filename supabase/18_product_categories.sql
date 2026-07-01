-- ╔══════════════════════════════════════════════════════════════╗
-- ║  Bloomy — Migration 18 : catégories produits + packs             ║
-- ║  Genre (homme/femme/mixte), saison (été/hiver/toutes), type       ║
-- ║  (libellé libre : Français, Oriental…) et packs (offres multi-     ║
-- ║  flacons vendues comme des produits à part).                      ║
-- ║  Idempotent. Apply: node scripts/db.cjs supabase/18_product_categories.sql ║
-- ╚══════════════════════════════════════════════════════════════╝

alter table products add column if not exists gender       text not null default 'mixte';  -- homme | femme | mixte
alter table products add column if not exists season       text not null default 'toutes'; -- ete | hiver | toutes
alter table products add column if not exists product_type text;                            -- libellé libre (Français, Oriental, Pack…)
alter table products add column if not exists is_pack      boolean not null default false;  -- vrai = produit "pack"
alter table products add column if not exists pack_size    integer;                          -- nb de flacons si pack

create index if not exists products_gender_idx on products (gender);
create index if not exists products_season_idx on products (season);
