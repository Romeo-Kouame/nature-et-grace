/**
 * Sauvegarde de la base PostgreSQL.
 *
 *   npm run db:backup          → crée backups/nature-AAAA-MM-JJ-HHMM.dump (garde les 14 dernières)
 *   npm run db:restore-check   → recharge la dernière sauvegarde dans une base temporaire,
 *                                compare le nombre de lignes de chaque table, puis supprime la base temporaire.
 *
 * Variables : DATABASE_URL (obligatoire), BACKUP_DIR (défaut ./backups), BACKUP_KEEP (défaut 14),
 * PG_BIN (dossier contenant pg_dump / pg_restore / psql si ces outils ne sont pas dans le PATH).
 *
 * À automatiser sur le serveur (tâche planifiée quotidienne) ; un hébergeur comme Neon fait aussi
 * ses propres sauvegardes, mais une copie indépendante reste utile.
 */
import 'dotenv/config'
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const mode = process.argv[2] ?? 'backup'
const rawUrl = process.env.DATABASE_URL
if (!rawUrl) {
  console.error('DATABASE_URL manquant.')
  process.exit(1)
}
// Prisma accepte des paramètres (?schema=…) que les outils PostgreSQL ne connaissent pas
const url = new URL(rawUrl)
url.searchParams.delete('schema')
const dbUrl = url.toString()

const dir = path.resolve(process.env.BACKUP_DIR ?? 'backups')
const keep = Math.max(1, Number(process.env.BACKUP_KEEP ?? 14))
// Sous Windows, les outils PostgreSQL ne sont souvent pas dans le PATH : on prend la version installée la plus récente
function findPgBin() {
  if (process.env.PG_BIN) return process.env.PG_BIN
  if (process.platform !== 'win32') return ''
  const root = 'C:/Program Files/PostgreSQL'
  if (!fs.existsSync(root)) return ''
  const versions = fs.readdirSync(root).filter((v) => /^\d+$/.test(v)).sort((a, b) => Number(b) - Number(a))
  const found = versions.map((v) => path.join(root, v, 'bin')).find((d) => fs.existsSync(path.join(d, 'pg_dump.exe')))
  return found ?? ''
}
const pgBin = findPgBin()
const bin = (name) => (pgBin ? path.join(pgBin, name) : name)
const run = (cmd, args) => execFileSync(bin(cmd), args, { stdio: ['ignore', 'pipe', 'pipe'] }).toString()

const TABLES = ['Admin', 'StoreSettings', 'Image', 'Review', 'Product', 'Customer', '"Order"', 'OrderItem']
function countRows(connection) {
  const sql = TABLES.map((t) => `SELECT '${t.replace(/"/g, '')}' AS t, count(*) FROM ${t.startsWith('"') ? t : `"${t}"`}`).join(' UNION ALL ')
  const out = run('psql', [connection, '-At', '-F', '=', '-c', sql])
  return Object.fromEntries(out.trim().split(/\r?\n/).map((l) => l.split('=')).map(([t, n]) => [t, Number(n)]))
}

function backup() {
  fs.mkdirSync(dir, { recursive: true })
  const stamp = new Date().toISOString().slice(0, 16).replace('T', '-').replace(':', '')
  const file = path.join(dir, `nature-${stamp}.dump`)
  run('pg_dump', ['--format=custom', '--no-owner', '--no-privileges', `--file=${file}`, dbUrl])
  const sizeKb = Math.round(fs.statSync(file).size / 1024)
  // Rotation : on ne garde que les N plus récentes
  const all = fs.readdirSync(dir).filter((f) => /^nature-.*\.dump$/.test(f)).sort()
  for (const old of all.slice(0, Math.max(0, all.length - keep))) fs.rmSync(path.join(dir, old))
  console.log(`✓ Sauvegarde créée : ${file} (${sizeKb} ko). ${Math.min(all.length, keep)} sauvegarde(s) conservée(s).`)
  return file
}

function restoreCheck() {
  const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => /^nature-.*\.dump$/.test(f)).sort() : []
  if (!files.length) {
    console.error('Aucune sauvegarde trouvée : lancez d’abord npm run db:backup.')
    process.exit(1)
  }
  const file = path.join(dir, files.at(-1))
  const tempName = `nature_restore_check_${Date.now()}`
  const adminUrl = new URL(dbUrl)
  adminUrl.pathname = '/postgres'
  const tempUrl = new URL(dbUrl)
  tempUrl.pathname = `/${tempName}`

  run('psql', [adminUrl.toString(), '-c', `CREATE DATABASE "${tempName}"`])
  try {
    run('pg_restore', ['--no-owner', '--no-privileges', `--dbname=${tempUrl.toString()}`, file])
    const live = countRows(dbUrl)
    const restored = countRows(tempUrl.toString())
    let ok = true
    for (const table of Object.keys(restored)) {
      const same = restored[table] === live[table]
      if (!same) ok = false
      console.log(`${same ? '✓' : '≠'} ${table.padEnd(14)} sauvegarde : ${restored[table]}  ·  base actuelle : ${live[table]}`)
    }
    console.log(ok
      ? `✓ Test de restauration réussi : ${path.basename(file)} se recharge entièrement.`
      : '⚠ Restauration réussie, mais des tables diffèrent (normal si des commandes ont eu lieu depuis la sauvegarde).')
  } finally {
    run('psql', [adminUrl.toString(), '-c', `DROP DATABASE IF EXISTS "${tempName}"`])
  }
}

if (mode === 'restore-check') restoreCheck()
else backup()
