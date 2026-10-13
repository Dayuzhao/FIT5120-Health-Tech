# Curbi — web app

The Vue 3 front end for Curbi. See the repository root `README.md` for the
project overview and how the front end, backend and data pipeline fit together.

## What's here

- **Routing** (`src/router/index.js`) — the onboarding snapshot at `/`, then the
  main flow: `/home`, `/urge`, `/task`, `/complete`, plus `/help` (Help Finder),
  `/about`, `/contact`.
- **On-device store** (`src/db/`) — a Dexie (IndexedDB) database holding the
  user's coping tasks, checking-urge events and task completions. This never
  leaves the browser and is never sent to the backend.
- **Backend services** (`src/services/`) — thin `fetch` wrappers over the API:
  - `helpFinder.js` — geocode a typed suburb/postcode, then list nearby mental
    health services by distance (`/api/v1/geocode`, `/api/v1/services`).
  - `regionalAccess.js` — the onboarding regional-vs-metro access snapshot
    (`/api/v1/regional-access`).

## Backend dependency

The data-driven views expect the FastAPI backend (see `../backend`) to be
running. `VITE_API_BASE_URL` sets its base URL:

- local dev: leave unset — defaults to `http://localhost:8000`
- production: set it at build time to the deployed backend URL

Copy `.env.example` to `.env.local` to override locally.

## Try the companion locally

Start the companion-only backend in one terminal from the repository root. This
local mode serves the chatbot without requiring PostgreSQL:

```powershell
Set-Location backend
python -m pip install -r requirements.txt
python -m uvicorn companion.local_app:app --reload
```

Set `GEMINI_API_KEY` in `backend/.env`; `GEMINI_COMPANION_MODEL` defaults to
`gemini-3.1-flash-lite`. In a second terminal, start the frontend from the `Curbi`
directory:

```powershell
Set-Location Curbi
npm install
npm run dev
```

Open the local URL printed by Vite. Click Curbi to open chat, then expand **Your
companion** to choose a personality or select **Make it yours** to enter a custom
style. Your choice is stored in that browser; Curbi's safety boundaries remain
fixed.
Other app features that read open data still require the full backend (`main:app`)
and a reachable PostgreSQL database configured by `DATABASE_URL`.

## Setup

```sh
npm install
npm run dev       # http://localhost:5173, hot reload
npm run build     # production build into dist/
npm run preview   # serve the production build locally
npm run format    # Prettier over src/
```

## Recommended IDE setup

[VS Code](https://code.visualstudio.com/) +
[Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar)
(disable Vetur). Config reference: [Vite](https://vite.dev/config/).
