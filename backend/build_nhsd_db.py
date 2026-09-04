"""Load nhsd-services.json (produced by data-pipeline/src/build-nhsd.js) into the
`services` table of the hosted PostgreSQL database, so /api/v1/services queries it
in real time instead of the app shipping a static JSON file.

Re-runnable at any time: it upserts on the primary key, so a refreshed NHSD
snapshot updates changed rows and adds new ones without dropping the table.

    python build_nhsd_db.py
"""

from __future__ import annotations

import json
from pathlib import Path

import psycopg
from psycopg.types.json import Jsonb

from db import DATABASE_URL, init_schema

BASE_DIR = Path(__file__).resolve().parent
SOURCE_JSON = BASE_DIR.parent / "data-pipeline" / "output" / "nhsd-services.json"

UPSERT = """
INSERT INTO services (id, name, address, suburb, postcode, state, lat, lon, hours)
VALUES (%(id)s, %(name)s, %(address)s, %(suburb)s, %(postcode)s, %(state)s,
        %(lat)s, %(lon)s, %(hours)s)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    address = EXCLUDED.address,
    suburb = EXCLUDED.suburb,
    postcode = EXCLUDED.postcode,
    state = EXCLUDED.state,
    lat = EXCLUDED.lat,
    lon = EXCLUDED.lon,
    hours = EXCLUDED.hours
"""


def main() -> None:
    services = json.loads(SOURCE_JSON.read_text(encoding="utf-8"))
    init_schema()

    with psycopg.connect(DATABASE_URL) as connection:
        with connection.cursor() as cursor:
            cursor.executemany(
                UPSERT,
                [
                    {
                        "id": service["id"],
                        "name": service["name"],
                        "address": service.get("address", ""),
                        "suburb": service["suburb"],
                        "postcode": service["postcode"],
                        "state": service["state"],
                        "lat": service["lat"],
                        "lon": service["lon"],
                        "hours": Jsonb(service["hours"]) if service.get("hours") else None,
                    }
                    for service in services
                ],
            )
        connection.commit()
        count = connection.execute("SELECT COUNT(*) FROM services").fetchone()[0]
        print(f"Upserted {len(services)} records; services table now holds {count} rows")


if __name__ == "__main__":
    main()
