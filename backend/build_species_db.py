"""Load species.json (produced by data-pipeline/src/build-gbif.js) into the
`species` / `species_images` tables, so GET /api/v1/species (added by the
backend owner) serves the Epic 8 / US8 dex from the hosted database instead
of a committed JSON file.

Re-runnable at any time: upserts on scientific_name / (scientific_name, sort_order).

    python build_species_db.py
"""

from __future__ import annotations

import json
from pathlib import Path

import psycopg

from db import DATABASE_URL, init_schema

BASE_DIR = Path(__file__).resolve().parent
SOURCE_JSON = BASE_DIR.parent / "data-pipeline" / "output" / "species.json"

UPSERT_SPECIES = """
INSERT INTO species (
    scientific_name, common_name, taxon_order, gbif_usage_key,
    iucn_status, observation_count, source_url
)
VALUES (
    %(scientific_name)s, %(common_name)s, %(taxon_order)s, %(gbif_usage_key)s,
    %(iucn_status)s, %(observation_count)s, %(source_url)s
)
ON CONFLICT (scientific_name) DO UPDATE SET
    common_name = EXCLUDED.common_name,
    taxon_order = EXCLUDED.taxon_order,
    gbif_usage_key = EXCLUDED.gbif_usage_key,
    iucn_status = EXCLUDED.iucn_status,
    observation_count = EXCLUDED.observation_count,
    source_url = EXCLUDED.source_url
"""

UPSERT_IMAGE = """
INSERT INTO species_images (scientific_name, sort_order, image_url, license, gbif_occurrence_key)
VALUES (%(scientific_name)s, %(sort_order)s, %(image_url)s, %(license)s, %(gbif_occurrence_key)s)
ON CONFLICT (scientific_name, sort_order) DO UPDATE SET
    image_url = EXCLUDED.image_url,
    license = EXCLUDED.license,
    gbif_occurrence_key = EXCLUDED.gbif_occurrence_key
"""


def main() -> None:
    data = json.loads(SOURCE_JSON.read_text(encoding="utf-8"))

    species_rows = [
        {
            "scientific_name": s["scientificName"],
            "common_name": s["commonName"],
            "taxon_order": s["order"],
            "gbif_usage_key": s["gbifUsageKey"],
            "iucn_status": s["iucnStatus"],
            "observation_count": s["observationCount"],
            "source_url": s["sourceUrl"],
        }
        for s in data["species"]
    ]
    image_rows = [
        {
            "scientific_name": s["scientificName"],
            "sort_order": i + 1,
            "image_url": image["url"],
            "license": image["license"],
            "gbif_occurrence_key": image["occurrenceKey"],
        }
        for s in data["species"]
        for i, image in enumerate(s["images"])
    ]

    init_schema()
    with psycopg.connect(DATABASE_URL) as connection:
        with connection.cursor() as cursor:
            cursor.executemany(UPSERT_SPECIES, species_rows)
            cursor.executemany(UPSERT_IMAGE, image_rows)
        connection.commit()
        species_count = connection.execute("SELECT COUNT(*) FROM species").fetchone()[0]
        image_count = connection.execute("SELECT COUNT(*) FROM species_images").fetchone()[0]
        print(
            f"Upserted {len(species_rows)} species / {len(image_rows)} images; "
            f"table now holds {species_count} species, {image_count} images"
        )


if __name__ == "__main__":
    main()
