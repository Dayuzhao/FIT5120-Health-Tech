"""Load the hand-picked photo focus points into species_images.focus_x / focus_y.

Source: data-pipeline/curated/species-focus.json. Kept separate from
build_species_db.py on purpose: it only touches those two columns, so it can be
re-run on its own without species.json and without re-upserting any other data.

The curated file is the single source of truth: every focus is cleared first and
then re-applied, so deleting an entry from the file puts that photo back to a
centred crop.

    python build_species_focus_db.py
"""

from __future__ import annotations

import json
from pathlib import Path

import psycopg

from db import DATABASE_URL, init_schema

FOCUS_JSON = Path(__file__).resolve().parent.parent / "data-pipeline" / "curated" / "species-focus.json"

# Only the primary image (sort_order 1) is shown, so only it carries a focus point.
CLEAR_FOCUS = "UPDATE species_images SET focus_x = NULL, focus_y = NULL WHERE sort_order = 1"
SET_FOCUS = """
UPDATE species_images SET focus_x = %(x)s, focus_y = %(y)s
WHERE scientific_name = %(scientific_name)s AND sort_order = 1
"""


def main() -> None:
    focus = json.loads(FOCUS_JSON.read_text(encoding="utf-8"))["focus"]
    rows = []
    for scientific_name, point in focus.items():
        if not (0 <= point["x"] <= 100 and 0 <= point["y"] <= 100):
            raise SystemExit(f"{scientific_name}: x and y must be between 0 and 100")
        rows.append({"scientific_name": scientific_name, "x": point["x"], "y": point["y"]})

    init_schema()
    with psycopg.connect(DATABASE_URL) as connection:
        with connection.cursor() as cursor:
            cursor.execute(CLEAR_FOCUS)
            for row in rows:
                cursor.execute(SET_FOCUS, row)
                # One row per species is expected; anything else means a typo in the name.
                if cursor.rowcount != 1:
                    raise SystemExit(f"{row['scientific_name']}: no primary image found, nothing updated")
        connection.commit()
        set_count = connection.execute(
            "SELECT COUNT(*) FROM species_images WHERE sort_order = 1 AND focus_x IS NOT NULL"
        ).fetchone()[0]
    print(f"Applied {len(rows)} focus points; {set_count} primary images now carry one")


if __name__ == "__main__":
    main()
