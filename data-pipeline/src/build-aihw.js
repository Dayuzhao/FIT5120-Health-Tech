// Build the regional-access figures for Curbi Epic 4 (US4).
//
// Reads the AIHW "Medicare mental health services" annual data-tables ZIP from
// ./input/, takes the PHN table, and computes the metro-Melbourne vs
// regional-Victoria averages the onboarding snapshot needs. Writes a small JSON
// that the backend serves at GET /api/regional-access.
//
// Refresh cadence: AIHW releases this annually (~May). Drop the new ZIP in
// ./input/ and re-run. The download URL carries a per-release GUID, so it is not
// hard-coded here — see README.md.
//
// Source caveats (for the Data Management Plan):
//  - CSV is Windows-1252 encoded and uses non-breaking spaces inside values.
//  - "Service rate" counts services delivered per 1,000 people (a mix of access
//    and need); "Patient rate" is the share of people who saw someone. Both are
//    output; the team picks which to display.
//  - PHN groupings below are fixed by name; if AIHW renames a PHN the script
//    errors rather than silently averaging the wrong set.

import { parse } from 'csv-parse/sync'
import AdmZip from 'adm-zip'
import { readdirSync, existsSync, writeFileSync, mkdirSync, statSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const inputDir = join(here, '..', 'input')

// --- config (confirm with the team) -----------------------------------------
const METRO_PHNS = ['North Western Melbourne', 'Eastern Melbourne', 'South Eastern Melbourne']
const REGIONAL_PHNS = ['Gippsland', 'Murray', 'Western Victoria']
const PROVIDER_TYPE = 'All providers'
const MEASURES = {
  serviceRatePer1000: 'Service rate per 1,000 population',
  patientRatePer1000: 'Patient rate per 1,000 population',
}
// --------------------------------------------------------------------------

const norm = (s) => (s ?? '').replace(/ /g, ' ').replace(/\s+/g, ' ').trim()
const avg = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length
const round1 = (n) => Math.round(n * 10) / 10

function findZip() {
  const zips = existsSync(inputDir)
    ? readdirSync(inputDir).filter(
        (f) => /medicare.*mental.*health/i.test(f) && f.toLowerCase().endsWith('.zip'),
      )
    : []
  if (zips.length === 0) {
    console.error(
      `No AIHW "Medicare mental health service*.zip" in ${inputDir} — download it there first (see README.md).`,
    )
    process.exit(1)
  }
  if (zips.length > 1) console.warn(`Multiple matching ZIPs in input/, using: ${zips[0]}`)
  return join(inputDir, zips[0])
}

const zipPath = findZip()
const entry = new AdmZip(zipPath)
  .getEntries()
  .find((e) => /PHN\s*SA4/i.test(e.entryName) && e.entryName.toLowerCase().endsWith('.csv'))
if (!entry) {
  console.error(`Could not find a "*PHN SA4*.csv" entry inside ${zipPath}`)
  process.exit(1)
}

const csvText = new TextDecoder('windows-1252').decode(entry.getData())
const rows = parse(csvText, { columns: true, skip_empty_lines: true, relax_column_count: true })

// Keep PHN rows for the chosen provider type; index by [phn][financialYear][measure].
const byPhn = new Map()
const years = new Set()
for (const r of rows) {
  if (norm(r.GeographicAreaType) !== 'PHN') continue
  if (norm(r.ProviderType) !== PROVIDER_TYPE) continue
  const phn = norm(r.phnname)
  const fy = norm(r.FinancialYear)
  const measure = norm(r.Measure)
  const value = Number(String(r.Value).replace(/,/g, ''))
  if (!Number.isFinite(value)) continue
  years.add(fy)
  if (!byPhn.has(phn)) byPhn.set(phn, new Map())
  const yrs = byPhn.get(phn)
  if (!yrs.has(fy)) yrs.set(fy, new Map())
  yrs.get(fy).set(measure, value)
}

// Latest financial year, e.g. "2024–25" -> compare by the leading calendar year.
const latestFY = [...years].sort((a, b) => Number(a.slice(0, 4)) - Number(b.slice(0, 4))).at(-1)

function groupValue(phns, measure) {
  const vals = phns.map((phn) => {
    const v = byPhn.get(phn)?.get(latestFY)?.get(measure)
    if (v === undefined) {
      console.error(
        `Missing "${measure}" for PHN "${phn}" in ${latestFY} — check the PHN names in this year's release.`,
      )
      process.exit(1)
    }
    return v
  })
  return avg(vals)
}

const metrics = {}
for (const [key, measure] of Object.entries(MEASURES)) {
  const metro = groupValue(METRO_PHNS, measure)
  const regional = groupValue(REGIONAL_PHNS, measure)
  metrics[key] = {
    metro: Math.round(metro),
    regional: Math.round(regional),
    gapPct: round1((regional / metro - 1) * 100), // negative = regional lower
  }
}

const out = {
  financialYear: latestFY,
  source: `AIHW – Medicare mental health services ${latestFY} (PHN table)`,
  sourceUrl: 'https://www.aihw.gov.au/mental-health/resources/data-tables',
  generatedAt: new Date().toISOString(),
  metroPhns: METRO_PHNS,
  regionalPhns: REGIONAL_PHNS,
  providerType: PROVIDER_TYPE,
  metrics,
}

const outDir = join(here, '..', 'output')
mkdirSync(outDir, { recursive: true })
const outPath = join(outDir, 'regional-access.json')
writeFileSync(outPath, JSON.stringify(out, null, 2))

console.log('AIHW regional-access pipeline')
console.log('  input: ', zipPath, '->', entry.entryName)
console.log('  latest financial year:', latestFY)
console.table(metrics)
console.log('  output:', outPath, `(${(statSync(outPath).size / 1024).toFixed(1)} KB)`)
