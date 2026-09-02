// Build the bundled NHSD mental-health services file for Curbi Epic 2 (US2).
//
// Reads the raw data.gov.au / AURIN NHSD June-2025 extract from ./input/*.csv,
// keeps Victorian mental-health services, trims each record to the fields the app
// needs, and writes nhsd-services.json.
//
// Data caveats (kept short here; full version in ../README.md):
//  - The extract has NO service-type / category column. Mental-health services are
//    identified only by keywords in the service name (see MENTAL_HEALTH below).
//    This misses services whose name doesn't state the profession, and can rarely
//    false-positive (e.g. "financial counselling").
//  - The extract has NO phone / email / website column.
//  - The `status` column reflects whether the service was inside its opening hours
//    at snapshot time (most private practices read "CLOSED"), not whether the
//    service still operates, so it is NOT used as a filter.

import { parse } from 'csv-parse/sync'
import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  readdirSync,
  existsSync,
  statSync,
} from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const inputDir = join(here, '..', 'input')

// --- config (tune with the team) -----------------------------------------------
const STATE = 'VIC'
// Keyword match on the service name. Ordered roughly by how specific each term is.
const MENTAL_HEALTH =
  /psycholog|psychiatr|psychotherap|counsell|counselin|mental health|headspace/i
// Loose Victoria bounding box, only to drop obviously-broken coordinates.
const VIC_BBOX = { latMin: -39.3, latMax: -33.9, lonMin: 140.8, lonMax: 150.2 }
const DAYS = [
  ['mon', 'monday_open_hours'],
  ['tue', 'tuesday_open_hours'],
  ['wed', 'wednesday_open_hours'],
  ['thu', 'thursday_open_hours'],
  ['fri', 'friday_open_hours'],
  ['sat', 'saturday_open_hours'],
  ['sun', 'sunday_open_hours'],
]
// -----------------------------------------------------------------------------

function findInputCsv() {
  // input/ is shared with build-postcodes.js, so matching on the documented
  // "nhsd" filename avoids picking up australian_postcodes.csv instead.
  const csvs = existsSync(inputDir)
    ? readdirSync(inputDir).filter(
        (f) => /nhsd/i.test(f) && f.toLowerCase().endsWith('.csv'),
      )
    : []
  if (csvs.length === 0) {
    console.error(
      `No "*nhsd*.csv" in ${inputDir} — download the NHSD extract there first (see README.md).`,
    )
    process.exit(1)
  }
  if (csvs.length > 1) console.warn(`Multiple matching CSVs in input/, using: ${csvs[0]}`)
  return join(inputDir, csvs[0])
}

const inputPath = findInputCsv()
const rows = parse(readFileSync(inputPath), {
  columns: true,
  bom: true,
  skip_empty_lines: true,
  relax_quotes: true,
  relax_column_count: true,
  trim: true,
})

const stats = { read: rows.length, inState: 0, mentalHealth: 0, badCoords: 0, deduped: 0, kept: 0 }
const seen = new Set()
const out = []

for (const r of rows) {
  if (r.state !== STATE) continue
  stats.inState++

  const name = (r.organization || '').trim()
  if (!MENTAL_HEALTH.test(name)) continue
  stats.mentalHealth++

  const lat = Number(r.latitude)
  const lon = Number(r.longitude)
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

  const address = (r.address || '').trim()
  const suburb = (r.city || '').trim()
  const postcode = (r.postcode || '').trim()

  // NHSD gives each service record its own nhsd_service_id even when the same
  // organisation at the same address repeats across many rows, so dedupe on the
  // visible identity (name + address + suburb) instead of the source id.
  const dedupeKey = `${name}|${address}|${suburb}`.toUpperCase()
  if (seen.has(dedupeKey)) {
    stats.deduped++
    continue
  }
  seen.add(dedupeKey)

  const id = (r.nhsd_service_id || '').trim()

  const hours = {}
  for (const [key, col] of DAYS) {
    const v = (r[col] || '').trim()
    if (v) hours[key] = v
  }

  out.push({
    id,
    name,
    address,
    suburb,
    postcode,
    state: r.state,
    lat,
    lon,
    ...(Object.keys(hours).length ? { hours } : {}),
  })
}

out.sort((a, b) => a.name.localeCompare(b.name))
stats.kept = out.length

// This file is an intermediate build artifact, not the served copy:
// backend/build_nhsd_db.py upserts it into the Postgres `services` table, which
// /api/v1/services reads at request time.
const outDir = join(here, '..', 'output')
mkdirSync(outDir, { recursive: true })
const outPath = join(outDir, 'nhsd-services.json')
writeFileSync(outPath, JSON.stringify(out))

console.log('NHSD mental-health services pipeline')
console.log('  input: ', inputPath)
console.table(stats)
console.log('  output:', outPath)
console.log('  size:  ', (statSync(outPath).size / 1024).toFixed(1), 'KB')
