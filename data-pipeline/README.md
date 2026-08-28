# Curbi data pipeline

Offline scripts that turn open datasets into static files bundled into the Curbi web app
(`Curbi/public/data/`). Run manually on a developer machine; nothing here is deployed.

## NHSD — nearby mental health services (Epic 2 / US2)

**Source:** Healthdirect – NHSD – Services Directory 2025, data.gov.au
<https://data.gov.au/data/en/dataset/healthdirect_nhsd_services_directory_2025>

Snapshot: a point-in-time extract as at **June 2025** (this data.gov.au resource is a static
extract, not a live API). Known staleness risk — listings are frozen at June 2025 until a
refreshed bundle is shipped with an app update. Surface an "information as of June 2025" note
in the UI.

**Licence:** _TODO — copy from the dataset page (expected CC BY 4.0)._

### Steps

1. Download the data file(s) from the dataset page into `input/` (git-ignored).
2. Record below: file name(s), format, size, and the column headers.
3. `npm run build:nhsd` — reads `input/`, filters to mental-health service types within the
   agreed geographic scope, keeps only the fields the app needs, drops rows with no
   coordinates, de-duplicates, and writes `../Curbi/public/data/nhsd-services.json`.

### Raw file notes

_TODO after download — file name(s), format (CSV/GeoJSON/…), size, row count, column list._

### Filter decisions (confirm with the team)

- **Mental-health service types to keep:** TODO — inspect the dataset's service-type / category
  field and list the exact values (e.g. psychology, clinical psychology, psychiatry, community
  mental health, counselling, headspace).
- **Geographic scope:** TODO — all Australia / Victoria only / Greater Melbourne only.
- **Output fields:** name, service type, full address, suburb, postcode, state, latitude,
  longitude, phone.
