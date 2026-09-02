"""Load regional-access.json (produced by data-pipeline/src/build-aihw.js) into the
`regional_access` table, so GET /api/v1/regional-access serves the Epic 4 / US4
onboarding snapshot from the hosted database instead of a committed JSON file.

Re-runnable at any time: upserts on (financial_year, metric). AIHW publishes this
annually — drop the new ZIP in data-pipeline/input/, re-run build:aihw, then this.

    python build_aihw_db.py
"""

from __future__ import annotations

import json
from pathlib import Path

import psycopg

from db import DATABASE_URL, init_schema

BASE_DIR = Path(__file__).resolve().parent
SOURCE_JSON = BASE_DIR.parent / "data-pipeline" / "output" / "regional-access.json"

UPSERT = """
INSERT INTO regional_access (financial_year, metric, metro, regional, gap_pct, source, source_url)
VALUES (%(financial_year)s, %(metric)s, %(metro)s, %(regional)s, %(gap_pct)s, %(source)s, %(source_url)s)
ON CONFLICT (financial_year, metric) DO UPDATE SET
    metro = EXCLUDED.metro,
    regional = EXCLUDED.regional,
    gap_pct = EXCLUDED.gap_pct,
    source = EXCLUDED.source,
    source_url = EXCLUDED.source_url
"""


def main() -> None:
    data = json.loads(SOURCE_JSON.read_text(encoding="utf-8"))
    rows = [
        {
            "financial_year": data["financialYear"],
            "metric": metric,
            "metro": values["metro"],
            "regional": values["regional"],
            "gap_pct": values.get("gapPct"),
            "source": data["source"],
            "source_url": data.get("sourceUrl"),
        }
        for metric, values in data["metrics"].items()
    ]

    init_schema()
    with psycopg.connect(DATABASE_URL) as connection:
        with connection.cursor() as cursor:
            cursor.executemany(UPSERT, rows)
        connection.commit()
        count = connection.execute("SELECT COUNT(*) FROM regional_access").fetchone()[0]
        print(f"Upserted {len(rows)} rows; regional_access table now holds {count} rows")


if __name__ == "__main__":
    main()
