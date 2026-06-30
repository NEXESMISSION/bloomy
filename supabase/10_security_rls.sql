-- ╔══════════════════════════════════════════════════════════════╗
-- ║  Bloomy — Migration 10 : durcissement sécurité (RLS)            ║
-- ║                                                                ║
-- ║  CRITIQUE. Plusieurs tables avaient la Row Level Security        ║
-- ║  DÉSACTIVÉE. Or le rôle public « anon » (dont la clé est         ║
-- ║  publique, exposée au navigateur) disposait de tous les droits   ║
-- ║  (SELECT/INSERT/UPDATE/DELETE/TRUNCATE). N'importe qui pouvait    ║
-- ║  donc lire/modifier/effacer :                                    ║
-- ║   • staff_members  → hash des PIN (crackables hors-ligne)         ║
-- ║   • clients/sales/payments → données clients + finances           ║
-- ║   • golden_tickets → savoir quels QR gagnent AVANT de scanner,    ║
-- ║                      ou se déclarer gagnant/réclamé soi-même      ║
-- ║   • notes / activity_log / banners / restock_requests ...        ║
-- ║                                                                ║
-- ║  Toute l'application accède à la base via la clé « service_role »  ║
-- ║  (côté serveur uniquement), qui CONTOURNE toujours la RLS. On      ║
-- ║  active donc la RLS SANS aucune policy publique : tout devient     ║
-- ║  « refusé par défaut » pour anon, et seul le serveur peut lire.    ║
-- ║                                                                ║
-- ║  Idempotent. Apply: node scripts/db.cjs supabase/10_security_rls.sql ║
-- ╚══════════════════════════════════════════════════════════════╝

alter table staff_members    enable row level security;
alter table clients          enable row level security;
alter table sales            enable row level security;
alter table sale_items       enable row level security;
alter table payments         enable row level security;
alter table restock_requests enable row level security;
alter table notes            enable row level security;
alter table activity_log     enable row level security;
alter table banners          enable row level security;
alter table golden_batches   enable row level security;
alter table golden_tickets   enable row level security;

-- Ceinture + bretelles : on retire aussi explicitement les droits de table
-- accordés par défaut aux rôles publics. (La RLS seule suffit déjà à bloquer,
-- mais cela évite toute fuite si une policy était ajoutée par erreur plus tard.)
revoke all on staff_members,    clients, sales, sale_items, payments,
              restock_requests, notes,   activity_log,
              banners,          golden_batches, golden_tickets
  from anon, authenticated;
