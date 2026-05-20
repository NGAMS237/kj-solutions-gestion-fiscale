#!/usr/bin/env node
/**
 * reset.mjs — Remet à zéro la base SQLite et ré-applique le seed.
 */
import { execSync } from 'node:child_process';
import { existsSync, unlinkSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const backend = join(__dirname, '..', 'backend');
const db = join(backend, 'prisma', 'dev.db');
const dbJournal = db + '-journal';

console.log('▶ Réinitialisation de la base SQLite…');
if (existsSync(db)) { unlinkSync(db); console.log('  ✓ dev.db supprimé'); }
if (existsSync(dbJournal)) { unlinkSync(dbJournal); }

const run = (cmd) => execSync(cmd, { stdio: 'inherit', cwd: backend, shell: true });
run('npx prisma db push --skip-generate');
run('npx prisma db seed');
console.log('\n✅  Base remise à zéro avec les données de démo.\n');
