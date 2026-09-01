# Curbi data pipeline

Offline scripts that turn open datasets into files served by the backend (`output/`,
imported into SQLite or read directly by the FastAPI app in `../backend`). Nothing
here is bundled into the frontend build and nothing here is deployed — run manually
on a developer machine, then re-run the relevant backend import step.

| Script | Story | Output | Refresh |
|---|---|---|---|
| `npm run build:nhsd` | Epic 2 / US2 | `output/nhsd-services.json` → import with `python ../backend/build_nhsd_db.py` | when a new NHSD snapshot ships |
| `npm run build:aihw` | Epic 4 / US4 | `output/regional-access.json` (served by backend) | annual (AIHW release ~May) |

**Postcode/suburb lookup (Epic 2 / US2) is no longer built here.** It used to be a
static `vic-postcodes.json` bundled into the frontend; it's now served live by the
backend's `GET /api/v1/geocode` (numeric postcode → `postcodeapi.com.au`, suburb name
→ an in-memory cache refreshed daily from the live Australian Postcodes feed — see
`refresh_vic_postcode_cache()` in `../backend/main.py`). This closes the "data can't
be hard-coded, must come from an API or database" requirement for both Epic 2 data
sources: NHSD services now live in SQLite behind `/api/v1/services`, and postcode
lookups are resolved live rather than from a file shipped in the app bundle.

## NHSD — nearby mental health services (Epic 2 / US2)

**Source:** Healthdirect – NHSD – Services Directory 2025
data.gov.au record: <https://data.gov.au/data/en/dataset/healthdirect_nhsd_services_directory_2025>
Actual file: AURIN (`data.aurin.org.au`), requires an Australian-university (institutional)
login to download. Snapshot: point-in-time extract **as at June 2025** — a static extract,
not a live API. Listings are frozen at June 2025 until a refreshed bundle ships; surface an
"information as of June 2025" note in the UI.

**Licence:** NOT a plain open licence. AURIN gates it behind two click-through agreements you
must sign in when logged in: an **"Academic Confirmation"** and a specific **"NHSD"** data
agreement (PDF on the dataset page). **Action for the team:** read the NHSD agreement PDF and
confirm whether bundling a filtered subset into a publicly-deployed app is permitted, or
whether redistribution is restricted to academic use — this decides whether
`nhsd-services.json` can ship in the public build. Record the outcome in the Data Management
Plan (Ethical / Legal / Privacy section).

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
   practitioners); they still carry suburb + coordinates.

### Filter logic (`src/build-nhsd.js`)

Keep a row when: `state == "VIC"` **and** the name matches the mental-health regex **and**
`latitude`/`longitude` are finite numbers inside a loose Victoria bounding box.
Not filtered on `status`. De-duplicated on `name|address|suburb` (NHSD assigns a distinct
`nhsd_service_id` to repeat rows for the same organisation at the same address, so the id
itself doesn't dedupe them). Sorted by name.

Output record: `{ id, name, address, suburb, postcode, state, lat, lon, hours? }`
where `hours` is an object with only the populated days (`mon`..`sun`), omitted if none.

### Run

```
npm install
npm run build:nhsd
python ../backend/build_nhsd_db.py
```

Writes `output/nhsd-services.json`, then imports it into `../backend/data/nhsd.sqlite3`,
which `GET /api/v1/services` (suburb/postcode exact match, or `near=lat:lon,...` for
distance-sorted nearby results) queries at request time.

Current VIC output: **1,308 services, ~442 KB** (small; queried via SQLite, not shipped
to the browser).

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

```
npm install
npm run build:aihw
```

### Backend hand-off

`output/regional-access.json` is consumed by the backend, served at `GET /api/regional-access`.
The backend owner wires the schedule (annual) and the endpoint; this script is the ETL step.
