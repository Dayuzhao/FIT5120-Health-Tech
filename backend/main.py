"""FastAPI backend for Curbi: Epic 2 Help Finder + Epic 4 onboarding snapshot.

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


@app.on_event("startup")
def on_startup() -> None:
    pool.open()
    init_schema()


@app.on_event("shutdown")
def on_shutdown() -> None:
    pool.close()


@app.get("/api/v1/regional-access")
def get_regional_access() -> dict[str, Any]:
    """Epic 4 / US4 onboarding snapshot: a fixed regional-Victoria-vs-metro-Melbourne
    comparison of Medicare mental health service access for the latest financial
    year. The same for every user; no location is asked for or used."""
    with connection() as conn:
        with conn.cursor(row_factory=dict_row) as cursor:
            rows = cursor.execute(
                "SELECT financial_year, metric, metro, regional, gap_pct, source, source_url "
                "FROM regional_access "
                "WHERE financial_year = (SELECT MAX(financial_year) FROM regional_access)"
            ).fetchall()

    if not rows:
        raise HTTPException(status_code=503, detail="No regional access snapshot is available")

    return {
        "financialYear": rows[0]["financial_year"],
        "source": rows[0]["source"],
        "sourceUrl": rows[0]["source_url"],
        "metrics": {
            row["metric"]: {
                "metro": row["metro"],
                "regional": row["regional"],
                "gapPct": row["gap_pct"],
            }
            for row in rows
        },
    }


@app.get("/api/v1/geocode")
def geocode(q: str) -> dict[str, Any]:
    """Resolve a typed suburb name or postcode to coordinates via the `postcodes`
    table. A postcode can cover several suburb centroids, so this returns a list.
    Epic 2 / US2 Help Finder."""
    query = q.strip()
    if not query:
        raise HTTPException(status_code=400, detail="q is required")

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
                scored = [
                    (row, min(haversine_km(lat, lon, row["lat"], row["lon"]) for lat, lon in points))
                    for row in rows
                ]
                scored.sort(key=lambda pair: pair[1])
                results = [service_row_to_dict(row, distance) for row, distance in scored[:limit]]
                mode = "distance"
            elif suburb or postcode:
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
