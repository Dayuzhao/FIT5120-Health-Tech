# Curbi

Curbi is a self-help web app for people who experience health anxiety and
compulsive symptom-checking. It helps a user pause a checking urge and redirect
it into a short coping task, points them to nearby mental health services, and
shows a one-off snapshot of how service access differs across Victoria.

FIT5120 Industry Experience project — Team Health-Tech.

## Repository layout

| Path | What it is | Stack |
|---|---|---|
| `Curbi/` | The web app the user sees | Vue 3 + Vite, plain JS, `vue-router`, Dexie (on-device IndexedDB) |
| `backend/` | Read-only JSON API over the open datasets | FastAPI, `psycopg` connection pool |
| `data-pipeline/` | Offline scripts that clean the open datasets and load them into the database | Node (ETL) + Python (loaders) |

## How the pieces fit together

```
open data source file  ──►  data-pipeline/src/build-*.js   (offline clean/aggregate, on a dev machine)
                                     │  writes data-pipeline/output/*.json  (build artifact, git-ignored)
                                     ▼
                            backend/build_*_db.py           (loader, upserts into the database)
                                     ▼
                    AWS RDS PostgreSQL   tables: services, postcodes, regional_access
                                     ▲
                            backend/main.py (FastAPI)        reads the tables live per request
                                     │  GET /api/v1/...
                                     ▼
                            Curbi/src/services/*.js  ──►  the Vue views
```

Two rules shape this design:

- **No processed data is hard-coded into the app.** Every data-driven response is
  a live read from the hosted relational database. Cleaning the datasets offline
  is fine; shipping a cleaned JSON file inside the build is not.
- **Personal data never leaves the device.** A user's coping tasks, checking-urge
  events and task completions live only in the browser (Dexie / IndexedDB). The
  server stores and serves open public data only, and never receives anything a
  user enters about themselves.

## Open datasets

| Dataset | Used for | Licence |
|---|---|---|
| Healthdirect NHSD – Services Directory 2025 (via AURIN) | Nearby mental health services (Epic 2) | AURIN click-through agreement — academic use; redistribution to confirm |
| Australian Postcodes (Matthew Proctor) | Suburb / postcode → coordinate for the Help Finder | CC BY 4.0 |
| AIHW – Medicare mental health services, annual PHN data tables | Regional-vs-metro access snapshot (Epic 4) | AIHW open (CC BY) |

Details, wrangling steps and caveats: `data-pipeline/README.md`. Governance,
storage design and ethics are covered in the Data Management Plan, kept with the
team's submission documents outside this repo.

## Quick start (local)

### 1. Database

The backend needs a PostgreSQL database. For local development, the simplest is
Docker:

```sh
docker run -d --name curbi-pg \
  -e POSTGRES_USER=curbi -e POSTGRES_PASSWORD=curbi -e POSTGRES_DB=curbi \
  -p 5432:5432 postgres:16
```

### 2. Backend

```sh
cd backend
python -m venv .venv && .venv/Scripts/activate      # Windows; use bin/activate on macOS/Linux
pip install -r requirements.txt
cp .env.example .env                                 # set DATABASE_URL if not the Docker default
uvicorn main:app --reload
```

The API is then on `http://localhost:8000` (`/health`, `/api/v1/services`,
`/api/v1/geocode`, `/api/v1/regional-access`).

### 3. Load data

The tables are created automatically on startup but are empty. Put the raw source
files in `data-pipeline/input/` (see `data-pipeline/README.md`), then:

```sh
cd data-pipeline && npm install
npm run build:nhsd      && python ../backend/build_nhsd_db.py
npm run build:postcodes && python ../backend/build_postcodes_db.py
npm run build:aihw      && python ../backend/build_aihw_db.py
```

Each loader upserts, so re-running it after a fresh source file updates the
database in place.

### 4. Frontend

```sh
cd Curbi
npm install
npm run dev            # http://localhost:5173
```

`Curbi/.env.example` documents `VITE_API_BASE_URL` — leave it for local dev; set
it to the deployed backend URL at build time for production.

## Deployment notes

- **Database:** AWS RDS PostgreSQL (`curbi-db`, `ap-southeast-2`). `DATABASE_URL`
  is supplied to the backend as an environment variable, never committed.
- **Backend on AWS:** run it in the same VPC as the RDS instance and allow it
  through the database security group by security-group reference (not by IP);
  the RDS instance can then have public access turned off.
- **Frontend:** static build (`npm run build` in `Curbi/`) with
  `VITE_API_BASE_URL` pointing at the deployed backend.
