"""Import nhsd-services.json (produced by data-pipeline/src/build-nhsd.js) into
a local SQLite database, so /api/v1/services can query it instead of the
frontend fetching a static bundled JSON file.

Rerun this after a new NHSD snapshot is built:
    python build_nhsd_db.py
"""

from __future__ import annotations

import json
import sqlite3
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
SOURCE_JSON = BASE_DIR.parent / "data-pipeline" / "output" / "nhsd-services.json"
DB_FILE = BASE_DIR / "data" / "nhsd.sqlite3"

SCHEMA = """
CREATE TABLE IF NOT EXISTS services (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT,
    suburb TEXT NOT NULL,
    postcode TEXT NOT NULL,
    state TEXT NOT NULL,
    lat REAL NOT NULL,
    lon REAL NOT NULL,
    hours_json TEXT
);
CREATE INDEX IF NOT EXISTS idx_services_suburb ON services (suburb);
CREATE INDEX IF NOT EXISTS idx_services_postcode ON services (postcode);
"""


def main() -> None:
    services = json.loads(SOURCE_JSON.read_text(encoding="utf-8"))

    DB_FILE.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(DB_FILE)
    try:
        connection.executescript(SCHEMA)
        connection.execute("DELETE FROM services")
        connection.executemany(
            """
            INSERT INTO services (id, name, address, suburb, postcode, state, lat, lon, hours_json)
            VALUES (:id, :name, :address, :suburb, :postcode, :state, :lat, :lon, :hours_json)
            """,
            (
                {
                    "id": service["id"],
                    "name": service["name"],
                    "address": service.get("address", ""),
                    "suburb": service["suburb"],
                    "postcode": service["postcode"],
                    "state": service["state"],
                    "lat": service["lat"],
                    "lon": service["lon"],
                    "hours_json": json.dumps(service["hours"]) if service.get("hours") else None,
                }
                for service in services
            ),
        )
        connection.commit()
        count = connection.execute("SELECT COUNT(*) FROM services").fetchone()[0]
        print(f"Imported {count} services into {DB_FILE}")
    finally:
        connection.close()


if __name__ == "__main__":
    main()
