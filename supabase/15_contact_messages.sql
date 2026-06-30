-- ╔══════════════════════════════════════════════════════════════╗
-- ║  Bloomy — Migration 15 : messages du formulaire de contact       ║
-- ║                                                                ║
-- ║  Le formulaire /contact n'enregistrait RIEN (il affichait juste   ║
-- ║  « Message envoyé » sans rien envoyer). Cette table reçoit les     ║
-- ║  messages ; ils sont consultables dans l'admin (/admin/messages).  ║
-- ║  RLS activée + zéro policy publique : seul le serveur (service_role)║
-- ║  y accède, comme les autres tables.                               ║
-- ║  Idempotent. Apply: node scripts/db.cjs supabase/15_contact_messages.sql ║
-- ╚══════════════════════════════════════════════════════════════╝

create table if not exists contact_messages (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  name        text not null,
  phone       text not null,
  email       text,
  message     text not null,
  handled     boolean not null default false
);
create index if not exists contact_messages_created_idx on contact_messages (created_at desc);
create index if not exists contact_messages_handled_idx on contact_messages (handled);

alter table contact_messages enable row level security;
revoke all on contact_messages from anon, authenticated;
