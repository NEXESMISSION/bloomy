-- ╔══════════════════════════════════════════════════════════════╗
-- ║  Bloomy — Migration 11 : coordonnées pilotées par le super admin ║
-- ║                                                                ║
-- ║  Le téléphone et l'email ne sont plus codés en dur dans les      ║
-- ║  pages : ils vivent dans `settings` et se modifient depuis        ║
-- ║  /admin/parametres. Deux numéros + un email.                      ║
-- ║   • shop_phone   = numéro principal (= WhatsApp)                  ║
-- ║   • shop_phone_2 = numéro secondaire                              ║
-- ║   • shop_email   = email de contact                               ║
-- ║                                                                ║
-- ║  Apply: node scripts/db.cjs supabase/11_contact_settings.sql      ║
-- ╚══════════════════════════════════════════════════════════════╝

-- Numéro principal : on ne remplace que l'ancien placeholder (jamais une
-- valeur déjà saisie par l'admin), pour rester ré-exécutable sans risque.
insert into settings (key, value) values ('shop_phone', '58415520')
on conflict (key) do update set value = excluded.value
  where settings.value in ('21600000000', '');

-- Nouvelles clés : créées si absentes, sinon laissées telles quelles.
insert into settings (key, value) values
  ('shop_phone_2', '58415506'),
  ('shop_email',   'bloomy.tn@gmail.com')
on conflict (key) do nothing;
