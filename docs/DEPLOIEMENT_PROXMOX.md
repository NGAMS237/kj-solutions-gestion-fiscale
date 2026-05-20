# Déploiement sur Proxmox VE

Ce guide installe l'application sur une VM Proxmox dédiée (Debian 12 ou Ubuntu 22.04).

## 1. Créer la VM Proxmox

| Ressource | Recommandation MVP |
|-----------|-------------------|
| OS        | Debian 12 (bookworm) ou Ubuntu Server 22.04 |
| vCPU      | 2 |
| RAM       | 4 Go |
| Disque    | 40 Go (qcow2, thin-provisioned) |
| Réseau    | bridge `vmbr0`, IP statique conseillée |

Activer `qemu-guest-agent` dans les options de la VM puis :

```bash
apt update && apt -y install qemu-guest-agent
systemctl enable --now qemu-guest-agent
```

## 2. Sécurité de base

```bash
adduser deploy
usermod -aG sudo deploy
apt -y install ufw fail2ban
ufw default deny incoming
ufw default allow outgoing
ufw allow OpenSSH
ufw allow 80,443/tcp
ufw enable
```

Désactiver l'auth par mot de passe (clé SSH uniquement) dans `/etc/ssh/sshd_config` :
```
PasswordAuthentication no
PermitRootLogin no
```
Puis `systemctl restart sshd`.

## 3. Installer Docker

```bash
sudo apt update
sudo apt -y install ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/debian/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/debian $(. /etc/os-release; echo $VERSION_CODENAME) stable" \
  | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt -y install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker $USER
newgrp docker
```

## 4. Déployer l'application

```bash
sudo mkdir -p /opt/gestion-fiscale && sudo chown $USER:$USER /opt/gestion-fiscale
cd /opt/gestion-fiscale

# Récupérer le code (git, scp ou rsync)
git clone <votre-repo> .

cp .env.example .env
# ÉDITER .env :
#  - POSTGRES_PASSWORD : un mot de passe fort
#  - COMPANY_*         : tes informations réelles (NEQ, TPS, TVQ)
#  - CORS_ORIGIN       : https://gestion.tondomaine.ca
#  - NEXT_PUBLIC_API_URL : https://gestion.tondomaine.ca/api

docker compose up -d --build
docker compose exec backend npx prisma migrate deploy
docker compose exec backend npx prisma db seed
```

Vérifier : `curl http://localhost/api/dashboard/summary`.

## 5. HTTPS avec Let's Encrypt

Sur l'hôte (hors conteneur) :

```bash
sudo apt -y install certbot
sudo systemctl stop gf_nginx || docker compose stop nginx
sudo certbot certonly --standalone -d gestion.tondomaine.ca
sudo mkdir -p /opt/gestion-fiscale/nginx/certs
sudo cp /etc/letsencrypt/live/gestion.tondomaine.ca/fullchain.pem /opt/gestion-fiscale/nginx/certs/
sudo cp /etc/letsencrypt/live/gestion.tondomaine.ca/privkey.pem  /opt/gestion-fiscale/nginx/certs/
```

Décommenter le bloc HTTPS dans `nginx/nginx.conf`, puis :
```bash
docker compose up -d nginx
```

Renouvellement automatique (cron mensuel) :
```bash
echo "0 3 1 * * root certbot renew --quiet --post-hook 'docker compose -f /opt/gestion-fiscale/docker-compose.yml restart nginx'" | sudo tee /etc/cron.d/certbot-renew
```

## 6. Sauvegardes PostgreSQL

Script `/opt/gestion-fiscale/backup.sh` :

```bash
#!/usr/bin/env bash
set -euo pipefail
DEST=/var/backups/gestion-fiscale
mkdir -p "$DEST"
TS=$(date +%Y%m%d-%H%M)
docker exec gf_postgres pg_dump -U gestion gestion_fiscale | gzip > "$DEST/db-$TS.sql.gz"
find "$DEST" -name "db-*.sql.gz" -mtime +30 -delete
```

Cron quotidien :
```bash
chmod +x /opt/gestion-fiscale/backup.sh
echo "0 2 * * * root /opt/gestion-fiscale/backup.sh" | sudo tee /etc/cron.d/gf-backup
```

Pour copier les sauvegardes hors-site, ajouter ensuite `rsync` vers un Proxmox Backup Server, Backblaze B2, ou un autre VPS.

## 7. Snapshots Proxmox

Activer dans **Datacenter → Backup** un job quotidien sur la VM (mode "stop" hors heures de bureau, ou "snapshot" si tu utilises ZFS/LVM-thin). Sortir au moins une copie hebdomadaire vers un stockage externe.

## 8. Monitoring rapide

```bash
docker compose logs -f --tail=200
docker stats
```

Pour plus avancé : ajouter Prometheus + Grafana via un compose séparé.
