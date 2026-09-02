# Curbi backend

A small FastAPI service that reads the open datasets from a PostgreSQL database
and serves them to the Curbi front end. It holds no personal data and does no
writes at request time — the tables are populated by the loader scripts here from
the offline ETL output in `../data-pipeline`.

## Setup

```sh
python -m venv .venv
.venv/Scripts/activate            # Windows;  source .venv/bin/activate  on macOS/Linux
pip install -r requirements.txt
cp .env.example .env              # set DATABASE_URL
uvicorn main:app --reload
```

`DATABASE_URL` is the only configuration. Locally it points at a Docker Postgres
(see the root `README.md`); in deployment it is the AWS RDS endpoint, passed as an
environment variable and never committed. `.env` is git-ignored.

On startup the app opens a `psycopg` connection pool and runs
`CREATE TABLE IF NOT EXISTS` for all three tables, so a fresh database just works
(empty until the loaders run).

## Files

| File | Purpose |
|---|---|
| `main.py` | FastAPI app and endpoints |
| `db.py` | Connection pool, schema DDL, `init_schema()` |
| `build_nhsd_db.py` | Load `../data-pipeline/output/nhsd-services.json` → `services` |
| `build_postcodes_db.py` | Load `../data-pipeline/output/vic-postcodes.json` → `postcodes` |
| `build_aihw_db.py` | Load `../data-pipeline/output/regional-access.json` → `regional_access` |

Each loader upserts on the table's primary key, so it is safe to re-run whenever a
fresh source file is built. See `../data-pipeline/README.md` for the ETL step that
produces each JSON file.

## Endpoints

| Method + path | Returns |
|---|---|
| `GET /health` | `{"status": "ok"}` |
| `GET /api/v1/geocode?q=` | `{query, matches: [{suburb, postcode, lat, lon}]}` — resolves a typed suburb name or numeric postcode against the `postcodes` table |
| `GET /api/v1/services?near=lat:lon,...` | `{mode: "distance", results: [...]}` — up to 20 services ordered by haversine distance to the nearest given point |
| `GET /api/v1/services?suburb=&postcode=` | `{mode: "exact", results: [...]}` — services whose suburb or postcode matches |
| `GET /api/v1/regional-access` | `{financialYear, source, sourceUrl, metrics: {serviceRatePer1000: {...}, patientRatePer1000: {...}}}` — the latest financial year from `regional_access` |

`distance_km` on each service result is computed per request (it depends on the
user's location); everything else is stored as loaded.

## Tables

- **`services`** — `id` PK, name, address, suburb, postcode, state, lat, lon,
  `hours` (JSONB). ~1,300 Victorian mental health services.
- **`postcodes`** — `(postcode, suburb)` PK, lat, lon. Victorian delivery areas.
- **`regional_access`** — `(financial_year, metric)` PK, metro, regional,
  `gap_pct`, source, source_url. Two rows per AIHW release.

## Deployment

Run in the same VPC as the RDS instance. Allow the backend through the database
security group by security-group reference, so the RDS instance itself does not
need public access. Set `DATABASE_URL` as an environment variable on the host.
