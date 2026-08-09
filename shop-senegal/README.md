# Afrotools Shop Sénégal

> Boilerplate e-commerce Next.js 16 avec catalogue et commandes stockés sur Supabase.

Variante de [`shop`](../shop) qui remplace la persistance factice (aucune DB, juste des
`// TODO`) par une vraie base Supabase : catalogue produits et suivi des commandes/paiements.
**Aucune intégration de paiement pour l'instant** — le bouton "Créer la commande" enregistre
une commande `pending` en base, sans redirection vers un fournisseur. Un fournisseur sera
branché dans une tâche ultérieure.

---

## Stack

| Domaine | Technologie |
| --- | --- |
| Framework | Next.js 16 (App Router) + React 19 |
| Language | TypeScript strict |
| Styles | Tailwind CSS v4 + shadcn/ui new-york |
| Base de données | [Supabase](https://supabase.com) (Postgres + RLS) |
| Déploiement | Vercel (zero-config) |

---

## Démarrage rapide

1. Créer un projet sur [supabase.com](https://supabase.com/dashboard).
2. Copier le contenu de `supabase/migrations/0001_init.sql` dans le SQL Editor du dashboard
   Supabase et l'exécuter — crée les tables `products`/`payments`, active RLS, et seed 5
   produits d'exemple.
3. Récupérer l'URL du projet, la clé `anon` et la clé `service_role` (Project Settings → API).

```bash
cp .env.example .env.local
# Remplir NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
npm install
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

---

## Variables d'environnement

| Variable | Obligatoire | Description |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Oui | URL du projet Supabase |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Oui | Clé publique (`sb_publishable_...`) — lecture du catalogue produits |
| `SUPABASE_SECRET_KEY` | Oui | Clé privée (`sb_secret_...`) — **jamais préfixer avec `NEXT_PUBLIC_`** — écriture/lecture des commandes, contourne RLS |
| `NEXT_PUBLIC_BASE_URL` | Oui | URL complète du déploiement, sans slash final |

> Ce projet utilise le nouveau format de clés API Supabase (`sb_publishable_...` / `sb_secret_...`),
> pas les anciens JWT `anon`/`service_role`. Les deux se trouvent dans Project Settings → API Keys.

---

## Flux commande (sans paiement pour l'instant)

```text
/ (boutique)
  └─ Ajouter au panier
       └─ /checkout (formulaire nom + email + téléphone optionnel)
            └─ POST /api/orders
                 ├─ re-calcul du prix serveur depuis la table `products`
                 └─ insert `payments` (status: pending)
                      └─ /checkout/confirmation?ref=XXX
                           └─ lecture de la commande par order_reference
```

---

## Architecture

```text
shop-senegal/
├── app/
│   ├── page.tsx                          # Boutique — produits depuis Supabase
│   ├── checkout/
│   │   ├── page.tsx                      # Formulaire + "Créer la commande"
│   │   └── confirmation/page.tsx         # Lecture de la commande par référence
│   └── api/orders/route.ts               # Re-pricing serveur + insert payments
├── components/
│   ├── ui/                               # shadcn/ui new-york
│   ├── cart-provider.tsx                 # Context + useReducer + localStorage
│   ├── cart-sheet.tsx / navbar.tsx / product-card.tsx
├── lib/
│   ├── products.ts                       # Requêtes Supabase (catalogue)
│   ├── supabase/client.ts                # Client anon (lectures publiques)
│   ├── supabase/server.ts                # Client service_role (server-only)
│   └── utils.ts                          # cn(), formatXOF()
├── supabase/migrations/0001_init.sql     # Schéma + RLS + seed
└── types/index.ts                        # Interfaces partagées
```

---

## Sécurité

- `SUPABASE_SERVICE_ROLE_KEY` n'est jamais envoyée au navigateur (`import "server-only"` dans `lib/supabase/server.ts`)
- Les prix sont recalculés côté serveur depuis la table `products` (jamais depuis le client)
- RLS activé sur `products` (lecture publique) et `payments` (aucun accès public — service_role uniquement)

---

## Hors périmètre (pour l'instant)

- Aucun bouton/route de paiement — branché dans une tâche ultérieure
- Pas de webhook
- Pas de tests
- Pas d'authentification
- Pas d'UI d'administration produits (seed SQL uniquement)

---

## License

MIT
