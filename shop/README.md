# Afrotools Shop

> Boilerplate e-commerce Next.js 16 avec intégration Paycard pour la Guinée.

Un exemple de bout en bout : catalogue produit, panier, paiement Paycard, vérification serveur.
Conçu pour être forké et adapté à tout projet e-commerce guinéen.

---

## Stack

| Domaine | Technologie |
| --- | --- |
| Framework | Next.js 16 (App Router) + React 19 |
| Language | TypeScript strict |
| Styles | Tailwind CSS v4 + shadcn/ui new-york |
| Paiement | [Paycard](https://mapaycard.com) — Orange Money, MTN MoMo, carte bancaire |
| Déploiement | Vercel (zero-config) |

---

## Démarrage rapide

```bash
cp .env.example .env.local
# Remplir les variables (voir ci-dessous)
npm install
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

---

## Variables d'environnement

| Variable | Obligatoire | Description |
| --- | --- | --- |
| `PAYCARD_API_KEY` | Oui | Clé API Paycard — **ne jamais préfixer avec `NEXT_PUBLIC_`** |
| `NEXT_PUBLIC_BASE_URL` | Oui | URL complète du déploiement, sans slash final |

Obtenir une clé sur [mapaycard.com](https://mapaycard.com).

⚠️ Il n'existe pas de sandbox — toutes les requêtes atteignent la production.

---

## Flux de paiement

```text
/ (boutique)
  └─ Ajouter au panier
       └─ /checkout (formulaire nom + email)
            └─ POST /api/checkout
                 └─ Paycard create_payment → payment_url
                      └─ Redirect navigateur vers Paycard
                           └─ Paycard redirect → /payment/success?ref=XXX
                                └─ verifyPayment(ref) côté serveur
                                     ├─ isPaid(status) → ✅ Confirmé
                                     └─ sinon → ❌ Non confirmé
```

> `paycard-redirect-with-get: on` — Paycard redirige le navigateur vers le `callbackUrl` avec `?ref=` en GET.
> Aucun webhook serveur-à-serveur n'est envoyé dans ce mode.

---

## Architecture

```text
shop/
├── app/
│   ├── page.tsx                    # Boutique — liste produits
│   ├── checkout/page.tsx           # Formulaire commande
│   ├── payment/
│   │   ├── success/page.tsx        # Vérification serveur + confirmation
│   │   └── failed/page.tsx         # Annulation
│   └── api/
│       ├── checkout/route.ts       # Crée le paiement Paycard
│       ├── payment/verify/route.ts # Vérifie le statut (usage interne)
│       └── webhooks/paycard/route.ts
├── components/
│   ├── ui/                         # shadcn/ui new-york
│   ├── cart-provider.tsx           # Context + useReducer + localStorage
│   ├── cart-sheet.tsx              # Panier coulissant
│   ├── navbar.tsx
│   └── product-card.tsx
├── lib/
│   ├── paycard.ts                  # createPayment, verifyPayment, isPaid
│   ├── products.ts                 # Catalogue (à remplacer par votre DB)
│   └── utils.ts                    # cn(), formatGNF()
└── types/index.ts                  # Interfaces partagées
```

---

## Déploiement Vercel

```bash
vercel deploy
```

Configurer les variables dans le dashboard Vercel :

- `PAYCARD_API_KEY` → variable d'environnement secrète
- `NEXT_PUBLIC_BASE_URL` → URL de production (ex. `https://mon-shop.vercel.app`)

---

## Personnalisation

| Objectif | Fichier |
| --- | --- |
| Remplacer les produits | `lib/products.ts` |
| Persister les commandes | `app/api/checkout/route.ts` |
| Forcer Orange Money | `createPayment({ paymentMethod: "ORANGE_MONEY" })` |
| Forcer MTN MoMo | `createPayment({ paymentMethod: "MOMO" })` |

---

## Sécurité

- `PAYCARD_API_KEY` n'est jamais envoyée au navigateur
- Les prix sont recalculés côté serveur depuis le catalogue canonique
- Chaque paiement est vérifié via l'API Paycard avant toute confirmation
- `isPaid()` vérifie `status === 'success'`, pas uniquement `code === 0`

---

## English

### Quick start

```bash
cp .env.example .env.local
npm install
npm run dev
```

### Environment variables

| Variable | Required | Description |
| --- | --- | --- |
| `PAYCARD_API_KEY` | Yes | Paycard merchant API key — **server-only, never `NEXT_PUBLIC_`** |
| `NEXT_PUBLIC_BASE_URL` | Yes | Full deployment URL, no trailing slash |

Get a key at [mapaycard.com](https://mapaycard.com). No sandbox exists.

### Payment flow

1. User adds products → opens cart → "Passer la commande"
2. `/checkout` → fills name + email → "Payer avec Paycard"
3. `POST /api/checkout` → server re-prices from catalog → calls Paycard `create_payment`
4. Client redirected to Paycard hosted payment page
5. Paycard redirects to `/payment/success?ref=XXX`
6. Success page calls `verifyPayment(ref)` server-side → `isPaid(status.status)`
7. Confirmed (`success`) or rejected (`new` / other)

### Security

- `PAYCARD_API_KEY` is server-only
- Prices always recomputed server-side
- Every payment verified via Paycard API before confirmation
- `isPaid()` checks `status === 'success'`, not just `code === 0`

---

## License

MIT
