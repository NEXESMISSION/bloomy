-- ╔══════════════════════════════════════════════════════════════╗
-- ║  Bloomy — Migration 14 : rattacher les commandes aux comptes     ║
-- ║  clients. Permet de suivre l'historique d'un client connecté et   ║
-- ║  de relier l'expérience d'achat à la roulette (gains).            ║
-- ║  Idempotent. Apply: node scripts/db.cjs supabase/14_order_customer.sql ║
-- ╚══════════════════════════════════════════════════════════════╝

alter table orders add column if not exists customer_id uuid references customers(id) on delete set null;
create index if not exists orders_customer_idx on orders (customer_id);
