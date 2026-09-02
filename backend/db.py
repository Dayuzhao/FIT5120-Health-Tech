"""Shared PostgreSQL access for the Curbi backend.

The unit requires open data to be served from a hosted relational database read in
real time, not from a JSON file committed to the repo. `main.py` and the two
loader scripts (`build_nhsd_db.py`, `build_postcodes_db.py`) all go through here so
there is one connection string and one schema definition.
"""

from __future__ import annotations

import os
from contextlib import contextmanager
from pathlib import Path
from typing import Iterator

import psycopg
from dotenv import load_dotenv
from psycopg_pool import ConnectionPool

load_dotenv(Path(__file__).resolve().parent / ".env")

# Local dev default; in deployment DATABASE_URL points at the hosted AWS RDS
# instance. Kept out of the repo — see .env.example.
DATABASE_URL = os.getenv(
    "DATABASE_URL", "postgresql://curbi:curbi@localhost:5432/curbi"
)

# UPPER(suburb) index because the exact-match query in main.py compares
# case-insensitively; NHSD suburbs happen to arrive upper-case but the source
# script does not force it.
SCHEMA = """
CREATE TABLE IF NOT EXISTS services (
    id        TEXT PRIMARY KEY,
    name      TEXT NOT NULL,
    address   TEXT,
    suburb    TEXT NOT NULL,
    postcode  TEXT NOT NULL,
    state     TEXT NOT NULL,
    lat       DOUBLE PRECISION NOT NULL,
    lon       DOUBLE PRECISION NOT NULL,
    hours     JSONB
);
CREATE INDEX IF NOT EXISTS idx_services_suburb ON services (UPPER(suburb));
CREATE INDEX IF NOT EXISTS idx_services_postcode ON services (postcode);

CREATE TABLE IF NOT EXISTS postcodes (
    postcode  TEXT NOT NULL,
    suburb    TEXT NOT NULL,
    lat       DOUBLE PRECISION NOT NULL,
    lon       DOUBLE PRECISION NOT NULL,
    PRIMARY KEY (postcode, suburb)
);
CREATE INDEX IF NOT EXISTS idx_postcodes_suburb ON postcodes (suburb);

-- Epic 4 / US4 onboarding snapshot: one row per (financial year, measure), so a
-- new AIHW release just adds rows. AC1 uses serviceRatePer1000; patientRatePer1000
-- is loaded too since build-aihw.js already computes it.
CREATE TABLE IF NOT EXISTS regional_access (
    financial_year  TEXT NOT NULL,
    metric          TEXT NOT NULL,
    metro           DOUBLE PRECISION NOT NULL,
    regional        DOUBLE PRECISION NOT NULL,
    gap_pct         DOUBLE PRECISION,
    source          TEXT NOT NULL,
    source_url      TEXT,
    PRIMARY KEY (financial_year, metric)
);
"""

# Small pool: the endpoints are sync `def`, RDS db.t4g.micro allows ~80
# connections, and a demo needs almost none.
pool = ConnectionPool(DATABASE_URL, min_size=1, max_size=5, open=False)


def init_schema() -> None:
    """Create the tables if they do not exist. Safe to call on every startup and
    from either loader — plain CREATE TABLE IF NOT EXISTS, no migration tool."""
    with psycopg.connect(DATABASE_URL) as connection:
        connection.execute(SCHEMA)


@contextmanager
def connection() -> Iterator[psycopg.Connection]:
    """Borrow a pooled connection for the duration of a request."""
    with pool.connection() as conn:
        yield conn
