# Curbi data pipeline

Offline scripts that turn open datasets into static files bundled into the Curbi web app
(`Curbi/public/data/`). Run manually on a developer machine; nothing here is deployed.

## NHSD — nearby mental health services (Epic 2 / US2)

**Source:** Healthdirect – NHSD – Services Directory 2025
data.gov.au record: <https://data.gov.au/data/en/dataset/healthdirect_nhsd_services_directory_2025>
Actual file: AURIN (`data.aurin.org.au`), requires an Australian-university (institutional)
login to download. Snapshot: point-in-time extract **as at June 2025** — a static extract,
not a live API. Listings are frozen at June 2025 until a refreshed bundle ships; surface an
"information as of June 2025" note in the UI.

**Licence:** _TODO — copy from the AURIN dataset page._

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
   - Rare false positives: in the current VIC output, 2 of 2,698 records
     ("Nutritional Psychology", "Rural Financial Counselling Service"). ~0.07%.
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
Not filtered on `status`. De-duplicated on `nhsd_service_id`. Sorted by name.

Output record: `{ id, name, address, suburb, postcode, state, lat, lon, hours? }`
where `hours` is an object with only the populated days (`mon`..`sun`), omitted if none.

### Run

```
npm install
npm run build:nhsd
```

Writes `../Curbi/public/data/nhsd-services.json` if the Curbi app scaffold is on this branch,
otherwise `output/nhsd-services.json` (a review preview — canonical home is
`Curbi/public/data/` once US1 is merged).

Current VIC output: **2,698 services, ~912 KB** (gzips small; static, loaded once).
