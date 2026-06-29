# Bloomy — Boutique e-commerce (paiement à la livraison)

Site e-commerce pour **Bloomy**, marque de sprays parfumés pour homme.
Thème sombre (navy / bleu électrique), 100 % en français, prix en **dinar tunisien (DT)**.
Pas de paiement en ligne : le client remplit un formulaire (nom, téléphone, gouvernorat,
ville, adresse) et la commande est traitée en **paiement à la livraison**.

## ✨ Fonctionnalités

- **Landing page animée** : hero, bannières, collections, best-seller, pyramide olfactive,
  shop by mood, témoignages, newsletter, FAQ.
- **Boutique** avec recherche, filtres par humeur et tri.
- **Fiche produit** détaillée (pyramide olfactive, réassurance, produits liés).
- **Panier** (slide-over) + **tunnel de commande** sans paiement en ligne.
- **Page de confirmation** avec numéro de commande.
- **Super admin** (`/admin`) : tableau de bord, gestion des commandes (statuts, contact client),
  CRUD complet des produits.
- **Mode démo** : fonctionne sans Supabase (données locales dans `.data/`) pour tester
  tout le tunnel immédiatement.

## 🧱 Stack

Next.js 14 (App Router) · TypeScript · Tailwind CSS · Framer Motion · Supabase (PostgreSQL) · Vercel.

## 🚀 Démarrage local

```bash
npm install
npm run dev
# http://localhost:3000
```

Sans configuration, le site tourne en **mode démo** (catalogue d'exemple, commandes
enregistrées localement). Admin accessible sur `/admin` avec le mot de passe par défaut
`bloomy-admin`.

## 🗄️ Configurer Supabase (production)

1. Créez un projet sur [supabase.com](https://supabase.com).
2. **SQL Editor → New query** : exécutez [`supabase/schema.sql`](supabase/schema.sql) puis
   [`supabase/02_features.sql`](supabase/02_features.sql) — cela crée les tables (produits,
   commandes, **codes promo**, **paramètres**), la sécurité RLS, la fonction de redemption
   atomique, et insère les 4 parfums + des codes de démarrage.
3. **Project Settings → API** : récupérez l'URL et les clés.
4. Copiez `.env.example` en `.env.local` et remplissez :

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...        # secret, côté serveur uniquement
ADMIN_PASSWORD=un-mot-de-passe-fort     # ⚠️ à changer
ADMIN_SESSION_SECRET=chaîne-aléatoire-longue
NEXT_PUBLIC_SITE_URL=https://votre-domaine.tn
NEXT_PUBLIC_SHOP_PHONE=216XXXXXXXX
```

Dès que `SUPABASE_SERVICE_ROLE_KEY` est présent, l'app bascule automatiquement sur Supabase.

## 🔐 Accès admin

- URL : `/admin` (protégée par middleware).
- Connexion par mot de passe (`ADMIN_PASSWORD`).
- **Changez `ADMIN_PASSWORD` et `ADMIN_SESSION_SECRET` en production.**
- Sécurité : en production, l'app **refuse toute session** si `ADMIN_SESSION_SECRET`
  est absent ou laissé à sa valeur par défaut (fail-closed). Le cookie de session
  est signé + horodaté et **expire après 7 jours**.

## ▲ Déploiement Vercel

1. Poussez ce dossier sur un dépôt Git (GitHub/GitLab).
2. Sur [vercel.com](https://vercel.com) : **New Project** → importez le dépôt.
3. **Environment Variables** : ajoutez toutes les variables de `.env.example`.
4. Déployez. (Framework détecté automatiquement : Next.js.)

> Le dossier `public/` contient déjà les visuels (flacons, logo, textures), prêts pour la prod.

## 🖼️ Régénérer les visuels produits (optionnel)

Les images des flacons ont été découpées depuis le brand board via :

```bash
python scripts/extract_bottles.py   # -> public/products/*.png
python scripts/copy_assets.py       # -> logos, textures, favicon
```

## 📁 Structure

```
src/
  app/
    (store)/        # site public : accueil, boutique, produit, commander, confirmation…
    admin/          # super admin (login, dashboard, commandes, produits)
    actions.ts      # server action : passer commande
  components/       # UI, sections de la landing, composants admin
  lib/
    data/           # accès produits / commandes (Supabase ou fallback local)
    supabase.ts     # client service-role
    auth.ts         # auth admin (mot de passe + cookie signé)
    types.ts, site.ts, tunisia.ts, utils.ts
supabase/schema.sql # schéma + RLS + seed
```

---

© Bloomy — Bloom Boldly. Spray Confidence.
