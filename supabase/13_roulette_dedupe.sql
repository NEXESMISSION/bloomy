-- ╔══════════════════════════════════════════════════════════════╗
-- ║  Bloomy — Migration 13 : déduplication des lots de roulette       ║
-- ║                                                                ║
-- ║  Le seed de la migration 04 avait été appliqué plusieurs fois →   ║
-- ║  chaque lot existait en 7 exemplaires (35 lignes) → la roue et la  ║
-- ║  légende affichaient tout en double/septuple. On ne garde que le   ║
-- ║  plus ancien de chaque lot (label + type + code).                  ║
-- ║  Idempotent. Apply: node scripts/db.cjs supabase/13_roulette_dedupe.sql ║
-- ╚══════════════════════════════════════════════════════════════╝

with ranked as (
  select id,
         row_number() over (
           partition by label, type, coalesce(code, '')
           order by created_at, id
         ) as rn
  from roulette_prizes
)
delete from roulette_prizes where id in (select id from ranked where rn > 1);
