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

Every data endpoint is now a pure database read: `GET /api/v1/services` queries
the `services` table, `GET /api/v1/geocode` the `postcodes` table, and
`GET /api/v1/regional-access` the `regional_access` table. Nothing fetches or
parses a source at request time — the old `postcodeapi.com.au` call, the runtime
fetch of the Australian Postcodes file, and the AIHW auto-refresh job are all
gone.

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
