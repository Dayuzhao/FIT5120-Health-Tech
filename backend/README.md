# Curbi backend

Fastify service for the Epic 4 regional access snapshot.

```sh
cd backend
npm install
npm start
```

The server listens on `http://localhost:3000` by default and exposes:

- `GET /api/regional-access` — last validated regional access dataset.
- `GET /api/regional-access/status` — latest update-pipeline status.

On startup it checks AIHW immediately, then checks seven days after each run.
`AIHW_CHECK_INTERVAL_MS` can override the interval. Discovery uses the same
official paginated JSON endpoint as AIHW's data-table page; it does not hard-code
the annual `getmedia` GUID. When a newer financial year exists, the backend
downloads the ZIP, invokes the unchanged `data-pipeline/src/build-aihw.js`,
validates its output, and only then replaces the in-memory API dataset.

Install `data-pipeline` dependencies too before an actual annual update:

```sh
cd ../data-pipeline
npm install
```

Existing input ZIPs are moved out of the builder's search path while it runs.
On success they are retained under `data-pipeline/input/archive/`; on failure
they and the previous JSON are restored. API requests continue using the last
validated in-memory data while an update is running.
