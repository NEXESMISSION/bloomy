-- ╔══════════════════════════════════════════════════════════════╗
-- ║  Bloomy — Migration 02 : catalogue (4 parfums), codes promo,    ║
-- ║  suivi des sources (leads), paramètres boutique.               ║
-- ╚══════════════════════════════════════════════════════════════╝

-- 1) Remplacer le catalogue de démonstration par les 4 parfums réels.
-- NON DESTRUCTIF & idempotent : on supprime UNIQUEMENT les 5 produits
-- placeholder de schema.sql, et seulement s'ils ne sont référencés par aucune
-- commande. On ne touche JAMAIS aux commandes / order_items (re-exécuter cette
-- migration ne doit jamais détruire de données client).
delete from products p
 where p.id in (
   '11111111-1111-1111-1111-111111111111',
   '22222222-2222-2222-2222-222222222222',
   '33333333-3333-3333-3333-333333333333',
   '44444444-4444-4444-4444-444444444444',
   '55555555-5555-5555-5555-555555555555'
 )
 and not exists (select 1 from order_items oi where oi.product_id = p.id);

insert into products
  (id, slug, name, tagline, description, price, compare_at_price, size_ml, accent, family,
   notes_top, notes_heart, notes_base, moods, image, is_featured, is_best_seller, is_active, stock, sort_order)
values
  ('a1111111-1111-1111-1111-111111111111','most-wanted','The Most Wanted',
   'L''élixir de la séduction. — Inspiré d''Azzaro The Most Wanted.',
   'Un sillage chaud et addictif, pensé pour les soirées qui marquent. Cardamome et gingembre vibrants, cœur de liqueur de toffee et de cuir, fond de bois ambré et de vétiver.',
   39.900, 59.900, 50, '#E7B567', 'Ambré Épicé',
   '{"Cardamome","Gingembre"}','{"Liqueur de toffee","Cuir"}','{"Bois ambré","Vétiver"}',
   '{"Séduction","Soir","Audacieux"}','/products/most-wanted.png', true, true, true, 50, 1),

  ('a2222222-2222-2222-2222-222222222222','imagination','Imagination',
   'Un voyage olfactif lumineux. — Inspiré de LV Imagination.',
   'La fraîcheur raffinée d''un grand voyage. Bergamote et thé noir, gingembre et cardamome, fond d''ambre, bois de santal et musc.',
   36.900, null, 50, '#21C7D0', 'Boisé Aromatique',
   '{"Bergamote","Thé noir"}','{"Gingembre","Cardamome"}','{"Ambre","Bois de santal","Musc"}',
   '{"Frais","Élégant","Jour"}','/products/imagination.png', true, false, true, 45, 2),

  ('a3333333-3333-3333-3333-333333333333','sauvage','Sauvage',
   'La fraîcheur brute et magnétique. — Inspiré de Dior Sauvage.',
   'Le sillage signature par excellence. Bergamote et poivre de Sichuan, lavande aromatique, ambroxan et cèdre puissants.',
   38.900, 54.900, 50, '#1E5BFF', 'Aromatique Fougère',
   '{"Bergamote","Poivre de Sichuan"}','{"Lavande","Géranium"}','{"Ambroxan","Cèdre"}',
   '{"Signature","Frais","Quotidien"}','/products/sauvage.png', false, true, true, 48, 3),

  ('a4444444-4444-4444-4444-444444444444','bleu-de-chanel','Bleu de Chanel',
   'L''élégance intemporelle. — Inspiré de Chanel Bleu.',
   'Le raffinement à l''état pur. Agrumes et menthe vives, gingembre et pamplemousse, encens, cèdre et santal nobles.',
   37.900, null, 50, '#3B82F6', 'Boisé Aromatique',
   '{"Agrumes","Menthe"}','{"Gingembre","Pamplemousse"}','{"Encens","Cèdre","Santal"}',
   '{"Élégant","Affaires","Soir"}','/products/bleu-de-chanel.png', true, false, true, 42, 4)
on conflict (id) do nothing;

-- 2) Codes de réduction (+ suivi des sources / leads)
create table if not exists discount_codes (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  code          text unique not null,
  type          text not null default 'percent',  -- 'percent' | 'fixed'
  value         numeric(10,3) not null default 0,
  max_uses      integer,                           -- null = illimité
  used_count    integer not null default 0,
  min_subtotal  numeric(10,3) not null default 0,
  source        text default '',                   -- d'où vient le lead (Instagram, TikTok @x, ...)
  active        boolean not null default true,
  expires_at    timestamptz
);
alter table discount_codes enable row level security;

-- 3) Suivi sur les commandes
alter table orders add column if not exists discount_code   text;
alter table orders add column if not exists discount_amount numeric(10,3) not null default 0;
alter table orders add column if not exists source          text default '';
create index if not exists orders_source_idx on orders (source);
create index if not exists orders_code_idx on orders (discount_code);

-- 4) Paramètres de la boutique
create table if not exists settings (
  key   text primary key,
  value text not null
);
alter table settings enable row level security;
insert into settings (key, value) values
  ('delivery_fee','7'),
  ('free_delivery_threshold','99'),
  ('shop_phone','21600000000'),
  ('announcement','🚚 Livraison partout en Tunisie · Paiement à la livraison')
on conflict (key) do nothing;

-- 5) Redemption atomique d'un code (respecte la limite d'utilisations)
create or replace function redeem_discount(p_code text)
returns boolean language plpgsql as $$
declare ok boolean;
begin
  update discount_codes
     set used_count = used_count + 1
   where upper(code) = upper(p_code)
     and active = true
     and (expires_at is null or expires_at > now())
     and (max_uses is null or used_count < max_uses)
  returning true into ok;
  return coalesce(ok, false);
end; $$;

-- 6) Quelques codes de démarrage
insert into discount_codes (code, type, value, max_uses, source) values
  ('BLOOMY10','percent',10,null,'Site web'),
  ('INSTA15','percent',15,100,'Instagram'),
  ('TIKTOK20','percent',20,50,'TikTok')
on conflict (code) do nothing;
