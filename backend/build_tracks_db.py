"""Load tracks.json (produced by data-pipeline/src/build-jamendo.js) into the
`tracks` table, so GET /api/v1/tracks (see main.py) serves the
Epic 6 / US6 background-music player from the hosted database instead of a
committed JSON file.

Re-runnable at any time: upserts on jamendo_id, then deletes any row whose
jamendo_id is no longer in the source JSON — a full sync, not an append-only
upsert. This matters whenever the calming-tag list in build-jamendo.js
changes (e.g. swapping a whole category out): without the delete step, tracks
from a dropped tag would linger in the table forever as zombie rows.

    python build_tracks_db.py
"""

from __future__ import annotations

import json
from pathlib import Path

import psycopg

from db import DATABASE_URL, init_schema

BASE_DIR = Path(__file__).resolve().parent
SOURCE_JSON = BASE_DIR.parent / "data-pipeline" / "output" / "tracks.json"

UPSERT = """
INSERT INTO tracks (
    jamendo_id, name, artist_name, album_name, album_image_url, audio_url,
    duration_seconds, license_url, license_cc_nc, license_cc_nd, license_cc_sa,
    genres, matched_tag, share_url
)
VALUES (
    %(jamendo_id)s, %(name)s, %(artist_name)s, %(album_name)s, %(album_image_url)s, %(audio_url)s,
    %(duration_seconds)s, %(license_url)s, %(license_cc_nc)s, %(license_cc_nd)s, %(license_cc_sa)s,
    %(genres)s, %(matched_tag)s, %(share_url)s
)
ON CONFLICT (jamendo_id) DO UPDATE SET
    name = EXCLUDED.name,
    artist_name = EXCLUDED.artist_name,
    album_name = EXCLUDED.album_name,
    album_image_url = EXCLUDED.album_image_url,
    audio_url = EXCLUDED.audio_url,
    duration_seconds = EXCLUDED.duration_seconds,
    license_url = EXCLUDED.license_url,
    license_cc_nc = EXCLUDED.license_cc_nc,
    license_cc_nd = EXCLUDED.license_cc_nd,
    license_cc_sa = EXCLUDED.license_cc_sa,
    genres = EXCLUDED.genres,
    matched_tag = EXCLUDED.matched_tag,
    share_url = EXCLUDED.share_url
"""


def main() -> None:
    data = json.loads(SOURCE_JSON.read_text(encoding="utf-8"))

    rows = [
        {
            "jamendo_id": t["jamendoId"],
            "name": t["name"],
            "artist_name": t["artistName"],
            "album_name": t["albumName"],
            "album_image_url": t["albumImageUrl"],
            "audio_url": t["audioUrl"],
            "duration_seconds": t["durationSeconds"],
            "license_url": t["licenseUrl"],
            "license_cc_nc": t["licenseNonCommercial"],
            "license_cc_nd": t["licenseNoDerivatives"],
            "license_cc_sa": t["licenseShareAlike"],
            "genres": t["genres"],
            "matched_tag": t["matchedTag"],
            "share_url": t["shareUrl"],
        }
        for t in data["tracks"]
    ]

    current_ids = [row["jamendo_id"] for row in rows]

    init_schema()
    with psycopg.connect(DATABASE_URL) as connection:
        with connection.cursor() as cursor:
            cursor.executemany(UPSERT, rows)
            deleted = cursor.execute(
                "DELETE FROM tracks WHERE jamendo_id != ALL(%s)", (current_ids,)
            ).rowcount
        connection.commit()
        count = connection.execute("SELECT COUNT(*) FROM tracks").fetchone()[0]
        print(
            f"Upserted {len(rows)} tracks, removed {deleted} stale rows; "
            f"tracks table now holds {count} rows"
        )


if __name__ == "__main__":
    main()
