#!/usr/bin/env node
/**
 * quickstart.mjs — Installe et configure l'application en mode SQLite (sans Docker).
 *
 * Étapes :
 *  1. Vérifie la version de Node (≥ 18)
 *  2. Configure backend en mode SQLite (schema.sqlite.prisma → schema.prisma)
 *  3. Crée backend/.env si absent (DATABASE_URL=file:./dev.db)
 *  4. npm install dans backend et frontend
 *  5. npx prisma generate + db push + db seed
 *  6. Affiche la commande pour démarrer
 */
import { execSync } from 'node:child_process';
import { existsSync, copyFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const backend = join(root, 'backend');
const frontend = join(root, 'frontend');

const log = (msg) => console.log(`\n▶ ${msg}`);
const ok = (msg) => console.log(`✓ ${msg}`);

function run(cmd, cwd) {
  console.log(`\n$ ${cmd}`);
  execSync(cmd, { stdio: 'inherit', cwd, shell: true });
}

// --- 1. Vérification Node ---
const major = parseInt(process.versions.node.split('.')[0], 10);
if (major < 18) {
  console.error(`\n❌ Node 18+ requis. Version détectée : ${process.versions.node}`);
  console.error('   Télécharge Node 20 LTS : https://nodejs.org/fr/download');
  process.exit(1);
}
ok(`Node ${process.versions.node} détecté`);

// --- 2. Passe le backend en mode SQLite ---
log('Configuration backend (mode SQLite)…');
const sqliteSchema = join(backend, 'prisma', 'schema.sqlite.prisma');
const mainSchema   = join(backend, 'prisma', 'schema.prisma');
const pgBackup     = join(backend, 'prisma', 'schema.postgres.prisma');

if (!existsSync(sqliteSchema)) {
  console.error(`❌ Introuvable : ${sqliteSchema}`);
  process.exit(1);
}

// Sauvegarde le schéma Postgres avant écrasement
if (existsSync(mainSchema) && !existsSync(pgBackup)) {
  copyFileSync(mainSchema, pgBackup);
  ok('Schéma PostgreSQL sauvegardé sous prisma/schema.postgres.prisma');
}
copyFileSync(sqliteSchema, mainSchema);
ok('Schéma SQLite activé');

// --- 3. Création .env si absent ---
const envPath = join(backend, '.env');
if (!existsSync(envPath)) {
  const envContent = `# Auto-généré par quickstart — mode SQLite local
DATABASE_URL="file:./dev.db"
BACKEND_PORT=4000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000

COMPANY_NAME="Smith — Travailleur Autonome"
COMPANY_ADDRESS=""
COMPANY_PHONE=""
COMPANY_EMAIL="afterworkquebec2025@gmail.com"
COMPANY_NEQ=""
COMPANY_TPS=""
COMPANY_TVQ=""

TPS_RATE=0.05
TVQ_RATE=0.09975
`;
  writeFileSync(envPath, envContent);
  ok('backend/.env créé');
} else {
  ok('backend/.env existe déjà (pas écrasé)');
}

// --- 4. Installation des dépendances ---
log('Installation des dépendances backend…');
run('npm install', backend);

log('Installation des dépendances frontend…');
run('npm install', frontend);

log('Installation de concurrently à la racine…');
run('npm install', root);

// --- 5. Base de données SQLite ---
log('Génération du client Prisma…');
run('npx prisma generate', backend);

log('Création de la base SQLite (dev.db)…');
run('npx prisma db push --skip-generate', backend);

log('Insertion des données de démo…');
run('npx prisma db seed', backend);

// --- 6. Done ---
console.log('\n══════════════════════════════════════════════════════════');
console.log('  ✅  Configuration terminée !');
console.log('══════════════════════════════════════════════════════════');
console.log('');
console.log('  Pour lancer l\'application :');
console.log('');
console.log('      npm run dev');
console.log('');
console.log('  Puis ouvre dans ton navigateur :');
console.log('');
console.log('      → http://localhost:3000');
console.log('');
console.log('  La base SQLite est stockée dans :');
console.log('      backend/prisma/dev.db');
console.log('');
console.log('══════════════════════════════════════════════════════════\n');
