-- ╔══════════════════════════════════════════════════════════════╗
-- ║  Bloomy — Migration 07 : image mobile dédiée par bannière       ║
-- ║  (évite tout recadrage : image large sur desktop, portrait sur  ║
-- ║   mobile). Apply via:                                           ║
-- ║     node scripts/db.cjs supabase/07_banner_mobile.sql           ║
-- ╚══════════════════════════════════════════════════════════════╝

alter table banners add column if not exists mobile_image text;
