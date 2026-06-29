-- ╔══════════════════════════════════════════════════════════════╗
-- ║  Bloomy — Migration 08 : "Golden Ticket"                        ║
-- ║  Campagnes de QR codes uniques & sécurisés. Un (ou plusieurs)   ║
-- ║  gagnant par lot ; gain réattribué si non réclamé à temps.      ║
-- ║  Apply via: node scripts/db.cjs supabase/08_golden.sql          ║
-- ╚══════════════════════════════════════════════════════════════╝

create extension if not exists "pgcrypto";

-- Un "lot" = un événement (ex. "Ramadan 2026").
create table if not exists golden_batches (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz not null default now(),
  name         text not null,
  prize_label  text not null,            -- ce que l'on gagne (texte libre : "100 DT", "Parfum offert"…)
  ticket_count integer not null default 0,
  winner_count integer not null default 1,
  claim_days   integer not null default 7, -- délai de réclamation (jours)
  active       boolean not null default true
);

-- Un ticket = un QR code. Le `token` (aléatoire, non devinable) est dans l'URL.
create table if not exists golden_tickets (
  id             uuid primary key default gen_random_uuid(),
  created_at     timestamptz not null default now(),
  batch_id       uuid not null references golden_batches(id) on delete cascade,
  token          text not null unique,      -- secret 160 bits ; identifiant public du QR
  is_winner      boolean not null default false, -- détient actuellement un gain
  revealed       boolean not null default false, -- a déjà été scanné/révélé
  scanned_at     timestamptz,
  won_at         timestamptz,
  claim_deadline timestamptz,
  claimed        boolean not null default false,
  claimed_at     timestamptz,
  claimer_name   text,
  claimer_phone  text,
  expired        boolean not null default false  -- gain perdu (non réclamé à temps)
);
create index if not exists golden_tickets_batch_idx on golden_tickets (batch_id);
create index if not exists golden_tickets_token_idx on golden_tickets (token);
create index if not exists golden_tickets_winner_idx on golden_tickets (batch_id, is_winner) where is_winner = true;
