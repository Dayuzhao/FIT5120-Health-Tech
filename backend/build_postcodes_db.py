"""Load vic-postcodes.json (produced by data-pipeline/src/build-postcodes.js) into
the `postcodes` table, so /api/v1/geocode resolves a typed suburb or postcode with
a database query instead of fetching a flat file at request time.

Re-runnable at any time: upserts on (postcode, suburb).

    python build_postcodes_db.py
"""

from __future__ import annotations

import json
from pathlib import Path

import psycopg

from db import DATABASE_URL, init_schema

BASE_DIR = Path(__file__).resolve().parent
SOURCE_JSON = BASE_DIR.parent / "data-pipeline" / "output" / "vic-postcodes.json"

UPSERT = """
INSERT INTO postcodes (postcode, suburb, lat, lon)
VALUES (%(postcode)s, %(suburb)s, %(lat)s, %(lon)s)
ON CONFLICT (postcode, suburb) DO UPDATE SET
    lat = EXCLUDED.lat,
    lon = EXCLUDED.lon
"""


def main() -> None:
    entries = json.loads(SOURCE_JSON.read_text(encoding="utf-8"))
    init_schema()

    with psycopg.connect(DATABASE_URL) as connection:
        with connection.cursor() as cursor:
            cursor.executemany(
                UPSERT,
                [
                    {
                        "postcode": entry["postcode"],
                        "suburb": entry["suburb"],
                        "lat": entry["lat"],
                        "lon": entry["lon"],
                    }
                    for entry in entries
                ],
            )
        connection.commit()
        count = connection.execute("SELECT COUNT(*) FROM postcodes").fetchone()[0]
        print(f"Upserted {len(entries)} entries; postcodes table now holds {count} rows")


if __name__ == "__main__":
    main()
