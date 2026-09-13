# Curbi data pipeline

Offline scripts that clean open datasets into `output/*.json`, which the loader
scripts in `../backend` then upsert into the hosted PostgreSQL database. The
FastAPI app reads that database in real time. Nothing here is bundled into the
frontend build and nothing here is deployed — run manually on a developer
machine, then re-run the matching backend loader.

The unit's rule is that the app may not ship pre-processed data hard-coded into
it; cleaning datasets offline **is** allowed as long as the served copy lives in
the hosted relational database, which must also be writable at any time (the
loaders upsert, so re-running them adds/updates rows without a wipe).

| Clean (here) | Load (backend) | Story | Refresh |
|---|---|---|---|
| `npm run build:nhsd` → `output/nhsd-services.json` | `python ../backend/build_nhsd_db.py` → `services` table | Epic 2 / US2 | when a new NHSD snapshot ships |
| `npm run build:postcodes` → `output/vic-postcodes.json` | `python ../backend/build_postcodes_db.py` → `postcodes` table | Epic 2 / US2 | rarely (postcodes barely move) |
| `npm run build:aihw` → `output/regional-access.json` | `python ../backend/build_aihw_db.py` → `regional_access` table | Epic 4 / US4 | annual (AIHW release ~May) |
| `npm run build:gbif` → `output/species.json` | `python ../backend/build_species_db.py` → `species` + `species_images` tables | Epic 8 / US8 | rarely (fixed species list, human-picked images; re-run to refresh names/status) |
| `npm run build:jamendo` → `output/tracks.json` | `python ../backend/build_tracks_db.py` → `tracks` table | Epic 6 / US6 | occasionally (re-run to pick up newer popular tracks) |

Every data endpoint is now a pure database read: `GET /api/v1/services` queries
the `services` table, `GET /api/v1/geocode` the `postcodes` table, and
`GET /api/v1/regional-access` the `regional_access` table. Nothing fetches or
parses a source at request time — the old `postcodeapi.com.au` call, the runtime
fetch of the Australian Postcodes file, and the AIHW auto-refresh job are all
gone. `GET /api/v1/tracks` (Epic 6) reads its table the same way. `GET /api/v1/species`
(Epic 8) will too, once the backend owner adds that endpoint.

## NHSD — nearby mental health services (Epic 2 / US2)

**Source:** Healthdirect – NHSD – Services Directory 2025
data.gov.au record: <https://data.gov.au/data/en/dataset/healthdirect_nhsd_services_directory_2025>
Actual file: AURIN (`data.aurin.org.au`), requires an Australian-university (institutional)
login to download. Snapshot: point-in-time extract **as at June 2025** — a static extract,
not a live API. Listings are frozen at June 2025 until a refreshed bundle ships; surface an
"information as of June 2025" note in the UI.

**Licence:** No open licence. The data.gov.au record lists the licence as "Not Specified"; the
only access path is the AURIN Data Provider Platform, which gates the download behind the
**AURIN NHSD Platform Terms of Use v1.0 (6 June 2023)** (University of Melbourne) and, by
reference, the healthdirect NHSD Terms of Use
(<https://about.healthdirect.gov.au/nhsd-terms-of-use>).

Key terms (AURIN NHSD Platform Terms of Use):

- Scholarly/research and/or government/not-for-profit use only — **publication is explicitly
  included** (cl. 1). **No commercial use** (cl. 2).
- Non-transferable licence, for use **within Australia only** (cl. 5).
- NHSD Content is owned by **Healthdirect Australia Ltd**; attribute it and claim no IP in it
  (cl. 4).
- Personal information / identifiers must not be disclosed to an **overseas recipient**
  (cl. 9(d)).
- Content must not be used in a false, inaccurate or misleading way (cl. 7(a)) — hence the
  "information as of June 2025" note above.

Curbi (non-commercial student project, Australian focus, database hosted in AWS RDS Sydney) is
within cl. 1 / 2 / 5, so a public deployment is permitted. Record the licence basis and
compliance in the Data Management Plan (Ethical / Legal / Privacy section).

### Raw file

- `input/nhsd_services_directory_2025.csv` — full Australia extract, CSV, ~55 MB, 129,231 rows
  (git-ignored; download it into `input/` yourself).
- No spatial filter was applied at download time; the script filters to Victoria.
- Columns present: `nhsd_service_id`, `status`, `organization`, address parts
  (`address`, `city`, `state`, `postcode`), `latitude`, `longitude`, `<weekday>_open_hours`,
  parent-organisation fields, ~45 public-holiday availability flags, `the_geom`.

### Data caveats (carry into the Data Management Plan)

1. **No service-type / category column.** Mental-health services are identified only by
   keyword match on the service name (`MENTAL_HEALTH` regex in `src/build-nhsd.js`:
   `psycholog|psychiatr|psychotherap|counsell|counselin|mental health|headspace`).
   - Misses services whose name doesn't state the profession (e.g. a GP clinic that also
     offers mental-health care, some social workers).
   - Rare false positives: in the current VIC output, 2 of 1,308 records
     ("Nutritional Psychology", "Rural Financial Counselling Service"). ~0.15%.
2. **No phone / email / website column** in this extract. US2's acceptance criteria cannot
   show a phone number from this data — show name + address + suburb + opening hours instead.
3. **`status` is not usable as an "is it operating" filter.** 88% of all rows read `CLOSED`,
   and in VIC nearly every private practice reads `CLOSED` while only 24/7 hospital units
   read `OPEN` — the field reflects whether the service was inside its opening hours at
   snapshot time, not whether it still operates. The script does **not** filter on it.
4. ~143 of the kept records have "Confidential Address" or no street address (sole
   practitioners); they still carry suburb + coordinates. More broadly, records named after
   an individual practitioner are **personal information** — see the licence note above
   (cl. 9(d)): they must not be served to overseas recipients, so they need filtering or
   access control before the public API relies on them.

### Filter logic (`src/build-nhsd.js`)

Keep a row when: `state == "VIC"` **and** the name matches the mental-health regex **and**
`latitude`/`longitude` are finite numbers inside a loose Victoria bounding box.
Not filtered on `status`. De-duplicated on `name|address|suburb` (NHSD assigns a distinct
`nhsd_service_id` to repeat rows for the same organisation at the same address, so the id
itself doesn't dedupe them). Sorted by name.

Output record: `{ id, name, address, suburb, postcode, state, lat, lon, hours? }`
where `hours` is an object with only the populated days (`mon`..`sun`), omitted if none.

### Run

Needs the PostgreSQL database reachable via `DATABASE_URL` (see
`../backend/.env.example`).

```
npm install
npm run build:nhsd
python ../backend/build_nhsd_db.py
```

Writes `output/nhsd-services.json` (a local build artifact — git-ignored, not the
served copy), then upserts it into the `services` table, which `GET /api/v1/services`
(suburb/postcode exact match, or `near=lat:lon,...` for distance-sorted nearby
results) queries at request time.

Current VIC output: **1,308 services** — small enough that the `near` query loads
the table and sorts by haversine in Python, no PostGIS.

---

## Postcodes — suburb/postcode → coordinate (Epic 2 / US2)

`GET /api/v1/geocode` turns a typed suburb or postcode into the coordinate the
Help Finder measures distance from. This used to be an in-memory cache the backend
refreshed from the live Australian Postcodes file; it is now the `postcodes`
table.

**Source:** Australian Postcodes, Matthew Proctor —
<https://www.matthewproctor.com/australian_postcodes>
Direct file: <https://www.matthewproctor.com/Content/postcodes/australian_postcodes.json>
**Licence:** CC BY 4.0 — attribute in the Data Management Plan.

### Raw file

- `input/australian_postcodes.json` (git-ignored; download it into `input/` yourself
  from the direct-file link above).
- Fields used: `locality`, `postcode`, `state`, `type`, `lat`, `long`.

### Filter logic (`src/build-postcodes.js`)

Keep rows where `state == "VIC"` and `type == "Delivery Area"` (excludes PO boxes),
with finite non-zero coordinates. Suburb upper-cased; de-duplicated on
`postcode|suburb` (the source repeats a locality across statistical-area variants).
Output record: `{ postcode, suburb, lat, lon }`.

### Run

```
npm install
npm run build:postcodes
python ../backend/build_postcodes_db.py
```

---

## AIHW — regional access snapshot (Epic 4 / US4)

**Source:** AIHW *Medicare mental health services* annual data tables.
Page: <https://www.aihw.gov.au/mental-health/resources/data-tables> → "Data tables: Medicare
mental health services `<FY>`" (a ZIP). 2024–25 release published May 2026.
**Licence:** open (AIHW; CC BY — confirm exact statement from the page and record in the DMP).

Chosen after ruling out a quarterly source: no Australian dataset offers mental-health-specific
+ metro-vs-regional geography + quarterly refresh together. The AIHW quarterly *Activity
Monitoring* report is state-level only and has no downloadable file; a hand-built MBS item list
via Services Australia is a landmine (items 2712/2713 were renumbered late 2025, silently
producing a bogus −20% "trend"). This annual PHN table is AIHW-curated (item mapping handled)
and stable year to year.

### Raw file

- `input/Medicare-mental-health-service-<FY>.zip` (git-ignored; download it yourself).
  The download URL carries a per-release `getmedia` GUID, so it is **not** hard-coded — grab
  the current link from the Data tables page, or a human updates it each year.
- The script reads the `Medicare mental health services PHN SA4 <FY>.csv` entry from inside
  the ZIP. That CSV is **Windows-1252 encoded** and uses non-breaking spaces inside values
  (`All providers`); `build-aihw.js` handles both.
- Columns: `FinancialYear, GeographicAreaType (PHN|SA4), GeographicAreaCode, phnname,
  ProviderType, Measure, Value`. Years 2015–16 to 2024–25.

### Logic (`src/build-aihw.js`)

Filter to `GeographicAreaType == PHN`, `ProviderType == "All providers"`, latest
`FinancialYear`. Average the 3 Greater-Melbourne PHNs (North Western Melbourne, Eastern
Melbourne, South Eastern Melbourne) and the 3 regional-Victoria PHNs (Gippsland, Murray,
Western Victoria), for both rate measures. If a configured PHN name is missing in a release,
the script errors (rather than averaging the wrong set).

Output `output/regional-access.json`:

```json
{ "financialYear": "2024–25", "source": "...", "metroPhns": [...], "regionalPhns": [...],
  "metrics": {
    "serviceRatePer1000": { "metro": 569, "regional": 458, "gapPct": -19.6 },
    "patientRatePer1000": { "metro": 111, "regional": 107, "gapPct": -3.9 } } }
```

Both measures are output; the team picks which the onboarding screen shows. **Service rate**
= services delivered per 1,000 people (access + need mixed); **patient rate** = share of
people who saw someone. The service-rate gap is the larger, more striking figure; the
patient-rate gap is smaller but a cleaner "did people get in the door" measure.

### Run

Needs the PostgreSQL database reachable via `DATABASE_URL` (see
`../backend/.env.example`).

```
npm install
npm run build:aihw
python ../backend/build_aihw_db.py
```

Writes `output/regional-access.json` (a local build artifact — git-ignored, not
the served copy), then upserts both rate measures into the `regional_access`
table (one row per financial year + metric). `GET /api/v1/regional-access` reads
the latest financial year from that table at request time and shapes it back into
`{ financialYear, source, sourceUrl, metrics: { serviceRatePer1000: {…}, patientRatePer1000: {…} } }`.
There is no runtime AIHW fetch — a new release is picked up by dropping the new
ZIP in `input/` and re-running the two commands above.

## GBIF — species dex (Epic 8 / US8)

**Source:** GBIF (Global Biodiversity Information Facility) occurrence records, queried live —
<https://api.gbif.org/v1/>, no key needed. Not a downloadable file like the other three
pipelines; `build-gbif.js` calls the API directly and is itself the "raw → clean" step.
**Licence:** occurrence images are CC-licensed per record (mostly CC BY-NC 4.0, some CC BY 4.0 /
CC0), fetched with `license=` filters so every stored image is one of those three. **CC BY-NC
means attribution required, no commercial use** — record this in the DMP; the app must credit
the photographer/iNaturalist, not treat these as unrestricted stock images.

### Species list

61 species across the 4 mammal orders that make up Australia's characteristic fauna —
Monotremata (platypus, echidna), Diprotodontia (kangaroos/wallabies, koala, wombats, possums,
gliders, potoroos/bettongs), Dasyuromorphia (quolls, dunnarts, antechinus, Tasmanian devil,
numbat), Peramelemorphia (bandicoots, bilby). Deliberately excludes bats, rodents, marine
mammals, and introduced species (foxes, rabbits, camels, etc.) as not "distinctively
Australian."

The list is hard-coded as reviewable config at the top of `build-gbif.js` (same pattern as
`METRO_PHNS`/`REGIONAL_PHNS` in `build-aihw.js`), not derived from a live query — GBIF
occurrence counts drift day to day, so a live "≥20 occurrences" filter would silently change
the dex contents on every rebuild. The list was drawn from a wider 68-species candidate set,
narrowed by two live checks in September 2026:

- **7 species cut for thin data**: fewer than 20 AU occurrence records with images
  (*Potorous longipes*, *Petaurus gracilis*, *Dasyuroides byrnei*, *Antechinomys laniger*,
  *Dasycercus cristicauda*, *Perameles bougainville*, plus the woylie case below).
- **1 species cut for a real taxonomic problem, not a data bug**: *Bettongia penicillata*
  cleared the occurrence-count bar, but both GBIF's `iucnRedListCategory` endpoint and Wikidata
  (property P141) class it `EXTINCT`. This is not a GBIF matching error — the name now refers
  to the extinct south-eastern population after a taxonomic split; the living woylie population
  is *Bettongia ogilbyi*, which GBIF's backbone taxonomy doesn't yet resolve to species rank
  (`species/match` only reaches genus). Rather than guess at a replacement name, the species is
  excluded outright — see the comment above `SPECIES` in `build-gbif.js`.

### Logic (`src/build-gbif.js`)

Per species, sequentially (not in parallel — GBIF sheds load hard under concurrent requests
from one client; measured ~50% of requests returning 503 at just 5 concurrent calls to the same
endpoint, so every call here runs one at a time with a short delay between):

1. `GET /v1/species/match?name=` — resolve the accepted taxon (`usageKey`); errors out if the
   match isn't `EXACT`, rather than silently taking a fuzzy match.
2. `GET /v1/species/{key}/vernacularNames` — pick the English common name. GBIF returns a dozen+
   names per species from different source catalogues, with real noise (the koala's list
   includes "Monkey Bear" and "Bear of Australia"); taking whichever name recurs most often
   (case-insensitive) gave the standard name in every spot-check. `COMMON_NAME_OVERRIDES` in the
   script is the escape hatch for the rare case that heuristic picks something odd.
3. `GET /v1/species/{key}/iucnRedListCategory` — conservation status, `null` if GBIF has no
   linkage (that's a valid outcome, not an error). A result of `EXTINCT` fails the whole run —
   see the woylie case above.
4. **Images: `MANUAL_IMAGE_PICKS[scientificName]` if present, else `pickImages()`.** Every one
   of the 61 species currently has a manual entry, so `pickImages()` (the automated fallback,
   described below) does not actually run for any species today — but it's kept for whatever
   species gets added next, before it has a curated pick.

   **Why manual picks are the primary path, not automated ranking.** Earlier versions of this
   script tried to rank GBIF/iNaturalist occurrence photos automatically — license filtering,
   blocking known camera-trap/roadkill iNaturalist projects, preferring newest submissions —
   and each fix solved the cases it targeted while missing others: an empty burrow-entrance
   photo, a security-camera capture, even one occurrence that turned out to be a screenshot of a
   phone's Photos app rather than a wildlife photo at all. After three rebuild-and-re-review
   cycles this way, a person instead looked at up to 18 candidates per species (license- and
   project-filtered, same as `pickImages()` uses) side by side and picked exactly 3, in order —
   see `MANUAL_IMAGE_PICKS`. That review is why `EXCLUDED_OCCURRENCE_KEYS` below has as many
   entries as it does: most came from that pass, not from spot-checks during development.

   **`pickImages()` (automated fallback, used only for a species with no manual entry yet)**:
   `GET /v1/occurrence/search?...&mediaType=StillImage&license=CC0_1_0|CC_BY_4_0|CC_BY_NC_4_0`,
   then:
   - Each candidate photo's own license is re-checked against the same 3-license allow-list
     before it can be picked — the `license=` query param filters on the *occurrence's*
     record-level license, which isn't always the same as the individual photo's license
     (found live: this let 3 CC-BY-ND / CC-BY-NC-ND photos through the query filter alone).
   - Occurrences tagged to certain iNaturalist projects are skipped outright
     (`BLOCKED_PROJECT_KEYWORDS`): unattended trail/camera-trap projects (dark, out-of-focus,
     subject often absent or a few pixels large) and roadkill/dead-wildlife projects (wrong
     tone for a collectible dex regardless of image quality) — found by checking the
     `projectId` field on confirmed-bad auto-picked photos (e.g.
     `.../projects/trail-cameras-australia`).
   - `EXCLUDED_OCCURRENCE_KEYS` is a manual backstop for bad photos the project filter doesn't
     catch (no project tag at all).
   - Remaining candidates: prefer full-resolution iNaturalist originals over ALA's cropped
     proxy thumbnails, then newest occurrence first, for a stable, deterministic pick.
   - Fewer than 3 photos surviving all of the above fails the run rather than silently
     shipping 1–2.

   If a new species needs picks, generate its candidate pool the same way this review did (see
   "Picking images for a new species" under Run) rather than trusting `pickImages()`'s output
   unreviewed — it's a reasonable starting filter, not a quality guarantee.
5. `GET /v1/occurrence/search?...&limit=0` — total AU occurrence count, stored as
   `observationCount`: a rarity signal from real data the app can surface later. **Not** used to
   define any unlock rule — those stay tied to objective task-completion counts only.

Every GBIF call goes through one `fetchJson()` with a 30s timeout and up to 7 retries
(exponential backoff, capped at 15s) — both plain 503s and outright connection failures were
observed while building this script, so the retry has to survive more than a single blip.

Output `output/species.json`:

```json
{ "generatedAt": "...", "source": "GBIF ...", "speciesCount": 61,
  "species": [
    { "scientificName": "Phascolarctos cinereus", "commonName": "Koala", "order": "Diprotodontia",
      "gbifUsageKey": 2440012, "iucnStatus": "VULNERABLE", "observationCount": 30298,
      "sourceUrl": "https://www.gbif.org/species/2440012",
      "images": [ { "url": "...", "license": "...", "occurrenceKey": 123 }, ... ] } ] }
```

### Run

Needs the PostgreSQL database reachable via `DATABASE_URL` (see `../backend/.env.example`). No
input file to download — this pipeline is a live API pull. With every species covered by
`MANUAL_IMAGE_PICKS`, a run only needs 4 quick calls per species (no image search), so it takes
under a minute; before that it took ≈15-20 minutes (the occurrence-image search was consistently
the slowest, flakiest call).

```
npm install
npm run build:gbif
python ../backend/build_species_db.py
```

Writes `output/species.json` (git-ignored build artifact), then upserts 61 rows into `species`
and 183 rows (3 per species) into `species_images`. Re-run either command any time — both
upsert, so a re-run refreshes common names/status/observation counts without duplicating rows
(images stay whatever `MANUAL_IMAGE_PICKS` says, regardless of rebuild).

### Picking images for a new species

If a species is ever added to the `SPECIES` list without a `MANUAL_IMAGE_PICKS` entry,
`pickImages()`'s automated ranking runs for it — treat that output as a draft, not a final
answer (see the "why manual picks" note above; every automated heuristic tried here missed some
category of bad photo). To pick properly:

1. Temporarily raise `IMAGES_PER_SPECIES` (or query `pickImages()`'s candidate list directly)
   to pull ~15-18 license/project-filtered candidates for the new species instead of just 3.
2. Look at them side by side and choose exactly 3, in order — a plain image grid is enough, no
   tooling required for one species.
3. Add the result to `MANUAL_IMAGE_PICKS` as `{ url, license, occurrenceKey }` × 3, matching the
   existing entries' shape, and re-run.

For a bigger batch (many species at once, or a full re-review), it's worth building a small
throwaway review page instead of eyeballing raw JSON — that's how the current 61 entries in
`MANUAL_IMAGE_PICKS` were chosen. Not part of the committed pipeline since it's a one-time
authoring aid, not something that runs again after the picks exist.

## Jamendo — background-music playlist (Epic 6 / US6)

**Source:** Jamendo API, queried live — <https://api.jamendo.com/v3.0/>. Like GBIF, not a
downloadable file; `build-jamendo.js` calls the API directly. **Licence:** Jamendo's entire
catalogue is Creative Commons by platform design, so (unlike GBIF) there is no license
allow-list to enforce here — every track requires at least attribution. What varies per track
is NC (non-commercial only) / ND (no derivatives) / SA (share-alike); the loader stores all
three flags so the app can show correct attribution text. NC/ND/SA don't affect *whether* a
track can be used here, since the player streams tracks unmodified for a non-commercial student
project — they only affect what attribution/reuse terms to display.

Needs a `JAMENDO_CLIENT_ID` — a free, public app identifier (not a secret, but still kept in
`.env` rather than hard-coded, matching `DATABASE_URL`'s convention). Get one at
<https://devportal.jamendo.com/> (register an application, plan "Read only", no client_secret
needed for these read-only GET calls).

### Logic (`src/build-jamendo.js`)

An unfiltered query returns genres unsuitable for a calm-down tool (metal, hardcore — found
live testing this API), so the script queries 3 fixed calming tags — `chillout`, `lounge`,
`solopiano` — at `limit=30` each, ordered by `popularity_total`, and dedupes by track ID (a
track can carry more than one of the 3 tags). Waits 1s between the 3 requests: Jamendo
rate-limits bursts from one client, returning a `"status": "success"` response with 0 results
rather than an error — confirmed live by retrying the identical request after a short pause, so
the script treats an unexpected 0-result response as a hard failure (likely rate-limited) rather
than "no tracks matched."

**`ambient` was tried first and dropped (2026-09-13)** — the tag name doesn't reliably predict
the track's actual energy on Jamendo; a user testing the shuffled playlist flagged one track as
jarringly upbeat, and checking its tags showed it was literally titled "(Trance remix by ...)".
A full audit of the `ambient`-tagged pool at the time found a trance remix, a dance/pop track,
and two drum-n-bass tracks all carrying the `ambient` tag — the tag describes a passage in the
track, not its overall character. `solopiano` was checked live as a replacement (50-track sample:
dominated by `classical`/`newage`/`filmscore`/`neoclassical`, no dance/trance/drumnbass hits) and
swapped in. A handful of `chillout`/`lounge` tracks still carried a `hiphop`/`breakbeat`/
`drumnbass` tag alongside their calming one (mostly lo-fi hip-hop, milder than the `ambient`
outliers but the same root problem) — rather than judge those case by case, **`EXCLUDED_GENRES`**
drops any track carrying `dance`/`trance`/`breakbeat`/`drumnbass`/`idm`/`hiphop` in its `genres`
array, regardless of which calming tag matched it. This runs per-track during collection, not as
a separate pass — see the "excluded" count in each tag's console line.

Because a category can be swapped out (or genre filtering tightened) like this, `build_tracks_db.py`
(see Run, below) does a full sync — delete-then-upsert — not an append-only upsert, or a dropped
track's row would linger in the table forever.

Output `output/tracks.json`, ~70 tracks after dedup and filtering:

```json
{ "generatedAt": "...", "source": "Jamendo API ...", "calmingTags": ["chillout","lounge","solopiano"],
  "trackCount": 71,
  "tracks": [
    { "jamendoId": "946", "name": "Emptiness", "artistName": "Alexander Blu",
      "albumImageUrl": "...", "audioUrl": "...", "durationSeconds": 241,
      "licenseUrl": "http://creativecommons.org/licenses/by-nc/3.0/",
      "licenseNonCommercial": true, "licenseNoDerivatives": false, "licenseShareAlike": false,
      "genres": ["downtempo","electronic","chillout"], "matchedTag": "chillout",
      "shareUrl": "..." } ] }
```

Only the audio/artwork URLs are stored, not the audio bytes — playback streams live from
Jamendo's CDN at request time, so "which track to serve" still comes from a live Postgres
query, satisfying the hosted-DB-at-runtime constraint the same way Epic 8's images do.

### Run

Needs the PostgreSQL database reachable via `DATABASE_URL` (see `../backend/.env.example`) and
a `JAMENDO_CLIENT_ID` in `data-pipeline/.env` (copy `.env.example` and fill in). No input file
to download — this is a live API pull, ~3 requests total, done in a few seconds.

```
npm install
npm run build:jamendo
python ../backend/build_tracks_db.py
```

Writes `output/tracks.json` (git-ignored build artifact), then syncs the `tracks` table to match
it exactly (upsert + delete stale rows, see the `ambient` → `solopiano` note above for why the
delete step matters). Re-run either command any time.
