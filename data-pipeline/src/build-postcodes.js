// Build the Victorian postcode/suburb -> coordinate lookup for Curbi Epic 2 (US2).
//
// Reads the community "Australian Postcodes" CSV from ./input/, keeps Victorian
// delivery-area rows, trims to postcode + suburb + coordinates, and writes a
// small lookup the Help Finder uses to turn a typed suburb or postcode into a
// point to measure distance from.
//
// Source: matthewproctor.com/australian_postcodes (CC BY 4.0 — confirm the exact
// statement on the site and record it in the Data Management Plan). Community-
// compiled from ABS and Australia Post data; postcodes change rarely (~annual).

import { parse } from 'csv-parse/sync'
import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const inputPath = join(here, '..', 'input', 'australian_postcodes.csv')

// --- config -----------------------------------------------------------------
const STATE = 'VIC'
// Drop PO-box and large-volume-receiver pseudo-postcodes; keep real delivery areas.
const KEEP_TYPES = new Set(['Delivery Area'])
// Loose Victoria bounding box, to drop placeholder/zero coordinates.
const VIC_BBOX = { latMin: -39.3, latMax: -33.9, lonMin: 140.8, lonMax: 150.2 }
// -----------------------------------------------------------------------------

const round5 = (n) => Math.round(n * 1e5) / 1e5

if (!existsSync(inputPath)) {
  console.error(
    `Missing ${inputPath} — download australian_postcodes.csv into input/ first (see README.md).`,
  )
  process.exit(1)
}

const rows = parse(readFileSync(inputPath), {
  columns: true,
  bom: true,
  skip_empty_lines: true,
  relax_column_count: true,
  trim: true,
})

const stats = { read: rows.length, inState: 0, wrongType: 0, badCoords: 0, deduped: 0, kept: 0 }
const seen = new Set()
const out = []

for (const r of rows) {
  if (r.state !== STATE) continue
  stats.inState++

  if (!KEEP_TYPES.has(r.type)) {
    stats.wrongType++
    continue
  }

  const lat = Number(r.lat)
  const lon = Number(r.long)
  const coordsOk =
    Number.isFinite(lat) &&
    Number.isFinite(lon) &&
    lat >= VIC_BBOX.latMin &&
    lat <= VIC_BBOX.latMax &&
    lon >= VIC_BBOX.lonMin &&
    lon <= VIC_BBOX.lonMax
  if (!coordsOk) {
    stats.badCoords++
    continue
  }

  const postcode = (r.postcode || '').trim()
  const suburb = (r.locality || '').trim().toUpperCase() // matches NHSD `suburb`
  const key = `${postcode}|${suburb}`
  if (seen.has(key)) {
    stats.deduped++
    continue
  }
  seen.add(key)

  // 5 dp ≈ 1 m — far more than a suburb-level lookup needs, and keeps the file small.
  out.push({ postcode, suburb, lat: round5(lat), lon: round5(lon) })
}

out.sort((a, b) => a.postcode.localeCompare(b.postcode) || a.suburb.localeCompare(b.suburb))
stats.kept = out.length

const appPublic = join(here, '..', '..', 'Curbi', 'public')
const outDir = existsSync(appPublic) ? join(appPublic, 'data') : join(here, '..', 'output')
mkdirSync(outDir, { recursive: true })
const outPath = join(outDir, 'vic-postcodes.json')
writeFileSync(outPath, JSON.stringify(out))

console.log('VIC postcode -> coordinate lookup')
console.log('  input: ', inputPath)
console.table(stats)
console.log('  distinct postcodes:', new Set(out.map((r) => r.postcode)).size)
console.log('  output:', outPath, `(${(statSync(outPath).size / 1024).toFixed(1)} KB)`)
