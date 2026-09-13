// Build the species dex for Curbi Epic 8 (US8).
//
// Live-queries the GBIF API for a fixed list of 61 distinctively-Australian
// marsupial/monotreme species (orders Monotremata, Diprotodontia,
// Dasyuromorphia, Peramelemorphia — excludes bats, rodents, marine mammals,
// and introduced species). For each species: resolves the accepted taxon,
// picks an English common name, fetches IUCN conservation status, and
// selects 3 CC-licensed occurrence images. Writes species.json, which
// backend/build_species_db.py loads into the hosted Postgres `species` /
// `species_images` tables served by GET /api/v1/species.
//
// Source caveats (for the Data Management Plan):
//  - Images are sourced from GBIF occurrence records (mostly iNaturalist),
//    predominantly licensed CC BY-NC 4.0 — attribution required, NO commercial
//    use. Fine for a non-commercial student project, but must not be treated
//    as unrestricted stock imagery.
//  - Only the image URL is stored; image bytes are served live from the
//    original CDN (iNaturalist S3 etc.) at view time. Which URL to serve
//    still comes from a live Postgres query, so this satisfies the
//    hosted-DB-at-runtime constraint.
//  - "Bettongia penicillata" (woylie) is deliberately excluded even though it
//    cleared the >=20-occurrence bar: GBIF and Wikidata both class it
//    EXTINCT because the name now refers to the extinct south-eastern
//    population after a taxonomic split — the living woylie is
//    "Bettongia ogilbyi", which GBIF's backbone only resolves to genus rank.
//    Rather than guess, we drop the species entirely.
//  - Occurrence counts drift between runs (GBIF ingests new records
//    continuously), so the species list below is a fixed, reviewable
//    snapshot (from data-pipeline/output/gbif-species-verification.json,
//    2026-09-12) rather than a live ">=20" filter — otherwise the dex
//    contents could silently change on every rebuild.

import { writeFileSync, mkdirSync, statSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))

// --- config (confirm with the team before changing) -------------------------
// 61 species across the 4 orders that make up Australia's characteristic
// mammal fauna. See ../README.md for the full inclusion/exclusion rationale.
const SPECIES = [
  // Monotremata (2)
  { scientificName: 'Ornithorhynchus anatinus', order: 'Monotremata' },
  { scientificName: 'Tachyglossus aculeatus', order: 'Monotremata' },
  // Diprotodontia (38)
  { scientificName: 'Acrobates pygmaeus', order: 'Diprotodontia' },
  { scientificName: 'Aepyprymnus rufescens', order: 'Diprotodontia' },
  { scientificName: 'Bettongia lesueur', order: 'Diprotodontia' },
  { scientificName: 'Burramys parvus', order: 'Diprotodontia' },
  { scientificName: 'Cercartetus concinnus', order: 'Diprotodontia' },
  { scientificName: 'Cercartetus nanus', order: 'Diprotodontia' },
  { scientificName: 'Dactylopsila trivirgata', order: 'Diprotodontia' },
  { scientificName: 'Hypsiprymnodon moschatus', order: 'Diprotodontia' },
  { scientificName: 'Lasiorhinus krefftii', order: 'Diprotodontia' },
  { scientificName: 'Lasiorhinus latifrons', order: 'Diprotodontia' },
  { scientificName: 'Macropus fuliginosus', order: 'Diprotodontia' },
  { scientificName: 'Macropus giganteus', order: 'Diprotodontia' },
  { scientificName: 'Notamacropus agilis', order: 'Diprotodontia' },
  { scientificName: 'Notamacropus dorsalis', order: 'Diprotodontia' },
  { scientificName: 'Notamacropus eugenii', order: 'Diprotodontia' },
  { scientificName: 'Notamacropus parma', order: 'Diprotodontia' },
  { scientificName: 'Notamacropus parryi', order: 'Diprotodontia' },
  { scientificName: 'Notamacropus rufogriseus', order: 'Diprotodontia' },
  { scientificName: 'Osphranter antilopinus', order: 'Diprotodontia' },
  { scientificName: 'Osphranter rufus', order: 'Diprotodontia' },
  { scientificName: 'Petauroides volans', order: 'Diprotodontia' },
  { scientificName: 'Petaurus australis', order: 'Diprotodontia' },
  { scientificName: 'Petaurus breviceps', order: 'Diprotodontia' },
  { scientificName: 'Petaurus norfolcensis', order: 'Diprotodontia' },
  { scientificName: 'Petrogale lateralis', order: 'Diprotodontia' },
  { scientificName: 'Petrogale penicillata', order: 'Diprotodontia' },
  { scientificName: 'Petrogale xanthopus', order: 'Diprotodontia' },
  { scientificName: 'Phascolarctos cinereus', order: 'Diprotodontia' },
  { scientificName: 'Potorous tridactylus', order: 'Diprotodontia' },
  { scientificName: 'Pseudocheirus occidentalis', order: 'Diprotodontia' },
  { scientificName: 'Pseudocheirus peregrinus', order: 'Diprotodontia' },
  { scientificName: 'Pseudochirops archeri', order: 'Diprotodontia' },
  { scientificName: 'Setonix brachyurus', order: 'Diprotodontia' },
  { scientificName: 'Tarsipes rostratus', order: 'Diprotodontia' },
  { scientificName: 'Trichosurus cunninghami', order: 'Diprotodontia' },
  { scientificName: 'Trichosurus vulpecula', order: 'Diprotodontia' },
  { scientificName: 'Vombatus ursinus', order: 'Diprotodontia' },
  { scientificName: 'Wallabia bicolor', order: 'Diprotodontia' },
  // Dasyuromorphia (15)
  { scientificName: 'Antechinus agilis', order: 'Dasyuromorphia' },
  { scientificName: 'Antechinus flavipes', order: 'Dasyuromorphia' },
  { scientificName: 'Antechinus stuartii', order: 'Dasyuromorphia' },
  { scientificName: 'Antechinus swainsonii', order: 'Dasyuromorphia' },
  { scientificName: 'Dasyurus geoffroii', order: 'Dasyuromorphia' },
  { scientificName: 'Dasyurus hallucatus', order: 'Dasyuromorphia' },
  { scientificName: 'Dasyurus maculatus', order: 'Dasyuromorphia' },
  { scientificName: 'Dasyurus viverrinus', order: 'Dasyuromorphia' },
  { scientificName: 'Myrmecobius fasciatus', order: 'Dasyuromorphia' },
  { scientificName: 'Phascogale calura', order: 'Dasyuromorphia' },
  { scientificName: 'Phascogale tapoatafa', order: 'Dasyuromorphia' },
  { scientificName: 'Sarcophilus harrisii', order: 'Dasyuromorphia' },
  { scientificName: 'Sminthopsis crassicaudata', order: 'Dasyuromorphia' },
  { scientificName: 'Sminthopsis macroura', order: 'Dasyuromorphia' },
  { scientificName: 'Sminthopsis murina', order: 'Dasyuromorphia' },
  // Peramelemorphia (6)
  { scientificName: 'Isoodon auratus', order: 'Peramelemorphia' },
  { scientificName: 'Isoodon macrourus', order: 'Peramelemorphia' },
  { scientificName: 'Isoodon obesulus', order: 'Peramelemorphia' },
  { scientificName: 'Macrotis lagotis', order: 'Peramelemorphia' },
  { scientificName: 'Perameles gunnii', order: 'Peramelemorphia' },
  { scientificName: 'Perameles nasuta', order: 'Peramelemorphia' },
]

// Manual override for the rare case the frequency-vote picks a bad common
// name (checked against the first full run; empty until then).
const COMMON_NAME_OVERRIDES = {}

// Manual backstop for bad photos that BLOCKED_PROJECT_KEYWORDS above doesn't
// catch (no projectId at all, or a project that isn't obviously camera-trap/
// roadkill by name). Two sources feed this list: spot-checks by eye during
// development, and a full human pass over every image using the review
// gallery in data-pipeline/README.md's "Run" section (that pass is where
// most of the entries below came from — 2026-09-13, all 61 species). Add to
// this list, don't delete failing entries silently, if a future rebuild
// picks another bad one.
const EXCLUDED_OCCURRENCE_KEYS = new Set([
  6519658490, // Dasyurus viverrinus — empty pipe/burrow entrance, no animal in frame
  // --- full human review pass, 2026-09-13 ---
  6334464990, // Ornithorhynchus anatinus
  6235358726, // Ornithorhynchus anatinus
  6520286277, // Aepyprymnus rufescens (all 3 images came from this one occurrence)
  6470481117, // Bettongia lesueur
  6470429868, // Bettongia lesueur
  6469995487, // Bettongia lesueur
  6520216455, // Notamacropus parryi
  6470642972, // Notamacropus parryi
  6130706386, // Notamacropus rufogriseus
  6500060157, // Osphranter rufus (all 3 images came from this one occurrence)
  6520692478, // Petaurus breviceps
  6481065687, // Petaurus norfolcensis
  6518692529, // Petrogale xanthopus (all 3 images came from this one occurrence)
  6481060354, // Potorous tridactylus
  6131103595, // Pseudocheirus peregrinus
  6353063089, // Antechinus flavipes
  6520162397, // Antechinus stuartii (all 3 images came from this one occurrence)
  6422263097, // Phascogale calura
  6147712755, // Phascogale calura
  6519221749, // Sarcophilus harrisii
  6519005259, // Sarcophilus harrisii
  6431549985, // Isoodon auratus (both flagged images came from this one occurrence)
  6518923729, // Macrotis lagotis
  6520338414, // Perameles gunnii
  6480158437, // Perameles nasuta
  6440928490, // Perameles nasuta
  // --- full human review pass, round 2, 2026-09-13 ---
  6519508683, // Aepyprymnus rufescens
  6452611355, // Bettongia lesueur
  6400570363, // Cercartetus nanus
  6500357832, // Dactylopsila trivirgata
  6500123628, // Dactylopsila trivirgata
  6518943572, // Lasiorhinus latifrons
  6498460869, // Notamacropus dorsalis
  6452124514, // Notamacropus parma
  6400265346, // Notamacropus parma
  6130670293, // Notamacropus rufogriseus
  6498820905, // Osphranter rufus (3rd rejection for this species — see README caveat)
  6498487462, // Osphranter rufus
  6498384577, // Osphranter rufus
  6413229725, // Petauroides volans (all 3 images this occurrence set)
  6400658199, // Petauroides volans
  6520474389, // Petaurus australis
  6519347285, // Pseudocheirus occidentalis (all 3 images came from this one occurrence)
  6520071656, // Tarsipes rostratus
  6133025372, // Vombatus ursinus (all 3 images this occurrence set)
  6131682239, // Vombatus ursinus
  6131617356, // Vombatus ursinus
  6352835469, // Antechinus flavipes
  6520049469, // Antechinus stuartii (3rd rejection for this species — see README caveat)
  6519669542, // Antechinus stuartii
  6500401331, // Dasyurus hallucatus
  6498851880, // Dasyurus viverrinus
  6479672706, // Dasyurus viverrinus
  6520151510, // Myrmecobius fasciatus
  6147648790, // Phascogale calura
  6452692469, // Sarcophilus harrisii (3rd rejection for this species — see README caveat)
  6452669042, // Sarcophilus harrisii
  6481366793, // Sminthopsis murina (all 3 images came from this one occurrence)
  6413527690, // Isoodon auratus
  6131219539, // Isoodon auratus
  6518676404, // Macrotis lagotis
  6400214439, // Perameles nasuta (3rd rejection for this species — see README caveat)
  6400187198, // Perameles nasuta
])

// Primary image source: a full human review of every species using the
// picker gallery in data-pipeline/README.md's "Run" section — for each
// species, a person looked at up to 18 license/project-filtered candidates
// and picked exactly which 3 to ship, in order. This exists because
// automated ranking (newest-first, iNaturalist-preferred) still let through
// too much: distant/obscured animals, security-camera captures, even one
// screenshot of a phone's Photos app. When a species has an entry here,
// pickImages() below is skipped entirely for it — no GBIF occurrence call,
// no re-ranking, no chance of picking something different on a future
// rebuild. pickImages() remains as the fallback for any species added here
// without a manual pick yet (see resolveImages()).
const MANUAL_IMAGE_PICKS = {
  'Ornithorhynchus anatinus': [
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/682529789/original.jpg', license: 'http://creativecommons.org/licenses/by-nc/4.0/', occurrenceKey: 6412950753 },
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/637300494/original.jpg', license: 'http://creativecommons.org/licenses/by-nc/4.0/', occurrenceKey: 6196017419 },
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/618974903/original.jpg', license: 'http://creativecommons.org/licenses/by-nc/4.0/', occurrenceKey: 6171279193 },
  ],
  'Tachyglossus aculeatus': [
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/605906307/original.jpg', license: 'http://creativecommons.org/licenses/by-nc/4.0/', occurrenceKey: 6130122747 },
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/605906342/original.jpg', license: 'http://creativecommons.org/licenses/by-nc/4.0/', occurrenceKey: 6130122747 },
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/607404933/original.jpg', license: 'http://creativecommons.org/licenses/by-nc/4.0/', occurrenceKey: 6130121945 },
  ],
  'Acrobates pygmaeus': [
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/688445703/original.jpg', license: 'http://creativecommons.org/licenses/by-nc/4.0/', occurrenceKey: 6422259354 },
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/705876205/original.jpg', license: 'http://creativecommons.org/licenses/by-nc/4.0/', occurrenceKey: 6470694582 },
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/715998013/original.jpg', license: 'http://creativecommons.org/licenses/by-nc/4.0/', occurrenceKey: 6499870306 },
  ],
  'Aepyprymnus rufescens': [
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/726668713/original.jpg', license: 'http://creativecommons.org/licenses/by-nc/4.0/', occurrenceKey: 6518717838 },
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/725026326/original.jpg', license: 'http://creativecommons.org/licenses/by-nc/4.0/', occurrenceKey: 6519191593 },
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/713045347/original.jpg', license: 'http://creativecommons.org/licenses/by-nc/4.0/', occurrenceKey: 6480931772 },
  ],
  'Bettongia lesueur': [
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/684595760/original.jpg', license: 'http://creativecommons.org/licenses/by-nc/4.0/', occurrenceKey: 6422859016 },
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/684595977/original.jpg', license: 'http://creativecommons.org/licenses/by-nc/4.0/', occurrenceKey: 6422859016 },
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/678141575/original.jpg', license: 'http://creativecommons.org/licenses/by-nc/4.0/', occurrenceKey: 6400729390 },
  ],
  'Burramys parvus': [
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/518985425/original.jpg', license: 'http://creativecommons.org/licenses/by-nc/4.0/', occurrenceKey: 6499468495 },
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/580771278/original.jpg', license: 'http://creativecommons.org/licenses/by-nc/4.0/', occurrenceKey: 5868240545 },
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/231631871/original.jpg', license: 'http://creativecommons.org/licenses/by-nc/4.0/', occurrenceKey: 3912482433 },
  ],
  'Cercartetus concinnus': [
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/712591468/original.jpg', license: 'http://creativecommons.org/licenses/by-nc/4.0/', occurrenceKey: 6479673484 },
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/340253486/original.jpeg', license: 'http://creativecommons.org/licenses/by-nc/4.0/', occurrenceKey: 6441641510 },
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/729568416/original.jpg', license: 'http://creativecommons.org/licenses/by/4.0/', occurrenceKey: 6519881469 },
  ],
  'Cercartetus nanus': [
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/657258543/original.jpg', license: 'http://creativecommons.org/licenses/by-nc/4.0/', occurrenceKey: 6273694697 },
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/471669740/original.jpg', license: 'http://creativecommons.org/licenses/by-nc/4.0/', occurrenceKey: 6273251954 },
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/471669773/original.jpg', license: 'http://creativecommons.org/licenses/by-nc/4.0/', occurrenceKey: 6273251954 },
  ],
  'Dactylopsila trivirgata': [
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/718376719/original.jpg', license: 'http://creativecommons.org/licenses/by-nc/4.0/', occurrenceKey: 6499081805 },
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/721134762/original.jpg', license: 'http://creativecommons.org/licenses/by-nc/4.0/', occurrenceKey: 6500104699 },
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/718376642/original.jpg', license: 'http://creativecommons.org/licenses/by-nc/4.0/', occurrenceKey: 6499081805 },
  ],
  'Hypsiprymnodon moschatus': [
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/715390957/original.jpg', license: 'http://creativecommons.org/licenses/by-nc/4.0/', occurrenceKey: 6498200139 },
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/715390965/original.jpg', license: 'http://creativecommons.org/licenses/by-nc/4.0/', occurrenceKey: 6498200139 },
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/715390962/original.jpg', license: 'http://creativecommons.org/licenses/by-nc/4.0/', occurrenceKey: 6498200139 },
  ],
  'Lasiorhinus krefftii': [
    { url: 'https://images.ala.org.au/image/proxyImageThumbnailLarge?imageId=15283291-d964-47d9-a24a-8aecfa3f2012', license: 'http://creativecommons.org/licenses/by/4.0/', occurrenceKey: 2423550525 },
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/187863878/original.jpg', license: 'http://creativecommons.org/licenses/by-nc/4.0/', occurrenceKey: 4524891845 },
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/644748143/original.jpg', license: 'http://creativecommons.org/licenses/by-nc/4.0/', occurrenceKey: 6235545521 },
  ],
  'Lasiorhinus latifrons': [
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/722428907/original.jpg', license: 'http://creativecommons.org/licenses/by-nc/4.0/', occurrenceKey: 6498497737 },
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/722430631/original.jpg', license: 'http://creativecommons.org/licenses/by-nc/4.0/', occurrenceKey: 6498497737 },
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/722396928/original.jpg', license: 'http://creativecommons.org/licenses/by-nc/4.0/', occurrenceKey: 6499262838 },
  ],
  'Macropus fuliginosus': [
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/607910648/original.jpg', license: 'http://creativecommons.org/licenses/by-nc/4.0/', occurrenceKey: 6131272345 },
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/609912081/original.jpg', license: 'http://creativecommons.org/licenses/by-nc/4.0/', occurrenceKey: 6131239557 },
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/609703758/original.jpg', license: 'http://creativecommons.org/licenses/by-nc/4.0/', occurrenceKey: 6131208415 },
  ],
  'Macropus giganteus': [
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/610595594/original.jpg', license: 'http://creativecommons.org/licenses/by-nc/4.0/', occurrenceKey: 6130047213 },
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/608878109/original.jpg', license: 'http://creativecommons.org/licenses/by-nc/4.0/', occurrenceKey: 6130017099 },
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/608507091/original.jpg', license: 'http://creativecommons.org/licenses/by-nc/4.0/', occurrenceKey: 6130007520 },
  ],
  'Notamacropus agilis': [
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/674579854/original.jpg', license: 'http://creativecommons.org/licenses/by-nc/4.0/', occurrenceKey: 6399859577 },
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/689046211/original.jpg', license: 'http://creativecommons.org/licenses/by-nc/4.0/', occurrenceKey: 6431771841 },
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/627991262/original.jpg', license: 'http://creativecommons.org/licenses/by/4.0/', occurrenceKey: 6185384268 },
  ],
  'Notamacropus dorsalis': [
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/695744679/original.jpg', license: 'http://creativecommons.org/licenses/by/4.0/', occurrenceKey: 6441109170 },
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/702618504/original.jpg', license: 'http://creativecommons.org/licenses/by/4.0/', occurrenceKey: 6470518056 },
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/715363278/original.jpg', license: 'http://creativecommons.org/licenses/by-nc/4.0/', occurrenceKey: 6499878594 },
  ],
  'Notamacropus eugenii': [
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/722761565/original.jpg', license: 'http://creativecommons.org/licenses/by-nc/4.0/', occurrenceKey: 6520616804 },
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/727574826/original.jpg', license: 'http://creativecommons.org/licenses/by-nc/4.0/', occurrenceKey: 6520550663 },
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/727345720/original.jpg', license: 'http://creativecommons.org/licenses/by-nc/4.0/', occurrenceKey: 6520057671 },
  ],
  'Notamacropus parma': [
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/595346494/original.jpg', license: 'http://creativecommons.org/licenses/by-nc/4.0/', occurrenceKey: 6170933016 },
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/595346586/original.jpg', license: 'http://creativecommons.org/licenses/by-nc/4.0/', occurrenceKey: 6170933016 },
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/666956243/original.jpg', license: 'http://creativecommons.org/licenses/by-nc/4.0/', occurrenceKey: 6352868559 },
  ],
  'Notamacropus parryi': [
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/704731111/original.jpg', license: 'http://creativecommons.org/licenses/by-nc/4.0/', occurrenceKey: 6470669090 },
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/683238116/original.jpg', license: 'http://creativecommons.org/licenses/by-nc/4.0/', occurrenceKey: 6413678607 },
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/674944026/original.jpg', license: 'http://creativecommons.org/licenses/by-nc/4.0/', occurrenceKey: 6400562603 },
  ],
  'Notamacropus rufogriseus': [
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/608497744/original.jpg', license: 'http://creativecommons.org/licenses/by-nc/4.0/', occurrenceKey: 6130707726 },
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/608131230/original.jpg', license: 'http://creativecommons.org/licenses/by-nc/4.0/', occurrenceKey: 6130620470 },
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/610078400/original.jpg', license: 'http://creativecommons.org/licenses/by-nc/4.0/', occurrenceKey: 6130600571 },
  ],
  'Osphranter antilopinus': [
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/719541666/original.jpg', license: 'http://creativecommons.org/licenses/by-nc/4.0/', occurrenceKey: 6500173525 },
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/719543222/original.jpg', license: 'http://creativecommons.org/licenses/by-nc/4.0/', occurrenceKey: 6498812888 },
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/710813135/original.jpg', license: 'http://creativecommons.org/licenses/by-nc/4.0/', occurrenceKey: 6479699257 },
  ],
  'Osphranter rufus': [
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/702617872/original.jpg', license: 'http://creativecommons.org/licenses/by-nc/4.0/', occurrenceKey: 6470057342 },
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/700646036/original.jpg', license: 'http://creativecommons.org/licenses/by-nc/4.0/', occurrenceKey: 6451752670 },
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/694394281/original.jpg', license: 'http://creativecommons.org/licenses/by-nc/4.0/', occurrenceKey: 6441818130 },
  ],
  'Petauroides volans': [
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/659727774/original.jpg', license: 'http://creativecommons.org/licenses/by-nc/4.0/', occurrenceKey: 6320301859 },
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/659727755/original.jpg', license: 'http://creativecommons.org/licenses/by-nc/4.0/', occurrenceKey: 6320301859 },
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/659727790/original.jpg', license: 'http://creativecommons.org/licenses/by-nc/4.0/', occurrenceKey: 6320301859 },
  ],
  'Petaurus australis': [
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/719354628/original.jpg', license: 'http://creativecommons.org/licenses/by-nc/4.0/', occurrenceKey: 6498701919 },
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/702818014/original.jpg', license: 'http://creativecommons.org/licenses/by/4.0/', occurrenceKey: 6470556458 },
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/721551351/original.jpg', license: 'http://creativecommons.org/licenses/by-nc/4.0/', occurrenceKey: 6499746987 },
  ],
  'Petaurus breviceps': [
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/729604182/original.jpg', license: 'http://creativecommons.org/licenses/by-nc/4.0/', occurrenceKey: 6519473743 },
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/724869864/original.jpg', license: 'http://creativecommons.org/licenses/by-nc/4.0/', occurrenceKey: 6519241281 },
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/699021895/original.jpg', license: 'http://creativecommons.org/licenses/by-nc/4.0/', occurrenceKey: 6519099440 },
  ],
  'Petaurus norfolcensis': [
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/719356880/original.jpg', license: 'http://creativecommons.org/licenses/by-nc/4.0/', occurrenceKey: 6499653064 },
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/701406791/original.jpg', license: 'http://creativecommons.org/licenses/by-nc/4.0/', occurrenceKey: 6452146353 },
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/698109698/original.jpg', license: 'http://creativecommons.org/licenses/by/4.0/', occurrenceKey: 6452659895 },
  ],
  'Petrogale lateralis': [
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/699406604/original.jpg', license: 'http://creativecommons.org/licenses/by-nc/4.0/', occurrenceKey: 6452268895 },
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/699410798/original.jpg', license: 'http://creativecommons.org/licenses/by-nc/4.0/', occurrenceKey: 6452517602 },
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/699410920/original.jpg', license: 'http://creativecommons.org/licenses/by-nc/4.0/', occurrenceKey: 6452559861 },
  ],
  'Petrogale penicillata': [
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/714154146/original.jpg', license: 'http://creativecommons.org/licenses/by-nc/4.0/', occurrenceKey: 6480954273 },
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/728767822/original.jpg', license: 'http://creativecommons.org/licenses/by-nc/4.0/', occurrenceKey: 6520427137 },
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/728391187/original.jpg', license: 'http://creativecommons.org/licenses/by-nc/4.0/', occurrenceKey: 6519583069 },
  ],
  'Petrogale xanthopus': [
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/718438268/original.jpg', license: 'http://creativecommons.org/licenses/by-nc/4.0/', occurrenceKey: 6500407621 },
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/704530185/original.jpg', license: 'http://creativecommons.org/licenses/by-nc/4.0/', occurrenceKey: 6470581823 },
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/703071956/original.jpg', license: 'http://creativecommons.org/licenses/by-nc/4.0/', occurrenceKey: 6469948118 },
  ],
  'Phascolarctos cinereus': [
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/605200361/original.jpg', license: 'http://creativecommons.org/licenses/by-nc/4.0/', occurrenceKey: 5938646245 },
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/605200343/original.jpg', license: 'http://creativecommons.org/licenses/by-nc/4.0/', occurrenceKey: 5938646245 },
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/604930576/original.jpg', license: 'http://creativecommons.org/licenses/by-nc/4.0/', occurrenceKey: 5938658224 },
  ],
  'Potorous tridactylus': [
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/675791688/original.jpg', license: 'http://creativecommons.org/licenses/by-nc/4.0/', occurrenceKey: 6399906105 },
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/717135756/original.jpg', license: 'http://creativecommons.org/licenses/by-nc/4.0/', occurrenceKey: 6498854671 },
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/726254533/original.jpg', license: 'http://creativecommons.org/licenses/by-nc/4.0/', occurrenceKey: 6519955908 },
  ],
  'Pseudocheirus occidentalis': [
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/720664775/original.jpg', license: 'http://creativecommons.org/licenses/by-nc/4.0/', occurrenceKey: 6498336784 },
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/712528838/original.jpg', license: 'http://creativecommons.org/licenses/by-nc/4.0/', occurrenceKey: 6479361985 },
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/696447472/original.jpg', license: 'http://creativecommons.org/licenses/by-nc/4.0/', occurrenceKey: 6441172861 },
  ],
  'Pseudocheirus peregrinus': [
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/610798281/original.jpg', license: 'http://creativecommons.org/licenses/by-nc/4.0/', occurrenceKey: 6131007318 },
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/611642855/original.jpg', license: 'http://creativecommons.org/licenses/by-nc/4.0/', occurrenceKey: 6131032764 },
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/608932674/original.jpg', license: 'http://creativecommons.org/licenses/by-nc/4.0/', occurrenceKey: 6131075728 },
  ],
  'Pseudochirops archeri': [
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/725057932/original.jpg', license: 'http://creativecommons.org/licenses/by-nc/4.0/', occurrenceKey: 6520501693 },
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/728846844/original.jpg', license: 'http://creativecommons.org/licenses/by-nc/4.0/', occurrenceKey: 6519047970 },
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/713434410/original.jpg', license: 'http://creativecommons.org/licenses/by-nc/4.0/', occurrenceKey: 6480616528 },
  ],
  'Setonix brachyurus': [
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/727330079/original.jpg', license: 'http://creativecommons.org/licenses/by-nc/4.0/', occurrenceKey: 6518987651 },
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/710061829/original.jpg', license: 'http://creativecommons.org/licenses/by-nc/4.0/', occurrenceKey: 6479284787 },
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/629507008/original.jpg', license: 'http://creativecommons.org/licenses/by-nc/4.0/', occurrenceKey: 6184776175 },
  ],
  'Tarsipes rostratus': [
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/729564505/original.jpg', license: 'http://creativecommons.org/licenses/by/4.0/', occurrenceKey: 6520023361 },
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/710846178/original.jpg', license: 'http://creativecommons.org/licenses/by-nc/4.0/', occurrenceKey: 6480154933 },
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/622995673/original.jpg', license: 'http://creativecommons.org/licenses/by-nc/4.0/', occurrenceKey: 6179270798 },
  ],
  'Trichosurus cunninghami': [
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/704526701/original.jpg', license: 'http://creativecommons.org/licenses/by-nc/4.0/', occurrenceKey: 6469877448 },
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/711722461/original.jpg', license: 'http://creativecommons.org/licenses/by-nc/4.0/', occurrenceKey: 6479176666 },
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/711722420/original.jpg', license: 'http://creativecommons.org/licenses/by-nc/4.0/', occurrenceKey: 6479176666 },
  ],
  'Trichosurus vulpecula': [
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/607425839/original.jpg', license: 'http://creativecommons.org/licenses/by/4.0/', occurrenceKey: 6130956875 },
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/608743897/original.jpg', license: 'http://creativecommons.org/licenses/by-nc/4.0/', occurrenceKey: 6130955520 },
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/609435094/original.jpg', license: 'http://creativecommons.org/publicdomain/zero/1.0/', occurrenceKey: 6130890643 },
  ],
  'Vombatus ursinus': [
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/609632511/original.jpg', license: 'http://creativecommons.org/licenses/by-nc/4.0/', occurrenceKey: 6131386454 },
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/609632535/original.jpg', license: 'http://creativecommons.org/licenses/by-nc/4.0/', occurrenceKey: 6131465834 },
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/606357789/original.jpg', license: 'http://creativecommons.org/licenses/by/4.0/', occurrenceKey: 6131433336 },
  ],
  'Wallabia bicolor': [
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/608793777/original.jpg', license: 'http://creativecommons.org/licenses/by-nc/4.0/', occurrenceKey: 6130395772 },
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/607350865/original.jpg', license: 'http://creativecommons.org/licenses/by-nc/4.0/', occurrenceKey: 6130460193 },
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/606805458/original.jpg', license: 'http://creativecommons.org/licenses/by-nc/4.0/', occurrenceKey: 6130456929 },
  ],
  'Antechinus agilis': [
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/686813809/original.jpg', license: 'http://creativecommons.org/licenses/by-nc/4.0/', occurrenceKey: 6519805829 },
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/704917428/original.jpg', license: 'http://creativecommons.org/licenses/by-nc/4.0/', occurrenceKey: 6470426420 },
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/704232128/original.jpg', license: 'http://creativecommons.org/licenses/by-nc/4.0/', occurrenceKey: 6470232757 },
  ],
  'Antechinus flavipes': [
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/666090493/original.jpg', license: 'http://creativecommons.org/licenses/by-nc/4.0/', occurrenceKey: 6333907442 },
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/662619580/original.jpg', license: 'http://creativecommons.org/licenses/by-nc/4.0/', occurrenceKey: 6334865511 },
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/670181391/original.jpg', license: 'http://creativecommons.org/licenses/by-nc/4.0/', occurrenceKey: 6353025021 },
  ],
  'Antechinus stuartii': [
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/696974952/original.jpg', license: 'http://creativecommons.org/licenses/by-nc/4.0/', occurrenceKey: 6480721341 },
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/721003752/original.jpg', license: 'http://creativecommons.org/licenses/by-nc/4.0/', occurrenceKey: 6500206375 },
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/705150937/original.jpg', license: 'http://creativecommons.org/licenses/by-nc/4.0/', occurrenceKey: 6470208392 },
  ],
  'Antechinus swainsonii': [
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/717032198/original.jpg', license: 'http://creativecommons.org/licenses/by-nc/4.0/', occurrenceKey: 6499282699 },
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/717032049/original.jpg', license: 'http://creativecommons.org/licenses/by-nc/4.0/', occurrenceKey: 6499282699 },
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/717031999/original.jpg', license: 'http://creativecommons.org/licenses/by-nc/4.0/', occurrenceKey: 6499282699 },
  ],
  'Dasyurus geoffroii': [
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/715310048/original.jpg', license: 'http://creativecommons.org/licenses/by-nc/4.0/', occurrenceKey: 6500154795 },
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/715309942/original.jpg', license: 'http://creativecommons.org/licenses/by-nc/4.0/', occurrenceKey: 6500154795 },
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/632545463/original.jpg', license: 'http://creativecommons.org/licenses/by/4.0/', occurrenceKey: 6188313177 },
  ],
  'Dasyurus hallucatus': [
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/730214355/original.jpg', license: 'http://creativecommons.org/licenses/by-nc/4.0/', occurrenceKey: 6518511555 },
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/730214230/original.jpg', license: 'http://creativecommons.org/licenses/by-nc/4.0/', occurrenceKey: 6518511555 },
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/671388884/original.jpg', license: 'http://creativecommons.org/licenses/by-nc/4.0/', occurrenceKey: 6399096967 },
  ],
  'Dasyurus maculatus': [
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/725619519/original.jpg', license: 'http://creativecommons.org/licenses/by-nc/4.0/', occurrenceKey: 6520369558 },
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/724523279/original.jpg', license: 'http://creativecommons.org/licenses/by-nc/4.0/', occurrenceKey: 6519303845 },
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/725046310/original.jpg', license: 'http://creativecommons.org/licenses/by/4.0/', occurrenceKey: 6518899651 },
  ],
  'Dasyurus viverrinus': [
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/715506326/original.jpg', license: 'http://creativecommons.org/licenses/by-nc/4.0/', occurrenceKey: 6498905855 },
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/685729674/original.jpg', license: 'http://creativecommons.org/licenses/by-nc/4.0/', occurrenceKey: 6423218014 },
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/676920181/original.jpg', license: 'http://creativecommons.org/licenses/by-nc/4.0/', occurrenceKey: 6400466568 },
  ],
  'Myrmecobius fasciatus': [
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/705299689/original.jpg', license: 'http://creativecommons.org/licenses/by-nc/4.0/', occurrenceKey: 6469769846 },
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/728682465/original.jpg', license: 'http://creativecommons.org/licenses/by-nc/4.0/', occurrenceKey: 6519783738 },
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/705299479/original.jpg', license: 'http://creativecommons.org/licenses/by-nc/4.0/', occurrenceKey: 6469769846 },
  ],
  'Phascogale calura': [
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/510233852/original.jpg', license: 'http://creativecommons.org/licenses/by-nc/4.0/', occurrenceKey: 5167944575 },
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/510235158/original.jpg', license: 'http://creativecommons.org/licenses/by-nc/4.0/', occurrenceKey: 5167944575 },
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/178672190/original.jpg', license: 'http://creativecommons.org/licenses/by-nc/4.0/', occurrenceKey: 3469047070 },
  ],
  'Phascogale tapoatafa': [
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/636957042/original.jpg', license: 'http://creativecommons.org/licenses/by-nc/4.0/', occurrenceKey: 6195545534 },
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/666469203/original.jpg', license: 'http://creativecommons.org/licenses/by-nc/4.0/', occurrenceKey: 6334297013 },
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/664327682/original.jpg', license: 'http://creativecommons.org/licenses/by-nc/4.0/', occurrenceKey: 6333864368 },
  ],
  'Sarcophilus harrisii': [
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/685816083/original.jpg', license: 'http://creativecommons.org/licenses/by-nc/4.0/', occurrenceKey: 6423114961 },
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/685816095/original.jpg', license: 'http://creativecommons.org/licenses/by-nc/4.0/', occurrenceKey: 6423114961 },
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/685816111/original.jpg', license: 'http://creativecommons.org/licenses/by-nc/4.0/', occurrenceKey: 6423114961 },
  ],
  'Sminthopsis crassicaudata': [
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/722304605/original.jpg', license: 'http://creativecommons.org/licenses/by-nc/4.0/', occurrenceKey: 6499789461 },
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/722531321/original.jpg', license: 'http://creativecommons.org/licenses/by-nc/4.0/', occurrenceKey: 6519461155 },
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/660519987/original.jpg', license: 'http://creativecommons.org/licenses/by-nc/4.0/', occurrenceKey: 6413318802 },
  ],
  'Sminthopsis macroura': [
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/722305193/original.jpg', license: 'http://creativecommons.org/licenses/by-nc/4.0/', occurrenceKey: 6499222247 },
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/558466992/original.jpg', license: 'http://creativecommons.org/licenses/by-nc/4.0/', occurrenceKey: 6441716858 },
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/648812430/original.jpg', license: 'http://creativecommons.org/licenses/by-nc/4.0/', occurrenceKey: 6441424802 },
  ],
  'Sminthopsis murina': [
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/714779446/original.jpg', license: 'http://creativecommons.org/licenses/by-nc/4.0/', occurrenceKey: 6480532343 },
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/663065438/original.jpg', license: 'http://creativecommons.org/licenses/by-nc/4.0/', occurrenceKey: 6334905539 },
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/664805964/original.jpg', license: 'http://creativecommons.org/licenses/by-nc/4.0/', occurrenceKey: 6334574495 },
  ],
  'Isoodon auratus': [
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/452405922/original.jpeg', license: 'http://creativecommons.org/licenses/by-nc/4.0/', occurrenceKey: 4987381216 },
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/558435859/original.jpg', license: 'http://creativecommons.org/licenses/by-nc/4.0/', occurrenceKey: 5827479522 },
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/444960950/original.jpeg', license: 'http://creativecommons.org/licenses/by-nc/4.0/', occurrenceKey: 4976337888 },
  ],
  'Isoodon macrourus': [
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/707206350/original.jpg', license: 'http://creativecommons.org/licenses/by-nc/4.0/', occurrenceKey: 6480812661 },
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/680717865/original.jpg', license: 'http://creativecommons.org/licenses/by-nc/4.0/', occurrenceKey: 6441359852 },
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/656454946/original.jpg', license: 'http://creativecommons.org/licenses/by-nc/4.0/', occurrenceKey: 6441253826 },
  ],
  'Isoodon obesulus': [
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/657892875/original.jpg', license: 'http://creativecommons.org/licenses/by-nc/4.0/', occurrenceKey: 6273970364 },
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/691896233/original.jpg', license: 'http://creativecommons.org/licenses/by-nc/4.0/', occurrenceKey: 6431156839 },
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/673602652/original.jpg', license: 'http://creativecommons.org/licenses/by-nc/4.0/', occurrenceKey: 6273970364 },
  ],
  'Macrotis lagotis': [
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/723591177/original.jpg', license: 'http://creativecommons.org/licenses/by-nc/4.0/', occurrenceKey: 6518561179 },
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/723881852/original.jpg', license: 'http://creativecommons.org/licenses/by-nc/4.0/', occurrenceKey: 6520154800 },
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/678142504/original.jpg', license: 'http://creativecommons.org/licenses/by-nc/4.0/', occurrenceKey: 6400194744 },
  ],
  'Perameles gunnii': [
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/723502831/original.jpg', license: 'http://creativecommons.org/licenses/by-nc/4.0/', occurrenceKey: 6520183076 },
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/723502829/original.jpg', license: 'http://creativecommons.org/licenses/by-nc/4.0/', occurrenceKey: 6520183076 },
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/723502827/original.jpg', license: 'http://creativecommons.org/licenses/by-nc/4.0/', occurrenceKey: 6520183076 },
  ],
  'Perameles nasuta': [
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/641821936/original.jpg', license: 'http://creativecommons.org/licenses/by-nc/4.0/', occurrenceKey: 6234277769 },
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/635084244/original.jpg', license: 'http://creativecommons.org/licenses/by-nc/4.0/', occurrenceKey: 6195867618 },
    { url: 'https://inaturalist-open-data.s3.amazonaws.com/photos/641821908/original.jpg', license: 'http://creativecommons.org/licenses/by-nc/4.0/', occurrenceKey: 6234277769 },
  ],
}

const IMAGES_PER_SPECIES = 3
const LICENSES = ['CC0_1_0', 'CC_BY_4_0', 'CC_BY_NC_4_0']
const REQUEST_DELAY_MS = 100
// --------------------------------------------------------------------------

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// GBIF's occurrence search flakes occasionally (observed both a 503 and a
// read timeout while researching this script) — retry with backoff rather
// than let one blip fail the whole run.
async function fetchJson(url, { tries = 7, timeoutMs = 30000 } = {}) {
  let lastError
  for (let attempt = 1; attempt <= tries; attempt++) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)
    try {
      const res = await fetch(url, { signal: controller.signal })
      if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`)
      return await res.json()
    } catch (error) {
      lastError = error
      if (attempt < tries) await sleep(Math.min(1000 * 2 ** (attempt - 1), 15000))
    } finally {
      clearTimeout(timer)
    }
  }
  const cause = lastError?.cause ? `\n  cause: ${lastError.cause}` : ''
  throw new Error(`Failed after ${tries} attempts: ${url}\n  ${lastError}${cause}`)
}

function fail(message) {
  console.error(message)
  process.exit(1)
}

async function matchTaxon(scientificName) {
  const url = `https://api.gbif.org/v1/species/match?name=${encodeURIComponent(scientificName)}`
  const match = await fetchJson(url)
  if (match.matchType !== 'EXACT') {
    fail(`"${scientificName}" did not match exactly (matchType=${match.matchType}) — check the name.`)
  }
  return match.usageKey
}

// Every species returns a dozen+ English common names across sources, with
// some noise (the koala also returns "Monkey Bear", "Bear of Australia").
// Verified live: picking whichever name recurs most often (case-insensitive)
// gives the standard common name in every spot-check (koala, platypus,
// eastern grey kangaroo, woylie, kowari).
async function pickCommonName(usageKey, scientificName) {
  if (COMMON_NAME_OVERRIDES[scientificName]) return COMMON_NAME_OVERRIDES[scientificName]

  const url = `https://api.gbif.org/v1/species/${usageKey}/vernacularNames?limit=100`
  const { results } = await fetchJson(url)
  const englishNames = results
    .filter((r) => r.language === 'eng' && r.vernacularName)
    .map((r) => r.vernacularName.trim().replace(/\.$/, ''))
  if (englishNames.length === 0) fail(`No English common name for "${scientificName}" (usageKey ${usageKey})`)

  const counts = new Map()
  for (const name of englishNames) {
    const key = name.toLowerCase()
    counts.set(key, (counts.get(key) ?? { count: 0, display: name }))
    const entry = counts.get(key)
    entry.count++
    counts.set(key, entry)
  }
  return [...counts.values()].sort((a, b) => b.count - a.count)[0].display
}

async function fetchIucnStatus(usageKey) {
  try {
    const data = await fetchJson(`https://api.gbif.org/v1/species/${usageKey}/iucnRedListCategory`)
    return data.category ?? null
  } catch {
    // Not every species has an IUCN linkage — absence is a valid outcome, not an error.
    return null
  }
}

// Total AU occurrence count, independent of the image/license filter above —
// a rarity signal the app can surface later (never used to define unlock rules).
async function fetchObservationCount(usageKey) {
  const url = `https://api.gbif.org/v1/occurrence/search?taxonKey=${usageKey}&country=AU&limit=0`
  const { count } = await fetchJson(url)
  return count
}

// The `license=` query param filters on the OCCURRENCE record's license, but
// each occurrence's individual media items can carry their own (sometimes
// more restrictive) license — observed live: filtering on
// CC0/BY/BY-NC still let 3 CC-BY-ND / CC-BY-NC-ND images through, because
// those occurrences' record-level license was an allowed one even though the
// photo itself was not. ND (No-Derivatives) licenses are excluded on
// purpose: this is a hard allow-list re-checked per media item, not a
// second use of the query param.
function allowedLicense(url) {
  if (!url) return false
  if (/publicdomain\/zero/i.test(url)) return true
  if (/licenses\/by\/4\.0/i.test(url)) return true
  if (/licenses\/by-nc\/4\.0/i.test(url)) return true
  return false
}

// Occurrences tagged to certain iNaturalist projects are systematically bad
// picks for a dex card, for two different reasons — found by eye while
// reviewing this script's output, then confirmed generalizable by checking
// the `projectId` field on the occurrences behind the bad photos:
//   - "trail-cameras-australia" / "camera-traps-trail-cams": unattended IR
//     camera-trap photos — frequently dark, out of focus, subject small/
//     obscured, sometimes just an empty burrow entrance.
//   - "roadtoll" / "roadkill" / "sick-injured-and-deceased-wildlife" /
//     "mortality-and-injury": dead or injured animal photos, wrong tone
//     entirely for a collectible species dex regardless of image quality.
// Not exhaustive — some bad photos (e.g. one that turned out to be a
// screenshot of a phone's Photos app, not a wildlife photo) carry no
// project tag at all, so EXCLUDED_OCCURRENCE_KEYS below still exists as a
// manual backstop.
const BLOCKED_PROJECT_KEYWORDS = [
  'trail-camera',
  'camera-trap',
  'roadtoll',
  'roadkill',
  'road-toll',
  'sick-injured-and-deceased',
  'mortality-and-injury',
]
function isBlockedProject(projectId) {
  if (!projectId) return false
  const lower = projectId.toLowerCase()
  return BLOCKED_PROJECT_KEYWORDS.some((keyword) => lower.includes(keyword))
}

// Pick IMAGES_PER_SPECIES distinct, licensed images deterministically so
// re-running the pipeline doesn't reshuffle the dex. Preference: iNaturalist
// full-resolution originals over ALA proxy thumbnails, then DESCENDING
// occurrence key (newest first). Ascending was tried first and quietly
// preferred the oldest record in the pool — for several species that turned
// out to be a single camera-trap contributor's decade-old, watermarked,
// often near-unidentifiable night shots (confirmed by eye: "Ry Beaver
// Photography" branded IR photos won for Phascogale calura, Antechinus
// stuartii, Trichosurus cunninghami). Recent iNaturalist submissions are
// consistently better framed daylight photos, so newest-first is both a
// quality fix and still fully deterministic.
async function pickImages(usageKey, scientificName) {
  const licenseParams = LICENSES.map((l) => `license=${l}`).join('&')
  const url =
    `https://api.gbif.org/v1/occurrence/search?taxonKey=${usageKey}&country=AU` +
    `&mediaType=StillImage&limit=100&${licenseParams}`
  const { results } = await fetchJson(url)

  const seen = new Set()
  const candidates = []
  for (const occurrence of results) {
    for (const media of occurrence.media ?? []) {
      if (media.type !== 'StillImage' || !media.identifier) continue
      if (seen.has(media.identifier)) continue
      seen.add(media.identifier)
      if (EXCLUDED_OCCURRENCE_KEYS.has(occurrence.key)) continue
      if (isBlockedProject(occurrence.projectId)) continue
      const license = media.license ?? occurrence.license ?? null
      if (!allowedLicense(license)) continue
      candidates.push({
        url: media.identifier,
        license,
        occurrenceKey: occurrence.key,
        isInaturalist: media.identifier.includes('inaturalist-open-data.s3.amazonaws.com'),
      })
    }
  }

  candidates.sort((a, b) => {
    if (a.isInaturalist !== b.isInaturalist) return a.isInaturalist ? -1 : 1
    return b.occurrenceKey - a.occurrenceKey
  })

  const chosen = candidates.slice(0, IMAGES_PER_SPECIES)
  if (chosen.length < IMAGES_PER_SPECIES) {
    fail(
      `Only found ${chosen.length}/${IMAGES_PER_SPECIES} licensed images for "${scientificName}" ` +
        `(usageKey ${usageKey}) — lower the species list or investigate, don't ship fewer images silently.`,
    )
  }
  return chosen.map(({ url, license, occurrenceKey }) => ({ url, license, occurrenceKey }))
}

// Manual picks (curated by a human, see MANUAL_IMAGE_PICKS above) always win
// when present — no GBIF call, no re-ranking. Falls back to the automated
// pickImages() heuristic only for a species that hasn't been curated yet.
async function resolveImages(usageKey, scientificName) {
  const manual = MANUAL_IMAGE_PICKS[scientificName]
  if (manual) return manual
  return pickImages(usageKey, scientificName)
}

async function buildSpecies(entry, index, total) {
  const { scientificName, order } = entry
  process.stdout.write(`[${index + 1}/${total}] ${scientificName} ... `)

  // Sequential, not Promise.all: GBIF sheds load hard under concurrent
  // requests from one client (measured ~50% 503 rate at just 5 parallel
  // calls to the same endpoint), so one request in flight at a time.
  const usageKey = await matchTaxon(scientificName)
  const commonName = await pickCommonName(usageKey, scientificName)
  await sleep(REQUEST_DELAY_MS)
  const iucnStatus = await fetchIucnStatus(usageKey)
  await sleep(REQUEST_DELAY_MS)
  const images = await resolveImages(usageKey, scientificName)
  await sleep(REQUEST_DELAY_MS)
  const observationCount = await fetchObservationCount(usageKey)

  if (iucnStatus === 'EXTINCT') {
    fail(
      `"${scientificName}" is classed EXTINCT by GBIF/IUCN — this species should not be in the ` +
        `dex config (see the Bettongia penicillata caveat at the top of this file).`,
    )
  }

  console.log(`${commonName} (${iucnStatus ?? 'not evaluated'}, ${images.length} images)`)

  return {
    scientificName,
    commonName,
    order,
    gbifUsageKey: usageKey,
    iucnStatus,
    observationCount,
    sourceUrl: `https://www.gbif.org/species/${usageKey}`,
    images,
  }
}

async function main() {
  const species = []
  for (let i = 0; i < SPECIES.length; i++) {
    species.push(await buildSpecies(SPECIES[i], i, SPECIES.length))
    if (i < SPECIES.length - 1) await sleep(REQUEST_DELAY_MS)
  }

  const out = {
    generatedAt: new Date().toISOString(),
    source: 'GBIF (Global Biodiversity Information Facility) occurrence records, Australia',
    sourceUrl: 'https://www.gbif.org/',
    speciesCount: species.length,
    species,
  }

  const outDir = join(here, '..', 'output')
  mkdirSync(outDir, { recursive: true })
  const outPath = join(outDir, 'species.json')
  writeFileSync(outPath, JSON.stringify(out, null, 2))

  const byOrder = {}
  const byLicense = {}
  const byStatus = {}
  for (const s of species) {
    byOrder[s.order] = (byOrder[s.order] ?? 0) + 1
    byStatus[s.iucnStatus ?? 'NOT_EVALUATED'] = (byStatus[s.iucnStatus ?? 'NOT_EVALUATED'] ?? 0) + 1
    for (const img of s.images) byLicense[img.license] = (byLicense[img.license] ?? 0) + 1
  }

  console.log('\nGBIF species dex pipeline')
  console.log('  species:', species.length, '| images:', species.length * IMAGES_PER_SPECIES)
  console.table(byOrder)
  console.table(byStatus)
  console.table(byLicense)
  console.log('  output:', outPath, `(${(statSync(outPath).size / 1024).toFixed(1)} KB)`)
}

main().catch((error) => fail(error.stack ?? String(error)))
