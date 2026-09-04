// Build the Victorian suburb/postcode -> coordinate lookup for Curbi Epic 2 (US2).
//
// Reads the community "Australian Postcodes" dataset from ./input/, keeps
// Victorian delivery areas, trims each row to { postcode, suburb, lat, lon }, and
// writes vic-postcodes.json. backend/build_postcodes_db.py then loads that into
// the hosted `postcodes` table, which GET /api/v1/geocode queries at request time
// (replacing the old runtime fetch of this flat file inside the app).
//
// Source: Australian Postcodes, Matthew Proctor - https://www.matthewproctor.com/australian_postcodes
//   Direct file: https://www.matthewproctor.com/Content/postcodes/australian_postcodes.json
//   Licence: CC BY 4.0 (attribute in the Data Management Plan).
// Download it into ./input/australian_postcodes.json yourself (git-ignored).
//
// Data caveats (carry into the Data Management Plan):
//  - Rows without a locality or without numeric lat/long are dropped.
//  - Filtered to type === "Delivery Area" to exclude PO boxes / LVR entries;
//    de-duplicated on postcode+suburb (the source repeats a locality across
//    statistical-area variants).

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const inputPath = join(here, '..', 'input', 'australian_postcodes.json')

// --- config (tune with the team) ---------------------------------------------
const STATE = 'VIC'
const DELIVERY_AREA = 'Delivery Area'
// -----------------------------------------------------------------------------

if (!existsSync(inputPath)) {
  console.error(
    `No australian_postcodes.json in ${dirname(inputPath)} — download it there first (see the header of this file).`,
  )
  process.exit(1)
}

const rows = JSON.parse(readFileSync(inputPath, 'utf8'))

const stats = { read: rows.length, inState: 0, badCoords: 0, deduped: 0, kept: 0 }
const seen = new Set()
const out = []

for (const r of rows) {
  if (r.state !== STATE || r.type !== DELIVERY_AREA) continue
  stats.inState++

  const suburb = String(r.locality || '').trim().toUpperCase()
  const postcode = String(r.postcode || '').trim()
  const lat = Number(r.lat)
  const lon = Number(r.long)
  if (!suburb || !postcode || !Number.isFinite(lat) || !Number.isFinite(lon) || (lat === 0 && lon === 0)) {
    stats.badCoords++
    continue
  }

  const key = `${postcode}|${suburb}`
  if (seen.has(key)) {
    stats.deduped++
    continue
  }
  seen.add(key)

  out.push({ postcode, suburb, lat, lon })
}

out.sort((a, b) => a.postcode.localeCompare(b.postcode) || a.suburb.localeCompare(b.suburb))
stats.kept = out.length

const outDir = join(here, '..', 'output')
mkdirSync(outDir, { recursive: true })
const outPath = join(outDir, 'vic-postcodes.json')
writeFileSync(outPath, JSON.stringify(out))

console.log('VIC postcode lookup pipeline')
console.log('  input: ', inputPath)
console.table(stats)
console.log('  output:', outPath)
