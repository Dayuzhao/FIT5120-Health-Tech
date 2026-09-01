const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

const DAY_ORDER = [
  ['mon', 'Monday'],
  ['tue', 'Tuesday'],
  ['wed', 'Wednesday'],
  ['thu', 'Thursday'],
  ['fri', 'Friday'],
  ['sat', 'Saturday'],
  ['sun', 'Sunday'],
]

function normalise(value) {
  return String(value ?? '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, ' ')
}

function normalisePostcode(value) {
  return normalise(value).replace(/\s/g, '')
}

export function formatHours(hours) {
  if (!hours || typeof hours !== 'object') {
    return ''
  }

  return DAY_ORDER
    .filter(([key]) => hours[key])
    .map(([key, label]) => `${label}: ${hours[key]}`)
    .join(' · ')
}

export function getServiceDistanceLabel(distanceKm) {
  if (!Number.isFinite(distanceKm)) {
    return ''
  }

  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} m`
  }

  return `${distanceKm.toFixed(1)} km`
}

export function formatService(service) {
  return {
    ...service,
    distanceKm: service.distance_km,
    distanceLabel: getServiceDistanceLabel(service.distance_km),
    openingHours: formatHours(service.hours),
  }
}

async function fetchJson(path) {
  const response = await fetch(`${API_BASE_URL}${path}`)
  if (!response.ok) {
    throw new Error(`Request to ${path} failed with status ${response.status}`)
  }
  return response.json()
}

// A suburb name or postcode can resolve to several suburb centroids that
// share the same postcode (e.g. some CBD-adjacent postcodes), so geocode
// returns a list; the caller measures distance to the nearest of them.
async function geocodeQuery(query) {
  const { matches } = await fetchJson(`/api/v1/geocode?q=${encodeURIComponent(query)}`)
  return matches
}

export async function searchServices(query) {
  const trimmed = query.trim()

  if (!trimmed) {
    return { mode: 'exact', locationMatches: [], results: [] }
  }

  const locationMatches = await geocodeQuery(trimmed)

  if (locationMatches.length > 0) {
    const near = locationMatches.map((match) => `${match.lat}:${match.lon}`).join(',')
    const { results } = await fetchJson(`/api/v1/services?near=${encodeURIComponent(near)}`)
    return { mode: 'distance', locationMatches, results }
  }

  const params = new URLSearchParams({
    suburb: normalise(trimmed),
    postcode: normalisePostcode(trimmed),
  })
  const { results } = await fetchJson(`/api/v1/services?${params.toString()}`)
  return { mode: 'exact', locationMatches: [], results }
}
