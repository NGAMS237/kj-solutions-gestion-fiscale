# 🌐 Déploiement simple (sans Docker)

Trois options progressives, de la plus simple à la plus complète.

---

## Option A — Utiliser l'app sur ton propre PC (recommandé pour débuter)

C'est **déjà fait** si tu as suivi `DEMARRAGE_RAPIDE.md`. L'app tourne sur ton PC, tes données restent locales, personne d'autre n'y accède.

**Avantages** :
- Zéro coût mensuel
- Tes données restent privées sur ta machine
- Sauvegarde = copier `backend/prisma/dev.db` sur une clé USB ou OneDrive

**Inconvénient** : tu ne peux pas y accéder depuis ton téléphone ou un autre ordinateur.

**Astuce** : crée un raccourci `gestion-fiscale.bat` sur ton bureau avec :
```bat
cd /d "C:\Users\Veraluz\OneDrive\Documents\Claude\Projects\TRAVAILLEUR AUTONOME\gestion-fiscale-app"
start "" http://localhost:3000
npm run dev
```
Double-clic = ouvre l'app automatiquement.

---

## Option B — Hébergement gratuit dans le cloud (Vercel + Railway)

L'option la plus simple pour **accéder à ton app depuis n'importe où** sans gérer de serveur.

### Setup (environ 30 minutes)

1. **Crée un compte gratuit** sur :
   - https://railway.app (hébergement backend + base PostgreSQL)
   - https://vercel.com (hébergement frontend Next.js)
   - https://github.com (pour pousser ton code)

2. **Pousse ton code sur GitHub** (depuis le dossier du projet) :
   ```powershell
   git init
   git add .
   git commit -m "MVP Gestion Fiscale"
   # crée un repo privé sur github.com puis :
   git remote add origin https://github.com/TON-USER/gestion-fiscale.git
   git push -u origin main
   ```

3. **Railway** (backend + base) :
   - Bouton « New Project » → « Deploy from GitHub repo »
   - Sélectionne ton repo, choisit le dossier `/backend`
   - Railway détecte Node + Prisma automatiquement
   - Ajoute un service **PostgreSQL** dans le même projet (bouton « + »)
   - Dans les variables d'environnement du backend, ajoute :
     - `DATABASE_URL` = (Railway te donne l'URL Postgres)
     - `BACKEND_PORT` = `4000`
     - `CORS_ORIGIN` = (l'URL Vercel, à remplir après étape 4)
     - `COMPANY_NAME`, `COMPANY_NEQ`, `COMPANY_TPS`, `COMPANY_TVQ` = tes infos
   - **Important** : avant le premier déploiement, restaure le schéma Postgres :
     - Renomme `backend/prisma/schema.prisma` (la version SQLite actuelle) en `schema.sqlite.prisma`
     - Renomme `backend/prisma/schema.postgres.prisma` en `schema.prisma`
     - Commit + push

4. **Vercel** (frontend) :
   - « Add New… » → « Project »
   - Importe le même repo GitHub, choisit le dossier `frontend`
   - Variable d'environnement :
     - `INTERNAL_API_URL` = (URL publique du backend Railway, ex. `https://gestion-back.up.railway.app`)
   - Deploy

5. Quand tu obtiens l'URL Vercel (ex. `https://gestion-fiscale.vercel.app`), retourne dans Railway et mets-la dans `CORS_ORIGIN`.

**Coût** :
- Railway : 5 $/mois après le crédit gratuit de 5 $ (≈ 500 h)
- Vercel : gratuit pour usage personnel

---

## Option C — VPS personnel sans Docker (Oracle Cloud Free Tier)

Pour avoir le contrôle complet, gratuit à vie, mais demande plus de configuration.

### 1. Créer la VM

Suis le guide `docs/DEPLOIEMENT_ORACLE.md` jusqu'à la section « Installer Docker » — **mais saute Docker**. Continue ici à la place.

### 2. Installer Node.js + PostgreSQL sur la VM

```bash
# Node 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt -y install nodejs

# PostgreSQL
sudo apt -y install postgresql postgresql-contrib

# Créer la base + utilisateur
sudo -u postgres psql <<EOF
CREATE USER gestion WITH PASSWORD 'mot_de_passe_fort';
CREATE DATABASE gestion_fiscale OWNER gestion;
GRANT ALL PRIVILEGES ON DATABASE gestion_fiscale TO gestion;
EOF

# PM2 (garde Node tournant en permanence)
sudo npm install -g pm2
```

### 3. Déployer le code

```bash
# Récupérer le code (git ou scp depuis ton PC)
sudo mkdir -p /opt/gestion-fiscale && sudo chown ubuntu:ubuntu /opt/gestion-fiscale
cd /opt/gestion-fiscale
git clone https://github.com/TON-USER/gestion-fiscale.git .

# Backend
cd backend
# Restaure le schéma Postgres (si le projet est en mode SQLite)
[ -f prisma/schema.postgres.prisma ] && cp prisma/schema.postgres.prisma prisma/schema.prisma

cat > .env <<EOF
DATABASE_URL="postgresql://gestion:mot_de_passe_fort@localhost:5432/gestion_fiscale?schema=public"
BACKEND_PORT=4000
NODE_ENV=production
CORS_ORIGIN=https://ton-domaine.ca
COMPANY_NAME="Smith — Travailleur Autonome"
COMPANY_NEQ=...
COMPANY_TPS=...
COMPANY_TVQ=...
TPS_RATE=0.05
TVQ_RATE=0.09975
EOF

npm install
npx prisma generate
npx prisma migrate deploy
npx prisma db seed
npm run build

pm2 start dist/main.js --name gf-backend
pm2 save
pm2 startup    # suis l'instruction affichée

# Frontend
cd ../frontend
echo "INTERNAL_API_URL=http://localhost:4000" > .env.production
npm install
npm run build
pm2 start "npm start" --name gf-frontend --cwd /opt/gestion-fiscale/frontend
pm2 save
```

### 4. Nginx + HTTPS (depuis l'hôte)

```bash
sudo apt -y install nginx certbot python3-certbot-nginx

# Config nginx minimaliste
sudo tee /etc/nginx/sites-available/gestion-fiscale <<'EOF'
server {
  listen 80;
  server_name ton-domaine.ca;

  location /api/ {
    proxy_pass http://127.0.0.1:4000;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
  }
}
EOF
sudo ln -s /etc/nginx/sites-available/gestion-fiscale /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# HTTPS gratuit
sudo certbot --nginx -d ton-domaine.ca
```

### 5. Sauvegardes automatiques

```bash
sudo crontab -e
# Ajouter :
0 2 * * * pg_dump -U gestion gestion_fiscale | gzip > /var/backups/gestion-$(date +\%Y\%m\%d).sql.gz
0 3 * * 0 find /var/backups -name "gestion-*.sql.gz" -mtime +30 -delete
```

---

## Tableau récapitulatif

| Aspect | Option A (local) | Option B (Vercel+Railway) | Option C (VPS) |
|--------|-----------------|---------------------------|----------------|
| Coût mensuel | 0 $ | ~5 $ (Railway) | 0 $ (Oracle Free) |
| Difficulté | ⭐ Très facile | ⭐⭐ Moyen | ⭐⭐⭐ Avancé |
| Accès depuis n'importe où | ❌ | ✅ | ✅ |
| Maintenance | aucune | minimale | régulière |
| Contrôle des données | total (chez toi) | externe (Railway) | total (chez toi) |
| Sauvegarde | copier `dev.db` | auto Railway | cron pg_dump |

**Mon conseil pour toi en tant qu'étudiant** : commence par l'option A. Quand tu auras vraiment besoin d'accès mobile, passe à B. Garde l'option C pour ton portfolio ou tes contrats clients plus tard.
