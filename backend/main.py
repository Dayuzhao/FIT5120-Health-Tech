"""FastAPI service for the public Victorian mental health access snapshot."""

from __future__ import annotations

import io
import json
import logging
import math
import os
import re
import sqlite3
import zipfile
from datetime import datetime, timezone
from pathlib import Path
from threading import Lock
from typing import Any

import pandas as pd
import requests
from apscheduler.schedulers.background import BackgroundScheduler
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware


BASE_DIR = Path(__file__).resolve().parent
CACHE_FILE = BASE_DIR / "data" / "aihw_snapshot.json"
AIHW_CATALOG_URL = os.getenv("AIHW_CATALOG_URL", "")
AIHW_DOWNLOAD_BASE_URL = os.getenv("AIHW_DOWNLOAD_BASE_URL", "https://www.aihw.gov.au")
REFRESH_HOURS = int(os.getenv("AIHW_REFRESH_HOURS", "24"))
REQUEST_TIMEOUT_SECONDS = 20

# --- Epic 2 / US2: NHSD services (SQLite) + live postcode/suburb geocoding ---
NHSD_DB_FILE = BASE_DIR / "data" / "nhsd.sqlite3"
POSTCODEAPI_BASE_URL = os.getenv("POSTCODEAPI_BASE_URL", "https://v0.postcodeapi.com.au")
# Community-compiled AU postcode list (CC BY 4.0); used only to resolve a typed
# suburb NAME to coordinates. postcodeapi.com.au has no suburb-name endpoint,
# only numeric postcode, so that live API alone can't cover suburb-name search.
POSTCODE_SOURCE_URL = os.getenv(
    "POSTCODE_SOURCE_URL", "https://www.matthewproctor.com/Content/postcodes/australian_postcodes.json"
)
POSTCODE_REFRESH_HOURS = int(os.getenv("POSTCODE_REFRESH_HOURS", "24"))
SERVICE_RESULT_LIMIT = 20
EARTH_RADIUS_KM = 6371

logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"))
logger = logging.getLogger(__name__)
cache_lock = Lock()
snapshot: dict[str, Any] = {}

postcode_cache_lock = Lock()
vic_postcodes: list[dict[str, Any]] = []
postcodeapi_result_cache: dict[str, list[dict[str, Any]]] = {}


def load_cached_snapshot() -> dict[str, Any]:
    """Read the last known good snapshot. The endpoint never depends on a network call."""
    try:
        with CACHE_FILE.open("r", encoding="utf-8") as cache_file:
            data = json.load(cache_file)
        if not isinstance(data, dict) or "metrics" not in data:
            raise ValueError("cache does not contain metrics")
        return data
    except (OSError, ValueError, json.JSONDecodeError) as error:
        logger.exception("Unable to read local AIHW cache: %s", error)
        return {
            "dataset": "AIHW mental health service access snapshot",
            "source": "Australian Institute of Health and Welfare",
            "reference_period": "unavailable",
            "geography": "Victoria",
            "updated_at": None,
            "metrics": {},
            "notes": ["The local cache could not be read."],
        }


def latest_result(results: list[dict[str, Any]]) -> dict[str, Any] | None:
    """Choose the newest Medicare mental health data item returned by AIHW."""
    matching = [
        item for item in results
        if str(item.get("title", "")).lower().startswith("medicare mental health services")
    ]
    return max(matching, key=lambda item: str(item.get("resultDate", "")), default=None)


def find_download_url(item: dict[str, Any]) -> str | None:
    """Find a media URL despite small naming differences in AIHW catalog responses."""
    text = json.dumps(item)
    match = re.search(r"(?:https?://[^\"\s]+)?/getmedia/[^\"\s]+", text)
    if not match:
        return None
    url = match.group(0).replace("\\/", "/")
    return url if url.startswith("http") else AIHW_DOWNLOAD_BASE_URL.rstrip("/") + url


def read_tables(download: bytes) -> pd.DataFrame:
    """Read the first useful CSV or Excel table in an AIHW ZIP download."""
    with zipfile.ZipFile(io.BytesIO(download)) as archive:
        candidates = [name for name in archive.namelist() if not name.endswith("/")]
        for name in candidates:
            if name.lower().endswith(".csv"):
                return pd.read_csv(archive.open(name))
            if name.lower().endswith((".xlsx", ".xls")):
                return pd.read_excel(io.BytesIO(archive.read(name)))
    raise ValueError("AIHW download contained no CSV or Excel table")


def refresh_from_aihw() -> None:
    """Attempt a refresh; leave the known-good cache unchanged on every failure."""
    if not AIHW_CATALOG_URL:
        logger.info("AIHW_CATALOG_URL is not configured; retaining local snapshot")
        return

    try:
        results = []
        for page in range(1, 4):
            payload = {
                "enableTagFilter": False,
                "keywords": [],
                "itemsPerPage": 50,
                "filterByCurrentTopic": True,
                "filterByContentType": True,
                "contentType": "data",
                "orderByColumn": "Title ASC",
                "currentNodeId": 72536,
                "page": page,
            }
            response = requests.post(AIHW_CATALOG_URL, json=payload, timeout=REQUEST_TIMEOUT_SECONDS)
            response.raise_for_status()
            results.extend(response.json().get("results", []))
        item = latest_result(results)
        download_url = find_download_url(item or {})
        if not download_url:
            raise ValueError("no latest Medicare mental health download found")
        download = requests.get(download_url, timeout=REQUEST_TIMEOUT_SECONDS)
        download.raise_for_status()
        table = read_tables(download.content)
        refreshed = build_snapshot_from_table(table, item or {})
        with cache_lock:
            CACHE_FILE.write_text(json.dumps(refreshed, indent=2) + "\n", encoding="utf-8")
            snapshot.clear()
            snapshot.update(refreshed)
        logger.info("AIHW snapshot refreshed from %s", download_url)
    except (requests.RequestException, ValueError, KeyError, OSError, zipfile.BadZipFile) as error:
        logger.warning("AIHW refresh failed; retaining local cache: %s", error)


def build_snapshot_from_table(table: pd.DataFrame, item: dict[str, Any]) -> dict[str, Any]:
    """Convert a common AIHW region-by-measure table into the API's small response shape."""
    columns = {str(column).strip().lower(): column for column in table.columns}
    region_column = next((columns[name] for name in columns if "region" in name or "area" in name), None)
    if region_column is None:
        raise ValueError("AIHW table has no region column")

    def number_for(region_words: tuple[str, ...], measure_words: tuple[str, ...]) -> float | None:
        rows = table[table[region_column].astype(str).str.lower().str.contains("|".join(region_words), regex=True)]
        for column_name, original_column in columns.items():
            if any(word in column_name for word in measure_words):
                values = pd.to_numeric(rows[original_column], errors="coerce").dropna()
                if not values.empty:
                    return round(float(values.iloc[0]), 1)
        return None

    metro_psychologists = number_for(("metro", "melbourne"), ("psychologist",))
    regional_psychologists = number_for(("regional", "rural"), ("psychologist",))
    if metro_psychologists is None or regional_psychologists is None:
        raise ValueError("AIHW table did not expose expected psychologist metrics")
    period = item.get("title", "").rsplit(" ", 1)[-1]
    regional_index = round(regional_psychologists / metro_psychologists, 2)
    return {
        "dataset": "AIHW mental health service access snapshot",
        "source": "Australian Institute of Health and Welfare",
        "reference_period": period,
        "geography": "Victoria",
        "updated_at": datetime.now(timezone.utc).date().isoformat(),
        "metrics": {
            "metropolitan_melbourne": {"label": "Metropolitan Melbourne", "psychologists_per_100k": metro_psychologists, "relative_access_index": 1.0},
            "regional_victoria": {"label": "Regional Victoria", "psychologists_per_100k": regional_psychologists, "relative_access_index": regional_index},
        },
        "notes": ["Aggregate public data for onboarding comparison only."],
    }


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    lat1, lon1, lat2, lon2 = (math.radians(v) for v in (lat1, lon1, lat2, lon2))
    d_lat = lat2 - lat1
    d_lon = lon2 - lon1
    a = math.sin(d_lat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(d_lon / 2) ** 2
    return EARTH_RADIUS_KM * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def refresh_vic_postcode_cache() -> None:
    """Refresh the suburb-name -> coordinate lookup from the live Australian Postcodes feed.

    Only used for suburb-NAME geocode queries; numeric postcodes go straight to
    postcodeapi.com.au instead (see geocode()).
    """
    try:
        response = requests.get(POSTCODE_SOURCE_URL, timeout=REQUEST_TIMEOUT_SECONDS)
        response.raise_for_status()
        rows = response.json()
        vic_rows = [
            {
                "suburb": str(row.get("locality", "")).strip().upper(),
                "postcode": str(row.get("postcode", "")).strip(),
                "lat": float(row["lat"]),
                "lon": float(row["long"]),
            }
            for row in rows
            if row.get("state") == "VIC" and row.get("type") == "Delivery Area" and row.get("lat") and row.get("long")
        ]
        with postcode_cache_lock:
            vic_postcodes.clear()
            vic_postcodes.extend(vic_rows)
        logger.info("VIC postcode cache refreshed: %d entries", len(vic_rows))
    except (requests.RequestException, ValueError, KeyError, json.JSONDecodeError) as error:
        logger.warning("Postcode cache refresh failed; retaining previous cache: %s", error)


def geocode_by_postcode(postcode: str) -> list[dict[str, Any]]:
    """Call postcodeapi.com.au for a numeric postcode. Cached in-process (postcodes
    essentially never move) to stay well under its 100 requests/hour limit."""
    if postcode in postcodeapi_result_cache:
        return postcodeapi_result_cache[postcode]

    response = requests.get(f"{POSTCODEAPI_BASE_URL}/suburbs/{postcode}.json", timeout=REQUEST_TIMEOUT_SECONDS)
    response.raise_for_status()
    matches = [
        {
            "suburb": str(item["name"]).strip().upper(),
            "postcode": str(item["postcode"]),
            "lat": item["latitude"],
            "lon": item["longitude"],
        }
        for item in response.json()
        if item.get("name") is not None
    ]
    postcodeapi_result_cache[postcode] = matches
    return matches


def geocode_by_suburb(suburb: str) -> list[dict[str, Any]]:
    with postcode_cache_lock:
        return [entry for entry in vic_postcodes if entry["suburb"] == suburb]


def query_nhsd_connection() -> sqlite3.Connection:
    connection = sqlite3.connect(NHSD_DB_FILE)
    connection.row_factory = sqlite3.Row
    return connection


def service_row_to_dict(row: sqlite3.Row, distance_km: float | None) -> dict[str, Any]:
    return {
        "id": row["id"],
        "name": row["name"],
        "address": row["address"],
        "suburb": row["suburb"],
        "postcode": row["postcode"],
        "state": row["state"],
        "lat": row["lat"],
        "lon": row["lon"],
        "hours": json.loads(row["hours_json"]) if row["hours_json"] else None,
        "distance_km": round(distance_km, 3) if distance_km is not None else None,
    }


app = FastAPI(title="Curbi Access Snapshot API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["GET", "OPTIONS"],
    allow_headers=["*"],
)
scheduler = BackgroundScheduler()


@app.on_event("startup")
def start_scheduler() -> None:
    snapshot.update(load_cached_snapshot())
    refresh_vic_postcode_cache()
    scheduler.add_job(refresh_from_aihw, "interval", hours=REFRESH_HOURS, id="aihw-refresh", replace_existing=True)
    scheduler.add_job(
        refresh_vic_postcode_cache,
        "interval",
        hours=POSTCODE_REFRESH_HOURS,
        id="postcode-refresh",
        replace_existing=True,
    )
    scheduler.start()


@app.on_event("shutdown")
def stop_scheduler() -> None:
    if scheduler.running:
        scheduler.shutdown(wait=False)


@app.get("/api/v1/access-snapshot")
def get_access_snapshot() -> dict[str, Any]:
    with cache_lock:
        if not snapshot:
            snapshot.update(load_cached_snapshot())
        if not snapshot.get("metrics"):
            raise HTTPException(status_code=503, detail="No access snapshot is currently available")
        return snapshot.copy()


@app.get("/api/v1/geocode")
def geocode(q: str) -> dict[str, Any]:
    """Resolve a typed suburb name or postcode to coordinates. Epic 2 / US2 Help Finder."""
    query = q.strip()
    if not query:
        raise HTTPException(status_code=400, detail="q is required")

    try:
        if query.isdigit():
            matches = geocode_by_postcode(query)
        else:
            matches = geocode_by_suburb(query.upper())
    except requests.RequestException as error:
        logger.warning("postcodeapi.com.au lookup failed for %r: %s", query, error)
        raise HTTPException(status_code=502, detail="Postcode lookup service is unavailable") from error

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
    connection = query_nhsd_connection()
    try:
        if near:
            try:
                points = parse_near_points(near)
            except ValueError as error:
                raise HTTPException(status_code=400, detail="near must be lat:lon,lat:lon,...") from error

            rows = connection.execute("SELECT * FROM services").fetchall()
            scored = [
                (row, min(haversine_km(lat, lon, row["lat"], row["lon"]) for lat, lon in points))
                for row in rows
            ]
            scored.sort(key=lambda pair: pair[1])
            results = [service_row_to_dict(row, distance) for row, distance in scored[:limit]]
            mode = "distance"
        elif suburb or postcode:
            rows = connection.execute(
                "SELECT * FROM services WHERE UPPER(suburb) = UPPER(:suburb) OR postcode = :postcode",
                {"suburb": suburb or "", "postcode": (postcode or "").strip()},
            ).fetchall()
            results = [service_row_to_dict(row, None) for row in rows]
            mode = "exact"
        else:
            raise HTTPException(status_code=400, detail="Provide suburb/postcode or lat/lon")
    finally:
        connection.close()

    return {"mode": mode, "results": results}


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}