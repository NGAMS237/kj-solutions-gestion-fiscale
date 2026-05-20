# Gestion Fiscale — Travailleur Autonome (Québec)

Plateforme web auto-hébergée de gestion financière, facturation et suivi TPS/TVQ pour travailleur autonome opérant plusieurs activités (Uber, garderie, ménage, informatique).

> **MVP sans authentification** — instance mono-utilisateur. Architecture prête à recevoir un module Auth (JWT + refresh) sans refonte.

---

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                       NAVIGATEUR (HTTPS)                     │
└─────────────────────────────┬────────────────────────────────┘
                              │
                ┌─────────────▼─────────────┐
                │   NGINX (reverse proxy)   │   :80 / :443
                │   Let's Encrypt SSL       │
                └──────┬───────────────┬────┘
                       │               │
              /api/*   │               │  /*
                       │               │
        ┌──────────────▼───┐   ┌───────▼─────────────┐
        │  Backend NestJS  │   │  Frontend Next.js   │
        │  Node 20 / TS    │   │  App Router / TS    │
        │  Port 4000       │   │  Port 3000          │
        └────┬─────────┬───┘   └─────────────────────┘
             │         │
             │         │ pdfkit
             │         └────────────────────────────────┐
             │                                          │
        ┌────▼────────┐                          ┌──────▼──────┐
        │  PostgreSQL │                          │   Storage   │
        │  16 + Prisma│                          │ /var/uploads│
        └─────────────┘                          └─────────────┘
```

### Stack

| Couche       | Technologie                                       |
|--------------|---------------------------------------------------|
| Frontend     | Next.js 14 (App Router) · React 18 · TypeScript   |
| UI           | TailwindCSS · lucide-react · Recharts             |
| Backend      | NestJS 10 · TypeScript strict · Zod               |
| ORM          | Prisma 5                                           |
| BDD          | PostgreSQL 16                                     |
| PDF          | pdfkit (factures)                                 |
| Tâches       | @nestjs/schedule (cron facturation récurrente)    |
| Conteneurs   | Docker · docker-compose                           |
| Reverse-prx  | Nginx + Certbot                                   |

### Structure du monorepo

```
gestion-fiscale-app/
├── backend/                    # API NestJS
│   ├── prisma/
│   │   ├── schema.prisma       # modèle complet
│   │   └── seed.ts             # données de démo
│   └── src/
│       ├── main.ts
│       ├── app.module.ts
│       ├── common/             # utilitaires (taxes, validation, erreurs)
│       ├── prisma/             # service Prisma
│       ├── clients/            # CRUD clients
│       ├── invoices/           # CRUD factures + calcul taxes
│       ├── expenses/           # dépenses + catégories
│       ├── taxes/              # rapport TPS/TVQ
│       ├── reports/            # P&L, exports
│       ├── dashboard/          # agrégats
│       ├── pdf/                # génération PDF
│       └── recurring/          # cron facturation récurrente
├── frontend/                   # Next.js
│   └── src/
│       ├── app/(app)/...       # pages protégées par layout
│       ├── components/         # UI réutilisable
│       └── lib/                # api client + helpers
├── nginx/
│   └── nginx.conf
├── docs/
│   ├── DEPLOIEMENT_PROXMOX.md
│   ├── DEPLOIEMENT_ORACLE.md
│   └── FISCALITE_QUEBEC.md
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## Démarrage rapide

Deux chemins selon ton niveau :

### 🟢 Mode débutant — sans Docker (recommandé pour démarrer)

**3 étapes** seulement : installer Node.js, lancer `npm run quickstart`, ouvrir le navigateur.

👉 Voir **[DEMARRAGE_RAPIDE.md](DEMARRAGE_RAPIDE.md)** pour le guide complet.

Astuce Windows : double-clique sur **`LANCER-APP.bat`** — il configure tout au premier lancement et ouvre le navigateur tout seul.

### 🔵 Mode Docker (production)

```bash
cd gestion-fiscale-app
cp .env.example .env
docker compose up -d --build
docker compose exec backend npx prisma migrate deploy
docker compose exec backend npx prisma db seed
# Frontend : http://localhost:3000  ·  API : http://localhost:4000/api
```

### 🌐 Déploiement en ligne

- Sans Docker (Vercel + Railway, ou VPS + PM2) → **[SIMPLE_DEPLOIEMENT.md](SIMPLE_DEPLOIEMENT.md)**
- Avec Docker (Proxmox, Oracle Cloud) → [docs/DEPLOIEMENT_PROXMOX.md](docs/DEPLOIEMENT_PROXMOX.md) · [docs/DEPLOIEMENT_ORACLE.md](docs/DEPLOIEMENT_ORACLE.md)

---

## Règles fiscales appliquées (Québec, 2026)

| Taxe | Taux    | Note                                          |
|------|---------|-----------------------------------------------|
| TPS  | 5,000 % | Sur revenus taxables uniquement               |
| TVQ  | 9,975 % | Calculée sur le **prix avant TPS** (non sur TPS) |

**Exonérations gérées par activité** :
- Services d'**assistance en garderie** : exonérés TPS/TVQ (Loi sur la taxe d'accise, partie III, annexe V).
- Uber/taxi : **taxable** — inscription obligatoire dès le premier dollar.
- Ménage commercial / résidentiel : **taxable**.
- Services informatiques : **taxable**.

Le calcul est piloté par le champ `Activity.taxStatus` (`TAXABLE` | `EXEMPT` | `ZERO_RATED`).

Plus de détails dans `docs/FISCALITE_QUEBEC.md`.

---

## Étapes suivantes (roadmap technique)

1. Authentification JWT (le module `auth/` est déjà prévu dans la structure)
2. OCR reçus (Tesseract.js ou OpenAI Vision)
3. Synchronisation bancaire (Plaid / Flinks)
4. App mobile Flutter consommant la même API REST
5. Portail client en lecture (paiement Stripe)
6. Multi-entreprises (ajout `Tenant` dans le schema)

---

## Déploiement

- [Guide Proxmox](docs/DEPLOIEMENT_PROXMOX.md)
- [Guide Oracle Cloud Free Tier](docs/DEPLOIEMENT_ORACLE.md)
