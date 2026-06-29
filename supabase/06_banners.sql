-- ╔══════════════════════════════════════════════════════════════╗
-- ║  Bloomy — Migration 06 : Bannières animées du hero (gérées      ║
-- ║  depuis le super admin). Apply via:                            ║
-- ║    node scripts/db.cjs supabase/06_banners.sql                 ║
-- ╚══════════════════════════════════════════════════════════════╝

create extension if not exists "pgcrypto";

create table if not exists banners (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  image       text not null,
  title       text,
  subtitle    text,
  cta_label   text,
  cta_href    text,
  sort_order  integer not null default 0,
  active      boolean not null default true
);
create index if not exists banners_sort_idx on banners (sort_order);

-- Bannières de démarrage (l'admin pourra les modifier / remplacer).
insert into banners (image, title, subtitle, cta_label, cta_href, sort_order, active)
select * from (values
  ('/photos/lineup.png', 'Vos parfums préférés, à prix Bloomy.', 'Quatre eaux de toilette inspirées des plus grands · Livraison partout en Tunisie.', 'Découvrir la collection', '/boutique', 0, true),
  ('/products/most-wanted.png', 'The Most Wanted', 'Inspiré d''Azzaro — offre limitée', 'J''en profite', '/produit/most-wanted', 1, true)
) as v(image, title, subtitle, cta_label, cta_href, sort_order, active)
where not exists (select 1 from banners);
