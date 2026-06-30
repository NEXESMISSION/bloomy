-- ╔══════════════════════════════════════════════════════════════╗
-- ║  Bloomy — Migration 12 : colonne `gallery` des produits          ║
-- ║                                                                ║
-- ║  Cette colonne EXISTE déjà en base de prod (ajoutée à la main au  ║
-- ║  moment des uploads d'images) mais n'avait jamais été inscrite    ║
-- ║  dans une migration → un nouveau déploiement aurait planté à      ║
-- ║  l'enregistrement d'un produit (`upsertProduct` écrit `gallery`).  ║
-- ║  On la déclare ici pour que le schéma soit reproductible.         ║
-- ║  Idempotent. Apply: node scripts/db.cjs supabase/12_product_gallery.sql ║
-- ╚══════════════════════════════════════════════════════════════╝

alter table products add column if not exists gallery text[] not null default '{}';
