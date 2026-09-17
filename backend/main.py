"""FastAPI backend for Curbi.

Every data-driven response is read from the hosted PostgreSQL database in real
time (see db.py) — nothing is served from a file committed to the repo.
"""

from __future__ import annotations

import math
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from psycopg.rows import dict_row

from db import connection, init_schema, pool

SERVICE_RESULT_LIMIT = 20
EARTH_RADIUS_KM = 6371


# Calculates the distance in km between two lat/lon points.
def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    lat1, lon1, lat2, lon2 = (math.radians(v) for v in (lat1, lon1, lat2, lon2))
    d_lat = lat2 - lat1
    d_lon = lon2 - lon1
    a = math.sin(d_lat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(d_lon / 2) ** 2
    return EARTH_RADIUS_KM * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def service_row_to_dict(row: dict[str, Any], distance_km: float | None) -> dict[str, Any]:
    """Shape one `services` row for the API. `hours` is a JSONB column, so psycopg
    already returns it as a dict (or None)."""
    return {
        "id": row["id"],
        "name": row["name"],
        "address": row["address"],
        "suburb": row["suburb"],
        "postcode": row["postcode"],
        "state": row["state"],
        "lat": row["lat"],
        "lon": row["lon"],
        "hours": row["hours"],
        "distance_km": round(distance_km, 3) if distance_km is not None else None,
    }


app = FastAPI(title="Curbi API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["GET", "OPTIONS"],
    allow_headers=["*"],
)


# Runs when the server starts.
@app.on_event("startup")
def on_startup() -> None:
    pool.open()
    init_schema()


# Runs when the server stops.
@app.on_event("shutdown")
def on_shutdown() -> None:
    pool.close()


@app.get("/api/v1/tracks")
def get_tracks() -> dict[str, Any]:
    """Epic 6 / US6 background-music playlist."""
    with connection() as conn:
        with conn.cursor(row_factory=dict_row) as cursor:
            rows = cursor.execute(
                "SELECT jamendo_id, name, artist_name, album_name, album_image_url, "
                "audio_url, duration_seconds, license_url, license_cc_nc, license_cc_nd, "
                "license_cc_sa, genres, matched_tag, share_url FROM tracks ORDER BY name"
            ).fetchall()

    return {
        "tracks": [
            {
                "jamendoId": row["jamendo_id"],
                "name": row["name"],
                "artistName": row["artist_name"],
                "albumName": row["album_name"],
                "albumImageUrl": row["album_image_url"],
                "audioUrl": row["audio_url"],
                "durationSeconds": row["duration_seconds"],
                "licenseUrl": row["license_url"],
                "licenseNonCommercial": row["license_cc_nc"],
                "licenseNoDerivatives": row["license_cc_nd"],
                "licenseShareAlike": row["license_cc_sa"],
                "genres": row["genres"],
                "matchedTag": row["matched_tag"],
                "shareUrl": row["share_url"],
            }
            for row in rows
        ]
    }


@app.get("/api/v1/geocode")
def geocode(q: str) -> dict[str, Any]:
    """Resolve a typed suburb name or postcode to coordinates via the `postcodes`
    table. A postcode can cover several suburb centroids, so this returns a list.
    Epic 2 / US2 Help Finder."""
    query = q.strip()
    if not query:
        raise HTTPException(status_code=400, detail="q is required")

    # Digits = postcode search, otherwise = suburb name search.
    if query.isdigit():
        sql = "SELECT suburb, postcode, lat, lon FROM postcodes WHERE postcode = %s ORDER BY suburb"
        param = query
    else:
        sql = "SELECT suburb, postcode, lat, lon FROM postcodes WHERE suburb = %s ORDER BY postcode"
        param = query.upper()

    with connection() as conn:
        with conn.cursor(row_factory=dict_row) as cursor:
            matches = cursor.execute(sql, (param,)).fetchall()

    return {"query": query, "matches": matches}


def parse_near_points(near: str) -> list[tuple[float, float]]:
    """Parse "lat1:lon1,lat2:lon2,..." — a geocode query can resolve to several
    suburb centroids sharing one postcode, so distance is measured to the nearest of them."""
    points = []
    for pair in near.split(","):
        # Splits "lat:lon" into separate lat and lon strings.
        lat_str, _, lon_str = pair.partition(":")
        points.append((float(lat_str), float(lon_str)))
    return points


@app.get("/api/v1/services")
def get_services(
    suburb: str | None = None,
    postcode: str | None = None,
    near: str | None = None,
    limit: int = SERVICE_RESULT_LIMIT,
) -> dict[str, Any]:
    """Nearby-by-distance (near=lat:lon,...) or exact suburb/postcode match. Epic 2 / US2 Help Finder."""
    columns = "id, name, address, suburb, postcode, state, lat, lon, hours"

    with connection() as conn:
        with conn.cursor(row_factory=dict_row) as cursor:
            if near:
                try:
                    points = parse_near_points(near)
                except ValueError as error:
                    raise HTTPException(status_code=400, detail="near must be lat:lon,lat:lon,...") from error

                # ~1,300 VIC rows — small enough to sort by haversine in Python
                # and avoid a PostGIS dependency.
                rows = cursor.execute(f"SELECT {columns} FROM services").fetchall()
                # Distance from each service to the nearest of the given points.
                scored = [
                    (row, min(haversine_km(lat, lon, row["lat"], row["lon"]) for lat, lon in points))
                    for row in rows
                ]
                scored.sort(key=lambda pair: pair[1])  # nearest first
                results = [service_row_to_dict(row, distance) for row, distance in scored[:limit]]
                mode = "distance"
            elif suburb or postcode:
                # Matches on suburb OR postcode, whichever was provided.
                rows = cursor.execute(
                    f"SELECT {columns} FROM services "
                    "WHERE UPPER(suburb) = UPPER(%(suburb)s) OR postcode = %(postcode)s",
                    {"suburb": suburb or "", "postcode": (postcode or "").strip()},
                ).fetchall()
                results = [service_row_to_dict(row, None) for row in rows]
                mode = "exact"
            else:
                raise HTTPException(status_code=400, detail="Provide suburb/postcode or lat/lon")

    return {"mode": mode, "results": results}


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
