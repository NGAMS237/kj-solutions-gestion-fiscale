# Checklist optimisations production

À cocher avant et après la mise en ligne.

## Sécurité

- [ ] **Secrets** : `.env` jamais commité — utiliser un gestionnaire (Bitwarden, 1Password, Vault) en équipe
- [ ] **POSTGRES_PASSWORD** : 24+ caractères, généré aléatoirement (`openssl rand -base64 32`)
- [ ] **Ports** : seuls 80/443 exposés publiquement. Postgres écoute sur `127.0.0.1` ou dans le réseau Docker interne uniquement (retirer le mapping `5432:5432` en prod)
- [ ] **HTTPS** : Let's Encrypt activé, HSTS, redirection HTTP → HTTPS
- [ ] **Auth** : avant d'exposer sur Internet, brancher le `AuthModule` (déjà préparé via `User`)
- [ ] **CORS** : `CORS_ORIGIN` strictement limité au domaine du frontend
- [ ] **Rate limit** : ajouter `@nestjs/throttler` (10 req/s sur `/api/*`)
- [ ] **Helmet** : `app.use(helmet())` dans `main.ts`
- [ ] **CSP** : politique stricte si tu intègres des scripts externes
- [ ] **Fail2ban** : sur l'hôte (SSH + tentatives 401 répétées)

## Performance

- [ ] **Build Next standalone** : déjà activé (`output: 'standalone'`)
- [ ] **Indexes Prisma** : déjà sur `status`, `clientId`, `issueDate`, `date` — surveiller `pg_stat_user_indexes`
- [ ] **N+1** : tous les services utilisent `include` ou `select` — pas de boucle async
- [ ] **Cache HTTP** : nginx `expires 30d` sur `/_next/static/*`
- [ ] **Compression** : ajouter `gzip on;` dans `nginx.conf`
- [ ] **Pool Prisma** : surveiller `pool_size` (par défaut 10) — augmenter si > 1 utilisateur simultané

## Observabilité

- [ ] **Logs centralisés** : `docker compose logs` → vers Loki/Grafana ou un simple `journalctl`
- [ ] **Health check** : ajouter `/api/health` retournant `200 + { db: 'ok' }` (`@nestjs/terminus`)
- [ ] **Uptime monitoring** : UptimeRobot ou BetterStack (gratuit)
- [ ] **Alertes** : email sur 5xx ou si volume disque > 80 %

## Sauvegardes & reprise après incident

- [ ] **pg_dump quotidien** : script fourni dans le guide Proxmox
- [ ] **Test de restauration mensuel** : `psql < dump.sql` sur instance staging
- [ ] **Backups hors-site** : rsync vers un 2ᵉ VPS, Backblaze B2, ou Proxmox Backup Server
- [ ] **Snapshot Oracle Boot Volume** : politique Bronze (gratuite)
- [ ] **RTO/RPO documentés** : objectif ≤ 4 h de panne, ≤ 24 h de perte

## Mises à jour

- [ ] **Image Docker** : `docker compose pull && docker compose up -d --build` au moins 1×/mois
- [ ] **CVE** : `docker scout cves` ou `trivy image gf_backend:latest`
- [ ] **OS** : `unattended-upgrades` pour les patchs de sécurité Debian/Ubuntu
- [ ] **Prisma migration** : toujours `npx prisma migrate deploy` (jamais `migrate dev` en prod)

## Conformité fiscale

- [ ] **Vérifier annuellement** les taux `TPS_RATE` / `TVQ_RATE` dans `.env` ou via UI Paramètres
- [ ] **Numéros NEQ/TPS/TVQ** renseignés dans Paramètres avant la 1ʳᵉ facture officielle
- [ ] **Archivage légal** : conserver les PDFs 6 ans (obligation Revenu Québec) — backup dédié des PDF dans `backend_uploads`
- [ ] **Mention factures < 30 $ vs ≥ 30 $** : la version actuelle inclut toujours toutes les mentions (sans danger)

## Évolutions prioritaires post-MVP

1. **Auth JWT + refresh** (déjà préparée dans le schema)
2. **Upload reçus** + endpoint OCR
3. **Envoi email factures** (nodemailer déjà en dépendance — câbler dans `InvoicesService.markSent`)
4. **Rappels automatiques** : `@Cron` quotidien qui marque OVERDUE et envoie un email
5. **Export Excel** (xlsx) — ajouter `exceljs` côté backend
6. **Portail client** : route publique en lecture seule + paiement Stripe Checkout
