# Déploiement sur Oracle Cloud Free Tier (ARM Ampere A1)

Le palier gratuit d'Oracle Cloud offre **4 vCPU ARM Ampere + 24 Go RAM** en cumul, parfait pour cette app. Voici la procédure.

## 1. Créer l'instance

1. Console Oracle Cloud → **Compute → Instances → Create instance**
2. Image : **Ubuntu 22.04 (Aarch64)**
3. Shape : **VM.Standard.A1.Flex** — par exemple 2 OCPU / 12 Go RAM
4. Réseau : créer un VCN public avec sous-réseau public
5. SSH : ajouter ta clé publique
6. Boot volume : 50 Go suffisent

## 2. Ouvrir le pare-feu

### Sur Oracle (Security List du VCN)

Ajouter des règles ingress autorisant :
- TCP 22 (SSH, restreindre à ton IP)
- TCP 80 (HTTP)
- TCP 443 (HTTPS)

### Sur l'instance (Ubuntu utilise iptables côté Oracle)

```bash
sudo iptables -I INPUT -p tcp --dport 80  -j ACCEPT
sudo iptables -I INPUT -p tcp --dport 443 -j ACCEPT
sudo netfilter-persistent save
```

## 3. Installer Docker (ARM64)

```bash
sudo apt update
sudo apt -y install ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo "deb [arch=arm64 signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu $(. /etc/os-release; echo $VERSION_CODENAME) stable" \
  | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt -y install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker $USER
newgrp docker
```

## 4. Déployer

Identique au guide Proxmox :

```bash
sudo mkdir -p /opt/gestion-fiscale && sudo chown $USER:$USER /opt/gestion-fiscale
cd /opt/gestion-fiscale
git clone <votre-repo> .
cp .env.example .env
# ÉDITER .env
docker compose up -d --build
docker compose exec backend npx prisma migrate deploy
docker compose exec backend npx prisma db seed
```

Les images `node:20-alpine` et `postgres:16-alpine` ont des builds ARM64 natifs — aucun ajustement requis dans les Dockerfiles.

## 5. Domaine + HTTPS

1. Pointer `gestion.tondomaine.ca` (enregistrement A) vers l'IP publique de l'instance.
2. Suivre la section "HTTPS Let's Encrypt" du guide Proxmox.

## 6. Sauvegardes Oracle

Activer **Boot Volume Backup Policy** dans la console Oracle :
- Volume Block → Boot Volumes → ton volume → **Edit assigned policy** → `Bronze` (quotidien, 7 jours de rétention) **gratuit**.

Combiner avec le script `pg_dump` du guide Proxmox.

## 7. Limites du Free Tier — à connaître

- L'instance peut être réclamée si **inactive** plus de 7 jours. Garde au moins une activité (cron, health check externe).
- Bande passante : 10 To/mois sortants — largement suffisant.
- Pas de support technique inclus, mais SLA infrastructure standard.
