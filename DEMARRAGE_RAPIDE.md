# 🚀 Démarrage rapide (sans Docker)

Cette procédure te fait voir l'application en **3 étapes**, sans Docker, sans serveur, sans installation de PostgreSQL.
Tu n'as besoin que de **Node.js** (le runtime JavaScript) et d'un navigateur.

---

## Étape 1 — Installer Node.js (une seule fois)

1. Va sur **https://nodejs.org/fr/download**
2. Télécharge **« LTS »** (version 20.x)
3. Lance l'installateur → suivant, suivant, terminer

**Vérifie l'installation** : ouvre PowerShell (touche Windows → taper « PowerShell ») et tape :

```powershell
node --version
```

Tu dois voir quelque chose comme `v20.11.1`. Si oui ✅, passe à l'étape suivante.

---

## Étape 2 — Configurer le projet (commande unique)

Toujours dans PowerShell, navigue dans le dossier du projet :

```powershell
cd "C:\Users\Veraluz\OneDrive\Documents\Claude\Projects\TRAVAILLEUR AUTONOME\gestion-fiscale-app"
```

Puis lance la configuration automatique :

```powershell
npm install
npm run quickstart
```

Ce script va :
- installer toutes les dépendances (backend + frontend)
- créer une base de données SQLite locale (un simple fichier `dev.db`)
- créer le schéma et y insérer des données de démonstration
- afficher le message **« ✅ Configuration terminée »** quand c'est prêt

⏱ Compte environ **3-5 minutes** la première fois (téléchargement des paquets npm).

---

## Étape 3 — Démarrer l'application

```powershell
npm run dev
```

Tu verras deux services démarrer en parallèle :
- `backend`  — l'API (port **4000**)
- `frontend` — l'interface web (port **3000**)

Quand tu lis dans la console quelque chose comme :

```
backend  | 🚀  API démarrée sur le port 4000
frontend | ▲ Next.js 14.2.5  - Local:   http://localhost:3000
```

**Ouvre ton navigateur** sur :

### 👉 http://localhost:3000

Tu arrives directement sur le tableau de bord, avec **les données de démo déjà chargées** :

- 2 factures (une ménage à 229,95 $ avec TPS/TVQ, une garderie à 800 $ exonérée)
- 3 clients de démo
- 2 dépenses de démo
- 4 activités (Uber, Garderie, Ménage, Informatique)

---

## Commandes utiles

| Commande | Effet |
|----------|-------|
| `npm run dev` | Lance backend + frontend (à utiliser à chaque fois) |
| `npm run dev:backend` | Uniquement le backend |
| `npm run dev:frontend` | Uniquement le frontend |
| `npm run reset` | Vide la base et remet les données de démo |
| `Ctrl+C` dans la console | Arrête les services |

---

## Où sont mes données ?

- **Base de données** : un seul fichier → `backend/prisma/dev.db`
- **Tes paramètres entreprise** : modifiable dans `Paramètres` (NEQ, TPS, TVQ…)
- **Tes factures PDF** : générées à la volée (cliquer "Télécharger" sur la liste des factures)

Tu peux **copier `dev.db`** pour faire une sauvegarde, ou le supprimer pour repartir à zéro (`npm run reset`).

---

## Différence avec la version Docker

| | Mode rapide (SQLite) | Mode Docker (PostgreSQL) |
|---|---|---|
| Installation | Node uniquement | Docker + 4 conteneurs |
| Base de données | 1 fichier `dev.db` | Serveur PostgreSQL |
| Performance | Largement suffisant pour 1 utilisateur | Multi-utilisateurs, prod ready |
| Sauvegarde | Copier le fichier `dev.db` | `pg_dump` quotidien |
| Mise en prod web | Voir `SIMPLE_DEPLOIEMENT.md` | Voir `docs/DEPLOIEMENT_*.md` |

Quand tu seras à l'aise et que tu voudras héberger l'app en ligne, tu pourras basculer en mode Docker/PostgreSQL — le code n'a pas besoin d'être changé.

---

## En cas de problème

### « 'npm' n'est pas reconnu… »
Node n'est pas installé, ou la fenêtre PowerShell est restée ouverte d'avant l'installation. Ferme et rouvre une nouvelle fenêtre PowerShell.

### « Port 3000 déjà utilisé »
Un autre programme utilise ce port. Soit ferme-le, soit change le port :
```powershell
$env:PORT=3001; npm run dev:frontend
```

### « Erreur Prisma — schema not found »
Relance le quickstart : `npm run quickstart`

### Repartir de zéro complètement
Supprime ces fichiers/dossiers puis relance `npm run quickstart` :
- `backend/node_modules/`
- `frontend/node_modules/`
- `node_modules/` (à la racine)
- `backend/prisma/dev.db`
- `backend/.env`
