// Draft the one-to-two sentence "fact" shown on each Epic 8 collectible card
// (US8.6) from the species' English Wikipedia article.
//
// Writes curated/species-facts.json with `reviewed: false`. A person then reads
// every entry, edits or replaces the text where needed, and sets `reviewed` to
// true. build-gbif.js refuses to run while any entry is unreviewed, so the
// review step cannot be skipped. Existing entries are never overwritten; pass a
// scientific name as an argument to redraft just that one (e.g. after a bad
// draft), or `--all` to redraft everything.
//
//   npm run draft:facts
//   npm run draft:facts -- "Sarcophilus harrisii"
//
// Source caveats (for the Data Management Plan):
//  - Wikipedia text is CC BY-SA 4.0: attribution (link to the article) is
//    required, and an adapted/shortened excerpt must say it was adapted.
//  - The REST summary is looked up by SCIENTIFIC name, which Wikipedia
//    redirects to the common-name article (Phascolarctos cinereus -> Koala),
//    so no hand-maintained title map is needed.
//  - The draft is deliberately not trusted: the audience is health-anxious, so
//    the review pass removes disease / death / injury wording even when it is
//    accurate. The flags printed below only point the reviewer at likely
//    candidates — they are not a filter.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

import { SPECIES, fetchJson, sleep } from './build-gbif.js'

const here = dirname(fileURLToPath(import.meta.url))
const OUT_PATH = join(here, '..', 'curated', 'species-facts.json')

// Wikimedia asks API clients to identify themselves.
const USER_AGENT =
  'Curbi-student-project/0.1 (FIT5120 Monash University; https://github.com/Dayuzhao/FIT5120-Health-Tech)'

// Keep each fact short enough for a collectible card; a sentence is never cut
// mid-way, so a long first sentence is kept whole and flagged instead.
const MIN_FACT_CHARS = 100
const MAX_FACT_CHARS = 300
const REQUEST_DELAY_MS = 200

const REVIEW_FLAGS =
  /disease|cancer|tumou?r|infect|parasit|virus|fatal|death|\bdie[sd]?\b|\bkill|roadkill|poison|venom|\bbite|attack|mortal|extinct|endanger|threaten/i

const sentenceSplitter = new Intl.Segmenter('en', { granularity: 'sentence' })

// Take sentences from the start of the summary until the fact is long enough
// to be worth reading, without going over the cap.
function openingSentences(extract) {
  const sentences = [...sentenceSplitter.segment(extract)].map((s) => s.segment.trim())
  let fact = ''
  for (const sentence of sentences) {
    if (fact && `${fact} ${sentence}`.length > MAX_FACT_CHARS) break
    fact = fact ? `${fact} ${sentence}` : sentence
    if (fact.length >= MIN_FACT_CHARS) break
  }
  return fact
}

async function draftFact(scientificName) {
  const title = scientificName.replace(/ /g, '_')
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`
  const page = await fetchJson(url, { headers: { 'User-Agent': USER_AGENT } })

  if (page.type !== 'standard') {
    throw new Error(`"${scientificName}" resolved to a ${page.type} page ("${page.title}"), not an article`)
  }

  return {
    fact: openingSentences(page.extract),
    wikipediaTitle: page.title,
    sourceUrl: page.content_urls.desktop.page,
    revision: page.revision,
    reviewed: false,
  }
}

async function main() {
  const args = process.argv.slice(2)
  const redraftAll = args.includes('--all')
  const redraftNames = new Set(args.filter((a) => a !== '--all'))

  const existing = existsSync(OUT_PATH) ? JSON.parse(readFileSync(OUT_PATH, 'utf8')) : null
  const facts = {}

  for (const { scientificName } of SPECIES) {
    const keep = existing?.facts[scientificName]
    if (keep && !redraftAll && !redraftNames.has(scientificName)) {
      facts[scientificName] = keep
      continue
    }

    const entry = await draftFact(scientificName)
    facts[scientificName] = entry

    const flags = [...new Set(entry.fact.match(new RegExp(REVIEW_FLAGS, 'gi')) ?? [])]
    const note = [
      entry.fact.length > MAX_FACT_CHARS ? 'long' : null,
      flags.length ? `flags: ${flags.join(', ')}` : null,
    ].filter(Boolean)
    console.log(`${scientificName} -> ${entry.wikipediaTitle}${note.length ? `  [${note.join('; ')}]` : ''}`)
    console.log(`  ${entry.fact}`)
    await sleep(REQUEST_DELAY_MS)
  }

  const out = {
    source: 'Wikipedia (English), REST page summary — https://en.wikipedia.org/api/rest_v1/',
    license: 'CC BY-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
    retrievedAt: existing?.retrievedAt ?? new Date().toISOString().slice(0, 10),
    facts,
  }

  mkdirSync(dirname(OUT_PATH), { recursive: true })
  writeFileSync(OUT_PATH, `${JSON.stringify(out, null, 2)}\n`)

  const unreviewed = Object.values(facts).filter((f) => !f.reviewed).length
  console.log(`\n${Object.keys(facts).length} facts written to ${OUT_PATH} (${unreviewed} awaiting review)`)
}

main().catch((error) => {
  console.error(error.stack ?? String(error))
  process.exit(1)
})
