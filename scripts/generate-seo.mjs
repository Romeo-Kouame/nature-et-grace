/**
 * Lancé après `vite build` : écrit dist/sitemap.xml et dist/robots.txt, et rend absolues
 * les adresses de l'image de partage (WhatsApp, Facebook… exigent une adresse complète).
 *
 * Variables lues (dans l'environnement ou le fichier .env) :
 * - VITE_SITE_URL : adresse publique du site, ex. https://www.natureetgrace.ci
 * - VITE_API_URL  : adresse de l'API, pour lister les fiches produits
 */
import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1')), '..')
const dist = path.join(root, 'dist')

function readEnvFile() {
  const file = path.join(root, '.env')
  if (!fs.existsSync(file)) return {}
  const out = {}
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*"?([^"]*)"?\s*$/.exec(line)
    if (m) out[m[1]] = m[2]
  }
  return out
}
const env = { ...readEnvFile(), ...process.env }

let siteUrl = (env.VITE_SITE_URL || '').replace(/\/$/, '')
if (!siteUrl) {
  siteUrl = 'http://localhost:4173'
  console.warn('⚠ VITE_SITE_URL non défini : sitemap et robots.txt générés avec', siteUrl, '(à définir avant la mise en ligne).')
}
const apiUrl = (env.VITE_API_URL || 'http://localhost:3001/api').replace(/\/$/, '')

const STATIC_PAGES = [
  ['/', '1.0', 'weekly'],
  ['/boutique', '0.9', 'daily'],
  ['/temoignages', '0.6', 'weekly'],
  ['/histoire', '0.5', 'monthly'],
  ['/contact', '0.6', 'monthly'],
  ['/mentions-legales', '0.2', 'yearly'],
  ['/cgv', '0.2', 'yearly'],
  ['/confidentialite', '0.2', 'yearly'],
  ['/remboursement', '0.2', 'yearly'],
  ['/cookies', '0.2', 'yearly'],
]

async function fetchProducts() {
  try {
    const res = await fetch(`${apiUrl}/products`, { signal: AbortSignal.timeout(6000) })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const list = await res.json()
    return Array.isArray(list) ? list : []
  } catch (error) {
    console.warn(`⚠ Catalogue injoignable (${apiUrl}) : le sitemap ne contiendra que les pages fixes.`, error.message)
    return []
  }
}

const escapeXml = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

const products = await fetchProducts()
const today = new Date().toISOString().slice(0, 10)
const urls = [
  ...STATIC_PAGES.map(([p, priority, freq]) => ({ loc: `${siteUrl}${p}`, lastmod: today, priority, freq })),
  ...products.map((p) => ({
    loc: `${siteUrl}/produit/${encodeURIComponent(p.slug)}`,
    lastmod: (p.updatedAt || today).slice(0, 10),
    priority: '0.8',
    freq: 'weekly',
  })),
]

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map((u) => `  <url><loc>${escapeXml(u.loc)}</loc><lastmod>${u.lastmod}</lastmod><changefreq>${u.freq}</changefreq><priority>${u.priority}</priority></url>`)
  .join('\n')}
</urlset>
`

const robots = `# Nature & Grâce
User-agent: *
Allow: /
# Espaces privés : inutile de les indexer
Disallow: /admin
Disallow: /compte
Disallow: /commandes
Disallow: /connexion
Disallow: /favoris

Sitemap: ${siteUrl}/sitemap.xml
`

fs.writeFileSync(path.join(dist, 'sitemap.xml'), sitemap)
fs.writeFileSync(path.join(dist, 'robots.txt'), robots)

// Image et adresse de partage absolues
const indexFile = path.join(dist, 'index.html')
let html = fs.readFileSync(indexFile, 'utf8')
html = html
  .replace('<meta property="og:image" content="/', `<meta property="og:image" content="${siteUrl}/`)
  .replace('<meta property="og:url" content="/"', `<meta property="og:url" content="${siteUrl}/"`)
fs.writeFileSync(indexFile, html)

console.log(`✓ sitemap.xml (${urls.length} adresses dont ${products.length} produits) et robots.txt générés pour ${siteUrl}`)
