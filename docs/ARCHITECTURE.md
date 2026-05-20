# Architecture détaillée

## Flux requête type — Création d'une facture

```
┌──────────────────┐                                                      ┌───────────────┐
│  Navigateur      │   1. POST /api/invoices  { clientId, items[] }      │  Backend      │
│  /factures/nouv. │ ────────────────────────────────────────────────► │  NestJS       │
└──────────────────┘                                                      └───────┬───────┘
                                                                                  │ 2. Zod validation
                                                                                  │ 3. computeInvoiceTotals()
                                                                                  │     (TPS 5% / TVQ 9.975%)
                                                                                  │ 4. nextInvoiceNumber()
                                                                                  │ 5. prisma.invoice.create()
                                                                                  ▼
                                                                          ┌───────────────┐
                                                                          │ PostgreSQL    │
                                                                          │ snapshot taux │
                                                                          └───────────────┘
                       7. GET /api/invoices/:id/pdf                              ▲
                  ◄─────────────────────────────────────────────────             │
                       (pdfkit stream)                                            │ 6. invoice + items renvoyés
```

## Modules backend

| Module        | Responsabilité                                              |
|---------------|-------------------------------------------------------------|
| settings      | Profil entreprise, numérotation factures, taux taxes        |
| activities    | Catalogue Uber / Garderie / Ménage / Info — règle de taxe par défaut |
| clients       | Référentiel clients + historique factures                   |
| invoices      | Facturation : CRUD, transition de statut, paiements         |
| expenses      | Dépenses + catégorisation + export CSV + auto-décomposition TTC |
| taxes         | Rapports TPS/TVQ avec CTI/RTI, snapshots trimestriels       |
| reports       | Profits & Pertes (CASH / ACCRUAL)                           |
| dashboard     | Agrégats KPIs + séries temporelles                          |
| pdf           | Génération PDF de facture (pdfkit)                          |
| recurring     | Cron horaire qui matérialise les factures récurrentes       |

## Conventions de design

1. **Snapshot des taux à la facturation** : `Invoice.tpsRate` / `tvqRate` stockés sur chaque facture pour reproductibilité historique si Québec change le taux un jour.
2. **Décimal Prisma** : tous les montants en `Decimal(12,2)` ou plus pour éviter les erreurs d'arrondi du flottant.
3. **Cash basis par défaut** pour la TPS/TVQ (méthode des encaissements) — paramétrable via `?basis=ACCRUAL`.
4. **Soft-delete** : clients et activités utilisent `active: false` plutôt que la suppression dure, pour conserver l'historique de facturation.
5. **Zod en entrée** : chaque controller valide son DTO en entrée. Les erreurs sont attrapées par `HttpExceptionFilter` global.

## Extensibilité

- **Multi-utilisateurs / Auth** : `User` existe déjà dans le schema. Activer un `AuthModule` (JWT + refresh), brancher un guard sur `AppModule`, ajouter `userId` aux ressources sensibles.
- **Multi-entreprise** : ajouter un modèle `Tenant`, lier toutes les tables via `tenantId`, filtrer dans les services.
- **Synchronisation bancaire** : module `bank` côté backend + connecteur Plaid/Flinks, alimente `Expense` automatiquement.
- **OCR reçus** : champ `Expense.receiptUrl` déjà prévu. Endpoint d'upload → service Tesseract.js ou API externe → suggère catégorie + montants.
- **Stripe / Moneris** : un module `payments-gateway` agnostique avec adapters. Le webhook Stripe créé `Payment` automatiquement.
- **Mobile Flutter** : la même API REST suffit. Auth JWT, base URL configurable.
