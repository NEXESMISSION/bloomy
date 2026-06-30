-- ╔══════════════════════════════════════════════════════════════╗
-- ║  Bloomy — Migration 16 : ajustement ATOMIQUE du stock            ║
-- ║                                                                ║
-- ║  Les ventes / annulations / réappro faisaient SELECT stock puis   ║
-- ║  UPDATE stock=valeur — deux opérations concurrentes pouvaient se   ║
-- ║  marcher dessus (lost update / survente). Cette fonction fait      ║
-- ║  l'arithmétique en une seule requête atomique (greatest borne à 0).║
-- ║  Idempotent. Apply: node scripts/db.cjs supabase/16_adjust_stock.sql ║
-- ╚══════════════════════════════════════════════════════════════╝

create or replace function adjust_stock(p_id uuid, p_delta integer)
returns void language sql as $$
  update products set stock = greatest(0, stock + p_delta) where id = p_id;
$$;
