// Build the background-music playlist for Curbi Epic 6 (US6).
//
// Live-queries the Jamendo API for CC-licensed instrumental tracks under 3
// calming tags, dedupes, and writes tracks.json. backend/build_tracks_db.py
// loads it into the hosted Postgres `tracks` table, served by GET
// /api/v1/tracks (a global, shuffleable, multi-track player — not a
// per-task generated effect).
//
// Source caveats (for the Data Management Plan):
//  - Jamendo's whole catalogue is CC-licensed by platform design, so unlike
//    the GBIF pipeline there is no license allow-list to enforce — every
//    track carries at least attribution (BY) terms. What varies is NC
//    (non-commercial only) / ND (no derivatives) / SA (share-alike), stored
//    per track so the app can show correct attribution; irrelevant to
//    filtering since the player streams tracks unmodified.
//  - Only the audio/artwork URLs are stored, not the audio bytes — playback
//    streams live from Jamendo's CDN, so which URL to serve still comes from
//    a live Postgres query (satisfies the hosted-DB-at-runtime constraint).
//  - An unfiltered/default query returns unsuitable genres for a calm-down
//    tool (metal, hardcore) — found live when testing this API. Restricting
//    to calming tags (chillout, lounge, solopiano) is not optional, and even
//    within those tags a per-track genre exclude-list is still needed — see
//    EXCLUDED_GENRES below.
//  - Jamendo rate-limits bursty requests from one client (a `results_count`
//    of 0 with a `success` status, not an error, was observed live) — this
//    script waits between the 3 tag requests rather than firing them back to
//    back.

import { writeFileSync, mkdirSync, statSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))

// --- config (confirm with the team) -----------------------------------------
const CLIENT_ID = process.env.JAMENDO_CLIENT_ID
// 'ambient' was dropped 2026-09-13: the tag is applied loosely on Jamendo —
// live spot-checks turned up a trance remix, a dance-pop track, and two
// drum-n-bass tracks all tagged "ambient" (the tag describes a passage in the
// track, not necessarily its overall energy). 'solopiano' checked clean by
// the same spot-check (classical/newage/filmscore, no dance/trance/dnb).
const CALMING_TAGS = ['chillout', 'lounge', 'solopiano']
// A track can match one of the calming tags above and still carry a genre
// tag from a much higher-energy style — Jamendo's tags describe anything
// present in the track, not its overall character (same root cause as the
// 'ambient' removal above). Excluded regardless of which calming tag it was
// found under. Added 2026-09-13 after a user flagged a jarringly upbeat
// track in shuffle; a handful of chillout/lounge tracks carried `hiphop` or
// `breakbeat` alongside their calming tag.
const EXCLUDED_GENRES = new Set(['dance', 'trance', 'breakbeat', 'drumnbass', 'idm', 'hiphop'])
const TRACKS_PER_TAG = 30 // fetched pre-dedupe, aiming for ~60 unique tracks
const REQUEST_DELAY_MS = 1000
// --------------------------------------------------------------------------

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

function fail(message) {
  console.error(message)
  process.exit(1)
}

if (!CLIENT_ID) {
  fail(
    'JAMENDO_CLIENT_ID is not set — copy backend/.env.example to backend/.env and fill it in, ' +
      'then run this script with that value: JAMENDO_CLIENT_ID=... npm run build:jamendo ' +
      '(or export it in your shell).',
  )
}

async function fetchTracksForTag(tag) {
  const url =
    `https://api.jamendo.com/v3.0/tracks/?client_id=${CLIENT_ID}&format=json` +
    `&limit=${TRACKS_PER_TAG}&tags=${encodeURIComponent(tag)}&order=popularity_total` +
    `&include=musicinfo+licenses`
  const res = await fetch(url)
  if (!res.ok) fail(`HTTP ${res.status} fetching tag "${tag}"`)
  const data = await res.json()
  if (data.headers.status !== 'success') {
    fail(`Jamendo returned an error for tag "${tag}": ${data.headers.error_message}`)
  }
  // A "success" response with 0 results for a known-good tag/limit combo is
  // Jamendo's rate limiter, not an empty catalogue — confirmed live by
  // retrying the identical request after a short wait.
  if (data.results.length === 0) {
    fail(
      `Jamendo returned 0 results for tag "${tag}" (limit=${TRACKS_PER_TAG}) — likely rate-limited. ` +
        `Wait a few seconds and re-run.`,
    )
  }
  return data.results
}

function toTrack(raw, matchedTag) {
  return {
    jamendoId: raw.id,
    name: raw.name,
    artistName: raw.artist_name,
    albumName: raw.album_name,
    albumImageUrl: raw.album_image,
    audioUrl: raw.audio,
    durationSeconds: raw.duration,
    licenseUrl: raw.license_ccurl,
    licenseNonCommercial: raw.licenses?.ccnc === 'true',
    licenseNoDerivatives: raw.licenses?.ccnd === 'true',
    licenseShareAlike: raw.licenses?.ccsa === 'true',
    genres: raw.musicinfo?.tags?.genres ?? [],
    matchedTag,
    shareUrl: raw.shareurl,
  }
}

async function main() {
  const byId = new Map()
  for (let i = 0; i < CALMING_TAGS.length; i++) {
    const tag = CALMING_TAGS[i]
    process.stdout.write(`Fetching tag "${tag}" ... `)
    const results = await fetchTracksForTag(tag)
    let added = 0
    let excluded = 0
    for (const raw of results) {
      const genres = raw.musicinfo?.tags?.genres ?? []
      if (genres.some((g) => EXCLUDED_GENRES.has(g))) {
        excluded++
        continue
      }
      if (!byId.has(raw.id)) {
        byId.set(raw.id, toTrack(raw, tag))
        added++
      }
    }
    console.log(`${results.length} tracks, ${added} new, ${excluded} excluded (energetic genre)`)
    if (i < CALMING_TAGS.length - 1) await sleep(REQUEST_DELAY_MS)
  }

  const tracks = [...byId.values()]
  tracks.sort((a, b) => a.jamendoId.localeCompare(b.jamendoId, undefined, { numeric: true }))

  const out = {
    generatedAt: new Date().toISOString(),
    source: 'Jamendo API (CC-licensed music catalogue)',
    sourceUrl: 'https://www.jamendo.com/',
    calmingTags: CALMING_TAGS,
    trackCount: tracks.length,
    tracks,
  }

  const outDir = join(here, '..', 'output')
  mkdirSync(outDir, { recursive: true })
  const outPath = join(outDir, 'tracks.json')
  writeFileSync(outPath, JSON.stringify(out, null, 2))

  const byGenre = {}
  const byLicense = {}
  for (const t of tracks) {
    for (const g of t.genres) byGenre[g] = (byGenre[g] ?? 0) + 1
    byLicense[t.licenseUrl] = (byLicense[t.licenseUrl] ?? 0) + 1
  }

  console.log('\nJamendo background-music pipeline')
  console.log('  tracks:', tracks.length)
  console.table(byGenre)
  console.table(byLicense)
  console.log('  output:', outPath, `(${(statSync(outPath).size / 1024).toFixed(1)} KB)`)
}

main().catch((error) => fail(error.stack ?? String(error)))
