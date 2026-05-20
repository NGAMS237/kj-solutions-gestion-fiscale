# Référentiel fiscal — Québec & Canada (2026)

> Ce document résume les règles que l'application applique. Il **ne remplace pas** un comptable ou les sites officiels (Revenu Québec, ARC). À chaque mise à jour de tarif, ajuste les variables `TPS_RATE` / `TVQ_RATE` ou les champs `Setting.tpsRate` / `Setting.tvqRate`.

## Taux de taxes

| Taxe | Taux     | Base de calcul                        | Référence officielle |
|------|----------|---------------------------------------|----------------------|
| TPS  | 5,000 %  | Prix de vente avant taxes             | ARC (CRA) — Taxe sur les produits et services |
| TVQ  | 9,975 %  | Prix de vente avant taxes (depuis 2013) | Revenu Québec — Taxe de vente du Québec |

**Important** : depuis le 1ᵉʳ janvier 2013, la TVQ est calculée sur le prix de vente **avant TPS**, et non plus sur (prix + TPS). Cette logique est implémentée dans `backend/src/common/tax/tax.util.ts`.

## Exemple

Service de ménage à 100,00 $ :
- Sous-total : 100,00 $
- TPS (5 %)  : 5,00 $
- TVQ (9,975 %) : 9,98 $
- **Total** : 114,98 $

## Inscription obligatoire

| Activité | Inscription TPS/TVQ |
|----------|---------------------|
| Uber / taxi (transport rémunéré de personnes) | **Obligatoire dès le 1ᵉʳ dollar** (règle spéciale) |
| Toute autre activité commerciale | Obligatoire dès que les revenus mondiaux dépassent **30 000 $** sur 4 trimestres consécutifs |

## Activités exonérées (Annexe V — Loi sur la taxe d'accise)

L'app gère trois statuts (`Activity.taxStatus`) :

- **TAXABLE** : TPS + TVQ perçues, CTI/RTI possibles sur les dépenses
- **EXEMPT** : aucune taxe perçue, **aucune CTI/RTI réclamable** sur les intrants dédiés à cette activité
- **ZERO_RATED** (détaxé) : taxe à 0 %, mais CTI/RTI **possibles** (exports, certains aliments de base)

### Cas particuliers couverts

| Activité dans cette app | Statut | Note |
|-------------------------|--------|------|
| Uber / taxi             | TAXABLE | Inscription dès 1 $ |
| Garderie (services de garde d'enfants) | EXEMPT | Annexe V, partie III, art. 1 — *si* le service est rendu principalement à des enfants de 14 ans et moins, plus de 24 h consécutives |
| Entretien ménager (résidentiel ou commercial) | TAXABLE | — |
| Services informatiques / réseau | TAXABLE | — |

## CTI (Crédit de taxe sur intrants — TPS) et RTI (Remboursement de taxe sur intrants — TVQ)

Tu peux récupérer la TPS et la TVQ payées sur les dépenses **engagées pour des activités commerciales taxables**.

- Les `ExpenseCategory.reclaimGST` / `reclaimQST` indiquent si la catégorie est admissible.
- Catégories courantes admissibles : essence, entretien véhicule, internet, téléphone, équipement, fournitures, publicité.
- Catégories **non** admissibles dans ce template : assurances (généralement exonérées), fournitures dédiées à l'activité **exonérée** garderie.

⚠️ Si une dépense est partagée entre activités taxables et exonérées, le calcul exact du prorata doit être ajusté manuellement.

## Périodes de déclaration TPS/TVQ

| Revenus annuels        | Période obligatoire |
|------------------------|---------------------|
| ≤ 1 500 000 $          | Annuelle (par défaut, mais on peut choisir trimestriel) |
| 1 500 001 $ – 6 000 000 $ | Trimestrielle |
| > 6 000 000 $          | Mensuelle |

L'app produit un **rapport par période arbitraire** (`/taxes/report?from=...&to=...`) et peut snapshotter un trimestre (`/taxes/snapshot`).

## Délai de remise

Pour la majorité des travailleurs autonomes (déclaration trimestrielle) : **un mois après la fin du trimestre**. Exemples 2026 :

| Trimestre | Fin de période | Remise dû le |
|-----------|----------------|--------------|
| T1        | 31 mars 2026   | 30 avril 2026 |
| T2        | 30 juin 2026   | 31 juillet 2026 |
| T3        | 30 sept. 2026  | 31 oct. 2026 |
| T4        | 31 déc. 2026   | 31 janv. 2027 |

## Mentions obligatoires sur facture (≥ 30 $)

L'app inclut sur chaque PDF :
- Nom et adresse de l'entreprise
- **NEQ**
- **Numéro de TPS** (format `123456789RT0001`)
- **Numéro de TVQ** (format `1234567890TQ0001`)
- Date de la facture
- Description claire des biens/services
- Montant de la TPS et de la TVQ **séparément** (ou mention "Taxes incluses" si applicable)

## Méthode rapide vs méthode régulière

L'app implémente la **méthode régulière** (calcul réel des CTI/RTI). La méthode rapide (taux remise réduits, pas de CTI/RTI à calculer) n'est pas implémentée mais pourrait être ajoutée en ajoutant un champ `Setting.method` et en court-circuitant le calcul des intrants.

## Ressources officielles

- ARC : https://www.canada.ca/fr/agence-revenu.html
- Revenu Québec : https://www.revenuquebec.ca/
- Calculatrice officielle TPS/TVQ : Revenu Québec, section "Outils".

> **Disclaimer** : ce document a été préparé à titre indicatif. Pour une situation particulière (notamment l'exemption des services de garde, qui dépend de critères précis), consulte un comptable ou Revenu Québec directement.
