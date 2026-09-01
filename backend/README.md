# Curbi backend

Node.js/Fastify service for the Epic 4 regional access snapshot.

```sh
cd backend
npm install
npm start
```

The server listens on `http://localhost:3000` by default and exposes:

- `GET /api/regional-access` — last validated regional access dataset
- `GET /api/regional-access/status` — latest update-pipeline status

On startup it checks AIHW immediately, then re-checks on the configured interval. The backend uses the official AIHW search endpoint to find the newest Medicare mental health ZIP, downloads it, runs the canonical ETL in `../data-pipeline/src/build-aihw.js`, validates the output, and only then replaces the served dataset.

Install the data-pipeline dependencies before an annual update:

```sh
cd ../data-pipeline
npm install
```

Existing ZIPs are moved out of the input directory while a refresh is running. On success they are archived under `data-pipeline/input/archive/`; on failure they and the previous JSON are restored. API requests continue using the last validated in-memory data while an update is running.
